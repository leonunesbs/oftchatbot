use axum::extract::Request;
use axum::http::HeaderName;
use axum::middleware::{self, Next};
use axum::response::Response;
use axum::routing::{get, post};
use axum::Router;
use tower_http::request_id::{MakeRequestUuid, PropagateRequestIdLayer, SetRequestIdLayer};
use tower_http::trace::TraceLayer;

use crate::app_state::AppState;

pub fn router(state: AppState) -> Router {
    let request_id_header = HeaderName::from_static("x-request-id");
    Router::new()
        .route("/healthz", get(handlers::healthz))
        .route("/readyz", get(handlers::readyz))
        .route("/v1/auth/session", get(handlers::auth_session))
        .route("/v1/booking/locations", get(handlers::booking_locations))
        .route("/v1/booking/options", get(handlers::booking_options))
        .route("/v1/booking/confirm", post(handlers::booking_confirm))
        .route("/v1/appointments/cancel", post(handlers::appointment_cancel))
        .route("/v1/payments/webhooks/stripe", post(handlers::stripe_webhook))
        // Compatibility aliases used by oftagenda during migration cutover.
        .route("/api/booking/locations", get(handlers::booking_locations))
        .route("/api/booking/options", get(handlers::booking_options))
        .route("/api/booking/confirm", post(handlers::booking_confirm))
        .route("/api/appointments/cancel", post(handlers::appointment_cancel))
        .route("/api/stripe/webhook", post(handlers::stripe_webhook))
        .route("/v1/internal/metrics", get(handlers::internal_metrics))
        .with_state(state)
        .layer(middleware::from_fn(ensure_json_error_context))
        .layer(TraceLayer::new_for_http())
        .layer(SetRequestIdLayer::new(
            request_id_header.clone(),
            MakeRequestUuid,
        ))
        .layer(PropagateRequestIdLayer::new(request_id_header))
}

async fn ensure_json_error_context(req: Request, next: Next) -> Response {
    next.run(req).await
}

pub mod handlers {
    use axum::extract::{Query, State};
    use axum::http::{HeaderMap, StatusCode};
    use axum::response::IntoResponse;
    use axum::Json;
    use serde::{Deserialize, Serialize};
    use serde_json::json;
    use std::time::{SystemTime, UNIX_EPOCH};
    use tracing::{error, info};

    use crate::app_state::AppState;
    use crate::resilience::with_backoff_delay;
    use tokio::time::sleep;

    #[derive(Debug, Deserialize)]
    pub struct BookingConfirmRequest {
        pub event_type: String,
        pub date: String,
        pub time: String,
    }

    #[derive(Debug, Deserialize)]
    pub struct StripeWebhookRequest {
        pub event_id: String,
        pub event_type: String,
        pub status: String,
        pub checkout_session_id: Option<String>,
        pub payment_intent_id: Option<String>,
    }

    #[derive(Debug, Deserialize)]
    pub struct BookingOptionsQuery {
        eventType: String,
        month: Option<String>,
    }

    #[derive(Debug, Serialize)]
    struct ApiErrorBody {
        code: String,
        message: String,
        details: serde_json::Value,
    }

    pub async fn healthz() -> impl IntoResponse {
        (StatusCode::OK, Json(json!({ "ok": true })))
    }

    pub async fn readyz(State(state): State<AppState>) -> impl IntoResponse {
        let healthy = state.convex.health_probe().await.is_ok();
        if healthy {
            return (StatusCode::OK, Json(json!({ "ok": true, "convex": "connected" })));
        }
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "ok": false, "convex": "unavailable" })),
        )
    }

    pub async fn auth_session(State(state): State<AppState>, headers: HeaderMap) -> impl IntoResponse {
        match state
            .jwt_verifier
            .verify_bearer(headers.get("authorization").and_then(|h| h.to_str().ok()))
            .await
        {
            Ok(claims) => (
                StatusCode::OK,
                Json(json!({
                    "ok": true,
                    "authenticated": true,
                    "subject": claims.sub,
                    "role": claims.role
                })),
            ),
            Err(err) => {
                let body = ApiErrorBody {
                    code: "UNAUTHORIZED".to_string(),
                    message: "Token inválido.".to_string(),
                    details: json!({ "reason": err.to_string() }),
                };
                (StatusCode::UNAUTHORIZED, Json(json!(body)))
            }
        }
    }

    pub async fn booking_confirm(
        State(state): State<AppState>,
        headers: HeaderMap,
        Json(payload): Json<BookingConfirmRequest>,
    ) -> impl IntoResponse {
        if let Err(err) = state
            .jwt_verifier
            .verify_bearer(headers.get("authorization").and_then(|h| h.to_str().ok()))
            .await
        {
            let body = ApiErrorBody {
                code: "UNAUTHORIZED".to_string(),
                message: "Token inválido.".to_string(),
                details: json!({ "reason": err.to_string() }),
            };
            return (StatusCode::UNAUTHORIZED, Json(json!(body)));
        }

        let result = state
            .convex
            .mutation(
                "stripe:confirmInPersonBooking",
                json!({
                    "eventType": payload.event_type,
                    "date": payload.date,
                    "time": payload.time
                }),
            )
            .await;
        match result {
            Ok(_) => (StatusCode::OK, Json(json!({ "ok": true }))),
            Err(err) => {
                error!("booking_confirm failed: {err}");
                let body = ApiErrorBody {
                    code: "BOOKING_CONFIRM_FAILED".to_string(),
                    message: "Falha ao confirmar agendamento.".to_string(),
                    details: json!({ "reason": err.to_string() }),
                };
                (StatusCode::INTERNAL_SERVER_ERROR, Json(json!(body)))
            }
        }
    }

    pub async fn booking_locations(
        State(state): State<AppState>,
        headers: HeaderMap,
    ) -> impl IntoResponse {
        if let Err(err) = state
            .jwt_verifier
            .verify_bearer(headers.get("authorization").and_then(|h| h.to_str().ok()))
            .await
        {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "code": "UNAUTHORIZED",
                    "message": "Token inválido.",
                    "details": { "reason": err.to_string() }
                })),
            );
        }

        let call = state
            .convex
            .query("appointments:getActiveBookingEventTypes", json!({}))
            .await;
        match call {
            Ok(value) => (StatusCode::OK, Json(json!({ "ok": true, "data": value }))),
            Err(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "code": "BOOKING_LOCATIONS_FAILED",
                    "message": "Falha ao carregar locais de atendimento.",
                    "details": { "reason": err.to_string() }
                })),
            ),
        }
    }

    pub async fn booking_options(
        State(state): State<AppState>,
        headers: HeaderMap,
        Query(query): Query<BookingOptionsQuery>,
    ) -> impl IntoResponse {
        if let Err(err) = state
            .jwt_verifier
            .verify_bearer(headers.get("authorization").and_then(|h| h.to_str().ok()))
            .await
        {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "code": "UNAUTHORIZED",
                    "message": "Token inválido.",
                    "details": { "reason": err.to_string() }
                })),
            );
        }

        let call = state
            .convex
            .query(
                "appointments:getBookingOptionsByEventType",
                json!({ "eventType": query.eventType, "month": query.month }),
            )
            .await;
        match call {
            Ok(value) => (StatusCode::OK, Json(json!({ "ok": true, "data": value }))),
            Err(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "code": "BOOKING_OPTIONS_FAILED",
                    "message": "Falha ao carregar opções de horário.",
                    "details": { "reason": err.to_string() }
                })),
            ),
        }
    }

    pub async fn appointment_cancel(
        State(state): State<AppState>,
        headers: HeaderMap,
    ) -> impl IntoResponse {
        if let Err(err) = state
            .jwt_verifier
            .verify_bearer(headers.get("authorization").and_then(|h| h.to_str().ok()))
            .await
        {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "code": "UNAUTHORIZED",
                    "message": "Token inválido.",
                    "details": { "reason": err.to_string() }
                })),
            );
        }

        let mut attempts = 0;
        loop {
            let response = state
                .convex
                .mutation("appointments:cancelOwnAppointment", json!({}))
                .await;
            match response {
                Ok(value) => return (StatusCode::OK, Json(json!({ "ok": true, "data": value }))),
                Err(err) => {
                    attempts += 1;
                    if attempts >= 3 {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(json!({
                                "code": "APPOINTMENT_CANCEL_FAILED",
                                "message": "Falha ao cancelar consulta.",
                                "details": { "reason": err.to_string(), "attempts": attempts }
                            })),
                        );
                    }
                    sleep(with_backoff_delay(attempts)).await;
                }
            }
        }
    }

    pub async fn stripe_webhook(
        State(state): State<AppState>,
        headers: HeaderMap,
        Json(payload): Json<StripeWebhookRequest>,
    ) -> impl IntoResponse {
        if !validate_internal_signature(&state, &headers) {
            let body = ApiErrorBody {
                code: "INVALID_SIGNATURE".to_string(),
                message: "Assinatura inválida.".to_string(),
                details: json!({}),
            };
            return (StatusCode::UNAUTHORIZED, Json(json!(body)));
        }

        let dedup_key = format!("stripe:{}", payload.event_id);
        {
            let mut set = state.processed_events.write().await;
            if set.contains(&dedup_key) {
                info!("ignored duplicated webhook event");
                return (StatusCode::OK, Json(json!({ "ok": true, "duplicate": true })));
            }
            set.insert(dedup_key);
        }

        let result = state
            .convex
            .mutation(
                "stripe:reconcileStripeEvent",
                json!({
                    "eventId": payload.event_id,
                    "eventType": payload.event_type,
                    "status": payload.status,
                    "checkoutSessionId": payload.checkout_session_id,
                    "paymentIntentId": payload.payment_intent_id,
                    "metadata": {}
                }),
            )
            .await;
        match result {
            Ok(_) => (StatusCode::OK, Json(json!({ "ok": true }))),
            Err(err) => {
                error!("stripe_webhook reconcile failed: {err}");
                let body = ApiErrorBody {
                    code: "WEBHOOK_RECONCILE_FAILED".to_string(),
                    message: "Falha ao processar webhook.".to_string(),
                    details: json!({ "reason": err.to_string() }),
                };
                (StatusCode::INTERNAL_SERVER_ERROR, Json(json!(body)))
            }
        }
    }

    pub async fn internal_metrics(State(state): State<AppState>, headers: HeaderMap) -> impl IntoResponse {
        let api_key = headers
            .get("x-api-key")
            .and_then(|h| h.to_str().ok())
            .unwrap_or_default();
        if api_key != state.config.internal_api_key {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "ok": false, "error": "invalid api key" })),
            );
        }

        let count = state.processed_events.read().await.len();
        (
            StatusCode::OK,
            Json(json!({
                "ok": true,
                "processedWebhookEvents": count,
                "shadowMode": state.config.shadow_mode_enabled,
                "darkLaunch": state.config.dark_launch_enabled,
            })),
        )
    }

    fn validate_internal_signature(state: &AppState, headers: &HeaderMap) -> bool {
        let signature = headers
            .get("x-oft-signature")
            .and_then(|h| h.to_str().ok())
            .unwrap_or_default();
        let timestamp = headers
            .get("x-oft-timestamp")
            .and_then(|h| h.to_str().ok())
            .and_then(|raw| raw.parse::<u64>().ok())
            .unwrap_or_default();

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_or(0, |duration| duration.as_secs());
        if now.saturating_sub(timestamp) > 300 {
            return false;
        }

        // Baseline HMAC placeholder for initial migration. This is upgraded in
        // hardening milestones to include nonce persistence and body digest.
        signature == state.config.webhook_hmac_secret
    }
}

use anyhow::Context;
use axum::Router;
use oftbackend::app_state::AppState;
use oftbackend::config::Config;
use oftbackend::convex_client::ConvexGateway;
use oftbackend::http_api;
use oftbackend::observability;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    observability::init()?;

    dotenvy::from_filename(".env.local").ok();
    dotenvy::dotenv().ok();

    let config = Config::from_env()?;
    let convex = ConvexGateway::new(config.convex_url.clone())
        .await
        .context("failed to initialize ConvexClient")?;
    let state = AppState::new(config, convex);

    let app: Router = http_api::router(state);
    let addr: SocketAddr = "0.0.0.0:8080".parse().context("invalid bind address")?;
    let listener = TcpListener::bind(addr).await.context("bind failed")?;
    info!("oftbackend listening on {}", listener.local_addr()?);

    axum::serve(listener, app).await.context("server error")
}

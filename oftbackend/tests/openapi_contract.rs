use std::fs;

#[test]
fn openapi_contains_critical_paths() {
    let content = fs::read_to_string("openapi.yaml").expect("openapi.yaml must exist");
    for required in [
        "/v1/auth/session",
        "/v1/booking/confirm",
        "/v1/payments/webhooks/stripe",
    ] {
        assert!(
            content.contains(required),
            "missing critical path in OpenAPI: {required}"
        );
    }
}

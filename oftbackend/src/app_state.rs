use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::auth::JwtVerifier;
use crate::config::Config;
use crate::convex_client::ConvexGateway;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub convex: Arc<ConvexGateway>,
    pub jwt_verifier: Arc<JwtVerifier>,
    pub processed_events: Arc<RwLock<HashSet<String>>>,
}

impl AppState {
    pub fn new(config: Config, convex: ConvexGateway) -> Self {
        let jwt_verifier = JwtVerifier::new(
            config.clerk_issuer.clone(),
            config.clerk_audience.clone(),
            config.clerk_jwks_url.clone(),
        );
        Self {
            config,
            convex: Arc::new(convex),
            jwt_verifier: Arc::new(jwt_verifier),
            processed_events: Arc::new(RwLock::new(HashSet::new())),
        }
    }
}

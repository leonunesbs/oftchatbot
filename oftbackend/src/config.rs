use anyhow::{anyhow, Context};
use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub convex_url: String,
    pub clerk_issuer: String,
    pub clerk_audience: String,
    pub clerk_jwks_url: String,
    pub internal_api_key: String,
    pub webhook_hmac_secret: String,
    pub shadow_mode_enabled: bool,
    pub dark_launch_enabled: bool,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            convex_url: get_required("CONVEX_URL")?,
            clerk_issuer: get_required("CLERK_ISSUER")?,
            clerk_audience: get_required("CLERK_AUDIENCE")?,
            clerk_jwks_url: get_required("CLERK_JWKS_URL")?,
            internal_api_key: get_required("OFTBACKEND_INTERNAL_API_KEY")?,
            webhook_hmac_secret: get_required("OFTBACKEND_WEBHOOK_HMAC_SECRET")?,
            shadow_mode_enabled: env::var("OFTBACKEND_SHADOW_MODE")
                .unwrap_or_else(|_| "false".to_string())
                .eq_ignore_ascii_case("true"),
            dark_launch_enabled: env::var("OFTBACKEND_DARK_LAUNCH")
                .unwrap_or_else(|_| "false".to_string())
                .eq_ignore_ascii_case("true"),
        })
    }
}

fn get_required(key: &str) -> anyhow::Result<String> {
    let value = env::var(key).with_context(|| format!("missing env var: {key}"))?;
    if value.trim().is_empty() {
        return Err(anyhow!("env var is empty: {key}"));
    }
    Ok(value)
}

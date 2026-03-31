use anyhow::Context;
use tracing_subscriber::{fmt, EnvFilter};

pub fn init() -> anyhow::Result<()> {
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    fmt()
        .with_env_filter(filter)
        .json()
        .try_init()
        .context("tracing initialization failed")
}

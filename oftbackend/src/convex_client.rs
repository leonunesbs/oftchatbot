use anyhow::Context;
use convex::{ConvexClient, Value};
use serde::Serialize;
use std::collections::BTreeMap;
use tokio::sync::Mutex;

#[derive(Debug)]
pub struct ConvexGateway {
    client: Mutex<ConvexClient>,
}

impl ConvexGateway {
    pub async fn new(convex_url: String) -> anyhow::Result<Self> {
        let client = ConvexClient::new(&convex_url)
            .await
            .context("failed to connect to Convex deployment")?;
        Ok(Self {
            client: Mutex::new(client),
        })
    }

    pub async fn health_probe(&self) -> anyhow::Result<()> {
        let _client = self.client.lock().await;
        // ConvexClient initialization itself validates deployment reachability.
        Ok(())
    }

    pub async fn query<T: Serialize + Send>(&self, function: &str, payload: T) -> anyhow::Result<Value> {
        let value = serde_json::to_value(payload).context("serialize payload failed")?;
        let args = json_to_convex_map(value);
        let mut client = self.client.lock().await;
        let response = client
            .query(function, args)
            .await
            .with_context(|| format!("Convex query failed: {function}"))?;
        Ok(response)
    }

    pub async fn mutation<T: Serialize + Send>(&self, function: &str, payload: T) -> anyhow::Result<Value> {
        let value = serde_json::to_value(payload).context("serialize payload failed")?;
        let args = json_to_convex_map(value);
        let mut client = self.client.lock().await;
        let response = client
            .mutation(function, args)
            .await
            .with_context(|| format!("Convex mutation failed: {function}"))?;
        Ok(response)
    }
}

fn json_to_convex_map(value: serde_json::Value) -> BTreeMap<String, Value> {
    let mut args = BTreeMap::new();
    if let serde_json::Value::Object(map) = value {
        for (key, value) in map {
            args.insert(key, Value::try_from(value).unwrap_or(Value::Null));
        }
    }
    args
}

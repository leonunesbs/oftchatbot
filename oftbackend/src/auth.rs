use anyhow::{anyhow, Context};
use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
    pub nbf: Option<usize>,
    pub iss: String,
    pub aud: Aud,
    pub role: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Aud {
    One(String),
    Many(Vec<String>),
}

#[derive(Clone, Debug, Deserialize)]
struct Jwks {
    keys: Vec<Jwk>,
}

#[derive(Clone, Debug, Deserialize)]
struct Jwk {
    kid: String,
    n: String,
    e: String,
    #[allow(dead_code)]
    alg: Option<String>,
    #[allow(dead_code)]
    kty: Option<String>,
}

#[derive(Clone, Debug)]
pub struct JwtVerifier {
    issuer: String,
    audience: String,
    jwks_url: String,
    client: reqwest::Client,
    cache: Arc<RwLock<HashMap<String, DecodingKey>>>,
}

impl JwtVerifier {
    pub fn new(issuer: String, audience: String, jwks_url: String) -> Self {
        Self {
            issuer,
            audience,
            jwks_url,
            client: reqwest::Client::new(),
            cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn verify_bearer(&self, auth_header: Option<&str>) -> anyhow::Result<Claims> {
        let header = auth_header.ok_or_else(|| anyhow!("missing authorization header"))?;
        let token = header
            .strip_prefix("Bearer ")
            .ok_or_else(|| anyhow!("invalid authorization scheme"))?;
        self.verify(token).await
    }

    pub async fn verify(&self, token: &str) -> anyhow::Result<Claims> {
        let header = decode_header(token).context("jwt header decode failed")?;
        let kid = header.kid.ok_or_else(|| anyhow!("jwt kid missing"))?;

        let key = if let Some(key) = self.cache.read().await.get(&kid).cloned() {
            key
        } else {
            self.refresh_jwks().await?;
            self.cache
                .read()
                .await
                .get(&kid)
                .cloned()
                .ok_or_else(|| anyhow!("kid not found in jwks"))?
        };

        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_issuer(&[self.issuer.clone()]);
        validation.set_audience(&[self.audience.clone()]);
        validation.validate_nbf = true;

        let decoded = decode::<Claims>(token, &key, &validation).context("jwt verify failed")?;
        Ok(decoded.claims)
    }

    async fn refresh_jwks(&self) -> anyhow::Result<()> {
        let response = self
            .client
            .get(&self.jwks_url)
            .send()
            .await
            .context("jwks request failed")?
            .error_for_status()
            .context("jwks response invalid")?;
        let body: Jwks = response.json().await.context("jwks parse failed")?;

        let mut new_map: HashMap<String, DecodingKey> = HashMap::new();
        for jwk in body.keys {
            let key = DecodingKey::from_rsa_components(&jwk.n, &jwk.e).context("invalid jwk key")?;
            new_map.insert(jwk.kid, key);
        }

        let mut cache = self.cache.write().await;
        *cache = new_map;
        Ok(())
    }
}

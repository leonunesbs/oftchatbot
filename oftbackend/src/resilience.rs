use std::time::Duration;

pub fn with_backoff_delay(attempt: u32) -> Duration {
    let capped = attempt.min(6);
    let millis = 100_u64 * (1_u64 << capped);
    Duration::from_millis(millis)
}

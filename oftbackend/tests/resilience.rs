use oftbackend::resilience::with_backoff_delay;
use std::time::Duration;

#[test]
fn backoff_grows_exponentially() {
    assert_eq!(with_backoff_delay(0), Duration::from_millis(100));
    assert_eq!(with_backoff_delay(1), Duration::from_millis(200));
    assert_eq!(with_backoff_delay(2), Duration::from_millis(400));
}

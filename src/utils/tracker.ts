/**
 * 📊 Micro-tracker for user interactions
 * Records actions seamlessly and sends them to the express backend
 */
export function trackUserAction(action: string, details?: any) {
  try {
    const username = localStorage.getItem("wc_predictor_username") || "کاربر مهمان";
    
    // Send asynchronously in a non-blocking way
    fetch("/api/action-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        action,
        details
      })
    }).catch(err => {
      console.debug("Tracker reporting failed:", err);
    });
  } catch (err) {
    console.debug("Tracker failed locally:", err);
  }
}

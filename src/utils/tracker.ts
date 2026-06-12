/**
 * 📊 Micro-tracker for user interactions
 * Records actions seamlessly and sends them to the express backend
 */
export function trackUserAction(action: string, details?: any) {
  try {
    const username = localStorage.getItem("wc_predictor_username") || "کاربر مهمان";
    
    // exact local time (HH:MM:SS) of user's browser
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const exactTime = `${hours}:${minutes}:${seconds}`;

    // Send asynchronously in a non-blocking way
    fetch("/api/action-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        action,
        details,
        exactTime
      })
    }).catch(err => {
      console.debug("Tracker reporting failed:", err);
    });
  } catch (err) {
    console.debug("Tracker failed locally:", err);
  }
}

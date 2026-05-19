import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./student-reading-quest.jsx";
import { initObservability, ErrorBoundary } from "./observability";

initObservability();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{ padding: 24, fontFamily: "system-ui", color: "#fff", background: "#0d0d1a", minHeight: "100vh" }}>
          <h2 style={{ marginTop: 0 }}>Something broke 😬</h2>
          <p style={{ opacity: 0.7 }}>This crash has been reported. You can try to recover:</p>
          <button
            onClick={resetError}
            style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #4a4a6a", background: "#1a1a2e", color: "#fff", cursor: "pointer" }}
          >
            Reload the app
          </button>
        </div>
      )}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// Register Service Worker for caching & offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function(registration) {
      console.log('Service Worker registered:', registration);
    })
    .catch(function(error) {
      console.log('Service Worker registration failed:', error);
    });
}

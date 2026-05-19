import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Split out vendor code so a returning visitor doesn't re-download React
    // every time we ship an app change. Hashed filenames mean Vercel can
    // cache the vendor chunk forever; only the app chunk busts on deploy.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("scheduler")) return "react-vendor";
            return "vendor";
          }
          // Static story library (~190 lines of inline data) lives in its
          // own chunk so deploys that only touch app logic don't bust the
          // library's hashed filename, and the browser can fetch it in
          // parallel with the main app code.
          if (id.includes("/src/storyLibrary")) return "story-library";
        },
      },
    },
    // The remaining warning is the app bundle itself, which stays big until
    // we lazy-load screens. 700kB is a realistic threshold for "still notify
    // me but don't shout about it" while we work on that separately.
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.js"],
  },
});

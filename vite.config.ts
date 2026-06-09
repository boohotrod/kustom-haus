// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
//
// Build target: Node.js server (cPanel Passenger compatible).
// Nitro's `node-server` preset produces `.output/server/index.mjs`, a native
// Node HTTP server that listens on `process.env.PORT`. This replaces the
// previous Cloudflare/fetch-only output that did not work under Passenger.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
  // Force Node server build for self-hosted deploy (cPanel Passenger, PM2, systemd, etc.).
  // Output layout:
  //   .output/server/index.mjs   ← Node entry (listens on PORT)
  //   .output/public/**          ← static client assets (CSS/JS/images)
  nitro: {
    preset: "node-server",
  },
});

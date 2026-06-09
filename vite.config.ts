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

// Force production JSX runtime in SSR + client bundles.
// Symptom this prevents:
//   TypeError: jsxDevRuntimeExports.jsxDEV is not a function
// Cause: when NODE_ENV is not "production" at build time (e.g. cPanel
// running `npm run build` without env), @vitejs/plugin-react emits
// `jsx-dev-runtime` calls into the SSR bundle, but Nitro tree-shakes the
// dev runtime out, leaving an undefined `jsxDEV`. Setting `jsxDev: false`
// forces the production automatic runtime regardless of NODE_ENV, and
// `define` hardens any remaining `process.env.NODE_ENV` checks.
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
  // Force production automatic JSX runtime even when NODE_ENV is unset
  // at build time (e.g. cPanel `npm run build` without env vars).
  // Without this @vitejs/plugin-react emits jsx-dev-runtime calls into the
  // SSR bundle, which Nitro then tree-shakes, producing the runtime error:
  //   TypeError: jsxDevRuntimeExports.jsxDEV is not a function
  react: {
    jsxRuntime: "automatic",
    jsxDev: false,
  },
  vite: {
    esbuild: {
      jsxDev: false,
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  },
});


// cPanel Passenger / generic Node startup wrapper.
//
// cPanel's "Setup Node.js App" expects a single startup file at the app
// root. The actual server is built by Vite + Nitro to
// `.output/server/index.mjs` (Nitro `node-server` preset). That file boots
// a native Node HTTP server listening on `process.env.PORT` (set by
// Passenger).
//
// Build order on the server:
//   1. npm install
//   2. npm run build      → produces .output/
//   3. Restart the cPanel Node.js App (startup file: app.js)
//
// Do NOT edit `.output/` by hand — it is regenerated on every build.
import("./.output/server/index.mjs").catch((err) => {
  console.error("[app.js] Failed to start Node server:", err);
  process.exit(1);
});

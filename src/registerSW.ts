// vite-plugin-pwa handles SW registration automatically via virtual:pwa-register.
// We re-export a thin wrapper so existing call-sites keep working unchanged.

export function registerServiceWorker() {
  // The plugin injects its own <script> for registerSW — nothing manual needed.
  // Keeping this function for backwards-compat; the real registration happens in
  // the auto-generated service-worker produced by Workbox at build time.
  if ('serviceWorker' in navigator) {
    // In dev mode the plugin serves a no-op SW; in production it precaches all
    // build assets so the app works fully offline.
    navigator.serviceWorker.ready.then((registration) => {
      console.log('PWA service worker active:', registration.scope);
    });
  }
}


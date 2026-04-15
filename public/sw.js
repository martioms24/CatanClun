// Catán Clun — Service Worker for Web Push notifications

self.addEventListener("install", (event) => {
  // Activate this SW immediately on first install so pushes work without a reload
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Minimal fetch handler — Chrome/Android require a registered service worker
// with a fetch listener to consider the site a valid installable PWA.
// We do not cache anything; just pass through to the network.
self.addEventListener("fetch", () => {
  // No-op — default browser handling applies.
});

self.addEventListener("push", (event) => {
  let payload = { title: "Catán Clun", body: "Tens una notificació nova" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (_e) {
    // If the payload isn't JSON, fall back to plain text in the body
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: payload.icon || "/web-app-manifest-192x192.png",
    badge: payload.badge || "/web-app-manifest-192x192.png",
    data: { url: payload.url || "/" },
    tag: payload.tag,
    renotify: !!payload.tag,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If the app is already open, focus it and navigate there
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) client.navigate(url);
          return;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

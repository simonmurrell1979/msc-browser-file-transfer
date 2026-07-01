// src/app/workers/service-worker.ts
var serviceWorkerClient = null;
self.addEventListener("install", (event) => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("message", (event) => {
  serviceWorkerClient = event.source;
  logMesage("Message has been received. Pinging back to client.");
});
function logMesage(message) {
  if (serviceWorkerClient == null) {
    return;
  }
  serviceWorkerClient.postMessage({
    type: "LOGMESSAGE" /* LOGMESSAGE */,
    message
  });
}

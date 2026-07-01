import { MessageType } from "../models/messagetype";

declare const self: ServiceWorkerGlobalScope;

let serviceWorkerClient: Client | null = null;

// Install Event
self.addEventListener("install", (event) => {

    // Activate immediately 
    self.skipWaiting();

});

// Activate Event
self.addEventListener("activate", (event) => {

    // Claim clients
    event.waitUntil(self.clients.claim());

});

// Add Message Event
self.addEventListener("message", (event) => {

    // Assign Value
    serviceWorkerClient = event.source as Client;
    // Ping back
    logMesage("Message has been received. Pinging back to client.");

});

// Log Message
function logMesage(message: string) {

    // Check Value
    if (serviceWorkerClient == null) {

        // Exit
        return;

    }
    // Post Message
    serviceWorkerClient.postMessage({
        type: MessageType.LOGMESSAGE,
        message: message
    });
    
}
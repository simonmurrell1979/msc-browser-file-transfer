// API reference
// https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
// Messaging
// https://developer.mozilla.org/en-US/docs/Web/API/Client/postMessage
// https://web.dev/articles/two-way-communication-guide
// Sample Service Worker reference
// https://gomakethings.com/writing-your-first-service-worker-with-vanilla-js/

// Add Install Event
self.addEventListener('install', event => {
    
    // Log Message
    console.log('Service Worker installing.');
    // Skip waiting to activate the Service Worker immediately
    self.skipWaiting();
    
});

// Add Activate Event
self.addEventListener('activate', event => {

    // Log Message
    console.log('Service Worker activating.');

});

// Add Sync Event
self.addEventListener('sync', event => {

    // Log Message
    console.log('Service Worker sync event fired.');

});

// Add Message Event
self.addEventListener('message', event => {

    // Log Message
    console.log('Service Worker received message:', JSON.stringify(event.data));

    // Add Reply
    if (event.data &&
        event.data.type === "MESSAGE") {

        // Log Message
        console.log("Replying...");
        
        // Reply back
        event.source.postMessage({
            type: "REPLY",
            message: "Service worker received your message: " + event.data.message
        });

    }

});
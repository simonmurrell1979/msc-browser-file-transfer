let messageHandler = null;

function addServiceWorkerMessageListener() {

    // Add Listener for Messages from Service Worker
    navigator.serviceWorker.addEventListener("message", event => {

        // Check Value
        if (messageHandler) {

            // Call Message Handler
            messageHandler(event.data);

        }

    });

}

async function initializeServiceWorker(onMessageHandler) {

    // Check Value
    if (!('serviceWorker' in navigator)) {

        // Log Message
        console.log("Service Workers are not supported in this browser.");
        // Exit
        return; 

    }

    try {

        // Assign Message Handler
        messageHandler = onMessageHandler;

        // Register Service Worker
        await navigator.serviceWorker.register("sw.js", 
            {
                type: "module"
            }
        );
        // Wait for Service Worker to be ready
        await navigator.serviceWorker.ready;
        // Add Message Listener
        addServiceWorkerMessageListener();
        // Log Message
        console.log("Service Worker registered and ready.");

    }
    catch (error) {

        // Log Message
        console.log("Failed to register Service Worker: " + error.message);

    }

}

async function sendServiceWorkerMessage(message) {

    // Check Value
    if (!navigator.serviceWorker.controller) {

        // Log Message
        console.log("No active Service Worker to send message to.");
        // Exit
        return;

    }

    // Send Message
    navigator.serviceWorker.controller.postMessage({
        type: "MESSAGE",
        message: message
    });
    // Log Message
    console.log("Sent message to Service Worker.");

}

// Export Functions
export {
    initializeServiceWorker,
    sendServiceWorkerMessage
};


import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class ServiceWorkerCommsService  {

    // Private Variables
    private _messageHandler: ((message: any) => void) | null = null;

    public async initializeServiceWorker(onMessageHandler: (message: any) => void) {

        // Check Value
        if (!("serviceWorker" in navigator)) {

            // Log Message
            console.log("Service Workers are not supported in this browser.");
            // Exit
            return; 

        }

        try {

            // Assign Message Handler
            this._messageHandler = onMessageHandler;

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
        catch (error: any) {

            // Log Message
            console.log("Failed to register Service Worker: " + error.message);

        }

    }

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

    async function sendCommand(message) {

        // Check Value
        if (!navigator.serviceWorker.controller) {

            // Log Message
            console.log("No active Service Worker to send message to.");
            // Exit
            return;

        }
        // Send Message
        navigator.serviceWorker.controller.postMessage(message);

    }

}

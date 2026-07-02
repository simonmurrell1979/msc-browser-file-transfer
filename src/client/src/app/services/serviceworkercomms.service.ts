import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class ServiceWorkerCommsService  {

    async registerWorker(): Promise<void> {

        // Register Service Worker
        await navigator.serviceWorker.register("service-worker.js", { type: "module" });            
        //
        

    }

    async sendTest(): Promise<void> {

        // Check Value
        if (navigator.serviceWorker.controller == null) {

            // Log Message
            console.log("Service Worker is not active.");
            // Exit
            return;

        }
        // Listen for Message
        navigator.serviceWorker.addEventListener("message", (event) => {

            // Log Message
            console.log(`Received message from Service Worker: ${event.data.message}`);

        });
        // Send Message
        navigator.serviceWorker.controller.postMessage({
            type: "TEST"
        });

    }

}

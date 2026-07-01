import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class ServiceWorkerCommsService {

    async registerWorker(): Promise<void> {

        // Register Service Worker
        await navigator.serviceWorker.register("service-worker.js", { type: "module" });            
        //
        

    }

}

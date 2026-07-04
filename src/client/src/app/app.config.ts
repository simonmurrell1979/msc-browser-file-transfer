import { provideHttpClient } from "@angular/common/http";
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideAppInitializer, inject } from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import { ServiceWorkerCommsService } from "./services/serviceworkercomms.service";

export const appConfig: ApplicationConfig = {2
    
    providers: [
        provideBrowserGlobalErrorListeners(), 
        provideRouter(routes), 
        provideHttpClient(),
        provideAppInitializer(() => inject(ServiceWorkerCommsService).initializeServiceWorker((message: any) => console.log("From Service Worker: ", message)))
    ],
    
};

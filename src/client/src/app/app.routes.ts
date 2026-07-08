import { Routes } from "@angular/router";

export const routes: Routes = [
    {
        path: "send",
        loadComponent: () => import("./pages/send/send.component").then((c) => c.SendComponent),
    },
    {
        path: "download",
        loadComponent: () => import("./pages/download/download.component").then((c) => c.DownloadComponent),
    },
    {
        path: "",
        redirectTo: "send",
        pathMatch: "full",
    },
];

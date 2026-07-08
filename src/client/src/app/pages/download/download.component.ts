import { Component, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

@Component({
    selector: "app-download",
    imports: [],
    templateUrl: "./download.component.html",
    styleUrl: "./download.component.css",
})
export class DownloadComponent {

    // Private Variables
    private readonly _route = inject(ActivatedRoute);
    // Protected Variables
    protected readonly guid = this._route.snapshot.paramMap.get("guid") ?? "";
    protected readonly password = window.location.hash.substring(1) ?? "";

    

}

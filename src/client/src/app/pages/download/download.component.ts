import { Component, inject, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { StorageService } from "../../services/storage.service";
import { TransferInfo } from "../../models/transferinfo";

@Component({
    selector: "app-download",
    imports: [],
    templateUrl: "./download.component.html",
    styleUrl: "./download.component.css",
})
export class DownloadComponent {

    // Private Variables
    private readonly _route = inject(ActivatedRoute);
    private readonly _storageService = inject(StorageService);
    // Protected Variables
    protected readonly guid = this._route.snapshot.paramMap.get("guid") ?? "";
    protected readonly password = window.location.hash.substring(1) ?? "";
    protected readonly transferInfo = signal<TransferInfo | null>(null);
    protected readonly statusMessage = signal<string>("");

    async ngOnInit(): Promise<void> {

        try {
            // Get Transfer Information
            this.transferInfo.set(await this._storageService.getTransferInformation(this.guid));

        } 
        catch (error) {

            // Log Error
            console.error("Error fetching transfer information:", error);
            // Set Status Message
            this.statusMessage.set("Error fetching transfer information.");

        }

    }

    protected async onSendFile(): Promise<void> {

        // Get selected file
        const file = this.selectedFile();
        // Check Value
        if (file == null) {

            // Exit
            return;

        }

        try {

            // Load Value
            const pendingUpload = this.pendingUpload();
            // Check Value
            if (pendingUpload) {

                // Resume Upload
                await this._serviceWorkerCommsService.sendCommand({ 
                    type: MessageType.RESUMEUPLOAD, 
                    file: file,
                    uploadId: pendingUpload.uploadId
                });

            }
            else {

                // Resume Upload
                await this._serviceWorkerCommsService.sendCommand({ 
                    type: MessageType.NEWUPLOAD, 
                    file: file
                });

            }

        }
        catch (error) {

            // Log Error
            console.error("Error sending file:", error);

        }

    }

}

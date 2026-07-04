import { Component, ElementRef, inject, signal, viewChild } from "@angular/core";
import { UploadService } from "../../services/upload.service";
import { UploadRecord } from "../../models/uploadrecord";
import { DbService } from "../../services/db.service";
import { ServiceWorkerCommsService } from "../../services/serviceworkercomms.service";
import { MessageType } from "../../models/messagetype";

@Component({
    selector: "app-send",
    imports: [],
    templateUrl: "./send.component.html",
    styleUrl: "./send.component.css",
})
export class SendComponent {

    // Private Variables
    private readonly _uploadService = inject(UploadService);
    private readonly _dbService = inject(DbService);
    private readonly _serviceWorkerCommsService = inject(ServiceWorkerCommsService);
    private readonly _fileInput = viewChild<ElementRef<HTMLInputElement>>("fileInput");
    // Protected Variables
    protected readonly selectedFile = signal<File | null>(null);
    protected readonly pendingUpload = signal<UploadRecord | null>(null);
    protected readonly statusMessages = signal<string[]>([]);

    public async ngOnInit(): Promise<void> {

        // Set Message Handler
        this._serviceWorkerCommsService.setMessageHandler(async (message: any) => this.handleServiceWorkerMessages(message));
        // Find Latest Pending Upload
        const latestUpload = await this._dbService.findLatestUpload();
        // Check Value
        if (latestUpload == null) {

            // Exit
            return;

        }
        // Set Pending Upload
        this.pendingUpload.set(latestUpload);
        // Log Message
        console.log("Latest pending upload found:", latestUpload);

    }

    protected onFileSelected(event: Event): void {

        // Set input
        const input = event.target as HTMLInputElement;
        // Check files are selected
        if (input.files == null || input.files.length === 0) {

            // Exit
            return;

        }
        // Set selected file
        this.selectedFile.set(input.files[0]);

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
            // Clear Pending Upload
            this.pendingUpload.set(null);

        }
        catch (error) {

            // Log Error
            console.error("Error sending file:", error);

        }

    }

    protected onCancelUpload(): void {

        // Assign Value
        const pendingUpload = this.pendingUpload();
        // Check Value
        if (pendingUpload == null) {

            // Exit
            return;

        }

        // Send Cancel Command
        this._serviceWorkerCommsService.sendCommand({ 
            type: MessageType.CANCELUPLOAD, 
            objectKey: pendingUpload.objectKey,
            uploadId: pendingUpload.uploadId
        });

    }

    private handleServiceWorkerMessages(message: any): void {

        // Check Message Type
        switch (message.type) {

            // Log Message
            case MessageType.LOGMESSAGE:

                // Update Status Messages
                this.statusMessages.update(messages => [...messages, message.message]);
                // Exit
                break;

            // Complete / Cancelled Upload
            case MessageType.COMPLETEUPLOAD:
            case MessageType.CANCELLEDUPLOAD:

                // Update Status Messages
                this.statusMessages.update(messages => [...messages, "Upload completed or cancelled"]);
                // Clear Pending Upload
                this.pendingUpload.set(null);
                // Clear Selected File
                this.selectedFile.set(null);
                // Initialize Class
                const fileInputElement = this._fileInput();
                // Clear File Input
                if (fileInputElement) {

                    // Clear File Input Value
                    fileInputElement.nativeElement.value = "";

                }
                // Exit
                break;

            // Unknown Message Type
            default:

                // Log Message
                console.warn("Unknown message type received from Service Worker: ", message);
                // Exit
                break;

        }

    }

}

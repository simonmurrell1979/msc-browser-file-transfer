import { Component, computed, ElementRef, inject, signal, viewChild } from "@angular/core";
import { UploadRecord } from "../../models/uploadrecord";
import { DbService } from "../../services/db.service";
import { ServiceWorkerCommsService } from "../../services/serviceworkercomms.service";
import { MessageType } from "../../models/messagetype";
import { StorageService } from "../../services/storage.service";
import { EncryptionService } from "../../services/encryption.service";
import { UploadService } from "../../services/upload.service";

@Component({
    selector: "app-send",
    imports: [],
    templateUrl: "./send.component.html",
    styleUrl: "./send.component.css",
})
export class SendComponent {

    // Private Variables
    private readonly _dbService = inject(DbService);
    private readonly _serviceWorkerCommsService = inject(ServiceWorkerCommsService);
    private readonly _fileInput = viewChild<ElementRef<HTMLInputElement>>("fileInput");
    private readonly _storageService = inject(StorageService);
    private readonly _encryptionService = inject(EncryptionService);
    private readonly _uploadService = inject(UploadService);
    // Protected Variables
    protected readonly selectedFile = signal<File | null>(null);
    protected readonly pendingUpload = signal<UploadRecord | null>(null);
    protected readonly statusMessage = signal<string | null>(null);
    protected readonly completedObjectKey = signal<string | null>(null);
    protected readonly activeUploadId = signal<string | null>(null);
    protected readonly activeObjectKey = signal<string | null>(null);
    protected readonly progressPartNumber = signal<number | null>(null);
    protected readonly progressTotalParts = signal<number | null>(null);
    protected readonly transferGuid = computed(() => this.completedObjectKey()?.split("/")[0] ?? null);
    protected readonly password = signal<string | null>(null);
    protected readonly shareableLink = computed(() => { return this.buildShareableLink(); });

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

        }
        catch (error) {

            // Log Error
            console.error("Error sending file:", error);

        }

    }

    protected onCancelUpload(): void {

        // Assign Values
        const uploadId = this.pendingUpload()?.uploadId ?? this.activeUploadId();
        const objectKey = this.pendingUpload()?.objectKey ?? this.activeObjectKey();
        // Check Value
        if ((uploadId == null) || 
            (objectKey == null)) {

            // Exit
            return;

        }

        // Send Cancel Command
        this._serviceWorkerCommsService.sendCommand({ 
            type: MessageType.CANCELUPLOAD, 
            objectKey: objectKey,
            uploadId: uploadId
        });

    }

    private clearUploadState(): void {

        // Clear Active Upload ID
        this.activeUploadId.set(null);
        // Clear Active Object Key
        this.activeObjectKey.set(null);
        // Clear Progress Part Number
        this.progressPartNumber.set(null);
        // Clear Progress Total Parts
        this.progressTotalParts.set(null);
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

    }

    private handleServiceWorkerMessages(message: any): void {

        // Check Message Type
        switch (message.type) {

            // Log Message
            case MessageType.LOGMESSAGE:

                // Update Status Message
                this.statusMessage.set(message.message);
                // Exit
                break;

            // Progress Upload
            case MessageType.PROGRESSUPLOAD:

                // Update Status Messages
                this.statusMessage.set("");
                // Assign Values
                this.activeUploadId.set(message.uploadId);
                this.activeObjectKey.set(message.objectKey);
                this.progressPartNumber.set(message.partNumber);
                this.progressTotalParts.set(message.totalParts);
                // Exit
                break;

            // Complete Upload
            case MessageType.COMPLETEUPLOAD:

                // Update Status Messages
                this.statusMessage.set("Upload completed");
                // Set Completed Object Key
                this.completedObjectKey.set(message.objectKey);
                // Set Password
                this.password.set(message.password);
                // Clear Upload State
                this.clearUploadState();
                // Exit
                break;

            // Cancelled Upload
            case MessageType.CANCELLEDUPLOAD:

                // Update Status Messages
                this.statusMessage.set("Upload cancelled");
                // Clear Upload State
                this.clearUploadState();
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

    private buildShareableLink(): string | null {

        // Assign Values
        const transferGuid = this.transferGuid();
        const password = this.password();
        // Check Values
        if ((transferGuid == null) || 
            (password == null)) {

            // Exit
            return null;

        }
        // Return
        return window.location.origin + "/download/" + transferGuid + "#" + password;

    }

}
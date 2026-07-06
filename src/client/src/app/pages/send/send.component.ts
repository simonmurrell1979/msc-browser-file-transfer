import { Component, ElementRef, inject, signal, viewChild } from "@angular/core";
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

    protected async onDownloadFile(): Promise<void> {

        // Assign Value
        const objectKey = this.completedObjectKey();
        // Check Value
        if (objectKey == null) {

            // Exit
            return;

        }

        try {

            // Get Download URL
            const downloadUrl = await this._storageService.getDownloadUrl(objectKey);
            // Download File from R2
            const downloadedFile = await fetch(downloadUrl);
            // Extract bytes
            const downloadedBytes = await downloadedFile.arrayBuffer();
            
            // Get Decryption Key
            const decryptionKey = await this._encryptionService.getDecryptionKey();
            // Initialize Decryption File Parts
            const decryptedFileParts = [];
            // Reset File Position
            let filePosition = 0;
            // Set Encrypted Part Size
            const encryptedPartSize = this._uploadService.partSize + 28;

            // Decrypt File
            while (filePosition < downloadedBytes.byteLength) {

                // Extract Encrypted Part
                const encryptedPart = new Uint8Array(downloadedBytes.slice(filePosition, filePosition + encryptedPartSize));
                // Decrypt Part
                const decryptedPart = await this._encryptionService.decryptFilePart(decryptionKey, encryptedPart);
                // Append Decrypted Part
                decryptedFileParts.push(decryptedPart);
                // Update File Position
                filePosition += encryptedPartSize;

            }

            // Combine Decrypted Parts
            const decryptedFile = new Blob(decryptedFileParts);
            // Create Download Link
            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(decryptedFile);
            downloadLink.download = objectKey.split("/")[1];
            // Click Download Link
            downloadLink.click();

        }
        catch (error: any) {

            // Log Error
            console.error("Error sending file:", error);

        }

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

}

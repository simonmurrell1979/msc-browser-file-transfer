import { Component, computed, ElementRef, inject, signal, viewChild } from "@angular/core";
import { UploadRecord } from "../../models/uploadrecord";
import { DbService } from "../../services/db.service";
import { ServiceWorkerCommsService } from "../../services/serviceworkercomms.service";
import { MessageType } from "../../models/messagetype";
import { Bytes } from "@shie1/bytes";

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
    // Protected Variables
    protected readonly selectedFile = signal<File | null>(null);
    protected readonly pendingUpload = signal<UploadRecord | null>(null);
    protected readonly displayFilename = computed(() => this.selectedFile()?.name ?? this.pendingUpload()?.fileIdentifier?.name ?? "");
    protected readonly reselectedFileMatches = computed(() => this.hasReselectedFile());
    protected readonly statusMessage = signal<string | null>(null);
    protected readonly completedObjectKey = signal<string | null>(null);
    protected readonly activeUploadId = signal<string | null>(null);
    protected readonly activeObjectKey = signal<string | null>(null);
    protected readonly progressPartNumber = signal<number | null>(null);
    protected readonly progressTotalParts = signal<number | null>(null);
    protected readonly transferGuid = computed(() => this.completedObjectKey()?.split("/")[0] ?? null);
    protected readonly password = signal<string | null>(null);
    protected readonly integrityHash = signal<string | null>(null);
    protected readonly shareableLink = computed(() => { return this.buildShareableLink(); });
    protected readonly encodedShareableLink = computed(() => { return encodeURIComponent(this.buildShareableLink() ?? ""); });

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
        // Set shareable link to null
        this.completedObjectKey.set(null);
        this.password.set(null);

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

    public async onCopyLink(): Promise<void> {

        // Get Shareable Link
        const shareableLink = this.shareableLink();
        // Check Value
        if (shareableLink == null) {

            // Exit
            return;

        }
        // Copy to Clipboard
        await navigator.clipboard.writeText(shareableLink);

    }

    public async onSendAnotherFile(): Promise<void> {

        // Reset All States
        this.selectedFile.set(null);
        this.pendingUpload.set(null);
        this.statusMessage.set(null);
        this.completedObjectKey.set(null);
        this.activeUploadId.set(null);
        this.activeObjectKey.set(null);
        this.progressPartNumber.set(0);
        this.progressTotalParts.set(0);
        this.password.set(null);
        this.integrityHash.set(null);
        // Initialize Class
        const fileInputElement = this._fileInput();
        // Clear File Input
        if (fileInputElement) {

            // Clear File Input Value
            fileInputElement.nativeElement.value = "";

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
                // Set Integrity Hash
                this.integrityHash.set(message.integrityHash);
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
                // Clear Selected File
                this.selectedFile.set(null);
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

    private hasReselectedFile(): boolean | null {

        // Assign Values
        const file = this.selectedFile();
        const pendingUpload = this.pendingUpload();
        // Check Values
        if ((file == null) || 
            (pendingUpload == null)) {

            // Exit
            return false;

        }
        // Return
        return file.name === pendingUpload.fileIdentifier.name &&
            file.size === pendingUpload.fileIdentifier.size && 
            file.lastModified === pendingUpload.fileIdentifier.lastModified;

    }

    private buildShareableLink(): string | null {

        // Assign Values
        const transferGuid = this.transferGuid();
        const password = this.password();
        const integrityHash = this.integrityHash();
        // Check Values
        if ((transferGuid == null) || 
            (password == null) || 
            (integrityHash == null)) {

            // Exit
            return null;

        }
        // Return
        return window.location.origin + "/download/" + transferGuid + "#" + password + "." + integrityHash;

    }

    protected readonly buildEmailBody = computed(() => {

        // Assign Value
        const body = "Hello,\n\nI have sent you a file using the File Transfer App. You can download it using the following link:\n\n" + 
            this.shareableLink() + 
            "\n\nAnyone with this link can download the file, so please share it carefully!!\n\nBest regards,\n";
        // Return
        return encodeURIComponent(body);

    });

    protected readonly buildWhatsAppBody = computed(() => {

        // Assign Value
        const body = "*File Transfer*\n\n" + 
            "Hello! I have sent you a file:\n" + 
            "*" + (this.selectedFile()?.name ?? "") + "*\n\n" + 
            "Download it here:\n" +
            this.shareableLink() + 
            "\n\nAnyone with this link can download the file, so please share it carefully!!";
        // Return
        return encodeURIComponent(body);

    });

    // https://github.com/shie1/bytes
    protected formatBytes(fileSize: number): string {

        // Return
        return new Bytes(fileSize,
            'decimal').toString();

    }

}
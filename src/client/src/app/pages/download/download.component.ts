import { Component, inject, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { StorageService } from "../../services/storage.service";
import { TransferInfo } from "../../models/transferinfo";
import { EncryptionService } from "../../services/encryption.service";
import { UploadService } from "../../services/upload.service";
import { Bytes } from '@shie1/bytes';
import { DownloadState } from "../../models/downloadstate";

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
    private readonly _encryptionService = inject(EncryptionService);
    private readonly _uploadService = inject(UploadService);
    // Protected Variables
    protected readonly guid = this._route.snapshot.paramMap.get("guid") ?? "";
    protected readonly password = window.location.hash.substring(1).split(".")[0] ?? "";
    protected readonly integrityHash = window.location.hash.substring(1).split(".")[1] ?? "";
    protected readonly transferInfo = signal<TransferInfo | null>(null);
    protected readonly statusMessage = signal<string>("");
    protected readonly downloadProgress = signal<number>(0);
    protected readonly downloadState = signal<DownloadState>("ready");
    protected readonly showSaveFilePickerIsSupported = typeof (window as any).showSaveFilePicker === "function";

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

    protected async onDownloadFile(): Promise<void> {

        // Get selected file
        const transferInformation = this.transferInfo();
        // Check Value
        if (transferInformation == null) {

            // Set Download State
            this.downloadState.set("failed");
            // Exit
            return;

        }

        // Check Value
        if (this.showSaveFilePickerIsSupported) {
            
            // Download File
            await this.downloadFileWithSaveFilePicker(transferInformation);

        }
        else {

            // Download File Buffered
            await this.downloadFileBuffered(transferInformation);

        }

    }

    private async downloadFileWithSaveFilePicker(transferInformation: TransferInfo): Promise<void> {

        let writableStream: any = null;

        try {

            // https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker

            // Get File Handle
            var fileHandle = await (window as any).showSaveFilePicker({
                suggestedName: transferInformation.Filename
            });
            // Set Download State
            this.downloadState.set("downloading");
            // Create Writable Stream
            writableStream = await fileHandle.createWritable();
            
            // Get Decryption Key
            const decryptionKey = await this._encryptionService.getDecryptionKey(this.password);
            // Set Encrypted Part Size
            const encryptedPartSize = this._uploadService.partSize + 28;
            // Reset File Position
            let filePosition = 0;
            // Set up part hashes array
            const partHashes: string[] = [];

            // Decrypt File
            while (filePosition < transferInformation.Size) {

                // Build Range
                const range = Math.min(filePosition + encryptedPartSize, transferInformation.Size) - 1;
                // Fetch Encrypted Part
                const encryptedPartResponse = await fetch(transferInformation.DownloadUrl, {
                    headers: {
                        "Range": `bytes=${filePosition}-${range}`
                    }
                });
                // Read Encrypted Part
                const encryptedPart = new Uint8Array(await encryptedPartResponse.arrayBuffer());
                // Decrypt Part
                const decryptedPart = await this._encryptionService.decryptFilePart(decryptionKey, encryptedPart);
                // Calculate Hash of Decrypted Part
                const filePartHash = await crypto.subtle.digest("SHA-256", decryptedPart);
                // Add Hash to Array
                partHashes.push(this._encryptionService.encodeBase64(filePartHash));
                // Write Decrypted Part
                await writableStream.write(decryptedPart);
                // Update File Position
                filePosition += encryptedPartSize;

                // Increment Download Progress
                this.downloadProgress.set(Math.min(Math.round((filePosition / transferInformation.Size) * 100), 100));

            }           
            // Calculate Integrity Hash
            const integrityHash = await this._encryptionService.buildIntegrityHash(partHashes);
            // Check Integrity Hash
            if (integrityHash !== this.integrityHash) {

                // Abort Stream
                await writableStream.abort();
                // Set Status Message
                this.statusMessage.set("Integrity hash mismatch. The downloaded file may be corrupted.");
                // Set Download State
                this.downloadState.set("failed");
                // Exit
                return;

            }
            else {

                // Set Status Message
                this.statusMessage.set("File downloaded and verified successfully.");
                // Set Download State
                this.downloadState.set("completed");

            }
            // Close Stream
            await writableStream.close();

        }
        catch (error: any) {

            // Check if Abort Error
            if (error.name === "AbortError") {
                
                // Exit
                return;

            }
            // Check Value
            if (writableStream != null) {

                try {

                    // Abort Stream
                    await writableStream.abort();

                }
                catch (abortError: any) {

                    // Log Error
                    console.error("Error aborting writable stream:", abortError);

                }

            }
            // Log Error
            console.error("Error downloading file:", error);
            // Set Status Message
            this.statusMessage.set("Download failed. The file could not be decrypted.");
            // Set Download State
            this.downloadState.set("ready");

        }

    }

    private async downloadFileBuffered(transferInformation: TransferInfo): Promise<void> {

        // Catering for FireFox / Safari / other non Chromium browsers that do not support the File System Access API

        // Files tested
        // 1. 44kb file - works fine
        // 2. 2mb file - works fine
        // 3. 25mb file - works fine
        // 4. 200mb file - works fine

        try {

            // Initialize Class
            const decryptedParts: BlobPart[] = [];

            // Set Download State
            this.downloadState.set("downloading");
            
            // Get Decryption Key
            const decryptionKey = await this._encryptionService.getDecryptionKey(this.password);
            // Set Encrypted Part Size
            const encryptedPartSize = this._uploadService.partSize + 28;
            // Reset File Position
            let filePosition = 0;
            // Set up part hashes array
            const partHashes: string[] = [];

            // Decrypt File
            while (filePosition < transferInformation.Size) {

                // Build Range
                const range = Math.min(filePosition + encryptedPartSize, transferInformation.Size) - 1;
                // Fetch Encrypted Part
                const encryptedPartResponse = await fetch(transferInformation.DownloadUrl, {
                    headers: {
                        "Range": `bytes=${filePosition}-${range}`
                    }
                });
                // Read Encrypted Part
                const encryptedPart = new Uint8Array(await encryptedPartResponse.arrayBuffer());
                // Decrypt Part
                const decryptedPart = await this._encryptionService.decryptFilePart(decryptionKey, encryptedPart);
                // Calculate Hash of Decrypted Part
                const filePartHash = await crypto.subtle.digest("SHA-256", decryptedPart);
                // Add Hash to Array
                partHashes.push(this._encryptionService.encodeBase64(filePartHash));
                // Add Decrypted Part to Array
                decryptedParts.push(decryptedPart);
                // Update File Position
                filePosition += encryptedPartSize;

                // Increment Download Progress
                this.downloadProgress.set(Math.min(Math.round((filePosition / transferInformation.Size) * 100), 100));

            }           
            // Calculate Integrity Hash
            const integrityHash = await this._encryptionService.buildIntegrityHash(partHashes);
            // Check Integrity Hash
            if (integrityHash !== this.integrityHash) {

                // Set Status Message
                this.statusMessage.set("Integrity hash mismatch. The downloaded file may be corrupted.");
                // Set Download State
                this.downloadState.set("failed");
                // Exit
                return;

            }
            else {

                // Referenced this link as could not remember this off the top of my head.
                // https://coreui.io/answers/how-to-download-a-file-in-javascript/

                // Build Blob
                const blob = new Blob(decryptedParts, { type: "application/octet-stream" });
                // Create Object URL
                const objectUrl = URL.createObjectURL(blob);
                // Create Anchor Element
                const anchor = document.createElement("a");
                // Set Href
                anchor.href = objectUrl;
                // Set Download Attribute
                anchor.download = transferInformation.Filename;
                // Append to Body
                document.body.appendChild(anchor);
                // Trigger Click
                anchor.click();
                // Remove Anchor
                document.body.removeChild(anchor);
                // Revoke Object URL
                URL.revokeObjectURL(objectUrl);

                // Set Status Message
                this.statusMessage.set("File downloaded and verified successfully.");
                // Set Download State
                this.downloadState.set("completed");

            }

        }
        catch (error: any) {

            // Log Error
            console.error("Error downloading file:", error);
            // Set Download State
            this.downloadState.set("ready");

        }

    }

    // https://github.com/shie1/bytes
    protected formatBytes(fileSize: number): string {

        // Return
        return new Bytes(fileSize,
            'decimal').toString();

    }

}

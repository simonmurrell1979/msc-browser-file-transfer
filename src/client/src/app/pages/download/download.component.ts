import { Component, inject, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { StorageService } from "../../services/storage.service";
import { TransferInfo } from "../../models/transferinfo";
import { EncryptionService } from "../../services/encryption.service";
import { UploadService } from "../../services/upload.service";
import { Bytes, fromKibiBytes, fromMegaBytes } from '@shie1/bytes';

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

    protected async onDownloadFile(): Promise<void> {

        // Get selected file
        const transferInformation = this.transferInfo();
        // Check Value
        if (transferInformation == null) {

            // Exit
            return;

        }

        try {

            // https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker

            // Get File Handle
            var fileHandle = await (window as any).showSaveFilePicker({
                suggestedName: transferInformation.Filename
            });
            // Create Writable Stream
            const writableStream = await fileHandle.createWritable();
            
            // Get Decryption Key
            const decryptionKey = await this._encryptionService.getDecryptionKey(this.password);
            // Set Encrypted Part Size
            const encryptedPartSize = this._uploadService.partSize + 28;
            // Reset File Position
            let filePosition = 0;

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
                // Write Decrypted Part
                await writableStream.write(decryptedPart);
                // Update File Position
                filePosition += encryptedPartSize;

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
            // Log Error
            console.error("Error downloading file:", error);

        }

    }

    // https://github.com/shie1/bytes
    protected formatBytes(fileSize: number): string {

        // Return
        return new Bytes(fileSize,
            'decimal').toString();

    }

}

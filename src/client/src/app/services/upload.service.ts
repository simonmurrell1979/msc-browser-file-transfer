import { inject, Injectable } from "@angular/core";
import { StorageService } from "./storage.service";
import { UploadPart } from "../models/uploadpart";
import { DbService } from "./db.service";

@Injectable({ providedIn: "root" })
export class UploadService {

    // Private variables
    private readonly _storageService = inject(StorageService);
    private readonly _dbService = inject(DbService);
    private readonly _partSize = 5 * 1024 * 1024;                   // 5MB

    private logMessage(message: string) {

        // Log Message
        console.log(message);

    }

    public async uploadFile(file: File): Promise<void> {

        // Get Upload Url
        const uploadUrl = await this._storageService.getUploadUrl(file.name);
        // Fetch the upload url and send the file
        const response = await fetch(uploadUrl, {
            method: "PUT",
            body: file
        });
        // Check Response
        if (!response.ok) {

            // Throw Error
            throw new Error(`Failed to upload file: ${response.statusText}`);

        }

    }
    
    private async uploadParts(file: File,
        uploadId: string,
        partSize: number,
        totalParts: number,
        skippedParts: Set<number>,
        uploadedParts: UploadPart[]) {
    
        // Search for each part
        for (let i = 0; i < totalParts; i++) {
    
            // Assign Value
            const partIndex = i + 1;
    
            // Check Value
            if (skippedParts.has(partIndex)) {
    
                // Log Message
                this.logMessage("Skipping part " + partIndex + " as it was already uploaded.");
                // Continue
                continue;
    
            }
    
            // Assign Values
            const fileStart = i * partSize;
            const fileEnd = Math.min(fileStart + partSize, file.size);
            const fileChunk = file.slice(fileStart, fileEnd);
    
            // Generate Multipart Upload URL
            const multipartUploadUrl = await this._storageService.generateMultipartUploadUrl(file.name, uploadId, partIndex);
            
            // Upload to R2
            const uploadPartResponse = await fetch(multipartUploadUrl, {
                method: "PUT",
                body: fileChunk
            });
            // Check Value
            if (!uploadPartResponse.ok) {
    
                // Log Message
                this.logMessage("Failed to upload part " + partIndex + " with status: " + uploadPartResponse.status);
                // Throw Exception
                throw new Error("Failed to upload part " + partIndex);
    
            }
    
            // Assign Value
            const eTag = uploadPartResponse.headers.get("ETag")?.replaceAll('"', "") ?? "";
            // Log Message
            this.logMessage("Part " + partIndex + " uploaded successfully with ETag: " + eTag);
            // Add to Uploaded Parts Array
            uploadedParts.push({
                PartNumber: partIndex,
                ETag: eTag
            });
    
            // Update Record
            await this._dbService.addUploadedPart(uploadId,
                partIndex,
                eTag);
    
        }
    
    }

    public async newUpload(file: File): Promise<void> {

        try {

            // Log Message
            this.logMessage("Uploading file: " + file.name);

            // Initialize Multipart Upload
            const uploadId = await this._storageService.initiateMultipartUpload(file.name, file.type || "application/octet-stream");
            // Check Value
            if (!uploadId) {
            
                // Log Message
                this.logMessage("Failed to initiate multipart upload.");
                // Exit
                return;

            }

            // Calculate Number of Parts
            const totalParts = Math.ceil(file.size / this._partSize);

            // Create Record
            await this._dbService.createUploadRecord(uploadId, file, this._partSize, totalParts);
            // Log Message
            this.logMessage("Created upload record in IndexedDB with Upload ID: " + uploadId);

            // Initialize Parts
            const uploadedParts: UploadPart[] = [];

            try {

                // Upload Parts
                await this.uploadParts(file, uploadId, this._partSize, totalParts, new Set(), uploadedParts);

                // Check Value
                if (uploadedParts.length !== totalParts) {

                    // Log Message
                    this.logMessage("Not all parts were uploaded successfully. Uploaded " + uploadedParts.length + " out of " + totalParts);
                    // Throw Exception
                    throw new Error("Not all parts were uploaded successfully.");

                }
                // Complete Multipart Upload
                await this._storageService.completeMultipartUpload(file.name, uploadId, uploadedParts);

                // Log Message
                this.logMessage("All parts uploaded successfully. Completed multipart upload...");

                // Delete Record
                await this._dbService.deleteUpload(uploadId);
                // Log Message
                this.logMessage("Deleted upload record from IndexedDB for Upload ID: " + uploadId);

            }
            catch (error: any) {

                // Log Message
                this.logMessage("An error occurred during multipart upload: " + error.message);            

                try {

                    // Abort Multipart Upload
                    await this._storageService.abortMultipartUpload(file.name, uploadId);

                    // Delete Record
                    await this._dbService.deleteUpload(uploadId);
                    // Log Message
                    this.logMessage("Deleted upload record from IndexedDB for Upload ID: " + uploadId);

                }
                catch (abortError: any) {

                    // Log Message
                    this.logMessage("Failed to abort multipart upload: " + abortError.message);

                }

            }

        }
        catch (error: any) {

            // Log Message
            this.logMessage("An error occurred while uploading file: " + error.message);

        }

    }

}


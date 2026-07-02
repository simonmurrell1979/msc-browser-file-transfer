import { UploadPart } from "../models/uploadpart";
import { UploadRecord } from "../models/uploadrecord";
import { FileTransferApi } from "./filetransferapi";
import { FileTransferDb } from "./filetransferdb";

export class FileTransferUpload {

    // Private variables
    private readonly _api: FileTransferApi;
    private readonly _db: FileTransferDb;
    private readonly _partSize = 5 * 1024 * 1024;   // 5MB

    constructor(api: FileTransferApi, db: FileTransferDb) {

        // Initialize Classes
        this._api = api;
        this._db = db;

    }

    private logMessage(message: string) {

        // Log Message
        console.log(message);

    }

    public async uploadFile(file: File): Promise<void> {

        // Get Upload Url
        const uploadUrl = await this._api.getUploadUrl(file.name);
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
            const multipartUploadUrl = await this._api.generateMultipartUploadUrl(file.name, uploadId, partIndex);
            
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
            await this._db.addUploadedPart(uploadId,
                partIndex,
                eTag);
    
        }
    
    }

    public async newUpload(file: File): Promise<void> {

        try {

            // Log Message
            this.logMessage("Uploading file: " + file.name);

            // Initialize Multipart Upload
            const uploadId = await this._api.initiateMultipartUpload(file.name, file.type || "application/octet-stream");
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
            await this._db.createUploadRecord(uploadId, file, this._partSize, totalParts);
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
                await this._api.completeMultipartUpload(file.name, uploadId, uploadedParts);

                // Log Message
                this.logMessage("All parts uploaded successfully. Completed multipart upload...");

                // Delete Record
                await this._db.deleteUpload(uploadId);
                // Log Message
                this.logMessage("Deleted upload record from IndexedDB for Upload ID: " + uploadId);

            }
            catch (error: any) {

                // Log Message
                this.logMessage("An error occurred during multipart upload: " + error.message);            

                try {

                    // Abort Multipart Upload
                    await this._api.abortMultipartUpload(file.name, uploadId);

                    // Delete Record
                    await this._db.deleteUpload(uploadId);
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

    public async resumeUpload(file: File,
        existingRecord: UploadRecord): Promise<void> {
    
        try {
    
            // Check Value
            if (file.name !== existingRecord.fileIdentifier.name ||
                file.size !== existingRecord.fileIdentifier.size ||
                file.lastModified !== existingRecord.fileIdentifier.lastModified) {
    
                // Log Message
                this.logMessage("Selected file does not match pending upload. Aborting upload!");
                // Exit
                return;
    
            }
    
            // Log Message
            this.logMessage("Resuming upload for file: " + existingRecord.objectKey);
    
            // Assign Values
            const uploadId = existingRecord.uploadId;
            const partSize = existingRecord.partSize;
            const totalParts = existingRecord.totalParts;
    
            // Load Server Parts
            const serverParts = await this._api.listMultipartUploadParts(existingRecord.objectKey, existingRecord.uploadId);
            // Update Existing Record
            existingRecord.uploadedParts = serverParts;
            // Save Record
            await this._db.saveUpload(existingRecord);
    
            // Initialize Skipped Parts
            const skippedParts = new Set(existingRecord.uploadedParts.map(part => part.PartNumber));
            // Initialize Uploaded Parts
            const uploadedParts = existingRecord.uploadedParts.map(part => ({
                PartNumber: part.PartNumber,
                ETag: part.ETag
            }));
    
            // Log Message
            this.logMessage(skippedParts.size + " out of " + totalParts + " parts already uploaded. Resuming upload...");
    
            try {
    
                // Upload Parts
                await this.uploadParts(file, uploadId, partSize, totalParts, skippedParts, uploadedParts);
    
                // Check Value
                if (uploadedParts.length !== totalParts) {
    
                    // Log Message
                    this.logMessage("Not all parts were uploaded successfully. Uploaded " + uploadedParts.length + " out of " + totalParts);
                    // Throw Exception
                    throw new Error("Not all parts were uploaded successfully.");
    
                }
                // Complete Multipart Upload
                await this._api.completeMultipartUpload(file.name, uploadId, uploadedParts);
                // Log Message
                this.logMessage("All parts uploaded successfully. Completed multipart upload...");
    
                // Delete Record
                await this._db.deleteUpload(uploadId);
                // Log Message
                this.logMessage("Deleted upload record from IndexedDB for Upload ID: " + uploadId);
    
            }
            catch (error: any) {
    
                // Log Message
                this.logMessage("An error occurred during multipart upload: " + error.message);            
    

                try {
    
                    // Abort Multipart Upload
                    await this._api.abortMultipartUpload(file.name, uploadId);
    
                    // Delete Record
                    await this._db.deleteUpload(uploadId);
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


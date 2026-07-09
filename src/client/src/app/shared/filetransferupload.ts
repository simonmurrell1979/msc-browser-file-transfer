import { UploadPart } from "../models/uploadpart";
import { FileTransferApi } from "./filetransferapi";
import { FileTransferEncryption } from "./filetransferencryption";
import { FileTransferDb } from "./filetransferdb";

export class FileTransferUpload {

    // Private variables
    private readonly _api: FileTransferApi;
    private readonly _db: FileTransferDb;
    private readonly _encryption: FileTransferEncryption;
    private readonly _logMessage: (message: string) => void;
    private readonly _onProgress: (uploadId: string, objectKey: string, partNumber: number, totalParts: number) => void;
    private readonly _onComplete: (uploadId: string, objectKey: string, password: string, integrityHash: string) => void;
    private readonly _onCancelled: (uploadId: string, objectKey: string) => void;
    private readonly _partSize = 5 * 1024 * 1024;   // 5MB
    // Public Variables
    public readonly partSize = this._partSize;

    constructor(api: FileTransferApi, 
        db: FileTransferDb, 
        logMessage?: (message: string) => void, 
        onProgress?: (uploadId: string, objectKey: string, partNumber: number, totalParts: number) => void,
        onComplete?: (uploadId: string, objectKey: string, password: string, integrityHash: string) => void, 
        onCancelled?: (uploadId: string, objectKey: string) => void) {

        // Initialize Classes
        this._api = api;
        this._db = db;
        this._encryption = new FileTransferEncryption();
        this._logMessage = logMessage ?? console.log;
        this._onProgress = onProgress ?? (() => {});
        this._onComplete = onComplete ?? (() => {});
        this._onCancelled = onCancelled ?? (() => {});

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
        objectKey: string,
        uploadId: string,
        password: string,
        partSize: number,
        totalParts: number,
        skippedParts: Set<number>,
        uploadedParts: UploadPart[]) {

        // Mock Encryption Key 
        const encryptionKey = await this._encryption.getEncryptionKey(password);
    
        // Search for each part
        for (let i = 0; i < totalParts; i++) {
    
            // Assign Value
            const partIndex = i + 1;
    
            // Check Value
            if (skippedParts.has(partIndex)) {
    
                // Log Message
                this._logMessage("Skipping part " + partIndex + " as it was already uploaded.");
                // Continue
                continue;
    
            }
    
            // Assign Values
            const fileStart = i * partSize;
            const fileEnd = Math.min(fileStart + partSize, file.size);
            const fileChunk = file.slice(fileStart, fileEnd);

            // Encrypt File Chunk
            const chunkBytes = await fileChunk.arrayBuffer();
            // Generate Hash for Original Part
            const filePartHash = await crypto.subtle.digest("SHA-256", chunkBytes);
            // Encrypt File Part
            const encryptedChunk = await this._encryption.encryptFilePart(encryptionKey, chunkBytes);
    
            // Generate Multipart Upload URL
            const multipartUploadUrl = await this._api.generateMultipartUploadUrl(objectKey, uploadId, partIndex);
            
            // Upload to R2
            const uploadPartResponse = await fetch(multipartUploadUrl, {
                method: "PUT",
                body: encryptedChunk
            });
            // Check Value
            if (!uploadPartResponse.ok) {
    
                // Log Message
                this._logMessage("Failed to upload part " + partIndex + " with status: " + uploadPartResponse.status);
                // Throw Exception
                throw new Error("Failed to upload part " + partIndex);
    
            }
    
            // Assign Value
            const eTag = uploadPartResponse.headers.get("ETag")?.replaceAll('"', "") ?? "";
            // Add to Uploaded Parts Array
            uploadedParts.push({
                PartNumber: partIndex,
                ETag: eTag
            });
    
            // Update Record
            await this._db.addUploadedPart(uploadId,
                partIndex,
                eTag,
                this._encryption.encodeBase64(filePartHash));
            // Report Progress
            this._onProgress(uploadId, 
                objectKey,
                partIndex, 
                totalParts);
    
        }
    
    }

    public async newUpload(file: File): Promise<void> {

        try {

            // Log Message
            this._logMessage("Uploading file: " + file.name);

            // Build Object Key
            const objectKey = crypto.randomUUID() + "/" + file.name;
            // Initialize Multipart Upload
            const uploadId = await this._api.initiateMultipartUpload(objectKey, file.type || "application/octet-stream");
            // Check Value
            if (!uploadId) {
            
                // Log Message
                this._logMessage("Failed to initiate multipart upload.");
                // Exit
                return;

            }

            // Calculate Number of Parts
            const totalParts = Math.ceil(file.size / this._partSize);

            // Generate Password
            const password = await this._encryption.generatePassword();
            // Create Record
            await this._db.createUploadRecord(uploadId, objectKey, password, file, this._partSize, totalParts);
            // Log Message
            this._logMessage("Created upload record in IndexedDB with Upload ID: " + uploadId);
            // Report Progress
            this._onProgress(uploadId, 
                objectKey,
                0, 
                totalParts);

            // Initialize Parts
            const uploadedParts: UploadPart[] = [];

            try {

                // Upload Parts
                await this.uploadParts(file, objectKey, uploadId, password, this._partSize, totalParts, new Set(), uploadedParts);

                // Check Value
                if (uploadedParts.length !== totalParts) {

                    // Log Message
                    this._logMessage("Not all parts were uploaded successfully. Uploaded " + uploadedParts.length + " out of " + totalParts);
                    // Throw Exception
                    throw new Error("Not all parts were uploaded successfully.");

                }
                // Complete Multipart Upload    
                await this.completeUpload(objectKey, uploadId, password, uploadedParts);

            }
            catch (error: any) {

                // Log Message
                this._logMessage("An error occurred during multipart upload: " + error.message);            

                // Cancel Multipart Upload
                await this.cancelUpload(objectKey, uploadId);

            }

        }
        catch (error: any) {

            // Log Message
            this._logMessage("An error occurred while uploading file: " + error.message);

        }

    }

    public async resumeUpload(file: File,
        uploadId: string): Promise<void> {
    
        try {
    
            // Get Existing Record
            const existingRecord = await this._db.getUpload(uploadId);
            // Check Value
            if (existingRecord == null) {

                // Log Message
                this._logMessage("No existing upload record found. Aborting upload!");
                // Exit
                return;

            }
            // Check Value
            if (file.name !== existingRecord.fileIdentifier.name ||
                file.size !== existingRecord.fileIdentifier.size ||
                file.lastModified !== existingRecord.fileIdentifier.lastModified) {
    
                // Log Message
                this._logMessage("Selected file does not match pending upload. Aborting upload!");
                // Exit
                return;
    
            }
    
            // Log Message
            this._logMessage("Resuming upload for file: " + existingRecord.objectKey);
    
            // Assign Values
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
            this._logMessage(skippedParts.size + " out of " + totalParts + " parts already uploaded. Resuming upload...");
    
            try {
    
                // Upload Parts
                await this.uploadParts(file, existingRecord.objectKey, uploadId, existingRecord.password, partSize, totalParts, skippedParts, uploadedParts);
    
                // Check Value
                if (uploadedParts.length !== totalParts) {
    
                    // Log Message
                    this._logMessage("Not all parts were uploaded successfully. Uploaded " + uploadedParts.length + " out of " + totalParts);
                    // Throw Exception
                    throw new Error("Not all parts were uploaded successfully.");
    
                }
                
                // Complete Multipart Upload
                await this.completeUpload(existingRecord.objectKey, uploadId, existingRecord.password, uploadedParts);
    
            }
            catch (error: any) {
    
                // Log Message
                this._logMessage("An error occurred during multipart upload: " + error.message);            
    
                // Cancel Multipart Upload
                await this.cancelUpload(existingRecord.objectKey, uploadId);
    
            }
    
        }
        catch (error: any) {
    
            // Log Message
            this._logMessage("An error occurred while uploading file: " + error.message);
    
        }
    
    }

    public async cancelUpload(objectKey: string,
        uploadId: string) {
    
        try {
    
            // Abort Multipart Upload
            await this._api.abortMultipartUpload(objectKey, uploadId);
            // Log Message
            this._logMessage("Aborted multipart upload for Upload ID: " + uploadId);
    
        }
        catch (error: any) {
    
            // Log Message
            this._logMessage("Failed while canceling multipart upload: " + error.message);
    
        }
    
        try {
    
            // Delete Record
            await this._db.deleteUpload(uploadId);
            // Log Message
            this._logMessage("Deleted upload record from IndexedDB for Upload ID: " + uploadId);
    
        }
        catch (error: any) {
    
            // Log Message
            this._logMessage("Failed while deleting record: " + error.message);
    
        }

        // Call _onCancelled callback
        this._onCancelled(uploadId, 
            objectKey);
    
    }
    
    public async completeUpload(objectKey: string,
        uploadId: string,
        password: string,
        uploadedParts: UploadPart[]) {

        // Get Existing Record
        const existingRecord = await this._db.getUpload(uploadId);
        // Check Value
        if (existingRecord == null) {   

            // Throw Exception
            throw new Error("No existing upload record found for Upload ID: " + uploadId);

        }
        // Build out hashes
        const integrityHash = await this._encryption.buildIntegrityHash(existingRecord.originalPartsHashes);
    
        // Complete Multipart Upload
        await this._api.completeMultipartUpload(objectKey, uploadId, uploadedParts);
        // Log Message
        this._logMessage("All parts uploaded successfully. Completed multipart upload...");
    
        // Delete Record
        await this._db.deleteUpload(uploadId);
        // Log Message
        this._logMessage("Deleted upload record from IndexedDB for Upload ID: " + uploadId);

        // Call onComplete callback
        this._onComplete(uploadId, objectKey, password, integrityHash);
    
    }

}


import { inject, Injectable } from "@angular/core";
import { StorageService } from "./storage.service";

@Injectable({ providedIn: "root" })
export class UploadService {

    // Private variables
    private readonly _storageService = inject(StorageService);

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
    
    async function uploadParts(file,
        uploadId,
        partSize,
        totalParts,
        skippedParts,
        uploadedParts) {
    
        // Search for each part
        for (let i = 0; i < totalParts; i++) {
    
            // Assign Value
            var partIndex = i + 1;
    
            // Check Value
            if (skippedParts.has(partIndex)) {
    
                // Log Message
                logMessage("Skipping part " + partIndex + " as it was already uploaded.");
                // Continue
                continue;
    
            }
    
            // Assign Values
            var fileStart = i * partSize;
            var fileEnd = Math.min(fileStart + partSize, file.size);
            var fileChunk = file.slice(fileStart, fileEnd);
    
            // Generate Multipart Upload URL
            const multipartUploadUrl = await postJSON("/GenerateMultipartUploadUrl", {
                ObjectKey: file.name,
                UploadId: uploadId,
                PartNumber: partIndex
            });
            
            // Upload to R2
            const uploadPartResponse = await fetch(multipartUploadUrl, {
                method: "PUT",
                body: fileChunk
            });
            // Check Value
            if (!uploadPartResponse.ok) {
    
                // Log Message
                logMessage("Failed to upload part " + partIndex + " with status: " + uploadPartResponse.status);
                // Throw Exception
                throw new Error("Failed to upload part " + partIndex);
    
            }
    
            // Assign Value
            const eTag = uploadPartResponse.headers.get("ETag").replaceAll('"', "");
            // Log Message
            logMessage("Part " + partIndex + " uploaded successfully with ETag: " + eTag);
            // Add to Uploaded Parts Array
            uploadedParts.push({
                PartNumber: partIndex,
                ETag: eTag
            });
    
            // Update Record
            await addUploadedPart(uploadId,
                partIndex,
                eTag);
    
        }
    
    }

}


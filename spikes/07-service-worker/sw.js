// API reference
// https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
// Messaging
// https://developer.mozilla.org/en-US/docs/Web/API/Client/postMessage
// https://web.dev/articles/two-way-communication-guide
// https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil
// Sample Service Worker reference
// https://gomakethings.com/writing-your-first-service-worker-with-vanilla-js/

// Import API Functions
import {
    abortMultipartUpload,
    completeMultipartUpload,
    generateMultipartUploadUrl,
    initiateMultipartUpload,
    listMultipartUploadParts
} from "./api.js";
// Import Database Functions
import {
    addUploadedPart,
    createUploadRecord,
    deleteUpload,
    getUpload,
    saveUpload
} from "./db.js";
// Import Message Type
import {
    MessageType
} from "./messagetype.js";

let serviceWorkerClient = null;
let uploadInProgress = false;

function logMessage(message) {

    // Check Value
    if (serviceWorkerClient) {

        // Post Message
        serviceWorkerClient.postMessage({
            type: MessageType.LOGMESSAGE,
            message: message
        });

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
        const multipartUploadUrl = await generateMultipartUploadUrl(file.name, uploadId, partIndex);
        
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

async function newUpload(file) {

    try {

        // Log Message
        logMessage("Uploading file: " + file.name);

        // Initialize Multipart Upload
        const uploadId = await initiateMultipartUpload(file.name, file.type);
        // Check Value
        if (!uploadId) {
         
            // Log Message
            logMessage("Failed to initiate multipart upload.");
            // Exit
            return;

        }

        // Assign Value
        const partSize = 5 * 1024 * 1024; // 5MB
        // Calculate Number of Parts
        var totalParts = Math.ceil(file.size / partSize);

        // Create Record
        await createUploadRecord(uploadId, 
            file,
            partSize, 
            totalParts);
        // Log Message
        logMessage("Created upload record in IndexedDB with Upload ID: " + uploadId);

        // Initialize Parts
        const uploadedParts = [];

        try {

            // Upload Parts
            await uploadParts(file,
                uploadId,
                partSize,
                totalParts,
                new Set(),
                uploadedParts);

            // Check Value
            if (uploadedParts.length !== totalParts) {

                // Log Message
                logMessage("Not all parts were uploaded successfully. Uploaded " + uploadedParts.length + " out of " + totalParts);
                // Throw Exception
                throw new Error("Not all parts were uploaded successfully.");

            }

            // Complete Upload
            await completeUpload(file.name, uploadId, uploadedParts);

        }
        catch (error) {

            // Log Message
            logMessage("An error occurred during multipart upload: " + error.message);            

            // Cancel Upload
            await cancelUpload(file.name, uploadId);

        }

    }
    catch (error) {

        // Log Message
        logMessage("An error occurred while uploading file: " + error.message);

    }

}

async function resumeUpload(file,
    uploadId) {

    try {

        // Get Record
        const existingRecord = await getUpload(uploadId);
        // Check Value
        if (!existingRecord) {

            // Log Message
            logMessage("No pending upload found for Upload ID: " + uploadId);
            // Exit
            return;

        }
        // Check Value
        if (file.name !== existingRecord.fileIdentifier.name ||
            file.size !== existingRecord.fileIdentifier.size ||
            file.lastModified !== existingRecord.fileIdentifier.lastModified) {

            // Log Message
            logMessage("Selected file does not match pending upload. Aborting upload!");
            // Exit
            return;

        }

        // Log Message
        logMessage("Resuming upload for file: " + existingRecord.objectKey);

        // Assign Values
        const partSize = existingRecord.partSize;
        const totalParts = existingRecord.totalParts;

        // Load Server Parts
        var serverParts = await listMultipartUploadParts(existingRecord.objectKey, 
            existingRecord.uploadId);
        // Update Existing Record
        existingRecord.uploadedParts = serverParts;
        // Save Record
        await saveUpload(existingRecord);

        // Initialize Skipped Parts
        const skippedParts = new Set(existingRecord.uploadedParts.map(part => part.PartNumber));
        // Initialize Uploaded Parts
        const uploadedParts = existingRecord.uploadedParts.map(part => ({
            PartNumber: part.PartNumber,
            ETag: part.ETag
        }));

        // Log Message
        logMessage(skippedParts.size + " out of " + totalParts + " parts already uploaded. Resuming upload...");

        try {

            // Upload Parts
            await uploadParts(file,
                uploadId,
                partSize,
                totalParts,
                skippedParts,
                uploadedParts);

            // Check Value
            if (uploadedParts.length !== totalParts) {

                // Log Message
                logMessage("Not all parts were uploaded successfully. Uploaded " + uploadedParts.length + " out of " + totalParts);
                // Throw Exception
                throw new Error("Not all parts were uploaded successfully.");

            }

            // Complete Upload
            await completeUpload(file.name, uploadId, uploadedParts);

        }
        catch (error) {

            // Log Message
            logMessage("An error occurred during multipart upload: " + error.message);            

            // Cancel Upload
            await cancelUpload(file.name, uploadId);

        }

    }
    catch (error) {

        // Log Message
        logMessage("An error occurred while uploading file: " + error.message);

    }

}

async function cancelUpload(objectKey,
    uploadId) {

    try {

        // Abort Multipart Upload
        await abortMultipartUpload(objectKey, uploadId);
        // Log Message
        logMessage("Aborted multipart upload for Upload ID: " + uploadId);

    }
    catch (error) {

        // Log Message
        logMessage("Failed while canceling multipart upload: " + error.message);

    }

    try {

        // Delete Record
        await deleteUpload(uploadId);
        // Log Message
        logMessage("Deleted upload record from IndexedDB for Upload ID: " + uploadId);

    }
    catch (error) {

        // Log Message
        logMessage("Failed while deleting record: " + error.message);

    }

}

async function completeUpload(objectKey,
    uploadId,
    uploadedParts) {

    // Complete Multipart Upload
    await completeMultipartUpload(objectKey, uploadId, uploadedParts);
    // Log Message
    logMessage("All parts uploaded successfully. Completed multipart upload...");

    // Delete Record
    await deleteUpload(uploadId);
    // Log Message
    logMessage("Deleted upload record from IndexedDB for Upload ID: " + uploadId);

    // Check Value
    if (serviceWorkerClient) {

        // Complete Upload
        serviceWorkerClient.postMessage({
            type: MessageType.COMPLETEUPLOAD,
            uploadId: uploadId
        });

    }

}

// Add Install Event
self.addEventListener('install', event => {
    
    // Log Message
    console.log('Service Worker installing.');
    // Skip waiting to activate the Service Worker immediately
    self.skipWaiting();
    
});

// Add Activate Event
self.addEventListener('activate', event => {

    // Log Message
    console.log('Service Worker activating.');
    // Claim clients to start controlling pages immediately
    event.waitUntil(self.clients.claim());

});

// Add Message Event
self.addEventListener('message', event => {

    // Assign Value
    serviceWorkerClient = event.source;

    // Assign Value
    const data = event.data;
    // Check Value
    if (!data || !data.type) {

        // Log Message
        logMessage("Received invalid message in Service Worker.");
        // Exit
        return;

    }

    // Check Value
    if (data.type === MessageType.NEWUPLOAD ||
        data.type === MessageType.RESUMEUPLOAD) {
    
        // Check Value
        if (uploadInProgress) {

            // Log Message
            logMessage("An upload is already in progress.");
            // Exit
            return;

        }
        // Assign Value
        uploadInProgress = true;

        // Command Handler
        switch (data.type) {

            case MessageType.NEWUPLOAD:

                // New Upload
                event.waitUntil(newUpload(data.file).finally(() => {

                    // Disable
                    uploadInProgress = false;

                }));
                // Exit
                break; 

            case MessageType.RESUMEUPLOAD:

                // Resume Upload
                event.waitUntil(resumeUpload(data.file, data.uploadId).finally(() => {

                    // Disable
                    uploadInProgress = false;
                    
                }));
                // Exit
                break;

        }

    }
    else if (data.type === MessageType.CANCELUPLOAD) {

        // Cancel Upload
        event.waitUntil(cancelUpload(data.objectKey, data.uploadId));

    }

});
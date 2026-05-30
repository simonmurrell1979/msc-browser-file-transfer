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
    findLatestUpload,
    saveUpload
} from "./db.js";

// Set up variables
const fileUpload = document.getElementById("fileUpload");
const cmdUpload = document.getElementById("cmdUpload");
const cmdCancel = document.getElementById("cmdCancel");
const uploadStatus = document.getElementById("uploadStatus");
let pendingUpload = null;

// Find Latest Upload
const latestUpload = await findLatestUpload();
// Check Value
if (latestUpload) {

    // Assign Value
    pendingUpload = latestUpload;
    // Update Button Text
    cmdUpload.textContent = "Resume Upload";
    // Show Cancel Button
    cmdCancel.style.display = "inline-block";
    // Log Message
    logMessage("Found existing upload with Upload ID: " + latestUpload.uploadId.substring(0, 50) + "... " +
        " (" + latestUpload.uploadedParts.length + " of " + latestUpload.totalParts + " parts uploaded). " +
        "You can resume this upload or select a new file to start a new upload.");

}
else {

    // Log Message
    logMessage("No existing uploads found. Please select a file to upload.");

}

function logMessage(message) {

    // Log Message
    uploadStatus.textContent += message + "\n";

}

// Initialize Service Worker
//await initializeServiceWorker();

// Allow console testing
//window.sendServiceWorkerMessage = sendServiceWorkerMessage;

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

            // Complete Multipart Upload
            await completeMultipartUpload(file.name, uploadId, uploadedParts);

            // Log Message
            logMessage("All parts uploaded successfully. Completed multipart upload...");

            // Delete Record
            await deleteUpload(uploadId);
            // Log Message
            logMessage("Deleted upload record from IndexedDB for Upload ID: " + uploadId);

        }
        catch (error) {

            // Log Message
            logMessage("An error occurred during multipart upload: " + error.message);            

            try {

                // Abort Multipart Upload
                await abortMultipartUpload(file.name, uploadId);
                // Delete Record
                await deleteUpload(uploadId);
                // Log Message
                logMessage("Deleted upload record from IndexedDB for Upload ID: " + uploadId);

            }
            catch (abortError) {

                // Log Message
                logMessage("Failed to abort multipart upload: " + abortError.message);

            }

        }

    }
    catch (error) {

        // Log Message
        logMessage("An error occurred while uploading file: " + error.message);

    }

}

async function resumeUpload(file,
    existingRecord) {

    try {

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
        const uploadId = existingRecord.uploadId;
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
            // Complete Multipart Upload
            await completeMultipartUpload(file.name, uploadId, uploadedParts);

            // Log Message
            logMessage("All parts uploaded successfully. Completed multipart upload...");

            // Delete Record
            await deleteUpload(uploadId);
            // Log Message
            logMessage("Deleted upload record from IndexedDB for Upload ID: " + uploadId);

            // Reset
            pendingUpload = null;
            cmdUpload.textContent = "Upload";
            cmdCancel.style.display = "none";

        }
        catch (error) {

            // Log Message
            logMessage("An error occurred during multipart upload: " + error.message);            

            try {

                // Abort Multipart Upload
                await abortMultipartUpload(file.name, uploadId);
                // Delete Record
                await deleteUpload(uploadId);
                // Log Message
                logMessage("Deleted upload record from IndexedDB for Upload ID: " + uploadId);

            }
            catch (abortError) {

                // Log Message
                logMessage("Failed to abort multipart upload: " + abortError.message);

            }

        }

    }
    catch (error) {

        // Log Message
        logMessage("An error occurred while uploading file: " + error.message);

    }

}

//**************************************************************************
// Events
//**************************************************************************

cmdUpload.addEventListener("click", async () => {

    // Clear Status
    uploadStatus.textContent = "";

    // Load File
    var file = fileUpload.files[0];
    // Check Value
    if (!file) {

        // Log Message
        logMessage("Please select a file to upload.");
        // Exit
        return;

    }
    
    // Check Value
    if (pendingUpload) {

        // Resume Upload
        await resumeUpload(file,
            pendingUpload);

    }
    else {

        // New Upload
        await newUpload(file);

    }

});

cmdCancel.addEventListener("click", async () => {

    // Query USer
    if (!confirm("Cancel pending upload?")) {

        // Exit
        return;

    }

    try {

        // Abort Multipart Upload
        await abortMultipartUpload(pendingUpload.objectKey, pendingUpload.uploadId);
        // Log Message
        logMessage("Aborted multipart upload with Upload ID: " + pendingUpload.uploadId);

    }
    catch (error) {

        // Log Message
        logMessage("An error occurred while cancelling upload: " + error.message);

    }

    // Delete Record
    await deleteUpload(pendingUpload.uploadId);
    // Log Message
    logMessage("Deleted upload record from IndexedDB for Upload ID: " + pendingUpload.uploadId);

    // Clear Pending Upload
    pendingUpload = null;
    // Assign Values
    cmdUpload.textContent = "Upload";
    cmdCancel.style.display = "none";

});
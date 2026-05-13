// Import Database Functions
import {
    addUploadedPart,
    createUploadRecord,
    deleteUpload,
    findLatestUpload
} from "./db.js";

// Set up variables
const apiBaseUrl = "https://localhost:7222/api/storage";
const fileUpload = document.getElementById("fileUpload");
const cmdUpload = document.getElementById("cmdUpload");
const uploadStatus = document.getElementById("uploadStatus");

// Find Latest Upload
const latestUpload = await findLatestUpload();
// Check Value
if (latestUpload) {

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

async function postJSON(url,
    body) {

    // Assign Value
    var postUrl = apiBaseUrl + url;
    // Send Request
    const initialResponse = await fetch(postUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    // Extract JSON
    const json = await initialResponse.json();
    // Check Value
    if (!json.Success) {

        // Throw Exception
        throw new Error(json.Message || "Unknown Server Error");

    }
    // Return
    return json.ReturnedObject;

}

cmdUpload.addEventListener("click", async () => {

    // Initialize Uploaded Parts Array
    const uploadedParts = [];

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
    
    try {

        // Log Message
        logMessage("Uploading file: " + file.name);

        // Initialize Multipart Upload
        const uploadId = await postJSON("/InitiateMultipartUpload", {
            ObjectKey: file.name,
            ContentType: file.type || "application/octet-stream"
        });
        // Check Value
        if (!uploadId) {
         
            // Log Message
            logMessage("Failed to initiate multipart upload.");
            // Exit
            return;

        }

        // Following high level flow based on developer documentation

        try {

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

            // Search for each part
            for (let i = 0; i < totalParts; i++) {

                // Assign Value
                var partIndex = i + 1;
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

            // Check Value
            if (uploadedParts.length !== totalParts) {

                // Log Message
                logMessage("Not all parts were uploaded successfully. Uploaded " + uploadedParts.length + " out of " + totalParts);
                // Throw Exception
                throw new Error("Not all parts were uploaded successfully.");

            }
            // Complete Multipart Upload
            await postJSON("/CompleteMultipartUpload", {
                ObjectKey: file.name,
                UploadId: uploadId,
                Parts: uploadedParts
            });

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
                await postJSON("/AbortMultipartUpload", {
                    ObjectKey: file.name,
                    UploadId: uploadId
                });

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

});
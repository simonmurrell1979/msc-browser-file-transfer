// Import API Functions
import {
    getDownloadUrl
} from "./api.js";
// Import Database Functions
import {
    findLatestUpload
} from "./db.js";
// Import Encryption Functions
import {
    decryptFilePart,
    getDecryptionKey
} from "./encryption.js";
// Import Message Type
import {
    MessageType
} from "./messagetype.js";
import {
    initializeServiceWorker,
    sendCommand
} from "./swcomms.js";

// Set up variables
const fileUpload = document.getElementById("fileUpload");
const cmdUpload = document.getElementById("cmdUpload");
const cmdCancel = document.getElementById("cmdCancel");
const cmdDownload = document.getElementById("cmdDownload");
const uploadStatus = document.getElementById("uploadStatus");
let pendingUpload = null;
let completedObjectKey = null;
const partSize = 5 * 1024 * 1024;
const encryptedPartSize = partSize + 28;

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

// Add Message Handler
function handleServiceWorkerMessage(message) {

    // Handle Different Message Types
    switch (message.type) {

        // Log Message
        case MessageType.LOGMESSAGE:

            // Log Message
            logMessage("Message from Service Worker: " + message.message);
            // Exit
            break;

        // Complete Upload
        case MessageType.COMPLETEUPLOAD:

            // Log Message
            logMessage("Upload complete for Upload ID: " + message.uploadId.substring(0, 50) + "...");
            // Assign Completed Object Key
            completedObjectKey = message.objectKey;
            // Clear Pending Upload
            pendingUpload = null;
            // Assign Values
            cmdUpload.textContent = "Upload";
            cmdCancel.style.display = "none";
            cmdDownload.style.display = "inline-block";
            // Exit
            break;

    }

}

// Initialize Service Worker
await initializeServiceWorker(handleServiceWorkerMessage);

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
        await sendCommand({
            type: MessageType.RESUMEUPLOAD,
            file: file,
            uploadId: pendingUpload.uploadId
        });

    }
    else {

        // New Upload
        await sendCommand({
            type: MessageType.NEWUPLOAD,
            file: file
        });

    }

    // Assign Value
    cmdDownload.style.display = "none";

});

cmdCancel.addEventListener("click", async () => {

    // Query USer
    if (!confirm("Cancel pending upload?")) {

        // Exit
        return;

    }

    try {

        // Abort Multipart Upload
        await sendCommand({
            type: MessageType.CANCELUPLOAD,
            objectKey: pendingUpload.objectKey,
            uploadId: pendingUpload.uploadId
        });

        // Clear Pending Upload
        pendingUpload = null;
        // Assign Values
        cmdUpload.textContent = "Upload";
        cmdCancel.style.display = "none";
        cmdDownload.style.display = "none";

    }
    catch (error) {

        // Log Message
        logMessage("An error occurred while cancelling upload: " + error.message);

    }

});

cmdDownload.addEventListener("click", async () => {

    try {

        // Log Message
        logMessage("Requesting download URL for completed object key: " + completedObjectKey);
        // Get Download URL
        const downloadUrl = await getDownloadUrl(completedObjectKey);

        // Download File from R2
        const downloadedFile = await fetch(downloadUrl);
        // Extract bytes
        const downloadedBytes = await downloadedFile.arrayBuffer();
        // Log Message
        logMessage("Downloaded file from R2, size: " + downloadedBytes.byteLength + " bytes.");
        
        // Get Decryption Key
        const decryptionKey = await getDecryptionKey();
        // Initialize Decryption File Parts
        const decryptedFileParts = [];
        // Reset File Position
        let filePosition = 0;

        // Decrypt File
        while (filePosition < downloadedBytes.byteLength) {

            // Extract Encrypted Part
            const encryptedPart = downloadedBytes.slice(filePosition, filePosition + encryptedPartSize);
            // Decrypt Part
            const decryptedPart = await decryptFilePart(decryptionKey, encryptedPart);
            // Log Message
            logMessage("Decrypted part of size: " + decryptedPart.byteLength + " bytes.");
            // Append Decrypted Part
            decryptedFileParts.push(decryptedPart);
            // Update File Position
            filePosition += encryptedPartSize;

        }

        // Combine Decrypted Parts
        const decryptedFile = new Blob(decryptedFileParts);
        // Create Download Link
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(decryptedFile);
        downloadLink.download = "decrypted_file";
        // Click Download Link
        downloadLink.click();

    }
    catch (error) {

        // Log Message
        logMessage("An error occurred while requesting download URL: " + error.message);

    }

});
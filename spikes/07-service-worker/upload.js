// Import Service Worker Comms
import {
    initializeServiceWorker,
    sendServiceWorkerMessage
} from "./swcomms.js";

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

// Add Message Handler
function handleServiceWorkerMessage(message) {

    // Log Message
    console.log("Received message from Service Worker: " + JSON.stringify(message));

}

// Initialize Service Worker
await initializeServiceWorker(handleServiceWorkerMessage);
// Allow console testing
window.sendServiceWorkerMessage = sendServiceWorkerMessage;

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
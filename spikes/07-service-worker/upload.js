// Import Service Worker Comms
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

    // Handle Different Message Types
    switch (message.type) {

        // Log Message
        case "LOGMESSAGE":

            // Log Message
            logMessage("Message from Service Worker: " + message.message);
            // Exit
            break;

    }
    // Log Message
    console.log("Received " + message.type + " message from Service Worker: " + message.message);

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
            type: "RESUMEUPLOAD",
            uploadId: pendingUpload.uploadId
        });

    }
    else {

        // New Upload
        await sendCommand({
            type: "NEWUPLOAD",
            file: file
        });

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
        await sendCommand({
            type: MessageType.CANCELUPLOAD,
            objectKey: pendingUpload.objectKey,
            uploadId: pendingUpload.uploadId
        });

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
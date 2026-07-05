import { FileTransferApi } from "../shared/filetransferapi";
import { FileTransferDb } from "../shared/filetransferdb";
import { FileTransferUpload } from "../shared/filetransferupload";
import { MessageType } from "../models/messagetype";

// Initialize FileTransferApi/FileTransferDb
const fileTransferApi = new FileTransferApi();
const fileTransferDb = new FileTransferDb();
const fileTransferUpload = new FileTransferUpload(fileTransferApi, 
    fileTransferDb, 
    logMessage,
    (uploadId: string, partNumber: number, totalParts: number) => sendProgressEvent(MessageType.PROGRESSUPLOAD, uploadId, partNumber, totalParts),
    (uploadId: string, objectKey: string) => sendEvent(MessageType.COMPLETEUPLOAD, uploadId, objectKey),
    (uploadId: string, objectKey: string) => sendEvent(MessageType.CANCELLEDUPLOAD, uploadId, objectKey));

declare const self: ServiceWorkerGlobalScope;

let serviceWorkerClient: Client | null = null;
let uploadInProgress = false;

// Send Event
function sendEvent(type: MessageType, uploadId: string, objectKey: string) {

    // Check Value
    if (serviceWorkerClient == null) {

        // Exit
        return; 

    }
    // Post Message
    serviceWorkerClient.postMessage({
        type: type,
        uploadId: uploadId,
        objectKey: objectKey
    });

}

function sendProgressEvent(type: MessageType, uploadId: string, partNumber: number, totalParts: number) {

    // Check Value
    if (serviceWorkerClient == null) {

        // Exit
        return; 

    }
    // Post Message
    serviceWorkerClient.postMessage({
        type: type,
        uploadId: uploadId,
        partNumber: partNumber,
        totalParts: totalParts
    });

}

// Log Message
function logMessage(message: string) {

    // Check Value
    if (serviceWorkerClient == null) {

        // Exit
        return;

    }
    // Post Message
    serviceWorkerClient.postMessage({
        type: MessageType.LOGMESSAGE,
        message: message
    });
    
}

// Install Event
self.addEventListener("install", (event: any) => {

    // Activate immediately 
    self.skipWaiting();

});

// Activate Event
self.addEventListener("activate", (event: any) => {

    // Claim clients
    event.waitUntil(self.clients.claim());

});

// Add Message Event
self.addEventListener("message", (event: any) => {

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
                event.waitUntil(fileTransferUpload.newUpload(data.file).finally(() => {

                    // Disable
                    uploadInProgress = false;

                }));
                // Exit
                break; 

            case MessageType.RESUMEUPLOAD:

                // Resume Upload
                event.waitUntil(fileTransferUpload.resumeUpload(data.file, data.uploadId).finally(() => {

                    // Disable
                    uploadInProgress = false;
                    
                }));
                // Exit
                break;

        }

    }
    else if (data.type === MessageType.CANCELUPLOAD) {

        // Cancel Upload
        event.waitUntil(fileTransferUpload.cancelUpload(data.objectKey, data.uploadId));

    }

});
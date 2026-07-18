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
    (uploadId: string, objectKey: string, partNumber: number, totalParts: number) => sendProgressEvent(MessageType.PROGRESSUPLOAD, uploadId, objectKey, partNumber, totalParts),
    (uploadId: string, objectKey: string, password: string, integrityHash: string) => sendCompleteEvent(MessageType.COMPLETEUPLOAD, uploadId, objectKey, password, integrityHash),
    (uploadId: string, objectKey: string) => sendCancelEvent(MessageType.CANCELLEDUPLOAD, uploadId, objectKey));

declare const self: ServiceWorkerGlobalScope;
let uploadInProgress = false;

async function sendMessageToAllClients(message: any): Promise<void> {

    // Get All Clients
    const clients = await self.clients.matchAll({ window: true });
    // Search through Clients
    for (const client of clients) {

        // Post Message
        client.postMessage(message);        

    }

}

function sendProgressEvent(type: MessageType, uploadId: string, objectKey: string, partNumber: number, totalParts: number) {

    // Post Message
    sendMessageToAllClients({
        type: type,
        uploadId: uploadId,
        objectKey: objectKey,
        partNumber: partNumber,
        totalParts: totalParts
    });

}

// Send Complete Event
function sendCompleteEvent(type: MessageType, uploadId: string, objectKey: string, password: string, integrityHash: string) {

    // Post Message
    sendMessageToAllClients({
        type: type,
        uploadId: uploadId,
        objectKey: objectKey,
        password: password,
        integrityHash: integrityHash
    });

}

// Send Cancel Event
function sendCancelEvent(type: MessageType, uploadId: string, objectKey: string) {

    // Post Message
    sendMessageToAllClients({
        type: type,
        uploadId: uploadId,
        objectKey: objectKey
    });

}

// Log Message
function logMessage(message: string) {

    // Post Message
    sendMessageToAllClients({
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
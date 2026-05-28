// Web pages used
// https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB

const databaseName = "FileTransfer";
const databaseVersion = 1;
const storeName = "uploads";

let databasePromise = null;

function openDatabase() {

    // Check Value
    if (!databasePromise) {

        // Initialize Database
        databasePromise = new Promise((resolve, reject) => {

            // Open Database
            const request = indexedDB.open(databaseName, databaseVersion);   
            // Handle Upgrade
            request.onupgradeneeded = (event) => {

                // Assign Database
                const database = event.target.result;
                // Check if store exists
                if (!database.objectStoreNames.contains(storeName)) {

                    // Create Store
                    database.createObjectStore(storeName, { keyPath: "uploadId" });

                }

            };    

            // Handle Success
            request.onsuccess = (event) => {

                // Resolve
                resolve(event.target.result);
                
            };
            // Handle Error
            request.onerror = (event) => {

                // Reject
                reject(event.target.error);

            }

        });

    }
    // Return
    return databasePromise;

}

export async function saveUpload(record) {

    // Open Database
    const database = await openDatabase();

    // Initialize Promise
    return new Promise((resolve, reject) => {

        // Open Transaction
        const transaction = database.transaction(storeName, "readwrite");
        // Get Object Store
        const objectStore = transaction.objectStore(storeName);
        // Put Record
        const request = objectStore.put(record);

        // Handle Success
        request.onsuccess = () => resolve(record);
        // Handle Error
        request.onerror = (event) => reject(event.target.error);

    });

}

export async function deleteUpload(uploadId) {

    // Open Database
    const database = await openDatabase();

    // Initialize Promise
    return new Promise((resolve, reject) => {

        // Open Transaction
        const transaction = database.transaction(storeName, "readwrite");
        // Get Object Store
        const objectStore = transaction.objectStore(storeName);
        // Delete Record
        const request = objectStore.delete(uploadId);

        // Handle Success
        request.onsuccess = () => resolve();
        // Handle Error
        request.onerror = (event) => reject(event.target.error);

    });

}

export async function getUpload(uploadId) {

    // Open Database
    const database = await openDatabase();

    // Initialize Promise
    return new Promise((resolve, reject) => {

        // Open Transaction
        const transaction = database.transaction(storeName, "readonly");
        // Get Object Store
        const objectStore = transaction.objectStore(storeName);
        // Get Record
        const request = objectStore.get(uploadId);

        // Handle Success
        request.onsuccess = (event) => resolve(event.target.result || null);
        // Handle Error
        request.onerror = (event) => reject(event.target.error);

    });

}

export async function getUploads() {

    // Open Database
    const database = await openDatabase();

    // Initialize Promise
    return new Promise((resolve, reject) => {

        // Open Transaction
        const transaction = database.transaction(storeName, "readonly");
        // Get Object Store
        const objectStore = transaction.objectStore(storeName);
        // Get Records
        const request = objectStore.getAll();

        // Handle Success
        request.onsuccess = (event) => resolve(event.target.result || null);
        // Handle Error
        request.onerror = (event) => reject(event.target.error);

    });

}

export async function createUploadRecord(uploadId,
    file,
    partSize,
    totalParts) {

    // Build Record
    var newRecord = {
        uploadId: uploadId,
        objectKey: file.name,
        contentType: file.type || "application/octet-stream",
        fileIdentifier: {
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
            hash: null
        },
        partSize: partSize,
        totalParts: totalParts,
        createDate: Date.now(),
        uploadedParts: []
    }
    // Save Record
    await saveUpload(newRecord);
    // Return
    return newRecord;

}

export async function addUploadedPart(uploadId, 
    partNumber, 
    eTag) {

    // Get Record
    const record = await getUpload(uploadId);
    // Check Value
    if (!record) {

        // Throw Exception
        throw new Error("Upload record not found for uploadId: " + uploadId);

    }

    // Add Uploaded Part
    record.uploadedParts.push({
        PartNumber: partNumber,
        ETag: eTag,
        uploadedAt: Date.now()
    });
    // Save Record
    await saveUpload(record);
    // Return
    return record;

}

export async function findLatestUpload(file) {

    // Get All Uploads
    const uploads = await getUploads();
    // Check Value
    if (!uploads || uploads.length === 0) {

        // Return
        return null;

    }
    // Sort
    uploads.sort((a, b) => b.createDate - a.createDate);
    // Return
    return uploads[0];

}
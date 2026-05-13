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
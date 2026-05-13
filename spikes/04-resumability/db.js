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
                    database.createObjectStore(storeName, { keyPath: "id" });

                }
                
            };         

        });

    }
    // Return
    return databasePromise;

}
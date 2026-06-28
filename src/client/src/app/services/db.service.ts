//*************************************************/
// https://www.npmjs.com/package/idb
// https://github.com/jakearchibald/idb
//*************************************************/
import { Injectable } from "@angular/core";
import { openDB, IDBPDatabase } from "idb";

@Injectable({ providedIn: "root" })
export class DbService {

    // Private Variables
    private readonly _databaseName = "FileTransfer";
    private readonly _databaseVersion = 1;
    private readonly _storeName = "uploads";
    private readonly _keyPath = "uploadId";
    private _databasePromise: Promise<IDBPDatabase<any>> | null = null;

    private openDatabase(): Promise<IDBPDatabase<any>> {

        // Check Value
        if (this._databasePromise) {

            // Return
            return this._databasePromise;

        }

        // Assign Values
        const storeName = this._storeName;
        const keyPath = this._keyPath;       

        // Open Database
        this._databasePromise = openDB(this._databaseName, this._databaseVersion, {
            upgrade(database) {

                // Check Object Store exists
                if (!database.objectStoreNames.contains(storeName)) {

                    // Create Object Store
                    database.createObjectStore(storeName, { keyPath: keyPath });

                }

            }

        });
        // Return
        return this._databasePromise;

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

}

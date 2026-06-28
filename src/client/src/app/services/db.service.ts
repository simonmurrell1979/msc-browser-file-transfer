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
    private _databasePromise: Promise<IDBPDatabase<any>> | null = null;

    private openDatabase(): Promise<IDBPDatabase<any>> {

        // Check Value
        if (this._databasePromise) {

            // Return
            return this._databasePromise;

        }
        // Open Database
        this._databasePromise = openDB(this._databaseName, this._databaseVersion, {
            upgrade(database) {

                // Check Object Store exists
                if (!database.objectStoreNames.contains("uploads")) {

                    // Create Object Store
                    database.createObjectStore("uploads", { keyPath: "uploadId" });

                }

            }

        });
        // Return
        return this._databasePromise;

    }

}

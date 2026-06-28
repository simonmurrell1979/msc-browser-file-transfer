//*************************************************/
// https://www.npmjs.com/package/idb
//
//*************************************************/
import { Injectable } from "@angular/core";
import { openDB } from "idb";

@Injectable({ providedIn: "root" })
export class DbService {

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

}

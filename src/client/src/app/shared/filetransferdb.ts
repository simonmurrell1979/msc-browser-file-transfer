//*************************************************/
// https://www.npmjs.com/package/idb
// https://github.com/jakearchibald/idb
//*************************************************/
import { openDB, IDBPDatabase } from "idb";
import { UploadRecord } from "../models/uploadrecord";

export class FileTransferDb {

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

            },
            terminated: () => {

                // Reset Database Promise
                this._databasePromise = null;

            }
        });
        // Return
        return this._databasePromise;

    }

    public async saveUpload(record: UploadRecord): Promise<void> {

        // Open Database
        const database = await this.openDatabase();
        // Put
        await database.put(this._storeName, record);

    }

    public async deleteUpload(uploadId: any): Promise<void> {

        // Open Database
        const database = await this.openDatabase();
        // Delete
        await database.delete(this._storeName, uploadId);

    }

    public async getUpload(uploadId: string): Promise<UploadRecord | undefined> {

        // Open Database
        const database = await this.openDatabase();
        // Get
        return await database.get(this._storeName, uploadId);

    }

    public async getUploads(): Promise<UploadRecord[]> {

        // Open Database
        const database = await this.openDatabase();
        // Get
        return await database.getAll(this._storeName);

    }

    public async createUploadRecord(uploadId: string,
        file: File,
        partSize: number,
        totalParts: number): Promise<UploadRecord> {

        // Build Record
        const newRecord: UploadRecord = {
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
        await this.saveUpload(newRecord);
        // Return
        return newRecord;

    }

    public async addUploadedPart(uploadId: string, 
        partNumber: number, 
        eTag: string): Promise<UploadRecord> {

        // Get Record
        const record = await this.getUpload(uploadId);
        // Check Value
        if (!record) {

            // Throw Exception
            throw new Error("Upload record not found for uploadId: " + uploadId);

        }

        // Add Uploaded Part
        record.uploadedParts.push({
            PartNumber: partNumber,
            ETag: eTag,
            UploadedAt: Date.now()
        });
        // Save Record
        await this.saveUpload(record);
        // Return
        return record;

    }

    public async findLatestUpload(): Promise<UploadRecord | null> {

        // Get All Uploads
        const uploads = await this.getUploads();
        // Check Value
        if (!uploads || uploads.length === 0) {

            // Return
            return null;

        }
        // Sort
        uploads.sort((a: UploadRecord, b: UploadRecord) => b.createDate - a.createDate);
        // Return
        return uploads[0];

    }

}
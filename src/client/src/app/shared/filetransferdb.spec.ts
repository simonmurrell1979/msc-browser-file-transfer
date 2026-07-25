// https://github.com/dumbmatter/fakeIndexedDB

import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { FileTransferDb } from "./filetransferdb"; 

describe("File Transfer DB Tests", () => {

    it("Test findLatestUpload is null when database is empty", async () => {

        // Initialize Class
        const fileTransferDb = new FileTransferDb();
        // Find Latest Upload
        const latestUpload = await fileTransferDb.findLatestUpload();
        // Check if the latest upload is null (database is empty)
        expect(latestUpload).toBeNull();

    });

    it("Test createUpload and getUpload", async () => {

        // Initialize Class
        const fileTransferDb = new FileTransferDb();
        // Build mock file
        const mockFile = new File(["Hello World!", "testfile.txt", { type: "text/plain" }]);
        // Create Upload
        const record = await fileTransferDb.createUploadRecord("mockFile-1", "mockFile-1/testfile.txt", "password123", mockFile, 5, 2);
        // Get Upload
        const getUploadRecord = await fileTransferDb.getUpload(record.uploadId);
        // Check Mock File values match

    });

});
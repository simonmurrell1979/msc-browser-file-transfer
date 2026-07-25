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
        const mockFile = new File(["Hello World!"], "testfile.txt", { type: "text/plain", lastModified: 12345 });
        // Create Upload
        const createUploadRecord = await fileTransferDb.createUploadRecord("mockFile-1", "mockFile-1/testfile.txt", "password123", mockFile, 5, 2);
        // Get Upload
        const getUploadRecord = await fileTransferDb.getUpload(createUploadRecord.uploadId);
        // Check Mock File values match
        expect(createUploadRecord).toBeDefined();
        expect(createUploadRecord?.fileIdentifier.name).toBe("testfile.txt");
        expect(createUploadRecord?.fileIdentifier.size).toBe(12);
        expect(createUploadRecord?.createDate).toBe(getUploadRecord?.createDate);

    });

});
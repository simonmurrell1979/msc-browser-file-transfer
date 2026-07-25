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

    it("Test addUploadedPart", async () => {

        // Initialize Class
        const fileTransferDb = new FileTransferDb();
        // Build mock file
        const mockFile = new File(["Hello World!"], "testfile.txt", { type: "text/plain", lastModified: 12345 });
        // Create Upload
        await fileTransferDb.createUploadRecord("mockFile-1", "mockFile-1/testfile.txt", "password123", mockFile, 5, 2);
        // Add Uploaded Part
        await fileTransferDb.addUploadedPart("mockFile-1", 1, "mockETag123", "mockHash123");
        // Get Upload
        const getUploadRecord = await fileTransferDb.getUpload("mockFile-1");
        // Check Mock File values match
        expect(getUploadRecord?.uploadedParts.length).toBe(1);
        expect(getUploadRecord?.uploadedParts[0].ETag).toBe("mockETag123");
        expect(getUploadRecord?.uploadedParts[0].PartNumber).toBe(1);
        expect(getUploadRecord?.originalPartsHashes[0]).toBe("mockHash123");

    });

    it("Test findLatestUpload returns the latest upload record", async () => {

        // Initialize Class
        const fileTransferDb = new FileTransferDb();
        // Build mock file
        const mockFile = new File(["Hello World!"], "testfile.txt", { type: "text/plain", lastModified: 12345 });
        // Create Upload
        const firstRecord = await fileTransferDb.createUploadRecord("mockFile-1", "mockFile-1/testfile.txt", "password123", mockFile, 5, 2);
        // Reduce date
        firstRecord.createDate -= 1000; // Subtract 1 second
        // Save Updated Record
        await fileTransferDb.saveUpload(firstRecord);
        // Create Upload
        const secondRecord = await fileTransferDb.createUploadRecord("mockFile-2", "mockFile-2/testfile.txt", "password123", mockFile, 5, 2);
        // Find Latest Upload
        const latestUpload = await fileTransferDb.findLatestUpload();
        // Check if the latest upload is the second record
        expect(latestUpload?.uploadId).toBe(secondRecord.uploadId);

    });

});
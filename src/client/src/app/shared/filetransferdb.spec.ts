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

});
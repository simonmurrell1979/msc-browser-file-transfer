// https://github.com/dumbmatter/fakeIndexedDB

import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { FileTransferDb } from "./filetransferdb"; 

describe("File Transfer DB Tests", () => {

    it("Test findLastest Upload", () => {

        // Initialize Class
        const fileTransferDb = new FileTransferDb();
        // Find Latest Upload
        const latestUpload = fileTransferDb.findLatestUpload();

    });

});
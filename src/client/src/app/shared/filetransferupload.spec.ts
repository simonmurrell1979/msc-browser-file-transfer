// https://vitest.dev/api/vi
// https://vitest.dev/guide/mocking/functions
// https://vitest.dev/guide/mocking/modules
// https://qaskills.sh/blog/vitest-mocking-vi-mock-complete-guide
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

import "fake-indexeddb/auto";
import { expect, it, vi } from "vitest";
import { FileTransferUpload } from "./filetransferupload";
import { FileTransferDb } from "./filetransferdb";
import { FileTransferApi } from "./filetransferapi";

describe("Mocking Functions", () => {

    it("Mock very basic function", async () => {
    
        // Create a mock function
        const mockFn = vi.fn().mockResolvedValue("Hello World!");
        // Call the mock function
        const result = mockFn();
        // Assert that the mock function was called
        expect(mockFn).toHaveBeenCalledTimes(1);
        // Check Value returned by the mock function
        await expect(result).resolves.toBe("Hello World!");

    });

    it("Mock multiupload function", async () => {

        // Build Mock API Functions
        const api = {
            initiateMultipartUpload: vi.fn().mockResolvedValue("mockFile-1"),
        }
        // Call the mock function
        const uploadId = api.initiateMultipartUpload();
        // Expect
        await expect(uploadId).resolves.toBe("mockFile-1");

        // Check that the mock function was called
        expect(api.initiateMultipartUpload).toHaveBeenCalledTimes(1);

    });

    it("Mock global function", async () => {

        // Mock global function
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            headers: new Headers({ "ETag": "mockETag123" })
        }));
        // Call Fetch
        const response = await fetch("https://helloworld.com");
        // Expect
        expect(response.ok).toBe(true);
        expect(response.headers.get("ETag")).toBe("mockETag123");

    });

    it("Test newUpload function", async () => {

        // Build Mock API Functions
        const api = {
            initiateMultipartUpload: vi.fn().mockResolvedValue("mockFile-1"),
            generateMultipartUploadUrl: vi.fn().mockResolvedValue("http://helloworld.com/uploadparturl"),
            completeMultipartUpload: vi.fn().mockResolvedValue(true),
        } as unknown as FileTransferApi;
        // Initialize Class
        const fileTransferUpload = new FileTransferUpload(api,
            new FileTransferDb(),
            vi.fn());

        // Build mock file
        const mockFile = new File(["Hello World!"], "testfile.txt", { type: "text/plain", lastModified: 12345 });
        // New Upload
        await fileTransferUpload.newUpload(mockFile);

        // Check that the mock functions were called
        expect(api.initiateMultipartUpload).toHaveBeenCalledTimes(1);
        expect(api.generateMultipartUploadUrl).toHaveBeenCalledTimes(1);
        expect(api.completeMultipartUpload).toHaveBeenCalledTimes(1);

    });

    it("Test resumeUpload function", async () => {

        // Build Mock API Functions
        const api = {
            listMultipartUploadParts: vi.fn().mockResolvedValue([ { ETag: "mockETag123", PartNumber: 1 } ]),
            generateMultipartUploadUrl: vi.fn().mockResolvedValue("http://helloworld.com/uploadparturl"),
            completeMultipartUpload: vi.fn().mockResolvedValue(true),
        } as unknown as FileTransferApi;

        // Mock global function
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            headers: new Headers({ "ETag": "mockETag456" })
        }));

        // Initialize Class
        const fileTransferDb = new FileTransferDb();
        // Build mock file
        const mockFile = new File(["Hello World!"], "testfile.txt", { type: "text/plain", lastModified: 12345 });
        // Create Upload Records
        await fileTransferDb.createUploadRecord("mockFile-resume", "mockFile-resume/testfile.txt", "password123", mockFile, 6, 2);
        // Add Upload Part
        await fileTransferDb.addUploadedPart("mockFile-resume", 1, "mockETag123", "mockHash123");
        
        // Initialize Class
        const fileTransferUpload = new FileTransferUpload(api,
            fileTransferDb,
            vi.fn());
        // Resume Upload
        await fileTransferUpload.resumeUpload(mockFile, "mockFile-resume");

        // Check that the mock functions were called
        expect(api.listMultipartUploadParts).toHaveBeenCalledTimes(1);
        expect(api.generateMultipartUploadUrl).toHaveBeenCalledTimes(1);
        expect(api.completeMultipartUpload).toHaveBeenCalledTimes(1);
        // Check Parameters
        expect(api.generateMultipartUploadUrl).toHaveBeenCalledWith("mockFile-resume/testfile.txt", "mockFile-resume", 2);

    });

});
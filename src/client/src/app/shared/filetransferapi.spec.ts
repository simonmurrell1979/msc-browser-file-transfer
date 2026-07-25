// https://stevekinney.com/courses/testing/mocking-fetch-and-network-requests
// https://dev.to/maanu07/mocking-fetch-api-calls-in-vitest-for-reliable-tests-aoh

import { describe, expect, it } from "vitest";
import { FileTransferApi } from "./filetransferapi";

describe("FileTransferApi", () => {

    it("GetUploadUrl", async () => {

        // Mock global function
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            json: async () => ({
                Success: true,
                ReturnedObject: "https://helloworld.com/upload-url"
            })
        }));

        // Initialize Class
        const fileTransferApi = new FileTransferApi();
        // Get Upload Url
        const uploadUrl = await fileTransferApi.getUploadUrl("test-object-key");
        // Check Value
        expect(uploadUrl).toBeDefined();
        expect(uploadUrl).toBe("https://helloworld.com/upload-url");

    });

    it("initiateMultipartUpload", async () => {

        // Mock global function
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            json: async () => ({
                Success: true,
                ReturnedObject: "mockFile-1"
            })
        }));
        // Initialize Class
        const fileTransferApi = new FileTransferApi();
        // Initiate Multipart Upload
        const uploadId = await fileTransferApi.initiateMultipartUpload("test-object-key", "application/octet-stream");
        // Expect
        expect(uploadId).toBeDefined();
        expect(uploadId).toBe("mockFile-1");

    });

});
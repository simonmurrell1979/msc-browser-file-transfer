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

    it("GetUploadUrl with Success false / null key", async () => {

        // Mock global function
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            json: async () => ({
                Success: false,
                ReturnedObject: null
            })
        }));

        // Initialize Class
        const fileTransferApi = new FileTransferApi();
        // Get Upload Url
        await expect(fileTransferApi.getUploadUrl("test-object-key")).rejects.toThrow("An error occurred while processing the request.");

    });

    it("GetUploadUrl with Success true / null key", async () => {

        // Mock global function
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            json: async () => ({
                Success: true,
                ReturnedObject: null
            })
        }));

        // Initialize Class
        const fileTransferApi = new FileTransferApi();
        // Get Upload Url
        await expect(fileTransferApi.getUploadUrl("test-object-key")).rejects.toThrow("An error occurred while processing the request.");

    });

    it("GetUploadUrl with Success false / ErrorMessage set", async () => {

        // Mock global function
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            json: async () => ({
                Success: false,
                ErrorMessage: "Object key not found"
            })
        }));

        // Initialize Class
        const fileTransferApi = new FileTransferApi();
        // Get Upload Url
        await expect(fileTransferApi.getUploadUrl("test-object-key")).rejects.toThrow("Object key not found");

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

    it("completeMultipartUpload returns true", async () => {

        // Mock global function
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            json: async () => ({
                Success: true
            })
        }));

        // Initialize Class
        const fileTransferApi = new FileTransferApi();
        // Complete Multipart Upload
        const completed = await fileTransferApi.completeMultipartUpload("mockFile-2/testfile.txt", "mockFile-2", []);
        // Expect
        expect(completed).toBe(true);

    });

});
// https://vitest.dev/api/vi
// https://vitest.dev/guide/mocking/functions
// https://vitest.dev/guide/mocking/modules
// https://qaskills.sh/blog/vitest-mocking-vi-mock-complete-guide
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

import { expect, it, vi } from "vitest";

describe("Mocking Functions", () => {

    it("Mock very basic function", () => {
    
        // Create a mock function
        const mockFn = vi.fn().mockResolvedValue("Hello World!");
        // Call the mock function
        const result = mockFn();
        // Assert that the mock function was called
        expect(mockFn).toHaveBeenCalledTimes(1);
        // Check Value returned by the mock function
        expect(result).resolves.toBe("Hello World!");

    });

    it("Mock multiupload function", () => {

        // Build Mock API Functions
        const api = {
            initiateMultipartUpload: vi.fn().mockResolvedValue("mockFile-1"),
        }
        // Call the mock function
        const uploadId = api.initiateMultipartUpload();
        // Expect
        expect(uploadId).resolves.toBe("mockFile-1");

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
    });

});
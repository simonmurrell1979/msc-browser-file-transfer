// https://vitest.dev/api/vi
// https://vitest.dev/guide/mocking/functions
// https://qaskills.sh/blog/vitest-mocking-vi-mock-complete-guide


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

});
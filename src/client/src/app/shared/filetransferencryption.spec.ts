import { describe, expect, it } from "vitest";

describe("Check if SubtleCrypto is available", () => {

    it("should have SubtleCrypto available", () => {

        // Check if SubtleCrypto is available in the browser
        expect(crypto && crypto.subtle).toBeDefined();

    });

    it("compute 256 bit hash of a string", async () => {

        // Generate Fake Data
        const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        // Digest the data using SHA-256
        const digest = await crypto.subtle.digest("SHA-256", data);
        // Check Length of the digest
        expect(digest.byteLength).toBe(32);

    });

});
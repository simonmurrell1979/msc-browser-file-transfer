// Keeping track of the following links for future reference on testing in browser environments with Vitest and JSDOM
// https://github.com/vitest-dev/vitest
// https://vitest.dev/guide/browser/
// https://github.com/jsdom/jsdom
// https://github.com/capricorn86/happy-dom
// https://www.testim.io/blog/jsdom-a-guide-to-how-to-get-started-and-what-you-can-do/
// https://sparkbox.com/foundry/improve_unit_testing_with_mocha_chai_jsdom

import { describe, expect, it } from "vitest";
import { FileTransferEncryption } from "./filetransferencryption";

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

describe("File Transfer Encryption Tests", () => {

    it("Test generatePassword Length", () => {

        // Initialize Class
        var fileEncryption = new FileTransferEncryption();
        // Generate Password
        const password = fileEncryption.generatePassword();
        // Check Length of the password
        expect(password.length).toBe(43);

    });

    it("Test encodeBase64 and decodeBase64", () => {

        // Initialize Class
        var fileEncryption = new FileTransferEncryption();
        // Generate Hash
        const hash = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        // Encode the hash to Base64
        const encodedHash = fileEncryption.encodeBase64(hash.buffer);
        // Decode the Base64 back to ArrayBuffer
        const decodedHash = fileEncryption.decodeBase64(encodedHash);
        // Check if decoded hash matches the original hash
        expect(new Uint8Array(decodedHash)).toEqual(hash);

    });

});
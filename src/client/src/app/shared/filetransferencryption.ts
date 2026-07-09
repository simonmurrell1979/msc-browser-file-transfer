const TEST_KEY = "1234567890abcdef"; 

export class FileTransferEncryption {

    async getEncryptionKey(encryptionKey: string | null = null): Promise<CryptoKey> {

        // Convert to bytes
        const keyData = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(encryptionKey || TEST_KEY));
        // Import Key
        const key = await crypto.subtle.importKey("raw",
            keyData,
            "AES-GCM",
            true,
            [
                "encrypt"
            ]);
        // Return
        return key;

    }

    async getDecryptionKey(encryptionKey: string | null = null): Promise<CryptoKey> {

        // Convert to bytes
        const keyData = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(encryptionKey || TEST_KEY));
        // Import Key
        const key = await crypto.subtle.importKey("raw",
            keyData,
            "AES-GCM",
            true,
            [
                "decrypt"
            ]);
        // Return
        return key;

    }

    async encryptFilePart(key: CryptoKey,
        filePart: ArrayBuffer): Promise<Uint8Array<ArrayBuffer>> {

        // Generate IV
        const iv = crypto.getRandomValues(new Uint8Array(12));
        // Encrypt
        const encryptedFilePart = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            }, 
            key,
            filePart);
        // Append IV + Encrypted File Part
        const retVal = new Uint8Array(iv.byteLength + encryptedFilePart.byteLength);
        // Set IV
        retVal.set(new Uint8Array(iv), 0);
        // Set Encrypted File Part
        retVal.set(new Uint8Array(encryptedFilePart), iv.byteLength);
        // Return
        return retVal;

    }

    async decryptFilePart(key: CryptoKey,
        filePart: Uint8Array): Promise<ArrayBuffer> {

        // Extract IV
        const iv = filePart.slice(0, 12);
        // Remove IV from File Part
        const encryptedFilePart = filePart.slice(12);
        // Decrypt
        const decryptedFilePart = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            }, 
            key,
            encryptedFilePart);
        // Return
        return decryptedFilePart;

    }

    public generatePassword(): string {

        // Generate random password
        const password = crypto.getRandomValues(new Uint8Array(32));
        // Replace +, / and = with - for URL issues
        return this.encodeBase64(password.buffer);

    }

    public async buildIntegrityHash(partsHashes: string[]): Promise<string> {

        // Initialize Final Hash
        const finalHash = new Uint8Array(partsHashes.length * 32);
        // Search through Part Hashs
        for (let i = 0; i < partsHashes.length; i++) {

            // Decode Part Hash
            const decodedPartHash = this.decodeBase64(partsHashes[i]);
            // Assign Value
            finalHash.set(decodedPartHash, i * 32);

        }
        // Calculate Final Hash
        const integrityHash = await crypto.subtle.digest("SHA-256", finalHash);
        // Return
        return this.encodeBase64(integrityHash);

    }

    public encodeBase64(hash: ArrayBuffer): string {

        // Replace +, / and = with - for URL issues
        return btoa(String.fromCharCode(...new Uint8Array(hash))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

    }

    public decodeBase64(hash: string): Uint8Array {

        // Reverse Replace - and _ with + and / for URL issues
        const base64 = hash.replaceAll("-", "+").replaceAll("_", "/");
        // Decode
        const decoded = atob(base64);
        // Initialize Class
        const retVal = new Uint8Array(decoded.length);
        // Search through Decoded
        for (let i = 0; i < decoded.length; i++) {

            // Assign Value
            retVal[i] = decoded.charCodeAt(i);

        }
        // Return
        return retVal;

    }

}
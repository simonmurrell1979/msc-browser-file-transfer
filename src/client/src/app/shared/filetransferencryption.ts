const TEST_KEY = "1234567890abcdef"; 

export class FileTransferEncryption {

    async function getEncryptionKey(encryptionKey) {

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

    async function getDecryptionKey(encryptionKey) {

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

    async function encryptFilePart(key,
        filePart) {

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

    async function decryptFilePart(key,
        filePart) {

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

}
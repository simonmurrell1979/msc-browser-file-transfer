# Spike 09: Encryption Read Path

## Goal

Retrieve the encrypted file from R2, then decrypt it on the webpage to restore the original file. The server provides a presigned GET, allowing the page to retrieve ciphertext directly from R2. This means neither the server nor R2 will ever access plaintext or the key. This concludes the round trip and verifies end-to-end integrity as per the proposal's third objective.

Decryption happens on the page, not within the Service Worker, for the spike. This bypasses the fetch-interception decision, making it a build-phase issue.

## What's New

- **`encryption.js`** - Added two functions that mirror the write path. `getDecryptionKey` takes a key string, hashes it to 32 bytes, and then sets it up as a decrypt-only AES-GCM key. The `decryptFilePart` function strips the first 12 bytes (the IV), decrypts the subsequent data, and outputs the plaintext as an ArrayBuffer.
- **Backend**: A `GenerateGetUrlAsync` service method and `GetDownloadUrl` controller action have been created to sign a presigned GET for the completed object. The mirror for the part-PUT presign has no UploadId or PartNumber.
- **`api.js`**: Includes a `getDownloadUrl` function. This helper function contacts the new endpoint to retrieve and provide the signed URL.
- **`sw.js`** - The `completeUpload` function now adds `objectKey` to the COMPLETEUPLOAD message, allowing the page to identify the correct file for download.
- **`index.html`**, **`upload.js`** - A button for downloading, visible upon completion, connected to a function that retrieves the ciphertext, processes it in sections, decrypts each piece, reconstructs a Blob, and saves the file using its original name.

## How to Run

1. Unregister the service worker (DevTools > Application > Service Workers > Unregister) because sw.js has been modified.
2. Execute `npx serve` within the spike directory.
3. After the file upload finishes, click the Download button.
4. Make sure the restored file works properly. To formally prove it, compare the SHA-256 hash of the original file with that of the downloaded copy by running `Get-FileHash file -Algorithm SHA256`. Identical hashes confirm a flawless data transfer.

To prevent cross-origin download failures, the R2 bucket's CORS configuration needs to permit both GET and PUT requests.

## Key Findings

- **Round trip verified.** - The file that was recovered is complete and functions as expected. Files are encrypted before uploading, stored as ciphertext on R2, and decrypted upon download, restoring the original file.
- **Reassembly walks the object part by part.** - - Each part of the object is put back together sequentially. The page processes data in segments of `partSize + 28` bytes, decrypting them individually. `slice` handles the final short segment automatically, eliminating the need for special handling of the last part.
- **Decryption is page-side and server-blind.** -. The server signs the GET request without processing the bytes or the key. Zero-knowledge is maintained on the read side, mirroring its function on the write side.
- **The key must be handed to the decrypt side.** - The key must be transferred to the decryption party. Both encryption and decryption function identically due to a shared, pre-programmed test key. There is no mechanism in the pipeline for the key to go from sender to recipient. A genuine key-management layer is essential for this specific reason, not merely a supplementary feature.

## What Broke

- The `decryptFilePart` function received its arguments in the wrong order, with bytes in place of the key. This was the same issue seen on the encrypt side, resulting in an error stating "parameter 2 is not of type CryptoKey".
The decrypted segments were calculated and then thrown away, without an array to store them, resulting in an empty file.
The keys for decryption and encryption were different (object name vs. test key), causing GCM to reject the data. The error appeared as an OperationError, lacking a message but containing `error.name`.

## Open Questions

- **Key management.** - The same key is essential for the recipient to decrypt the message. The location of the link fragment, whether it's for zero-knowledge or server-held for convenience, is decided during the build phase. This increase demonstrates the necessity of that layer by its absence.
- **Object deletion and expiry.** - There is currently no method to delete a finished object. Explicit deletion mirrors Abort (a presigned DELETE or a server DeleteObject call). An R2 lifecycle rule that automatically deletes objects after a predetermined period is a better choice for a link-based tool, functioning like the ephemeral links on WeTransfer. They are both part of the build phase.
- **Decryption location.** - It is not yet decided if the build will move decryption to the Service Worker using fetch interception, or if it will be an explicit download via the message channel.
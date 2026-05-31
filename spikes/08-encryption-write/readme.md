# Spike 08: Encryption Write Path

## Goal

Before uploading, encrypt each part within the Service Worker, ensuring only ciphertext departs the browser. The server signs the URL, and R2 stores the object, without either ever encountering plaintext. The scope does not include round-trip decryption, per Spike 09.

## What's New

- **`encryption.js`** (new) - a dedicated crypto module, independent of upload or messaging functionalities. getEncryptionKey: Hashes a key string to 32 bytes using SHA-256 and imports it as an AES-GCM key. encryptFilePart: Encrypts a file segment and provides the output.
- **`sw.js`**: `uploadParts` now generates the key once for the entire upload, retrieves each chunk as an `arrayBuffer()`, encrypts it using `encryptFilePart`, and transmits the encrypted bytes via PUT, replacing the original chunk.
- All other aspects remain the same as Spike 07.

## How to Run

1. Remove the current Service Worker (use DevTools > Application > Service Workers > Unregister). A normal reload won't detect a code change in a module worker, leading to a stale worker uploading plaintext without warning.
2. Execute `npx serve` from within the spike directory.
3. Choose a file, then click Upload.
4. Retrieve the object from R2 and verify that it is corrupted and not the original file.


## Key Findings

- **Ciphertext confirmed on R2.** - The downloaded segment consists of unreadable binary data, not the original file. The live process includes encryption; it's not an assumption.
- **Format is `[IV][ciphertext + tag]`.** - Each segment begins with a 12-byte random IV and concludes with a 16-byte GCM tag. Encryption adds 28 bytes per part. While not confidential, the IV is necessary for decryption, hence its inclusion with the ciphertext. Spike 09 returns it to its previous state.
- **Key derived once per upload** - not per part. One import that serves every chunk.
- **Failed encryption aborts cleanly.** - During debugging, if the encrypt call failed, the current error handling would cause the server to cancel the upload and the local record to be removed. There are no incomplete uploads when encryption fails.

## What Broke

- The IV-prepend was initially directed at incorrect variables (the key rather than the IV and ciphertext), leading to the potential shipment of the key instead of the data.
- A stale worker concealed the initial correct version, leaving uploads visible until the worker was deregistered.
- The `encryptFilePart` call had a reversed argument order, which was detected by a console error.

## Open Questions

- **Key handling is provisional.** - The key is a hardcoded test string, and SHA-256 of a string is not a real password KDF. PBKDF2 or Argon2id is the parked decision for a later spike. Build phase will allow the user to specify a zero knowledge encryption key.
- **IV is random per part, preferred to an alternative strategy.** - When using 12 bytes, the risk of a collision for parts of a single file is insignificant. However, random initialization vectors (IVs) with one key have a non-zero risk of reuse, which would be eliminated by using a counter. Noted for the build phase.
- **Key is neither persisted nor transmitted.** - The same key is required for decryption. The location of the key (either linked fragment for zero-knowledge or server-held for convenience) is determined during the build phase, not by Spike 08.

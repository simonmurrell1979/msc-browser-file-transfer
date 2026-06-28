# Build Log

**Project:** Resilient and Confidential Browser-Based File Transfer Application

**Programme:** MSc Computing, Birkbeck, University of London

A build log: detailing progress slice by slice, design choices and research insights. Each functional slice of the layered Angular application is built with spike capabilities integrated incrementally, confirmed by a log of checkpoints.

---

## Overview

A browser-based application for sending big files through to a recipient. Encryption of files happens on the client before they are uploaded. Plaintext and keys are never visible to the server component of the application. Uploads are divided into chunks, allowing them to resume if the network fails.

The research covers two areas: browser-based transfer **resilience** (including resumable uploads and failure recovery) and client-side **zero-knowledge encryption**.

Three separated layers:

- **Angular 22 SPA:** client, file selection, encryption, and orchestrating chunked uploads.
- **ASP.NET Core REST API:** acts as a session coordinator and R2 transport signer, with its code in `RestAPI -> Services -> Common`.
- **Cloudflare R2:** Object storage that matches S3 standards, storing only ciphertext.

Client services reflect the server division (how they stand currently):

- **`StorageService`:** transport. Each `StorageController` action should have its own method.
- **`UploadService`:** Manages the overall process. Is responsible for the upload workflow. Where resilience logic resides.

---

## Progress timeline

| # | Slice                                         | Spike origin                      | Status                                |
|---|---                                            |---                                |---                                    |
| 0 | Kernel pipe (SPA <-> API <-> R2)              | N/A                               | Complete (26 June)                    |
| 1 | Single-file presigned PUT                     | Spike 02                          | Complete (27 June)                    |
| 2 | Multipart upload                              | Spike 03                          | In progress                           |
| 3 | Real-time upload progress visibility          | N/A                               | Planned (deliverable)                 |
| 4 | Resume / IndexedDB session persistence        | Spike 04                          | Planned                               |
| 5 | ListParts reconciliation                      | Spike 05                          | Planned                               |
| 6 | Service Worker plumbing                       | Spike 06                          | Planned                               |
| 7 | Service Worker upload loop                    | Spike 07                          | Planned                               |
| 8 | Chunked encryption write path                 | Spike 08                          | Planned                               |
| 9 | Chunked decryption read path                  | Spike 09                          | Planned                               |
| 10 | Share URL with key in fragment               | N/A                               | Planned                               |
| 11 | Download / receive screen                    | N/A                               | Planned                               |
| 12 | End-to-end integrity check                   | N/A                               | Planned (deliverable)                 |
| 13 | IndexedDBChunkSource                         | N/A                               | Nice-to-have (else Future Work)       |

IndexedDBChunkSource enables the Service Worker to access previously stored chunks. The Service Worker upload loop (07) and the encryption paths (08 and 09) must be completed before this can be built. As a result, it is positioned after Spike 09. The default is the standard FileChunkSource. The IndexedDB version is optional and will be skipped if there is not enough time. It is also limited to Chromium based browsers.

Each row with (deliverable) indicates one of the four measurable project deliverables. Row 3 shows real-time progress visibility. Row 12 is for the end-to-end integrity check. The final two tasks involve pausing and resuming functionality during network interruptions.

---

## Session entries

### 26 Jun 2026: Kernel pipe proven

The whole pipe was tested from end to end. The Angular 22 SPA makes a cross-origin call to the .NET REST API. The R2 connectivity check then returns it as a typed `ApiResponse` displayed in the UI. Being a real round trip this cannot be a test so all layers of wiring have been checked and each following slice is the same.

Angular 22.0.3 (CLI 22.0.4), TypeScript 6.0.3, and Node 22.22.3 makes up the stack. There is a Vitest test runner, an ASP.NET Core backend, and Cloudflare R2 for storage.

Several client architecture principles were locked in:

- The `HttpClient` should not be called by a component. It always goes through a typed service.
- When injecting dependencies, always use `inject()`; do not construct services with `new`.
- Each service is designed for a single, specialised function, rather than a large, all-encompassing `ApiService`. The services are organised in a flat `src/app/services/` directory.
- The shared response contract lives in `models/` and relects the server`s types (PascalCase).

The combination of `UsePathBase("/api/")` and `[Route("[controller]/[action]")]` in routing gives paths like `/api/Storage/TestConnection`. The CORS policy allows `localhost:4200` and `UseHttpsRedirection` was removed to allow for local HTTP testing.

### 27 Jun 2026: Slices 1 and 2

**SPA shell and send screen.** The application now has its skeleton in place. The `pages/send` route is loaded lazily as a separate component. The empty router path redirects to `send`. The `app.html` frame contains a header, a `router-outlet`, and a footer. The header and footer are located within the `layout/` directory. 

The folder structure is finalised: 

- `pages/` for screens that are routed.
- `layout/` for the surrounding UI.
- `models/` for the storing of all models replicated from the .NET REST API.
- `services/` will be at the top level to store all the services. 

The `selectedFile` signal is updated when a file is chosen. Bootstrap 5 and the self-hosted Aeonik font already implemented.

**Slice 1, single-file presigned PUT (Spike 02). Green.** This was proven with a real file landing in R2.

- `StorageService.getUploadUrl(objectKey)` generates a signed PUT URL through a typed GET request.
- `UploadService.uploadFile(file)` gets that URL and then performs a raw `fetch` PUT directly to R2.
- The division was deliberate. The presign call uses the typed `HttpClient` for consistency with the client, while the R2 upload uses a `fetch` to avoid interference from `HttpClient` interceptors or JSON handling as it`s a cross-origin binary upload.

**Findings:**

- **Async model:**  Async model: `HttpClient` observables are converted to promises when crossing the transport boundary, using `firstValueFrom`.Observables do not go beyond `StorageService`. AbortController will be employed for canceling resume operations mid-flight.
- **ETag asymmetry (from Spike 05):** ETags from PUT responses are enclosed in quotes, unlike those from ListParts. It is worth mentioning in the report the difference at the integration point. Quotes are removed on capture using `.replaceAll('"', '')`.

---

## Locked decisions (report-bound)

### Methodology framing

The HTML and JavaScript pages from the spike phase are throwaway artefacts; their source is kept only as evidence. The spike .NET REST API was treated differently. It was already built during the spike phase in the layered `RestAPI -> Services -> Common` structure, and was carried forward unchanged as the baseline for the Phase 2 kernel. The intended framing for the report is that this API was a stable baseline serving a series of disposable probes, rather than a system built up incrementally across the spikes. In other words it is salvage rather than continuity, which keeps the boundary between the spike phase and the build phase clean.

### Zero-knowledge custody model

The sender's browser holds the encryption key. The key lives in the URL fragment (`download/{id}#{key}`) and never reaches the server, so a WeTransfer-style "log in and view your sends" is impossible by design. If the sender clears their browser storage, they lose the key: the ciphertext stays on R2 but can no longer be opened through the app, which is the intended behaviour. The recipient is not affected, because their link already carries the key. The trade-off is simple to state: this design moves trust from the server to the client, and the price is that the server can never recover a lost key. The value that ties a transfer together is the `uploadId`, not the sender's identity.

### Cryptography

The key derivation function is PBKDF2. It was chosen because it is built into the Web Crypto API (SubtleCrypto), which keeps the design to platform primitives only. The parameters follow NIST SP 800-132, with a high iteration count in line with OWASP guidance. Argon2id was considered but deferred to Future Work, since it would require an external WASM or JavaScript library and so break the platform-primitives rule.

The cipher is AES-GCM applied directly to a password-derived key, rather than envelope encryption with a separate data key and key-encrypting key. This is justified by the single-sender, link-based model, which has no multiple recipients, key rotation, or hardware security module to account for. Encryption is done per chunk, and each chunk has its own random 12-byte initialisation vector prepended to the ciphertext. The IV is not secret; only the key is, and the key travels solely in the URL fragment.

The design also shifts cost to the edges. The sender's browser does the encryption, the ciphertext sits on R2 with no egress charge, and the recipient's browser does the decryption. The server only moves bytes; it is pure transport.

### Abuse control (report-only, to be built)

Malicious content cannot be solved within a zero-knowledge design, because the server cannot scan what it cannot decrypt. This is acknowledged as a limitation rather than something the project attempts to fix. Volume abuse, by contrast, can be made harder. The chosen approach is a one-time password per send together with a CAPTCHA, both of which work without accounts and rely only on metadata, so zero-knowledge is preserved. WeTransfer already uses a one-time password per send, which sets a mainstream precedent. IP-based rate limiting was rejected, because it punishes innocent users behind shared addresses while abusers simply rotate IPs. The one-time password would be delivered through a transactional email service such as Resend, which is named as a concrete choice but not built. The honest bound on all of this is that it raises the cost of abuse rather than preventing it outright.

### Deployment

The application is deployed as two separate Railway services, one for the API and one for the SPA, rather than serving the SPA as static files from the API. This mirrors the separation in the codebase and keeps the clear split between the control plane (the API, which coordinates) and the data plane (the SPA as client, with R2 as external storage). The trade-off is that the two origins need CORS configured between them, which is trivial but real. The academic instance runs on an unadvertised Railway subdomain, but this obscurity is only a deployment convenience and is not treated as a security control. Restricting access by allow-listing a domain was considered and rejected, because it would reintroduce the notion of identity that the accountless design deliberately avoids.

### Lifecycle (accountless)

Cleanup and expiry are keyed to the uploadId rather than a sender's email, in keeping with the accountless design. Two lifecycle mechanisms handle this, both configured on R2 rather than written in code: incomplete multipart uploads are aborted after a set number of days to clear orphaned parts, and completed objects expire after a set number of days.

### Deferred polish: Unsplash backgrounds (similar to WeTransfer)

This is presentation only and must not jump ahead of the functional slices. When it is built, the requests will be proxied through the .NET API so that the access key stays on the server and is never embedded in the client. It is scheduled for the final polish pass, ahead of the demo.
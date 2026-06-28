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

IndexedDBChunkSource enables the Service Worker to access previously stored chunks. The Service Worker upload loop (07) and the encryption paths (08 and 09) must be completed before this can be built. As a result, it is positioned after Spike 09. The established FileChunkSource is the default. The IndexedDB version is optional and deferred if time is short, given its limited browser support (Chromium only).

Each row with (deliverable) indicates one of the four measurable project deliverables. Row 3 shows real-time progress visibility, while row 12 is for the end-to-end integrity check. The final two tasks involve pausing and resuming functionality during network interruptions (as noted in row 4), and confirming the successful transfer of data through an integrity check.

---

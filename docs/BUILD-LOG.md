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

## Session entries

### 26 Jun 2026: Kernel pipe proven

The entire pipe was tested from one end to the other. The Angular 22 SPA sends a request, through a cross-origin call, to the .NET REST API. An R2 connectivity check then returns it as a typed `ApiResponse` shown in the user interface. Because this was an actual round-trip and not a test, every layer of wiring has been verified, and each subsequent slice travels the same path.

Angular 22.0.3 (CLI 22.0.4), TypeScript 6.0.3, and Node 22.22.3 comprised the stack, along with the Vitest test runner, an ASP.NET Core backend, and Cloudflare R2 for storage.

Several client architecture principles were locked in:

- The `HttpClient` should not be called by a component. It always goes through a typed service.
- When injecting dependencies, always use `inject()`; do not construct services with `new`.
- Each service is designed for a single, specialized function, rather than a large, all-encompassing `ApiService`. The services are organized in a flat `src/app/services/` directory.
- The shared response contract lives in `models/` and mirrors the server`s types (PascalCase):

```typescript
export interface ApiResponse {
    Success: boolean;
    ErrorMessage?: string;
}

export interface ApiResponseWithData<T> extends ApiResponse {
    ReturnedObject?: T;
}
```

The combination of `UsePathBase("/api/")` and `[Route("[controller]/[action]")]` in routing results in paths like `/api/Storage/TestConnection`. The CORS policy permits `localhost:4200` and `UseHttpsRedirection` was eliminated to enable local HTTP testing.

### 27 Jun 2026: Slices 1 and 2 (single PUT and multipart)

**SPA shell and send screen.** The application now has its frame in place. The `pages/send` route is loaded lazily as a standalone component. The empty router path redirects to `send`. The `app.html` frame consists of a header, a `router-outlet`, and a footer. The header and footer are located within the `layout/` directory. 

The folder structure is finalized: 

- `pages/` for screens that are routed.
- `layout/` for the surrounding UI.
- `models/` for the storing of all models replicated from the .NET REST API.
- `services/` will be at the top level to store all the services. 

The `selectedFile` signal is updated when a file is chosen, with Bootstrap 5 and the self-hosted Aeonik font already implemented.

**Slice 1, single-file presigned PUT (Spike 02). Green.** This was proven with a real file landing in R2.

- `StorageService.getUploadUrl(objectKey)` generates a signed PUT URL via a typed GET request.
- `UploadService.uploadFile(file)` gets that URL and then performs a raw `fetch` PUT straight to R2.
- The division was intentional. The presign call uses the typed `HttpClient` for uniformity with the client, while the R2 upload utilizes a direct `fetch` to avoid interference from `HttpClient` interceptors or JSON processing, as it`s a cross-origin binary upload.

**Findings:**

- **Async model:**  Async model: `HttpClient` observables are converted to promises when crossing the transport boundary, using `firstValueFrom`.Observables do not go beyond `StorageService`. AbortController will be employed for canceling resume operations mid-flight.
- **ETag asymmetry (from Spike 05):** ETags from PUT responses are enclosed in quotes, unlike those from ListParts. It is worth mentioning in the report the difference at the integration point. Quotes are removed on capture using `.replaceAll('"', '')`.

---

## Locked decisions (report-bound)

### Methodology framing

The HTML and JavaScript pages from the spike phase are throwaway artefacts; their source is kept only as evidence. The spike .NET REST API was treated differently. It was already built during the spike phase in the layered `RestAPI -> Services -> Common` structure, and was carried forward unchanged as the baseline for the Phase 2 kernel. The intended framing for the report is that this API was a stable baseline serving a series of disposable probes, rather than a system built up incrementally across the spikes. In other words it is salvage rather than continuity, which keeps the boundary between the spike phase and the build phase clean.


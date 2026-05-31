# Spike 07: Upload Loop in the Service Worker

## Goal

The multipart upload loop should be migrated from the page to the Service Worker. Consequently, the page will act as a thin controller, and the Service Worker will function as the upload engine. Demonstrate that new uploads, resume-across-interruption, completion, and cancellation function correctly when controlled by the worker via the message channel verified in Spike 06.

The scope is limited to FileChunkSource, meaning the page provides the live `File` reference to the worker a single time, and the worker then handles chunk slicing as needed. This here resolves the chunk-source decision mentioned in Spike 06 (refer to Architecture).

## What's New

The codebase now includes two new modules and has been reorganised into a controller/engine structure:

- **`messagetype.js`** - (new) a shared, immutable `MessageType` object for the page and worker. Having a single source for message vocabulary means that incorrect commands will be rejected forcefully instead of being missed.
- **`swcomms.js`** - (new) the page-side Service Worker boundary. The process involves registering the worker as a module, waiting for it to be ready, attaching the inbound listener, and finally exposing `sendCommand`. It utilises an injected message handler that doesn't interpret messages, thereby sidestepping a circular import issue with `upload.js`.
- **`api.js`** - control-plane client (extracted in the lead-up to this spike). postJSON is not accessible publicly, but its typed wrapper functions are. The wire format and response envelope are exclusively located here.
- **`sw.js`** is now handling uploads. Contains `uploadParts`, `newUpload`, `resumeUpload`, `cancelUpload`, `completeUpload`, a worker-side `logMessage` for page posting, and a message router.
- **`upload.js`** — now a thin controller. It fetches the latest upload for loading, sends commands upon button clicks, and displays worker reports.
- **`db.js`**, **`index.html`** — unchanged.

### Message protocol

Page to Worker (commands): `NEWUPLOAD` (requires `file`), `RESUMEUPLOAD` (requires `file` and `uploadId`), `CANCELUPLOAD` (requires `objectKey` and `uploadId`).

Worker to Page (events): `LOGMESSAGE` (user-friendly status updates), `COMPLETEUPLOAD` (final success signal, page buttons reset).

## How to Run

1. For the origin, unregister any current Service Worker one time (in DevTools, under Application, then Service Workers, select Unregister). On a regular reload, a prior classic-mode worker is not substituted by module-mode registration.
2. To perform a clean resume/cancel test, empty the `uploads` store in IndexedDB.
3. Execute `npx serve` within the spike directory.
4. Choose a file, then click Upload. The entire process, from starting the chain and creating records to including ETags and full stream data in the page status block, is managed by the worker.

To test resume functionality: Initiate a large file upload, then interrupt it midway (using DevTools, Network tab offline, or by stopping the API). Refresh the page with F5, re-select the identical file, and click Resume. The worker reloads the record, compares it to the server, bypasses the uploaded sections, and completes the remainder.

## Architecture

**Page as controller, worker as engine.** The page bypasses the upload loop entirely. It chooses a file, sends a command, and shows the status. The worker handles all control-plane calls, the PUT loop, and IndexedDB writes.

**The realm boundary forced the move as one unit.** The page and the worker exist in separate JavaScript worlds. They are unable to invoke one another's functions, only communicate through messages. `uploadParts`, `newUpload`, and `resumeUpload` are interdependent, necessitating their relocation as a single unit because a worker function cannot await a function residing on the page.

**Worker-side `logMessage`.** - The `logMessage` function in the worker was updated to send a `LOGMESSAGE` event rather than modifying the DOM. This allowed the moved engine code to function without alterations, as the existing `logMessage(...)` calls now communicate through the channel.

**Chunk source: decision resolved.** - Spike 07 is tasked with deciding between FileChunkSource and IndexedDBChunkSource, as Spike 06 left this choice unresolved. Using **FileChunkSource**, the page gives the worker a live `File` reference, allowing the worker to slice as needed. This system can resume operations after network failures, keeping the webpage active. Even if the tab that started an upload is closed, the upload will finish because the worker maintains the File reference throughout its execution. This doesn't account for cold resumes—restarting an incomplete upload without a live page or file reselection as the File resides in page memory and is lost when no page references it. IndexedDBChunkSource is still the way to handle this, and it's being postponed until the build phase for progressive enhancement on Chromium. Check out the "Open Questions" part.

## Key Findings

- **The upload loop survives a page refresh.** Since the loop operates within the worker, an F5 mid-upload won't interrupt it; the worker continues its PUT operations, and a reselect-and-resume on the refreshed page will seamlessly continue. The essential resilience benefit of relocating the loop was that it prevented the page from failing along with it, which was the previous design's critical flaw.
- **`event.waitUntil` keeps the worker alive through the loop.** Encasing `newUpload`/`resumeUpload` within `event.waitUntil` during dispatch. This ensures the browser knows the message event is active until the upload is done, so the worker isn't stopped mid-loop.
- **`clients.claim()` removes the first-load control gap.** If this is absent, a newly registered worker will not manage the page until a refresh, meaning the initial command will be lost.
- **Module-mode registration is required for worker imports.** By registering with `{ type: "module" }`, `sw.js` can import `api.js`, `db.js`, `messagetype.js`. The old worker needs to be deregistered for the new one to be valid.
- **Resume reconciliation works inside the worker.** In the worker context, the Spike 05 server-wins reconciliation process (listing multipart upload parts and building a skip set) functions without issues. The 22-part upload was interrupted at part 13, then continued from part 14 to 22, skipping the earlier parts, and was finished.
- **The injected-handler pattern keeps the comms module pure.** - `swcomms.js` receives raw message data from the page, thus bypassing any imports from `upload.js`. This method avoids a circular dependency, enabling the page to specify message interpretations.

## Open Questions

- **Multi-client reporting.** The service worker communicates with only one `serviceWorkerClient` at a time, which is the most recent one to send it a message. During a prior in-flight refresh, duplicate logging occurred because two pages were momentarily connected. This cannot be replicated using the normal upload, refresh, and resume process. Work on robust reporting, focusing on client-specific upload ownership and the removal of defunct clients, is scheduled for the build phase.
- **Cancel scope.** The cancellation process here manages the pending state, specifically the resume state upon loading. It involves aborting on the server and removing the record. Deciding to cancel an ongoing upload is a matter of scope, not a flaw in this spike, as the loop operates without a live page connection (the worker persists longer than the page), meaning there's no mid-loop cancellation feature to offer. The application UI in the build is responsible for managing cancellation against the worker's state, ensuring cancel-during-upload is handled at the UI level instead of through a flag the worker checks periodically.
- **Structured progress.** Progress is communicated via `LOGMESSAGE` text lines, rather than structured events with part and total counts. A functional progress bar is part of the build phase.
- **Tab-close survival.** After the originating tab closes, an upload finishes because the worker keeps the File reference for the active loop. Testing for cold resume of incomplete uploads, where there's no live page and file reselection isn't possible, has not been done. FileChunkSource cannot achieve cold resume because the file is in page memory and ceases to exist when no page retains it. The IndexedDBChunkSource is still the way to handle this scenario and is postponed until the build phase, specifically for Chromium. However given the project plan and timelines during the build phase, the IndexedDBChunkSource may be referred to the final report as a future enhancement of the project?
- **Single-upload scope.** The `uploadInProgress` guard is designed to handle only a single upload concurrently. Spike is not intended for concurrent uploads.
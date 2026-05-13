# Spike 04: IndexedDB Persistence

## Goal

Prove that an active multipart upload’s status can be stored in IndexedDB and retrieved following a page reload, allowing the upload to continue from its last point without re-sending processed parts.

## What's New

- The 'db.js' module simplifies IndexedDB interactions by encapsulating operations such as 'saveUpload', 'getUpload', 'getUploads', 'deleteUpload', 'findLatestUpload', 'createUploadRecord', and 'addUploadedPart'.
- Record structure: each upload is a single record identified by 'uploadId', containing an array of completed parts.
- The file's fingerprint (name, size, lastModified) is stored with its upload status to confirm that the user picks the exact same file when resuming.
- 'upload.js' has been refactored into 'uploadParts' (for the shared loop), 'newUpload' (to orchestrate new uploads), and 'resumeUpload' (to orchestrate resumed uploads). A small dispatcher now handles the click events.
- When the script loads, IndexedDB is checked for any ongoing uploads.
- Flow cancellation: A direct user action triggers an Abort on R2, then clears the IndexedDB record. If R2 is not accessible, it reverts to local-only cleanup.

## How to Run

1. Run the ASP.NET Core project.
2. Launch the browser client by executing 'npx serve' on port 3000.
3. Pick a file; since it's multi-part, it will be over 5 MB.
4. Begin the upload and then close the tab mid-process.
5. The page should reopen with "Resume Upload" displayed on the button and the log should indicate N out of M parts have been uploaded.
6. Choose the same file again and press Resume.
7. Verify that the missing parts have been uploaded, the fires have been completed, and the assembled object is visible on the R2 bucket dashboard.

## Key Findings

- **R2 multipart provides server-side transport resumability for free.**
Once started, R2 will retain parts forever. Clearing them needs an explicit Complete or Abort command, or a bucket lifecycle rule. The project's value lies in the client-side state-persistence layer, not in transport resumability itself, enabling functionality even after browser crashes.

- **Browsers cannot restore file selection across sessions.** 
For security reasons, every browser intentionally discards the File reference when a tab is closed. Resuming necessitates either complete user re-selection using <input type="file"> or immediate permission granting through the File System Access API on Chromium browsers. A browser cannot achieve zero-interaction resumes, and this is not an issue requiring a fix.

- **IndexedDB holds the upload "plan", R2 holds the "facts".** 
The local record includes the file fingerprint and its planned part breakdown. R2 indicates the parts that have physically arrived. Spike 04 relies on the local record. Spike 05 (ListParts reconciliation) will confirm it.

- **JavaScript fails silently against incorrect property casing.** 
record.objectKey versus record.ObjectKey serializes to an empty string with JSON.stringify. The problem is only detected at the server's validation check, which is far from where it started. It was encountered twice during this spike. Worthy of being highlighted as a failure mode typical of dynamic typing.

- **Read-modify-write for incremental progress is acceptable at small part counts.** 
A successful segment initiates a 'getUpload', mutation, and 'saveUpload' sequence. With approximately 1,000 parts, the total overhead is less than one second. Measuring batching (writing every N parts) is worthwhile for larger quantities.

## Open Questions

Spike 04 relies on the IndexedDB record for upload state information. If R2's real status differs from its local record, such as a part PUT succeeding without saving or a bucket rule deleting old parts, the resume might try to Complete with ETags R2 doesn't recognize. Spike 05 centers on reconciling with R2's actual state using the 'ListParts' operation.

To restart, Spike 04 needs a button click from the user once the page has loaded. Uploads halt if the user leaves the page, closes the tab, or the browser crashes. R2's status is fine, yet the upload is on hold until the user resumes it. Saving the upload's execution context past the page's life, through a Service Worker, is the focus of Spike 06.
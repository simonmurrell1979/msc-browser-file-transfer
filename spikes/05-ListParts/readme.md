# Spike 05: ListParts Reconciliation

## Goal

Demonstrate that upon resuming, the IndexedDB record can be matched with R2's actual state using the S3 `ListParts` operation, ensuring the upload continues based on server truth instead of the optimistic local cache.

## What's New

- The `IR2StorageService` now includes a `ListMultipartUploadParts` operation, which is a wrapper for the AWS SDK's `ListPartsRequest`. It returns `List<UploadPart>`, which `CompleteMultipartUpload` also accepts, allowing the reconciled list to be used downstream immediately without another DTO.
- The client can now access the operation through a new `/ListMultipartUploadParts` controller action.
- Prior to the upload loop, `resumeUpload` within `upload.js` contacts `/ListMultipartUploadParts`, updates `existingRecord.uploadedParts` from the server's data, and then saves it via `saveUpload`. The reconciled record, not the raw one, is used to construct the `skippedParts` set.
- The reconciliation process results in the server's part list completely overriding the local one. `ListParts` acts as the trust anchor, bypassing any merge or negotiation; IndexedDB is listening.

## How to Run

1. Execute the ASP.NET Core project.
2. To start the browser client, run `npx serve` on port 3000.
3. Choose a file larger than 5 MB to activate multipart uploading.
4. Start the upload, then close the tab before it's finished.
5. Upon reopening the page, you'll see "Resume Upload."
6. Choose the file again and click Resume.
7. Note the log entry: "Reconciled with server.Prior to the resume loop commencing, "N parts confirmed on R2."
8. Confirm the upload is finished and the object is visible on the R2 bucket dashboard.

## Key Findings

- **`ListParts` and the upload PUT response have differing ETag quote conventions.**
The S3 multipart upload PUT response includes ETags enclosed in literal double quotes (e.g., `"abc123..."`), as discovered in Spike 03, whereas `ListPartsResponse.Parts[].ETag` returns them unquoted. The discrepancy remains undetected until the combined data is checked against the local storage, revealing a mismatch. Because the client handles quote stripping upon upload, the server method doesn't need to do so when listing. 

- **The optimistic local cache functions correctly under ideal circumstances and incorrectly at crucial moments.**
The uploadedParts of existingRecord and R2 will match if all UploadPart operations and all IndexedDB writes are successful. Reconciliation lacks visibility. It's useful for the failure scenarios that the spike is designed to address, such as a response that gets lost, a write operation interrupted during a transaction, a bucket lifecycle rule deleting incomplete parts, or a resume action starting from an IndexedDB record that predates a server-side change. By expending one call per resume, `ListParts` eliminates a whole category of failures.

- **We must keep reconciling; it cannot be forgotten.**
The initial version of the implementation modified `existingRecord.uploadedParts` using JavaScript without invoking `saveUpload`. The temporary edit in memory was enough for the resume to finish, but it disappeared when the tab was closed. A subsequent reload would re-read the stale base record if a second failure happened during the resume process. Before the upload loop starts, the corrected truth must be written back to IndexedDB, or the spike's thesis ("IndexedDB reflects server truth on resume") will only be valid in memory.

- **db.js is solely for data storage.**
In `upload.js`, you'll find the `postJSON` call for `/ListMultipartUploadParts`. `db.js` is exclusively aware of IndexedDB. Spike 04's `db.js` for IndexedDB and `upload.js` for uploads established a clean separation, and keeping the API boundary out of the storage layer preserves this.

## Open Questions

- **`ListParts` offers a maximum of 1,000 parts per invocation, utilizing `PartNumberMarker` / `IsTruncated` for pagination.** At the current 5 MB part size, files for single-page covers can reach ~5 GB, adequate for spike validation. Paging is a mechanical process that doesn't alter the reconciliation thesis. For the long run, the solution likely involves adjusting `partSize` based on file size to maintain a part count below the single-page limit, rather than using paging. This will be revisited during the build phase.

- **No deliberate drift testing yet.** We can confirm the correctness of the natural-resume case due to this spike. Simulating a desynchronized local record and server, such as a failed bucket lifecycle reap or a missing UploadPart response, is for testing purposes, not development. This should be part of the evaluation phase's fault-injection protocol, not a separate experiment.

- **Spike 06 (Service Worker resilience) addresses the remaining gap from Spike 04:** Users need to click "Resume" again if the page reloads. By integrating the upload loop into a Service Worker, it gains the ability to run autonomously from the page's event loop and relay progress updates via messaging.
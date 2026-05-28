# Spike 03: Multipart Upload

## Goal

Show how to use the browser to upload a file to Cloudflare R2 in segments via the S3 multipart upload protocol, with an ASP.NET Core backend managing initiation, pre-signed part URLs, completion, and abortion, while keeping credentials hidden from the client.

## What's New

- Added multipart upload service methods to `R2StorageService`.
  Initiate, GeneratePartUploadUrl, Complete, Abort- Four controller endpoints (one for each service method), all using POST requests with JSON bodies through the existing `JsonResponseFactory` envelope.ope.
- Browser client expanded to:
  - Start the upload and get an `uploadId`.
  - Split the chosen file into five-megabyte segments with `file.slice()`.
  - Generate a fresh presigned URL for every part as required.
  Send each part to R2 and get the ETag.
  - The upload will be completed once the part manifest is collected.
  - Cancel the upload upon any failure.
- A `postJSON` helper function was created to simplify fetch requests by reducing repetitive code.

## How to Run

1. Run the ASP.NET Core project.
2. Launch the browser client by running `npx serve` on port 3000.
3. Go to Select File, then click Upload.
4. Check the status output for individual part ETags and the Complete confirmation.
5. Ensure the complete file is visible on the R2 bucket dashboard, not listed as an "Ongoing Multipart Upload."

## Key Findings

- R2 includes ETags within literal quote characters in the response header, such as `"abc123..."`. The part manifest needs to have its quotes removed on the client side before being sent to Complete; otherwise, R2 will reject it for being malformed XML.
- ASP.NET Core's default binder is unable to JSON-deserialize ValueTuples. A request parameter of type  `List<(string ETag, int PartNumber)>` will bind to empty tuples without warning.
- Introducing naming conflicts between custom DTOs and AWS SDK request types is simple. The `InitiateMultipartUploadRequest` and `CompleteMultipartUploadRequest` classes are present in both `Amazon.S3.Model` and your project's `Models.Uploads` namespace. Ambiguity is avoided by renaming the project's DTOs.
- Failed test runs lead to orphaned multipart uploads on R2. Initiates that are not completed or aborted will remain in the bucket forever. The Cloudflare dashboard displays this as "Ongoing Multipart Upload" entries, which is why the Abort endpoint and bucket lifecycle rules exist.
- The presigning operation involves local cryptographic work, not a network call to R2, as seen in the .NET `GetPreSignedURL` function. Instead, it calculates the signature solely based on the client's credentials and the request's parameters. This establishes the control plane and data plane separation: servers sign, and clients upload.
- For files smaller than 5 MB, multipart uploads are functional, yet they involve three extra transfers when contrasted with a single PUT request. The minimum size for non-final parts in R2 is 5 MB.
The anticipated production method involves splitting based on size, differentiating between single-PUT and multipart.
  
## Open Questions

This version is not prepared for browser lifecycle events. Should the tab close during an upload, the `uploadId`, the part-to-byte-range mapping, and the accumulated ETags will be lost from memory. Spike 04 concentrates on saving and restoring upload status in IndexedDB between user sessions.
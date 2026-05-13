# Spike 01: R2 Connectivity

## Goal

Establish that the connectivity to Cloudflare R2 from an ASP.NET Core backend,
including presigned URL generation and successful object upload via PowerShell.

## What's New

- Configuring Cloudflare Accounts.
- Configuring S3 Bucket + permissions + CORS, etc.
- Setting up initial ASP.NET API with AWS libraries configured for R2 account.
- Setting up directory structures for the project going forward.
- 'GetUploadUrl' endpoint is built to generate presigned URLs.
- PowerShell test to ensure the controller is working and files are being uploaded via presigned URLs.

## How to Run

1. Run the ASP.NET Core project.
2. Run the PowerShell script via .\upload.ps1.
3. Confirm the test.txt file is uploaded to the R2 bucket.

## Key Findings

- CORS configuration was not applicable given it was not running via the browser but instead via PowerShell script.
  
## Open Questions

PowerShell proves the API works but doesn't exercise browser-specific concerns 
(CORS in practice, File API, MIME handling). Addressed in Spike 02.
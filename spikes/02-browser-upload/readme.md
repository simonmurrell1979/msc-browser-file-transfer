# Spike 02: Browser Upload

## Goal

Show how a browser can send a file to Cloudflare R2 using a presigned URL from an ASP.NET Core backend, keeping credentials hidden from the client.

## What's New

- Added an HTML and JavaScript client for browser-based uploads.
- Choosing files with <input type="file"> and the browser File API.
- File bytes are sent straight to R2 using 'fetch' and the 'PUT' method.
- Tested the R2 bucket's CORS settings through practical application.

## How to Run

1. Execute the ASP.NET Core project.
2. Navigate to your HTML file via the browser client.
3. Choose a file and then click the Upload button.
4. Make sure the file has been uploaded to the R2 bucket.

## Key Findings

- No key findings bar updating the CORS policy to ensure npx serve can run on port 3000 along with the existing port 4200.
  
## Open Questions

Using a single PUT request, the entire file is uploaded. If the connection fails, there's no recovery, progress is unseen, and files exceeding browser request capacity won't work. Spike 03 addresses this.
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

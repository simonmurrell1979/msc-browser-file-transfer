# Resilient and Confidential Browser-Based File Transfer

MSc Computing final project (File Transfer Application) - Birkbeck, University of London.

## Project Details

- **Author:** Simon Murrell
- **Supervisor:** Martyn Harris
- **Academic year:** April to September 2026

## Overview

A browser-based file transfer pipeline integrating chunked resumable upload with chunked client-side encryption, designed to deliver large files reliably and confidentially within the constraints of the modern browser execution environment.

## Stack

- **Client:** Angular, Web Workers, Service Workers, IndexedDB, Web Crypto API
- **Server:** ASP.NET Core
- **Storage:** Cloudflare R2

## Repository structure

- `/spikes` - spiked based prototypes, index shown below
- `/src` - source code for client and server application (REST API / Angular application)

## Spikes

Each isolated prototype is a runnable snapshot that includes its own README. Each spike addresses a single concern, achieved by isolating variables and thereby mitigating the integration risk that literature points to as the primary cause of failure in deployed encrypted file transfers.

**Storage and upload plumbing** 
- [Spike 01: R2 Connectivity](spikes/01-r2-connectivity/readme.md) - server-side, pre-signed R2 uploads. 
- [Spike 02: Browser Upload](spikes/02-browser-upload/readme.md) - Direct browser uploads via CORS with pre-signed URLs.
- [Spike 03: Multipart Upload](spikes/03-multipart-upload/readme.md) - The complete S3 multipart upload process. 

**Resilience and resumability** 
- [Spike 04: Resumability](spikes/04-resumability/readme.md) - Enabling IndexedDB to persist and resume sessions.
- [Spike 05: ListParts](spikes/05-ListParts/readme.md) - reconciles uploaded parts for servers. 
- [Spike 06: Service Worker Plumbing](spikes/06-service-worker-plumbing/readme.md) - enabling messages to flow back and forth between a page and its worker. 
- [Spike 07: Service Worker Upload Loop](spikes/07-service-worker/readme.md) - The Service Worker now handles the upload loop, which continues even after a page refresh.

 **Encryption** 
- [Spike 08: Encryption Write Path](spikes/08-encryption-write/readme.md) - The Service Worker will encrypt each part using AES-GCM prior to uploading. 
- [Spike 09: Encryption Read Path](spikes/09-encryption-read/readme.md) - Focuses on downloading and decrypting data, with verification for both single and multi-part transfers.

## Status

In development.

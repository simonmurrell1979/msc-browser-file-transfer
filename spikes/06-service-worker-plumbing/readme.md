# Spike 06: Service Worker Plumbing

## Goal

Show that the page is capable of sending a message to a Service Worker and obtaining a reply.

## What's New

- `sw.js` is a basic Service Worker for installation, activation, and message handling.
- `upload.js`: This file registers the Service Worker when the page loads. It also provides a sendServiceWorkerMessage(text) function for testing via the console.
- `index.html`: no changes from Spike 05.

## How to Run

1. Run `npx serve` in the spike folder.
2. Go to the page. The status indicates that the Service Worker is registered and prepared.
3. In the browser console, execute: `sendServiceWorkerMessage("hello")`
4. The page status block displays:
   - "Sent message to Service Worker."
   - "Received message from Service Worker: {"type":"REPLY","message":"Service worker received your message: hello"}"

## Key Findings

- **Function-declaration order matters in async modules.** Initially, calling a function before its declaration seemed to work due to hoisting, yet the message listener failed to attach. The issue was resolved by placing the declaration before the caller. 

- **The page's status block and the DevTools console are different surfaces.** `logMessage` writes to the page while `console.log` writes to DevTools. Debugging the wrong surface cost time.

## Architectural Note: Chunk Source Strategy

The Service Worker is unable to access the user's `File` once the tab is closed, as the page holds the reference, which is then lost. Spike 04 documented this same constraint. One possible architecture for Spike 07+ involves creating a `ChunkSource` abstraction that has two implementations.

- **FileChunkSource**  reads chunks from the live `File` reference. Low storage cost but file handle will be lost when the page dies with the page.
- **IndexedDBChunkSource**  reads chunks from IndexedDB. It uses double the storage for transfers as the local file + replicated file will be sent to IndexedDB. This should persist even if the browser tab is closed, provided the SW outlasts the page.

The runtime option aligns the user's choice between speed and storage efficiency or robustness and interruption tolerance with the platform's resilience limit. IndexedDBChunkSource is only useful on Chromium since Safari and Firefox close the SW with a hidden tab. Spike 07 is where the decision will be made.

## Open Questions

- Spike 07 moves the upload loop into the Service Worker. The page becomes a controller. the SW becomes the upload engine. The transport is the message channel that has been proven here.
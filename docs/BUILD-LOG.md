# Build Log

**Project:** Resilient and Confidential Browser-Based File Transfer Application

**Programme:** MSc Computing, Birkbeck, University of London

A build log: detailing progress slice by slice, design choices and research insights. Each functional slice of the layered Angular application is built with spike capabilities integrated incrementally, confirmed by a log of checkpoints.

---

## Overview

A browser-based application for sending big files through to a recipient. Encryption of files happens on the client before they are uploaded. Plaintext and keys are never visible to the server component of the application. Uploads are divided into chunks, allowing them to resume if the network fails.

# Resilient and Confidential Browser-Based File Transfer

MSc Computing final project — Birkbeck, University of London.

**Author:** Simon Murrell
**Supervisor:** Martyn Harris
**Academic year:** April to September 2026

## Overview

A browser-based file transfer pipeline integrating chunked resumable upload with chunked client-side encryption, designed to deliver large files reliably and confidentially within the constraints of the modern browser execution environment.

## Stack

- **Client:** Angular, Web Workers, Service Workers, IndexedDB, Web Crypto API
- **Server:** ASP.NET Core
- **Storage:** Cloudflare R2

## Repository structure

- `/spikes` — isolated prototypes exploring individual technical concerns
- `/src` — integrated system (client and server)

## Status

In development.

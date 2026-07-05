// src/environments/environment.development.ts
var environment = {
  production: false,
  apiBaseUrl: "http://localhost:5158/api"
};

// src/app/shared/filetransferapi.ts
var FileTransferApi = class {
  async getJson(url) {
    const response = await fetch(`${environment.apiBaseUrl}/Storage/${url}`);
    return await response.json();
  }
  async postJson(url, body) {
    const response = await fetch(`${environment.apiBaseUrl}/Storage/${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    return await response.json();
  }
  async getUploadUrl(objectKey) {
    const requestUrl = `GetUploadUrl?objectKey=${encodeURIComponent(objectKey)}`;
    const response = await this.getJson(requestUrl);
    return this.checkResponseWithData(response);
  }
  async getDownloadUrl(objectKey) {
    const requestUrl = `GetDownloadUrl?objectKey=${encodeURIComponent(objectKey)}`;
    const response = await this.getJson(requestUrl);
    return this.checkResponseWithData(response);
  }
  async initiateMultipartUpload(objectKey, contentType) {
    const requestUrl = "InitiateMultipartUpload";
    const requestBody = {
      objectKey,
      contentType
    };
    const response = await this.postJson(requestUrl, requestBody);
    return this.checkResponseWithData(response);
  }
  async generateMultipartUploadUrl(objectKey, uploadId, partNumber) {
    const requestUrl = "GenerateMultipartUploadUrl";
    const requestBody = {
      objectKey,
      uploadId,
      partNumber
    };
    const response = await this.postJson(requestUrl, requestBody);
    return this.checkResponseWithData(response);
  }
  async completeMultipartUpload(objectKey, uploadId, parts) {
    const requestUrl = "CompleteMultipartUpload";
    const requestBody = {
      objectKey,
      uploadId,
      parts
    };
    const response = await this.postJson(requestUrl, requestBody);
    return this.checkResponse(response);
  }
  async abortMultipartUpload(objectKey, uploadId) {
    const requestUrl = "AbortMultipartUpload";
    const requestBody = {
      objectKey,
      uploadId
    };
    const response = await this.postJson(requestUrl, requestBody);
    return this.checkResponse(response);
  }
  async listMultipartUploadParts(objectKey, uploadId) {
    const requestUrl = "ListMultipartUploadParts";
    const requestBody = {
      objectKey,
      uploadId
    };
    const response = await this.postJson(requestUrl, requestBody);
    return this.checkResponseWithData(response);
  }
  checkResponse(response) {
    if (!response || !response.Success) {
      throw new Error(response.ErrorMessage || "An error occurred while processing the request.");
    }
    return response.Success;
  }
  checkResponseWithData(response) {
    if (!response || !response.Success || response.ReturnedObject == null) {
      throw new Error(response.ErrorMessage || "An error occurred while processing the request.");
    }
    return response.ReturnedObject;
  }
};

// node_modules/idb/build/index.js
var instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
var idbProxyableTypes;
var cursorAdvanceMethods;
function getIdbProxyableTypes() {
  return idbProxyableTypes || (idbProxyableTypes = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function getCursorAdvanceMethods() {
  return cursorAdvanceMethods || (cursorAdvanceMethods = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
var transactionDoneMap = /* @__PURE__ */ new WeakMap();
var transformCache = /* @__PURE__ */ new WeakMap();
var reverseTransformCache = /* @__PURE__ */ new WeakMap();
function promisifyRequest(request) {
  const promise = new Promise((resolve, reject) => {
    const unlisten = () => {
      request.removeEventListener("success", success);
      request.removeEventListener("error", error);
    };
    const success = () => {
      resolve(wrap(request.result));
      unlisten();
    };
    const error = () => {
      reject(request.error);
      unlisten();
    };
    request.addEventListener("success", success);
    request.addEventListener("error", error);
  });
  reverseTransformCache.set(promise, request);
  return promise;
}
function cacheDonePromiseForTransaction(tx) {
  if (transactionDoneMap.has(tx))
    return;
  const done = new Promise((resolve, reject) => {
    const unlisten = () => {
      tx.removeEventListener("complete", complete);
      tx.removeEventListener("error", error);
      tx.removeEventListener("abort", error);
    };
    const complete = () => {
      resolve();
      unlisten();
    };
    const error = () => {
      reject(tx.error || new DOMException("AbortError", "AbortError"));
      unlisten();
    };
    tx.addEventListener("complete", complete);
    tx.addEventListener("error", error);
    tx.addEventListener("abort", error);
  });
  transactionDoneMap.set(tx, done);
}
var idbProxyTraps = {
  get(target, prop, receiver) {
    if (target instanceof IDBTransaction) {
      if (prop === "done")
        return transactionDoneMap.get(target);
      if (prop === "store") {
        return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
      }
    }
    return wrap(target[prop]);
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
  has(target, prop) {
    if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
      return true;
    }
    return prop in target;
  }
};
function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
  if (getCursorAdvanceMethods().includes(func)) {
    return function(...args) {
      func.apply(unwrap(this), args);
      return wrap(this.request);
    };
  }
  return function(...args) {
    return wrap(func.apply(unwrap(this), args));
  };
}
function transformCachableValue(value) {
  if (typeof value === "function")
    return wrapFunction(value);
  if (value instanceof IDBTransaction)
    cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
    return new Proxy(value, idbProxyTraps);
  return value;
}
function wrap(value) {
  if (value instanceof IDBRequest)
    return promisifyRequest(value);
  if (transformCache.has(value))
    return transformCache.get(value);
  const newValue = transformCachableValue(value);
  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }
  return newValue;
}
var unwrap = (value) => reverseTransformCache.get(value);
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
  const request = indexedDB.open(name, version);
  const openPromise = wrap(request);
  if (upgrade) {
    request.addEventListener("upgradeneeded", (event) => {
      upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
    });
  }
  if (blocked) {
    request.addEventListener("blocked", (event) => blocked(
      // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
      event.oldVersion,
      event.newVersion,
      event
    ));
  }
  openPromise.then((db) => {
    if (terminated)
      db.addEventListener("close", () => terminated());
    if (blocking) {
      db.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
    }
  }).catch(() => {
  });
  return openPromise;
}
var readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
var writeMethods = ["put", "add", "delete", "clear"];
var cachedMethods = /* @__PURE__ */ new Map();
function getMethod(target, prop) {
  if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
    return;
  }
  if (cachedMethods.get(prop))
    return cachedMethods.get(prop);
  const targetFuncName = prop.replace(/FromIndex$/, "");
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
  ) {
    return;
  }
  const method = async function(storeName, ...args) {
    const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
    let target2 = tx.store;
    if (useIndex)
      target2 = target2.index(args.shift());
    return (await Promise.all([
      target2[targetFuncName](...args),
      isWrite && tx.done
    ]))[0];
  };
  cachedMethods.set(prop, method);
  return method;
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
  has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
}));
var advanceMethodProps = ["continue", "continuePrimaryKey", "advance"];
var methodMap = {};
var advanceResults = /* @__PURE__ */ new WeakMap();
var ittrProxiedCursorToOriginalProxy = /* @__PURE__ */ new WeakMap();
var cursorIteratorTraps = {
  get(target, prop) {
    if (!advanceMethodProps.includes(prop))
      return target[prop];
    let cachedFunc = methodMap[prop];
    if (!cachedFunc) {
      cachedFunc = methodMap[prop] = function(...args) {
        advanceResults.set(this, ittrProxiedCursorToOriginalProxy.get(this)[prop](...args));
      };
    }
    return cachedFunc;
  }
};
async function* iterate(...args) {
  let cursor = this;
  if (!(cursor instanceof IDBCursor)) {
    cursor = await cursor.openCursor(...args);
  }
  if (!cursor)
    return;
  cursor = cursor;
  const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
  ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
  reverseTransformCache.set(proxiedCursor, unwrap(cursor));
  while (cursor) {
    yield proxiedCursor;
    cursor = await (advanceResults.get(proxiedCursor) || cursor.continue());
    advanceResults.delete(proxiedCursor);
  }
}
function isIteratorProp(target, prop) {
  return prop === Symbol.asyncIterator && instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor]) || prop === "iterate" && instanceOfAny(target, [IDBIndex, IDBObjectStore]);
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get(target, prop, receiver) {
    if (isIteratorProp(target, prop))
      return iterate;
    return oldTraps.get(target, prop, receiver);
  },
  has(target, prop) {
    return isIteratorProp(target, prop) || oldTraps.has(target, prop);
  }
}));

// src/app/shared/filetransferdb.ts
var FileTransferDb = class {
  // Private Variables
  _databaseName = "FileTransfer";
  _databaseVersion = 1;
  _storeName = "uploads";
  _keyPath = "uploadId";
  _databasePromise = null;
  openDatabase() {
    if (this._databasePromise) {
      return this._databasePromise;
    }
    const storeName = this._storeName;
    const keyPath = this._keyPath;
    this._databasePromise = openDB(this._databaseName, this._databaseVersion, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath });
        }
      },
      terminated: () => {
        this._databasePromise = null;
      }
    });
    return this._databasePromise;
  }
  async saveUpload(record) {
    const database = await this.openDatabase();
    await database.put(this._storeName, record);
  }
  async deleteUpload(uploadId) {
    const database = await this.openDatabase();
    await database.delete(this._storeName, uploadId);
  }
  async getUpload(uploadId) {
    const database = await this.openDatabase();
    return await database.get(this._storeName, uploadId);
  }
  async getUploads() {
    const database = await this.openDatabase();
    return await database.getAll(this._storeName);
  }
  async createUploadRecord(uploadId, objectKey, file, partSize, totalParts) {
    const newRecord = {
      uploadId,
      objectKey,
      contentType: file.type || "application/octet-stream",
      fileIdentifier: {
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        hash: null
      },
      partSize,
      totalParts,
      createDate: Date.now(),
      uploadedParts: []
    };
    await this.saveUpload(newRecord);
    return newRecord;
  }
  async addUploadedPart(uploadId, partNumber, eTag) {
    const record = await this.getUpload(uploadId);
    if (!record) {
      throw new Error("Upload record not found for uploadId: " + uploadId);
    }
    record.uploadedParts.push({
      PartNumber: partNumber,
      ETag: eTag,
      UploadedAt: Date.now()
    });
    await this.saveUpload(record);
    return record;
  }
  async findLatestUpload() {
    const uploads = await this.getUploads();
    if (!uploads || uploads.length === 0) {
      return null;
    }
    uploads.sort((a, b) => b.createDate - a.createDate);
    return uploads[0];
  }
};

// src/app/shared/filetransferencryption.ts
var TEST_KEY = "1234567890abcdef";
var FileTransferEncryption = class {
  async getEncryptionKey(encryptionKey = null) {
    const keyData = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(encryptionKey || TEST_KEY));
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      "AES-GCM",
      true,
      [
        "encrypt"
      ]
    );
    return key;
  }
  async getDecryptionKey(encryptionKey = null) {
    const keyData = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(encryptionKey || TEST_KEY));
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      "AES-GCM",
      true,
      [
        "decrypt"
      ]
    );
    return key;
  }
  async encryptFilePart(key, filePart) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedFilePart = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv
      },
      key,
      filePart
    );
    const retVal = new Uint8Array(iv.byteLength + encryptedFilePart.byteLength);
    retVal.set(new Uint8Array(iv), 0);
    retVal.set(new Uint8Array(encryptedFilePart), iv.byteLength);
    return retVal;
  }
  async decryptFilePart(key, filePart) {
    const iv = filePart.slice(0, 12);
    const encryptedFilePart = filePart.slice(12);
    const decryptedFilePart = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv
      },
      key,
      encryptedFilePart
    );
    return decryptedFilePart;
  }
};

// src/app/shared/filetransferupload.ts
var FileTransferUpload = class {
  // Private variables
  _api;
  _db;
  _encryption;
  _logMessage;
  _onProgress;
  _onComplete;
  _onCancelled;
  _partSize = 5 * 1024 * 1024;
  // 5MB
  // Public Variables
  partSize = this._partSize;
  constructor(api, db, logMessage2, onProgress, onComplete, onCancelled) {
    this._api = api;
    this._db = db;
    this._encryption = new FileTransferEncryption();
    this._logMessage = logMessage2 ?? console.log;
    this._onProgress = onProgress ?? (() => {
    });
    this._onComplete = onComplete ?? (() => {
    });
    this._onCancelled = onCancelled ?? (() => {
    });
  }
  async uploadFile(file) {
    const uploadUrl = await this._api.getUploadUrl(file.name);
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file
    });
    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }
  }
  async uploadParts(file, objectKey, uploadId, partSize, totalParts, skippedParts, uploadedParts) {
    const encryptionKey = await this._encryption.getEncryptionKey(null);
    for (let i = 0; i < totalParts; i++) {
      const partIndex = i + 1;
      if (skippedParts.has(partIndex)) {
        this._logMessage("Skipping part " + partIndex + " as it was already uploaded.");
        continue;
      }
      const fileStart = i * partSize;
      const fileEnd = Math.min(fileStart + partSize, file.size);
      const fileChunk = file.slice(fileStart, fileEnd);
      const chunkBytes = await fileChunk.arrayBuffer();
      const encryptedChunk = await this._encryption.encryptFilePart(encryptionKey, chunkBytes);
      const multipartUploadUrl = await this._api.generateMultipartUploadUrl(objectKey, uploadId, partIndex);
      const uploadPartResponse = await fetch(multipartUploadUrl, {
        method: "PUT",
        body: encryptedChunk
      });
      if (!uploadPartResponse.ok) {
        this._logMessage("Failed to upload part " + partIndex + " with status: " + uploadPartResponse.status);
        throw new Error("Failed to upload part " + partIndex);
      }
      const eTag = uploadPartResponse.headers.get("ETag")?.replaceAll('"', "") ?? "";
      this._logMessage("Part " + partIndex + " uploaded successfully with ETag: " + eTag);
      uploadedParts.push({
        PartNumber: partIndex,
        ETag: eTag
      });
      await this._db.addUploadedPart(
        uploadId,
        partIndex,
        eTag
      );
      this._onProgress(
        uploadId,
        partIndex,
        totalParts
      );
    }
  }
  async newUpload(file) {
    try {
      this._logMessage("Uploading file: " + file.name);
      const objectKey = crypto.randomUUID() + "/" + file.name;
      const uploadId = await this._api.initiateMultipartUpload(objectKey, file.type || "application/octet-stream");
      if (!uploadId) {
        this._logMessage("Failed to initiate multipart upload.");
        return;
      }
      const totalParts = Math.ceil(file.size / this._partSize);
      await this._db.createUploadRecord(uploadId, objectKey, file, this._partSize, totalParts);
      this._logMessage("Created upload record in IndexedDB with Upload ID: " + uploadId);
      this._onProgress(
        uploadId,
        0,
        totalParts
      );
      const uploadedParts = [];
      try {
        await this.uploadParts(file, objectKey, uploadId, this._partSize, totalParts, /* @__PURE__ */ new Set(), uploadedParts);
        if (uploadedParts.length !== totalParts) {
          this._logMessage("Not all parts were uploaded successfully. Uploaded " + uploadedParts.length + " out of " + totalParts);
          throw new Error("Not all parts were uploaded successfully.");
        }
        await this.completeUpload(objectKey, uploadId, uploadedParts);
      } catch (error) {
        this._logMessage("An error occurred during multipart upload: " + error.message);
        await this.cancelUpload(objectKey, uploadId);
      }
    } catch (error) {
      this._logMessage("An error occurred while uploading file: " + error.message);
    }
  }
  async resumeUpload(file, uploadId) {
    try {
      const existingRecord = await this._db.getUpload(uploadId);
      if (existingRecord == null) {
        this._logMessage("No existing upload record found. Aborting upload!");
        return;
      }
      if (file.name !== existingRecord.fileIdentifier.name || file.size !== existingRecord.fileIdentifier.size || file.lastModified !== existingRecord.fileIdentifier.lastModified) {
        this._logMessage("Selected file does not match pending upload. Aborting upload!");
        return;
      }
      this._logMessage("Resuming upload for file: " + existingRecord.objectKey);
      const partSize = existingRecord.partSize;
      const totalParts = existingRecord.totalParts;
      const serverParts = await this._api.listMultipartUploadParts(existingRecord.objectKey, existingRecord.uploadId);
      existingRecord.uploadedParts = serverParts;
      await this._db.saveUpload(existingRecord);
      const skippedParts = new Set(existingRecord.uploadedParts.map((part) => part.PartNumber));
      const uploadedParts = existingRecord.uploadedParts.map((part) => ({
        PartNumber: part.PartNumber,
        ETag: part.ETag
      }));
      this._logMessage(skippedParts.size + " out of " + totalParts + " parts already uploaded. Resuming upload...");
      try {
        await this.uploadParts(file, existingRecord.objectKey, uploadId, partSize, totalParts, skippedParts, uploadedParts);
        if (uploadedParts.length !== totalParts) {
          this._logMessage("Not all parts were uploaded successfully. Uploaded " + uploadedParts.length + " out of " + totalParts);
          throw new Error("Not all parts were uploaded successfully.");
        }
        await this.completeUpload(existingRecord.objectKey, uploadId, uploadedParts);
      } catch (error) {
        this._logMessage("An error occurred during multipart upload: " + error.message);
        await this.cancelUpload(existingRecord.objectKey, uploadId);
      }
    } catch (error) {
      this._logMessage("An error occurred while uploading file: " + error.message);
    }
  }
  async cancelUpload(objectKey, uploadId) {
    try {
      await this._api.abortMultipartUpload(objectKey, uploadId);
      this._logMessage("Aborted multipart upload for Upload ID: " + uploadId);
    } catch (error) {
      this._logMessage("Failed while canceling multipart upload: " + error.message);
    }
    try {
      await this._db.deleteUpload(uploadId);
      this._logMessage("Deleted upload record from IndexedDB for Upload ID: " + uploadId);
    } catch (error) {
      this._logMessage("Failed while deleting record: " + error.message);
    }
    this._onCancelled(
      uploadId,
      objectKey
    );
  }
  async completeUpload(objectKey, uploadId, uploadedParts) {
    await this._api.completeMultipartUpload(objectKey, uploadId, uploadedParts);
    this._logMessage("All parts uploaded successfully. Completed multipart upload...");
    await this._db.deleteUpload(uploadId);
    this._logMessage("Deleted upload record from IndexedDB for Upload ID: " + uploadId);
    this._onComplete(uploadId, objectKey);
  }
};

// src/app/workers/service-worker.ts
var fileTransferApi = new FileTransferApi();
var fileTransferDb = new FileTransferDb();
var fileTransferUpload = new FileTransferUpload(
  fileTransferApi,
  fileTransferDb,
  logMessage,
  (uploadId, partNumber, totalParts) => sendProgressEvent("PROGRESSUPLOAD" /* PROGRESSUPLOAD */, uploadId, partNumber, totalParts),
  (uploadId, objectKey) => sendEvent("COMPLETEUPLOAD" /* COMPLETEUPLOAD */, uploadId, objectKey),
  (uploadId, objectKey) => sendEvent("CANCELLEDUPLOAD" /* CANCELLEDUPLOAD */, uploadId, objectKey)
);
var serviceWorkerClient = null;
var uploadInProgress = false;
function sendEvent(type, uploadId, objectKey) {
  if (serviceWorkerClient == null) {
    return;
  }
  serviceWorkerClient.postMessage({
    type,
    uploadId,
    objectKey
  });
}
function sendProgressEvent(type, uploadId, partNumber, totalParts) {
  if (serviceWorkerClient == null) {
    return;
  }
  serviceWorkerClient.postMessage({
    type,
    uploadId,
    partNumber,
    totalParts
  });
}
function logMessage(message) {
  if (serviceWorkerClient == null) {
    return;
  }
  serviceWorkerClient.postMessage({
    type: "LOGMESSAGE" /* LOGMESSAGE */,
    message
  });
}
self.addEventListener("install", (event) => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("message", (event) => {
  serviceWorkerClient = event.source;
  const data = event.data;
  if (!data || !data.type) {
    logMessage("Received invalid message in Service Worker.");
    return;
  }
  if (data.type === "NEWUPLOAD" /* NEWUPLOAD */ || data.type === "RESUMEUPLOAD" /* RESUMEUPLOAD */) {
    if (uploadInProgress) {
      logMessage("An upload is already in progress.");
      return;
    }
    uploadInProgress = true;
    switch (data.type) {
      case "NEWUPLOAD" /* NEWUPLOAD */:
        event.waitUntil(fileTransferUpload.newUpload(data.file).finally(() => {
          uploadInProgress = false;
        }));
        break;
      case "RESUMEUPLOAD" /* RESUMEUPLOAD */:
        event.waitUntil(fileTransferUpload.resumeUpload(data.file, data.uploadId).finally(() => {
          uploadInProgress = false;
        }));
        break;
    }
  } else if (data.type === "CANCELUPLOAD" /* CANCELUPLOAD */) {
    event.waitUntil(fileTransferUpload.cancelUpload(data.objectKey, data.uploadId));
  }
});

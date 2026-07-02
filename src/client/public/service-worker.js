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
  async createUploadRecord(uploadId, file, partSize, totalParts) {
    const newRecord = {
      uploadId,
      objectKey: file.name,
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

// src/app/workers/service-worker.ts
var fileTransferApi = new FileTransferApi();
var fileTransferDb = new FileTransferDb();
var serviceWorkerClient = null;
self.addEventListener("install", (event) => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("message", (event) => {
  serviceWorkerClient = event.source;
  logMesage("Message has been received. Pinging back to client.");
});
function logMesage(message) {
  if (serviceWorkerClient == null) {
    return;
  }
  serviceWorkerClient.postMessage({
    type: "LOGMESSAGE" /* LOGMESSAGE */,
    message
  });
}

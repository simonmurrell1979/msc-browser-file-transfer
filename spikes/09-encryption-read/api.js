// Set up variables
const apiBaseUrl = "https://localhost:7222/api/storage";

async function postJSON(url,
    body) {

    // Assign Value
    var postUrl = apiBaseUrl + url;
    // Send Request
    const initialResponse = await fetch(postUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    // Extract JSON
    const json = await initialResponse.json();
    // Check Value
    if (!json.Success) {

        // Throw Exception
        throw new Error(json.Message || "Unknown Server Error");

    }
    // Return
    return json.ReturnedObject;

}

async function getDownloadUrl(objectKey) {

    // Assign Value
    const downloadUrl = apiBaseUrl + "/GetDownloadUrl?objectKey=" + encodeURIComponent(objectKey);
    // Get Download URL
    return await postJSON("/Get", {
        ObjectKey: objectKey,
        UploadId: uploadId,
        PartNumber: partNumber
    });

}

async function generateMultipartUploadUrl(objectKey,
    uploadId,
    partNumber) {

    // Generate Multipart Upload URL
    return await postJSON("/GenerateMultipartUploadUrl", {
        ObjectKey: objectKey,
        UploadId: uploadId,
        PartNumber: partNumber
    });

}

async function initiateMultipartUpload(objectKey,
    contentType) {

    // Initialize Multipart Upload
    return await postJSON("/InitiateMultipartUpload", {
            ObjectKey: objectKey,
            ContentType: contentType || "application/octet-stream"
        });

}

async function listMultipartUploadParts(objectKey,
    uploadId) {

    // Load Server Parts
    return await postJSON("/ListMultipartUploadParts", {
        ObjectKey: objectKey,
        UploadId: uploadId
    });

}

async function completeMultipartUpload(objectKey,
    uploadId,
    uploadedParts) {

    // Complete Multipart Upload
    await postJSON("/CompleteMultipartUpload", {
        ObjectKey: objectKey,
        UploadId: uploadId,
        Parts: uploadedParts
    });

}

async function abortMultipartUpload(objectKey,
    uploadId) {

    // Abort Multipart Upload
    await postJSON("/AbortMultipartUpload", {
        ObjectKey: objectKey,
        UploadId: uploadId
    });

}

// Export Functions
export {
    abortMultipartUpload,
    completeMultipartUpload,
    generateMultipartUploadUrl,
    initiateMultipartUpload,
    listMultipartUploadParts
};


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

async function initializeMultipartUpload(objectKey,
    contentType) {

    // Initialize Multipart Upload
    return await postJSON("/InitiateMultipartUpload", {
            ObjectKey: objectKey,
            ContentType: contentType || "application/octet-stream"
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

// Exports
export {
    abortMultipartUpload,
    completeMultipartUpload,
    generateMultipartUploadUrl,
    initializeMultipartUpload
};


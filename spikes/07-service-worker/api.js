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

// Exports
export {
    generateMultipartUploadUrl,
    initializeMultipartUpload
};


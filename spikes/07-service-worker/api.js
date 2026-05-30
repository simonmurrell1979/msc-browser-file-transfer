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

// Exports
export {
    generateMultipartUploadUrl
};


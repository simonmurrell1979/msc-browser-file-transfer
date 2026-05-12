// Set up variables
const apiBaseUrl = "https://localhost:7222/api/storage";
const fileUpload = document.getElementById("fileUpload");
const cmdUpload = document.getElementById("cmdUpload");
const uploadStatus = document.getElementById("uploadStatus");

function logMessage(message) {

    // Log Message
    uploadStatus.textContent += message + "\n";

}

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
    // Return
    return json.ReturnedObject;

}

cmdUpload.addEventListener("click", async () => {

    // Initialize Uploaded Parts Array
    const uploadedParts = [];

    // Clear Status
    uploadStatus.textContent = "";

    // Load File
    var file = fileUpload.files[0];
    // Check Value
    if (!file) {

        // Log Message
        logMessage("Please select a file to upload.");
        // Exit
        return;

    }
    
    try {

        // Log Message
        logMessage("Uploading file: " + file.name);

        // Initialize Multipart Upload
        const uploadId = await postJSON("/InitiateMultipartUpload", {
            ObjectKey: file.name,
            ContentType: file.type || "application/octet-stream"
        });
        // Check Value
        if (!uploadId) {
         
            // Log Message
            logMessage("Failed to initiate multipart upload.");
            // Exit
            return;

        }

        // Following high level flow based on developer documentation

        try {

            // Assign Value
            const partSize = 5 * 1024 * 1024; // 5MB
            // Calculate Number of Parts
            var totalParts = Math.ceil(file.size / partSize);

            // Search for each part
            for (let i = 0; i < totalParts; i++) {

                // Assign Value
                var partIndex = i + 1;
                var fileStart = i * partSize;
                var fileEnd = Math.min(fileStart + partSize, file.size);
                var fileChunk = file.slice(fileStart, fileEnd);

                // Generate Multipart Upload URL
                const multipartUploadUrl = await postJSON("/GenerateMultipartUploadUrl", {
                    ObjectKey: file.name,
                    UploadId: uploadId,
                    PartNumber: partIndex
                });
                
                // Upload to R2
                const uploadPartResponse = await fetch(multipartUploadUrl, {
                    method: "PUT",
                    body: fileChunk
                });
                // Check Value
                if (!uploadPartResponse.ok) {

                    // Log Message
                    logMessage("Failed to upload part " + partIndex + " with status: " + uploadPartResponse.status);
                    // Throw Exception
                    throw new Error("Failed to upload part " + partIndex);

                }

                // Assign Value
                const eTag = uploadPartResponse.headers.get("ETag").replaceAll('"', "");
                // Log Message
                logMessage("Part " + partIndex + " uploaded successfully with ETag: " + eTag);
                // Add to Uploaded Parts Array
                uploadedParts.push({
                    PartNumber: partIndex,
                    ETag: eTag
                });

            }

            // Complete Multipart Upload
            await postJSON("/CompleteMultipartUpload", {
                ObjectKey: file.name,
                UploadId: uploadId,
                Parts: uploadedParts
            });

            // Log Message
            logMessage("All parts uploaded successfully. Completed multipart upload...");

        }
        catch {

            // TODO -> Call future abort method

        }


        // // Log Message
        // logMessage("Starting upload to R2");

        // // Upload File
        // const uploadResponse = await fetch(uploadUrl, {
        //     method: "PUT",
        //     body: file
        // });

        // // Check Value
        // if (uploadResponse.ok) {
            
        //     // Log Message
        //     logMessage("File uploaded successfully!");

        // }
        // else {
            
        //     // Log Message
        //     logMessage("File upload failed with status: " + uploadResponse.status);

        // }

    }
    catch (error) {

        // Log Message
        logMessage("An error occurred while uploading file: " + error.message);

    }

});
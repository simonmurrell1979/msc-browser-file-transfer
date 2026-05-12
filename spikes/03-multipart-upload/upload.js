// Set up variables
const apiBaseUrl = "https://localhost:7222/api/storage";
const fileUpload = document.getElementById("fileUpload");
const cmdUpload = document.getElementById("cmdUpload");
const uploadStatus = document.getElementById("uploadStatus");

function logMessage(message) {

    // Log Message
    uploadStatus.textContent += message + "\n";

}

cmdUpload.addEventListener("click", async () => {

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

        // Assign Value
        var objectKey = encodeURIComponent(file.name);

        // Assign Value
        var requestUrl = apiBaseUrl + "/GetUploadUrl?objectKey=" + objectKey;
        // Log Message
        logMessage("Request URL: " + requestUrl);

        // Get Upload URL
        const response = await fetch(requestUrl);
        const json = await response.json();
        const uploadUrl = json.ReturnedObject;
        // Log Message
        logMessage("Upload URL: " + uploadUrl);

        // Assign Value
        var initialRequestUrl = apiBaseUrl + "/InitiateMultipartUpload";
        // Log Message
        logMessage("Initial Request URL: " + initialRequestUrl);

        // Build Body
        var initialRequestBody = {
            ObjectKey: file.name,
            ContentType: file.type || "application/octet-stream"
        };
        // Get Initial Upload URL
        const initialResponse = await fetch(initialRequestUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(initialRequestBody)
        });
        const initialJson = await initialResponse.json();
        const uploadId = initialJson.ReturnedObject;
        // Log Message
        logMessage("Upload ID: " + uploadId);

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

            // Mock File Parts
            const fileParts = [
                new Uint8Array(partSize), // Part 1 - 5MB
                new Uint8Array(partSize), // Part 2 - 5MB
                new Uint8Array(partSize / 5)  // Part 3 - 1MB
            ];



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
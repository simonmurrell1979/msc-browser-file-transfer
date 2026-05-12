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
        var requestUrl = apiBaseUrl + "/GetUploadUrl?objectKey=" + encodeURIComponent(file.name);
        // Log Message
        logMessage("Request URL: " + requestUrl);

        // Get Upload URL
        const response = await fetch(requestUrl);
        const json = await response.json();
        const uploadUrl = json.ReturnedObject;

        // Log Message
        logMessage("Starting upload to R2");

        // Upload File
        const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            body: file
        });

        // Check Value
        if (uploadResponse.ok) {
            
            // Log Message
            logMessage("File uploaded successfully!");

        }
        else {
            
            // Log Message
            logMessage("File upload failed with status: " + uploadResponse.status);

        }

    }
    catch (error) {

        // Log Message
        logMessage("An error occurred while uploading file: " + error.message);

    }

});
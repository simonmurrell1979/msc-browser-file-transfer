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
        const uploadId = await postJSON("/InitiateMultipartUpload", 
            {
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

            // Mock File Parts
            const fileParts = [
                new Uint8Array(partSize), // Part 1 - 5MB
                new Uint8Array(partSize), // Part 2 - 5MB
                new Uint8Array(partSize / 5)  // Part 3 - 1MB
            ];

            // Search for each part
            for (let i = 0; i < fileParts.length; i++) {

                // Generate Multipart Upload URL
                const multipartUploadUrl = await postJSON("/GenerateMultipartUploadUrl", 
                    {
                        ObjectKey: file.name,
                        UploadId: uploadId,
                        PartNumber: i + 1
                    });
                
                
                
            }

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
// Set up variables
const apiBaseUrl = "http://localhost:5158/api/storage";
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

        throw new Error("Hello World!");

    }
    catch (error) {

        // Log Message
        logMessage("Error: " + error.message);

    }

});
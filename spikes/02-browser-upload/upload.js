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

    logMessage("Hello World!");    

});
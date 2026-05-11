$apiBase = "http://localhost:5158/api/storage"
$objectKey = "test.txt"
$filePath = ".\test.txt"

# Get presigned URL from API
$response = Invoke-RestMethod -Uri "$apiBase/getuploadurl?objectKey=$objectKey"

# Extract URL
$uploadUrl = $response.ReturnedObject
Write-Host "`nExtracted URL: $uploadUrl"

# Upload file
curl.exe -X PUT --upload-file $filePath $uploadUrl

Write-Host "`nUpload complete: $objectKey"
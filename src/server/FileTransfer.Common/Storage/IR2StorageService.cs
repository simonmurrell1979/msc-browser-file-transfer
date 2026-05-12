namespace FileTransfer.Common.Storage
{
    
    public interface IR2StorageService
    {

        // Getting started URL
        // https://developers.cloudflare.com/r2/examples/aws/aws-sdk-net/
        // Presigned URLs
        // https://developers.cloudflare.com/r2/api/s3/presigned-urls/
        // Upload Objects
        // https://developers.cloudflare.com/r2/objects/upload-objects/
        // Download Objects
        // https://developers.cloudflare.com/r2/objects/download-objects/
        // Delete Objects
        // https://developers.cloudflare.com/r2/objects/delete-objects/

        Task<(bool Connected, string? ErrorMessage)> TestConnectionAsync();

        // Single Uploads
        Task<string> GeneratePutUrlAsync(string ObjectKey);

        // Multipart Uploads
        Task<string> InitiateMultipartUploadAsync(string ObjectKey, string ContentType = "application/octet-stream");
        Task<string> GenerateMultipartUploadUrlAsync(string ObjectKey, string UploadId, int PartNumber);

    }

}

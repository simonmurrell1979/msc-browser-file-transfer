using FileTransfer.Common.Models.Uploads;

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
        // Presigned URLs for downloads
        // https://developers.cloudflare.com/r2/api/s3/presigned-urls/
        // Delete Objects
        // https://developers.cloudflare.com/r2/objects/delete-objects/

        // Amazon S3 
        // https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html
        // S3 API Compatibility
        // https://developers.cloudflare.com/r2/api/s3/api/

        Task<(bool Connected, string? ErrorMessage)> TestConnectionAsync();

        // Single Uploads
        Task<string> GeneratePutUrlAsync(string ObjectKey);
        // Single Downloads
        Task<string> GenerateGetUrlAsync(string ObjectKey);

        // Multipart Uploads
        Task<string> InitiateMultipartUploadAsync(string ObjectKey, string ContentType = "application/octet-stream");
        Task<string> GenerateMultipartUploadUrlAsync(string ObjectKey, string UploadId, int PartNumber);
        Task CompleteMultipartUploadAsync(string ObjectKey, string UploadId, List<UploadPart> Parts);
        Task AbortMultipartUploadAsync(string ObjectKey, string UploadId);
        Task<List<UploadPart>> ListMultipartUploadParts(string ObjectKey, string UploadId);

    }

}

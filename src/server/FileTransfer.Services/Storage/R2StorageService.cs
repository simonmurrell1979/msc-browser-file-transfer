using Amazon.S3;
using Amazon.S3.Model;
using FileTransfer.Common.Configuration;
using FileTransfer.Common.Storage;
using Microsoft.Extensions.Options;
using Uploads = FileTransfer.Common.Models.Uploads;

namespace FileTransfer.Services.Storage
{
    
    public class R2StorageService: IR2StorageService
    {

        #region Variables

        // Private Variables
        private readonly R2Options _options;
        private readonly IAmazonS3 _client;

        #endregion

        #region Constructor

        public R2StorageService(IOptions<R2Options> r2Options)
        {

            // Initialize Variables
            _options = r2Options.Value;

            // Initialize Amazon S3 Client
            var config = new AmazonS3Config
            {
                ServiceURL = $"https://{_options.AccountId}.r2.cloudflarestorage.com",
                ForcePathStyle = true
            };
            // Initialize Class
            _client = new AmazonS3Client(_options.AccessKeyId, 
                _options.SecretAccessKey, 
                config);

        }

        #endregion

        #region TestConnectionAsync

        public async Task<(bool Connected, string? ErrorMessage)> TestConnectionAsync()
        {

            // Source Code used from https://developers.cloudflare.com/r2/examples/aws/aws-sdk-net/

            try
            {

                // Build Request
                var request = new ListObjectsV2Request
                {
                    BucketName = _options.BucketName,
                    MaxKeys = 1
                };
                // Execute Request
                await _client.ListObjectsV2Async(request);
                // Return
                return (true, null) ;

            }
            catch (AmazonS3Exception ex)
            {

                // Return
                return (false, $"Error encountered on server. " +
                    $"Error: '{ex.ErrorCode}'. " +
                    $"Message:'{ex.Message}' when listing objects");

            }
            catch (Exception ex) 
            {

                // Return   
                return (false, ex.Message);

            }

        }

        #endregion

        #region GeneratePutUrlAsync

        public Task<string> GeneratePutUrlAsync(string ObjectKey)
        {

            // Check Value
            if (string.IsNullOrWhiteSpace(ObjectKey))
            {

                // Throw Exception
                throw new ArgumentException("ObjectKey cannot be null or empty.",
                    nameof(ObjectKey));

            }
            // Build Request
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _options.BucketName,
                Key = ObjectKey,
                Verb = HttpVerb.PUT,
                Expires = DateTime.UtcNow.AddMinutes(15)
            };
            // Generate URL
            var url = _client.GetPreSignedURL(request);
            // Return
            return Task.FromResult(url);

        }

        #endregion

        #region GenerateGetUrlAsync

        public Task<string> GenerateGetUrlAsync(string ObjectKey)
        {

            // Check Value
            if (string.IsNullOrWhiteSpace(ObjectKey))
            {

                // Throw Exception
                throw new ArgumentException("ObjectKey cannot be null or empty.",
                    nameof(ObjectKey));

            }
            // Build Request
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _options.BucketName,
                Key = ObjectKey,
                Verb = HttpVerb.GET,
                Expires = DateTime.UtcNow.AddMinutes(15)
            };
            // Generate URL
            var url = _client.GetPreSignedURL(request);
            // Return
            return Task.FromResult(url);

        }

        #endregion

        #region InitiateMultipartUploadAsync

        public async Task<string> InitiateMultipartUploadAsync(string ObjectKey,
            string ContentType = "application/octet-stream")
        {

            // Build Request
            var request = new InitiateMultipartUploadRequest
            {
                BucketName = _options.BucketName,
                Key = ObjectKey,
                ContentType = ContentType
            };
            // Execute Request
            var response = await _client.InitiateMultipartUploadAsync(request);
            // Return
            return response.UploadId;

        }

        #endregion

        #region GenerateMultipartUploadUrlAsync

        public Task<string> GenerateMultipartUploadUrlAsync(string ObjectKey, 
            string UploadId, 
            int PartNumber)
        {

            // Build Request
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _options.BucketName,
                Key = ObjectKey,
                Verb = HttpVerb.PUT,
                Expires = DateTime.UtcNow.AddMinutes(15),
                UploadId = UploadId,
                PartNumber = PartNumber
            };
            // Generate URL
            var url = _client.GetPreSignedURL(request);
            // Return
            return Task.FromResult(url);

        }

        #endregion

        #region CompleteMultipartUploadAsync

        public async Task CompleteMultipartUploadAsync(string ObjectKey,
            string UploadId,
            List<Uploads.UploadPart> Parts)
        {

            // Build Request
            var request = new CompleteMultipartUploadRequest
            {
                BucketName = _options.BucketName,
                Key = ObjectKey,
                UploadId = UploadId,
                PartETags = Parts.Select(p => new PartETag
                {
                    ETag = p.ETag,
                    PartNumber = p.PartNumber
                }).ToList()
            };
            // Complete Multipart Upload
            var response = await _client.CompleteMultipartUploadAsync(request);

        }

        #endregion

        #region AbortMultipartUploadAsync

        public async Task AbortMultipartUploadAsync(string ObjectKey,
            string UploadId)
        {

            // Build Request
            var request = new AbortMultipartUploadRequest
            {
                BucketName = _options.BucketName,
                Key = ObjectKey,
                UploadId = UploadId
            };
            // Abort Multipart Upload
            var response = await _client.AbortMultipartUploadAsync(request);

        }

        #endregion

        #region ListMultipartUploadParts

        public async Task<List<Uploads.UploadPart>> ListMultipartUploadParts(string ObjectKey, string UploadId)
        {

            // Build Request
            var request = new ListPartsRequest
            {
                BucketName = _options.BucketName,
                Key = ObjectKey,
                UploadId = UploadId
            };
            // Abort Multipart Upload
            var response = await _client.ListPartsAsync(request);

            // Map Parts
            var parts = response.Parts.Select(p => new Uploads.UploadPart
            {
                ETag = p.ETag.Replace("\"", ""),
                PartNumber = p.PartNumber
            }).ToList();

            // Return
            return parts;

        }

        #endregion

    }

}

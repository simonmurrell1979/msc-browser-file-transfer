using FileTransfer.Common.Factories;
using FileTransfer.Common.Models.Uploads;
using FileTransfer.Common.Storage;
using Microsoft.AspNetCore.Mvc;

namespace FileTransfer.RestAPI.Controllers
{

    [ApiController]
    [Route("[controller]/[action]")]
    public class StorageController : Controller
    {

        #region Variables

        // Private Variables
        private readonly ILogger<StorageController> _logger;
        private readonly IR2StorageService _storageService;

        #endregion

        #region Constructor

        public StorageController(ILogger<StorageController> logger,
            IR2StorageService storageService)
        {

            // Initialize Classes
            _logger = logger;
            _storageService = storageService;

        }

        #endregion

        #region TestConnection

        [HttpGet]
        public async Task<object> TestConnection()
        {

            // Test Connection
            var (connected, errorMessage) = await _storageService.TestConnectionAsync();

            // Check Value
            if (!connected)
            {

                // Log Warning
                _logger.LogWarning("Storage connection test failed: {ErrorMessage}", errorMessage);
                // Return
                return Ok(JsonResponseFactory.ErrorResponse(errorMessage ?? "Unknown error"));

            }

            // Return
            return Ok(JsonResponseFactory.SuccessResponse());

        }

        #endregion

        #region GetUploadUrl

        [HttpGet]
        public async Task<IActionResult> GetUploadUrl(string ObjectKey)
        {

            try
            {

                // Generate URL
                var url = await _storageService.GeneratePutUrlAsync(ObjectKey);
                // Log Information
                _logger.LogInformation("Generated pre-signed URL for ObjectKey '{ObjectKey}'", 
                    ObjectKey);

                // Return
                return Ok(JsonResponseFactory.SuccessResponse(url));

            }
            catch (Exception ex)
            {

                // Log Error
                _logger.LogError(ex, "Error generating pre-signed URL for ObjectKey '{ObjectKey}'", 
                    ObjectKey);
                // Return Error Response
                return Ok(JsonResponseFactory.ErrorResponse($"An error occurred while generating the pre-signed URL: {ex.Message}"));

            }

        }

        #endregion

        #region InitiateMultipartUpload

        [HttpPost]
        public async Task<IActionResult> InitiateMultipartUpload(InitiateMultipartUploadRequest Request)
        {

            try
            {

                // Generate Upload ID
                var uploadId = await _storageService.InitiateMultipartUploadAsync(Request.ObjectKey,
                    Request.ContentType);
                // Log Information
                _logger.LogInformation("Generated multipart upload ID for ObjectKey '{ObjectKey}', ContentType '{ContentType}'", 
                    Request.ObjectKey,
                    Request.ContentType);

                // Return
                return Ok(JsonResponseFactory.SuccessResponse(uploadId));

            }
            catch (Exception ex)
            {

                // Log Error
                _logger.LogError(ex, "Error generating multipart upload ID for ObjectKey '{ObjectKey}', ContentType '{ContentType}'", 
                    Request.ObjectKey,
                    Request.ContentType);
                // Return Error Response
                return Ok(JsonResponseFactory.ErrorResponse($"An error occurred while generating the multipart upload ID: {ex.Message}"));

            }

        }

        #endregion

        #region GenerateMultipartUploadUrl

        [HttpPost]
        public async Task<IActionResult> GenerateMultipartUploadUrl(GenerateMultipartUploadUrlRequest Request)
        {

            try
            {

                // Generate Multipart Upload URL
                var url = await _storageService.GenerateMultipartUploadUrlAsync(Request.ObjectKey,
                    Request.UploadId,
                    Request.PartNumber);
                // Log Information
                _logger.LogInformation("Generated multipart upload URL for ObjectKey '{ObjectKey}', UploadId '{UploadId}', PartNumber '{PartNumber}'", 
                    Request.ObjectKey, 
                    Request.UploadId, 
                    Request.PartNumber);

                // Return
                return Ok(JsonResponseFactory.SuccessResponse(url));

            }
            catch (Exception ex)
            {

                // Log Error
                _logger.LogError(ex, "Error generating multipart upload URL for ObjectKey '{ObjectKey}', UploadId '{UploadId}', PartNumber '{PartNumber}'", 
                    Request.ObjectKey, 
                    Request.UploadId, 
                    Request.PartNumber);
                // Return Error Response
                return Ok(JsonResponseFactory.ErrorResponse($"An error occurred while generating the multipart upload URL: {ex.Message}"));

            }

        }

        #endregion

    }

}

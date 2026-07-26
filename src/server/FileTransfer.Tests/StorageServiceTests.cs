using Amazon.S3;
using FileTransfer.Common.Configuration;
using FileTransfer.Common.Models;
using FileTransfer.Common.Storage;
using FileTransfer.RestAPI.Controllers;
using FileTransfer.Services.Storage;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace FileTransfer.Tests
{
    
    public class StorageServiceTests
    {

        #region SetupOptions

        public static IOptions<R2Options> SetupOptions()
        {

            // Return
            return Options.Create(new R2Options
            {
                AccountId = "mockAccountId",
                AccessKeyId = "mockAccessKeyId",
                SecretAccessKey = "mockSecretAccessKey",
                BucketName = "mockBucketName"

            });

        }

        #endregion

        #region TestConnectionReturnsError

        [Fact]
        public async Task TestConnectionReturnsError()
        {

            // Initialize R2 Storage Service
            var service = new R2StorageService(SetupOptions());
            // Assert
            var (connected, errorMessage) = await service.TestConnectionAsync();

            // Assert
            Assert.False(connected);
            // Assert Error Message
            Assert.NotNull(errorMessage);

        }

        #endregion

        #region GeneratePutUrlReturnsError

        [Fact]
        public async Task GeneratePutUrlReturnsError()
        {

            // Initialize R2 Storage Service
            var service = new R2StorageService(SetupOptions());
            // Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(() => service.GeneratePutUrlAsync(""));
            // Assert Message
            Assert.Contains("ObjectKey cannot be null or empty.", exception.Message);

        }

        #endregion

        #region GenerateGetUrlReturnsError

        [Fact]
        public async Task GenerateGetUrlReturnsError()
        {

            // Initialize R2 Storage Service
            var service = new R2StorageService(SetupOptions());
            // Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(() => service.GenerateGetUrlAsync(""));
            // Assert Message
            Assert.Contains("ObjectKey cannot be null or empty.", exception.Message);

        }

        #endregion

        #region ListMultipartUploadPartsReturnsError

        [Fact]
        public async Task ListMultipartUploadReturnsError()
        {

            // Initialize Mock StorageService
            var mockStorageService = new Mock<IR2StorageService>();
            // Setup ListMultipartUploadAsync
            mockStorageService.Setup(s => s.ListMultipartUploadPartsAsync("mockFile-1/testfile.txt", "mockFile-1"))
                .ThrowsAsync(new AmazonS3Exception("Multipart upload does not exist or was Listed."));

            // Initialize StorageController
            var controller = new StorageController(NullLogger<StorageController>.Instance,
                mockStorageService.Object);

            // Initialize Class
            var ListMultipartUploadRequest = new ListMultipartUploadRequest
            {
                ObjectKey = "mockFile-1/testfile.txt",
                UploadId = "mockFile-1"
            };
            // Run the ListMultipartUpload method
            var result = await controller.ListMultipartUploadParts(ListMultipartUploadRequest) as OkObjectResult;
            // Assign Value
            var response = result?.Value as ApiResponse;

            // Check Not Null
            Assert.NotNull(response);
            // Check Value Success
            Assert.False(response.Success);
            // Check Error Message
            Assert.Contains("Multipart upload does not exist or was Listed.", response.ErrorMessage);

        }

        #endregion

    }

}

// https://developers.cloudflare.com/r2/api/error-codes/
// https://docs.aws.amazon.com/AmazonS3/latest/API/API_Error.html

using Amazon.S3;
using FileTransfer.Common.Models;
using FileTransfer.Common.Models.Uploads;
using FileTransfer.Common.Storage;
using FileTransfer.RestAPI.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace FileTransfer.Tests
{
    
    public class StorageControllerTests
    {

        #region Variables

        // Private Variables
        private const string _mockUrl = "https://175ebc0de772c1b1de292240c3ddfe85.r2.cloudflarestorage.com/msc-prototype/mockFile-1/testfile.txt?X-Amz-Expires=7200&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=7a5a092dd59c31632c97b18b8f48f179%2F20260725%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260725T234935Z&X-Amz-SignedHeaders=host&X-Amz-Signature=f18dba9cfc3cf80b987b4b3c0e222f56833e91f7bfd181d7ad5b14d002aa5078";

        #endregion

        #region TestConnectionReturnsSuccess

        [Fact]
        public async Task TestConnectionReturnsSuccess()
        {

            // Initialize Mock StorageService
            var mockStorageService = new Mock<IR2StorageService>();
            // Setup TestConnectionAsync
            mockStorageService.Setup(s => s.TestConnectionAsync())
                .ReturnsAsync((true, null));

            // Initialize StorageController
            var controller = new StorageController(NullLogger<StorageController>.Instance,
                mockStorageService.Object);

            // Run the TestConnection method
            var result = await controller.TestConnection() as OkObjectResult;
            // Assign Value
            var response = result?.Value as ApiResponse;

            // Check Not Null
            Assert.NotNull(response);
            // Check Value Success
            Assert.True(response.Success);

        }

        #endregion

        #region TestConnectionReturnsError

        [Fact]
        public async Task TestConnectionReturnsError()
        {

            // Initialize Mock StorageService
            var mockStorageService = new Mock<IR2StorageService>();
            // Setup TestConnectionAsync
            mockStorageService.Setup(s => s.TestConnectionAsync())
                .ReturnsAsync((false, "The specified bucket does not exist."));

            // Initialize StorageController
            var controller = new StorageController(NullLogger<StorageController>.Instance,
                mockStorageService.Object);

            // Run the TestConnection method
            var result = await controller.TestConnection() as OkObjectResult;
            // Assign Value
            var response = result?.Value as ApiResponse;

            // Check Not Null
            Assert.NotNull(response);
            // Check Value Success
            Assert.False(response.Success);
            // Check Error Message
            Assert.Equal("The specified bucket does not exist.", response.ErrorMessage);

        }

        #endregion

        #region GetUploadUrlReturnsSuccess

        [Fact]
        public async Task GetUploadUrlReturnsSuccess()
        {

            // Initialize Mock StorageService
            var mockStorageService = new Mock<IR2StorageService>();
            // Setup GeneratePutUrlAsync
            mockStorageService.Setup(s => s.GeneratePutUrlAsync("mockFile-2/testfile.txt"))
                .ReturnsAsync(_mockUrl);

            // Initialize StorageController
            var controller = new StorageController(NullLogger<StorageController>.Instance,
                mockStorageService.Object);

            // Run the GetUploadUrl method
            var result = await controller.GetUploadUrl("mockFile-2/testfile.txt") as OkObjectResult;
            // Assign Value
            var response = result?.Value as ApiResponse<string>;

            // Check Not Null
            Assert.NotNull(response);
            // Check Value Success
            Assert.True(response.Success);
            // Check Returned Object
            Assert.Equal(_mockUrl, response.ReturnedObject);

        }

        #endregion

        #region GetUploadUrlReturnsError

        [Fact]
        public async Task GetUploadUrlReturnsError()
        {

            // Initialize Mock StorageService
            var mockStorageService = new Mock<IR2StorageService>();
            // Setup GeneratePutUrlAsync
            mockStorageService.Setup(s => s.GeneratePutUrlAsync(""))
                .ThrowsAsync(new ArgumentException("ObjectKey cannot be null or empty!"));

            // Initialize StorageController
            var controller = new StorageController(NullLogger<StorageController>.Instance,
                mockStorageService.Object);

            // Run the GetUploadUrl method
            var result = await controller.GetUploadUrl("") as OkObjectResult;
            // Assign Value
            var response = result?.Value as ApiResponse;

            // Check Not Null
            Assert.NotNull(response);
            // Check Value Success
            Assert.False(response.Success);
            // Check Error Message
            Assert.Contains("ObjectKey cannot be null or empty!", response.ErrorMessage);

        }

        #endregion

        #region InitiateMultipartUploadReturnsSuccess

        [Fact]
        public async Task InitiateMultipartUploadReturnsSuccess()
        {

            // Initialize Mock StorageService
            var mockStorageService = new Mock<IR2StorageService>();
            // Setup GeneratePutUrlAsync
            mockStorageService.Setup(s => s.InitiateMultipartUploadAsync("mockFile-1/testfile.txt"))
                .ReturnsAsync("mockFile-1");

            // Initialize StorageController
            var controller = new StorageController(NullLogger<StorageController>.Instance,
                mockStorageService.Object);

            // Initialize Class
            var initiateMultipartUploadRequest = new InitiateMultipartUploadRequest
            {
                ObjectKey = "mockFile-1/testfile.txt",
                ContentType = "application/octet-stream"
            };
            // Run the InitiateMultipartUpload method
            var result = await controller.InitiateMultipartUpload(initiateMultipartUploadRequest) as OkObjectResult;
            // Assign Value
            var response = result?.Value as ApiResponse<string>;

            // Check Not Null
            Assert.NotNull(response);
            // Check Value Success
            Assert.True(response.Success);
            // Check Returned Object
            Assert.Equal("mockFile-1", response.ReturnedObject);

        }

        #endregion

        #region InitiateMultipartUploadReturnsError

        [Fact]
        public async Task InitiateMultipartUploadReturnsError()
        {

            // Initialize Mock StorageService
            var mockStorageService = new Mock<IR2StorageService>();
            // Setup GeneratePutUrlAsync
            mockStorageService.Setup(s => s.InitiateMultipartUploadAsync("mockFile-1/testfile.txt"))
                .ThrowsAsync(new AmazonS3Exception("The specified bucket does not exist."));

            // Initialize StorageController
            var controller = new StorageController(NullLogger<StorageController>.Instance,
                mockStorageService.Object);

            // Initialize Class
            var initiateMultipartUploadRequest = new InitiateMultipartUploadRequest
            {
                ObjectKey = "mockFile-1/testfile.txt",
                ContentType = "application/octet-stream"
            };
            // Run the InitiateMultipartUpload method
            var result = await controller.InitiateMultipartUpload(initiateMultipartUploadRequest) as OkObjectResult;
            // Assign Value
            var response = result?.Value as ApiResponse;

            // Check Not Null
            Assert.NotNull(response);
            // Check Value Success
            Assert.False(response.Success);
            // Check Error Message
            Assert.Contains("The specified bucket does not exist.", response.ErrorMessage);

        }

        #endregion

        #region GenerateMultipartUploadUrlReturnsSuccess

        [Fact]
        public async Task GenerateMultipartUploadUrlReturnsSuccess()
        {

            // Initialize Mock StorageService
            var mockStorageService = new Mock<IR2StorageService>();
            // Setup GenerateMultipartUploadUrlAsync
            mockStorageService.Setup(s => s.GenerateMultipartUploadUrlAsync("mockFile-1/testfile.txt", "mockFile-1", 1))
                .ReturnsAsync(_mockUrl);

            // Initialize StorageController
            var controller = new StorageController(NullLogger<StorageController>.Instance,
                mockStorageService.Object);

            // Initialize Class
            var generateMultipartUploadUrlRequest = new GenerateMultipartUploadUrlRequest
            {
                ObjectKey = "mockFile-1/testfile.txt",
                UploadId = "mockFile-1",
                PartNumber = 1
            };
            // Run the GenerateMultipartUploadUrl method
            var result = await controller.GenerateMultipartUploadUrl(generateMultipartUploadUrlRequest) as OkObjectResult;
            // Assign Value
            var response = result?.Value as ApiResponse<string>;

            // Check Not Null
            Assert.NotNull(response);
            // Check Value Success
            Assert.True(response.Success);
            // Check Returned Object
            Assert.Equal(_mockUrl, response.ReturnedObject);

        }

        #endregion

        #region GenerateMultipartUploadUrlReturnsError

        [Fact]
        public async Task GenerateMultipartUploadUrlReturnsError()
        {

            // Initialize Mock StorageService
            var mockStorageService = new Mock<IR2StorageService>();
            // Setup GeneratePutUrlAsync
            mockStorageService.Setup(s => s.GenerateMultipartUploadUrlAsync("mockFile-1/testfile.txt", "mockFile-1", 1))
                .ThrowsAsync(new AmazonS3Exception("Multipart upload does not exist or was aborted."));

            // Initialize StorageController
            var controller = new StorageController(NullLogger<StorageController>.Instance,
                mockStorageService.Object);

            // Initialize Class
            var generateMultipartUploadUrlRequest = new GenerateMultipartUploadUrlRequest
            {
                ObjectKey = "mockFile-1/testfile.txt",
                UploadId = "mockFile-1",
                PartNumber = 1
            };
            // Run the GenerateMultipartUploadUrl method
            var result = await controller.GenerateMultipartUploadUrl(generateMultipartUploadUrlRequest) as OkObjectResult;
            // Assign Value
            var response = result?.Value as ApiResponse;

            // Check Not Null
            Assert.NotNull(response);
            // Check Value Success
            Assert.False(response.Success);
            // Check Error Message
            Assert.Contains("Multipart upload does not exist or was aborted.", response.ErrorMessage);

        }

        #endregion

        #region CompleteMultipartUploadUrlReturnsSuccess

        [Fact]
        public async Task CompleteMultipartUploadUrlReturnsSuccess()
        {

            // Initialize Mock StorageService
            var mockStorageService = new Mock<IR2StorageService>();
            // Setup CompleteMultipartUploadAsync
            mockStorageService.Setup(s => s.CompleteMultipartUploadAsync("mockFile-1/testfile.txt", "mockFile-1", It.IsAny<List<UploadPart>>()))
                .Returns(Task.CompletedTask);

            // Initialize StorageController
            var controller = new StorageController(NullLogger<StorageController>.Instance,
                mockStorageService.Object);

            // Initialize Class
            var completeMultipartUploadRequest = new CompleteMultipartUploadRequest
            {
                ObjectKey = "mockFile-1/testfile.txt",
                UploadId = "mockFile-1",
                Parts = new List<UploadPart>
                {
                    new UploadPart { PartNumber = 1, ETag = "mockETag123" }
                }
            };
            // Run the CompleteMultipartUpload method
            var result = await controller.CompleteMultipartUpload(completeMultipartUploadRequest) as OkObjectResult;
            // Assign Value
            var response = result?.Value as ApiResponse;

            // Check Not Null
            Assert.NotNull(response);
            // Check Value Success
            Assert.True(response.Success);

        }

        #endregion

        #region CompleteMultipartUploadUrlReturnsError

        [Fact]
        public async Task CompleteMultipartUploadReturnsError()
        {

            // Initialize Mock StorageService
            var mockStorageService = new Mock<IR2StorageService>();
            // Setup CompleteMultipartUploadAsync
            mockStorageService.Setup(s => s.CompleteMultipartUploadAsync("mockFile-1/testfile.txt", "mockFile-1", It.IsAny<List<UploadPart>>()))
                .ThrowsAsync(new AmazonS3Exception("One or more parts could not be found when completing the upload."));

            // Initialize StorageController
            var controller = new StorageController(NullLogger<StorageController>.Instance,
                mockStorageService.Object);

            // Initialize Class
            var completeMultipartUploadRequest = new CompleteMultipartUploadRequest
            {
                ObjectKey = "mockFile-1/testfile.txt",
                UploadId = "mockFile-1",
                Parts = new List<UploadPart>
                {
                    new UploadPart { PartNumber = 1, ETag = "mockETag123" }
                }
            };
            // Run the CompleteMultipartUpload method
            var result = await controller.CompleteMultipartUpload(completeMultipartUploadRequest) as OkObjectResult;
            // Assign Value
            var response = result?.Value as ApiResponse;

            // Check Not Null
            Assert.NotNull(response);
            // Check Value Success
            Assert.False(response.Success);
            // Check Error Message
            Assert.Contains("One or more parts could not be found when completing the upload.", response.ErrorMessage);

        }

        #endregion

        #region AbortMultipartUploadUrlReturnsSuccess

        [Fact]
        public async Task AbortMultipartUploadUrlReturnsSuccess()
        {

            // Initialize Mock StorageService
            var mockStorageService = new Mock<IR2StorageService>();
            // Setup AbortMultipartUploadAsync
            mockStorageService.Setup(s => s.AbortMultipartUploadAsync("mockFile-1/testfile.txt", "mockFile-1"))
                .Returns(Task.CompletedTask);

            // Initialize StorageController
            var controller = new StorageController(NullLogger<StorageController>.Instance,
                mockStorageService.Object);

            // Initialize Class
            var AbortMultipartUploadRequest = new AbortMultipartUploadRequest
            {
                ObjectKey = "mockFile-1/testfile.txt",
                UploadId = "mockFile-1"
            };
            // Run the AbortMultipartUpload method
            var result = await controller.AbortMultipartUpload(AbortMultipartUploadRequest) as OkObjectResult;
            // Assign Value
            var response = result?.Value as ApiResponse;

            // Check Not Null
            Assert.NotNull(response);
            // Check Value Success
            Assert.True(response.Success);

        }

        #endregion

        #region AbortMultipartUploadUrlReturnsError

        [Fact]
        public async Task AbortMultipartUploadReturnsError()
        {

            // Initialize Mock StorageService
            var mockStorageService = new Mock<IR2StorageService>();
            // Setup AbortMultipartUploadAsync
            mockStorageService.Setup(s => s.AbortMultipartUploadAsync("mockFile-1/testfile.txt", "mockFile-1"))
                .ThrowsAsync(new AmazonS3Exception("Multipart upload does not exist or was aborted."));

            // Initialize StorageController
            var controller = new StorageController(NullLogger<StorageController>.Instance,
                mockStorageService.Object);

            // Initialize Class
            var AbortMultipartUploadRequest = new AbortMultipartUploadRequest
            {
                ObjectKey = "mockFile-1/testfile.txt",
                UploadId = "mockFile-1"
            };
            // Run the AbortMultipartUpload method
            var result = await controller.AbortMultipartUpload(AbortMultipartUploadRequest) as OkObjectResult;
            // Assign Value
            var response = result?.Value as ApiResponse;

            // Check Not Null
            Assert.NotNull(response);
            // Check Value Success
            Assert.False(response.Success);
            // Check Error Message
            Assert.Contains("Multipart upload does not exist or was aborted.", response.ErrorMessage);

        }

        #endregion

    }

}

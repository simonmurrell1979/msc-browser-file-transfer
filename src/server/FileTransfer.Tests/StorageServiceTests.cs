using Amazon.S3;
using FileTransfer.Common.Models;
using FileTransfer.Common.Models.Downloads;
using FileTransfer.Common.Models.Uploads;
using FileTransfer.Common.Storage;
using FileTransfer.RestAPI.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace FileTransfer.Tests
{
    
    public class StorageServiceTests
    {

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

    }

}

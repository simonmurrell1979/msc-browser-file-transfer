// https://developers.cloudflare.com/r2/api/error-codes/

using FileTransfer.Common.Models;
using FileTransfer.Common.Storage;
using FileTransfer.RestAPI.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace FileTransfer.Tests
{
    
    public class StorageControllerTests
    {

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

    }

}

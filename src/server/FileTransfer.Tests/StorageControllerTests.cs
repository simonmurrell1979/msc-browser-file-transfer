using Castle.Core.Logging;
using FileTransfer.Common.Models;
using FileTransfer.Common.Storage;
using FileTransfer.RestAPI.Controllers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace FileTransfer.Tests
{
    
    public class StorageControllerTests
    {

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

    }

}

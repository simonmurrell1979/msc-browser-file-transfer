using Amazon.S3;
using FileTransfer.Common.Configuration;
using FileTransfer.Common.Models;
using FileTransfer.Common.Models.Downloads;
using FileTransfer.Common.Models.Uploads;
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

    }

}

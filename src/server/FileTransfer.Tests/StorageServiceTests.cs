using FileTransfer.Common.Configuration;
using FileTransfer.Services.Storage;
using Microsoft.Extensions.Options;

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

    }

}

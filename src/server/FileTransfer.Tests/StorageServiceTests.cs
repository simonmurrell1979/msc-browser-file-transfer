using Amazon.S3;
using Amazon.S3.Model;
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

        #region ListMultipartUploadPartsStripETagsProperly

        [Fact]
        public async Task ListMultipartUploadPartsStripETagsProperly()
        {

            // Initialize Mock Amazon S3 Client
            var amazons3Client = new Mock<IAmazonS3>();
            // Setup ListPartsAsync
            amazons3Client.Setup(s => s.ListPartsAsync(It.IsAny<ListPartsRequest>(), default))
                .ReturnsAsync(new ListPartsResponse
                {
                    Parts = new List<PartDetail>
                    {
                        new PartDetail { PartNumber = 1, ETag = "\"mockETag123\"" },
                        new PartDetail { PartNumber = 2, ETag = "\"mockETag456\"" }
                    }
                });
            // Initialize R2 Storage Service
            var service = new R2StorageService(SetupOptions(), amazons3Client.Object);
            // List Multipart Upload Parts
            var parts = await service.ListMultipartUploadPartsAsync("mockFile-1/testfile.txt", "mockFile-1");

            // Check Not Null
            Assert.NotNull(parts);
            // Check Length
            Assert.Equal(2, parts.Count);
            // Check ETags
            Assert.Equal("mockETag123", parts[0].ETag);
            Assert.Equal("mockETag456", parts[1].ETag);
            // Check Part Numbers
            Assert.Equal(1, parts[0].PartNumber);
            Assert.Equal(2, parts[1].PartNumber);

        }

        #endregion

    }

}

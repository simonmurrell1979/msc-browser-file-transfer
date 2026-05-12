namespace FileTransfer.Common.Models.Uploads
{
    
    public class GenerateMultipartUploadUrlRequest
    {

        public string ObjectKey { get; set; } = "";
        public string UploadId { get; set; } = "";
        public int PartNumber { get; set; } = 0;

    }

}

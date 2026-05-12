namespace FileTransfer.Common.Models.Uploads
{
    
    public class CompleteMultipartUploadRequest
    {

        public string ObjectKey { get; set; } = "";
        public string UploadId { get; set; } = "";
        public List<(string ETag, int PartNumber)> Parts { get; set; } = new List<(string ETag, int PartNumber)>();

    }

}

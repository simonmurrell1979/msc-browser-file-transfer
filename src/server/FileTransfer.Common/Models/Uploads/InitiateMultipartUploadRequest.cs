namespace FileTransfer.Common.Models.Uploads
{
    
    public class InitiateMultipartUploadRequest
    {

        public string ObjectKey { get; set; } = "";
        public string ContentType { get; set; } = "application/octet-stream";

    }

}

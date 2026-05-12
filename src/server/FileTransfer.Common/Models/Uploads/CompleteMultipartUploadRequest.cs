namespace FileTransfer.Common.Models.Uploads
{
    
    public class CompleteMultipartUploadRequest
    {

        public string ObjectKey { get; set; } = "";
        public string UploadId { get; set; } = "";
        public List<UploadPart> Parts { get; set; } = new List<UploadPart>();

    }

}

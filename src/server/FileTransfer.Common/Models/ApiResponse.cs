using System.Text.Json.Serialization;

namespace FileTransfer.Common.Models
{

    public class ApiResponse
    {

        public bool Success { get; set; }
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string ErrorMessage { get; set; }

    }

    public class ApiResponse<T> : ApiResponse
    {

        public T ReturnedObject { get; set; }

    }

}

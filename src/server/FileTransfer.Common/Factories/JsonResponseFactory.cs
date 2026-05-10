using FileTransfer.Common.Models;

namespace FileTransfer.Common.Factories
{

    public static class JsonResponseFactory
    {

        #region ErrorResponse

        public static ApiResponse ErrorResponse(string error)
        {

            // Return
            return new ApiResponse
            {
                Success = false,
                ErrorMessage = error
            };

        }

        #endregion

        #region SuccessResponse

        public static ApiResponse SuccessResponse()
        {

            // Return
            return new ApiResponse
            {
                Success = true
            };

        }

        #endregion

        #region SuccessResponse

        public static ApiResponse<T> SuccessResponse<T>(T ReferenceObject)
        {

            // Return
            return new ApiResponse<T>
            {
                Success = true,
                ReturnedObject = ReferenceObject
            };

        }

        #endregion

    }

}

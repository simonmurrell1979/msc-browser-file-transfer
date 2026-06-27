export interface ApiResponse {
    Success: boolean;
    ErrorMessage?: string;
}

export interface ApiResponseWithData<T> extends ApiResponse {
    ReturnedObject?: T;
}

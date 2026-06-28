import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment.development";
import { ApiResponse, ApiResponseWithData } from "../models/apiresponse";
import { firstValueFrom } from "rxjs";

@Injectable({ providedIn: "root" })
export class StorageService {

    // Private variables
    private readonly _httpClient = inject(HttpClient);

    public async getUploadUrl(objectKey: string): Promise<string> {

        // Build URL
        const requestUrl = `${environment.apiBaseUrl}/Storage/GetUploadUrl?objectKey=${encodeURIComponent(objectKey)}`;
        // Make HTTP request
        const response = await firstValueFrom(this._httpClient.get<ApiResponseWithData<string>>(requestUrl));
        // Check Value
        return this.checkResponseWithData<string>(response);

    }

    public async initiateMultipartUpload(objectKey: string, contentType: string): Promise<string> {

        // Build URL
        const requestUrl = `${environment.apiBaseUrl}/Storage/InitiateMultipartUpload`;
        // Build Request Body
        const requestBody = {
            objectKey: objectKey,
            contentType: contentType
        };
        // Make HTTP request
        const response = await firstValueFrom(this._httpClient.post<ApiResponseWithData<string>>(requestUrl, requestBody));
        // Check Value
        return this.checkResponseWithData<string>(response);

    }

    public async generateMultipartUploadUrl(objectKey: string, uploadId: string, partNumber: number): Promise<string> {

        // Build URL
        const requestUrl = `${environment.apiBaseUrl}/Storage/GenerateMultipartUploadUrl`;
        // Build Request Body
        const requestBody = {
            objectKey: objectKey,
            uploadId: uploadId,
            partNumber: partNumber
        };
        // Make HTTP request
        const response = await firstValueFrom(this._httpClient.post<ApiResponseWithData<string>>(requestUrl, requestBody));
        // Check Value
        return this.checkResponseWithData<string>(response);

    }

    public async completeMultipartUpload(objectKey: string, uploadId: string, parts: UploadPart[]): Promise<boolean> {

        // Build URL
        const requestUrl = `${environment.apiBaseUrl}/Storage/CompleteMultipartUpload`;
        // Build Request Body
        const requestBody = {
            objectKey: objectKey,
            uploadId: uploadId
            parts: parts
        };
        // Make HTTP request
        const response = await firstValueFrom(this._httpClient.post<ApiResponse>(requestUrl, requestBody));
        // Check Value
        return this.checkResponse(response);

    }

    public async abortMultipartUpload(objectKey: string, uploadId: string): Promise<boolean> {

        // Build URL
        const requestUrl = `${environment.apiBaseUrl}/Storage/AbortMultipartUpload`;
        // Build Request Body
        const requestBody = {
            objectKey: objectKey,
            uploadId: uploadId
        };
        // Make HTTP request
        const response = await firstValueFrom(this._httpClient.post<ApiResponse>(requestUrl, requestBody));
        // Check Value
        return this.checkResponse(response);

    }

    private checkResponse(response: ApiResponse): boolean {

        // Check Response
        if (!response ||
            !response.Success) {
            
            // Throw Exception
            throw new Error(response.ErrorMessage || "An error occurred while processing the request.");

        }
        // Return
        return response.Success;

    }

    private checkResponseWithData<T>(response: ApiResponseWithData<T>): T {

        // Check Response
        if (!response ||
            !response.Success ||
            response.ReturnedObject == null) {
            
            // Throw Exception
            throw new Error(response.ErrorMessage || "An error occurred while processing the request.");

        }
        // Return
        return response.ReturnedObject;

    }

}

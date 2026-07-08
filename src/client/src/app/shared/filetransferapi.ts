import { environment } from "../../environments/environment.development";
import { ApiResponse, ApiResponseWithData } from "../models/apiresponse";
import { TransferInfo } from "../models/transferinfo";
import { UploadPart } from "../models/uploadpart";

export class FileTransferApi {

    private async getJson<T>(url: string): Promise<T> {

        // Send Request
        const response = await fetch(`${environment.apiBaseUrl}/Storage/${url}`);
        // Return
        return await response.json() as T;

    }

    private async postJson<T>(url: string, body: any): Promise<T> {

        // Send Request
        const response = await fetch(`${environment.apiBaseUrl}/Storage/${url}`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        // Return
        return await response.json() as T;

    }

    public async getUploadUrl(objectKey: string): Promise<string> {

        // Build URL
        const requestUrl = `GetUploadUrl?objectKey=${encodeURIComponent(objectKey)}`;
        // Make HTTP request
        const response = await this.getJson<ApiResponseWithData<string>>(requestUrl);
        // Check Value
        return this.checkResponseWithData<string>(response);

    }

    public async getDownloadUrl(objectKey: string): Promise<string> {

        // Build URL
        const requestUrl = `GetDownloadUrl?objectKey=${encodeURIComponent(objectKey)}`;
        // Make HTTP request
        const response = await this.getJson<ApiResponseWithData<string>>(requestUrl);
        // Check Value
        return this.checkResponseWithData<string>(response);

    }

    public async initiateMultipartUpload(objectKey: string, contentType: string): Promise<string> {

        // Build URL
        const requestUrl = "InitiateMultipartUpload";
        // Build Request Body
        const requestBody = {
            objectKey: objectKey,
            contentType: contentType
        };
        // Make HTTP request
        const response = await this.postJson<ApiResponseWithData<string>>(requestUrl, requestBody);
        // Check Value
        return this.checkResponseWithData<string>(response);

    }

    public async generateMultipartUploadUrl(objectKey: string, uploadId: string, partNumber: number): Promise<string> {

        // Build URL
        const requestUrl = "GenerateMultipartUploadUrl";
        // Build Request Body
        const requestBody = {
            objectKey: objectKey,
            uploadId: uploadId,
            partNumber: partNumber
        };
        // Make HTTP request
        const response = await this.postJson<ApiResponseWithData<string>>(requestUrl, requestBody);
        // Check Value
        return this.checkResponseWithData<string>(response);

    }

    public async completeMultipartUpload(objectKey: string, uploadId: string, parts: UploadPart[]): Promise<boolean> {

        // Build URL
        const requestUrl = "CompleteMultipartUpload";
        // Build Request Body
        const requestBody = {
            objectKey: objectKey,
            uploadId: uploadId,
            parts: parts
        };
        // Make HTTP request
        const response = await this.postJson<ApiResponse>(requestUrl, requestBody);
        // Check Value
        return this.checkResponse(response);

    }

    public async abortMultipartUpload(objectKey: string, uploadId: string): Promise<boolean> {

        // Build URL
        const requestUrl = "AbortMultipartUpload";
        // Build Request Body
        const requestBody = {
            objectKey: objectKey,
            uploadId: uploadId
        };
        // Make HTTP request
        const response = await this.postJson<ApiResponse>(requestUrl, requestBody);
        // Check Value
        return this.checkResponse(response);

    }

    public async listMultipartUploadParts(objectKey: string, uploadId: string): Promise<UploadPart[]> {

        // Build URL
        const requestUrl = "ListMultipartUploadParts";
        // Build Request Body
        const requestBody = {
            objectKey: objectKey,
            uploadId: uploadId
        };
        // Make HTTP request
        const response = await this.postJson<ApiResponseWithData<UploadPart[]>>(requestUrl, requestBody);
        // Check Value
        return this.checkResponseWithData<UploadPart[]>(response);

    }

    public async getTransferInformation(objectKeyGuid: string): Promise<TransferInfo> {

        // Build URL
        const requestUrl = "GetTransferInformation";
        // Build Request Body
        const requestBody = {
            objectKeyGuid: objectKeyGuid
        };
        // Make HTTP request
        const response = await this.postJson<ApiResponseWithData<TransferInfo>>(requestUrl, requestBody);
        // Check Value
        return this.checkResponseWithData<TransferInfo>(response);

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

import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment.development";
import { ApiResponseWithData } from "../models/apiresponse";
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
        return this.checkResponse<string>(response);

    }

    private checkResponse<T>(response: ApiResponseWithData<T>): T {

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

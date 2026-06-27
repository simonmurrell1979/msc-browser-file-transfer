import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiResponse } from '../models/apiresponse';

@Injectable({ providedIn: 'root' })
export class ConnectionService {

    // Private Variables
    private readonly _httpClient = inject(HttpClient);
    private readonly _baseUrl = environment.apiBaseUrl;

    public TestConnection(): Observable<ApiResponse> {

        // Return
        return this._httpClient.get<ApiResponse>(`${this._baseUrl}/Storage/TestConnection`);

    }
    
}

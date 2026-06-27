import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment.development";
//import { Observable } from "rxjs";
//import { environment } from "src/environments/environment";
//import { ApiResponse } from "../models/apiresponse";

@Injectable({ providedIn: "root" })
export class ConnectionService {

    // Private Variables
    private readonly _httpClient = inject(HttpClient);
    private readonly _baseUrl = environment.apiBaseUrl;

}

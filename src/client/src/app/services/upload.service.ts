import { inject, Injectable } from "@angular/core";
import { StorageService } from "./storage.service";

@Injectable({ providedIn: "root" })
export class UploadService {

    // Private variables
    private readonly _storageService = inject(StorageService);

    public async uploadFile(file: File): Promise<void> {

        

    }

}


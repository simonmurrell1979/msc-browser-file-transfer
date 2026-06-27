import { inject, Injectable } from "@angular/core";
import { StorageService } from "./storage.service";

@Injectable({ providedIn: "root" })
export class UploadService {

    // Private variables
    private readonly _storageService = inject(StorageService);

    public async uploadFile(file: File): Promise<void> {

        // Get Upload Url
        var uploadUrl = await this._storageService.getUploadUrl(file.name);
        // Fetch the upload url and send the file
        var response = await fetch(uploadUrl, {
            method: "PUT",
            body: file
        });
        // Check Response
        if (!response.ok) {

            // Throw Error
            throw new Error(`Failed to upload file: ${response.statusText}`);

        }

    }

}


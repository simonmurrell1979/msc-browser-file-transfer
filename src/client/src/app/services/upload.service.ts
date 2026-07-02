import { inject, Injectable } from "@angular/core";
import { FileTransferUpload } from "../shared/filetransferupload";
import { FileTransferDb } from "../shared/filetransferdb";
import { FileTransferApi } from "../shared/filetransferapi";

@Injectable({ providedIn: "root" })
export class UploadService extends FileTransferUpload {

    constructor() {

        // Initialize Classes
        super(inject(FileTransferApi), inject(FileTransferDb));

    }

}
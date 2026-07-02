import { inject, Injectable } from "@angular/core";
import { FileTransferUpload } from "../shared/filetransferupload";
import { StorageService } from "./storage.service";
import { DbService } from "./db.service";

@Injectable({ providedIn: "root" })
export class UploadService extends FileTransferUpload {

    constructor() {

        // Initialize Classes
        super(inject(StorageService), inject(DbService));

    }

}
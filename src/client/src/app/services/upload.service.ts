import { Injectable } from "@angular/core";
import { FileTransferUpload } from "../shared/filetransferupload";

@Injectable({ providedIn: "root" })
export class UploadService extends FileTransferUpload {}
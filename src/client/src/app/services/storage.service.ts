import { Injectable } from "@angular/core";
import { FileTransferApi } from "../shared/filetransferapi";

@Injectable({ providedIn: "root" })
export class StorageService extends FileTransferApi {}

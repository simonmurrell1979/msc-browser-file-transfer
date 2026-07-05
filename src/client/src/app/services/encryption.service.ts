import { Injectable } from "@angular/core";
import { FileTransferEncryption } from "../shared/filetransferencryption";

@Injectable({ providedIn: "root" })
export class EncryptionService extends FileTransferEncryption {}

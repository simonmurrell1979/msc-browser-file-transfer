import { FileIdentifier } from "./fileidentifier";
import { UploadPart } from "./uploadpart";

export interface UploadRecord {
    uploadId: string;
    objectKey: string;
    contentType: string;
    fileIdentifier: FileIdentifier;
    partSize: number;
    totalParts: number;
    createDate: number;
    uploadedParts: UploadPart[];
}
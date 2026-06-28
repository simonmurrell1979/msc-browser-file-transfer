import { UploadPart } from "./uploadpart";

export interface UploadRecord {
    uploadId: string;
    objectKey: string;
    contentType: string;
    fileIdentifier: {
        name: string;
        size: number;
        lastModified: number;
        hash: string | null;
    };
    partSize: number;
    totalParts: number;
    createDate: number;
    uploadedParts: UploadPart[];
}
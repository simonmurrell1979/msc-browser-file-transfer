export interface FileIdentifier {
    name: string;
    size: number;
    lastModified: number;
    hash: string | null;
}
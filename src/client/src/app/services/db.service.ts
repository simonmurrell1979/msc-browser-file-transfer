//*************************************************/
// https://www.npmjs.com/package/idb
// https://github.com/jakearchibald/idb
//*************************************************/
import { Injectable } from "@angular/core";
import { FileTransferDb } from "../shared/filetransferdb";

@Injectable({ providedIn: "root" })
export class DbService extends FileTransferDb {}

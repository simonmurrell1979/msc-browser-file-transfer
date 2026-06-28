import { Component, inject, signal } from "@angular/core";
import { UploadService } from "../../services/upload.service";
import { UploadRecord } from "../../models/uploadrecord";
import { DbService } from "../../services/db.service";

@Component({
    selector: "app-send",
    imports: [],
    templateUrl: "./send.component.html",
    styleUrl: "./send.component.css",
})
export class SendComponent {

    // Private Variables
    private readonly _uploadService = inject(UploadService);
    private readonly _dbService = inject(DbService);
    // Protected Variables
    protected readonly selectedFile = signal<File | null>(null);
    protected readonly pendingUpload = signal<UploadRecord | null>(null);

    public async ngOnInit(): Promise<void> {

        // Find Latest Pending Upload
        const latestUpload = await this._dbService.findLatestUpload();
        // Check Value
        if (latestUpload == null) {

            // Exit
            return;

        }
        // Set Pending Upload
        this.pendingUpload.set(latestUpload);
        // Log Message
        console.log("Latest pending upload found:", latestUpload);

    }

    protected onFileSelected(event: Event): void {

        // Set input
        const input = event.target as HTMLInputElement;
        // Check files are selected
        if (input.files == null || input.files.length === 0) {

            // Exit
            return;

        }
        // Set selected file
        this.selectedFile.set(input.files[0]);

    }

    protected async onSendFile(): Promise<void> {

        // Get selected file
        const file = this.selectedFile();
        // Check Value
        if (file == null) {

            // Exit
            return;

        }

        try {

            // Load Value
            const pendingUpload = this.pendingUpload();
            // Check Value
            if (pendingUpload) {

                // Resume Upload
                await this._uploadService.resumeUpload(file,
                    pendingUpload);

            }
            else {

                // New Upload
                await this._uploadService.newUpload(file);

            }
            // Clear Pending Upload
            this.pendingUpload.set(null);

        }
        catch (error) {

            // Log Error
            console.error("Error sending file:", error);

        }

    }

}

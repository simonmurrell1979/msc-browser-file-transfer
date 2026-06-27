import { Component, inject, signal } from "@angular/core";
import { UploadService } from "../../services/upload.service";

@Component({
    selector: "app-send",
    imports: [],
    templateUrl: "./send.component.html",
    styleUrl: "./send.component.css",
})
export class SendComponent {

    // Private Variables
    private readonly _uploadService = inject(UploadService);
    // Protected Variables
    protected readonly selectedFile = signal<File | null>(null);

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

            // Upload file to server
            await this._uploadService.uploadFile(file);
            // Log Success
            console.log("File sent successfully!");

        }
        catch (error) {

            // Log Error
            console.error("Error sending file:", error);

        }

    }

}

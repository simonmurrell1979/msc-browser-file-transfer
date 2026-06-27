import { Component, signal } from '@angular/core';

@Component({
    selector: 'app-send',
    imports: [],
    templateUrl: './send.component.html',
    styleUrl: './send.component.css',
})
export class SendComponent {

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

}

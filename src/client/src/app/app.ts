import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConnectionService } from './services/connection.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.scss',
})
export class App {

  // Protected Variables
  protected readonly title = signal('file-transfer-client');
  protected readonly connectionResult = signal<string>("");
  // Private Variables
  private readonly _connectionService = inject(ConnectionService);

  protected TestConnection(): void {

    // Subscribe to the connection service
    this._connectionService.TestConnection().subscribe({

      // Next
      next: (response) => {

        // Set the connection result
        this.connectionResult.set(response.Success ? "Connection Successful" : `Connection Failed: ${response.ErrorMessage}`);

      },
      error: (error) => {

        // Set the connection result
        this.connectionResult.set(`Error: ${error.message}`);
        
      }

    });

  }

}

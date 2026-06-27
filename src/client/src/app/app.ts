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



}

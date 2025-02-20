import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './wallet/wallet.component.html',
  styleUrl: './wallet/wallet.component.html'
})
export class AppComponent {
  title = 'solana-swap';
}

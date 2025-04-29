import { Component, EventEmitter, Output } from '@angular/core';
import { SolanaWalletService } from '../services/solana-wallet.service';

@Component({
  selector: 'app-connect-wallet-button',
  standalone: true,
  templateUrl:'./connect-wallet-button.component.html',
  styleUrls: ['./connect-wallet-button.component.scss']
})
export class ConnectWalletButtonComponent {
  @Output() walletConnected = new EventEmitter<void>();

  constructor(private walletService: SolanaWalletService) {}

  async connectWallet() {
    try {
      await this.walletService.connectWalletViaAppKit();
      // await this.walletService.connectWallet();
      this.walletConnected.emit();
    } catch (error: any) {
      console.error('Error connecting wallet:', error.message);
    }
  }
}

import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectWalletButtonComponent} from "../connect-wallet-button/connect-wallet-button.component";
import { WalletConnectButtonComponent} from "../walletconnect-button/walletconnect-button.component";

@Component({
  selector: 'app-wallet-modal',
  standalone: true,
  imports: [CommonModule, ConnectWalletButtonComponent, WalletConnectButtonComponent],
  templateUrl: './wallet-modal.component.html',
  styleUrls: ['./wallet-modal.component.scss']
})
export class WalletModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() walletConnected = new EventEmitter<void>();
  @Output() openWalletConnect = new EventEmitter<void>();

  onPhantomWalletConnected() {
    this.walletConnected.emit();
    this.closeModal.emit();
  }

  onWalletConnectPressed() {
    this.openWalletConnect.emit();
  }

  close() {
    this.closeModal.emit();
  }
}

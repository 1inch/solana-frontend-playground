import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-wallet-connect-button',
  standalone: true,
  templateUrl: 'walletconnect-button.component.html',
  styleUrls: ['./walletconnect-button.component.scss']
})
export class WalletConnectButtonComponent {
  @Output() openWalletConnectModal = new EventEmitter<void>();

  onClick() {
    // Emit an event so that the parent component (or modal) can open the WalletConnect modal.
    this.openWalletConnectModal.emit();
  }
}

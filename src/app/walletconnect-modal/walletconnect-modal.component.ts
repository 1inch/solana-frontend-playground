import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeModule } from 'angularx-qrcode';
import SignClient from '@walletconnect/sign-client';
import { SolanaWalletService } from '../services/solana-wallet.service'; // adjust the path as needed

@Component({
    selector: 'app-wallet-connect-modal',
    standalone: true,
    imports: [CommonModule, QRCodeModule],
    templateUrl: './walletconnect-modal.component.html',
    styleUrls: ['./walletconnect-modal.component.scss']
})
export class WalletConnectModalComponent implements OnInit {
    @Output() closeModal = new EventEmitter<void>();
    connectionUri: string = "";
    signClient: SignClient | null = null;

    constructor(private walletService: SolanaWalletService) {}

    async ngOnInit(): Promise<void> {
        await this.initWalletConnectV2();
    }

    async initWalletConnectV2(): Promise<void> {
        try {
            this.signClient = await SignClient.init({
                projectId: '931db51d589a2ab5bc53ac8fc5aa0376',
                relayUrl: 'wss://relay.walletconnect.com', // https ?
                metadata: {
                    name: 'My DApp',
                    description: 'My DApp description',
                    url: 'https://mydapp.example.com',
                    icons: ['https://mydapp.example.com/icon.png']
                }
            });

            const { uri, approval } = await this.signClient.connect({
                requiredNamespaces: {
                    solana: {
                        methods: ["solana_signTransaction", "solana_signMessage", 'eth_sendTransaction', 'personal_sign'],
                        chains: ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"],
                        events: ["accountsChanged"],
                    },
                },
            });

            if (uri) {
                this.connectionUri = uri;
                console.log('WalletConnect v2 URI:', this.connectionUri);
            }

            const session = await approval();
            console.log('WalletConnect v2 session approved:', session);

            const solanaAccounts = session.namespaces['solana'].accounts;
            if (solanaAccounts.length > 0) {
                const walletAddress = solanaAccounts[0].split(':')[2];
                console.log('Connected wallet address:', walletAddress);

                // Update the wallet address and WalletConnect session in the service.
                this.walletService.updateWalletAddressFromWalletConnect(walletAddress);
                this.walletService.setWalletConnectSession(session, this.signClient);
            }

            this.close();
        } catch (error) {
            console.error('Error initializing WalletConnect v2:', error);
        }
    }

    close(): void {
        this.closeModal.emit();
    }
}

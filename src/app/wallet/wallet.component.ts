// src/app/wallet/wallet.component.ts
import {Component, OnInit, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {SolanaWalletService, TokenBalance} from '../services/solana-wallet.service';
import {WalletModalComponent} from "../wallet-modal/wallet-modal.component";
import {PublicKey} from "@solana/web3.js";
import {Subscription} from "rxjs";
import { WalletConnectModalComponent} from "../walletconnect-modal/walletconnect-modal.component";

@Component({
    selector: 'app-wallet',
    standalone: true,
    imports: [CommonModule, FormsModule, HttpClientModule, WalletModalComponent, WalletConnectModalComponent],
    templateUrl: './wallet.component.html',
    styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {
    walletAddress: PublicKey | null = null;
    private walletAddressSub?: Subscription;
    recipientAddress: string = '';
    sendAmount: string = '';
    tokenRecipient: string = '';
    tokenAmount: string = '';
    logMessages: string[] = [];

    walletBalance: number | null = null;
    solPrice: number = 0;
    tokenBalances: TokenBalance[] = [];

    // USDC mint address (for example)
    usdcMintAddress: string = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    isModalOpen: boolean = false;
    isWalletConnectModalOpen: boolean = false;

    constructor(protected walletService: SolanaWalletService, private http: HttpClient) {
    }

    ngOnInit(): void {
        this.walletAddressSub = this.walletService.$walletAddress.subscribe(address => {
            this.walletAddress = address;
            console.log('Wallet address updated:', address?.toString());
        });
    }

    openWalletConnectModal() {
        this.isModalOpen = false;
        this.isWalletConnectModalOpen = true;
    }

    ngOnDestroy(): void {
        // Unsubscribe to prevent memory leaks.
        this.walletAddressSub?.unsubscribe();
    }

    async connectWallet() {
        try {
            await this.walletService.connectWallet();
            this.logMessages.push("Wallet connected successfully.");
            await this.refreshBalances();
        } catch (error: any) {
            this.logMessages.push(error.message);
        }
    }

    async disconnectWallet() {
        try {
            await this.walletService.disconnectWallet();
            this.logMessages.push("Wallet disconnected.");
            this.walletBalance = null;
            this.tokenBalances = [];
            this.solPrice = 0;
        } catch (error: any) {
            this.logMessages.push(error.message);
        }
    }

    async sendSOLANA() {
        try {
            const signature = await this.walletService.sendSOLANA(this.recipientAddress, this.sendAmount);
            this.logMessages.push("SOL Transaction successful: " + signature);
            await this.refreshBalances();
        } catch (error: any) {
            this.logMessages.push(error.message);
        }
    }

    async sendUSDC() {
        try {
            const signature = await this.walletService.sendUSDC(this.tokenRecipient, this.tokenAmount, this.usdcMintAddress);
            this.logMessages.push("USDC Transaction successful: " + signature);
            await this.refreshBalances();
        } catch (error: any) {
            this.logMessages.push(error.message);
        }
    }

    async refreshBalances() {
        if (this.walletService.walletPublicKey) {
            try {
                this.walletBalance = await this.walletService.getSOLBalance(this.walletService.walletPublicKey);
            } catch (error: any) {
                this.logMessages.push("Error fetching SOL balance: " + error.message);
            }
            try {
                this.solPrice = await this.walletService.getSOLPrice();
            } catch (error: any) {
                this.logMessages.push("Error fetching SOL price: " + error.message);
            }
            try {
                const tokenBalancesData = await this.walletService.getTokenBalances(this.walletService.walletPublicKey);
                this.tokenBalances = tokenBalancesData;
                // For tokens with a valid CoinGecko ID, fetch their current prices.
                const ids = this.tokenBalances
                    .filter(token => token.coinGeckoId && token.coinGeckoId.length > 0)
                    .map(token => token.coinGeckoId)
                    .join(',');
                if (ids) {
                    this.http
                        .get<any>(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`)
                        .subscribe(data => {
                            this.tokenBalances = this.tokenBalances.map(token => {
                                if (token.coinGeckoId && data[token.coinGeckoId] && data[token.coinGeckoId].usd) {
                                    token.currentPrice = data[token.coinGeckoId].usd;
                                }
                                return token;
                            });
                        });
                }
            } catch (error: any) {
                this.logMessages.push("Error fetching token balances: " + error.message);
            }
        }
    }

    async handleWalletConnected() {
        await this.refreshBalances();
    }

}

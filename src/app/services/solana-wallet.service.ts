import {Injectable, signal} from '@angular/core';
import {Connection, LAMPORTS_PER_SOL, PublicKey, Signer, SystemProgram, Transaction} from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import {TokenInfo, TokenListProvider} from '@solana/spl-token-registry';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, firstValueFrom, Observable} from 'rxjs';
import SignClient from '@walletconnect/sign-client';
import { createAppKit } from '@reown/appkit'
import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import {SolanaAdapter} from "@reown/appkit-adapter-solana";
import { solana } from '@reown/appkit/networks'
import {isAddress} from "ethers/lib/utils";

const projectId = '931db51d589a2ab5bc53ac8fc5aa0376'

const metadata = {
    name: 'My Website',
    description: 'My Website description',
    url: 'https://mywebsite.com',
    icons: ['https://avatars.mywebsite.com/']
}


export interface TokenBalance {
    mint: string;
    balance: number;
    decimals: number;
    uiAmount: number;
    name?: string;
    symbol?: string;
    coinGeckoId?: string;
    currentPrice?: number;
}

function base64ToUint8Array(base64:any): Uint8Array {
    const binaryStr = window.atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
}

const solanaWeb3JsAdapter = new SolanaAdapter({
    wallets: []
})

@Injectable({
    providedIn: 'root'
})
export class SolanaWalletService {
    private readonly connection: Connection;
    private walletAddressSubject: BehaviorSubject<PublicKey | null> = new BehaviorSubject<PublicKey | null>(null);
    address = signal<string | null>(null);

    allAddresses = signal<Set<string>>(new Set());

    solanaAddress = signal<string | null>(null);
    eip155Address = signal<string | null>(null);

    modal = createAppKit({
        adapters: [new Ethers5Adapter(), solanaWeb3JsAdapter],
        metadata: metadata,
        networks: [mainnet, arbitrum, solana],
        projectId,
        features: {
            allWallets: false,
            onramp: false,
            history: false,
            receive: false,
            send: false,
            emailShowWallets: false,
            email: false,
            swaps: false,
            socials: false,
            analytics: true // Optional - defaults to your Cloud configuration
        }
    })



    // SPL Token Program ID (constant for Solana)
    private readonly TOKEN_PROGRAM_ID = new PublicKey(
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    );

    private coinMapping: Map<string, string> = new Map();

    constructor(private http: HttpClient) {
        this.connection = new Connection('https://solana-rpc.publicnode.com', 'confirmed');

        this.modal.subscribeAccount((acc) => {
            console.log(acc.allAccounts.length);
            if (acc.allAccounts.length > 0) {
                const addresses = new Set<string>();

                const solanaAddress = this.modal.getAddressByChainNamespace('solana');
                const eip155Address = this.modal.getAddressByChainNamespace('eip155');

                if (solanaAddress) {
                    addresses.add(solanaAddress);
                }

                if (eip155Address) {
                    addresses.add(eip155Address);
                }

                this.allAddresses.set(addresses);

                const p = this.modal.getProvider('eip155');
                console.log('Provider:', p);
            }
            this.address.set(acc?.address ?? null);
        })

        console.log(this.modal)
    }

    private walletConnectSession: any = null;
    private walletConnectSignClient: SignClient | null = null;

    updateWalletAddressFromWalletConnect(walletAddress: string): void {
        try {
            const publicKey = new PublicKey(walletAddress);
            this.address.set(walletAddress);
            this.walletAddressSubject.next(publicKey);
            console.log('Wallet address updated from WalletConnect:', publicKey.toBase58());
        } catch (error) {
            console.error('Error updating wallet address from WalletConnect:', error);
        }
    }


    async connectWalletViaAppKit(): Promise<void> {
        try {
            await this.modal.open();
        } catch (error) {
            console.error('Error connecting wallet via AppKit:', error);
        }
    }

    async disconnectWallet(): Promise<void> {
        await this.modal.disconnect();
        this.address.set(null);
        this.allAddresses.set(new Set());
    }

    async getSOLBalance(publicKey: PublicKey): Promise<number> {
        try {
            const lamports = await this.connection.getBalance(publicKey);
            return lamports / LAMPORTS_PER_SOL;
        } catch (error: any) {
            throw new Error(`Error fetching SOL balance: ${error.message}`);
        }
    }

    private async loadCoinMapping(): Promise<Map<string, string>> {
        if (this.coinMapping.size > 0) {
            return this.coinMapping;
        }
        try {
            const coins = await firstValueFrom(
                this.http.get<any[]>('https://api.coingecko.com/api/v3/coins/list')
            );
            coins.forEach(coin => {
                const symbol = coin.symbol.toLowerCase();
                if (!this.coinMapping.has(symbol)) {
                    this.coinMapping.set(symbol, coin.id);
                }
            });
        } catch (error) {
            console.error('Error loading coin mapping', error);
        }
        return this.coinMapping;
    }

    async getTokenBalances(publicKey: PublicKey): Promise<TokenBalance[]> {
        try {
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(publicKey, {
                programId: this.TOKEN_PROGRAM_ID
            });

            const tokenBalances: TokenBalance[] = tokenAccounts.value.map(tokenAccount => {
                const info = tokenAccount.account.data.parsed.info;
                return {
                    mint: info.mint,
                    balance: info.tokenAmount.uiAmount,
                    decimals: info.tokenAmount.decimals,
                    uiAmount: info.tokenAmount.uiAmount
                };
            });

            const tokenListProvider = new TokenListProvider();
            const tokenListContainer = await tokenListProvider.resolve();
            const tokenList = tokenListContainer.filterByClusterSlug('mainnet-beta').getList();

            const tokenMap: { [mint: string]: TokenInfo } = {};
            tokenList.forEach(token => {
                tokenMap[token.address] = token;
            });

            const balances$$ = tokenBalances.map(async tb => {
                const meta = tokenMap[tb.mint];
                let coinGeckoId = '';
                if (meta) {
                    coinGeckoId = meta.extensions && meta.extensions.coingeckoId ? meta.extensions.coingeckoId : '';
                }
                if (!coinGeckoId && meta && meta.symbol) {
                    const mapping = await this.loadCoinMapping();
                    const coinId = mapping.get(meta.symbol.toLowerCase());
                    if (coinId) {
                        coinGeckoId = coinId;
                    }
                }
                return {
                    ...tb,
                    name: meta ? meta.name : tb.mint,
                    symbol: meta ? meta.symbol : '',
                    coinGeckoId: coinGeckoId || tb.mint
                };
            });

            const enhancedTokenBalances = await Promise.all(balances$$);
            const nonZeroTokenBalances = enhancedTokenBalances.filter(token => token.uiAmount > 0);
            return nonZeroTokenBalances;
        } catch (error: any) {
            throw new Error(`Error fetching token balances: ${error.message}`);
        }
    }

    setWalletConnectSession(session: any, signClient: SignClient): void {
        this.walletConnectSession = session;
        this.walletConnectSignClient = signClient;
    }

    async sendSolanaWalletConnect(){
        
    }


  async sendSOLANA(recipientAddress: string, amount: string): Promise<string> {
      const address = this.address();
    if (!address) {
      throw new Error("Wallet is not connected. Please connect your wallet first.");
    }


    let recipientPublicKey: PublicKey;
    try {
      recipientPublicKey = new PublicKey(recipientAddress);
    } catch (error) {
      throw new Error("Invalid recipient address.");
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Invalid amount.");
    }
    const lamports = parsedAmount * LAMPORTS_PER_SOL;
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(this),
        toPubkey: recipientPublicKey,
        lamports: lamports
      })
    );
    transaction.feePayer = new PublicKey(address);
    const {blockhash} = await this.connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    try {
      const signedTx = await window.solana!.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      await this.connection.confirmTransaction(signature);
      return signature;
    } catch (error: any) {
      throw new Error(`Error sending transaction: ${error.message}`);
    }
  }

    async sendUSDC(destinationAddress: string, amount: string, mintAddress: string): Promise<string> {
        const address = this.address();
        if (!address) {
            throw new Error("Wallet is not connected. Please connect your wallet first.");
        }

        let destinationPublicKey: PublicKey;
        try {
            destinationPublicKey = new PublicKey(destinationAddress);
        } catch (error) {
            throw new Error("Invalid recipient address.");
        }
        const transferAmount = parseFloat(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
            throw new Error("Invalid token amount.");
        }
        const mint = new PublicKey(mintAddress);

        let sourceAccount, destinationAccount;
        try {
            sourceAccount = await splToken.getOrCreateAssociatedTokenAccount(
                this.connection,
                window.solana! as unknown as Signer,
                mint,
                new PublicKey(address)
            );
        } catch (error: any) {
            throw new Error(`Error getting source token account: ${error.message}`);
        }
        try {
            destinationAccount = await splToken.getOrCreateAssociatedTokenAccount(
                this.connection,
                window.solana! as unknown as Signer,
                mint,
                destinationPublicKey
            );
        } catch (error: any) {
            throw new Error(`Error getting destination token account: ${error.message}`);
        }

        let mintInfo;
        try {
            mintInfo = await splToken.getMint(this.connection, mint);
        } catch (error: any) {
            throw new Error(`Error fetching mint info: ${error.message}`);
        }
        const decimals = mintInfo.decimals;

        const tx = new Transaction();
        tx.add(splToken.createTransferInstruction(
            sourceAccount.address,
            destinationAccount.address,
            new PublicKey(address),
            transferAmount * Math.pow(10, decimals)
        ));
        tx.feePayer = new PublicKey(address)
        const {blockhash} = await this.connection.getRecentBlockhash();
        tx.recentBlockhash = blockhash;
        try {
            const signedTx = await window.solana!.signTransaction(tx);
            const signature = await this.connection.sendRawTransaction(signedTx.serialize());
            await this.connection.confirmTransaction(signature, 'confirmed');
            return signature;
        } catch (error: any) {
            throw new Error(`Error sending token transaction: ${error.message}`);
        }
    }

    async getSOLPrice(): Promise<number> {
        try {
            const data = await firstValueFrom(
                this.http.get<any>('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
            );
            if (data && data.solana && data.solana.usd) {
                return data.solana.usd;
            } else {
                throw new Error('SOL price not available');
            }
        } catch (error: any) {
            throw new Error(`Error fetching SOL price: ${error.message}`);
        }
    }
}

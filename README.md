# Solana Wallet Webpage

## Overview
This project is a Solana wallet web application that allows users to:
- Connect to their Phantom wallet
- View their SOL balance
- View SPL token balances (with token names and symbols)
- Fetch real-time USD prices for SOL and SPL tokens
- Send SOL transactions
- Send SPL token(USDC) transaction

## Features
- **Connect Wallet**: Connects to a Solana wallet using Phantom.
- **View Balances**: Fetches and displays the user's SOL and SPL token balances.
- **Real-time Prices**: Uses CoinGecko API to fetch real-time USD prices for SOL and SPL tokens.
- **Send Transactions**: Allows users to send SOL and SPL tokens to other addresses.


## Installation

- **Node.js** (Latest LTS recommended)
- **Angular CLI** (If not installed, run `npm install -g @angular/cli`)

### Clone the Repository
```sh
cd solana-wallet-webpage
```

### Install Dependencies
```sh
npm install
```

### Start the Development Server
```sh
ng serve
```

## Configuration

### API Keys
This project uses the **CoinGecko API** to fetch token prices. You can configure it in `solana-wallet.service.ts` if needed.

For better realtime token prices(in USD) check **Jupiter V6 API** https://portal.jup.ag/onboard

### RPC Provider
The project uses a public Solana RPC (`https://solana-rpc.publicnode.com`). If you have a private RPC endpoint, update it in `solana-wallet.service.ts`:
```ts
this.connection = new Connection("YOUR_RPC_URL", "confirmed");
```

## Usage

1. Open the application in your browser.
2. Click **Connect Wallet** to connect to your Phantom wallet.
3. Your SOL and token balances will be displayed along with their USD values.
4. Use the **Send SOL** form to send SOL to another address.
5. Use the **Send Token** form to transfer SPL tokens to another address.

## Deployment
To build the project for production:
```sh
ng build --configuration=production
```
The built files will be in the `dist/` folder. You can deploy them to any static hosting service like Vercel, Netlify, or Firebase Hosting.



---

  
  


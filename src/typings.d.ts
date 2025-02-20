// src/typings.d.ts

import { PublicKey, Transaction } from '@solana/web3.js';

interface PhantomProvider {
  isPhantom: boolean;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect?: () => Promise<void>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

// Ensure this file is treated as a module.
export {};

// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { WalletComponent } from './app/wallet/wallet.component';
import { HttpClientModule } from '@angular/common/http';
import {importProvidersFrom} from "@angular/core";

bootstrapApplication(WalletComponent, {
  providers: [importProvidersFrom(HttpClientModule)]
}).catch(err => console.error(err));

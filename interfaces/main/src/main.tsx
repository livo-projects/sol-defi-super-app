import React from 'react';
import { createRoot } from 'react-dom/client';
import { WalletProvider } from './providers/WalletProvider';
import '@solana/wallet-adapter-react-ui/styles.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>,
);

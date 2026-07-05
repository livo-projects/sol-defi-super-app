import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      "@solana/web3.js",
      "@solana/wallet-adapter-react",
      "@solana/wallet-adapter-react-ui",
      "@solana/wallet-adapter-base",
      "@solana/wallet-adapter-phantom",
      "@solana/wallet-adapter-solflare",
    ],
  },
  build: { target: "es2020" },
});

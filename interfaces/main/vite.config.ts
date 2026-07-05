import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Pre-bundle the heavy web3 deps once so the dev server doesn't re-optimize
  // (and stall) on first load; build target es2020 keeps BigInt literals intact.
  optimizeDeps: { include: ["wagmi", "viem", "@tanstack/react-query"] },
  build: { target: "es2020" },
});

import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Web3Provider } from "./livo";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>,
);

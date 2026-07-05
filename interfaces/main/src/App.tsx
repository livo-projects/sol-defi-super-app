import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { SwapModule } from './components/SwapModule';
import { StakeModule } from './components/StakeModule';
import { LendModule } from './components/LendModule';
import { BridgeModule } from './components/BridgeModule';
import { PortfolioModule } from './components/PortfolioModule';
import { TransactionHistory } from './components/TransactionHistory';

export default function App() {
  return (
    <Layout>
      <Dashboard />

      {/* Module grid — responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
      <div id="swap" className="module-grid">
        <SwapModule />
        <div id="stake">
          <StakeModule />
        </div>
        <div id="lend">
          <LendModule />
        </div>
      </div>

      <div className="module-grid mt-6" id="bridge">
        <BridgeModule />
        <PortfolioModule />
        <TransactionHistory />
      </div>
    </Layout>
  );
}

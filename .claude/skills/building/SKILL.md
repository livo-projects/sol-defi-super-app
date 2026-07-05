---
name: building
description: The overall build guide: pick a blueprint, the monorepo layout, the contracts test→deploy→verify→bindings loop, frontend hosting, secrets, and branches=previews/main=production deploys.
---

# Skill — building well on Livo

Livo runs the toolchain (Foundry, npm, hosting, the chain): you write code and call tools, Livo compiles, tests, deploys, hosts, and broadcasts. Follow these conventions.

## Step 0 — pick a blueprint (the architecture)
Before `create_project`, choose an **architecture** and pass `blueprint=<id>`. A blueprint composes the right deployables already wired, so you don't free-assemble primitives and mis-wire them. Decide by the backend shape: no backend → `spa`; TS backend same-origin → `spa+api`; Python/FastAPI backend → `vite+fastapi`; Next app-router / multi-page (static — add `api/` for a backend) → `nextjs`; full on-chain app → `dapp`; standalone long-lived server → `service`; Telegram bot → `bot`. `spa+api`/`vite+fastapi`/`dapp` ship the `/api/*` backend live at create. See `livo://skill/blueprints` / `list_blueprints`.

**Start minimal, then grow** — you don't need the whole architecture at once. Ship the interface (`spa`) first, then add a named keeper / bot, an indexer, an api, contracts when you need them (`create_keeper`/`create_bot`/`enable_contracts`/…) — adds are never blocked. `get_project`'s **project map** shows what you have, the `add_a_deployable` tools, and `suggested_next`. `create_project` and the `create_*` tools are one engine (create scaffolds the blueprint's deployables together; create_* adds one). The full **create → grow → verify → ship** lifecycle: `livo://skill/projects`.

**Test before it's live.** `verify_project` defaults to `target="preview"` — verify the branch-preview deploy, fix what it flags, THEN `deploy(env="production")` and `verify_project(target="production")`. Production only ever gets a build you've already smoke-tested.

## Repo layout (one monorepo per project)
```
interfaces/main/  main web app — single index.html, Vite SPA, or Next.js (legacy: interface/)
interfaces/<name>/  extra sites, each on <name>--{slug}.livo.build
contracts/        a normal Foundry project (foundry.toml, src/, test/, script/)
contracts/broadcast/   forge run files — CHECK THESE IN (ingested into the registry)
bots/<name>/      one bot deployable each
livo.yaml         optional manifest of deployables
```
Pushing contracts/ auto-enables the contracts pipeline; pushing interfaces/main/ (or legacy interface/) auto-deploys the site.

## Contracts — the loop
**⛔ Never verify a contract by reading code, tracing logic, or writing a Python/JS mirror — always run the real suite with `test_contracts`.** (Compact mode: `invoke("test_contracts")`.)

1. Write contracts + Foundry tests. forge-std, @openzeppelin/*, solmate, solady auto-resolve; add more with `run_forge("install <org/repo>")` or soldeer.
2. `test_contracts` (or `run_forge("test -vvv")`) runs the real forge suite on Livo's runner — iterate until green, never simulate the EVM yourself.
3. Deploy (YOU run it — don't print a forge command). Whole system: `deploy_contract(network="sepolia", script="script/Deploy.s.sol")`, where your script reads `vm.envUint("PRIVATE_KEY")` (Livo sets it). One contract: `deploy_contract(contract="MyToken", args=[...])`. Every address is ingested + verified.
4. VERIFY: `get_contract`/`list_contracts` → confirm `verify_status == "verified"` (treat unverified as broken).
5. BINDINGS: `sync_contract_bindings` writes typed addresses + ABIs to the main interface's `src/livo/contracts.ts` (`interfaces/main/`, or legacy `interface/`). Import from there; never hardcode an address.

## Gas, wallets, ownership (trust model)
- Sepolia gas is sponsored — deploy with zero funding.
- User-owned deployer: `get_deposit_address("sepolia")` → the project's wallet; the user funds it, deploys come from it.
- Transfer contract ownership to a user-controlled wallet in your Deploy script — Livo never needs authority; tell the user so they trust the result.
- **Signing wallets:** all keys derive from one project seed at fixed HD indices — deployer=0, keeper=1, relayer=2. Isolate or share a key with `wallet: <name>` in a deployable's manifest (keeper.yaml/bot.yaml/queue.yaml); same name = shared. Pin/remap an index with a top-level `wallets: [{ name, index }]` in livo.yaml. Fund by name with `get_deposit_address(wallet=...)`; re-pinning a funded wallet fails loudly. Full guide: **docs/WALLETS.md**.

## Frontend — building a UI for your contracts
**React app? Read `livo://skill/frontend` first** — it covers how to STRUCTURE code (decompose; never one giant App.tsx). This section is build/host/wiring mechanics.

interfaces/main/ (your main site; legacy projects use interface/) is built + hosted on every push. Pick one:
1. **Static HTML** — interfaces/main/index.html (+ assets); no package.json, served as committed. Best for landing/mint pages.
2. **Vite SPA** (recommended for dApps) — package.json whose `npm run build` emits **dist/**; pair with viem + wagmi v3. SPA fallback for unknown routes works.
3. **Next.js** — package.json + `next.config` `output: 'export'` (emits **out/**). Static export only (no SSR/API routes); for server logic use Vite + a separate API.

> **wagmi: use v3 (`"wagmi": "^3.0.0"`), never v2.** v2 force-installs the whole WalletConnect/MetaMask/Coinbase/Safe connector tree (~540 pkgs) even with just `injected()` → the build hangs/OOMs; v3 makes those optional peers. **Easiest: let `scaffold_frontend` write the config** (pins v3 + a lean connector set). If hand-writing: `useAccount`→`useConnection`; connect/write/switch hooks are TanStack mutations (`.mutate`/`.mutateAsync`); needs TypeScript ≥ 5.9.3.

Build: on push Livo runs `npm install && npm run build` in interfaces/main/ (or repo root), auto-detecting the output dir (dist → build → out → .vercel/output/static → public). No package.json ⇒ served static.

⚠️ **Edit the files the build actually serves.** The live site is build OUTPUT — if the build script is `cp -r public dist`, a page at `interfaces/main/index.html` is NEVER served (the deploy still goes green, serving old content). Check the interface's package.json build script first; if unsure, a static site with NO package.json + interfaces/main/index.html is served exactly as committed.

## Wiring the contracts into the UI
- After `deploy_contract`, `sync_contract_bindings` writes typed addresses + ABIs to the main interface's **`src/livo/contracts.ts`** (`interfaces/main/`, or legacy `interface/`) — import from there, never hardcode.
- **Fast path — `scaffold_frontend`:** generates the layer above the bindings — a typed wagmi hook per method (reads→useReadContract, writes→useWriteContract), `ConnectWallet`/`TxStatus`/`Web3Provider`, the wagmi config, and (for an empty project) a runnable Vite demo. Pins wagmi v3 + a lean connector set. Run it right after deploy_contract, then customize the interface's `src/App.tsx`. `app:false` generates only `src/livo/` into an existing app.

## Config & secrets — resolve what you can, request only what's user-only
- `set_secret(name, value)` for build-time vars: **VITE_*** (Vite) / **NEXT_PUBLIC_*** (Next). Write-only, baked in at build time → `redeploy` after changing one.
- **Set what YOU can derive** — contract addresses (the deploy result / `get_contract`), indexer endpoints (`get_indexer`), known-network RPCs. **Frontend contract addresses are NOT secrets** — they live in bindings; import them. Don't tell the user to "set MARKET_ADDRESS".
- **Keeper/bot:** `RPC_URL` + the wallet key auto-inject (`new Chain(env)`); set any extra config yourself from what you know.
- **Only ask for user-only values** — a WalletConnect project ID, a 3rd-party API key, a @BotFather token. Don't say "go set X yourself": `request_secret(name, label?)` mints a single-use paste link (value never hits the chat), then `redeploy`.

## Deploy model: branches = previews, main = production
A git-branch model (like Vercel/Netlify):
- **main = production** → a push to main deploys to `{slug}.livo.build` immediately.
- **Any other branch = its own preview** → `{branch}--{slug}.livo.build`, auto-updating on each push. Builds are identical to prod; only the URL + which env's secrets differ.
- **Workflow:** `create_branch` → `push_code(branch=…)` (preview URL) → iterate → `merge_branch(head=…)` (→ main → prod auto-deploys) → `delete_branch`. (`open_pr`/`merge_pr` need the GitHub PR permission; `merge_branch` is the reliable path.)
- **⭐ Safe go-live gate — by judgment, NOT every edit.** For a real release / risky / visually-significant change: push a PREVIEW (`push_code(branch=…)`, note the `deploy_id`) → `deployment_status` until ready → EVALUATE in a browser (`browser_open` the preview URL + `browser_console`; screenshot for appearance) → only when clean, `promote_deployment(deploy_id=…)` (instant pointer swap → prod byte-identical to what you verified; `rollback_deployment` undoes it). Small edits: skip the ceremony — push + a quick spot-check. Always preview over HTTP (dev server or preview URL) — never open a built `dist/index.html` over `file://` (renders blank: a `file://` artifact, not a broken build). Full debug/verify loop: `livo://skill/verify`.
- **Always verify the CONTENT, not just the build.** `deployment_status` (no args = latest) returns `ok` + env/URL + (on failure) `error`/`error_excerpt`/`log_tail`. But `ok:true` only means the build passed — load the live URL in a browser and confirm YOUR change is present before claiming it's live (a green build can still serve old content). Never claim an unverified result.
- **A failed build keeps the previous version live** (nothing publishes) → "my change isn't showing" usually means the build failed; check `deployment_status` (`get_project` also surfaces it).
- `redeploy` = fresh build of HEAD (after a secret change or a flaky build). `cancel_deployment` (optional `deploy_id=…`) stops a queued/building deploy — live site untouched.

## What you get at create_project
Provisioned up front: a **GitHub repo** with the standard monorepo scaffold (`contracts/` Foundry, `interfaces/main/` web app for the chosen `framework`: vite|next|static, `indexers/` placeholder), a **D1 database**, **KV**, an **R2 bucket** (when available), the **{slug}.livo.build domain**, and a **deployer wallet**. The only create-time choice is `framework` (default vite) — the repo is always created, so don't ask. Use `db_query`/`db_migrate` for D1, `kv_get`/`kv_put` for KV, `get_deposit_address` to fund the wallet (testnet gas sponsored).

## Keepers (scheduled / cron) — config-as-code
Anything on a schedule (poke a contract, harvest, rebalance, heartbeat). Each is a folder `keepers/<name>/`: `index.js` (an ES module exporting `scheduled(event, env)` on the CF Workers runtime) + `keeper.yaml` (`schedule` = 5-field cron UTC, `entry`, `enabled`). **To touch the chain, import `@livo-build/runtime` (`new Chain(env)` — RPC_URL + KEEPER_PRIVATE_KEY auto-injected); don't hand-roll RPC/signing/ABI — see `livo://skill/runtime`.** The platform bundles deps server-side on deploy.
- `create_keeper(name, schedule, code?)` writes both files + deploys (starter if no code). Templates via `scaffold_keeper`.
- Edit files → `sync_keepers` reconciles repo state (idempotent; `prune=true` removes orphans). Also `update_keeper`, `pause_keeper`/`resume_keeper`, `run_keeper` (test once), `list_keepers`/`get_keeper` (shows `last_run_at`/`last_run_ok`).
- Many keepers allowed (one folder each); a starter `keepers/heartbeat/` ships off.

## Servers (long-lived processes) — config-as-code
Anything that must stay up (webhook receiver, event listener, websocket hub). Default runtime is a serverless CF **Durable Object** (scales to zero, hibernates); `fly` for an arbitrary-language container. Each is `servers/<name>/` (`index.js` + `server.yaml`). What each runtime is: `livo://skill/deployables`.
- `create_server(name, runtime?, template?)` scaffolds + deploys (default durable_object). Max **3/project**. Lifecycle: `start_server`/`stop_server`/`restart_server`, `get_server_logs`, `list_servers`/`get_server`, `delete_server`.
- No npm-bundling step for DO servers yet → use fetch + Web Crypto (or move chain-signing into a keeper/bot). For a Telegram bot, use `create_bot`.

## Launch (livo.trade)
Fair launch on the shared LivoLaunchpad: collect name/symbol/supply + owner/fee_receiver → `confirm_launch_params(...)` (echoes economics + deploy wallet + funded? + nonce) → show the user, get explicit OK → fund the deploy wallet if empty → `launch_token(nonce)`. Funding is the only prerequisite (no production state / verified contract). `sepolia` (faucet) or `mainnet` (real ETH; needs the mainnet_rpc secret). owner_address optional (omit = Livo custody); fee_receiver = a wallet or a Twitter @handle (`resolve_social_wallet`). Detail: `livo://docs/token-launch`.

## Pitfalls
- Don't gitignore contracts/broadcast/** — those are ingested.
- Don't hardcode contract addresses — use the generated bindings.
- Don't claim you can't compile/test/deploy — call the tool.
- Don't tell the user "it's live" until `verify_project` is clean and its `agent_followups` (browser smoke of the frontend; `call_contract` a view) are done — a green build / HTTP 200 is not proof the pieces connect.
- Grow a project in place: add contracts to an interface-only app, a named keeper, a named Telegram bot — with `enable_contracts` / `create_keeper` / `create_bot` etc. Blueprints suggest a shape (see `get_project`'s map) but never block an add, and you never recreate a project to add to it.
- Compact mode (claude.ai): tools beyond the core set are reached via `search_tools` → `invoke`.

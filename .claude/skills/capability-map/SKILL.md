---
name: capability-map
description: The 'I want to do X → use tool/skill Y' lookup across ~140 Livo tools — points you at call_contract/send_tx/run_cast/deploy_contract/audit_contracts/etc instead of hand-rolling a script.
---

# Capability map — don't hand-roll what Livo already does

Livo RUNS the toolchain (Foundry, npm, hosting, the chain). The catalog has ~140 tools; compact mode shows ~18 directly and the rest are ONE call away via search_tools(query) → invoke(name, args). **Never assume a capability is missing — search for it.** This map points you at the tool for the task instead of writing a script.

## I want to… → use this

| Goal | Tool | Don't do instead |
|---|---|---|
| Run the test suite / fuzz / coverage / gas report | test_contracts, run_forge("test -vvv" / "coverage" / "test --gas-report") | reason about correctness by reading code or writing a Python/JS mirror |
| Fast test loop (no deploy, no dep re-clone) | run_forge("test") | the full deploy_contract pipeline |
| Read on-chain state of a deployed contract (view fn) | call_contract(name_or_address, fn, args) | write + run a reader script |
| Raw on-chain query: storage slot, code, logs, a tx/receipt, balance — ANY address | run_cast("storage 0x… 0" / "logs …" / "receipt 0x…") | Blockscout/Etherscan by hand, or a custom script |
| One-off WRITE tx: seed, approve, mint, transfer, set config | send_tx(name_or_address, fn, args, value?) | write a whole Deploy/seed Foundry script |
| Block until a specific job finishes (need its result NOW) | wait_for_job(job_id) | a get_logs sleep-and-poll loop |
| Fire a long job and keep working (notified when done) | just start it, then proceed — a 📬 notice rides your next tool call; check_messages drains it | sitting on wait_for_job for every build |
| Deploy a contract (compile → test → sign → broadcast → verify) | deploy_contract(network, contract|script) | forge + raw keys yourself |
| Wire deployed addresses + ABIs into the frontend (typed) | sync_contract_bindings (auto-runs after deploy) | hand-write an ABI array / paste addresses into the UI |
| Generate the wagmi/viem React layer + demo app | scaffold_frontend | build the web3 layer from scratch |
| List deployed addresses + verification status | list_contracts | grep the deploy logs |
| Security audit (Slither + Aderyn + fork-sim) | audit_contracts | eyeball the code |
| Simulate a deploy / estimate gas | simulate_deploy, estimate_gas | guess |
| Read / send the project's email ({slug}@livo.build — every project has one) | list_emails, read_email, send_email (in bot/keeper code: `new Email(env)`) | tell the user to set up SMTP / a mailbox / Resend / Mailgun |
| Token-gate a Telegram room or a bot (holders-only; admit/boot by balance) | scaffold create_bot --template wallet-link-bot (or token-gated-bot) + create_keeper --template token-gate-sweeper; in code `new Gatekeeper(env, {token,minBalance,groupChatId})` (read `livo://skill/token-gating`) | hand-roll nonces, signature checks, a member roster, or ban/kick fetches |
| React to on-chain activity (whale buy, price surge/dump, new pool, momentum) — or read live DEX markets, token prices & recent swaps | in bot/keeper code `signals(env)` (READ: `.markets()`/`.token(addr)`/`.swaps()`/`.launches()`) for polling; `create_watcher` + `defineWatcher({onMatch})` for event PUSH; scaffold `create_bot --template signals-alert-bot` (read `livo://skill/signals`) | stand up your own indexer, poll a block explorer, or hand-roll a mempool/price watcher |
| A coherent SET of game art — sprite sheet, tileset, UI kit, sound effects (FREE) | browse_game_assets(query, kind?) → add_game_asset(id) — Livo's curated CC0 Kenney library; free, no attribution, stylistically consistent (read `livo://skill/asset-generation`) | pay to generate a set AI can't keep consistent, or tell the user to find art elsewhere |
| Generate an image / sprite / icon / hero art (transparent PNG, committed to the project) | generate_image(prompt, model?, size?, name?) — fal render + auto background-removal; list_assets to reuse (read `livo://skill/asset-generation`). BILLABLE (daily free tier, then balance). For a SET, browse_game_assets (free) first | hand-author sprite PNGs, or tell the user to find art elsewhere |
| Branded web/UI art — logo, icon, page background, hero art, pattern, a hero subject (mascot) — in ONE consistent style | generate_web_asset(kind, prompt, style?, name?) — per-type art direction (logo reads as a logo, bg stays readable); pass the SAME `style` (a starter-style key or free text) to every call to brand the whole site (read `livo://skill/asset-generation`). BILLABLE | use generate_image with a generic prompt (looks off-brand / inconsistent) |
| Remove the background from an image (a generated asset or any URL) | remove_background(image_url, name?) — BiRefNet matte → transparent PNG committed to /assets/. `image_url` = a committed /assets path or any public URL. BILLABLE (~$0.01) | hand-edit alpha, or re-generate from scratch to "get it transparent" |
| Build a playable browser game (loop, collision, maze, sprite animation) | generate the art with generate_image, then assemble per `livo://skill/game-dev` (fixed-tick loop + rAF draw, flood-fill solvable levels, procedural sprite frames) into interface/main/ | a rAF-only loop (freezes when backgrounded) or a hand-checked maze (sealed-off pickups) |

## Reflexes
- Every async tool returns a **job_id** and runs in the background. You do NOT have to block: go do other work, and a 📬 inbox notice for each finished job rides your next tool call (`check_messages` drains it explicitly). Use `wait_for_job(job_id)` only when you can't proceed without that exact result. Never sleep-and-poll get_logs.
- After deploy_contract: addresses are in **list_contracts**; the frontend reads them from **sync_contract_bindings** output (interface/src/livo/contracts.ts) — never paste addresses by hand.
- Reads → **call_contract** (typed, in-registry) or **run_cast** (raw, any address). Writes → **send_tx**. Deploys/broadcast → **deploy_contract**.
- Writing keeper or bot CODE? Read **`livo://skill/runtime`** and import **@livo-build/runtime** (Chain/Relayer/Wallet/Store/Indexer/Telegram/Email/requireSecret) — never hand-roll JSON-RPC, signing, ABI, GraphQL, the Telegram webhook, or SMTP. (Servers can't bundle npm yet → use fetch there.)
- Integrating **Hyperliquid** (perps/spot) or **Polymarket** (prediction markets)? The runtime ships `Hyperliquid` and `Polymarket` helpers (data reads need no key; trading is opt-in via a secret) — read **`livo://skill/hyperliquid`** / **`livo://skill/polymarket`**, or scaffold `create_bot --template hyperliquid-bot` / `polymarket-bot`. Don't hand-roll their order signing.
- Building price alerts, whale/copy-trade bots, or a markets dashboard? The runtime ships **`signals(env)`** (READ live DEX markets/prices/swaps/launches from the shared Signal Radar engine, no key) and **`defineWatcher`** + **`create_watcher`** (PUSH: get called on-chain when a signal fires) — read **`livo://skill/signals`**. Don't build your own indexer or poll an explorer.
- Writing a React frontend? Read **`livo://skill/frontend`** — decompose into components/hooks/pages, never commit one giant App.tsx (even code the user pasted), and import chain access from the generated `src/livo/` layer.
- Stuck? `search_tools("what you want to do")` before concluding it's impossible.

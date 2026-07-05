# Sol DeFi Super App

A Livo project (`vite-dapp` template). One monorepo, conventional roots:

- `contracts/` — Foundry project (soldeer deps; submodules banned). Verify with
  `test_contracts`, ship with `deploy_contract`.
- `interfaces/main/` — vite web app → Workers for Platforms (vite build). Served at the apex `sol-defi-super-app.livo.build`.
- `api/` — TypeScript same-origin backend Worker at `/api/*` (zero-CORS;
  keys server-side). Call it from the frontend with `fetch("/api/...")`. Redeploy with `deploy_api`.
- `indexers/<name>/` — Goldsky subgraphs. `scaffold_indexer` → `sync_indexers`.
- `keepers/<name>/` — scheduled (cron) jobs. `create_keeper` → `sync_keepers`.
- `bots/<name>/` — Telegram bots. `create_bot` (see `list_templates`) → `sync_bots`.
- `servers/<name>/` — long-lived servers / APIs (durable_object or Docker, e.g.
  FastAPI). `create_server` → `sync_servers`.

`livo.yaml` declares each deployable; a push rebuilds only the roots that changed.
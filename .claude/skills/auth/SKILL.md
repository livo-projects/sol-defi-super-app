---
name: auth
description: Pick or switch a login provider (wagmi/Privy/Dynamic) with scaffold_frontend — all share one useAuth()+<ConnectWallet/> surface; plus passwordless Telegram login.
---

# Skill — choosing & wiring a login provider

Every Livo web project has a **login provider** that powers wallet connect / sign-in.
You pick one and can **switch any time** — it's one tool call, not a rebuild, and your
app code doesn't change because all three share the same `useAuth()` surface.

## The three providers

| Provider | What it gives the user | Needs a key? | Use when |
|---|---|---|---|
| **`wagmi`** (default) | Wallet connect — MetaMask/Rabby (injected, EIP-6963) + Coinbase; WalletConnect opt-in. Neutral, themeable modal from `@livo-build/kit`. | **No** | Pure web3 apps where users bring a wallet. Zero-config, no signup. |
| **`privy`** | Email / social / embedded wallets (Privy spins up a wallet for users who don't have one) on top of wagmi. | `PRIVY_APP_ID` | Onboarding non-crypto users; you want email/social login + auto-wallets. |
| **`dynamic`** | Multi-wallet + social login (Dynamic's flow) on top of wagmi. | `DYNAMIC_ENVIRONMENT_ID` | Multi-chain / lots of wallet options + social, managed UI. |

**All three funnel into wagmi**, so the rest of the kit (`useTx`, `TxButton`, `Balance`,
`useContractValue`, SIWE) and your typed contract hooks are **identical** regardless of
choice. Privy/Dynamic just add richer login on top.

## Pick or SWITCH the provider — one tool

`scaffold_frontend` sets the login provider on any project (contracts or not):

```
scaffold_frontend auth=wagmi     # default — wallet connect, no key
scaffold_frontend auth=privy     # email/social/embedded — then set PRIVY_APP_ID
scaffold_frontend auth=dynamic   # social/multi-wallet — then set DYNAMIC_ENVIRONMENT_ID
```

It re-emits `interface/src/livo/{wagmi.ts, Web3Provider.tsx, ConnectWallet.tsx, auth.ts}`,
pins the right deps **and drops the previous provider's deps**, and tells you exactly
which secret to set. Switching `privy → wagmi` (or any direction) is safe and clean — you
never recreate the project. For `privy`/`dynamic`, set the key with `request_secret` /
`set_secret` (`PRIVY_APP_ID` → dashboard.privy.io; `DYNAMIC_ENVIRONMENT_ID` →
app.dynamic.xyz) — until then the app renders a "set your key" banner.

## The app-facing surface (identical across providers)

Your app imports from `./livo` and never changes when you switch:

```tsx
import { ConnectWallet, useAuth } from "./livo";

function Header() {
  const { address, isConnected, isAuthenticated, email, login, logout } = useAuth();
  return isAuthenticated
    ? <span>{email ?? address} <button onClick={logout}>Log out</button></span>
    : <ConnectWallet />;            // the provider's login modal (kit modal for wagmi)
}
```

- **`<ConnectWallet/>`** — the login UI. For `wagmi` it's `@livo-build/kit`'s neutral,
  themeable modal; for Privy/Dynamic it's their managed login. Same import either way.
- **`useAuth()`** → `{ address, isConnected, isAuthenticated, email?, login(), logout() }`.
  `isAuthenticated` = `isConnected` for wagmi; for Privy/Dynamic it reflects their session.
  `email` is populated when a social/email login supplies one. Use it for custom buttons.

## Login with Telegram (no wallet/password)
Orthogonal to the three wallet providers above: if your users live on Telegram, you can
authenticate them with **no wallet and no password** — they just tap your bot. The web
app gets a signed session keyed on the Telegram identity (`sub: "telegram|<id>"`),
delivered as an **HttpOnly cookie** (XSS-proof; the token never touches page JS). Use
`@livo-build/kit`'s `<TelegramGate>` / `useTelegramLogin` / `<TelegramLoginButton>` on the
frontend and `@livo-build/runtime`'s `TelegramLogin` on the api/bot — the api side is one
`handleApi(req)` call, route guards are one `authenticate(req)` call. Scaffold it with the
`telegram-login-bot` template: it needs only a @BotFather token (BOT_USERNAME +
SESSION_SECRET are auto-provisioned on deploy). Match-code confirmation in the bot makes it
hijack-resistant. This can stand alone as your login, or complement a wallet provider (link
a wallet later with `LinkTelegramButton`). See `livo://skill/runtime` + `livo://skill/kit`.

## Gotchas
- **wagmi** needs no key and is the right default. Don't reach for Privy/Dynamic unless you
  actually want email/social/embedded wallets — they add a dashboard signup + a secret.
- After `auth=privy`/`auth=dynamic`, the login does nothing until the secret is set — the
  result message and an in-app banner say so. Set it, then redeploy the interface.
- Styling: only the `wagmi` modal is the neutral kit modal you restyle freely (CSS vars /
  `classNames` — see `livo://skill/kit`). Privy/Dynamic modals are styled in their dashboards.
- WalletConnect (QR/mobile) on `wagmi` is opt-in: `scaffold_frontend auth=wagmi walletconnect=true` (+ a project id).

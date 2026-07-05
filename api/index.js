// Livo API — a stateless Cloudflare Worker served same-origin at
// {slug}.livo.build/api/*. Call it from your frontend with fetch("/api/...") —
// no CORS — and keep API keys here in `env` (set them with set_secret), never
// in the browser bundle. The Worker receives the FULL /api/... path.
//
// This is a small dependency-free router. Add a route with route(method, path,
// handler); handlers get { req, env, params, query, json } and return data (auto
// 200 JSON), a [data, status] tuple, or a Response. Thrown errors → a structured
// 500 (or throw new HttpError(status, message) for a specific code). env.DB (D1)
// and env.KV are bound when the project has them.

class HttpError extends Error {
  constructor(status, message, detail) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

const routes = [];
const route = (method, path, handler) => routes.push({ method, path, handler });

// ---- Routes ---------------------------------------------------------------

// Health — keep this; verify_project + uptime checks hit it.
route("GET", "/api/health", () => ({ ok: true }));

// Example GET with a path param: /api/greet/ada → { hello: "ada" }
route("GET", "/api/greet/:name", ({ params }) => ({ hello: params.name }));

// Example POST reading a JSON body. Throw HttpError for a validated 4xx.
route("POST", "/api/echo", async ({ json }) => {
  const body = await json();
  if (!body || typeof body.message !== "string") {
    throw new HttpError(400, "body must be { message: string }");
  }
  return [{ youSaid: body.message }, 201];
});

// ---- Solana DeFi Proxy Routes ----

// Validate a Solana mint address (base58, 32-44 chars)
const MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// Jupiter Price API proxy (avoids CORS)
route("GET", "/api/prices", async ({ query }) => {
  const ids = (query.ids || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!ids.length) throw new HttpError(400, "ids param required");
  if (ids.length > 100) throw new HttpError(400, "max 100 ids");
  for (const id of ids) {
    if (!MINT_RE.test(id)) throw new HttpError(400, `invalid mint address: ${id.slice(0, 8)}…`);
  }
  const r = await fetch(`https://api.jup.ag/price/v2?ids=${encodeURIComponent(ids.join(","))}`);
  if (!r.ok) throw new HttpError(502, "Jupiter price API failed");
  return r.json();
});

// Jupiter Quote API proxy
route("GET", "/api/quote", async ({ query }) => {
  const ALLOWED = new Set(["inputMint", "outputMint", "amount", "slippageBps", "onlyDirectRoutes", "asLegacyTransaction"]);
  const filtered = {};
  for (const [k, v] of Object.entries(query)) {
    if (!ALLOWED.has(k)) continue;
    filtered[k] = v;
  }
  if (!filtered.inputMint || !filtered.outputMint || !filtered.amount) {
    throw new HttpError(400, "inputMint, outputMint, and amount are required");
  }
  if (!MINT_RE.test(filtered.inputMint) || !MINT_RE.test(filtered.outputMint)) {
    throw new HttpError(400, "invalid mint address");
  }
  const params = new URLSearchParams(filtered);
  const r = await fetch(`https://quote-api.jup.ag/v6/quote?${params.toString()}`);
  if (!r.ok) throw new HttpError(502, "Jupiter quote failed");
  return r.json();
});

// Jupiter Swap API proxy
route("POST", "/api/swap", async ({ json }) => {
  const body = await json();
  if (!body || typeof body !== "object") throw new HttpError(400, "JSON body required");
  if (!body.quoteResponse || !body.userPublicKey) {
    throw new HttpError(400, "quoteResponse and userPublicKey required");
  }
  if (!MINT_RE.test(body.userPublicKey)) throw new HttpError(400, "invalid userPublicKey");
  const MAX_BODY = 8192;
  const serialized = JSON.stringify(body);
  if (serialized.length > MAX_BODY) throw new HttpError(400, "payload too large");
  const r = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: serialized,
  });
  if (!r.ok) throw new HttpError(502, "Jupiter swap failed");
  return r.json();
});

// Example — read/write the project D1 (when bound). See livo://skill/runtime for Store.
// route("GET", "/api/items", async ({ env }) => {
//   const { results } = await env.DB.prepare("SELECT * FROM items LIMIT 50").all();
//   return { items: results };
// });

// ---- Router (you usually don't need to edit below) ------------------------

function match(routePath, pathname) {
  const rp = routePath.split("/").filter(Boolean);
  const pp = pathname.split("/").filter(Boolean);
  if (rp.length !== pp.length) return null;
  const params = {};
  for (let i = 0; i < rp.length; i++) {
    if (rp[i].startsWith(":")) params[rp[i].slice(1)] = decodeURIComponent(pp[i]);
    else if (rp[i] !== pp[i]) return null;
  }
  return params;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let matchedPath = false;
    for (const r of routes) {
      const params = match(r.path, url.pathname);
      if (!params) continue;
      matchedPath = true;
      if (r.method !== request.method) continue;
      try {
        const out = await r.handler({
          req: request,
          env,
          params,
          query: Object.fromEntries(url.searchParams),
          json: () => request.json().catch(() => null),
        });
        if (out instanceof Response) return out;
        if (Array.isArray(out) && out.length === 2 && typeof out[1] === "number") return json(out[0], out[1]);
        return json(out);
      } catch (e) {
        if (e instanceof HttpError) return json({ error: e.message, detail: e.detail ?? null }, e.status);
        return json({ error: "internal_error", message: String((e && e.message) || e) }, 500);
      }
    }
    // Path exists but wrong method → 405; otherwise 404.
    return json({ error: matchedPath ? "method_not_allowed" : "not_found", path: url.pathname }, matchedPath ? 405 : 404);
  },
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

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

// Example — proxy a third-party API server-side (no browser CORS, key hidden in env):
// route("GET", "/api/quotes", async ({ env }) => {
//   const r = await fetch("https://api.example.com/v1/quotes", {
//     headers: { authorization: `Bearer ${env.EXAMPLE_API_KEY}` },
//   });
//   if (!r.ok) throw new HttpError(502, "upstream failed");
//   return r.json();
// });

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

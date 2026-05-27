import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5046";

type Context = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, context: Context) {
  const { path } = await context.params;
  const pathStr = path.join("/");

  const url = new URL(`/api/${pathStr}`, BACKEND);
  url.search = req.nextUrl.search;

  const forwardHeaders = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    // Strip hop-by-hop headers and accept-encoding so Render returns
    // uncompressed responses (Vercel decompresses internally and would
    // cause ERR_CONTENT_DECODING_FAILED if we forward Content-Encoding: gzip)
    if (!["host", "connection", "transfer-encoding", "accept-encoding"].includes(lower)) {
      forwardHeaders.set(key, value);
    }
  });

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const upstream = await fetch(url.toString(), {
    method: req.method,
    headers: forwardHeaders,
    body,
    redirect: "manual", // pass 3xx redirects through to the browser
  });

  // For redirects (OAuth flows etc.), forward the Location header directly
  // so the browser follows the redirect rather than the proxy swallowing it.
  if (upstream.status >= 300 && upstream.status < 400) {
    const location = upstream.headers.get("location");
    return NextResponse.redirect(location ?? "/", { status: upstream.status });
  }

  const responseBody = upstream.status === 204 ? null : await upstream.arrayBuffer();

  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (["transfer-encoding", "connection", "set-cookie"].includes(lower)) return;
    resHeaders.set(key, value);
  });

  const res = new NextResponse(responseBody, {
    status: upstream.status,
    headers: resHeaders,
  });

  const isHttps = req.nextUrl.protocol === "https:";

  // getSetCookie() is the correct Node.js 18.14+ / undici API for reading
  // Set-Cookie headers without them being combined into one string.
  // Fall back to headers.get() — safe here because we only have one kiri_token cookie.
  let setCookieStrings: string[];
  if (typeof (upstream.headers as any).getSetCookie === "function") {
    setCookieStrings = (upstream.headers as any).getSetCookie();
  } else {
    const raw = upstream.headers.get("set-cookie");
    setCookieStrings = raw ? [raw] : [];
  }

  for (const raw of setCookieStrings) {
    const eqIdx = raw.indexOf("=");
    if (eqIdx === -1) continue;
    const name = raw.slice(0, eqIdx).trim();
    const rest = raw.slice(eqIdx + 1);
    const value = rest.split(";")[0].trim();

    if (name === "kiri_token") {
      res.cookies.set("kiri_token", value, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isHttps,
        maxAge: 60 * 60 * 2, // 2 hours
      });
    }
  }

  // Logout: also clear the cookie (belt-and-suspenders with client-side clear)
  if (req.method === "POST" && pathStr === "auth/logout") {
    res.cookies.set("kiri_token", "", { maxAge: 0, path: "/" });
  }

  return res;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;

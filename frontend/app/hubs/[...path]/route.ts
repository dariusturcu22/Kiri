import { NextRequest, NextResponse } from "next/server";

const BACKEND = "http://localhost:5046";

type Context = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, context: Context) {
  try {
    const { path } = await context.params;
    const pathStr = path.join("/");

    const url = new URL(`/hubs/${pathStr}`, BACKEND);
    url.search = req.nextUrl.search;

    const forwardHeaders = new Headers();
    req.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!["host", "connection", "transfer-encoding"].includes(lower)) {
        forwardHeaders.set(key, value);
      }
    });

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const body = hasBody ? await req.arrayBuffer() : undefined;

    const upstream = await fetch(url.toString(), {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    const responseBody = upstream.status === 204 ? null : await upstream.arrayBuffer();

    const resHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (["transfer-encoding", "connection"].includes(lower)) return;
      resHeaders.set(key, value);
    });

    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    // ECONNRESET / aborted = client navigated away while long-poll was open. Harmless.
    if (err?.code === "ECONNRESET" || err?.name === "AbortError" || err?.message === "aborted") {
      return new NextResponse(null, { status: 499 });
    }
    throw err;
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;

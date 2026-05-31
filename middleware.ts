// Vercel Edge Middleware: proxies /agent/* and /voice/* to the Render
// backend with a shared-secret header. The secret stays server-side
// (Vercel env var BACKEND_SHARED_SECRET) so direct curl traffic to the
// Render URL gets 401'd, but browser traffic via atrium.vercel.app
// works transparently.

export const config = {
  matcher: ['/agent/:path*', '/voice/:path*'],
};

// NOTE: Reads target backend URL from environment variable, falling back to Render production domain.
const BACKEND_URL = process.env.BACKEND_URL || 'https://grand-rounds-backend.onrender.com';

export default async function middleware(request: Request): Promise<Response> {
  const incoming = new URL(request.url);
  const target = BACKEND_URL + incoming.pathname + incoming.search;

  const headers = new Headers(request.headers);
  const secret = process.env.BACKEND_SHARED_SECRET;
  if (secret) {
    headers.set('x-atrium-auth', secret);
  }
  // host must match the target, not the Vercel edge.
  headers.delete('host');

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  // Buffer the request body — Vercel Edge runtime can't pass through a
  // streaming ReadableBody to fetch reliably. POST payloads are small
  // (JSON), so the cost is negligible. SSE responses still stream back.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  return fetch(target, init);
}

import { createApp } from '../src/server.js';
import { resetDatabase } from '../src/database/sqlite.js';

export function freshApp() {
  resetDatabase();
  return createApp();
}

export function withServer(app, fn) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', async () => {
      const { port } = server.address();
      const base = `http://127.0.0.1:${port}`;
      try {
        const result = await fn(base, server);
        server.close(() => resolve(result));
      } catch (err) {
        server.close(() => reject(err));
      }
    });
  });
}

export async function jarFetch(base, path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  const data = await res.json().catch(() => ({}));
  return { res, data, setCookie };
}

export function cookieFrom(setCookie) {
  return setCookie.map((c) => c.split(';')[0]).join('; ');
}

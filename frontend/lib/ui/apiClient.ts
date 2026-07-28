// frontend/lib/ui/apiClient.ts

/**
 * 共通 API クライアント
 *
 * 方針：
 * - Client Component（ブラウザ）では「相対パス /api/...」で叩く → CORS 回避
 * - Server Component / Route Handler では absolute URL（localhost:3000 等）で叩く
 * - fetch option（cache / next / headers）は Next.js 流儀を尊重
 */

type ApiGetOptions = {
  // Next.js fetch options
  cache?: RequestCache;
  next?: { revalidate?: number };
  headers?: Record<string, string>;
};

function getServerBaseUrl() {
  // server-side 用（Docker / SSR）
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    "http://localhost:3000"
  );
}

/**
 * path:
 *   - "/api/xxx" を想定
 *   - absolute URL を渡されたらそのまま使う
 */
async function apiFetch<T>(
  path: string,
  init: RequestInit & ApiGetOptions = {}
): Promise<T> {
  const isAbsolute = /^https?:\/\//.test(path);

  // ★ここが最重要
  // browser(client) → 相対パス
  // server → absolute URL
  const url =
    isAbsolute
      ? path
      : typeof window !== "undefined"
        ? path
        : `${getServerBaseUrl()}${path}`;

  const res = await fetch(url, {
    ...init,
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: init.cache,
    next: init.next,
  });

  if (!res.ok) {
    let payload: any = null;
    try {
      payload = await res.json();
    } catch {}

    const msg =
      payload?.error?.message ??
      payload?.message ??
      `${init.method ?? "GET"} ${path} failed: ${res.status}`;

    throw new Error(msg);
  }

  return (await res.json()) as T;
}

// =========================
// public helpers
// =========================

export function apiGet<T>(path: string, opts: ApiGetOptions = {}) {
  return apiFetch<T>(path, {
    method: "GET",
    cache: opts.cache,
    next: opts.next,
    headers: opts.headers,
  });
}

export function apiPost<T>(
  path: string,
  body?: any,
  opts: ApiGetOptions = {}
) {
  return apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
    cache: opts.cache,
    next: opts.next,
    headers: opts.headers,
  });
}

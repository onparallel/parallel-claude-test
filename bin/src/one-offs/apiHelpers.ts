import { fetchToFile } from "../utils/fetchToFile";
import { RateLimitGuard } from "../utils/RateLimitGuard";

/**
 * fetches all items of a paginated endpoint
 */
export async function* paginatedApiRequest<T>(
  path: string,
  {
    query = new URLSearchParams(),
    method = "GET",
    body,
    initialOffset = 0,
  }: {
    query?: URLSearchParams;
    method?: string;
    body?: Record<string, any>;
    initialOffset?: number;
  },
) {
  let index = initialOffset;
  let offset = initialOffset;
  let totalCount = 0;
  do {
    const result = await apiRequest<{ items: T[]; totalCount: number }>(path, {
      query: new URLSearchParams({ ...Object.fromEntries(query), offset: `${offset}` }),
      method,
      body,
    });
    totalCount = result.totalCount;
    console.debug(`Fetched [${offset + 1}-${offset + result.items.length}]/${totalCount}`);
    for (const item of result.items) {
      yield { item, totalCount, index: index++ };
    }
    offset = index;
  } while (index < totalCount);
}

const guard = new RateLimitGuard(90 / 60);

function buildApiUrl(path: string, query?: URLSearchParams) {
  return `https://www.onparallel.com/api/v1/${path.startsWith("/") ? path.slice(1) : path}${
    query && query.size > 0 ? `?${query}` : ""
  }`;
}

export async function apiRequest<T = any>(
  path: string,
  options?: { query?: URLSearchParams; method?: string; body?: Record<string, any> },
): Promise<T> {
  const { query, method = "GET", body } = options ?? {};
  await guard.waitUntilAllowed();
  const res = await fetch(buildApiUrl(path, query), {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${process.env.API_KEY}`,
    },
  });
  return res.ok && res.status !== 204 ? ((await res.json()) as T) : (null as T);
}

export async function apiFetchToFile(
  path: string,
  dest: string,
  options?: { query?: URLSearchParams; method?: string; body?: Record<string, any> },
) {
  const { query, method = "GET", body } = options ?? {};
  await fetchToFile(
    buildApiUrl(path, query),
    {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
    },
    dest,
  );
}

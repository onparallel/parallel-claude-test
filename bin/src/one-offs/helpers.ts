/**
 * fetches all items of a paginated endpoint
 */
export async function* paginatedRequest<T>(
  path: string,
  {
    query = new URLSearchParams(),
    method = "GET",
    body,
  }: { query?: URLSearchParams; method?: string; body?: Record<string, any> },
) {
  let offset = 0;
  let index = 0;
  let totalCount = 0;
  do {
    const result = await request<{ items: T[]; totalCount: number }>(path, {
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

export async function request<T = any>(
  path: string,
  options?: { query?: URLSearchParams; method?: string; body?: Record<string, any> },
): Promise<T> {
  const { query, method = "GET", body } = options ?? {};
  const res = await fetch(
    `https://www.onparallel.com/api/v1/${path.startsWith("/") ? path.slice(1) : path}${
      query && query.size > 0 ? `?${query}` : ""
    }`,
    {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
    },
  );
  return (await res.json()) as T;
}

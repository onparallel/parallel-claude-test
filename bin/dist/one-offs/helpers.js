"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginatedRequest = paginatedRequest;
exports.request = request;
/**
 * fetches all items of a paginated endpoint
 */
async function* paginatedRequest(path, { query = new URLSearchParams(), method = "GET", body, }) {
    let offset = 0;
    let index = 0;
    let totalCount = 0;
    do {
        const result = await request(path, {
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
async function request(path, { query, method = "GET", body, }) {
    const res = await fetch(`https://www.onparallel.com/api/v1/${path.startsWith("/") ? path.slice(1) : path}${query && query.size > 0 ? `?${query}` : ""}`, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
            ...(body ? { "Content-Type": "application/json" } : {}),
            Authorization: `Bearer ${process.env.API_KEY}`,
        },
    });
    return (await res.json());
}

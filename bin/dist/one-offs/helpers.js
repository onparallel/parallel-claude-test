"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginatedRequest = paginatedRequest;
exports.request = request;
const RateLimitGuard_1 = require("../utils/RateLimitGuard");
/**
 * fetches all items of a paginated endpoint
 */
async function* paginatedRequest(path, { query = new URLSearchParams(), method = "GET", body, initialOffset = 0, }) {
    let index = initialOffset;
    let offset = initialOffset;
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
const guard = new RateLimitGuard_1.RateLimitGuard(90 / 60);
async function request(path, options) {
    const { query, method = "GET", body } = options ?? {};
    await guard.waitUntilAllowed();
    const res = await fetch(`https://www.onparallel.com/api/v1/${path.startsWith("/") ? path.slice(1) : path}${query && query.size > 0 ? `?${query}` : ""}`, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
            ...(body ? { "Content-Type": "application/json" } : {}),
            Authorization: `Bearer ${process.env.API_KEY}`,
        },
    });
    return res.ok && res.status !== 204 ? (await res.json()) : null;
}

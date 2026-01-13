"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginatedApiRequest = paginatedApiRequest;
exports.apiRequest = apiRequest;
exports.apiFetchToFile = apiFetchToFile;
const fetchToFile_1 = require("../utils/fetchToFile");
const RateLimitGuard_1 = require("../utils/RateLimitGuard");
/**
 * fetches all items of a paginated endpoint
 */
async function* paginatedApiRequest(path, { query = new URLSearchParams(), method = "GET", body, initialOffset = 0, }) {
    let index = initialOffset;
    let offset = initialOffset;
    let totalCount = 0;
    do {
        const result = await apiRequest(path, {
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
function buildApiUrl(path, query) {
    return `https://www.onparallel.com/api/v1/${path.startsWith("/") ? path.slice(1) : path}${query && query.size > 0 ? `?${query}` : ""}`;
}
async function apiRequest(path, options) {
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
    return res.ok && res.status !== 204 ? (await res.json()) : null;
}
async function apiFetchToFile(path, dest, options) {
    const { query, method = "GET", body } = options ?? {};
    await (0, fetchToFile_1.fetchToFile)(buildApiUrl(path, query), {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
            ...(body ? { "Content-Type": "application/json" } : {}),
            Authorization: `Bearer ${process.env.API_KEY}`,
        },
    }, dest);
}

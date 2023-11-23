"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const run_1 = require("../utils/run");
/**
 * This script closes all petitions coming from the same template
 */
const API_KEY = process.env.API_KEY;
const TEMPLATE_IDS = ["zas25KHxAByKXKSsb6Q"];
async function request(path, { query, method = "GET", body, }) {
    const res = await (0, node_fetch_1.default)(`https://www.onparallel.com/api/v1/${path.startsWith("/") ? path.slice(1) : path}${query && query.size > 0 ? `?${query}` : ""}`, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
            ...(body ? { "Content-Type": "application/json" } : {}),
            Authorization: `Bearer ${API_KEY}`,
        },
    });
    return await res.json();
}
async function main() {
    const petitions = await request("/petitions", {
        query: new URLSearchParams({
            fromTemplateId: TEMPLATE_IDS.join(","),
            status: "COMPLETED",
            limit: "1000",
        }),
    });
    let i = 0;
    for (const petition of petitions.items) {
        if (petition.status !== "CLOSED") {
            console.log(`Closing petition ${petition.id} (${++i}/${petitions.totalCount})`);
            await request(`/petitions/${petition.id}/close`, { method: "POST" });
        }
    }
}
(0, run_1.run)(main);

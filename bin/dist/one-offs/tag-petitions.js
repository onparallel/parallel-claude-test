"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const remeda_1 = require("remeda");
const run_1 = require("../utils/run");
/**
 * This script tags all petitions coming from the same template with tags that depend on one
 * of the replies to the petition
 */
const API_KEY = process.env.API_KEY;
const TEMPLATE_ID = "zas25KHxAByKWu6SFLA";
const TEMPLATE_FIELD_ID = "FDXxUofV6Q2DPnQMZxXw7FYfeJy5F";
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
    var _a, _b, _c;
    const petitions = await request("/petitions", {
        query: new URLSearchParams({
            fromTemplateId: TEMPLATE_ID,
            limit: "1000",
            include: ["fields", "tags", "recipients"].join(","),
            tags: "",
        }),
    });
    for (const petition of petitions.items) {
        const field = petition.fields.find((f) => f.fromPetitionFieldId === TEMPLATE_FIELD_ID);
        const replies = (_c = (_b = (_a = field.replies) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.map((r) => r.replace(/ - .*/, ""));
        if (replies && replies.length > 0) {
            const tags = (0, remeda_1.difference)(replies, petition.tags);
            if (tags.length > 0) {
                console.log(`Tagging petition ${petition.id} with ${tags.join(", ")}`);
            }
            for (const tag of tags) {
                await request(`/petitions/${petition.id}/tags`, { method: "POST", body: { name: tag } });
            }
        }
    }
}
(0, run_1.run)(main);

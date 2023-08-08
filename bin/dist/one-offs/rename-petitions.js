"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const run_1 = require("../utils/run");
const API_KEY = process.env.API_KEY;
// Plantillas de Saldados
const TEMPLATE_IDS = ["zas25KHxAByKWmEJE2u", "zas25KHxAByKX3pkmhr"];
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
    var _a, _b;
    const petitions = await request("/petitions", {
        query: new URLSearchParams({
            fromTemplateId: TEMPLATE_IDS.join(","),
            limit: "1000",
            include: "recipients",
        }),
    });
    for (const petition of petitions.items) {
        const recipient = (_b = (_a = petition.recipients) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.contact.fullName;
        if (!recipient || petition.name !== "Saldados - Expediente")
            continue;
        const name = `Formulario - ${recipient}`;
        console.log(`Renaming petition ${petition.id} as: '${name}'`);
        await request(`/petitions/${petition.id}`, { method: "PUT", body: { name } });
    }
}
(0, run_1.run)(main);

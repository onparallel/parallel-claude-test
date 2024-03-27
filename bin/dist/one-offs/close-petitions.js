"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const run_1 = require("../utils/run");
const helpers_1 = require("./helpers");
/**
 * This script closes all petitions coming from the same template
 */
const TEMPLATE_IDS = ["6Y8DSH92uxPaJ4B9vf9XU"];
async function main() {
    for await (const { item: petition, totalCount, index } of (0, helpers_1.paginatedRequest)("/petitions", {
        query: new URLSearchParams({
            fromTemplateId: TEMPLATE_IDS.join(","),
            status: "PENDING,COMPLETED",
            limit: `${100}`,
        }),
    })) {
        console.log(`Closing petition ${petition.id} (${index + 1}/${totalCount})`);
        await (0, helpers_1.request)(`/petitions/${petition.id}/close`, { method: "POST" });
    }
}
(0, run_1.run)(main);

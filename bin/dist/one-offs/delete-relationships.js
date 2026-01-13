"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const run_1 = require("../utils/run");
const apiHelpers_1 = require("./apiHelpers");
async function main() {
    for await (const { item: profile } of (0, apiHelpers_1.paginatedApiRequest)("/profiles", {
        query: new URLSearchParams({
            limit: `${50}`,
            profileTypeIds: "NmPPpRMhHPG7wxmE555wCA",
            include: ["relationships"].join(","),
        }),
    })) {
        const relationship = profile.relationships.find((r) => r.profile.id === "zcpwmWtjw938xEfThwK");
        if (relationship) {
            console.log(`Deleting relationship ${relationship.id} for profile ${profile.id} (${profile.name})`);
            await (0, apiHelpers_1.apiRequest)(`/profiles/${profile.id}/relationships/${relationship.id}`, {
                method: "DELETE",
            });
        }
    }
}
(0, run_1.run)(main);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const run_1 = require("../utils/run");
const helpers_1 = require("./helpers");
const FROM_PROFILE_TYPE_ID = "3gtknhcm5YKAVC7jz7QeoQEK";
const offset = process.env.OFFSET ? parseInt(process.env.OFFSET) : 0;
async function main() {
    let totalCount = 0;
    do {
        // always fetch profiles with offset 0, as this script will delete profiles
        // break condition is when there are no more profiles to delete
        const result = await (0, helpers_1.request)("/profiles", {
            query: new URLSearchParams([
                ["profileTypeIds", FROM_PROFILE_TYPE_ID],
                ["status", "OPEN"],
                ["limit", "100"],
                ["offset", `${offset}`],
                ["values[0][alias]", "marker"],
                ["values[0][operator]", "EQUAL"],
                ["values[0][value]", "X"],
            ]),
        });
        totalCount = result.totalCount;
        console.debug(`Fetched ${result.items.length}/${totalCount}`);
        if (result.items.length === 0) {
            break;
        }
        for (const item of result.items) {
            console.log(`Closing profile ${item.id}`);
            await (0, helpers_1.request)(`/profiles/${item.id}/close`, { method: "POST" });
            console.log(`Deleting profile ${item.id}`);
            await (0, helpers_1.request)(`/profiles/${item.id}`, { method: "DELETE" });
        }
    } while (totalCount > 0);
}
(0, run_1.run)(main);

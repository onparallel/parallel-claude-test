"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const fetchToFile_1 = require("../utils/fetchToFile");
const run_1 = require("../utils/run");
const helpers_1 = require("./helpers");
/**
 * This script downloads all signatures.
 */
async function main() {
    var _a, _b, _c;
    const DOWNLOAD = {
        zip: true,
        signature: false,
        audit: false,
    };
    const output = `${__dirname}/output`;
    for await (const { item: petition, totalCount, index } of (0, helpers_1.paginatedRequest)("/petitions", {
        query: new URLSearchParams({
            limit: `${50}`,
            include: "signatures",
        }),
    })) {
        console.log(`Downloading ${petition.id} ${petition.name} (${index + 1}/${totalCount})`);
        if (DOWNLOAD.zip) {
            await (0, fetchToFile_1.fetchToFile)(`https://www.onparallel.com/api/v1/petitions/${petition.id}/export`, { headers: { Authorization: `Bearer ${process.env.API_KEY}` } }, path_1.default.join(output, (0, sanitize_filename_1.default)(((_a = petition.name) !== null && _a !== void 0 ? _a : petition.id).slice(0, 200)) + ".zip"));
        }
        if ((DOWNLOAD.zip || DOWNLOAD.audit) &&
            petition.signatures.length > 0 &&
            petition.signatures[0].environment === "PRODUCTION" &&
            petition.signatures[0].status === "COMPLETED") {
            await (0, fetchToFile_1.fetchToFile)(`https://www.onparallel.com/api/v1/petitions/${petition.id}/signatures/${petition.signatures[0].id}/document`, { headers: { Authorization: `Bearer ${process.env.API_KEY}` } }, path_1.default.join(output, (0, sanitize_filename_1.default)(((_b = petition.name) !== null && _b !== void 0 ? _b : petition.id).slice(0, 200)) + ".pdf"));
            try {
                await (0, fetchToFile_1.fetchToFile)(`https://www.onparallel.com/api/v1/petitions/${petition.id}/signatures/${petition.signatures[0].id}/audit`, { headers: { Authorization: `Bearer ${process.env.API_KEY}` } }, path_1.default.join(output, (0, sanitize_filename_1.default)(((_c = petition.name) !== null && _c !== void 0 ? _c : petition.id).slice(0, 200)) + "_audit.pdf"));
            }
            catch { }
        }
    }
}
(0, run_1.run)(main);

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const getAvailableFileName_1 = require("../utils/getAvailableFileName");
const run_1 = require("../utils/run");
const apiHelpers_1 = require("./apiHelpers");
async function main() {
    const DOWNLOAD = {
        excel: false,
        zip: true,
        pdf: false,
        signature: false,
        audit: false,
    };
    const petitions = (0, apiHelpers_1.paginatedApiRequest)("/petitions", {
        query: new URLSearchParams({
            limit: `${50}`,
            status: "COMPLETED",
            fromTemplateId: ["6Y8DSH92uxPaJ4p5ybj7Y", "6Y8DSH92uxPaJ4ooVzRNM"].join(","),
            include: ["recipients", ...(DOWNLOAD.signature || DOWNLOAD.audit ? ["signatures"] : [])].join(","),
        }),
    });
    const output = `${__dirname}/output/`;
    for await (const { item: petition, totalCount, index } of petitions) {
        // modify accordingly
        const dest = path_1.default.join(output, `/${petition.name}`);
        await (0, promises_1.mkdir)(dest, { recursive: true });
        const name = (0, sanitize_filename_1.default)(petition.recipients[0].contact.fullName).slice(0, 255);
        if (DOWNLOAD.zip) {
            await (0, apiHelpers_1.apiFetchToFile)(`/petitions/${petition.id}/export`, await (0, getAvailableFileName_1.getAvailableFileName)(dest, name, ".zip"), { query: new URLSearchParams({ format: "zip" }) });
        }
        if (DOWNLOAD.excel) {
            await (0, apiHelpers_1.apiFetchToFile)(`/petitions/${petition.id}/export`, await (0, getAvailableFileName_1.getAvailableFileName)(dest, name, ".xlsx"), { query: new URLSearchParams({ format: "excel" }) });
        }
        if (DOWNLOAD.pdf) {
            await (0, apiHelpers_1.apiFetchToFile)(`/petitions/${petition.id}/export`, await (0, getAvailableFileName_1.getAvailableFileName)(dest, name, ".pdf"), { query: new URLSearchParams({ format: "pdf" }) });
        }
        if ((DOWNLOAD.signature || DOWNLOAD.audit) &&
            petition.signatures.length > 0 &&
            petition.signatures[0].environment === "PRODUCTION" &&
            petition.signatures[0].status === "COMPLETED") {
            await (0, apiHelpers_1.apiFetchToFile)(`/petitions/${petition.id}/signatures/${petition.signatures[0].id}/document`, await (0, getAvailableFileName_1.getAvailableFileName)(output, name, ".pdf"));
            await (0, apiHelpers_1.apiFetchToFile)(`/petitions/${petition.id}/signatures/${petition.signatures[0].id}/audit`, await (0, getAvailableFileName_1.getAvailableFileName)(output, name + " AUDIT", ".pdf"));
        }
        console.log(`Downloaded ${petition.id} ${petition.name} (${index + 1}/${totalCount})`);
    }
}
(0, run_1.run)(main);

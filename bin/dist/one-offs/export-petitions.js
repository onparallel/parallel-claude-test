"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const p_map_1 = __importDefault(require("p-map"));
const path_1 = __importDefault(require("path"));
const remeda_1 = require("remeda");
const fetchToFile_1 = require("../utils/fetchToFile");
const getAvailableFileName_1 = require("../utils/getAvailableFileName");
const run_1 = require("../utils/run");
const helpers_1 = require("./helpers");
const TEMPLATE_ID = "6Y8DSH92uxPaJ4BZPFDrr";
async function main() {
    const DOWNLOAD = {
        excel: true,
        zip: false,
        pdf: true,
        signature: false,
        audit: false,
    };
    // const template = await request<{ name: string }>(`/templates/${TEMPLATE_ID}`);
    // const output = `${__dirname}/output/${sanitize(template.name)}`;
    const output = `${__dirname}/output/growpro/`;
    await (0, promises_1.mkdir)(output, { recursive: true });
    const petitions = (0, helpers_1.paginatedRequest)("/petitions", {
        query: new URLSearchParams({
            limit: `${50}`,
            // fromTemplateId: TEMPLATE_ID,
            include: ["recipients", ...(DOWNLOAD.signature || DOWNLOAD.audit ? ["signatures"] : [])].join(","),
        }),
        initialOffset: 7236,
    });
    await (0, p_map_1.default)((0, remeda_1.range)(0, 11391), async function () {
        const x = await petitions.next();
        if (x.done) {
            throw new Error("No more petitions");
        }
        const { item: petition, totalCount, index } = x.value;
        const dest = path_1.default.join(output, `.${petition.path}`);
        await (0, promises_1.mkdir)(dest, { recursive: true });
        const name = petition.name ? `${petition.name} - ${petition.id}` : petition.id;
        if (DOWNLOAD.zip) {
            await (0, fetchToFile_1.fetchToFile)(`https://www.onparallel.com/api/v1/petitions/${petition.id}/export?${new URLSearchParams({
                format: "zip",
            })}`, { headers: { Authorization: `Bearer ${process.env.API_KEY}` } }, await (0, getAvailableFileName_1.getAvailableFileName)(dest, name, ".zip"));
        }
        if (DOWNLOAD.excel) {
            await (0, fetchToFile_1.fetchToFile)(`https://www.onparallel.com/api/v1/petitions/${petition.id}/export?${new URLSearchParams({
                format: "excel",
            })}`, { headers: { Authorization: `Bearer ${process.env.API_KEY}` } }, await (0, getAvailableFileName_1.getAvailableFileName)(dest, name, ".xlsx"));
        }
        if (DOWNLOAD.pdf) {
            await (0, fetchToFile_1.fetchToFile)(`https://www.onparallel.com/api/v1/petitions/${petition.id}/export?${new URLSearchParams({
                format: "pdf",
            })}`, { headers: { Authorization: `Bearer ${process.env.API_KEY}` } }, await (0, getAvailableFileName_1.getAvailableFileName)(dest, name, ".pdf"));
        }
        if ((DOWNLOAD.signature || DOWNLOAD.audit) &&
            petition.signatures.length > 0 &&
            petition.signatures[0].environment === "PRODUCTION" &&
            petition.signatures[0].status === "COMPLETED") {
            await (0, fetchToFile_1.fetchToFile)(`https://www.onparallel.com/api/v1/petitions/${petition.id}/signatures/${petition.signatures[0].id}/document`, { headers: { Authorization: `Bearer ${process.env.API_KEY}` } }, await (0, getAvailableFileName_1.getAvailableFileName)(output, name, ".pdf"));
            try {
                await (0, fetchToFile_1.fetchToFile)(`https://www.onparallel.com/api/v1/petitions/${petition.id}/signatures/${petition.signatures[0].id}/audit`, { headers: { Authorization: `Bearer ${process.env.API_KEY}` } }, await (0, getAvailableFileName_1.getAvailableFileName)(output, name + " AUDIT", ".pdf"));
            }
            catch { }
        }
        console.log(`Downloaded ${petition.id} ${petition.name} (${index + 1}/${totalCount})`);
    }, { concurrency: 1 });
}
(0, run_1.run)(main);

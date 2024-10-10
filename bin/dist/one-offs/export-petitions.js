"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const fetchToFile_1 = require("../utils/fetchToFile");
const getAvailableFileName_1 = require("../utils/getAvailableFileName");
const run_1 = require("../utils/run");
const helpers_1 = require("./helpers");
const TEMPLATE_ID = "6Y8DSH92uxPaJ4BZPFDrr";
async function main() {
    var _a, _b, _c;
    const DOWNLOAD = {
        zip: true,
        signature: false,
        audit: false,
    };
    const template = await (0, helpers_1.request)(`/templates/${TEMPLATE_ID}`);
    const output = `${__dirname}/output/${(0, sanitize_filename_1.default)(template.name)}`;
    await (0, promises_1.mkdir)(output, { recursive: true });
    for await (const { item: petition, totalCount, index } of (0, helpers_1.paginatedRequest)("/petitions", {
        query: new URLSearchParams({
            limit: `${50}`,
            fromTemplateId: TEMPLATE_ID,
            include: ["recipients", ...(DOWNLOAD.signature || DOWNLOAD.audit ? ["signatures"] : [])].join(","),
        }),
    })) {
        console.log(`Downloading ${petition.id} ${petition.name} (${index + 1}/${totalCount})`);
        const name = `${petition.id} - ${(_c = (_b = (_a = petition.recipients[0]) === null || _a === void 0 ? void 0 : _a.contact) === null || _b === void 0 ? void 0 : _b.fullName) !== null && _c !== void 0 ? _c : petition.name}`;
        if (DOWNLOAD.zip) {
            await (0, fetchToFile_1.fetchToFile)(`https://www.onparallel.com/api/v1/petitions/${petition.id}/export?${new URLSearchParams({
                format: "zip",
            })}`, { headers: { Authorization: `Bearer ${process.env.API_KEY}` } }, await (0, getAvailableFileName_1.getAvailableFileName)(output, name, ".zip"));
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
    }
}
(0, run_1.run)(main);

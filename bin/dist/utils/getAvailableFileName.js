"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableFileName = getAvailableFileName;
const fs_1 = require("fs");
const path_1 = require("path");
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const ts_essentials_1 = require("ts-essentials");
async function getAvailableFileName(directory, filename, extension) {
    (0, ts_essentials_1.assert)(extension.startsWith("."), "extension must include initial .");
    const sanitized = (0, sanitize_filename_1.default)(filename).slice(0, 255 - extension.length);
    const path = (0, path_1.join)(directory, sanitized + extension);
    if (!(0, fs_1.existsSync)(path)) {
        return path;
    }
    let counter = 1;
    while (counter < 100) {
        const prefix = ` (${counter++})`;
        const sanitized = (0, sanitize_filename_1.default)(filename).slice(0, 255 - extension.length - prefix.length);
        const path = (0, path_1.join)(directory, sanitized + prefix + extension);
        if (!(0, fs_1.existsSync)(path)) {
            return path;
        }
    }
    throw new Error("Can't create filename");
}

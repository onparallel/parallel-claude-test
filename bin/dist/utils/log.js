"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
function warn(message) {
    console.warn(chalk_1.default.yellow(`${chalk_1.default.bold("Warning")}: ${message}`));
}
exports.warn = warn;

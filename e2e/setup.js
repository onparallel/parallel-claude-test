/* eslint-disable @typescript-eslint/no-var-requires */
const { config } = require("dotenv");
const { resolve } = require("path");

config({ path: resolve(__dirname, `.env.${process.env.ENV}`) });

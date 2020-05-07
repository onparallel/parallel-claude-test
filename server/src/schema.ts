import { fieldAuthorizePlugin, makeSchema } from "@nexus/schema";
import { ForbiddenError } from "apollo-server-express";
import path from "path";
import { paginationPlugin } from "./graphql/helpers/paginationPlugin";
import * as allTypes from "./graphql";
import { validateArgsPlugin } from "./graphql/helpers/validateArgsPlugin";

function resolve(...paths: string[]) {
  return path.join(__dirname.replace(/\/dist$/, "/src"), ...paths);
}

export const schema = makeSchema({
  types: allTypes,
  outputs: {
    schema: path.join(__dirname, "../parallel-schema.graphql"),
    typegen: resolve("./graphql/__types.ts"),
  },
  plugins: [
    fieldAuthorizePlugin({
      formatError: ({ error }) => {
        if (error.message === "Not authorized") {
          return new ForbiddenError(error.message);
        }
        return error;
      },
    }),
    validateArgsPlugin(),
    paginationPlugin(),
  ],
  typegenAutoConfig: {
    sources: [
      { source: resolve("./db/__types.ts"), alias: "db" },
      { source: resolve("./context.ts"), alias: "ctx" },
    ],
    contextType: "ctx.ApiContext",
    backingTypeMap: {
      DateTime: "Date",
      JSONObject: "{[key: string]: any}",
    },
  },
  prettierConfig: path.join(__dirname, "../../.prettierrc"),
});

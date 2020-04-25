import { fieldAuthorizePlugin, makeSchema } from "@nexus/schema";
import path from "path";
import * as allTypes from "./graphql/types";
import { paginationPlugin } from "./graphql/helpers/paginationPlugin";

function resolve(...paths: string[]) {
  return path.join(__dirname.replace(/\/dist$/, "/src"), ...paths);
}

export const schema = makeSchema({
  types: allTypes,
  outputs: {
    schema: path.join(__dirname, "../parallel-schema.graphql"),
    typegen: resolve("./graphql/__types.ts"),
  },
  plugins: [fieldAuthorizePlugin(), paginationPlugin()],
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

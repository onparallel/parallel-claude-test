import { fieldAuthorizePlugin, makeSchema } from "nexus";
import path from "path";
import * as allTypes from "./graphql";
import { ApolloError, ForbiddenError } from "./graphql/helpers/errors";
import { globalIdPlugin } from "./graphql/helpers/globalIdPlugin";
import { paginationPlugin } from "./graphql/helpers/paginationPlugin";
import { validateArgsPlugin } from "./graphql/helpers/validateArgsPlugin";

function resolve(...paths: string[]) {
  return path.join(__dirname.replace(/\/dist$/, "/src"), ...paths);
}

export const schema = makeSchema({
  types: allTypes,
  nonNullDefaults: {
    output: true,
  },
  outputs: {
    schema: path.join(__dirname, "../parallel-schema.graphql"),
    typegen: resolve("./graphql/__types.ts"),
  },
  plugins: [
    globalIdPlugin(),
    fieldAuthorizePlugin({
      formatError: ({ error }) => {
        if (error instanceof ApolloError) {
          return error;
        }
        // no deberian llegar cosas aqui, cada authorizer debería retornar un ApolloError explicativo
        console.warn("Not ApolloError", error);
        return new ForbiddenError(error.message);
      },
    }),
    validateArgsPlugin(),
    paginationPlugin(),
  ],
  sourceTypes: {
    headers: [
      `import type { FileUpload } from "graphql-upload/Upload.js";`,
      `import type { Duration } from "date-fns";`,
      `import type { LocalizableUserText } from "./helpers/scalars/LocalizableUserText";`,
    ],
    modules: [
      { module: resolve("./db/__types.ts"), alias: "db" },
      { module: resolve("./db/events/PetitionEvent.ts"), alias: "petitionEvents" },
      { module: resolve("./db/events/ProfileEvent.ts"), alias: "profileEvents" },
      { module: resolve("./db/events/SystemEvent.ts"), alias: "systemEvents" },
      { module: resolve("./db/notifications.ts"), alias: "notifications" },
      { module: resolve("./context.ts"), alias: "ctx" },
    ],
  },
  contextType: { module: resolve("./context.ts"), export: "ApiContext" },
  prettierConfig: path.join(__dirname, "../../.prettierrc"),
  shouldGenerateArtifacts: process.env.NODE_ENV === "development",
});

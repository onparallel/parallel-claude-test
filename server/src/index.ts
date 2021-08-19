import "./init";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPlugin } from "apollo-server-plugin-base";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { json } from "express";
import { api } from "./api";
import { createContainer } from "./container";
import { ApiContext } from "./context";
import { UnknownError } from "./graphql/helpers/errors";
import { schema } from "./schema";
import { LOGGER, Logger } from "./services/logger";
import { stopwatchEnd } from "./util/stopwatch";
import { graphqlUploadExpress } from "graphql-upload";
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from "apollo-server-core";

const app = express();
const container = createContainer();

app.use("/api", json(), cors(), cookieParser(), api(container));

app.use("/graphql", graphqlUploadExpress());
const server = new ApolloServer({
  schema,
  plugins: [
    process.env.NODE_ENV === "production"
      ? ApolloServerPluginLandingPageDisabled()
      : ApolloServerPluginLandingPageGraphQLPlayground(),
    {
      async requestDidStart() {
        const time = process.hrtime();
        return {
          async willSendResponse({ request: { operationName, variables }, response, context }) {
            if (response.errors) {
              response.errors = response.errors.map((error) => {
                switch (error.extensions?.code) {
                  case "INTERNAL_SERVER_ERROR": {
                    context.logger.error(error.message, error.extensions?.exception);
                    return new UnknownError("Internal server error");
                  }
                  case "GRAPHQL_VALIDATION_FAILED": {
                    context.logger.error(error.message, error.extensions?.exception);
                    return error;
                  }
                  default:
                    return error;
                }
              });
            }
            const duration = stopwatchEnd(time);
            context.logger.info(`GraphQL operation "${operationName}" - ${duration}ms`, {
              operation: { name: operationName, variables },
              duration,
            });
          },
        };
      },
    } as ApolloServerPlugin<ApiContext>,
  ],
  context: async ({ req }) => {
    const context = container.get<ApiContext>(ApiContext);
    context.req = req;
    return context;
  },
});

if (process.env.TS_NODE_DEV) {
  process.on("SIGTERM", async function () {
    await server.stop();
    process.exit(0);
  });
}

server.start().then(() => {
  server.applyMiddleware({ app });

  const port = process.env.PORT || 4000;

  app.listen(port, () => {
    const host = `http://localhost:${port}`;
    const logger = container.get<Logger>(LOGGER);
    logger.info(`Ready on ${host}`);
    if (process.env.NODE_ENV !== "production") {
      logger.info(`GraphQL playground available on ${host}${server.graphqlPath}`);
    }
  });
});

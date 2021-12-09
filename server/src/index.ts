import "./init";
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPlugin } from "apollo-server-plugin-base";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { json } from "express";
import { graphqlUploadExpress } from "graphql-upload";
import { api } from "./api";
import { createContainer } from "./container";
import { ApiContext } from "./context";
import { UnknownError } from "./graphql/helpers/errors";
import { schema } from "./schema";
import { ILogger, LOGGER } from "./services/logger";
import { IRedis, REDIS } from "./services/redis";
import { stopwatchEnd } from "./util/stopwatch";

const app = express();
const container = createContainer();

app.get("/ping", (req, res, next) =>
  res.set("content-type", "text/plain").status(200).send("pong")
);

app.use("/api", json(), cors(), cookieParser(), api(container));

app.use("/graphql", graphqlUploadExpress());
const server = new ApolloServer({
  debug: true,
  // https://github.com/graphql-nexus/nexus/issues/1019
  schema: schema as any,
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
                    const stack = (error.extensions?.exception as any).stacktrace;
                    context.logger.error(error.message, stack && { stack });
                    return new UnknownError("Internal server error");
                  }
                  default:
                    const stack = (error.extensions?.exception as any).stacktrace;
                    context.logger.warn(error.message, stack && { stack });
                    if (error.extensions?.exception) {
                      delete error.extensions.exception;
                    }
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

(async function start() {
  const redis = container.get<IRedis>(REDIS);
  await redis.connect();
  await server.start();
  server.applyMiddleware({ app });
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    const host = `http://localhost:${port}`;
    const logger = container.get<ILogger>(LOGGER);
    logger.info(`Ready on ${host}`);
    if (process.env.NODE_ENV !== "production") {
      logger.info(`GraphQL playground available on ${host}${server.graphqlPath}`);
    }
  });
})().then();

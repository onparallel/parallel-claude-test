import "./init";
// keep this space to prevent import sorting removing init from top

import { ApolloServer, ApolloServerPlugin } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { json } from "express";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.js";
import { api } from "./api";
import { createContainer } from "./container";
import { ApiContext } from "./context";
import { UnknownError } from "./graphql/helpers/errors";
import { schema } from "./schema";
import { ILogger, LOGGER } from "./services/logger";
import { IRedis, REDIS } from "./services/redis";
import { stopwatchEnd } from "./util/stopwatch";
import assert from "assert";

const app = express();
app.disable("x-powered-by");

const container = createContainer();

app.get("/ping", (req, res, next) =>
  res.set("content-type", "text/plain").status(200).send("pong")
);

app.use("/api", cors(), cookieParser(), api(container));

const server = new ApolloServer({
  // this allows us to send the error stacktrace to the context logger (cloudwatch)
  // as we don't expose the stacktrace anywhere else, it's safe to leave it as true for all environments
  includeStacktraceInErrorResponses: true,
  allowBatchedHttpRequests: true,
  schema: schema,
  csrfPrevention: true,
  plugins: [
    ...(process.env.NODE_ENV === "production" ? [ApolloServerPluginLandingPageDisabled()] : []),
    {
      async requestDidStart() {
        const time = process.hrtime();
        return {
          async willSendResponse({
            request: { operationName, variables },
            response,
            contextValue,
          }) {
            assert(response.body.kind === "single");
            const result = response.body.singleResult;
            if (result.errors) {
              result.errors = result.errors.map((error) => {
                switch (error.extensions?.code) {
                  case "INTERNAL_SERVER_ERROR": {
                    const stack = error.extensions?.stacktrace;
                    contextValue.logger.error(error.message, stack && { stack });
                    return new UnknownError("Internal server error");
                  }
                  default:
                    const stack = error.extensions?.stacktrace;
                    contextValue.logger.warn(error.message, stack && { stack });
                    if (error.extensions?.stacktrace) {
                      delete error.extensions.stacktrace;
                    }
                    return error;
                }
              });
            }
            const duration = stopwatchEnd(time);
            contextValue.logger.info(`GraphQL operation "${operationName}" - ${duration}ms`, {
              operation: { name: operationName, variables },
              duration,
            });
          },
        };
      },
    } as ApolloServerPlugin<ApiContext>,
  ],
});

if (process.env.TS_NODE_DEV) {
  process.on("SIGTERM", async function () {
    await server.stop();
    process.exit(0);
  });
}

(async function start() {
  const redis = container.get<IRedis>(REDIS);
  await Promise.all([redis.connect(), server.start()]);
  app.use(
    "/graphql",
    cors(),
    json({ limit: "2mb" }),
    graphqlUploadExpress(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const context = container.get<ApiContext>(ApiContext);
        context.req = req;
        return context;
      },
    })
  );

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    const host = `http://localhost:${port}`;
    const logger = container.get<ILogger>(LOGGER);
    logger.info(`Ready on ${host}`);
    if (process.env.NODE_ENV !== "production") {
      logger.info(`GraphQL playground available on ${host}/graphql`);
    }
  });
})().then();

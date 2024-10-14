import "./init";
// keep this space to prevent import sorting removing init from top

import { ApolloServer, ApolloServerPlugin } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { json } from "express";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.js";
import onFinished from "on-finished";
import { assert } from "ts-essentials";
import { api } from "./api";
import { createContainer } from "./container";
import { ApiContext } from "./context";
import { UnknownError } from "./graphql/helpers/errors";
import { schema } from "./schema";
import { ILogger, LOGGER } from "./services/Logger";
import { IRedis, REDIS } from "./services/Redis";
import { loadEnv } from "./util/loadEnv";
import { stopwatchEnd } from "./util/stopwatch";

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
      async requestDidStart({ request: { operationName, variables }, contextValue }) {
        contextValue.logger.debug(`Start GraphQL operation "${operationName}"`, {
          operation: { name: operationName, variables },
        });
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
            contextValue.req.graphQLOperations ??= [];
            contextValue.req.graphQLOperations!.push({
              name: operationName!,
              variables: variables!,
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
  await loadEnv();
  const container = createContainer();
  const redis = container.get<IRedis>(REDIS);
  const logger = container.get<ILogger>(LOGGER);
  await Promise.all([redis.connect(), server.start()]);

  const port = process.env.PORT || 4000;
  express()
    .disable("x-powered-by")
    .get("/ping", (req, res, next) =>
      res.set("content-type", "text/plain").status(200).send("pong"),
    )
    .use((req, res, next) => {
      const context = container.get<ApiContext>(ApiContext);
      context.req = req;
      req.context = context;
      const time = process.hrtime();
      const url = req.originalUrl ?? req.url;
      const ip = req.header("x-forwarded-for") ?? req.ip ?? req.socket.remoteAddress;
      const method = req.method;
      logger.debug(`${method} ${url}`);
      onFinished(res, () => {
        const statusCode = res.statusCode;
        const duration = stopwatchEnd(time);
        const length = res.getHeader("content-length");
        logger[statusCode >= 500 ? "error" : "info"](
          `${ip} ${method} ${url} ${statusCode} ${length ?? 0}B ${duration}ms`,
          {
            userId: req.context?.trails.userId,
            accessId: req.context?.trails.accessId,
            orgId: req.context?.trails.orgId,
            graphQL: req.graphQLOperations,
            requestId: req.header("api-request-id") ?? req.requestId,
          },
        );
      });
      next();
    })
    .use("/api", cors(), cookieParser(), api(container))
    .use(
      "/graphql",
      cors(),
      json({ limit: "2mb" }),
      graphqlUploadExpress(),
      expressMiddleware(server, {
        context: async ({ req }) => req.context,
      }),
    )
    .listen(port, () => {
      const host = `http://localhost:${port}`;
      const logger = container.get<ILogger>(LOGGER);
      logger.info(`Ready on ${host}`);
      if (process.env.NODE_ENV !== "production") {
        logger.info(`GraphQL playground available on ${host}/graphql`);
      }
    });
})().then();

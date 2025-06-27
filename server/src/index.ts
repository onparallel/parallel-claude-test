import "./init";
// keep this space to prevent import sorting removing init from top

import { ApolloServer, ApolloServerPlugin } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import chalk from "chalk";
import cookieParser from "cookie-parser";
import express, { json } from "express";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.js";
import onFinished from "on-finished";
import { assert } from "ts-essentials";
import { api } from "./api";
import { createContainer } from "./container";
import { ApiContext } from "./context";
import { UnknownError } from "./graphql/helpers/errors";
import { schema } from "./schema";
import { CORS_SERVICE, ICorsService } from "./services/CorsService";
import { ILogger, LOGGER } from "./services/Logger";
import { IRedis, REDIS } from "./services/Redis";
import { formatBytes } from "./util/formatBytes";
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
  const cors = container.get<ICorsService>(CORS_SERVICE);
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
        const lengthBytes = Number(length) || 0;
        let formattedLength: string;

        if (process.env.TS_NODE_DEV && process.env.VERBOSE_LOGS && length) {
          const formattedSize = formatBytes(lengthBytes);
          // Color thresholds: yellow > 1MB, red > 5MB
          if (lengthBytes > 5 * 1024 * 1024) {
            formattedLength = chalk.red(formattedSize);
          } else if (lengthBytes > 1024 * 1024) {
            formattedLength = chalk.yellow(formattedSize);
          } else {
            formattedLength = formattedSize;
          }
        } else {
          formattedLength = `${lengthBytes}B`;
        }

        logger[statusCode >= 500 ? "error" : "info"](
          `${ip} ${method} ${url} ${statusCode} ${formattedLength} ${duration}ms`,
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
    .use("/api", cookieParser(), api(container))
    .use(
      "/graphql",
      cors.handler(),
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

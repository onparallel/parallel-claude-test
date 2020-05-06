import "./init";
import { ApolloServer } from "apollo-server-express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { api } from "./api";
import { createContainer } from "./container";
import { ApiContext } from "./context";
import { schema } from "./schema";
import { LOGGER, Logger } from "./services/logger";
import { stopwatchEnd } from "./util/stopwatch";
import { FormatErrorWithContextExtension } from "graphql-format-error-context-extension";
import { UnknownError } from "./graphql/helpers/errors";

const app = express();
const container = createContainer();

app.use("/api", bodyParser.json(), cors(), cookieParser(), api(container));

const server = new ApolloServer({
  schema,
  tracing: process.env.NODE_ENV === "development",
  extensions: [
    () =>
      new FormatErrorWithContextExtension<ApiContext>((error, context) => {
        // Mask internal server errors and log them
        if (error.extensions?.code === "INTERNAL_SERVER_ERROR") {
          context.logger.error(error.message, error.extensions?.exception);
          return new UnknownError("Internal server error");
        } else {
          return error;
        }
      }),
    () => ({
      requestDidStart({ operationName, variables, context }) {
        const time = process.hrtime();
        return () => {
          const duration = stopwatchEnd(time);
          (context as ApiContext).logger.info(
            `GraphQL operation "${operationName}" - ${duration}ms`,
            {
              operation: {
                name: operationName,
                variables,
              },
              duration,
            }
          );
        };
      },
    }),
  ],
  context: async ({ req }) => {
    const context = container.get<ApiContext>(ApiContext);
    context.req = req;
    return context;
  },
});

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

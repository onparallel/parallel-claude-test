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

const app = express();
const container = createContainer();

app.use("/api", bodyParser.json(), cors(), cookieParser(), api(container));

const server = new ApolloServer({
  schema,
  tracing: process.env.NODE_ENV === "development",
  extensions: [
    () => ({
      requestDidStart({ operationName, variables, context }) {
        const time = process.hrtime();
        (context as ApiContext).logger.info(
          `GraphQL operation "${operationName}" start`,
          { variables }
        );
        return () => {
          const [seconds, nanoseconds] = process.hrtime(time);
          const milis = seconds * 1000 + Math.round(nanoseconds / 1e6);
          (context as ApiContext).logger.info(
            `GraphQL operation "${operationName}" finished in ${milis}ms`,
            {
              variables,
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

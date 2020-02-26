import "./init";
import { ApolloServer } from "apollo-server-express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { api } from "./api";
import { createContainer } from "./container";
import { Context } from "./context";
import { schema } from "./schema";

const app = express();
const container = createContainer();

app.use("/api", bodyParser.json(), cors(), cookieParser(), api(container));

const server = new ApolloServer({
  schema,
  tracing: process.env.NODE_ENV === "development",
  context: async ({ req }) => {
    const context = container.get<Context>(Context);
    context.req = req;
    return context;
  }
});

server.applyMiddleware({ app });

const port = process.env.PORT || 4000;

app.listen(port, () => {
  const host = `http://localhost:${port}`;
  console.log(`Ready on ${host}`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`GraphQL playground available on ${host}${server.graphqlPath}`);
  }
});

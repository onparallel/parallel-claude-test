import { ApolloServer } from "apollo-server-express";
import { schema } from "./../../schema";
import { ApiContext } from "../../context";
import { Auth } from "../../services/auth";
import { MockAuth, MockRedis } from "./mocks";
import { createContainer } from "../../container";
import { createTestClient } from "apollo-server-testing";
import { Redis } from "../../services/redis";
import { KNEX } from "../../db/knex";
import Knex from "knex";

export const initServer = () => {
  const container = createContainer();
  const server = new ApolloServer({
    schema,
    context: () => {
      container.rebind(Auth).to(MockAuth);
      container.rebind(Redis).to(MockRedis);
      const context = container.get<ApiContext>(ApiContext);
      context.req = {
        header: (name: string) => {
          if (name === "Authorization") {
            return "Bearer xxxxxxx";
          }
          return "";
        },
      } as any;
      return context;
    },
  });

  const { query, mutate } = createTestClient(server);

  return {
    query,
    mutate,
    container,
    stop: async () => {
      await container.get<Knex>(KNEX).destroy();
      await server.stop();
    },
  };
};

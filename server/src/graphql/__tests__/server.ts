import { ApolloServer } from "apollo-server-express";
import { schema } from "./../../schema";
import { ApiContext } from "../../context";
import { Auth } from "../../services/auth";
import { MockAuth, MockRedis } from "./mocks";
import { createContainer } from "../../container";
import {
  ApolloServerTestClient,
  createTestClient,
} from "apollo-server-testing";
import { Redis } from "../../services/redis";
import { KNEX } from "../../db/knex";
import Knex from "knex";
import { deleteAllData } from "../../util/knexUtils";

export type TestClient = {
  query: ApolloServerTestClient["query"];
  mutate: ApolloServerTestClient["mutate"];
  stop: () => Promise<void>;
  knex: Knex;
};

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

  const knex = container.get<Knex>(KNEX);
  return {
    query,
    mutate,
    knex,
    stop: async () => {
      await deleteAllData(knex);
      await knex.destroy();
      await server.stop();
    },
  };
};

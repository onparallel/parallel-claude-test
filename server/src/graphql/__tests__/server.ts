import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerTestClient,
  createTestClient,
} from "apollo-server-testing";
import Knex from "knex";
import { createContainer } from "../../container";
import { ApiContext } from "../../context";
import { KNEX } from "../../db/knex";
import { ANALYTICS, IAnalyticsService } from "../../services/analytics";
import { Auth } from "../../services/auth";
import { IRedis, REDIS } from "../../services/redis";
import { deleteAllData } from "../../util/knexUtils";
import { schema } from "./../../schema";
import { MockAnalyticsService, MockAuth, MockRedis } from "./mocks";

export type TestClient = {
  query: ApolloServerTestClient["query"];
  mutate: ApolloServerTestClient["mutate"];
  stop: () => Promise<void>;
  knex: Knex;
};

export const initServer = async () => {
  const container = createContainer();
  container.rebind(Auth).to(MockAuth as any);
  container.rebind<IRedis>(REDIS).to(MockRedis);
  container.rebind<IAnalyticsService>(ANALYTICS).to(MockAnalyticsService);
  const server = new ApolloServer({
    schema,
    context: () => {
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
  await deleteAllData(knex);

  return {
    query,
    mutate,
    knex,
    stop: async () => {
      await knex.destroy();
      await server.stop();
    },
  };
};

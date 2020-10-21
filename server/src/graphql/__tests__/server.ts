import { ApolloServer } from "apollo-server-express";
import { schema } from "./../../schema";
import { ApiContext } from "../../context";
import { Auth } from "../../services/auth";
import {
  MockAnalyticsService,
  MockAuth,
  MockEmailsService,
  MockRedis,
} from "./mocks";
import { createTestClient } from "apollo-server-testing";
import { Redis } from "../../services/redis";
import { KNEX } from "../../db/knex";
import Knex from "knex";
import { createContainer } from "../../container";
import { ANALYTICS, IAnalyticsService } from "../../services/analytics";
import { IRedis, REDIS } from "../../services/redis";
import { deleteAllData } from "../../util/knexUtils";
import { EmailsService } from "../../services/emails";
import { UnwrapPromise } from "../../util/types";

export type TestClient = UnwrapPromise<ReturnType<typeof initServer>>;

export const initServer = async () => {
  const container = createContainer();
  container.rebind(Auth).to(MockAuth);
  container.rebind<IRedis>(REDIS).to(MockRedis);
  container.rebind<IAnalyticsService>(ANALYTICS).to(MockAnalyticsService);
  container
    .rebind(EmailsService)
    .to(MockEmailsService as any)
    .inSingletonScope();

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
    container,
    stop: async () => {
      await knex.destroy();
      await server.stop();
    },
  };
};

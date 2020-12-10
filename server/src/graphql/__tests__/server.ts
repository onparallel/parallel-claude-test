import { ApolloServer } from "apollo-server-express";
import { schema } from "./../../schema";
import { ApiContext } from "../../context";
import { AUTH, IAuth } from "../../services/auth";
import {
  MockAnalyticsService,
  MockAuth,
  MockEmailsService,
  MockRedis,
} from "./mocks";
import { createTestClient } from "apollo-server-testing";
import { KNEX } from "../../db/knex";
import Knex from "knex";
import { createContainer } from "../../container";
import { ANALYTICS, IAnalyticsService } from "../../services/analytics";
import { IRedis, REDIS } from "../../services/redis";
import { deleteAllData } from "../../util/knexUtils";
import { EMAILS, IEmailsService } from "../../services/emails";
import { UnwrapPromise } from "../../util/types";
import { serialize as serializeCookie } from "cookie";

export type TestClient = UnwrapPromise<ReturnType<typeof initServer>>;

export const initServer = async () => {
  const container = createContainer();
  container.rebind<IAuth>(AUTH).to(MockAuth);
  container.rebind<IRedis>(REDIS).to(MockRedis);
  container.rebind<IAnalyticsService>(ANALYTICS).to(MockAnalyticsService);
  container
    .rebind<IEmailsService>(EMAILS)
    .to(MockEmailsService)
    .inSingletonScope();

  const server = new ApolloServer({
    schema,
    context: () => {
      const context = container.get<ApiContext>(ApiContext);
      context.req = {
        headers: {
          cookie: serializeCookie("parallel_session", "XXXXX"),
          "user-agent": "tests",
        },
        connection: {
          remoteAddress: "127.0.0.1",
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

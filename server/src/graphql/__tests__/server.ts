import { ApolloServer } from "apollo-server-express";
import { createTestClient } from "apollo-server-testing";
import { serialize as serializeCookie } from "cookie";
import Knex from "knex";
import { createContainer } from "../../container";
import { ApiContext } from "../../context";
import { KNEX } from "../../db/knex";
import { ANALYTICS, IAnalyticsService } from "../../services/analytics";
import { AUTH, IAuth } from "../../services/auth";
import { AWS_SERVICE, IAws } from "../../services/aws";
import { EMAILS, IEmailsService } from "../../services/emails";
import { IRedis, REDIS } from "../../services/redis";
import { deleteAllData } from "../../util/knexUtils";
import { UnwrapPromise } from "../../util/types";
import { schema } from "./../../schema";
import {
  MockAnalyticsService,
  MockAuth,
  MockAwsService,
  MockEmailsService,
  MockRedis,
} from "./mocks";

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
  container.rebind<IAws>(AWS_SERVICE).to(MockAwsService).inSingletonScope();

  const stack: any[] = [];
  const server = new ApolloServer({
    schema,
    context: () => {
      const context = container.get<ApiContext>(ApiContext);
      context.req = stack.length
        ? stack.pop()
        : ({
            headers: {
              cookie: serializeCookie("parallel_session", "XXXXX"),
            },
          } as any);
      return context;
    },
  });

  const { query, mutate } = createTestClient(server);

  const knex = container.get<Knex>(KNEX);
  await deleteAllData(knex);

  return {
    query,
    mutate,
    setNextReq(req: any) {
      stack.push(req);
    },
    container,
    async stop() {
      await knex.destroy();
      await server.stop();
    },
  };
};

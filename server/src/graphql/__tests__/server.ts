import { ApolloServer } from "apollo-server-express";
import { createTestClient } from "apollo-server-testing";
import { serialize as serializeCookie } from "cookie";
import Knex from "knex";
import { createTestContainer } from "../../../test/testContainer";
import { ApiContext } from "../../context";
import { KNEX } from "../../db/knex";
import { deleteAllData } from "../../util/knexUtils";
import { UnwrapPromise } from "../../util/types";
import { schema } from "./../../schema";

export type TestClient = UnwrapPromise<ReturnType<typeof initServer>>;

export const initServer = async () => {
  const container = createTestContainer();
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

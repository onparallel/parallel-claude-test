import { VariableValues } from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";
import { serialize as serializeCookie } from "cookie";
import { DocumentNode } from "graphql";
import { Knex } from "knex";
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
    schema: schema,
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

  const knex = container.get<Knex>(KNEX);

  return {
    async execute(query: string | DocumentNode, variables?: VariableValues) {
      return await server.executeOperation({ query, variables });
    },
    /** @deprecated use execute instead */
    async query({
      query,
      variables,
    }: {
      query: string | DocumentNode;
      variables?: VariableValues;
    }) {
      return await server.executeOperation({ query, variables });
    },
    /** @deprecated use execute instead */
    async mutate({
      mutation,
      variables,
    }: {
      mutation: string | DocumentNode;
      variables?: VariableValues;
    }) {
      return await server.executeOperation({ query: mutation, variables });
    },
    setNextReq(req: any) {
      stack.push(req);
    },
    withApiKey(key: string) {
      stack.push({
        headers: {
          authorization: `Bearer ${key}`,
        },
      });
      return this;
    },
    container,
    async stop() {
      await deleteAllData(knex);
      await knex.destroy();
      await server.stop();
    },
  };
};

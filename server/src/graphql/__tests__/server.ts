import { ApolloServer } from "@apollo/server";
import { TypedDocumentNode } from "@graphql-typed-document-node/core";
import assert from "assert";
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
  const server = new ApolloServer<ApiContext>({ schema });

  const knex = container.get<Knex>(KNEX);
  await server.start();

  return {
    async execute<TData = any, TVariables extends Record<string, any> = Record<string, any>>(
      query: string | DocumentNode | TypedDocumentNode<TData, TVariables>,
      variables?: TVariables
    ) {
      const context = container.get<ApiContext>(ApiContext);
      context.req = stack.length
        ? stack.pop()
        : ({
            headers: {
              cookie: serializeCookie("parallel_session", "XXXXX"),
            },
          } as any);
      const response = await server.executeOperation<TData, TVariables>(
        { query, variables },
        { contextValue: context }
      );
      assert(response.body.kind === "single");
      return response.body.singleResult;
    },
    /** @deprecated use execute instead */
    async query<TData = any, TVariables extends Record<string, any> = Record<string, any>>({
      query,
      variables,
    }: {
      query: string | DocumentNode | TypedDocumentNode<TData, TVariables>;
      variables?: TVariables;
    }) {
      return await this.execute<TData, TVariables>(query, variables);
    },
    /** @deprecated use execute instead */
    async mutate<TData = any, TVariables extends Record<string, any> = Record<string, any>>({
      mutation,
      variables,
    }: {
      mutation: string | DocumentNode | TypedDocumentNode<TData, TVariables>;
      variables?: TVariables;
    }) {
      return await this.execute(mutation, variables);
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

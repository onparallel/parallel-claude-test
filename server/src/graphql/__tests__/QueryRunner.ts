import { ApolloServerTestClient } from "apollo-server-testing";
import Knex from "knex";
import gql from "graphql-tag";

export type TestClient = {
  query: ApolloServerTestClient["query"];
  mutate: ApolloServerTestClient["mutate"];
  stop: () => Promise<void>;
  knex: Knex;
};

export class QueryRunner {
  private client: TestClient;
  constructor(client: TestClient) {
    this.client = client;
  }

  // query.petitions
  async petitions({
    limit,
    type,
  }: {
    limit?: number;
    type: "PETITION" | "TEMPLATE";
  }) {
    return await this.client.query({
      query: gql`
        query petitions($limit: Int, $type: PetitionBaseType) {
          petitions(limit: $limit, type: $type) {
            totalCount
            items {
              id
            }
          }
        }
      `,
      variables: { limit: limit || 100, type },
    });
  }

  // query.petition
  async petition({ petitionId }: { petitionId: string }) {
    return await this.client.query({
      query: gql`
        query petition($petitionId: GID!) {
          petition(id: $petitionId) {
            __typename
            name
            owner {
              id
              fullName
              organization {
                name
                id
              }
            }
            __typename
          }
        }
      `,
      variables: { petitionId },
    });
  }

  // query.publicTemplates
  async publicTemplates({
    limit,
    search,
  }: {
    limit?: number;
    search?: string;
  }) {
    return await this.client.query({
      query: gql`
        query publicTemplates($limit: Int, $search: String) {
          publicTemplates(limit: $limit, search: $search) {
            totalCount
          }
        }
      `,
      variables: { limit: limit || 100, search },
    });
  }

  // query.me
  async me() {
    return await this.client.query({
      query: gql`
        query {
          me {
            id
            fullName
            organization {
              identifier
            }
          }
        }
      `,
    });
  }

  // mutation.updateUser
  async updateUser({
    userId,
    firstName,
    lastName,
  }: {
    userId: string;
    firstName: string;
    lastName: string;
  }) {
    return await this.client.mutate({
      mutation: gql`
        mutation updateUser(
          $userId: GID!
          $firstName: String
          $lastName: String
        ) {
          updateUser(
            id: $userId
            data: { firstName: $firstName, lastName: $lastName }
          ) {
            id
            fullName
          }
        }
      `,
      variables: { userId, firstName, lastName },
    });
  }
}

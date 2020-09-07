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
        query($limit: Int, $type: PetitionBaseType) {
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
        query($petitionId: GID!) {
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
        query($limit: Int, $search: String) {
          publicTemplates(limit: $limit, search: $search) {
            totalCount
          }
        }
      `,
      variables: { limit: limit || 100, search },
    });
  }

  // query.publicTemplates
  // organization identifier and users is private, only users from the same org can access
  async publicTemplatesWithPrivateData() {
    return await this.client.query({
      query: gql`
        query {
          publicTemplates(limit: 100) {
            totalCount
            items {
              owner {
                organization {
                  identifier
                  users {
                    totalCount
                  }
                }
              }
            }
          }
        }
      `,
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
        mutation($userId: GID!, $firstName: String, $lastName: String) {
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

  async createPetition({
    name,
    locale,
    petitionId,
    type,
  }: {
    name?: string;
    locale?: "en" | "es";
    petitionId?: string;
    type?: "PETITION" | "TEMPLATE";
  }) {
    return await this.client.mutate({
      mutation: gql`
        mutation(
          $name: String
          $locale: PetitionLocale!
          $petitionId: GID
          $type: PetitionBaseType
        ) {
          createPetition(
            name: $name
            locale: $locale
            petitionId: $petitionId
            type: $type
          ) {
            name
            locale
            ... on PetitionTemplate {
              isPublic
            }
            fields {
              id
              isFixed
              type
            }
            __typename
          }
        }
      `,
      variables: {
        name: name || null,
        locale: locale || "en",
        petitionId,
        type,
      },
    });
  }
}

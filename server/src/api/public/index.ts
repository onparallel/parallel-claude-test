import { ClientError, gql, GraphQLClient } from "graphql-request";
import { outdent } from "outdent";
import { RestApi } from "../rest/core";
import { UnauthorizedError } from "../rest/errors";
import { idParam } from "../rest/params";
import { CreatedResponse, OkResponse } from "../rest/responses";
import { PetitionFragment } from "./fragments";
import { paginationParams, sortByParam, Success } from "./helpers";
import { PaginatedPetitions, Petition } from "./schemas";
import {
  petitionQuery,
  petitionQueryVariables,
  petitionsQuery,
  petitionsQueryVariables,
} from "./__types";

export const api = new RestApi({
  openapi: "3.0.2",
  info: {
    title: "Parallel API",
    description: outdent`
      Loren Ipsum
      # Support
      In case you need any help with your integration, please drop an email to [devs@onparallel.com](mailto:devs@onparallel.com?subject=Parallel%20API%20support). We will be pleased to help you with any problem.
    `,
    version: "1.0.0",
  },
  servers: [
    {
      url: "/api/v1",
      description: "Production server",
    },
  ],
  security: [{ API_TOKEN: [] }],
  components: {
    securitySchemes: {
      API_TOKEN: {
        type: "http",
        description:
          "Get the API token from the the API tokens section in your account settings.",
        scheme: "bearer",
      },
    },
  },
  tags: [{ name: "Petitions" }],
  context: ({ req }) => {
    const authorization = req.header("authorization");
    if (!authorization) {
      throw new UnauthorizedError("API token is missing");
    }
    return {
      client: new GraphQLClient("http://localhost/graphql", {
        headers: { authorization },
      }),
    };
  },
  errorHandler: (error: Error) => {
    if (error instanceof ClientError) {
      const code = (error.response.errors![0] as any).extensions.code as string;
      switch (code) {
        case "UNAUTHENTICATED":
          return new UnauthorizedError("API token is invalid");
        case "FORBIDDEN":
          return new UnauthorizedError(
            "You don't have access to this resource"
          );
      }
    }
    throw error;
  },
});

api
  .path("/petitions")
  .get(
    {
      summary: "Returns a paginated list of petitions",
      query: {
        ...paginationParams(),
        ...sortByParam(["createdAt", "name", "lastUsedAt"]),
      },
      responses: {
        200: Success(PaginatedPetitions),
      },
      tags: ["Petitions"],
    },
    async ({ client, query }) => {
      const result = await client.request<
        petitionsQuery,
        petitionsQueryVariables
      >(
        gql`
          query petitions(
            $offset: Int!
            $limit: Int!
            $sortBy: [QueryPetitions_OrderBy!]
          ) {
            petitions(offset: $offset, limit: $limit, sortBy: $sortBy) {
              items {
                ...Petition
              }
              totalCount
            }
          }
          ${PetitionFragment}
        `,
        query
      );
      return OkResponse(result.petitions);
    }
  )
  .post(
    {
      description: "Creates a petition",
      query: {
        fromTemplateId: idParam({
          type: "Petition",
          description: "The ID of the template to use",
        }),
      },
      body: {
        schema: Petition,
      },
      responses: {
        201: Success(Petition),
      },
      tags: ["Petitions"],
    },
    async ({ client }) => {
      return CreatedResponse({
        id: "aefa",
        name: "",
        createdAt: "fewafeaw",
      });
    }
  );

api
  .path("/petitions/:petitionId", {
    params: {
      petitionId: idParam({
        type: "Petition",
        description: "The ID of the petition",
      }),
    },
  })
  .get(
    {
      summary: "Returns the specified petition",
      responses: {
        200: Success(Petition),
      },
      tags: ["Petitions"],
    },
    async ({ client, params }) => {
      const result = await client.request<
        petitionQuery,
        petitionQueryVariables
      >(
        gql`
          query petition($petitionId: GID!) {
            petition(id: $petitionId) {
              ...Petition
            }
          }
          ${PetitionFragment}
        `,
        { petitionId: params.petitionId }
      );
      return OkResponse(result.petition!);
    }
  );

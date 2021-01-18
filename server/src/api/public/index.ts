import { ClientError, gql, GraphQLClient } from "graphql-request";
import { outdent } from "outdent";
import { RestApi } from "../rest/core";
import { UnauthorizedError } from "../rest/errors";
import { idParam } from "../rest/params";
import {
  CreatedResponse,
  NoContentResponse,
  OkResponse,
} from "../rest/responses";
import { PetitionAccessFragment, PetitionFragment } from "./fragments";
import { paginationParams, sortByParam, Success } from "./helpers";
import {
  CreatePetition,
  ListOfPetitionAccesses,
  PaginatedPetitions,
  Petition,
  PetitionAccess,
} from "./schemas";
import {
  GetPetition_PetitionQuery,
  GetPetition_PetitionQueryVariables,
  GetPetitions_PetitionsQuery,
  GetPetitions_PetitionsQueryVariables,
  templatesQuery,
  templatesQueryVariables,
  CreatePetition_PetitionMutation,
  CreatePetition_PetitionMutationVariables,
  GetPetitionRecipients_PetitionAccessesQuery,
  GetPetitionRecipients_PetitionAccessesQueryVariables,
  DeletePetition_deletePetitionsMutation,
  DeletePetition_deletePetitionsMutationVariables,
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
  tags: [{ name: "Petitions" }, { name: "Templates" }],
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
        default:
          console.log({ code, error });
      }
    }
    throw error;
  },
});

api
  .path("/petitions")
  .get(
    {
      operationId: "GetPetitions",
      summary: "Returns a paginated list of petitions",
      query: {
        ...paginationParams(),
        ...sortByParam(["createdAt", "name"]),
      },
      responses: { 200: Success(PaginatedPetitions) },
      tags: ["Petitions"],
    },
    async ({ client, query }) => {
      const result = await client.request<
        GetPetitions_PetitionsQuery,
        GetPetitions_PetitionsQueryVariables
      >(
        gql`
          query GetPetitions_Petitions(
            $offset: Int!
            $limit: Int!
            $sortBy: [QueryPetitions_OrderBy!]
          ) {
            petitions(
              offset: $offset
              limit: $limit
              sortBy: $sortBy
              type: PETITION
            ) {
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
      operationId: "CreatePetition",
      summary: "Creates a petition from a template",
      body: { schema: CreatePetition },
      responses: { 201: Success(Petition) },
      tags: ["Petitions"],
    },
    async ({ client, body }) => {
      const result = await client.request<
        CreatePetition_PetitionMutation,
        CreatePetition_PetitionMutationVariables
      >(
        gql`
          mutation CreatePetition_Petition($name: String, $templateId: GID) {
            createPetition(name: $name, petitionId: $templateId) {
              ...Petition
            }
          }
          ${PetitionFragment}
        `,
        body
      );

      return CreatedResponse(result.createPetition);
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
      operationId: "GetPetition",
      summary: "Returns the specified petition",
      responses: {
        200: Success(Petition),
      },
      tags: ["Petitions"],
    },
    async ({ client, params }) => {
      const result = await client.request<
        GetPetition_PetitionQuery,
        GetPetition_PetitionQueryVariables
      >(
        gql`
          query GetPetition_Petition($petitionId: GID!) {
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
  )
  .delete(
    {
      operationId: "DeletePetition",
      summary: "Deletes the specified petition",
      responses: {
        204: Success(),
      },
      tags: ["Petitions"],
    },
    async ({ client, params }) => {
      // TODO check force
      await client.request<
        DeletePetition_deletePetitionsMutation,
        DeletePetition_deletePetitionsMutationVariables
      >(
        gql`
          mutation DeletePetition_deletePetitions($petitionId: GID!) {
            deletePetitions(ids: [$petitionId])
          }
          ${PetitionFragment}
        `,
        { petitionId: params.petitionId }
      );
      return NoContentResponse();
    }
  );

api
  .path("/petitions/:petitionId/recipients", {
    params: {
      petitionId: idParam({
        type: "Petition",
        description: "The ID of the petition",
      }),
    },
  })
  .get(
    {
      operationId: "GetPetitionRecipients",
      summary: "Returns the recipients of this petition",
      responses: { 200: Success(ListOfPetitionAccesses) },
      tags: ["Petitions"],
    },
    async ({ client, params }) => {
      const result = await client.request<
        GetPetitionRecipients_PetitionAccessesQuery,
        GetPetitionRecipients_PetitionAccessesQueryVariables
      >(
        gql`
          query GetPetitionRecipients_PetitionAccesses($petitionId: GID!) {
            petition(id: $petitionId) {
              ... on Petition {
                accesses {
                  ...PetitionAccess
                }
              }
            }
          }
          ${PetitionAccessFragment}
        `,
        { petitionId: params.petitionId }
      );
      return OkResponse(result.petition!.accesses);
    }
  )
  .post(
    {
      summary: "Sends the specified petition to the specified recipients",
      responses: {
        200: Success(ListOfPetitionAccesses),
      },
      tags: ["Petitions"],
    },
    async ({ client, params }) => {
      // return OkResponse(null);
    }
  );

api.path("/templates").get(
  {
    operationId: "GetTemplates",
    summary: "Returns a paginated list of templates",
    query: {
      ...paginationParams(),
      ...sortByParam(["createdAt", "name", "lastUsedAt"]),
    },
    responses: {
      200: Success(PaginatedPetitions),
    },
    tags: ["Templates"],
  },
  async ({ client, query }) => {
    const result = await client.request<
      templatesQuery,
      templatesQueryVariables
    >(
      gql`
        query templates(
          $offset: Int!
          $limit: Int!
          $sortBy: [QueryPetitions_OrderBy!]
        ) {
          petitions(
            offset: $offset
            limit: $limit
            sortBy: $sortBy
            type: TEMPLATE
          ) {
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
);

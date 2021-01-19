import { ClientError, gql, GraphQLClient } from "graphql-request";
import { outdent } from "outdent";
import { RestApi } from "../rest/core";
import { UnauthorizedError } from "../rest/errors";
import { booleanParam, enumParam, idParam } from "../rest/params";
import {
  CreatedResponse,
  NoContentResponse,
  OkResponse,
} from "../rest/responses";
import {
  ContactFragment,
  PetitionAccessFragment,
  PetitionFragment,
  TemplateFragment,
} from "./fragments";
import { paginationParams, sortByParam, Success } from "./helpers";
import {
  Contact,
  CreatePetition,
  ListOfPetitionAccesses,
  PaginatedContacts,
  PaginatedPetitions,
  PaginatedTemplates,
  Petition,
  SendPetition,
  Template,
} from "./schemas";
import {
  CreatePetition_PetitionMutation,
  CreatePetition_PetitionMutationVariables,
  DeletePetition_deletePetitionsMutation,
  DeletePetition_deletePetitionsMutationVariables,
  DeleteTemplate_deletePetitionsMutation,
  DeleteTemplate_deletePetitionsMutationVariables,
  GetContacts_ContactsQuery,
  GetContacts_ContactsQueryVariables,
  GetContact_ContactQuery,
  GetContact_ContactQueryVariables,
  GetPetitionRecipients_PetitionAccessesQuery,
  GetPetitionRecipients_PetitionAccessesQueryVariables,
  GetPetitions_PetitionsQuery,
  GetPetitions_PetitionsQueryVariables,
  GetPetition_PetitionQuery,
  GetPetition_PetitionQueryVariables,
  GetTemplates_TemplatesQuery,
  GetTemplates_TemplatesQueryVariables,
  GetTemplate_TemplateQuery,
  GetTemplate_TemplateQueryVariables,
} from "./__types";
import pMap from "p-map";

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
  tags: [
    {
      name: "Petitions",
      description: "Petitions are the main entities in Parallel",
    },
    {
      name: "Templates",
      description:
        "Use templates to quickly create new petitions for repetitive workflows",
    },
    {
      name: "Contacts",
      description:
        "Contacts are the entities that represent the recipients of petitions",
    },
  ],
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
        status: enumParam({
          description: "Optionally filter petitions by their status",
          required: false,
          values: ["DRAFT", "PENDING", "COMPLETED", "CLOSED"],
        }),
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
            $status: PetitionStatus
            $sortBy: [QueryPetitions_OrderBy!]
          ) {
            petitions(
              offset: $offset
              limit: $limit
              sortBy: $sortBy
              status: $status
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

const petitionId = idParam({
  type: "Petition",
  description: "The ID of the petition",
});

api
  .path("/petitions/:petitionId", { params: { petitionId } })
  .get(
    {
      operationId: "GetPetition",
      summary: "Returns the specified petition",
      responses: { 200: Success(Petition) },
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
      query: {
        force: booleanParam({
          required: false,
          description:
            "If the petition is shared with other users this method will fail unless passing `true` to this parameter",
        }),
      },
      responses: { 204: Success() },
      tags: ["Petitions"],
    },
    async ({ client, params, query }) => {
      await client.request<
        DeletePetition_deletePetitionsMutation,
        DeletePetition_deletePetitionsMutationVariables
      >(
        gql`
          mutation DeletePetition_deletePetitions(
            $petitionId: GID!
            $force: Boolean!
          ) {
            deletePetitions(ids: [$petitionId], force: $force)
          }
          ${PetitionFragment}
        `,
        { petitionId: params.petitionId, force: query.force ?? false }
      );
      return NoContentResponse();
    }
  );

api
  .path("/petitions/:petitionId/recipients", { params: { petitionId } })
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
      body: {
        schema: SendPetition,
      },
      responses: { 200: Success(ListOfPetitionAccesses) },
      deprecated: true,
      tags: ["Petitions"],
    },
    async ({ client, params, body }) => {
      const contactIds = pMap(body.contacts, async (item) => {}, {
        concurrency: 3,
      });
      return OkResponse([]);
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
    responses: { 200: Success(PaginatedTemplates) },
    tags: ["Templates"],
  },
  async ({ client, query }) => {
    const result = await client.request<
      GetTemplates_TemplatesQuery,
      GetTemplates_TemplatesQueryVariables
    >(
      gql`
        query GetTemplates_Templates(
          $offset: Int!
          $limit: Int!
          $sortBy: [QueryPetitions_OrderBy!]
        ) {
          templates: petitions(
            offset: $offset
            limit: $limit
            sortBy: $sortBy
            type: TEMPLATE
          ) {
            items {
              ...Template
            }
            totalCount
          }
        }
        ${TemplateFragment}
      `,
      query
    );
    return OkResponse(result.templates);
  }
);

api
  .path("/templates/:templateId", {
    params: {
      templateId: idParam({
        type: "Petition",
        description: "The ID of the template",
      }),
    },
  })
  .get(
    {
      operationId: "GetTemplate",
      summary: "Returns the specified template",
      responses: { 200: Success(Template) },
      tags: ["Templates"],
    },
    async ({ client, params }) => {
      const result = await client.request<
        GetTemplate_TemplateQuery,
        GetTemplate_TemplateQueryVariables
      >(
        gql`
          query GetTemplate_Template($templateId: GID!) {
            template: petition(id: $templateId) {
              ...Template
            }
          }
          ${TemplateFragment}
        `,
        { templateId: params.templateId }
      );
      return OkResponse(result.template!);
    }
  )
  .delete(
    {
      operationId: "DeleteTemplate",
      summary: "Deletes the specified template",
      query: {
        force: booleanParam({
          required: false,
          description:
            "If the template is shared with other users this method will fail unless passing `true` to this parameter",
        }),
      },
      responses: { 204: Success() },
      tags: ["Templates"],
    },
    async ({ client, params, query }) => {
      await client.request<
        DeleteTemplate_deletePetitionsMutation,
        DeleteTemplate_deletePetitionsMutationVariables
      >(
        gql`
          mutation DeleteTemplate_deletePetitions(
            $templateId: GID!
            $force: Boolean!
          ) {
            deletePetitions(ids: [$templateId], force: $force)
          }
          ${PetitionFragment}
        `,
        { templateId: params.templateId, force: query.force ?? false }
      );
      return NoContentResponse();
    }
  );

api.path("/contacts").get(
  {
    operationId: "GetContact",
    summary: "Returns a paginated list of contacts",
    query: {
      ...paginationParams(),
      ...sortByParam([
        "firstName",
        "lastName",
        "fullName",
        "email",
        "createdAt",
      ]),
    },
    responses: { 200: Success(PaginatedContacts) },
    tags: ["Contacts"],
  },
  async ({ client, query }) => {
    const result = await client.request<
      GetContacts_ContactsQuery,
      GetContacts_ContactsQueryVariables
    >(
      gql`
        query GetContacts_Contacts(
          $offset: Int!
          $limit: Int!
          $sortBy: [QueryContacts_OrderBy!]
        ) {
          contacts(offset: $offset, limit: $limit, sortBy: $sortBy) {
            items {
              ...Contact
            }
            totalCount
          }
        }
        ${ContactFragment}
      `,
      query
    );
    return OkResponse(result.contacts);
  }
);

api
  .path("/contacts/:contactId", {
    params: {
      contactId: idParam({
        type: "Contact",
        description: "The ID of the contact",
      }),
    },
  })
  .get(
    {
      operationId: "GetContact",
      summary: "Returns the specified contact",
      responses: { 200: Success(Contact) },
      tags: ["Contacts"],
    },
    async ({ client, params }) => {
      const result = await client.request<
        GetContact_ContactQuery,
        GetContact_ContactQueryVariables
      >(
        gql`
          query GetContact_Contact($contactId: GID!) {
            contact(id: $contactId) {
              ...Contact
            }
          }
          ${ContactFragment}
        `,
        { contactId: params.contactId }
      );
      return OkResponse(result.contact!);
    }
  );

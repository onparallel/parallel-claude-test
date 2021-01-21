import { ClientError, gql, GraphQLClient } from "graphql-request";
import { outdent } from "outdent";
import pMap from "p-map";
import { pick } from "remeda";
import { toGlobalId } from "../../util/globalId";
import { JsonBody } from "../rest/body";
import { RestApi } from "../rest/core";
import { ConflictError, UnauthorizedError } from "../rest/errors";
import { booleanParam, enumParam, idParam } from "../rest/params";
import {
  Created,
  ErrorResponse,
  NoContent,
  Ok,
  SuccessResponse,
} from "../rest/responses";
import {
  ContactFragment,
  PetitionAccessFragment,
  PetitionFragment,
  TemplateFragment,
} from "./fragments";
import { paginationParams, sortByParam } from "./helpers";
import {
  Contact,
  CreateContact,
  CreatePetition,
  ListOfPetitionAccesses,
  PaginatedContacts,
  PaginatedPetitions,
  PaginatedTemplates,
  Petition,
  SendPetition,
  Template,
  UpdatePetition,
} from "./schemas";
import {
  CreateContact_ContactMutation,
  CreateContact_ContactMutationVariables,
  CreatePetitionRecipients_ContactQuery,
  CreatePetitionRecipients_ContactQueryVariables,
  CreatePetitionRecipients_createContactMutation,
  CreatePetitionRecipients_createContactMutationVariables,
  CreatePetitionRecipients_sendPetitionMutation,
  CreatePetitionRecipients_sendPetitionMutationVariables,
  CreatePetitionRecipients_updateContactMutation,
  CreatePetitionRecipients_updateContactMutationVariables,
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
  UpdatePetition_PetitionMutation,
  UpdatePetition_PetitionMutationVariables,
} from "./__types";

export const api = new RestApi({
  openapi: "3.0.2",
  info: {
    title: "Parallel API",
    description: outdent`
      ## Introduction
      Loren Ipsum
      
      ## Authentication
      In order to authenticate your requests, first, you need generate a token
      on the [API tokens](https://www.parallel.so/en/app/settings/tokens)
      section of your account settings.

      When you make any requests to the Parallel API pass the generated token
      in the \`Authorization\` header as follows:
      ~~~
      Authorization: Bearer QrUV6NYDk2KcXg96KrHCQTTuKyt5oU8ETHueF5awWZe6
      ~~~
      <SecurityDefinitions />

      ## Support
      In case you need any help with your integration, please drop an email to
      [devs@onparallel.com](mailto:devs@onparallel.com?subject=Parallel%20API%20support).
      We will be pleased to help you with any problem.
    `,
    version: "1.0.0",
    contact: {
      name: "API Support",
      email: "devs@onparallel.com",
      url: "https://www.parallel.so/developers/api",
    },
    "x-logo": {
      url: "https://www.parallel.so/static/emails/logo.png",
      altText: "Parallel",
      href: "https://www.parallel.so",
    },
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
        scheme: "bearer",
      },
    },
  },
  "x-tagGroups": [
    { name: "Endpoints", tags: ["Petitions", "Templates", "Contacts"] },
  ],
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
          throw new UnauthorizedError("API token is invalid");
        case "FORBIDDEN":
          throw new UnauthorizedError("You don't have access to this resource");
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
      summary: "Get petitions list",
      description: outdent`
        This endpoint returns a paginated list of all petitions the user has
        access to.
      `,
      query: {
        ...paginationParams(),
        ...sortByParam(["createdAt", "name"]),
        status: enumParam({
          description: "Optionally filter petitions by their status",
          required: false,
          values: ["DRAFT", "PENDING", "COMPLETED", "CLOSED"],
        }),
      },
      responses: { 200: SuccessResponse(PaginatedPetitions) },
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
      return Ok(result.petitions);
    }
  )
  .post(
    {
      operationId: "CreatePetition",
      summary: "Create petition",
      body: JsonBody(CreatePetition),
      responses: { 201: SuccessResponse(Petition) },
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

      return Created(result.createPetition);
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
      summary: "Get petition",
      responses: { 200: SuccessResponse(Petition) },
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
      return Ok(result.petition!);
    }
  )
  .put(
    {
      operationId: "UpdatePetition",
      summary: "Update petition",
      body: JsonBody(UpdatePetition),
      responses: { 200: SuccessResponse(Petition) },
      tags: ["Petitions"],
    },
    async ({ client, params, body }) => {
      const result = await client.request<
        UpdatePetition_PetitionMutation,
        UpdatePetition_PetitionMutationVariables
      >(
        gql`
          mutation UpdatePetition_Petition(
            $petitionId: GID!
            $data: UpdatePetitionInput!
          ) {
            updatePetition(petitionId: $petitionId, data: $data) {
              ...Petition
            }
          }
          ${PetitionFragment}
        `,
        { petitionId: params.petitionId, data: body }
      );
      return Ok(result.updatePetition!);
    }
  )
  .delete(
    {
      operationId: "DeletePetition",
      summary: "Delete petition",
      query: {
        force: booleanParam({
          required: false,
          description:
            "If the petition is shared with other users this method will fail unless passing `true` to this parameter",
        }),
      },
      responses: { 204: SuccessResponse() },
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
      return NoContent();
    }
  );

api
  .path("/petitions/:petitionId/recipients", { params: { petitionId } })
  .get(
    {
      operationId: "GetPetitionRecipients",
      summary: "Get petition recipients",
      responses: { 200: SuccessResponse(ListOfPetitionAccesses) },
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
      return Ok(result.petition!.accesses);
    }
  )
  .post(
    {
      operationId: "CreatePetitionRecipients",
      summary: "Send petition",
      description: outdent`
        Use this endpoint to send a petition. You can send a petition to
        multiple people at once so they can fill the petition
        collaboratively.
  
        There are two ways of specifying the recipients of the petition.
  
        One way is to pass a list of contact IDs if you know them beforehand:
        ~~~json
        {
          ...
          "contacts": [
            "${toGlobalId("Contact", 12)}",
            "${toGlobalId("Contact", 13)}"
          ]
          ...
        }
        ~~~ 
        The other way is passing an object with the information needed to
        create a contact. If the contact already exists it will also be updated
        with the information provided.
        ~~~json
        {
          ...
          "contacts": [
            {
              "email": "tyrion@casterlyrock.wes",
              "firstName": "Tyrion",
              "lastName": "Lannister"
            }
          ]
          ...
        }
        ~~~
        The two methods can also be mixed if necessary.
      `,
      body: JsonBody(SendPetition),
      responses: { 200: SuccessResponse(ListOfPetitionAccesses) },
      tags: ["Petitions"],
    },
    async ({ client, params, body }) => {
      const contactIds = await pMap(
        body.contacts,
        async (item) => {
          if (typeof item === "string") {
            return item;
          } else {
            const { email, ...data } = item;
            const { contact } = await client.request<
              CreatePetitionRecipients_ContactQuery,
              CreatePetitionRecipients_ContactQueryVariables
            >(
              gql`
                query CreatePetitionRecipients_Contact($email: String!) {
                  contact: contactByEmail(email: $email) {
                    id
                    firstName
                    lastName
                  }
                }
              `,
              { email }
            );
            if (contact) {
              if (
                contact.firstName !== data.firstName ||
                contact.lastName !== data.lastName
              ) {
                await client.request<
                  CreatePetitionRecipients_updateContactMutation,
                  CreatePetitionRecipients_updateContactMutationVariables
                >(
                  gql`
                    mutation CreatePetitionRecipients_updateContact(
                      $contactId: GID!
                      $data: UpdateContactInput!
                    ) {
                      updateContact(id: $contactId, data: $data) {
                        id
                      }
                    }
                  `,
                  { contactId: contact.id, data }
                );
              }
              return contact.id;
            } else {
              const result = await client.request<
                CreatePetitionRecipients_createContactMutation,
                CreatePetitionRecipients_createContactMutationVariables
              >(
                gql`
                  mutation CreatePetitionRecipients_createContact(
                    $data: CreateContactInput!
                  ) {
                    createContact(data: $data) {
                      id
                    }
                  }
                `,
                { data: item }
              );
              return result.createContact.id;
            }
          }
        },
        { concurrency: 3 }
      );
      const message =
        body.message.format === "PLAIN_TEXT"
          ? body.message.content
              .split("\n")
              .map((line) => ({ children: [{ text: line }] }))
          : [{ children: [{ text: "" }] }];

      const result = await client.request<
        CreatePetitionRecipients_sendPetitionMutation,
        CreatePetitionRecipients_sendPetitionMutationVariables
      >(
        gql`
          mutation CreatePetitionRecipients_sendPetition(
            $petitionId: GID!
            $contactIds: [GID!]!
            $subject: String!
            $body: JSON!
            $scheduledAt: DateTime
            $remindersConfig: RemindersConfigInput
          ) {
            sendPetition(
              petitionId: $petitionId
              contactIds: $contactIds
              subject: $subject
              body: $body
              scheduledAt: $scheduledAt
              remindersConfig: $remindersConfig
            ) {
              accesses {
                ...PetitionAccess
              }
            }
          }
          ${PetitionAccessFragment}
        `,
        {
          petitionId: params.petitionId,
          contactIds,
          body: message,
          ...pick(body, ["subject", "remindersConfig", "scheduledAt"]),
        }
      );
      return Ok(result.sendPetition.accesses!);
    }
  );

api.path("/templates").get(
  {
    operationId: "GetTemplates",
    summary: "Get templates list",
    query: {
      ...paginationParams(),
      ...sortByParam(["createdAt", "name", "lastUsedAt"]),
    },
    responses: { 200: SuccessResponse(PaginatedTemplates) },
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
    return Ok(result.templates);
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
      summary: "Get template",
      responses: { 200: SuccessResponse(Template) },
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
      return Ok(result.template!);
    }
  )
  .delete(
    {
      operationId: "DeleteTemplate",
      summary: "Delete template",
      query: {
        force: booleanParam({
          required: false,
          description:
            "If the template is shared with other users this method will fail unless passing `true` to this parameter",
        }),
      },
      responses: { 204: SuccessResponse() },
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
      return NoContent();
    }
  );

api
  .path("/contacts")
  .get(
    {
      operationId: "GetContacts",
      summary: "Get contacts list",
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
      responses: { 200: SuccessResponse(PaginatedContacts) },
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
      return Ok(result.contacts);
    }
  )
  .post(
    {
      operationId: "CreateContact",
      summary: "Create contact",
      body: JsonBody(CreateContact),
      responses: {
        201: SuccessResponse(Contact),
        409: ErrorResponse({
          description: "A contact with this email already exists",
        }),
      },
      tags: ["Contacts"],
    },
    async ({ client, body }) => {
      try {
        const result = await client.request<
          CreateContact_ContactMutation,
          CreateContact_ContactMutationVariables
        >(
          gql`
            mutation CreateContact_Contact($data: CreateContactInput!) {
              createContact(data: $data) {
                ...Contact
              }
            }
            ${ContactFragment}
          `,
          { data: body }
        );
        return Created(result.createContact!);
      } catch (error) {
        if (error instanceof ClientError) {
          const code = (error.response.errors![0] as any).extensions
            .code as string;
          if (code === "EXISTING_CONTACT") {
            throw new ConflictError("A contact with this email already exists");
          }
        }
        throw error;
      }
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
      summary: "Get contact",
      responses: { 200: SuccessResponse(Contact) },
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
      return Ok(result.contact!);
    }
  );

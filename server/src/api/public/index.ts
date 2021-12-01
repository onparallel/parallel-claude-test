import { ClientError, gql, GraphQLClient } from "graphql-request";
import { outdent } from "outdent";
import pMap from "p-map";
import { isDefined, pick } from "remeda";
import { toGlobalId } from "../../util/globalId";
import { JsonBody } from "../rest/body";
import { RestApi } from "../rest/core";
import { BadRequestError, ConflictError, UnauthorizedError } from "../rest/errors";
import { booleanParam, enumParam, stringParam } from "../rest/params";
import {
  Created,
  ErrorResponse,
  NoContent,
  Ok,
  Redirect,
  RedirectResponse,
  SuccessResponse,
} from "../rest/responses";
import { description } from "./description";
import {
  ContactFragment,
  PermissionFragment,
  PetitionAccessFragment,
  PetitionFieldFragment,
  PetitionFragment,
  PetitionReplyFragment,
  SubscriptionFragment,
  TemplateFragment,
  UserFragment,
} from "./fragments";
import { containsGraphQLError, idParam, paginationParams, sortByParam } from "./helpers";
import {
  AnyPetitionEvent,
  Contact,
  CreateContact,
  CreateOrUpdateCustomProperty,
  CreatePetition,
  CreateSubscription,
  ListOfPermissions,
  ListOfPetitionAccesses,
  ListOfPetitionFieldsWithReplies,
  ListOfSubscriptions,
  PaginatedContacts,
  PaginatedPetitions,
  PaginatedTemplates,
  PaginatedUsers,
  Petition,
  PetitionCustomProperties,
  SendPetition,
  SharePetition,
  Subscription,
  Template,
  UpdatePetition,
} from "./schemas";
import {
  CreateContact_ContactDocument,
  CreateOrUpdateCustomProperty_modifyPetitionCustomPropertyDocument,
  CreatePetitionRecipients_ContactDocument,
  CreatePetitionRecipients_createContactDocument,
  CreatePetitionRecipients_sendPetitionDocument,
  CreatePetitionRecipients_updateContactDocument,
  CreatePetition_PetitionDocument,
  DeleteCustomProperty_modifyPetitionCustomPropertyDocument,
  DeletePetition_deletePetitionsDocument,
  DeleteTemplate_deletePetitionsDocument,
  DownloadFileReply_fileUploadReplyDownloadLinkDocument,
  EventSubscriptions_CreateSubscriptionDocument,
  EventSubscriptions_DeleteSubscriptionDocument,
  EventSubscriptions_GetSubscriptionsDocument,
  GetContacts_ContactsDocument,
  GetContact_ContactDocument,
  GetOrganizationUsers_UsersDocument,
  GetPermissions_PermissionsDocument,
  GetPetitionRecipients_PetitionAccessesDocument,
  GetPetitions_PetitionsDocument,
  GetPetition_PetitionDocument,
  GetTemplates_TemplatesDocument,
  GetTemplate_TemplateDocument,
  PetitionFragment as PetitionFragmentType,
  PetitionReplies_RepliesDocument,
  ReadPetitionCustomPropertiesDocument,
  RemoveUserGroupPermission_removePetitionPermissionDocument,
  RemoveUserPermission_removePetitionPermissionDocument,
  SharePetition_addPetitionPermissionDocument,
  StopSharing_removePetitionPermissionDocument,
  TemplateFragment as TemplateFragmentType,
  TransferPetition_transferPetitionOwnershipDocument,
  UpdatePetition_PetitionDocument,
} from "./__types";

function assert(condition: any): asserts condition {}
function assertType<T>(value: any): asserts value is T {}

export const api = new RestApi({
  openapi: "3.0.2",
  info: {
    title: "Parallel API",
    description,
    version: "1.0.0",
    contact: {
      name: "API Support",
      email: "devs@onparallel.com",
      url: "https://www.onparallel.com/developers/api",
    },
    "x-logo": {
      url: "https://www.onparallel.com/static/emails/logo.png",
      altText: "Parallel",
      href: "https://www.onparallel.com",
    },
  },
  servers: [
    {
      url: "https://www.onparallel.com/api/v1",
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
    schemas: {
      PetitionEvent: AnyPetitionEvent,
    },
  },
  "x-tagGroups": [
    {
      name: "Endpoints",
      tags: ["Petitions", "Petition Sharing", "Templates", "Contacts", "Users", "Subscriptions"],
    },
    { name: "Events", tags: ["Petition Event"] },
  ],
  tags: [
    {
      name: "Petitions",
      description: "Petitions are the main entities in Parallel",
    },
    {
      name: "Petition Sharing",
      description: "Share your petitions with members of your organization for collaborative work",
    },
    {
      name: "Templates",
      description: "Use templates to quickly create new petitions for repetitive workflows",
    },
    {
      name: "Contacts",
      description: "Contacts are the entities that represent the recipients of petitions",
    },

    {
      name: "Users",
      description: "Users are members of your organization",
    },
    {
      name: "Subscriptions",
      description: "Subscribe to our events to get real time updates on your petitions",
    },
    {
      name: "Petition Event",
      description: '<SchemaDefinition schemaRef="#/components/schemas/PetitionEvent" />',
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
    if (error instanceof ClientError && error.response.errors?.[0]) {
      const code = (error.response.errors[0] as any)?.extensions?.code as string;
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
        Returns a paginated list of all petitions the user has access to.
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
      const _query = gql`
        query GetPetitions_Petitions(
          $offset: Int!
          $limit: Int!
          $status: [PetitionStatus!]
          $sortBy: [QueryPetitions_OrderBy!]
        ) {
          petitions(
            offset: $offset
            limit: $limit
            sortBy: $sortBy
            filters: { status: $status, type: PETITION }
          ) {
            items {
              ...Petition
            }
            totalCount
          }
        }
        ${PetitionFragment}
      `;
      const result = await client.request(GetPetitions_PetitionsDocument, query);
      const { items, totalCount } = result.petitions;
      assertType<PetitionFragmentType[]>(items);
      return Ok({ items, totalCount });
    }
  )
  .post(
    {
      operationId: "CreatePetition",
      summary: "Create petition",
      description: outdent`Create a new petition based on a template.`,
      body: JsonBody(CreatePetition),
      responses: { 201: SuccessResponse(Petition) },
      tags: ["Petitions"],
    },
    async ({ client, body }) => {
      const _mutation = gql`
        mutation CreatePetition_Petition($name: String, $templateId: GID) {
          createPetition(name: $name, petitionId: $templateId) {
            ...Petition
          }
        }
        ${PetitionFragment}
      `;
      const result = await client.request(CreatePetition_PetitionDocument, body);
      assert("id" in result.createPetition);
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
      description: outdent`
        Returns the specified petition.
      `,
      responses: { 200: SuccessResponse(Petition) },
      tags: ["Petitions"],
    },
    async ({ client, params }) => {
      const _query = gql`
        query GetPetition_Petition($petitionId: GID!) {
          petition(id: $petitionId) {
            ...Petition
          }
        }
        ${PetitionFragment}
      `;
      const result = await client.request(GetPetition_PetitionDocument, {
        petitionId: params.petitionId,
      });
      assert("id" in result.petition!);
      return Ok(result.petition!);
    }
  )
  .put(
    {
      operationId: "UpdatePetition",
      summary: "Update petition",
      description: outdent`
        Update the specified petition.
      `,
      body: JsonBody(UpdatePetition),
      responses: { 200: SuccessResponse(Petition) },
      tags: ["Petitions"],
    },
    async ({ client, params, body }) => {
      const _mutation = gql`
        mutation UpdatePetition_Petition($petitionId: GID!, $data: UpdatePetitionInput!) {
          updatePetition(petitionId: $petitionId, data: $data) {
            ...Petition
          }
        }
        ${PetitionFragment}
      `;
      const result = await client.request(UpdatePetition_PetitionDocument, {
        petitionId: params.petitionId,
        data: body,
      });
      assert("id" in result.updatePetition!);
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
          description: outdent`
            If the petition is shared with other users this method will fail
            unless passing \`true\` to this parameter
          `,
        }),
      },
      description: outdent`
        Delete the specified petition.

        If the petition is shared with other users this method will fail unless
        passing \`true\` to the \`force\` parameter"
      `,
      responses: {
        204: SuccessResponse(),
        400: ErrorResponse({
          description: "The petition is being shared with another user. Set force=true to delete.",
        }),
      },
      tags: ["Petitions"],
    },
    async ({ client, params, query }) => {
      try {
        const _mutation = gql`
          mutation DeletePetition_deletePetitions($petitionId: GID!, $force: Boolean!) {
            deletePetitions(ids: [$petitionId], force: $force)
          }
        `;
        await client.request(DeletePetition_deletePetitionsDocument, {
          petitionId: params.petitionId,
          force: query.force ?? false,
        });
        return NoContent();
      } catch (error: any) {
        if (
          error instanceof ClientError &&
          containsGraphQLError(error, "DELETE_SHARED_PETITION_ERROR")
        ) {
          throw new BadRequestError(
            "The petition is being shared with another user. Set force=true to delete."
          );
        }
        throw error;
      }
    }
  );

api
  .path("/petitions/:petitionId/properties", {
    params: { petitionId },
  })
  .get(
    {
      operationId: "ReadPetitionCustomProperties",
      summary: "Returns a key-value object with the custom properties of the petition",
      responses: {
        200: SuccessResponse(PetitionCustomProperties),
      },
      tags: ["Petitions"],
    },
    async ({ client, params }) => {
      const _query = gql`
        query ReadPetitionCustomProperties($petitionId: GID!) {
          petition(id: $petitionId) {
            id
            customProperties
          }
        }
      `;
      const result = await client.request(ReadPetitionCustomPropertiesDocument, {
        petitionId: params.petitionId,
      });

      return Ok(result.petition!.customProperties);
    }
  )
  .post(
    {
      operationId: "CreateOrUpdateCustomProperty",
      summary: "Create or update a custom property",
      description: outdent`
        Creates or updates a custom property on the petition.

        If the provided key already exists as a property, its value is overwritten.
        If the provided key doesn't exist, it's added.

        The petition can have up to 20 different properties.
      `,
      body: JsonBody(CreateOrUpdateCustomProperty),
      responses: {
        200: SuccessResponse(PetitionCustomProperties),
        409: ErrorResponse({
          description: "You reached the maximum limit of custom properties on the petition",
        }),
      },
      tags: ["Petitions"],
    },
    async ({ client, body, params }) => {
      try {
        const _mutation = gql`
          mutation CreateOrUpdateCustomProperty_modifyPetitionCustomProperty(
            $petitionId: GID!
            $key: String!
            $value: String
          ) {
            modifyPetitionCustomProperty(petitionId: $petitionId, key: $key, value: $value) {
              customProperties
            }
          }
        `;
        const result = await client.request(
          CreateOrUpdateCustomProperty_modifyPetitionCustomPropertyDocument,
          { petitionId: params.petitionId, key: body.key, value: body.value }
        );
        return Ok(result.modifyPetitionCustomProperty.customProperties);
      } catch (error: any) {
        if (
          error instanceof ClientError &&
          containsGraphQLError(error, "CUSTOM_PROPERTIES_LIMIT_ERROR")
        ) {
          throw new ConflictError(
            "You reached the maximum limit of custom properties on the petition."
          );
        }
        throw error;
      }
    }
  );

api
  .path("/petitions/:petitionId/properties/:key", {
    params: { petitionId, key: stringParam({ required: true, maxLength: 100 }) },
  })
  .delete(
    {
      operationId: "DeleteCustomProperty",
      summary: "Deletes a custom property",
      description: outdent`
      Removes the provided key from the custom properties of the petition.
    `,
      responses: { 204: SuccessResponse() },
      tags: ["Petitions"],
    },
    async ({ client, params }) => {
      const _mutation = gql`
        mutation DeleteCustomProperty_modifyPetitionCustomProperty(
          $petitionId: GID!
          $key: String!
        ) {
          modifyPetitionCustomProperty(petitionId: $petitionId, key: $key) {
            id
          }
        }
      `;
      await client.request(DeleteCustomProperty_modifyPetitionCustomPropertyDocument, params);

      return NoContent();
    }
  );

api
  .path("/petitions/:petitionId/recipients", { params: { petitionId } })
  .get(
    {
      operationId: "GetPetitionRecipients",
      summary: "Get petition recipients",
      description: outdent`
        Returns the list of recipients this petition has been sent to.
      `,
      responses: { 200: SuccessResponse(ListOfPetitionAccesses) },
      tags: ["Petitions"],
    },
    async ({ client, params }) => {
      const _query = gql`
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
      `;
      const result = await client.request(GetPetitionRecipients_PetitionAccessesDocument, {
        petitionId: params.petitionId,
      });
      assert("accesses" in result.petition!);
      return Ok(result.petition!.accesses);
    }
  )
  .post(
    {
      operationId: "CreatePetitionRecipients",
      summary: "Send petition",
      description: outdent`
        Send a petition to a contact. You can send a petition to multiple
        people at once so they can fill the petition collaboratively.
  
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
        The two options can also be mixed if necessary.
      `,
      body: JsonBody(SendPetition),
      responses: {
        200: SuccessResponse(ListOfPetitionAccesses),
        409: ErrorResponse({
          description: "The petition was already sent to some of the provided contacts",
        }),
      },
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
            const _query = gql`
              query CreatePetitionRecipients_Contact($email: String!) {
                contacts: contactsByEmail(emails: [$email]) {
                  id
                  firstName
                  lastName
                }
              }
            `;
            const result = await client.request(CreatePetitionRecipients_ContactDocument, {
              email,
            });
            const contact = result.contacts[0];
            if (contact) {
              if (
                (contact.firstName !== data.firstName && isDefined(data.firstName)) ||
                (contact.lastName !== data.lastName && isDefined(data.lastName))
              ) {
                const _mutation = gql`
                  mutation CreatePetitionRecipients_updateContact(
                    $contactId: GID!
                    $data: UpdateContactInput!
                  ) {
                    updateContact(id: $contactId, data: $data) {
                      id
                    }
                  }
                `;
                await client.request(CreatePetitionRecipients_updateContactDocument, {
                  contactId: contact.id,
                  data,
                });
              }
              return contact.id;
            } else {
              const _mutation = gql`
                mutation CreatePetitionRecipients_createContact($data: CreateContactInput!) {
                  createContact(data: $data) {
                    id
                  }
                }
              `;
              const result = await client.request(CreatePetitionRecipients_createContactDocument, {
                data: item,
              });
              return result.createContact.id;
            }
          }
        },
        { concurrency: 3 }
      );
      const message =
        body.message.format === "PLAIN_TEXT"
          ? body.message.content.split("\n").map((line) => ({ children: [{ text: line }] }))
          : [{ children: [{ text: "" }] }];
      try {
        const _mutation = gql`
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
        `;
        const result = await client.request(CreatePetitionRecipients_sendPetitionDocument, {
          petitionId: params.petitionId,
          contactIds,
          body: message,
          ...pick(body, ["subject", "remindersConfig", "scheduledAt"]),
        });
        return Ok(result.sendPetition.accesses!);
      } catch (error: any) {
        if (
          error instanceof ClientError &&
          containsGraphQLError(error, "PETITION_ALREADY_SENT_ERROR")
        ) {
          throw new ConflictError("The petition was already sent to some of the provided contacts");
        }
        throw error;
      }
    }
  );

api.path("/petitions/:petitionId/fields", { params: { petitionId } }).get(
  {
    operationId: "PetitionFields",
    summary: "List petition replies",
    description: outdent`
      Returns a list of the petition fields with their submitted replies.
    `,
    tags: ["Petitions"],
    responses: {
      200: SuccessResponse(ListOfPetitionFieldsWithReplies),
    },
  },
  async ({ client, params }) => {
    const _query = gql`
      query PetitionReplies_Replies($petitionId: GID!) {
        petition(id: $petitionId) {
          fields {
            ...PetitionField
            replies {
              ...PetitionFieldReply
            }
          }
        }
      }
      ${PetitionFieldFragment}
      ${PetitionReplyFragment}
    `;
    const result = await client.request(PetitionReplies_RepliesDocument, {
      petitionId: params.petitionId,
    });

    return Ok(
      result.petition!.fields.map((field) => ({
        ...field,
        replies: field.replies.map((reply) => ({
          ...reply,
          content:
            field.type === "FILE_UPLOAD"
              ? (reply.content as {
                  filename: string;
                  contentType: string;
                  size: number;
                })
              : field.type === "DYNAMIC_SELECT"
              ? (reply.content.columns as [string, string][])
              : field.type === "CHECKBOX"
              ? (reply.content.choices as string[])
              : (reply.content.text as string),
        })),
      }))
    );
  }
);

const replyId = idParam({
  type: "PetitionFieldReply",
  description: "The ID of the reply",
});

api
  .path("/petitions/:petitionId/replies/:replyId/download", {
    params: { petitionId, replyId },
  })
  .get(
    {
      operationId: "DownloadFileReply",
      summary: "Download a reply",
      description: outdent`
        Download the uploaded file.

        ### Important
        Note that *there will be a redirect* to a temporary download endpoint on
        AWS S3 so make sure to configure your HTTP client to follow redirects.

        For example if you were to use curl you would need to provide the
        \`-L\` flag, e.g.:

        ~~~bash
        curl -s -L -XGET \\
          -H 'Authorization: Bearer <your API token>' \\
          'http://www.onparallel.com/api/v1/petitions/{petitionId}/replies/{replyId}/download' \\
          > image.png
        ~~~
      `,
      tags: ["Petitions"],
      responses: {
        302: RedirectResponse("Redirect to the resource on AWS S3"),
        400: ErrorResponse({
          description: `Reply {replyId} is not of "FILE" type`,
        }),
      },
    },
    async ({ client, params }) => {
      try {
        const _mutation = gql`
          mutation DownloadFileReply_fileUploadReplyDownloadLink(
            $petitionId: GID!
            $replyId: GID!
          ) {
            fileUploadReplyDownloadLink(petitionId: $petitionId, replyId: $replyId) {
              url
            }
          }
        `;
        const result = await client.request(
          DownloadFileReply_fileUploadReplyDownloadLinkDocument,
          params
        );
        return Redirect(result.fileUploadReplyDownloadLink.url!);
      } catch (error: any) {
        if (error instanceof ClientError && containsGraphQLError(error, "INVALID_FIELD_TYPE")) {
          throw new BadRequestError(`Reply "${params.replyId}" is not of "FILE" type`);
        }
        throw error;
      }
    }
  );

api
  .path("/petitions/:petitionId/permissions", { params: { petitionId } })
  .get(
    {
      operationId: "GetPermissions",
      summary: "Get permissions list",
      description: outdent`
        Return a list of users this petition is shared with.
      `,
      responses: { 200: SuccessResponse(ListOfPermissions) },
      tags: ["Petition Sharing"],
    },
    async ({ client, params }) => {
      const _query = gql`
        query GetPermissions_Permissions($petitionId: GID!) {
          petition(id: $petitionId) {
            permissions {
              ...Permission
            }
          }
        }
        ${PermissionFragment}
      `;
      const result = await client.request(GetPermissions_PermissionsDocument, params);

      return Ok(result.petition!.permissions);
    }
  )
  .post(
    {
      operationId: "SharePetition",
      summary: "Share the petition",
      description: outdent`
        Share the specified petition with users and groups from your organization, giving them \`WRITE\` permissions.
      `,
      body: JsonBody(SharePetition),
      responses: {
        201: SuccessResponse(ListOfPermissions),
      },
      tags: ["Petition Sharing"],
    },
    async ({ client, params, body }) => {
      const _mutation = gql`
        mutation SharePetition_addPetitionPermission(
          $petitionId: GID!
          $userIds: [GID!]
          $userGroupIds: [GID!]
        ) {
          addPetitionPermission(
            petitionIds: [$petitionId]
            userIds: $userIds
            userGroupIds: $userGroupIds
            permissionType: WRITE
          ) {
            permissions {
              ...Permission
            }
          }
        }
        ${PermissionFragment}
      `;
      const result = await client.request(SharePetition_addPetitionPermissionDocument, {
        petitionId: params.petitionId,
        userIds: body.userIds,
        userGroupIds: body.userGroupIds,
      });

      return Ok(result.addPetitionPermission[0].permissions);
    }
  )
  .delete(
    {
      operationId: "StopSharing",
      summary: "Stop sharing the petition",
      description: outdent`
        Stop sharing the specified petition.
      `,
      tags: ["Petition Sharing"],
      responses: { 204: SuccessResponse() },
    },
    async ({ client, params }) => {
      const _mutation = gql`
        mutation StopSharing_removePetitionPermission($petitionId: GID!) {
          removePetitionPermission(petitionIds: [$petitionId], removeAll: true) {
            id
          }
        }
      `;
      await client.request(StopSharing_removePetitionPermissionDocument, {
        petitionId: params.petitionId,
      });
      return NoContent();
    }
  );

const userId = idParam({
  type: "User",
  description: "The ID of the user",
});

api
  .path("/petitions/:petitionId/permissions/user/:userId", {
    params: { petitionId, userId },
  })
  .delete(
    {
      operationId: "RemoveUserPermission",
      summary: "Delete a permission",
      description: outdent`
        Stop sharing the specified petition with the specified user.
      `,
      tags: ["Petition Sharing"],
      responses: { 204: SuccessResponse() },
    },
    async ({ client, params }) => {
      const _mutation = gql`
        mutation RemoveUserPermission_removePetitionPermission($petitionId: GID!, $userId: GID!) {
          removePetitionPermission(petitionIds: [$petitionId], userIds: [$userId]) {
            id
          }
        }
      `;
      await client.request(RemoveUserPermission_removePetitionPermissionDocument, {
        petitionId: params.petitionId,
        userId: params.userId,
      });
      return NoContent();
    }
  );

const userGroupId = idParam({
  type: "UserGroup",
  description: "The ID of the user group",
});

api
  .path("/petitions/:petitionId/permissions/group/:userGroupId", {
    params: { petitionId, userGroupId },
  })
  .delete(
    {
      operationId: "RemoveUserGroupPermission",
      summary: "Delete a permission",
      description: outdent`
        Stop sharing the specified petition with the specified user group.
      `,
      tags: ["Petition Sharing"],
      responses: { 204: SuccessResponse() },
    },
    async ({ client, params }) => {
      const _mutation = gql`
        mutation RemoveUserGroupPermission_removePetitionPermission(
          $petitionId: GID!
          $userGroupId: GID!
        ) {
          removePetitionPermission(petitionIds: [$petitionId], userGroupIds: [$userGroupId]) {
            id
          }
        }
      `;
      await client.request(RemoveUserGroupPermission_removePetitionPermissionDocument, {
        petitionId: params.petitionId,
        userGroupId: params.userGroupId,
      });
      return NoContent();
    }
  );

api
  .path("/petitions/:petitionId/transfer", {
    params: { petitionId },
  })
  .post(
    {
      operationId: "TransferPetition",
      summary: "Transfer the petition",
      query: {
        userId: idParam({ type: "User" }),
      },
      description: outdent`
        Transfer the petition ownership to another user from your organization.

        Note that you will still have \`WRITE\` access to the petition.
    `,
      responses: { 201: SuccessResponse(ListOfPermissions) },
      tags: ["Petition Sharing"],
    },
    async ({ client, params, query }) => {
      const _mutation = gql`
        mutation TransferPetition_transferPetitionOwnership($userId: GID!, $petitionId: GID!) {
          transferPetitionOwnership(petitionIds: [$petitionId], userId: $userId) {
            permissions {
              ...Permission
            }
          }
        }
        ${PermissionFragment}
      `;
      const result = await client.request(TransferPetition_transferPetitionOwnershipDocument, {
        petitionId: params.petitionId,
        userId: query.userId,
      });

      return Ok(result.transferPetitionOwnership[0].permissions);
    }
  );

api.path("/templates").get(
  {
    operationId: "GetTemplates",
    summary: "Get templates list",
    description: outdent`
      Returns a paginated list of all templates the user has access to.
    `,
    query: {
      ...paginationParams(),
      ...sortByParam(["createdAt", "name", "lastUsedAt"]),
    },
    responses: { 200: SuccessResponse(PaginatedTemplates) },
    tags: ["Templates"],
  },
  async ({ client, query }) => {
    const _query = gql`
      query GetTemplates_Templates(
        $offset: Int!
        $limit: Int!
        $sortBy: [QueryPetitions_OrderBy!]
      ) {
        templates: petitions(
          offset: $offset
          limit: $limit
          sortBy: $sortBy
          filters: { type: TEMPLATE }
        ) {
          items {
            ...Template
          }
          totalCount
        }
      }
      ${TemplateFragment}
    `;
    const result = await client.request(GetTemplates_TemplatesDocument, query);
    const { items, totalCount } = result.templates;
    assertType<TemplateFragmentType[]>(items);
    return Ok({ items, totalCount });
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
      description: outdent`
        Returns the specified template.
      `,
      responses: { 200: SuccessResponse(Template) },
      tags: ["Templates"],
    },
    async ({ client, params }) => {
      const _query = gql`
        query GetTemplate_Template($templateId: GID!) {
          template: petition(id: $templateId) {
            ...Template
          }
        }
        ${TemplateFragment}
      `;
      const result = await client.request(GetTemplate_TemplateDocument, {
        templateId: params.templateId,
      });
      assert("id" in result.template!);
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
      responses: {
        204: SuccessResponse(),
        400: ErrorResponse({
          description: "The template is being shared with another user. Set force=true to delete.",
        }),
      },
      tags: ["Templates"],
    },
    async ({ client, params, query }) => {
      try {
        const _mutation = gql`
          mutation DeleteTemplate_deletePetitions($templateId: GID!, $force: Boolean!) {
            deletePetitions(ids: [$templateId], force: $force)
          }
        `;
        await client.request(DeleteTemplate_deletePetitionsDocument, {
          templateId: params.templateId,
          force: query.force ?? false,
        });
        return NoContent();
      } catch (error: any) {
        if (
          error instanceof ClientError &&
          containsGraphQLError(error, "DELETE_SHARED_PETITION_ERROR")
        ) {
          throw new BadRequestError(
            "The template is being shared with another user. Set force=true to delete."
          );
        }
        throw error;
      }
    }
  );

api
  .path("/contacts")
  .get(
    {
      operationId: "GetContacts",
      summary: "Get contacts list",
      description: outdent`
        Returns a paginated list of all contacts in the organization.
      `,
      query: {
        ...paginationParams(),
        ...sortByParam(["firstName", "lastName", "fullName", "email", "createdAt"]),
      },
      responses: { 200: SuccessResponse(PaginatedContacts) },
      tags: ["Contacts"],
    },
    async ({ client, query }) => {
      const _query = gql`
        query GetContacts_Contacts($offset: Int!, $limit: Int!, $sortBy: [QueryContacts_OrderBy!]) {
          contacts(offset: $offset, limit: $limit, sortBy: $sortBy) {
            items {
              ...Contact
            }
            totalCount
          }
        }
        ${ContactFragment}
      `;
      const result = await client.request(GetContacts_ContactsDocument, query);
      return Ok(result.contacts);
    }
  )
  .post(
    {
      operationId: "CreateContact",
      summary: "Create contact",
      description: outdent`
        Creates a contact in the organization.
      `,
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
        const _mutation = gql`
          mutation CreateContact_Contact($data: CreateContactInput!) {
            createContact(data: $data) {
              ...Contact
            }
          }
          ${ContactFragment}
        `;
        const result = await client.request(CreateContact_ContactDocument, { data: body });
        return Created(result.createContact!);
      } catch (error: any) {
        if (error instanceof ClientError && containsGraphQLError(error, "EXISTING_CONTACT")) {
          throw new ConflictError("A contact with this email already exists");
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
      description: outdent`
        Returns the specified contact.
      `,
      responses: { 200: SuccessResponse(Contact) },
      tags: ["Contacts"],
    },
    async ({ client, params }) => {
      const _query = gql`
        query GetContact_Contact($contactId: GID!) {
          contact(id: $contactId) {
            ...Contact
          }
        }
        ${ContactFragment}
      `;
      const result = await client.request(GetContact_ContactDocument, {
        contactId: params.contactId,
      });
      return Ok(result.contact!);
    }
  );

api.path("/users").get(
  {
    operationId: "GetUsers",
    summary: "Get users list",
    description: outdent`
        This endpoint returns a paginated list of all the available members in your organization.
      `,
    query: {
      ...paginationParams(),
      ...sortByParam(["createdAt", "fullName"]),
    },
    responses: { 200: SuccessResponse(PaginatedUsers) },
    tags: ["Users"],
  },
  async ({ client, query }) => {
    const _query = gql`
      query GetOrganizationUsers_Users(
        $offset: Int!
        $limit: Int!
        $sortBy: [OrganizationUsers_OrderBy!]
      ) {
        me {
          organization {
            users(limit: $limit, offset: $offset, sortBy: $sortBy) {
              totalCount
              items {
                ...User
              }
            }
          }
        }
      }
      ${UserFragment}
    `;
    const result = await client.request(GetOrganizationUsers_UsersDocument, query);
    return Ok(result.me.organization.users);
  }
);

const subscriptionId = idParam({
  type: "PetitionEventSubscription",
  description: "The ID of the subscription",
});

api
  .path("/subscriptions")
  .get(
    {
      operationId: "GetSubscriptions",
      summary: "Get your subscription info",
      description: "Return a list with all your event subscriptions",
      responses: { 200: SuccessResponse(ListOfSubscriptions) },
      tags: ["Subscriptions"],
    },
    async ({ client }) => {
      const _query = gql`
        query EventSubscriptions_GetSubscriptions {
          subscriptions {
            ...Subscription
          }
        }
        ${SubscriptionFragment}
      `;
      const result = await client.request(EventSubscriptions_GetSubscriptionsDocument);

      return Ok(result.subscriptions);
    }
  )
  .post(
    {
      operationId: "CreateSubscription",
      summary: "Create subscription",
      description: outdent`Creates a new subscription.`,
      body: JsonBody(CreateSubscription),
      responses: {
        201: SuccessResponse(Subscription),
        400: ErrorResponse({ description: "Invalid request" }),
        409: ErrorResponse({ description: "You already have a subscription" }),
      },
      tags: ["Subscriptions"],
    },
    async ({ client, body }) => {
      try {
        const _mutation = gql`
          mutation EventSubscriptions_CreateSubscription($eventsUrl: String!) {
            createEventSubscription(eventsUrl: $eventsUrl) {
              ...Subscription
            }
          }
          ${SubscriptionFragment}
        `;
        const result = await client.request(EventSubscriptions_CreateSubscriptionDocument, body);

        assert("id" in result.createEventSubscription);
        return Created(result.createEventSubscription);
      } catch (error) {
        if (error instanceof ClientError) {
          if (containsGraphQLError(error, "ARG_VALIDATION_ERROR")) {
            throw new BadRequestError("Invalid request body. Please verify your eventsUrl");
          }
          if (containsGraphQLError(error, "WEBHOOK_CHALLENGE_FAILED")) {
            throw new BadRequestError(`Your URL does not seem to accept POST requests.`);
          }
          if (containsGraphQLError(error, "EXISTING_SUBSCRIPTION_ERROR")) {
            throw new ConflictError("You already have a subscription.");
          }
        }
        throw error;
      }
    }
  );

api.path("/subscriptions/:subscriptionId", { params: { subscriptionId } }).delete(
  {
    operationId: "DeleteSubscription",
    summary: "Delete subscription",
    description: "Delete the specified subscription.",
    responses: { 204: SuccessResponse() },
    tags: ["Subscriptions"],
  },
  async ({ client, params }) => {
    const _mutation = gql`
      mutation EventSubscriptions_DeleteSubscription($ids: [GID!]!) {
        deleteEventSubscriptions(ids: $ids)
      }
    `;
    await client.request(EventSubscriptions_DeleteSubscriptionDocument, {
      ids: [params.subscriptionId],
    });
    return NoContent();
  }
);

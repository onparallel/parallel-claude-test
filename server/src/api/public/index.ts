import { ClientError, gql, GraphQLClient } from "graphql-request";
import { outdent } from "outdent";
import pMap from "p-map";
import { pick } from "remeda";
import { toGlobalId } from "../../util/globalId";
import { isDefined } from "../../util/remedaExtensions";
import { JsonBody } from "../rest/body";
import { RestApi } from "../rest/core";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../rest/errors";
import { booleanParam, enumParam } from "../rest/params";
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
  PetitionFragment,
  PetitionReplyFragment,
  SubscriptionFragment,
  TemplateFragment,
  UserFragment,
} from "./fragments";
import {
  containsGraphQLError,
  idParam,
  paginationParams,
  sortByParam,
} from "./helpers";
import {
  Contact,
  CreateContact,
  CreatePetition,
  CreateSubscription,
  ListOfPermissions,
  ListOfPetitionAccesses,
  ListOfReplies,
  ListOfSubscriptions,
  PaginatedContacts,
  PaginatedPetitions,
  PaginatedTemplates,
  PaginatedUsers,
  Petition,
  PetitionEvent,
  SendPetition,
  SharePetition,
  Subscription,
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
  CreateSubscription_createPetitionSubscriptionMutation,
  CreateSubscription_createPetitionSubscriptionMutationVariables,
  DeletePetition_deletePetitionsMutation,
  DeletePetition_deletePetitionsMutationVariables,
  DeleteSubscription_deletePetitionSubscriptionMutation,
  DeleteSubscription_deletePetitionSubscriptionMutationVariables,
  DeleteTemplate_deletePetitionsMutation,
  DeleteTemplate_deletePetitionsMutationVariables,
  DownloadFileReply_fileUploadReplyDownloadLinkMutation,
  DownloadFileReply_fileUploadReplyDownloadLinkMutationVariables,
  GetContacts_ContactsQuery,
  GetContacts_ContactsQueryVariables,
  GetContact_ContactQuery,
  GetContact_ContactQueryVariables,
  GetOrganizationUsers_UsersQuery,
  GetOrganizationUsers_UsersQueryVariables,
  GetPermissions_PermissionsQuery,
  GetPermissions_PermissionsQueryVariables,
  GetPetitionRecipients_PetitionAccessesQuery,
  GetPetitionRecipients_PetitionAccessesQueryVariables,
  GetPetitions_PetitionsQuery,
  GetPetitions_PetitionsQueryVariables,
  GetPetition_PetitionQuery,
  GetPetition_PetitionQueryVariables,
  GetSubscriptions_SubscriptionQuery,
  GetSubscriptions_SubscriptionQueryVariables,
  GetTemplates_TemplatesQuery,
  GetTemplates_TemplatesQueryVariables,
  GetTemplate_TemplateQuery,
  GetTemplate_TemplateQueryVariables,
  PetitionFieldType,
  PetitionReplies_RepliesQuery,
  PetitionReplies_RepliesQueryVariables,
  RemoveUserGroupPermission_removePetitionUserPermissionMutation,
  RemoveUserGroupPermission_removePetitionUserPermissionMutationVariables,
  RemoveUserPermission_removePetitionUserPermissionMutation,
  RemoveUserPermission_removePetitionUserPermissionMutationVariables,
  SharePetition_addPetitionUserPermissionMutation,
  SharePetition_addPetitionUserPermissionMutationVariables,
  StopSharing_removePetitionUserPermissionMutation,
  StopSharing_removePetitionUserPermissionMutationVariables,
  TransferPetition_transferPetitionOwnershipMutation,
  TransferPetition_transferPetitionOwnershipMutationVariables,
  UpdatePetition_PetitionMutation,
  UpdatePetition_PetitionMutationVariables,
} from "./__types";

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
  },
  "x-tagGroups": [
    {
      name: "Endpoints",
      tags: [
        "Petitions",
        "Petition Subscription",
        "Petition Sharing",
        "Templates",
        "Contacts",
        "Users",
      ],
    },
  ],
  tags: [
    {
      name: "Petitions",
      description: "Petitions are the main entities in Parallel",
    },
    {
      name: "Petition Subscription",
      description:
        "Subscribe to your petition to receive real-time event updates",
    },
    {
      name: "Petition Sharing",
      description:
        "Share your petitions with members of your organization for collaborative work",
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

    {
      name: "Users",
      description: "Users are members of your organization",
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
              filters: { status: $status, type: PETITION }
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
      description: outdent`
        Create a new petition based on a template.
        
        You can optionally pass an \`eventsUrl\` parameter to subscribe to the
        events in this petition. See more about petition events [here](#operation/CreateSubscription).
      `,
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
          mutation CreatePetition_Petition(
            $name: String
            $templateId: GID
            $eventsUrl: String
          ) {
            createPetition(
              name: $name
              petitionId: $templateId
              eventsUrl: $eventsUrl
            ) {
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
      description: outdent`
        Returns the specified petition.
      `,
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
      description: outdent`
        Update the specified petition.
      `,
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
          description:
            "The petition is being shared with another user. Set force=true to delete.",
        }),
      },
      tags: ["Petitions"],
    },
    async ({ client, params, query }) => {
      try {
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
          `,
          { petitionId: params.petitionId, force: query.force ?? false }
        );
        return NoContent();
      } catch (error) {
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
          description:
            "The petition was already sent to some of the provided contacts",
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
            const {
              contacts: [contact],
            } = await client.request<
              CreatePetitionRecipients_ContactQuery,
              CreatePetitionRecipients_ContactQueryVariables
            >(
              gql`
                query CreatePetitionRecipients_Contact($email: String!) {
                  contacts: contactsByEmail(emails: [$email]) {
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
                (contact.firstName !== data.firstName &&
                  isDefined(data.firstName)) ||
                (contact.lastName !== data.lastName && isDefined(data.lastName))
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
      try {
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
      } catch (error) {
        if (
          error instanceof ClientError &&
          containsGraphQLError(error, "PETITION_ALREADY_SENT_ERROR")
        ) {
          throw new ConflictError(
            "The petition was already sent to some of the provided contacts"
          );
        }
        throw error;
      }
    }
  );

api.path("/petitions/:petitionId/replies", { params: { petitionId } }).get(
  {
    operationId: "PetitionReplies",
    summary: "List petition replies",
    description: outdent`
      Returns a list of the submitted replies to the specified petition.
    `,
    tags: ["Petitions"],
    responses: {
      200: SuccessResponse(ListOfReplies),
    },
  },
  async ({ client, params }) => {
    const response = await client.request<
      PetitionReplies_RepliesQuery,
      PetitionReplies_RepliesQueryVariables
    >(
      gql`
        query PetitionReplies_Replies($petitionId: GID!) {
          petition(id: $petitionId) {
            fields {
              id
              type
              replies {
                ...PetitionFieldReply
              }
            }
          }
        }
        ${PetitionReplyFragment}
      `,
      {
        petitionId: params.petitionId,
      }
    );
    return Ok(
      response.petition!.fields.flatMap((field) =>
        field.replies.map((reply) => ({
          id: reply.id,
          type: field.type as Exclude<PetitionFieldType, "HEADING">,
          content:
            field.type === "FILE_UPLOAD"
              ? (reply.content as {
                  filename: string;
                  contentType: string;
                  size: number;
                })
              : field.type === "DYNAMIC_SELECT"
              ? (reply.content.columns as [string, string][])
              : (reply.content.text as string),
          fieldId: field.id,
          updatedAt: reply.updatedAt,
          createdAt: reply.createdAt,
        }))
      )
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
        const response = await client.request<
          DownloadFileReply_fileUploadReplyDownloadLinkMutation,
          DownloadFileReply_fileUploadReplyDownloadLinkMutationVariables
        >(
          gql`
            mutation DownloadFileReply_fileUploadReplyDownloadLink(
              $petitionId: GID!
              $replyId: GID!
            ) {
              fileUploadReplyDownloadLink(
                petitionId: $petitionId
                replyId: $replyId
              ) {
                url
              }
            }
          `,
          params
        );
        return Redirect(response.fileUploadReplyDownloadLink.url!);
      } catch (error) {
        if (
          error instanceof ClientError &&
          containsGraphQLError(error, "INVALID_FIELD_TYPE")
        ) {
          throw new BadRequestError(
            `Reply "${params.replyId}" is not of "FILE" type`
          );
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
      const result = await client.request<
        GetPermissions_PermissionsQuery,
        GetPermissions_PermissionsQueryVariables
      >(
        gql`
          query GetPermissions_Permissions($petitionId: GID!) {
            petition(id: $petitionId) {
              permissions {
                ...Permission
              }
            }
          }
          ${PermissionFragment}
        `,
        params
      );

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
      const result = await client.request<
        SharePetition_addPetitionUserPermissionMutation,
        SharePetition_addPetitionUserPermissionMutationVariables
      >(
        gql`
          mutation SharePetition_addPetitionUserPermission(
            $petitionId: GID!
            $userIds: [GID!]
            $userGroupIds: [GID!]
          ) {
            addPetitionUserPermission(
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
        `,
        {
          petitionId: params.petitionId,
          userIds: body.userIds,
          userGroupIds: body.userGroupIds,
        }
      );

      return Ok(result.addPetitionUserPermission[0].permissions);
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
      await client.request<
        StopSharing_removePetitionUserPermissionMutation,
        StopSharing_removePetitionUserPermissionMutationVariables
      >(
        gql`
          mutation StopSharing_removePetitionUserPermission($petitionId: GID!) {
            removePetitionUserPermission(
              petitionIds: [$petitionId]
              removeAll: true
            ) {
              id
            }
          }
        `,
        { petitionId: params.petitionId }
      );
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
      await client.request<
        RemoveUserPermission_removePetitionUserPermissionMutation,
        RemoveUserPermission_removePetitionUserPermissionMutationVariables
      >(
        gql`
          mutation RemoveUserPermission_removePetitionUserPermission(
            $petitionId: GID!
            $userId: GID!
          ) {
            removePetitionUserPermission(
              petitionIds: [$petitionId]
              userIds: [$userId]
            ) {
              id
            }
          }
        `,
        {
          petitionId: params.petitionId,
          userId: params.userId,
        }
      );
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
      await client.request<
        RemoveUserGroupPermission_removePetitionUserPermissionMutation,
        RemoveUserGroupPermission_removePetitionUserPermissionMutationVariables
      >(
        gql`
          mutation RemoveUserGroupPermission_removePetitionUserPermission(
            $petitionId: GID!
            $userGroupId: GID!
          ) {
            removePetitionUserPermission(
              petitionIds: [$petitionId]
              userGroupIds: [$userGroupId]
            ) {
              id
            }
          }
        `,
        {
          petitionId: params.petitionId,
          userGroupId: params.userGroupId,
        }
      );
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
      const response = await client.request<
        TransferPetition_transferPetitionOwnershipMutation,
        TransferPetition_transferPetitionOwnershipMutationVariables
      >(
        gql`
          mutation TransferPetition_transferPetitionOwnership(
            $userId: GID!
            $petitionId: GID!
          ) {
            transferPetitionOwnership(
              petitionIds: [$petitionId]
              userId: $userId
            ) {
              permissions {
                ...Permission
              }
            }
          }
          ${PermissionFragment}
        `,
        {
          petitionId: params.petitionId,
          userId: query.userId,
        }
      );

      return Ok(response.transferPetitionOwnership[0].permissions);
    }
  );

api
  .path("/petitions/:petitionId/subscriptions", {
    params: { petitionId },
  })
  .get(
    {
      operationId: "GetSubscriptions",
      summary: "Get petition subscriptions",
      description: outdent`
        Returns the list of subscribed endpoints to the specified petition.
      `,
      responses: { 200: SuccessResponse(ListOfSubscriptions) },
      tags: ["Petition Subscription"],
    },
    async ({ client, params }) => {
      const result = await client.request<
        GetSubscriptions_SubscriptionQuery,
        GetSubscriptions_SubscriptionQueryVariables
      >(
        gql`
          query GetSubscriptions_Subscription($petitionId: GID!) {
            petition(id: $petitionId) {
              ... on Petition {
                subscriptions {
                  ...Subscription
                }
              }
            }
          }
          ${SubscriptionFragment}
        `,
        { petitionId: params.petitionId }
      );
      return Ok(result.petition!.subscriptions);
    }
  )
  .post(
    {
      operationId: "CreateSubscription",
      summary: "Subscribe to petition events",
      description: outdent`
        Create a subscription to the specified petition in order to receive
        real-time event updates on the given URL.  

        You **must be the owner** of the petition in order to create a subscription.
    `,
      body: JsonBody(CreateSubscription),
      responses: {
        201: SuccessResponse(Subscription),
      },
      tags: ["Petition Subscription"],
      callbacks: {
        PetitionEvent: {
          "{endpoint}": {
            post: {
              summary: "Petition event",
              description: outdent`
                This subscription endpoint will be triggered every time there is
                a petition event.
              `,
              requestBody: {
                content: {
                  "application/json": { schema: PetitionEvent },
                },
              },
              responses: {
                "2XX": {
                  description: "Petition event processed correctly",
                },
                "4XX": {
                  description:
                    "Request failed, the petition owner will be notified via email",
                },
                "5XX": {
                  description:
                    "Request failed, the petition owner will be notified via email",
                },
              },
            },
          },
        },
      },
    },
    async ({ client, params, body }) => {
      const result = await client.request<
        CreateSubscription_createPetitionSubscriptionMutation,
        CreateSubscription_createPetitionSubscriptionMutationVariables
      >(
        gql`
          mutation CreateSubscription_createPetitionSubscription(
            $petitionId: GID!
            $endpoint: String!
          ) {
            createPetitionSubscription(
              petitionId: $petitionId
              endpoint: $endpoint
            ) {
              ...Subscription
            }
          }
          ${SubscriptionFragment}
        `,
        {
          petitionId: params.petitionId,
          endpoint: body.endpoint,
        }
      );

      return Created(result.createPetitionSubscription);
    }
  );

api
  .path("/petitions/:petitionId/subscriptions/:subscriptionId", {
    params: {
      petitionId,
      subscriptionId: idParam({
        type: "Subscription",
        description: "The ID of the subscription",
      }),
    },
  })
  .delete(
    {
      operationId: "DeleteSubscription",
      summary: "Stop petition subscription",
      description: outdent`
        You can remove a subscription on a petition to stop receiving real-time event
        updates.  
        
        You **must be the owner** of the petition in order to delete a subscription.
    `,
      responses: { 204: SuccessResponse() },
      tags: ["Petition Subscription"],
    },
    async ({ client, params }) => {
      await client.request<
        DeleteSubscription_deletePetitionSubscriptionMutation,
        DeleteSubscription_deletePetitionSubscriptionMutationVariables
      >(
        gql`
          mutation DeleteSubscription_deletePetitionSubscription(
            $subscriptionId: GID!
          ) {
            deletePetitionSubscription(subscriptionId: $subscriptionId)
          }
        `,
        { subscriptionId: params.subscriptionId }
      );
      return NoContent();
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
            filters: { type: TEMPLATE }
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
      description: outdent`
        Returns the specified template.
      `,
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
      responses: {
        204: SuccessResponse(),
        400: ErrorResponse({
          description:
            "The template is being shared with another user. Set force=true to delete.",
        }),
      },
      tags: ["Templates"],
    },
    async ({ client, params, query }) => {
      try {
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
          `,
          { templateId: params.templateId, force: query.force ?? false }
        );
        return NoContent();
      } catch (error) {
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
        if (
          error instanceof ClientError &&
          containsGraphQLError(error, "EXISTING_CONTACT")
        ) {
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
    const result = await client.request<
      GetOrganizationUsers_UsersQuery,
      GetOrganizationUsers_UsersQueryVariables
    >(
      gql`
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
      `,
      query
    );
    return Ok(result.me.organization.users);
  }
);

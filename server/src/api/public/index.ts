import { randomUUID } from "crypto";
import stringify from "fast-safe-stringify";
import { unlink } from "fs/promises";
import { GraphQLClient, gql } from "graphql-request";
import { Container } from "inversify";
import { outdent } from "outdent";
import { isDefined, omit, pick, uniq, zip } from "remeda";
import { PetitionEventTypeValues, ProfileEventTypeValues } from "../../db/__types";
import { EMAIL_REGEX } from "../../graphql/helpers/validators/validEmail";
import { ILogger, LOGGER } from "../../services/Logger";
import { IRedis, REDIS } from "../../services/Redis";
import { assert } from "../../util/assert";
import { isGlobalId, toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { fromPlainTextWithMentions } from "../../util/slate/utils";
import { titleize } from "../../util/strings";
import { Body, FormDataBody, FormDataBodyContent, JsonBody, JsonBodyContent } from "../rest/body";
import { RestApi, RestParameter } from "../rest/core";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  ResourceNotFoundError,
  UnauthorizedError,
} from "../rest/errors";
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
import {
  ActivatePetitionRecipient_reactivateAccessesDocument,
  AssociatePetitionToProfile_associateProfileToPetitionDocument,
  BulkSendTemplate_createBulkPetitionSendTaskDocument,
  BulkSendTemplate_uploadBulkPetitionSendTaskInputFileDocument,
  ClosePetition_closePetitionDocument,
  CreateContact_contactDocument,
  CreateOrUpdatePetitionCustomProperty_modifyPetitionCustomPropertyDocument,
  CreatePetitionRecipients_petitionDocument,
  CreatePetitionRecipients_sendPetitionDocument,
  CreatePetitionRecipients_userByEmailDocument,
  CreatePetition_petitionDocument,
  CreateProfile_createProfileDocument,
  CreateProfile_createProfileFieldFileUploadLinkDocument,
  CreateProfile_profileFieldFileUploadCompleteDocument,
  CreateProfile_profileTypeDocument,
  DeactivatePetitionRecipient_deactivateAccessesDocument,
  DeletePetitionCustomProperty_modifyPetitionCustomPropertyDocument,
  DeletePetition_deletePetitionsDocument,
  DeleteReply_deletePetitionReplyDocument,
  DeleteTemplate_deletePetitionsDocument,
  DisassociateProfileFromPetition_disassociateProfileFromPetitionDocument,
  DownloadFileReply_fileUploadReplyDownloadLinkDocument,
  DownloadSignedDocument_downloadAuditTrailDocument,
  DownloadSignedDocument_downloadSignedDocDocument,
  EventSubscriptions_createPetitionEventSubscriptionDocument,
  EventSubscriptions_createProfileEventSubscriptionDocument,
  EventSubscriptions_deleteSubscriptionDocument,
  EventSubscriptions_getSubscriptionsDocument,
  ExportPetitionReplies_createExportRepliesTaskDocument,
  ExportPetitionReplies_createPrintPdfTaskDocument,
  ExportTemplate_createTemplateRepliesCsvExportTaskDocument,
  GetContact_contactDocument,
  GetContacts_contactsDocument,
  GetMe_userDocument,
  GetOrganizationUsers_usersDocument,
  GetPermissions_permissionsDocument,
  GetPetitionEvents_PetitionEventsDocument,
  GetPetitionFieldComments_petitionFieldCommentsDocument,
  GetPetitionProfiles_petitionDocument,
  GetPetitionRecipients_petitionAccessesDocument,
  GetPetition_petitionDocument,
  GetPetitions_petitionsDocument,
  GetProfileEvents_ProfileEventsDocument,
  GetProfileSubscribers_profileDocument,
  GetProfile_profileDocument,
  GetProfiles_profilesDocument,
  GetSignatures_petitionSignaturesDocument,
  GetTags_tagsDocument,
  GetTemplate_templateDocument,
  GetTemplates_templatesDocument,
  OrganizationFragmentDoc,
  PetitionFragment as PetitionFragmentType,
  PetitionReplies_repliesDocument,
  PetitionTagFilter,
  ProfileStatus,
  ReadPetitionCustomPropertiesDocument,
  RemindPetitionRecipient_sendRemindersDocument,
  RemoveUserGroupPermission_createRemovePetitionPermissionTaskDocument,
  RemoveUserPermission_createRemovePetitionPermissionTaskDocument,
  ReopenPetition_reopenPetitionDocument,
  SendPetitionFieldComment_createPetitionFieldCommentDocument,
  SendPetitionFieldComment_getUsersOrGroupsDocument,
  SendPetitionFieldComment_userGroupsDocument,
  SendPetitionFieldComment_usersByEmailDocument,
  SharePetition_createAddPetitionPermissionTaskDocument,
  SharePetition_petitionDocument,
  SharePetition_usersByEmailDocument,
  StartSignature_startSignatureRequestDocument,
  StopSharing_createRemovePetitionPermissionTaskDocument,
  SubmitReplies_bulkCreatePetitionRepliesDocument,
  SubmitReply_createFileUploadReplyCompleteDocument,
  SubmitReply_createFileUploadReplyDocument,
  SubmitReply_createPetitionFieldRepliesDocument,
  SubmitReply_petitionDocument,
  SubscribeToProfile_subscribeToProfileDocument,
  TagFragmentDoc,
  TagPetition_createTagDocument,
  TagPetition_tagPetitionDocument,
  TagPetition_tagsByNameDocument,
  Task_TaskStatusDocument,
  Task_getTaskResultFileDocument,
  TemplateFragment as TemplateFragmentType,
  TransferPetition_searchUserByEmailDocument,
  TransferPetition_transferPetitionOwnershipDocument,
  UnsubscribeFromProfile_unsubscribeFromProfileDocument,
  UntagPetition_untagPetitionDocument,
  UpdatePetitionField_updatePetitionFieldDocument,
  UpdatePetitionInput,
  UpdatePetition_petitionDocument,
  UpdatePetition_updatePetitionDocument,
  UpdateProfileFieldValueInput,
  UpdateProfileFieldValue_createProfileFieldFileUploadLinkDocument,
  UpdateProfileFieldValue_deleteProfileFieldFileDocument,
  UpdateProfileFieldValue_profileDocument,
  UpdateProfileFieldValue_profileFieldFileUploadCompleteDocument,
  UpdateProfileFieldValue_updateProfileFieldValueDocument,
  UpdateReplyStatus_updatePetitionFieldRepliesStatusDocument,
  UpdateReply_petitionDocument,
  UpdateReply_updateFileUploadReplyCompleteDocument,
  UpdateReply_updateFileUploadReplyDocument,
  UpdateReply_updatePetitionFieldRepliesDocument,
  UserFragmentDoc,
} from "./__types";
import { description } from "./description";
import {
  ContactFragment,
  EventSubscriptionFragment,
  PermissionFragment,
  PetitionAccessFragment,
  PetitionEventSubscriptionFragment,
  PetitionFieldCommentFragment,
  PetitionFieldFragment,
  PetitionFieldWithRepliesFragment,
  PetitionFragment,
  PetitionSignatureRequestFragment,
  PetitionTagFragment,
  ProfileEventSubscriptionFragment,
  ProfileFragment,
  TaskFragment,
  TemplateFragment,
  UserFragment,
} from "./fragments";
import {
  bodyMessageToRTE,
  buildSubmittedReplyContent,
  buildTagsFilter,
  containsGraphQLError,
  flattenPetitionFields,
  getTaskResultFileUrl,
  idParam,
  mapPetition,
  mapPetitionField,
  mapPetitionFieldComment,
  mapPetitionFieldRepliesContent,
  mapProfile,
  mapReplyResponse,
  mapSignatureRequest,
  mapSubscription,
  mapTemplate,
  paginationParams,
  parseProfileTypeFieldInput,
  resolveContacts,
  sortByParam,
  uploadFile,
  waitForTask,
} from "./helpers";
import { anyFileUploadMiddleware, singleFileUploadMiddleware } from "./middleware";
import { ratelimit } from "./ratelimit";
import {
  AssociatePetitionToProfileInput,
  Contact,
  CreateContact,
  CreateEventSubscription,
  CreateOrUpdatePetitionCustomProperty,
  CreatePetition,
  CreatePetitionFieldComment,
  CreateProfile,
  EventSubscription,
  FileDownload,
  ListOfPermissions,
  ListOfPetitionAccesses,
  ListOfPetitionEvents,
  ListOfPetitionFieldComments,
  ListOfPetitionFieldsWithReplies,
  ListOfProfileEvents,
  ListOfProfileSubscriptions,
  ListOfProfiles,
  ListOfSignatureRequests,
  ListOfSubscriptions,
  PaginatedContacts,
  PaginatedPetitions,
  PaginatedProfiles,
  PaginatedTags,
  PaginatedTemplates,
  PaginatedUsers,
  Petition,
  PetitionAccess,
  PetitionCustomProperties,
  PetitionField,
  PetitionFieldComment,
  PetitionFieldReply,
  Profile,
  ProfileSubscriptionInput,
  SendPetition,
  SendReminder,
  SharePetition,
  SignatureRequest,
  SignatureRequestInput,
  SubmitFileReply,
  SubmitPetitionReplies,
  SubmitPetitionRepliesResponse,
  SubmitReply,
  TagPetition,
  Template,
  UpdateFileReply,
  UpdatePetition,
  UpdatePetitionField,
  UpdateProfileFieldValue,
  UpdateReply,
  UserWithOrg,
} from "./schemas/core";
import { PetitionEvent, ProfileEvent } from "./schemas/events";

function assertType<T>(value: any): asserts value is T {}

export function publicApi(container: Container) {
  const redis = container.get<IRedis>(REDIS);
  const logger = container.get<ILogger>(LOGGER);
  const api = new RestApi({
    openapi: "3.1.0",
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
        url: "https://static.onparallel.com/static/emails/logo.png",
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
        PetitionEvent: PetitionEvent as any,
      },
    },
    "x-tagGroups": [
      {
        name: "Endpoints",
        tags: [
          "Parallels",
          "Parallel replies",
          "Parallel comments and notes",
          "Parallel recipients",
          "Signatures",
          "Parallel Sharing",
          "Templates",
          "Tags",
          "Contacts",
          "Users",
          "Subscriptions",
          "Profiles",
        ],
      },
    ],
    tags: [
      {
        name: "Parallels",
        description: "Parallels are the main entities in Parallel",
      },
      {
        name: "Parallel replies",
        description: "See the replies to your parallels",
      },
      {
        name: "Parallel comments and notes",
        description: "Send comments and notes",
      },
      {
        name: "Parallel recipients",
        description: "See to whom your parallels have been sent to",
      },
      {
        name: "Signatures",
        description:
          "Request a digital signature on your parallels with our eSignature integrations.",
      },
      {
        name: "Parallel Sharing",
        description:
          "Share your parallels with members of your organization for collaborative work",
      },
      {
        name: "Templates",
        description: "Use templates to quickly create new parallels for repetitive workflows",
      },
      {
        name: "Tags",
        description:
          "Use tags to organize your templates and parallels so you can find them faster",
      },
      {
        name: "Contacts",
        description: "Contacts are the entities that represent the recipients of parallels",
      },

      {
        name: "Users",
        description: "Users are members of your organization",
      },
      {
        name: "Subscriptions",
        description: outdent`
        Subscribe to our events to get real time updates on your parallels and profiles.

        Here's a list of all possible events:
        ## Parallel Events
        ${PetitionEvent.description}

        ## Profile Events
        ${ProfileEvent.description}
      `,
      },
      {
        name: "Profiles",
        description: "Profiles allow you to store all your relevant information",
      },
    ],
    context: ({ req }) => {
      const authorization = req.header("authorization")!;
      req.requestId = randomUUID();
      return {
        client: new GraphQLClient("http://localhost/graphql", {
          headers: {
            authorization,
            "api-request-id": req.requestId,
            "User-Agent": "parallel-api",
          },
        }),
      };
    },
    errorHandler: (error: Error) => {
      if (containsGraphQLError(error, "UNAUTHENTICATED")) {
        throw new UnauthorizedError("API token is invalid");
      } else if (containsGraphQLError(error, "FORBIDDEN")) {
        throw new ForbiddenError("You don't have access to this resource");
      } else if (containsGraphQLError(error, "BAD_USER_INPUT")) {
        // malformed gql request
        throw new BadRequestError(error.response.errors?.[0].message ?? "Bad user input");
      }
      console.log(stringify(error));
      throw error;
    },
    middleware: [
      (req, res, next) => {
        const authorization = req.header("authorization");
        if (!authorization || !authorization.match(/^Bearer [A-Za-z0-9]+$/)) {
          new UnauthorizedError("API token is missing").apply(res);
        } else {
          next();
        }
      },
      ratelimit(redis, logger),
    ],
  });

  function petitionIncludeParam({ includeRecipientUrl }: { includeRecipientUrl?: boolean } = {}) {
    return {
      include: enumParam({
        schemaTitle: "PetitionIncludeInResponse",
        description: outdent`
        Include optional fields in the response:
        - \`recipients\`: List of the recipients the parallel has been sent to.
        - \`fields\`: A list of fields of the parallel and their replies.
        - \`tags\`: List of the tags the parallel has.
        - \`replies\`: An object with the replies by alias. Only fields with an alias defined will be shown.
        - \`progress\`: An object describing the progress of the parallel.
        - \`signers\`: List of the signers configured to sign this parallel, if any.
        - \`signatures\`: List of ongoing and completed signatures, if any.
        ${
          includeRecipientUrl
            ? `- \`recipients.recipientUrl\`: Include the recipient URL in when using \`recipients\`. **A special permission is required as there are security implications**.`
            : ``
        }
        - \`variablesResult\`: An array with the result of the defined variables of the parallel.
        - \`owner\`: The user who owns the parallel.
      `,
        array: true,
        required: false,
        values: [
          "recipients",
          "fields",
          "tags",
          "replies",
          "progress",
          "signers",
          "signatures",
          ...(includeRecipientUrl ? ["recipients.recipientUrl" as const] : []),
          "variablesResult",
          "owner",
        ],
      }),
    };
  }

  function getPetitionIncludesFromQuery<
    Q extends {
      include: ReturnType<typeof petitionIncludeParam>["include"] extends RestParameter<infer T>
        ? T
        : never;
    },
  >(query: Q) {
    return {
      includeFields: query.include?.includes("fields") ?? false,
      includeReplies: query.include?.includes("replies") ?? false,
      includeRecipients: query.include?.includes("recipients") ?? false,
      includeTags: query.include?.includes("tags") ?? false,
      includeRecipientUrl: query.include?.includes("recipients.recipientUrl") ?? false,
      includeProgress: query.include?.includes("progress") ?? false,
      includeSigners: query.include?.includes("signers") ?? false,
      includeSignatureRequests: query.include?.includes("signatures") ?? false,
      includeVariablesResult: query.include?.includes("variablesResult") ?? false,
      includeOwner: query.include?.includes("owner") ?? false,
    };
  }

  const templateIncludeParam = {
    include: enumParam({
      schemaTitle: "TemplateIncludeInResponse",
      description: "Include optional fields in the response",
      array: true,
      required: false,
      values: ["fields", "tags"],
    }),
  };

  const profileIncludeParam = {
    include: enumParam({
      schemaTitle: "ProfileIncludeInResponse",
      description: "Include optional fields in the response",
      array: true,
      required: false,
      values: ["fields", "subscribers"],
    }),
  };

  function getProfileIncludesFromQuery<
    Q extends {
      include: (typeof profileIncludeParam)["include"] extends RestParameter<infer T> ? T : never;
    },
  >(query: Q) {
    return {
      includeFields: query.include?.includes("fields") ?? false,
      includeSubscribers: query.include?.includes("subscribers") ?? false,
    };
  }

  const petitionId = idParam({
    type: "Petition",
    description: "The ID of the parallel",
  });
  const replyId = idParam({
    type: "PetitionFieldReply",
    description: "The ID of the reply",
  });
  const fieldId = idParam({
    type: "PetitionField",
    description: "The ID of the parallel field",
  });
  const userId = idParam({
    type: "User",
    description: "The ID of the user",
  });
  const userGroupId = idParam({
    type: "UserGroup",
    description: "The ID of the user group",
  });
  const templateId = idParam({
    type: "Petition",
    description: "The ID of the template",
  });
  const subscriptionId = idParam({
    type: ["PetitionEventSubscription", "ProfileEventSubscription"],
    description: "The ID of the subscription",
  });
  const signatureId = idParam({
    type: "PetitionSignatureRequest",
    description: "The ID of the signature request",
  });
  const accessId = idParam({
    type: "PetitionAccess",
    description: "The ID of the parallel access",
  });
  const profileId = idParam({
    type: "Profile",
    description: "The ID of the profile",
  });

  api.path("/me").get(
    {
      operationId: "GetMe",
      summary: "Get user info",
      description: outdent`
    Get the information for the user who owns the token.
  `,
      responses: {
        200: SuccessResponse(UserWithOrg),
      },
      tags: ["Users"],
    },
    async ({ client }) => {
      const _query = gql`
        query GetMe_user {
          me {
            ...User
            organization {
              ...Organization
            }
          }
        }
        ${UserFragmentDoc}
        ${OrganizationFragmentDoc}
      `;
      const result = await client.request(GetMe_userDocument);
      return Ok(result.me);
    },
  );

  api.path("/tags").get(
    {
      operationId: "GetTags",
      summary: "Get tags list",
      description: outdent`
      Returns a paginated list of all tags in the organization.
    `,
      responses: {
        200: SuccessResponse(PaginatedTags),
      },
      query: {
        ...paginationParams(),
        search: stringParam({
          description: "Search tags by name",
          required: false,
        }),
      },
      tags: ["Tags"],
    },
    async ({ client, query }) => {
      const _query = gql`
        query GetTags_tags($offset: Int!, $limit: Int!, $search: String) {
          tags(offset: $offset, limit: $limit, search: $search) {
            items {
              ...Tag
            }
            totalCount
          }
        }
        ${TagFragmentDoc}
      `;
      const result = await client.request(GetTags_tagsDocument, query);
      const { items, totalCount } = result.tags;
      return Ok({ items: items.map((t) => t.name), totalCount });
    },
  );

  api
    .path("/petitions")
    .get(
      {
        operationId: "GetPetitions",
        summary: "Get parallels list",
        description: outdent`
        Returns a paginated list of all parallels the user has access to.
      `,
        query: {
          ...paginationParams(),
          ...sortByParam(["createdAt", "name"]),
          search: stringParam({
            description: "Search criteria to find relevant parallels",
            required: false,
          }),
          status: enumParam({
            description: "Optionally filter parallels by their status",
            required: false,
            values: ["DRAFT", "PENDING", "COMPLETED", "CLOSED"] as const,
            array: true,
          }),
          tags: stringParam({
            description: "List of tags to filter by",
            example: "todo,assigned",
            required: false,
            array: true,
          }),
          fromTemplateId: stringParam({
            description: "List of template IDs used to create the parallels",
            example: [toGlobalId("Petition", 101), toGlobalId("Petition", 57)].join(","),
            required: false,
            array: true,
          }),
          ...petitionIncludeParam(),
        },
        responses: {
          200: SuccessResponse(PaginatedPetitions),
          403: ErrorResponse({ description: "You don't have access to this resource" }),
        },
        tags: ["Parallels"],
      },
      async ({ client, query }) => {
        let tags: PetitionTagFilter | undefined = undefined;
        if (isDefined(query.tags)) {
          try {
            tags = await buildTagsFilter(client, query.tags);
          } catch (e) {
            if (e instanceof Error && e.message === "UNKNOWN_TAG_NAME") {
              return Ok({ totalCount: 0, items: [] });
            }
          }
        }

        const _query = gql`
          query GetPetitions_petitions(
            $offset: Int!
            $limit: Int!
            $search: String
            $status: [PetitionStatus!]
            $tags: PetitionTagFilter
            $sortBy: [QueryPetitions_OrderBy!]
            $includeRecipients: Boolean!
            $includeFields: Boolean!
            $includeTags: Boolean!
            $includeRecipientUrl: Boolean!
            $includeReplies: Boolean!
            $includeProgress: Boolean!
            $includeSigners: Boolean!
            $includeVariablesResult: Boolean!
            $includeSignatureRequests: Boolean!
            $includeOwner: Boolean!
            $fromTemplateId: [GID!]
          ) {
            petitions(
              offset: $offset
              limit: $limit
              sortBy: $sortBy
              search: $search
              filters: {
                status: $status
                type: PETITION
                tags: $tags
                fromTemplateId: $fromTemplateId
              }
            ) {
              items {
                ...Petition
              }
              totalCount
            }
          }
          ${PetitionFragment}
        `;
        try {
          const result = await client.request(GetPetitions_petitionsDocument, {
            ...pick(query, ["offset", "limit", "search", "status", "fromTemplateId", "sortBy"]),
            tags,
            ...getPetitionIncludesFromQuery(query),
          });
          const { items, totalCount } = result.petitions;
          assertType<PetitionFragmentType[]>(items);
          return Ok({ items: items.map((p) => mapPetition(p)), totalCount });
        } catch (error) {
          if (containsGraphQLError(error, "ARG_VALIDATION_ERROR")) {
            if (error.response.errors?.[0].extensions.argName === "filters.fromTemplateId") {
              throw new ForbiddenError("Invalid fromTemplateId");
            }
          }
          throw error;
        }
      },
    )
    .post(
      {
        operationId: "CreatePetition",
        summary: "Create parallel",
        description: outdent`Create a new parallel based on a template.`,
        body: JsonBody(CreatePetition),
        query: {
          ...petitionIncludeParam(),
        },
        responses: { 201: SuccessResponse(Petition) },
        tags: ["Parallels"],
      },
      async ({ client, body, query }) => {
        const _mutation = gql`
          mutation CreatePetition_petition(
            $name: String
            $templateId: GID
            $includeRecipients: Boolean!
            $includeFields: Boolean!
            $includeTags: Boolean!
            $includeRecipientUrl: Boolean!
            $includeReplies: Boolean!
            $includeProgress: Boolean!
            $includeSigners: Boolean!
            $includeVariablesResult: Boolean!
            $includeSignatureRequests: Boolean!
            $includeOwner: Boolean!
          ) {
            createPetition(name: $name, petitionId: $templateId) {
              ...Petition
            }
          }
          ${PetitionFragment}
        `;
        const result = await client.request(CreatePetition_petitionDocument, {
          ...body,
          ...getPetitionIncludesFromQuery(query),
        });
        assert("id" in result.createPetition);
        return Created(mapPetition(result.createPetition));
      },
    );

  api
    .path("/petitions/:petitionId", { params: { petitionId } })
    .get(
      {
        operationId: "GetPetition",
        summary: "Get parallel",
        description: outdent`
        Returns the specified parallel.
      `,
        query: {
          ...petitionIncludeParam(),
        },
        responses: { 200: SuccessResponse(Petition) },
        tags: ["Parallels"],
      },
      async ({ client, params, query }) => {
        const _query = gql`
          query GetPetition_petition(
            $petitionId: GID!
            $includeRecipients: Boolean!
            $includeFields: Boolean!
            $includeTags: Boolean!
            $includeRecipientUrl: Boolean!
            $includeReplies: Boolean!
            $includeProgress: Boolean!
            $includeSigners: Boolean!
            $includeVariablesResult: Boolean!
            $includeSignatureRequests: Boolean!
            $includeOwner: Boolean!
          ) {
            petition(id: $petitionId) {
              ...Petition
            }
          }
          ${PetitionFragment}
        `;
        const result = await client.request(GetPetition_petitionDocument, {
          petitionId: params.petitionId,
          ...getPetitionIncludesFromQuery(query),
        });
        assert("id" in result.petition!);
        return Ok(mapPetition(result.petition!));
      },
    )
    .put(
      {
        operationId: "UpdatePetition",
        summary: "Update parallel",
        description: outdent`
        Update the specified parallel.
      `,
        body: JsonBody(UpdatePetition),
        query: {
          ...petitionIncludeParam(),
        },
        responses: {
          200: SuccessResponse(Petition),
          400: ErrorResponse({ description: "Invalid request body" }),
          403: ErrorResponse({ description: "You don't have access to this resource" }),
          409: ErrorResponse({
            description: "Cannot update signers on a petition without a signature configuration",
          }),
        },
        tags: ["Parallels"],
      },
      async ({ client, params, body, query }) => {
        const _query = gql`
          query UpdatePetition_petition($petitionId: GID!) {
            petition(id: $petitionId) {
              signatureConfig {
                allowAdditionalSigners
                integration {
                  id
                }
                review
                timezone
                title
                signingMode
                instructions
                minSigners
              }
            }
          }
        `;
        const _mutation = gql`
          mutation UpdatePetition_updatePetition(
            $petitionId: GID!
            $data: UpdatePetitionInput!
            $includeRecipients: Boolean!
            $includeFields: Boolean!
            $includeTags: Boolean!
            $includeRecipientUrl: Boolean!
            $includeReplies: Boolean!
            $includeProgress: Boolean!
            $includeSigners: Boolean!
            $includeVariablesResult: Boolean!
            $includeSignatureRequests: Boolean!
            $includeOwner: Boolean!
          ) {
            updatePetition(petitionId: $petitionId, data: $data) {
              ...Petition
            }
          }
          ${PetitionFragment}
        `;

        const inputData: UpdatePetitionInput = omit(body, ["signers"]);
        if (isDefined(body.signers)) {
          const queryResult = await client.request(UpdatePetition_petitionDocument, {
            petitionId: params.petitionId,
          });

          if (!isDefined(queryResult.petition!.signatureConfig)) {
            throw new ConflictError(
              "Cannot update signers on a petition without a signature configuration",
            );
          }

          inputData.signatureConfig = {
            ...omit(queryResult.petition!.signatureConfig!, ["integration"]),
            orgIntegrationId: queryResult.petition!.signatureConfig!.integration!.id,
            signersInfo: body.signers,
          };
        } else if (body.signers === null) {
          inputData.signatureConfig = null;
        }

        try {
          const result = await client.request(UpdatePetition_updatePetitionDocument, {
            petitionId: params.petitionId,
            data: inputData,
            ...getPetitionIncludesFromQuery(query),
          });
          assert("id" in result.updatePetition!);
          return Ok(mapPetition(result.updatePetition!));
        } catch (error) {
          if (containsGraphQLError(error, "ARG_VALIDATION_ERROR")) {
            throw new BadRequestError(
              error.response.errors?.[0]?.message ?? "ARG_VALIDATION_ERROR",
            );
          }

          throw error;
        }
      },
    )
    .delete(
      {
        operationId: "DeletePetition",
        summary: "Delete parallel",
        query: {
          force: booleanParam({
            required: false,
            description: outdent`
            If the parallel is shared with other users this method will fail
            unless passing \`true\` to this parameter
          `,
          }),
        },
        description: outdent`
        Delete the specified parallel.

        If the parallel is shared with other users this method will fail unless
        passing \`true\` to the \`force\` parameter"
      `,
        responses: {
          204: SuccessResponse(),
          400: ErrorResponse({
            description:
              "The parallel is being shared with another user. Set force=true to delete.",
          }),
        },
        tags: ["Parallels"],
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
        } catch (error) {
          if (containsGraphQLError(error, "DELETE_SHARED_PETITION_ERROR")) {
            throw new BadRequestError(
              "The parallel is being shared with another user. Set force=true to delete.",
            );
          }
          throw error;
        }
      },
    );

  api.path("/petitions/:petitionId/close", { params: { petitionId } }).post(
    {
      operationId: "ClosePetition",
      summary: "Closes a parallel",
      description: "Close a parallel",
      query: {
        ...petitionIncludeParam(),
      },
      responses: {
        200: SuccessResponse(Petition),
        403: ErrorResponse({ description: "You don't have access to this resource" }),
      },
      tags: ["Parallels"],
    },
    async ({ client, params, query }) => {
      const _mutation = gql`
        mutation ClosePetition_closePetition(
          $petitionId: GID!
          $includeRecipients: Boolean!
          $includeFields: Boolean!
          $includeTags: Boolean!
          $includeRecipientUrl: Boolean!
          $includeReplies: Boolean!
          $includeProgress: Boolean!
          $includeSigners: Boolean!
          $includeVariablesResult: Boolean!
          $includeSignatureRequests: Boolean!
          $includeOwner: Boolean!
        ) {
          closePetition(petitionId: $petitionId) {
            ...Petition
          }
        }
        ${PetitionFragment}
      `;

      const result = await client.request(ClosePetition_closePetitionDocument, {
        petitionId: params.petitionId,
        ...getPetitionIncludesFromQuery(query),
      });

      assert("id" in result.closePetition!);
      return Ok(mapPetition(result.closePetition!));
    },
  );

  api.path("/petitions/:petitionId/reopen", { params: { petitionId } }).post(
    {
      operationId: "ReopenPetition",
      summary: "Reopen a parallel",
      description: "Reopen a closed or completed parallel",
      query: {
        ...petitionIncludeParam(),
      },
      responses: {
        200: SuccessResponse(Petition),
        403: ErrorResponse({ description: "You don't have access to this resource" }),
        409: ErrorResponse({ description: "The parallel is not closed or completed" }),
      },
      tags: ["Parallels"],
    },
    async ({ client, params, query }) => {
      const _mutation = gql`
        mutation ReopenPetition_reopenPetition(
          $petitionId: GID!
          $includeRecipients: Boolean!
          $includeFields: Boolean!
          $includeTags: Boolean!
          $includeRecipientUrl: Boolean!
          $includeReplies: Boolean!
          $includeProgress: Boolean!
          $includeSigners: Boolean!
          $includeVariablesResult: Boolean!
          $includeSignatureRequests: Boolean!
          $includeOwner: Boolean!
        ) {
          reopenPetition(petitionId: $petitionId) {
            ...Petition
          }
        }
        ${PetitionFragment}
      `;

      try {
        const result = await client.request(ReopenPetition_reopenPetitionDocument, {
          petitionId: params.petitionId,
          ...getPetitionIncludesFromQuery(query),
        });

        assert("id" in result.reopenPetition!);
        return Ok(mapPetition(result.reopenPetition!));
      } catch (error) {
        if (containsGraphQLError(error, "PETITION_STATUS_ERROR")) {
          throw new ConflictError("The parallel is not closed or completed");
        }

        throw error;
      }
    },
  );

  api.path("/petitions/:petitionId/tags", { params: { petitionId } }).post(
    {
      operationId: "TagPetition",
      summary: "Tag a parallel",
      description: "Tag a parallel with the specified label",
      query: {
        ...petitionIncludeParam(),
      },
      body: JsonBody(TagPetition),
      responses: { 201: SuccessResponse(Petition) },
      tags: ["Tags"],
    },
    async ({ client, params, body, query }) => {
      const _query = gql`
        query TagPetition_tagsByName($search: String!) {
          tagsByName(offset: 0, limit: 1, search: [$search]) {
            items {
              ...Tag
            }
          }
        }
        ${PetitionTagFragment}
      `;
      const queryResult = await client.request(TagPetition_tagsByNameDocument, {
        search: body.name,
      });
      // must have a 100% match on the result
      let tagId = queryResult.tagsByName.items[0]?.id;

      if (!isDefined(tagId)) {
        const _mutation = gql`
          mutation TagPetition_createTag($name: String!, $color: String!) {
            createTag(name: $name, color: $color) {
              ...Tag
            }
          }
          ${PetitionTagFragment}
        `;

        const createTagResult = await client.request(TagPetition_createTagDocument, {
          name: body.name,
          color: "#E2E8F0",
        });

        tagId = createTagResult.createTag!.id;
      }

      const _mutation = gql`
        mutation TagPetition_tagPetition(
          $petitionId: GID!
          $tagId: GID!
          $includeRecipients: Boolean!
          $includeFields: Boolean!
          $includeTags: Boolean!
          $includeRecipientUrl: Boolean!
          $includeReplies: Boolean!
          $includeProgress: Boolean!
          $includeSigners: Boolean!
          $includeVariablesResult: Boolean!
          $includeSignatureRequests: Boolean!
          $includeOwner: Boolean!
        ) {
          tagPetition(petitionId: $petitionId, tagId: $tagId) {
            ...Petition
          }
        }
        ${PetitionFragment}
      `;
      const tagResult = await client.request(TagPetition_tagPetitionDocument, {
        petitionId: params.petitionId,
        tagId: tagId!,
        ...getPetitionIncludesFromQuery(query),
        includeTags: true,
      });
      assert("id" in tagResult.tagPetition!);
      return Created(mapPetition(tagResult.tagPetition!));
    },
  );

  api
    .path("/petitions/:petitionId/tags/:name", {
      params: { petitionId, name: stringParam({ description: "The name of the tag to remove" }) },
    })
    .delete(
      {
        operationId: "UntagPetition",
        summary: "Untag a parallel",
        description: "Untag a parallel with the specified tag name",
        responses: {
          204: SuccessResponse(),
          404: ErrorResponse({ description: "Tag name not found" }),
        },

        tags: ["Tags"],
      },
      async ({ client, params }) => {
        const _query = gql`
          query UntagPetition_tagsByName($search: String!) {
            tagsByName(offset: 0, limit: 1, search: [$search]) {
              items {
                ...Tag
              }
            }
          }
          ${PetitionTagFragment}
        `;
        const queryResult = await client.request(TagPetition_tagsByNameDocument, {
          search: params.name,
        });
        const tagId = queryResult.tagsByName.items[0]?.id;

        if (!isDefined(tagId)) {
          throw new ResourceNotFoundError(`Label '${params.name}' not found`);
        }

        const _mutation = gql`
          mutation UntagPetition_untagPetition($petitionId: GID!, $tagId: GID!) {
            untagPetition(petitionId: $petitionId, tagId: $tagId) {
              id
            }
          }
        `;

        await client.request(UntagPetition_untagPetitionDocument, {
          petitionId: params.petitionId,
          tagId,
        });

        return NoContent();
      },
    );

  api
    .path("/petitions/:petitionId/properties", {
      params: { petitionId },
    })
    .get(
      {
        operationId: "ReadPetitionCustomProperties",
        summary: "Get parallel custom properties",
        description: "Returns a key-value object with the custom properties of the parallel",
        responses: {
          200: SuccessResponse(PetitionCustomProperties),
        },
        tags: ["Parallels"],
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
      },
    )
    .post(
      {
        operationId: "CreateOrUpdatePetitionCustomProperty",
        summary: "Create or update parallel custom property",
        description: outdent`
        Creates or updates a custom property on the parallel.

        If the provided key already exists as a property, its value is overwritten.
        If the provided key doesn't exist, it's added.

        The parallel can have up to 20 different properties.
      `,
        body: JsonBody(CreateOrUpdatePetitionCustomProperty),
        responses: {
          200: SuccessResponse(PetitionCustomProperties),
          409: ErrorResponse({
            description: "You reached the maximum limit of custom properties on the parallel",
          }),
        },
        tags: ["Parallels"],
      },
      async ({ client, body, params }) => {
        try {
          const _mutation = gql`
            mutation CreateOrUpdatePetitionCustomProperty_modifyPetitionCustomProperty(
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
            CreateOrUpdatePetitionCustomProperty_modifyPetitionCustomPropertyDocument,
            { petitionId: params.petitionId, key: body.key, value: body.value },
          );
          return Ok(result.modifyPetitionCustomProperty.customProperties);
        } catch (error) {
          if (containsGraphQLError(error, "CUSTOM_PROPERTIES_LIMIT_ERROR")) {
            throw new ConflictError(
              "You reached the maximum limit of custom properties on the parallel.",
            );
          }
          throw error;
        }
      },
    );

  api
    .path("/petitions/:petitionId/properties/:key", {
      params: { petitionId, key: stringParam({ required: true, maxLength: 100 }) },
    })
    .delete(
      {
        operationId: "DeletePetitionCustomProperty",
        summary: "Deletes parallel custom property",
        description: outdent`
        Removes the provided key from the custom properties of the parallel.
      `,
        responses: { 204: SuccessResponse() },
        tags: ["Parallels"],
      },
      async ({ client, params }) => {
        const _mutation = gql`
          mutation DeletePetitionCustomProperty_modifyPetitionCustomProperty(
            $petitionId: GID!
            $key: String!
          ) {
            modifyPetitionCustomProperty(petitionId: $petitionId, key: $key) {
              id
            }
          }
        `;
        await client.request(
          DeletePetitionCustomProperty_modifyPetitionCustomPropertyDocument,
          params,
        );

        return NoContent();
      },
    );

  api.path("/petitions/:petitionId/send", { params: { petitionId } }).post(
    {
      operationId: "SendPetition",
      summary: "Send parallel",
      description: outdent`
      Send a parallel to a contact. You can send a parallel to multiple
      people at once so they can fill the parallel collaboratively.

      There are two ways of specifying the recipients of the parallel.

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
      query: {
        ...petitionIncludeParam({ includeRecipientUrl: true }),
      },
      responses: {
        200: SuccessResponse(Petition),
        400: ErrorResponse({
          description: "Invalid parameter",
        }),
        403: ErrorResponse({
          description: "You don't have enough credits for this action",
        }),
        409: ErrorResponse({
          description: "The parallel was already sent to some of the provided contacts",
        }),
      },
      tags: ["Parallels"],
    },
    async ({ client, params, body, query }) => {
      try {
        const contactIds = await resolveContacts(client, body.contacts);
        let message = bodyMessageToRTE(body.message);

        let subject = body.subject;
        const _query = gql`
          query CreatePetitionRecipients_petition($id: GID!) {
            petition(id: $id) {
              emailBody
              emailSubject
            }
          }
        `;
        const _mutation = gql`
          mutation CreatePetitionRecipients_sendPetition(
            $petitionId: GID!
            $contactIds: [GID!]!
            $subject: String!
            $body: JSON!
            $scheduledAt: DateTime
            $remindersConfig: RemindersConfigInput
            $skipEmailSend: Boolean
            $includeRecipients: Boolean!
            $includeFields: Boolean!
            $includeTags: Boolean!
            $includeRecipientUrl: Boolean!
            $includeReplies: Boolean!
            $includeProgress: Boolean!
            $includeSigners: Boolean!
            $includeVariablesResult: Boolean!
            $includeSignatureRequests: Boolean!
            $includeOwner: Boolean!
            $senderId: GID
          ) {
            sendPetition(
              petitionId: $petitionId
              contactIdGroups: [$contactIds]
              subject: $subject
              body: $body
              scheduledAt: $scheduledAt
              remindersConfig: $remindersConfig
              senderId: $senderId
              skipEmailSend: $skipEmailSend
            ) {
              result
              petition {
                ...Petition
              }
            }
          }
          ${PetitionFragment}
        `;

        if (!isDefined(subject) || !isDefined(message)) {
          /* 
          email body and subject are required in the sendPetition mutation, so if those are not defined on the request
          we need to fetch it from the petition. If they are not defined in the petition either, an error will be thrown
         */
          const query = await client.request(CreatePetitionRecipients_petitionDocument, {
            id: params.petitionId,
          });

          subject = subject ?? query.petition?.emailSubject ?? null;
          message = message ?? query.petition?.emailBody ?? null;
          if (!isDefined(subject) || !isDefined(message)) {
            throw new BadRequestError(
              "The subject or the message are missing and not defined on the parallel",
            );
          }
        }

        let senderId: string | null = null;
        const EMAIL_REGEX =
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (isDefined(body.sendAs)) {
          if (isGlobalId(body.sendAs, "User")) {
            senderId = body.sendAs;
          } else if (EMAIL_REGEX.test(body.sendAs)) {
            const _query = gql`
              query CreatePetitionRecipients_userByEmail($email: String!) {
                me {
                  organization {
                    users(limit: 1, offset: 0, search: $email, searchByEmailOnly: true) {
                      items {
                        id
                        email
                      }
                    }
                  }
                }
              }
            `;

            const queryResponse = await client.request(
              CreatePetitionRecipients_userByEmailDocument,
              {
                email: body.sendAs,
              },
            );
            senderId = queryResponse.me.organization.users.items[0]?.id ?? null;
          } else {
            throw new BadRequestError("The sendAs field must be a valid email or a user id");
          }
        }

        const result = await client.request(CreatePetitionRecipients_sendPetitionDocument, {
          petitionId: params.petitionId,
          contactIds,
          body: message,
          subject,
          senderId,
          scheduledAt: body.scheduledAt,
          remindersConfig: body.remindersConfig && {
            limit: 10,
            ...body.remindersConfig,
          },
          skipEmailSend: body.skipEmailSend,
          ...getPetitionIncludesFromQuery(query),
        });

        assert(result.sendPetition[0].petition !== null);
        assert("id" in result.sendPetition[0].petition);

        return Ok(mapPetition(result.sendPetition[0].petition));
      } catch (error) {
        if (containsGraphQLError(error, "PETITION_ALREADY_SENT_ERROR")) {
          throw new ConflictError("The parallel was already sent to some of the provided contacts");
        } else if (containsGraphQLError(error, "PETITION_SEND_LIMIT_REACHED")) {
          throw new ForbiddenError("You don't have enough credits to send this parallel");
        } else if (containsGraphQLError(error, "SEND_AS_ERROR")) {
          throw new ForbiddenError("You don't have permission to send as this user");
        }

        throw error;
      }
    },
  );

  api.path("/petitions/:petitionId/recipients", { params: { petitionId } }).get(
    {
      operationId: "GetPetitionRecipients",
      summary: "Get parallel recipients",
      description: outdent`
        Returns the list of recipients this parallel has been sent to.
      `,
      responses: { 200: SuccessResponse(ListOfPetitionAccesses) },
      tags: ["Parallel recipients"],
    },
    async ({ client, params }) => {
      const _query = gql`
        query GetPetitionRecipients_petitionAccesses($petitionId: GID!) {
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
      const result = await client.request(GetPetitionRecipients_petitionAccessesDocument, {
        petitionId: params.petitionId,
        includeRecipientUrl: false,
      });
      assert("accesses" in result.petition!);
      return Ok(result.petition!.accesses);
    },
  );

  api
    .path("/petitions/:petitionId/recipients/:accessId/activate", {
      params: { petitionId, accessId },
    })
    .post(
      {
        operationId: "ActivatePetitionRecipient",
        summary: "Activate a parallel recipient",
        description: "Activates the access of a recipient to a parallel.",
        tags: ["Parallel recipients"],
        responses: {
          200: SuccessResponse(PetitionAccess),
          403: ErrorResponse({ description: "You don't have access to this resource" }),
        },
      },
      async ({ client, params }) => {
        const _mutation = gql`
          mutation ActivatePetitionRecipient_reactivateAccesses(
            $petitionId: GID!
            $accessId: GID!
          ) {
            reactivateAccesses(petitionId: $petitionId, accessIds: [$accessId]) {
              ...PetitionAccess
            }
          }
          ${PetitionAccessFragment}
        `;

        const result = await client.request(ActivatePetitionRecipient_reactivateAccessesDocument, {
          petitionId: params.petitionId,
          accessId: params.accessId,
        });

        assert(result.reactivateAccesses.length === 1);
        assert("id" in result.reactivateAccesses[0]);

        return Ok(result.reactivateAccesses[0]);
      },
    );

  api
    .path("/petitions/:petitionId/recipients/:accessId/deactivate", {
      params: { petitionId, accessId },
    })
    .post(
      {
        operationId: "DeactivatePetitionRecipient",
        summary: "Deactivate a parallel recipient",
        description: "Deactivates the access of a recipient to a parallel.",
        tags: ["Parallel recipients"],
        responses: {
          200: SuccessResponse(PetitionAccess),
          403: ErrorResponse({ description: "You don't have access to this resource" }),
        },
      },
      async ({ client, params }) => {
        const _mutation = gql`
          mutation DeactivatePetitionRecipient_deactivateAccesses(
            $petitionId: GID!
            $accessId: GID!
          ) {
            deactivateAccesses(petitionId: $petitionId, accessIds: [$accessId]) {
              ...PetitionAccess
            }
          }
          ${PetitionAccessFragment}
        `;

        const result = await client.request(
          DeactivatePetitionRecipient_deactivateAccessesDocument,
          {
            petitionId: params.petitionId,
            accessId: params.accessId,
          },
        );

        assert(result.deactivateAccesses.length === 1);
        assert("id" in result.deactivateAccesses[0]);

        return Ok(result.deactivateAccesses[0]);
      },
    );

  api
    .path("/petitions/:petitionId/recipients/:accessId/remind", {
      params: { petitionId, accessId },
    })
    .post(
      {
        operationId: "RemindPetitionRecipient",
        summary: "Remind a parallel recipient",
        description: "Sends the petition recipient a reminder email to complete the information.",
        tags: ["Parallel recipients"],
        body: JsonBody(SendReminder),
        responses: {
          200: SuccessResponse(PetitionAccess),
          403: ErrorResponse({ description: "You don't have access to this resource" }),
          409: ErrorResponse({ description: "The parallel is not pending or completed" }),
        },
      },
      async ({ client, params, body }) => {
        const _mutation = gql`
          mutation RemindPetitionRecipient_sendReminders(
            $petitionId: GID!
            $accessId: GID!
            $body: JSON
          ) {
            sendReminders(petitionId: $petitionId, accessIds: [$accessId], body: $body) {
              id
              access {
                ...PetitionAccess
              }
            }
          }
          ${PetitionAccessFragment}
        `;

        try {
          const message = bodyMessageToRTE(body.message);

          const result = await client.request(RemindPetitionRecipient_sendRemindersDocument, {
            petitionId: params.petitionId,
            accessId: params.accessId,
            body: message,
          });

          assert(result.sendReminders.length === 1);
          assert("id" in result.sendReminders[0].access);

          return Ok(result.sendReminders[0].access);
        } catch (error) {
          if (containsGraphQLError(error, "PETITION_STATUS_ERROR")) {
            throw new ConflictError("The parallel is not pending or completed");
          } else if (containsGraphQLError(error, "NO_REMINDERS_LEFT")) {
            throw new ConflictError("You can't send any more reminders to this recipient");
          }

          throw error;
        }
      },
    );

  api.path("/petitions/:petitionId/fields", { params: { petitionId } }).get(
    {
      operationId: "PetitionFields",
      summary: "List parallel replies",
      description: outdent`
      Returns a list of the parallels fields with their submitted replies.
    `,
      tags: ["Parallel replies"],
      responses: {
        200: SuccessResponse(ListOfPetitionFieldsWithReplies),
      },
    },
    async ({ client, params }) => {
      const _query = gql`
        query PetitionReplies_replies($petitionId: GID!) {
          petition(id: $petitionId) {
            fields {
              ...PetitionFieldWithReplies
            }
          }
        }
        ${PetitionFieldWithRepliesFragment}
      `;
      const result = await client.request(PetitionReplies_repliesDocument, {
        petitionId: params.petitionId,
      });

      return Ok(mapPetitionFieldRepliesContent(result.petition!).fields);
    },
  );

  api
    .path("/petitions/:petitionId/fields/:fieldId", {
      params: { petitionId, fieldId },
    })
    .put(
      {
        operationId: "UpdatePetitionField",
        summary: "Update parallel field",
        description: outdent`
      Update the title, description and/or options of the specified field on a parallel.
    `,
        body: JsonBody(UpdatePetitionField),
        responses: {
          200: SuccessResponse(PetitionField),
          400: ErrorResponse({ description: "Invalid request body" }),
        },
        tags: ["Parallels"],
      },
      async ({ client, params, body }) => {
        gql`
          mutation UpdatePetitionField_updatePetitionField(
            $petitionId: GID!
            $fieldId: GID!
            $title: String
            $description: String
            $options: JSONObject
          ) {
            updatePetitionField(
              petitionId: $petitionId
              fieldId: $fieldId
              data: { title: $title, description: $description, options: $options }
            ) {
              ...PetitionField
            }
          }
          ${PetitionFieldFragment}
        `;

        let options;
        if (isDefined(body.options)) {
          options =
            typeof body.options[0] === "string"
              ? { values: body.options, labels: null }
              : {
                  values: body.options.map((x) => (x as any).value),
                  labels: body.options.map((x) => (x as any).label),
                };

          if (options.labels?.length === 0) {
            options.labels = null;
          }
        }

        try {
          const result = await client.request(UpdatePetitionField_updatePetitionFieldDocument, {
            petitionId: params.petitionId,
            fieldId: params.fieldId,
            description: body.description,
            title: body.title,
            options,
          });
          assert("id" in result.updatePetitionField!);
          return Ok(mapPetitionField(result.updatePetitionField));
        } catch (error) {
          if (containsGraphQLError(error, "ARG_VALIDATION_ERROR")) {
            throw new BadRequestError("Invalid request body");
          }

          throw error;
        }
      },
    );

  for (const type of ["comment", "note"] as const) {
    api
      .path(`/petitions/:petitionId/fields/:fieldId/${type}s`, {
        params: { petitionId, fieldId },
      })
      .get(
        {
          operationId: `GetPetitionField${titleize(type)}s`,
          summary: `Get ${type}s on a petition field`,
          description: `Returns a list of ${type}s on the specified petition field`,
          responses: {
            200: SuccessResponse(ListOfPetitionFieldComments),
          },
          tags: ["Parallel comments and notes"],
        },
        async ({ client, params }) => {
          const _query = gql`
            query GetPetitionFieldComments_petitionFieldComments(
              $petitionId: GID!
              $fieldId: GID!
            ) {
              petitionField(petitionId: $petitionId, petitionFieldId: $fieldId) {
                comments {
                  ...PetitionFieldComment
                }
              }
            }
            ${PetitionFieldCommentFragment}
          `;

          const response = await client.request(
            GetPetitionFieldComments_petitionFieldCommentsDocument,
            {
              petitionId: params.petitionId,
              fieldId: params.fieldId,
            },
          );

          return Ok(
            response.petitionField.comments
              .filter((c) => c.isInternal === (type === "note"))
              .map(mapPetitionFieldComment),
          );
        },
      )
      .post(
        {
          operationId: `SendPetitionField${titleize(type)}`,
          summary: `Send a ${type} to a petition field`,
          description: `Send a ${type} to the specified petition field`,
          body: JsonBody(CreatePetitionFieldComment),

          responses: {
            200: SuccessResponse(PetitionFieldComment),
            400: ErrorResponse({ description: "Invalid request body" }),
          },
          tags: ["Parallel comments and notes"],
        },
        async ({ client, params, body }) => {
          const _queries = gql`
            query SendPetitionFieldComment_usersByEmail($search: String!) {
              me {
                organization {
                  usersByEmail(emails: [$search], limit: 1, offset: 0) {
                    items {
                      id
                      fullName
                    }
                  }
                }
              }
            }
            query SendPetitionFieldComment_userGroups($search: String!) {
              userGroups(search: $search, limit: 1, offset: 0) {
                items {
                  id
                  name
                  localizableName
                }
              }
            }
            query SendPetitionFieldComment_getUsersOrGroups($ids: [ID!]!) {
              getUsersOrGroups(ids: $ids) {
                __typename
                ... on User {
                  id
                  fullName
                }
                ... on UserGroup {
                  id
                  name
                  localizableName
                }
              }
            }
            mutation SendPetitionFieldComment_createPetitionFieldComment(
              $petitionId: GID!
              $petitionFieldId: GID!
              $content: JSON!
              $isInternal: Boolean!
              $sharePetition: Boolean
              $sharePetitionPermission: PetitionPermissionTypeRW
              $sharePetitionSubscribed: Boolean
            ) {
              createPetitionFieldComment(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                content: $content
                isInternal: $isInternal
                sharePetition: $sharePetition
                sharePetitionPermission: $sharePetitionPermission
                sharePetitionSubscribed: $sharePetitionSubscribed
                throwOnNoPermission: false
              ) {
                ...PetitionFieldComment
              }
            }
            ${PetitionFieldCommentFragment}
          `;

          const slateComment = await fromPlainTextWithMentions(body.content, async (mention) => {
            try {
              if (mention.startsWith("@[id:")) {
                const {
                  getUsersOrGroups: [data],
                } = await client.request(SendPetitionFieldComment_getUsersOrGroupsDocument, {
                  ids: [mention.slice(5, -1)],
                });

                return {
                  id: data.id,
                  name:
                    data.__typename === "User"
                      ? data.fullName ?? ""
                      : data.name || data.localizableName["en"] || data.localizableName["es"] || "",
                };
              } else if (mention.startsWith("@[group:")) {
                const search = mention.slice(8, -1);
                const {
                  userGroups: {
                    items: [firstGroup],
                  },
                } = await client.request(SendPetitionFieldComment_userGroupsDocument, {
                  search,
                });

                if (!firstGroup) {
                  throw new Error();
                }

                const name = [
                  firstGroup.name,
                  firstGroup.localizableName["en"],
                  firstGroup.localizableName["es"],
                ].filter(isDefined);

                if (name.every((name) => name.toLowerCase() !== search.toLowerCase())) {
                  throw new Error(); // group name must fully match search term, case-insensitive
                }
                return {
                  id: firstGroup.id,
                  name: name.find((n) => n !== "") ?? "",
                };
              } else if (mention.startsWith("@[email:")) {
                const email = mention.slice(8, -1);
                if (!email.match(EMAIL_REGEX)) {
                  throw new Error();
                }
                const {
                  me: {
                    organization: {
                      usersByEmail: {
                        items: [firstUser],
                      },
                    },
                  },
                } = await client.request(SendPetitionFieldComment_usersByEmailDocument, {
                  search: email,
                });

                if (!firstUser) {
                  throw new Error();
                }

                return {
                  id: firstUser.id,
                  name: firstUser.fullName || "",
                };
              } else {
                throw new Error();
              }
            } catch {
              throw new BadRequestError(`${mention} is not a valid mention`);
            }
          });

          const { createPetitionFieldComment } = await client.request(
            SendPetitionFieldComment_createPetitionFieldCommentDocument,
            {
              petitionId: params.petitionId,
              petitionFieldId: params.fieldId,
              isInternal: type === "note",
              content: slateComment,
              sharePetition: body.sharePermission !== undefined,
              sharePetitionPermission: body.sharePermission,
              sharePetitionSubscribed: body.subscribe,
            },
          );

          return Ok(mapPetitionFieldComment(createPetitionFieldComment));
        },
      );
  }

  const replyBodyDescription = outdent`
  For \`FILE_UPLOAD\` fields the request must be a \`multipart/form-data\` request containing the file to upload.
  For other types of fields the request will be a normal \`application/json\` request containing the value of the reply.
    - For \`TEXT\`, \`SHORT_TEXT\` and \`SELECT\` fields, the reply must be a string.
    - For \`PHONE\` fields, the repy must be a string with a valid phone number in e164 format.
    - For \`DATE\` fields, reply must be a string representing a date with format \`YYYY-MM-DD\`.
    - For \`DATE_TIME\` fields, reply must be a object with format \`{datetime: "YYYY-MM-DDTHH:mm", timezone: "Europe/Madrid"}\` where timezone must be a valid [tz database timezone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).
    - For \`NUMBER\` fields, the reply must be a number.
    - For \`CHECKBOX\` fields, the reply must be an array of strings containing all the chosen options.
    - For \`DYNAMIC_SELECT\` fields, the reply must be an array of strings in which each position in the array represents the selected option in the same level. 
  `;

  api
    .path("/petitions/:petitionId/fields/:fieldId/replies", {
      params: { petitionId, fieldId },
    })
    .post(
      {
        middleware: singleFileUploadMiddleware("reply"),
        operationId: "SubmitReply",
        summary: "Submit a reply",
        description: outdent`
        Submits a reply on a given field of the parallel.
      `,
        body: Body(
          [
            JsonBodyContent(SubmitReply),
            FormDataBodyContent(SubmitFileReply, { example: { reply: "<binary data>" } }),
          ],
          {
            description: outdent`
        ${replyBodyDescription}
        - For \`FIELD_GROUP\` fields, you need to first create an 'empty' reply on the field. Then call this endpoint again, passing the id of the child field and the id of the empty reply as the \`parentReplyId\`. Every reply with the same \`parentReplyId\` will be grouped together.
        `,
          },
        ),
        responses: {
          201: SuccessResponse(PetitionFieldReply),
          400: ErrorResponse({ description: "Invalid parameters" }),
          403: ErrorResponse({
            description: "You don't have enough credits for this action",
          }),
          409: ErrorResponse({ description: "The field does not accept more replies." }),
        },
        tags: ["Parallel replies"],
      },
      async ({ client, body, params, files }) => {
        const { petition } = await client.request(SubmitReply_petitionDocument, {
          petitionId: params.petitionId,
        });

        const fields = flattenPetitionFields(petition?.fields ?? []);
        const field = fields?.find((f) => f.id === params.fieldId);

        try {
          if (field?.isChild && !isDefined(body.parentReplyId)) {
            throw new BadRequestError("You must specify a parentReplyId for this field");
          }
          const fieldType = field?.type;
          let newReply;

          if (isDefined(fieldType) && isFileTypeField(fieldType)) {
            const file = files["reply"]?.[0];
            if (!file) {
              throw new BadRequestError(`Reply for ${fieldType} field must be a single file.`);
            }
            const {
              createFileUploadReply: { presignedPostData, reply },
            } = await client.request(SubmitReply_createFileUploadReplyDocument, {
              petitionId: params.petitionId,
              fieldId: params.fieldId,
              parentReplyId: body.parentReplyId,
              file: { size: file.size, contentType: file.mimetype, filename: file.originalname },
            });

            const uploadResponse = await uploadFile(file, presignedPostData);
            if (uploadResponse.ok) {
              await unlink(file.path);
              const { createFileUploadReplyComplete } = await client.request(
                SubmitReply_createFileUploadReplyCompleteDocument,
                {
                  petitionId: params.petitionId,
                  replyId: reply.id,
                },
              );
              newReply = createFileUploadReplyComplete;
            } else {
              throw new BadRequestError(uploadResponse.statusText);
            }
          } else {
            ({
              createPetitionFieldReplies: [newReply],
            } = await client.request(SubmitReply_createPetitionFieldRepliesDocument, {
              petitionId: params.petitionId,
              fields: [
                {
                  id: params.fieldId,
                  content: buildSubmittedReplyContent(fields, params.fieldId, body),
                  parentReplyId: body.parentReplyId,
                },
              ],
            }));
          }

          if (isDefined(body.status) && fieldType === "FIELD_GROUP") {
            throw new BadRequestError("You can't set the status of a FIELD_GROUP reply");
          }

          if (isDefined(body.status)) {
            const replyId = newReply.id;
            const { updatePetitionFieldRepliesStatus } = await client.request(
              UpdateReplyStatus_updatePetitionFieldRepliesStatusDocument,
              {
                petitionId: params.petitionId,
                fieldId: params.fieldId,
                replyIds: [replyId],
                status: body.status,
              },
            );
            newReply = updatePetitionFieldRepliesStatus.replies.find((r) => r.id === replyId)!;
          }

          return Ok(mapReplyResponse(newReply));
        } catch (error) {
          if (containsGraphQLError(error, "INVALID_REPLY_ERROR")) {
            const extra = error.response.errors?.[0].extensions?.extra as
              | { subcode: string }
              | undefined;
            throw new BadRequestError(error.response.errors?.[0].message ?? "INVALID_REPLY_ERROR", {
              subcode: extra?.subcode,
            });
          } else if (containsGraphQLError(error, "FIELD_ALREADY_REPLIED_ERROR")) {
            throw new BadRequestError(
              "The field is already replied and does not accept any more replies.",
            );
          } else if (containsGraphQLError(error, "PETITION_SEND_LIMIT_REACHED")) {
            throw new ForbiddenError("You don't have enough credits to submit a reply");
          }

          throw error;
        }
      },
    );

  api
    .path("/petitions/:petitionId/fields/:fieldId/replies/:replyId", {
      params: { petitionId, fieldId, replyId },
    })
    .put(
      {
        middleware: singleFileUploadMiddleware("reply"),
        operationId: "UpdateReply",
        summary: "Update a reply",
        description: outdent`
        Updates the \`content\` of a previously submitted reply.
        In order to update the content of the reply, its \`status\` must be \`PENDING\` or \`REJECTED\`.
      `,
        responses: {
          201: SuccessResponse(PetitionFieldReply),
          400: ErrorResponse({ description: "Invalid parameters" }),
          409: ErrorResponse({ description: "The reply cannot be updated." }),
        },
        tags: ["Parallel replies"],
        body: Body(
          [
            JsonBodyContent(UpdateReply),
            FormDataBodyContent(UpdateFileReply, { example: { reply: "<binary data>" } }),
          ],
          {
            description: replyBodyDescription,
          },
        ),
      },
      async ({ client, body, params, files }) => {
        const { petition } = await client.request(UpdateReply_petitionDocument, {
          petitionId: params.petitionId,
        });

        const fields = flattenPetitionFields(petition?.fields ?? []);
        const field = fields.find((f) => f.replies.some((r) => r.id === params.replyId));

        try {
          if (field?.type === "FIELD_GROUP") {
            throw new BadRequestError("You can't update a FIELD_GROUP reply");
          }

          const fieldType = field?.type;
          let updatedReply;

          if (isDefined(fieldType) && isFileTypeField(fieldType)) {
            const file = files["reply"]?.[0];
            if (!file) {
              throw new BadRequestError(`Reply for ${fieldType} field must be a single file.`);
            }
            const {
              updateFileUploadReply: { presignedPostData, reply },
            } = await client.request(UpdateReply_updateFileUploadReplyDocument, {
              petitionId: params.petitionId,
              replyId: params.replyId,
              file: { contentType: file.mimetype, filename: file.originalname, size: file.size },
            });

            const uploadResponse = await uploadFile(file, presignedPostData);
            if (uploadResponse.ok) {
              await unlink(file.path);
              const { updateFileUploadReplyComplete } = await client.request(
                UpdateReply_updateFileUploadReplyCompleteDocument,
                {
                  petitionId: params.petitionId,
                  replyId: reply.id,
                },
              );

              updatedReply = updateFileUploadReplyComplete;
            } else {
              throw new BadRequestError(uploadResponse.statusText);
            }
          } else {
            ({
              updatePetitionFieldReplies: [updatedReply],
            } = await client.request(UpdateReply_updatePetitionFieldRepliesDocument, {
              petitionId: params.petitionId,
              replies: [
                {
                  id: params.replyId,
                  content: buildSubmittedReplyContent(fields, params.fieldId, body),
                },
              ],
            }));
          }

          return Ok(mapReplyResponse(updatedReply));
        } catch (error) {
          if (containsGraphQLError(error, "INVALID_REPLY_ERROR")) {
            const { subcode } = error.response.errors?.[0].extensions?.extra as { subcode: string };
            throw new BadRequestError(error.response.errors?.[0].message ?? "INVALID_REPLY_ERROR", {
              subcode,
            });
          } else if (containsGraphQLError(error, "REPLY_ALREADY_APPROVED_ERROR")) {
            throw new BadRequestError("The reply is already approved and cannot be modified.");
          }

          throw error;
        }
      },
    )
    .delete(
      {
        operationId: "DeleteReply",
        summary: "Delete a reply",
        description: outdent`
        Deletes a previously submitted reply.
      `,
        responses: {
          204: SuccessResponse(),
          409: ErrorResponse({ description: "The reply can't be deleted" }),
        },
        tags: ["Parallel replies"],
      },
      async ({ client, params }) => {
        try {
          gql`
            mutation DeleteReply_deletePetitionReply($petitionId: GID!, $replyId: GID!) {
              deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
                id
              }
            }
          `;
          await client.request(DeleteReply_deletePetitionReplyDocument, params);
          return NoContent();
        } catch (error) {
          if (containsGraphQLError(error, "REPLY_ALREADY_APPROVED_ERROR")) {
            throw new ConflictError("The reply is already approved and cannot be deleted.");
          } else if (containsGraphQLError(error, "DELETE_FIELD_GROUP_REPLY_ERROR")) {
            throw new ConflictError(
              "You can't delete the last reply of a required FIELD_GROUP field",
            );
          }
          throw error;
        }
      },
    );

  api
    .path("/petitions/:petitionId/fields/:fieldId/replies/:replyId/approve", {
      params: { petitionId, fieldId, replyId },
    })
    .post(
      {
        operationId: "ApproveReply",
        summary: "Approve a reply",
        description:
          "Updates the reply status to `APPROVED`. Approved replies can't be updated or deleted.",
        responses: {
          201: SuccessResponse(PetitionFieldReply),
          400: ErrorResponse({ description: "Invalid parameters" }),
        },
        tags: ["Parallel replies"],
      },
      async ({ client, params }) => {
        const { updatePetitionFieldRepliesStatus } = await client.request(
          UpdateReplyStatus_updatePetitionFieldRepliesStatusDocument,
          {
            petitionId: params.petitionId,
            fieldId: params.fieldId,
            replyIds: [params.replyId],
            status: "APPROVED",
          },
        );
        const updatedReply = updatePetitionFieldRepliesStatus.replies.find(
          (r) => r.id === params.replyId,
        )!;
        return Ok(mapReplyResponse(updatedReply));
      },
    );

  api
    .path("/petitions/:petitionId/fields/:fieldId/replies/:replyId/reject", {
      params: { petitionId, fieldId, replyId },
    })
    .post(
      {
        operationId: "RejectReply",
        summary: "Reject a reply",
        description: "Updates the reply status to `REJECTED`.",
        responses: {
          201: SuccessResponse(PetitionFieldReply),
          400: ErrorResponse({ description: "Invalid parameters" }),
        },
        tags: ["Parallel replies"],
      },
      async ({ client, params }) => {
        const { updatePetitionFieldRepliesStatus } = await client.request(
          UpdateReplyStatus_updatePetitionFieldRepliesStatusDocument,
          {
            petitionId: params.petitionId,
            fieldId: params.fieldId,
            replyIds: [params.replyId],
            status: "REJECTED",
          },
        );
        const updatedReply = updatePetitionFieldRepliesStatus.replies.find(
          (r) => r.id === params.replyId,
        )!;
        return Ok(mapReplyResponse(updatedReply));
      },
    );

  api
    .path("/petitions/:petitionId/replies", {
      params: { petitionId },
    })
    .post(
      {
        operationId: "SubmitReplies",
        summary: "Submit replies by field alias",
        description: outdent`
      Submits replies on a parallel given a JSON object where each key is a field alias and each value is one or more replies on that field.
    `,
        responses: {
          200: SuccessResponse(SubmitPetitionRepliesResponse),
          403: ErrorResponse({
            description: "You don't have enough credits for this action",
          }),
        },
        body: JsonBody(SubmitPetitionReplies),
        query: {
          ...petitionIncludeParam(),
        },
        tags: ["Parallel replies"],
      },
      async ({ client, params, body, query }) => {
        try {
          const res = await client.request(SubmitReplies_bulkCreatePetitionRepliesDocument, {
            petitionId: params.petitionId,
            replies: body,
            ...getPetitionIncludesFromQuery(query),
            includeFields: true,
          });

          return Ok(mapPetition(res.bulkCreatePetitionReplies));
        } catch (error) {
          if (containsGraphQLError(error, "PETITION_SEND_LIMIT_REACHED")) {
            throw new ForbiddenError("You don't have enough credits to submit a reply");
          }
          throw error;
        }
      },
    );

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
          'https://www.onparallel.com/api/v1/petitions/{petitionId}/replies/{replyId}/download' \\
          > image.png
        ~~~
      `,
        tags: ["Parallel replies"],
        query: {
          noredirect: booleanParam({
            required: false,
            description: "If param is true, response will be a temporary link.",
          }),
        },
        responses: {
          201: SuccessResponse(FileDownload),
          302: RedirectResponse("Redirect to the resource on AWS S3"),
          400: ErrorResponse({
            description: `Reply {replyId} is not of "FILE" type`,
          }),
        },
      },
      async ({ client, params, query }) => {
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
            params,
          );
          if (query.noredirect) {
            return Created(
              { file: result.fileUploadReplyDownloadLink.url! },
              result.fileUploadReplyDownloadLink.url!,
            );
          } else {
            return Redirect(result.fileUploadReplyDownloadLink.url!);
          }
        } catch (error) {
          if (containsGraphQLError(error, "INVALID_FIELD_TYPE")) {
            throw new BadRequestError(`Reply "${params.replyId}" is not of "FILE" type`);
          }
          throw error;
        }
      },
    );

  api
    .path("/petitions/:petitionId/export", {
      params: { petitionId },
    })
    .get(
      {
        operationId: "ExportPetitionReplies",
        summary: "Export the parallel replies",
        description: outdent`
        Export the replies to a parallel in the specified format.

        ### Important
        Note that *there will be a redirect* to a temporary download endpoint on
        AWS S3 so make sure to configure your HTTP client to follow redirects.

        For example if you were to use curl you would need to provide the
        \`-L\` flag, e.g.:

        ~~~bash
        curl -s -L -XGET \\
          -H 'Authorization: Bearer <your API token>' \\
          'https://www.onparallel.com/api/v1/petitions/{petitionId}/export?format=pdf' \\
          > image.png
        ~~~
      `,
        query: {
          format: enumParam({
            values: ["pdf", "zip"],
            required: true,
            description: "The format of the export.",
          }),
          noredirect: booleanParam({
            required: false,
            description: "If param is true, response will be a temporary link.",
          }),
        },
        tags: ["Parallel replies"],
        responses: {
          201: SuccessResponse(FileDownload),
          302: RedirectResponse("Redirect to the resource on AWS S3"),
          500: ErrorResponse({ description: "Error generating the file" }),
        },
      },
      async ({ client, params, query }) => {
        if (query.format === "zip") {
          const _mutation = gql`
            mutation ExportPetitionReplies_createExportRepliesTask(
              $petitionId: GID!
              $pattern: String
            ) {
              createExportRepliesTask(petitionId: $petitionId, pattern: $pattern) {
                ...Task
              }
            }
            ${TaskFragment}
          `;
          try {
            const result = await client.request(
              ExportPetitionReplies_createExportRepliesTaskDocument,
              {
                petitionId: params.petitionId,
              },
            );
            await waitForTask(client, result.createExportRepliesTask);
            const url = await getTaskResultFileUrl(client, result.createExportRepliesTask);
            if (query.noredirect) {
              return Created({ file: url }, url);
            } else {
              return Redirect(url);
            }
          } catch (error) {
            throw error;
          }
        } else if (query.format === "pdf") {
          const _mutation = gql`
            mutation ExportPetitionReplies_createPrintPdfTask($petitionId: GID!) {
              createPrintPdfTask(petitionId: $petitionId) {
                ...Task
              }
            }
            ${TaskFragment}
          `;
          const result = await client.request(ExportPetitionReplies_createPrintPdfTaskDocument, {
            petitionId: params.petitionId,
          });
          await waitForTask(client, result.createPrintPdfTask);
          const url = await getTaskResultFileUrl(client, result.createPrintPdfTask);
          if (query.noredirect) {
            return Created({ file: url }, url);
          } else {
            return Redirect(url);
          }
        } else {
          return null as never;
        }
      },
    );

  api
    .path("/petitions/:petitionId/permissions", { params: { petitionId } })
    .get(
      {
        operationId: "GetPermissions",
        summary: "Get permissions list",
        description: outdent`
        Return a list of users this parallel is shared with.
      `,
        responses: { 200: SuccessResponse(ListOfPermissions) },
        tags: ["Parallel Sharing"],
      },
      async ({ client, params }) => {
        const _query = gql`
          query GetPermissions_permissions($petitionId: GID!) {
            petition(id: $petitionId) {
              permissions {
                ...Permission
              }
            }
          }
          ${PermissionFragment}
        `;
        const result = await client.request(GetPermissions_permissionsDocument, params);

        return Ok(result.petition!.permissions);
      },
    )
    .post(
      {
        operationId: "SharePetition",
        summary: "Share the parallel",
        description: outdent`
        Share the specified parallel with users and groups from your organization, giving them \`WRITE\` permissions.
      `,
        body: JsonBody(SharePetition),
        responses: {
          201: SuccessResponse(ListOfPermissions),
          400: ErrorResponse({ description: "Invalid user input" }),
        },
        tags: ["Parallel Sharing"],
      },
      async ({ client, params, body }) => {
        const _usersQuery = gql`
          query SharePetition_usersByEmail($emails: [String!]!) {
            me {
              organization {
                usersByEmail(limit: 100, offset: 0, emails: $emails) {
                  items {
                    id
                    email
                  }
                }
              }
            }
          }
        `;
        const _mutation = gql`
          mutation SharePetition_createAddPetitionPermissionTask(
            $petitionId: GID!
            $userIds: [GID!]
            $userGroupIds: [GID!]
          ) {
            createAddPetitionPermissionTask(
              petitionIds: [$petitionId]
              userIds: $userIds
              userGroupIds: $userGroupIds
              permissionType: WRITE
            ) {
              ...Task
            }
          }
          ${TaskFragment}
        `;

        const _petitionQuery = gql`
          query SharePetition_petition($id: GID!) {
            petition(id: $id) {
              permissions {
                ...Permission
              }
            }
          }
          ${PermissionFragment}
        `;
        const userIds = body.userIds ?? [];
        if (isDefined(body.emails)) {
          if (!body.emails.every((email) => email.match(EMAIL_REGEX))) {
            throw new BadRequestError("Some of the provided emails are invalid");
          }

          const usersResponse = await client.request(SharePetition_usersByEmailDocument, {
            emails: body.emails,
          });
          const ids = usersResponse.me.organization.usersByEmail.items.map((u) => u.id);
          if (body.emails.length !== ids.length) {
            throw new BadRequestError("Some of the provided emails are invalid");
          }
          userIds.push(...ids);
        }

        const userGroupIds = body.userGroupIds ?? [];

        if (userIds.length === 0 && userGroupIds.length === 0) {
          throw new BadRequestError("You must provide at least one user or user group");
        }

        const task = await client.request(SharePetition_createAddPetitionPermissionTaskDocument, {
          petitionId: params.petitionId,
          userIds: userIds.length > 0 ? uniq(userIds) : undefined,
          userGroupIds: userGroupIds.length > 0 ? uniq(userGroupIds) : undefined,
        });

        await waitForTask(client, task.createAddPetitionPermissionTask);

        const result = await client.request(SharePetition_petitionDocument, {
          id: params.petitionId,
        });

        return Ok(result.petition!.permissions);
      },
    )
    .delete(
      {
        operationId: "StopSharing",
        summary: "Stop sharing the parallel",
        description: outdent`
        Stop sharing the specified parallel.
      `,
        tags: ["Parallel Sharing"],
        responses: { 204: SuccessResponse() },
      },
      async ({ client, params }) => {
        const _mutation = gql`
          mutation StopSharing_createRemovePetitionPermissionTask($petitionId: GID!) {
            createRemovePetitionPermissionTask(petitionIds: [$petitionId], removeAll: true) {
              ...Task
            }
          }
          ${TaskFragment}
        `;
        const task = await client.request(StopSharing_createRemovePetitionPermissionTaskDocument, {
          petitionId: params.petitionId,
        });

        await waitForTask(client, task.createRemovePetitionPermissionTask);

        return NoContent();
      },
    );

  api
    .path("/petitions/:petitionId/permissions/user/:userId", {
      params: { petitionId, userId },
    })
    .delete(
      {
        operationId: "RemoveUserPermission",
        summary: "Delete a permission",
        description: outdent`
        Stop sharing the specified parallel with the specified user.
      `,
        tags: ["Parallel Sharing"],
        responses: { 204: SuccessResponse() },
      },
      async ({ client, params }) => {
        const _mutation = gql`
          mutation RemoveUserPermission_createRemovePetitionPermissionTask(
            $petitionId: GID!
            $userId: GID!
          ) {
            createRemovePetitionPermissionTask(petitionIds: [$petitionId], userIds: [$userId]) {
              ...Task
            }
          }
          ${TaskFragment}
        `;
        const task = await client.request(
          RemoveUserPermission_createRemovePetitionPermissionTaskDocument,
          {
            petitionId: params.petitionId,
            userId: params.userId,
          },
        );

        await waitForTask(client, task.createRemovePetitionPermissionTask);

        return NoContent();
      },
    );

  api
    .path("/petitions/:petitionId/permissions/group/:userGroupId", {
      params: { petitionId, userGroupId },
    })
    .delete(
      {
        operationId: "RemoveUserGroupPermission",
        summary: "Delete a permission",
        description: outdent`
        Stop sharing the specified parallel with the specified user group.
      `,
        tags: ["Parallel Sharing"],
        responses: { 204: SuccessResponse() },
      },
      async ({ client, params }) => {
        const _mutation = gql`
          mutation RemoveUserGroupPermission_createRemovePetitionPermissionTask(
            $petitionId: GID!
            $userGroupId: GID!
          ) {
            createRemovePetitionPermissionTask(
              petitionIds: [$petitionId]
              userGroupIds: [$userGroupId]
            ) {
              ...Task
            }
          }
          ${TaskFragment}
        `;
        const task = await client.request(
          RemoveUserGroupPermission_createRemovePetitionPermissionTaskDocument,
          {
            petitionId: params.petitionId,
            userGroupId: params.userGroupId,
          },
        );

        await waitForTask(client, task.createRemovePetitionPermissionTask);

        return NoContent();
      },
    );

  api
    .path("/petitions/:petitionId/transfer", {
      params: { petitionId },
    })
    .post(
      {
        operationId: "TransferPetition",
        summary: "Transfer the parallel",
        query: {
          userId: idParam({ type: "User", required: false }),
          email: stringParam({ required: false }),
        },
        description: outdent`
        Transfer the parallel ownership to another user from your organization.

        Note that you will still have \`WRITE\` access to the parallel.

        You must specify in the query params either \`userId\` or \`email\` argument, but not both.
        If the provided ID or email does not correspond with an active user in your organization, this method will return error.
    `,
        responses: {
          201: SuccessResponse(ListOfPermissions),
          400: ErrorResponse({ description: "Bad user input" }),
        },
        tags: ["Parallel Sharing"],
      },
      async ({ client, params, query }) => {
        const _usersQuery = gql`
          query TransferPetition_searchUserByEmail($search: String) {
            me {
              organization {
                users(limit: 1, offset: 0, search: $search) {
                  items {
                    id
                    email
                  }
                }
              }
            }
          }
        `;
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
        if (
          (!isDefined(query.userId) && !isDefined(query.email)) ||
          (isDefined(query.userId) && isDefined(query.email))
        ) {
          throw new BadRequestError("Bad user input. You must specify a userId or an email");
        }

        if (isDefined(query.email) && !query.email.match(EMAIL_REGEX)) {
          throw new BadRequestError("Invalid email");
        }

        let userId = query.userId;
        if (isDefined(query.email)) {
          const queryResponse = await client.request(TransferPetition_searchUserByEmailDocument, {
            search: query.email,
          });
          const user = queryResponse.me.organization.users.items[0];
          // email must fully match
          if (user && user.email === query.email) {
            userId = user.id;
          }
          if (!isDefined(userId)) {
            throw new BadRequestError("User not found");
          }
        }

        const result = await client.request(TransferPetition_transferPetitionOwnershipDocument, {
          petitionId: params.petitionId,
          userId: userId!,
        });

        return Ok(result.transferPetitionOwnership[0].permissions);
      },
    );

  api
    .path("/petitions/:petitionId/signatures", { params: { petitionId } })
    .get(
      {
        operationId: "GetSignatures",
        summary: "List parallel signatures",
        description: "List every signature request linked with your parallel.",
        responses: { 204: SuccessResponse(ListOfSignatureRequests) },
        tags: ["Signatures"],
      },
      async ({ client, params }) => {
        gql`
          query GetSignatures_petitionSignatures($petitionId: GID!) {
            petition(id: $petitionId) {
              __typename
              ... on Petition {
                signatureRequests {
                  ...PetitionSignatureRequest
                }
              }
            }
          }
          ${PetitionSignatureRequestFragment}
        `;
        const data = await client.request(GetSignatures_petitionSignaturesDocument, params);

        if (data.petition?.__typename === "PetitionTemplate") {
          return Ok([]);
        } else {
          return Ok((data.petition?.signatureRequests ?? []).map(mapSignatureRequest));
        }
      },
    )
    .post(
      {
        operationId: "StartSignature",
        summary: "Start a signature request",
        description: outdent`
        Start a signature request for the specified parallel.
        If the parallel doesn't have a signature configured, an error will be thrown.
        If the parallel has an ongoing eSignature request, it will be cancelled and a new eSignature request will be started.
      `,
        tags: ["Signatures"],
        body: JsonBody(SignatureRequestInput, { required: false }),
        responses: {
          201: SuccessResponse(SignatureRequest),
          403: ErrorResponse({
            description: "You don't have enough credits to complete this parallel.",
          }),
          409: ErrorResponse({
            description: "You can't start a signature request on the parallel.",
          }),
        },
      },
      async ({ client, params, body }) => {
        const _mutation = gql`
          mutation StartSignature_startSignatureRequest($petitionId: GID!, $message: String) {
            startSignatureRequest(petitionId: $petitionId, message: $message) {
              ...PetitionSignatureRequest
            }
          }
          ${PetitionSignatureRequestFragment}
        `;

        try {
          const response = await client.request(StartSignature_startSignatureRequestDocument, {
            petitionId: params.petitionId,
            message: body.message,
          });

          assert("id" in response.startSignatureRequest);
          return Created(mapSignatureRequest(response.startSignatureRequest));
        } catch (error) {
          if (containsGraphQLError(error, "MISSING_SIGNATURE_CONFIG_ERROR")) {
            throw new ConflictError("The parallel does not have a signature configuration");
          } else if (containsGraphQLError(error, "REQUIRED_SIGNER_INFO_ERROR")) {
            throw new ConflictError("The parallel requires signer information");
          } else if (containsGraphQLError(error, "PETITION_SEND_LIMIT_REACHED")) {
            throw new ForbiddenError("You don't have enough credits to complete this parallel");
          }

          throw error;
        }
      },
    );

  api
    .path("/petitions/:petitionId/signatures/:signatureId/document", {
      params: { petitionId, signatureId },
    })
    .get(
      {
        operationId: "DownloadSignedDocument",
        summary: "Download the signed document",
        description: outdent`
        Download the signed document.

        ### Important
        Note that *there will be a redirect* to a temporary download endpoint on
        AWS S3 so make sure to configure your HTTP client to follow redirects.

        For example if you were to use curl you would need to provide the
        \`-L\` flag, e.g.:

        ~~~bash
        curl -s -L -XGET \\
          -H 'Authorization: Bearer <your API token>' \\
          'https://www.onparallel.com/api/v1/petitions/{petitionId}/signatures/{signatureId}/document' \\
          > signed.pdf
        ~~~
      `,
        query: {
          noredirect: booleanParam({
            required: false,
            description: "If param is true, response will be a temporary link.",
          }),
        },
        responses: {
          201: SuccessResponse(FileDownload),
          302: RedirectResponse("Redirect to the resource on AWS S3"),
          400: ErrorResponse({
            description: "The signed document is not yet ready to be downloaded",
          }),
        },
        tags: ["Signatures"],
      },
      async ({ client, params, query }) => {
        gql`
          mutation DownloadSignedDocument_downloadSignedDoc($signatureId: GID!) {
            signedPetitionDownloadLink(petitionSignatureRequestId: $signatureId) {
              result
              url
            }
          }
        `;
        const { signedPetitionDownloadLink } = await client.request(
          DownloadSignedDocument_downloadSignedDocDocument,
          {
            signatureId: params.signatureId,
          },
        );
        if (signedPetitionDownloadLink.result === "FAILURE") {
          throw new BadRequestError("The signed document is not yet ready to be downloaded");
        } else {
          if (query.noredirect) {
            return Created(
              { file: signedPetitionDownloadLink.url! },
              signedPetitionDownloadLink.url!,
            );
          } else {
            return Redirect(signedPetitionDownloadLink.url!);
          }
        }
      },
    );

  api
    .path("/petitions/:petitionId/signatures/:signatureId/audit", {
      params: { petitionId, signatureId },
    })
    .get(
      {
        operationId: "DownloadAuditTrail",
        summary: "Download the audit trail",
        description: outdent`
        Download the audit trail.
  
        ### Important
        Note that *there will be a redirect* to a temporary download endpoint on
        AWS S3 so make sure to configure your HTTP client to follow redirects.
  
        For example if you were to use curl you would need to provide the
        \`-L\` flag, e.g.:
  
        ~~~bash
        curl -s -L -XGET \\
          -H 'Authorization: Bearer <your API token>' \\
          'https://www.onparallel.com/api/v1/petitions/{petitionId}/signatures/{signatureId}/audit' \\
          > audit-trail.pdf
        ~~~
      `,
        query: {
          noredirect: booleanParam({
            required: false,
            description: "If param is true, response will be a temporary link.",
          }),
        },
        responses: {
          201: SuccessResponse(FileDownload),
          302: RedirectResponse("Redirect to the resource on AWS S3"),
          400: ErrorResponse({
            description: "The document is not yet ready to be downloaded",
          }),
        },
        tags: ["Signatures"],
      },
      async ({ client, params, query }) => {
        gql`
          mutation DownloadSignedDocument_downloadAuditTrail($signatureId: GID!) {
            signedPetitionDownloadLink(
              petitionSignatureRequestId: $signatureId
              downloadAuditTrail: true
            ) {
              result
              url
            }
          }
        `;
        const { signedPetitionDownloadLink } = await client.request(
          DownloadSignedDocument_downloadAuditTrailDocument,
          {
            signatureId: params.signatureId,
          },
        );
        if (signedPetitionDownloadLink.result === "FAILURE") {
          throw new BadRequestError("The document is not yet ready to be downloaded");
        } else {
          if (query.noredirect) {
            return Created(
              { file: signedPetitionDownloadLink.url! },
              signedPetitionDownloadLink.url!,
            );
          } else {
            return Redirect(signedPetitionDownloadLink.url!);
          }
        }
      },
    );

  api
    .path("/petitions/:petitionId/profiles", { params: { petitionId } })
    .get(
      {
        operationId: "GetPetitionProfiles",
        summary: "List parallel profiles",
        description: outdent`
          Returns a list of all profiles associated to the parallel.
        `,
        query: {
          ...profileIncludeParam,
          type: stringParam({
            description: "List of profile type IDs to filter by",
            example: [toGlobalId("ProfileType", 1), toGlobalId("ProfileType", 2)].join(","),
            required: false,
            array: true,
          }),
        },
        tags: ["Parallels"],
        responses: { 200: SuccessResponse(ListOfProfiles) },
      },
      async ({ client, params, query }) => {
        const _query = gql`
          query GetPetitionProfiles_petition(
            $petitionId: GID!
            $includeFields: Boolean!
            $includeSubscribers: Boolean!
          ) {
            petition(id: $petitionId) {
              __typename
              ... on Petition {
                profiles {
                  ...Profile
                }
              }
            }
          }
          ${ProfileFragment}
        `;

        const response = await client.request(GetPetitionProfiles_petitionDocument, {
          petitionId: params.petitionId,
          ...getProfileIncludesFromQuery(query),
        });

        if (response.petition?.__typename !== "Petition") {
          return Ok([]);
        }

        return Ok(
          response.petition.profiles
            .filter((p) => !isDefined(query.type) || query.type.includes(p.profileType.id))
            .map(mapProfile),
        );
      },
    )
    .post(
      {
        operationId: "AssociatePetitionToProfile",
        summary: "Associate a profile",
        description: "Associates the parallel with a profile.",
        body: JsonBody(AssociatePetitionToProfileInput),
        query: {
          ...profileIncludeParam,
        },
        responses: {
          200: SuccessResponse(Profile),
          409: ErrorResponse({
            description: "The profile is already associated to the parallel",
          }),
        },
        tags: ["Parallels"],
      },
      async ({ client, params, body, query }) => {
        const _mutation = gql`
          mutation AssociatePetitionToProfile_associateProfileToPetition(
            $profileId: GID!
            $petitionId: GID!
            $includeFields: Boolean!
            $includeSubscribers: Boolean!
          ) {
            associateProfileToPetition(profileId: $profileId, petitionId: $petitionId) {
              profile {
                ...Profile
              }
            }
          }
          ${ProfileFragment}
        `;

        try {
          const response = await client.request(
            AssociatePetitionToProfile_associateProfileToPetitionDocument,
            {
              profileId: body.profileId,
              petitionId: params.petitionId,
              ...getProfileIncludesFromQuery(query),
            },
          );

          assert("id" in response.associateProfileToPetition.profile);

          return Ok(mapProfile(response.associateProfileToPetition.profile));
        } catch (error) {
          if (containsGraphQLError(error, "PROFILE_ALREADY_ASSOCIATED_TO_PETITION")) {
            throw new ConflictError("The profile is already associated to this parallel");
          }
          throw error;
        }
      },
    );

  api
    .path("/petitions/:petitionId/profiles/:profileId", { params: { petitionId, profileId } })
    .delete(
      {
        operationId: "DisassociateProfileFromPetition",
        summary: "Disassociate a profile",
        description: "Disassociates the parallel from a profile.",
        responses: {
          200: SuccessResponse(),
          409: ErrorResponse({
            description: "The profile is not associated to this parallel",
          }),
        },
        tags: ["Parallels"],
      },
      async ({ client, params }) => {
        const _mutation = gql`
          mutation DisassociateProfileFromPetition_disassociateProfileFromPetition(
            $petitionId: GID!
            $profileIds: [GID!]!
          ) {
            disassociateProfileFromPetition(profileIds: $profileIds, petitionId: $petitionId)
          }
        `;

        try {
          await client.request(
            DisassociateProfileFromPetition_disassociateProfileFromPetitionDocument,
            {
              profileIds: [params.profileId],
              petitionId: params.petitionId,
            },
          );
          return NoContent();
        } catch (error) {
          if (containsGraphQLError(error, "PROFILE_NOT_ASSOCIATED_TO_PETITION")) {
            throw new ConflictError("The profile is not associated to this parallel");
          }
          throw error;
        }
      },
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
        ...templateIncludeParam,
        tags: stringParam({
          description: "List of tags to filter by",
          example: "todo,assigned",
          required: false,
          array: true,
        }),
      },
      responses: { 200: SuccessResponse(PaginatedTemplates) },
      tags: ["Templates"],
    },
    async ({ client, query }) => {
      let tags: PetitionTagFilter | undefined = undefined;
      if (isDefined(query.tags)) {
        try {
          tags = await buildTagsFilter(client, query.tags);
        } catch (e) {
          if (e instanceof Error && e.message === "UNKNOWN_TAG_NAME") {
            return Ok({ totalCount: 0, items: [] });
          }
        }
      }
      const _query = gql`
        query GetTemplates_templates(
          $offset: Int!
          $limit: Int!
          $tags: PetitionTagFilter
          $sortBy: [QueryPetitions_OrderBy!]
          $includeFields: Boolean!
          $includeTags: Boolean!
        ) {
          templates: petitions(
            offset: $offset
            limit: $limit
            sortBy: $sortBy
            filters: { type: TEMPLATE, tags: $tags }
          ) {
            items {
              ...Template
            }
            totalCount
          }
        }
        ${TemplateFragment}
      `;
      const result = await client.request(GetTemplates_templatesDocument, {
        ...pick(query, ["offset", "limit", "sortBy"]),
        tags,
        includeFields: query.include?.includes("fields") ?? false,
        includeTags: query.include?.includes("tags") ?? false,
      });
      const { items, totalCount } = result.templates;
      assertType<TemplateFragmentType[]>(items);
      return Ok({ items: items.map((t) => mapTemplate(t)), totalCount });
    },
  );

  api
    .path("/templates/:templateId", {
      params: { templateId },
    })
    .get(
      {
        operationId: "GetTemplate",
        summary: "Get template",
        description: outdent`
        Returns the specified template.
      `,
        query: {
          ...templateIncludeParam,
        },
        responses: { 200: SuccessResponse(Template) },
        tags: ["Templates"],
      },
      async ({ client, params, query }) => {
        const _query = gql`
          query GetTemplate_template(
            $templateId: GID!
            $includeFields: Boolean!
            $includeTags: Boolean!
          ) {
            template: petition(id: $templateId) {
              ...Template
            }
          }
          ${TemplateFragment}
        `;
        const result = await client.request(GetTemplate_templateDocument, {
          templateId: params.templateId,
          includeFields: query.include?.includes("fields") ?? false,
          includeTags: query.include?.includes("tags") ?? false,
        });
        assert("id" in result.template!);
        return Ok(mapTemplate(result.template!));
      },
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
        } catch (error) {
          if (containsGraphQLError(error, "DELETE_SHARED_PETITION_ERROR")) {
            throw new BadRequestError(
              "The template is being shared with another user. Set force=true to delete.",
            );
          }
          throw error;
        }
      },
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
          query GetContacts_contacts(
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
        `;
        const result = await client.request(GetContacts_contactsDocument, query);
        return Ok(result.contacts);
      },
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
        },
        tags: ["Contacts"],
      },
      async ({ client, body }) => {
        try {
          const _mutation = gql`
            mutation CreateContact_contact($data: CreateContactInput!) {
              createContact(data: $data) {
                ...Contact
              }
            }
            ${ContactFragment}
          `;
          const result = await client.request(CreateContact_contactDocument, { data: body });
          return Created(result.createContact!);
        } catch (error) {
          if (containsGraphQLError(error, "ARG_VALIDATION_ERROR")) {
            const { email, error_code: errorCode } = error.response.errors![0].extensions.extra as {
              email: string;
              error_code: string;
            };
            if (errorCode === "INVALID_EMAIL_ERROR" || errorCode === "INVALID_MX_EMAIL_ERROR") {
              throw new BadRequestError(`${email} is not a valid email`);
            }
          }

          throw error;
        }
      },
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
          query GetContact_contact($contactId: GID!) {
            contact(id: $contactId) {
              ...Contact
            }
          }
          ${ContactFragment}
        `;
        const result = await client.request(GetContact_contactDocument, {
          contactId: params.contactId,
        });
        return Ok(result.contact!);
      },
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
        query GetOrganizationUsers_users(
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
      const result = await client.request(GetOrganizationUsers_usersDocument, query);
      return Ok(result.me.organization.users);
    },
  );

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
          query EventSubscriptions_getSubscriptions {
            subscriptions {
              ...EventSubscription
            }
          }
          ${EventSubscriptionFragment}
        `;
        const result = await client.request(EventSubscriptions_getSubscriptionsDocument);
        return Ok(result.subscriptions.map(mapSubscription));
      },
    )
    .post(
      {
        operationId: "CreateSubscription",
        summary: "Create subscription",
        description: outdent`Creates a new event subscription on any of your parallels of profiles.`,
        body: JsonBody(CreateEventSubscription),
        responses: {
          201: SuccessResponse(EventSubscription),
          400: ErrorResponse({ description: "Invalid request" }),
        },
        callbacks: {
          PetitionEventCreated: {
            "{$request.body#/eventsUrl}": {
              post: {
                operationId: "PetitionEventCreated",
                summary: "New Parallel Event",
                description: outdent`
                A new event was triggered on one of your subscribed parallels.
                
                A POST request will be sent to the provided events URL containing the event information.
                
                Additionally, if you created one or more signature keys, special headers will be sent with the request, containing the event signatures. You can read more about signature verification in [this help center article](https://help.onparallel.com/en/articles/7035199-event-subscriptions-and-signature-keys).
              `,
                requestBody: {
                  required: true,
                  content: { "application/json": { schema: PetitionEvent as any } },
                },
                responses: {
                  "200": {
                    description:
                      "Your server implementation should return this HTTP status code\nif the data was received successfully\n",
                  },
                },
              },
            },
          },
          ProfileEventCreated: {
            "{$request.body#/eventsUrl}": {
              post: {
                operationId: "ProfileEventCreated",
                summary: "New Profile Event",
                description: outdent`
                A new event was triggered on one of your subscribed profiles.
                
                A POST request will be sent to the provided events URL containing the event information.
                
                Additionally, if you created one or more signature keys, special headers will be sent with the request, containing the event signatures. You can read more about signature verification in [this help center article](https://help.onparallel.com/en/articles/7035199-event-subscriptions-and-signature-keys).
              `,
                requestBody: {
                  required: true,
                  content: { "application/json": { schema: ProfileEvent as any } },
                },
                responses: {
                  "200": {
                    description:
                      "Your server implementation should return this HTTP status code\nif the data was received successfully\n",
                  },
                },
              },
            },
          },
        },
        tags: ["Subscriptions"],
      },
      async ({ client, body }) => {
        const _petitionMutation = gql`
          mutation EventSubscriptions_createPetitionEventSubscription(
            $eventsUrl: String!
            $eventTypes: [PetitionEventType!]
            $name: String
            $fromTemplateId: GID
          ) {
            createPetitionEventSubscription(
              eventsUrl: $eventsUrl
              eventTypes: $eventTypes
              name: $name
              fromTemplateId: $fromTemplateId
            ) {
              ...PetitionEventSubscription
            }
          }
          ${PetitionEventSubscriptionFragment}
        `;
        const _profileMutation = gql`
          mutation EventSubscriptions_createProfileEventSubscription(
            $eventsUrl: String!
            $eventTypes: [ProfileEventType!]
            $name: String
            $fromProfileTypeId: GID
          ) {
            createProfileEventSubscription(
              eventsUrl: $eventsUrl
              eventTypes: $eventTypes
              name: $name
              fromProfileTypeId: $fromProfileTypeId
            ) {
              ...ProfileEventSubscription
            }
          }
          ${ProfileEventSubscriptionFragment}
        `;
        try {
          if (body.type === "PETITION") {
            const result = await client.request(
              EventSubscriptions_createPetitionEventSubscriptionDocument,
              {
                eventsUrl: body.eventsUrl,
                eventTypes: body.eventTypes,
                name: body.name,
                fromTemplateId: body.fromTemplateId,
              },
            );

            return Created(mapSubscription(result.createPetitionEventSubscription));
          } else {
            const result = await client.request(
              EventSubscriptions_createProfileEventSubscriptionDocument,
              {
                eventsUrl: body.eventsUrl,
                eventTypes: body.eventTypes,
                name: body.name,
                fromProfileTypeId: body.fromProfileTypeId,
              },
            );

            return Created(mapSubscription(result.createProfileEventSubscription));
          }
        } catch (error) {
          if (containsGraphQLError(error, "ARG_VALIDATION_ERROR")) {
            throw new BadRequestError("Invalid request body. Please verify your eventsUrl");
          }
          if (containsGraphQLError(error, "WEBHOOK_CHALLENGE_FAILED")) {
            throw new BadRequestError(`Your URL does not seem to accept POST requests.`);
          }

          throw error;
        }
      },
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
        mutation EventSubscriptions_deleteSubscription($ids: [GID!]!) {
          deleteEventSubscriptions(ids: $ids)
        }
      `;
      await client.request(EventSubscriptions_deleteSubscriptionDocument, {
        ids: [params.subscriptionId],
      });
      return NoContent();
    },
  );

  api.path("/petition-events").get(
    {
      operationId: "GetPetitionEvents",
      summary: "Get your latest petition events",
      excludeFromSpec: true,
      description: "Returns a list with your latest parallel events",
      query: {
        before: idParam({
          type: "PetitionEvent",
          description: "Fetch events that ocurred before this ID",
          required: false,
        }),
        eventTypes: enumParam({
          values: PetitionEventTypeValues,
          description: "Filter events by types",
          required: false,
          array: true,
        }),
      },
      responses: { 200: SuccessResponse(ListOfPetitionEvents) },
    },
    async ({ client, query }) => {
      const _query = gql`
        query GetPetitionEvents_PetitionEvents($before: GID, $eventTypes: [PetitionEventType!]) {
          petitionEvents(before: $before, eventTypes: $eventTypes) {
            id
            data
            petition {
              id
            }
            type
            createdAt
          }
        }
      `;

      const result = await client.request(GetPetitionEvents_PetitionEventsDocument, {
        before: query.before,
        eventTypes: query.eventTypes,
      });

      return Ok(
        result.petitionEvents
          .filter((e) => isDefined(e.petition))
          .map((e) => ({
            id: e.id,
            petitionId: e.petition!.id,
            type: e.type,
            data: e.data,
            createdAt: e.createdAt,
          })),
      );
    },
  );

  api.path("/profile-events").get(
    {
      operationId: "GetProfileEvents",
      summary: "Get your latest profile events",
      excludeFromSpec: true,
      description: "Returns a list with your latest profile events",
      query: {
        before: idParam({
          type: "ProfileEvent",
          description: "Fetch events that ocurred before this ID",
          required: false,
        }),
        eventTypes: enumParam({
          values: ProfileEventTypeValues,
          description: "Filter events by types",
          required: false,
          array: true,
        }),
      },
      responses: { 200: SuccessResponse(ListOfProfileEvents) },
    },
    async ({ client, query }) => {
      const _query = gql`
        query GetProfileEvents_ProfileEvents($before: GID, $eventTypes: [ProfileEventType!]) {
          profileEvents(before: $before, eventTypes: $eventTypes) {
            id
            data
            profile {
              id
            }
            type
            createdAt
          }
        }
      `;

      const result = await client.request(GetProfileEvents_ProfileEventsDocument, {
        before: query.before,
        eventTypes: query.eventTypes,
      });

      return Ok(
        result.profileEvents
          .filter((e) => isDefined(e.profile))
          .map((e) => ({
            id: e.id,
            profileId: e.profile!.id,
            type: e.type,
            data: e.data,
            createdAt: e.createdAt,
          })),
      );
    },
  );

  api
    .path("/profiles")
    .get(
      {
        operationId: "GetProfiles",
        summary: "Get your profiles",
        description: "Returns a paginated list with all your organization profiles",
        query: {
          ...paginationParams(),
          ...profileIncludeParam,
          ...sortByParam(["createdAt", "name"]),
          search: stringParam({
            description: "Search profiles by name",
            required: false,
          }),
          profileTypeIds: stringParam({
            description: "List of profile type IDs to filter by",
            example: [toGlobalId("ProfileType", 1), toGlobalId("ProfileType", 2)].join(","),
            required: false,
            array: true,
          }),
          status: stringParam({
            description: "Filter profiles by status",
            example: "OPEN",
            required: false,
            array: true,
          }),
        },
        responses: { 200: SuccessResponse(PaginatedProfiles) },
        tags: ["Profiles"],
      },
      async ({ client, query }) => {
        const _query = gql`
          query GetProfiles_profiles(
            $offset: Int
            $limit: Int
            $sortBy: [QueryProfiles_OrderBy!]
            $search: String
            $profileTypeIds: [GID!]
            $status: [ProfileStatus!]
            $includeFields: Boolean!
            $includeSubscribers: Boolean!
          ) {
            profiles(
              offset: $offset
              limit: $limit
              sortBy: $sortBy
              search: $search
              filter: { profileTypeId: $profileTypeIds, status: $status }
            ) {
              totalCount
              items {
                ...Profile
              }
            }
          }
          ${ProfileFragment}
        `;

        const result = await client.request(GetProfiles_profilesDocument, {
          ...pick(query, ["offset", "limit", "sortBy", "search", "profileTypeIds"]),
          status: query.status as ProfileStatus[] | undefined,
          ...getProfileIncludesFromQuery(query),
        });
        return Ok({
          totalCount: result.profiles.totalCount,
          items: result.profiles.items.map(mapProfile),
        });
      },
    )
    .post(
      {
        operationId: "CreateProfile",
        summary: "Create a profile",
        description: "Creates a new profile on your organization",
        middleware: anyFileUploadMiddleware(),
        body: Body(
          [
            JsonBodyContent(CreateProfile),
            FormDataBodyContent(CreateProfile, {
              example: outdent`
                profileTypeId: ${toGlobalId("ProfileType", 42)}
                subscribe: true
                values.p_first_name: John
                values.p_id.value: 11111111H
                values.p_id.expiryDate: 2032-04-26
              `,
            }),
          ],
          {
            description: outdent`
          Create a profile and optionally pass the initial values by setting the \`values\` property.
          Values is a key value object where the keys are the alias of the fields and the values are the value you want to store on the profile.
          
          Example:
          \`\`\`json
          {
            "profileTypeId": "${toGlobalId("ProfileType", 42)}"
            "values": {
              "p_first_name": "John",
              "p_last_name": "Smith"
            }
          }
          \`\`\`
          
          In case you want to set the expiry date of a field, instead of the value you can pass and object as shown below
          
          \`\`\`json
          {
            "profileTypeId": "${toGlobalId("ProfileType", 42)}"
            "values": {
              "p_id": {"value": "11111111H", "expiryDate": "2031-05-28"}
            }
          }
          \`\`\`
          
          In order to fill FILE type fields, your request needs to be a \`multipart/form-data\` request instead of an \`application/json\` one.
          
          The schema of the payload would be the same:
          - \`profileTypeId\`: \`${toGlobalId("ProfileType", 42)}\`
          - \`values.p_id_document\`: \`FILE\`

          or if you also want to set the expiry date:
          - \`profileTypeId\`: \`${toGlobalId("ProfileType", 42)}\`
          - \`values.p_id_document.value\`: \`FILE\`
          - \`values.p_id_document.expiryDate\`: \`2031-05-28\`

        `,
          },
        ),
        query: profileIncludeParam,
        responses: {
          201: SuccessResponse(Profile),
          400: ErrorResponse({ description: "Invalid request body" }),
          403: ErrorResponse({ description: "You don't have access to this resource" }),
        },
        tags: ["Profiles"],
      },
      async ({ client, body, query, files }) => {
        const _query = gql`
          query CreateProfile_profileType($profileTypeId: GID!) {
            profileType(profileTypeId: $profileTypeId) {
              fields {
                id
                type
                alias
                isExpirable
              }
            }
          }
        `;
        const _mutations = [
          gql`
            mutation CreateProfile_createProfile(
              $profileTypeId: GID!
              $subscribe: Boolean
              $fields: [UpdateProfileFieldValueInput!]
              $includeFields: Boolean!
              $includeSubscribers: Boolean!
            ) {
              createProfile(profileTypeId: $profileTypeId, subscribe: $subscribe, fields: $fields) {
                ...Profile
              }
            }
            ${ProfileFragment}
          `,
          gql`
            mutation CreateProfile_createProfileFieldFileUploadLink(
              $profileId: GID!
              $profileTypeFieldId: GID!
              $expiryDate: Date
              $data: [FileUploadInput!]!
            ) {
              createProfileFieldFileUploadLink(
                profileId: $profileId
                profileTypeFieldId: $profileTypeFieldId
                expiryDate: $expiryDate
                data: $data
              ) {
                uploads {
                  file {
                    id
                  }
                  presignedPostData {
                    url
                    fields
                  }
                }
              }
            }
          `,
          gql`
            mutation CreateProfile_profileFieldFileUploadComplete(
              $profileId: GID!
              $profileTypeFieldId: GID!
              $profileFieldFileIds: [GID!]!
              $includeFields: Boolean!
              $includeSubscribers: Boolean!
            ) {
              profileFieldFileUploadComplete(
                profileId: $profileId
                profileTypeFieldId: $profileTypeFieldId
                profileFieldFileIds: $profileFieldFileIds
              ) {
                profile {
                  ...Profile
                }
              }
            }
          `,
        ];

        try {
          const { profileType } = await client.request(CreateProfile_profileTypeDocument, {
            profileTypeId: body.profileTypeId,
          });

          const profileTypeFields = profileType.fields.filter((f) => isDefined(f.alias));

          const createFields: UpdateProfileFieldValueInput[] = [];
          const uploadFiles: {
            alias: string;
            expiryDate?: string;
            value: Express.Multer.File[];
          }[] = [];

          try {
            for (const [field, content, expiryDate] of parseProfileTypeFieldInput(
              Object.assign({}, body?.values ?? {}, files?.values ?? {}),
              profileTypeFields,
              files?.values ?? {},
            )) {
              if (content?.value !== null) {
                if (field.type === "FILE") {
                  uploadFiles.push({
                    alias: field.alias!,
                    ...(content as any),
                    expiryDate,
                  });
                } else {
                  createFields.push({
                    profileTypeFieldId: field.id,
                    content,
                    expiryDate,
                  });
                }
              }
            }
          } catch (e) {
            if (e instanceof Error) {
              throw new BadRequestError(e.message);
            }
            throw e;
          }

          const result = await client.request(CreateProfile_createProfileDocument, {
            profileTypeId: body.profileTypeId,
            subscribe: body.subscribe === true || body.subscribe === "true",
            fields: createFields,
            ...getProfileIncludesFromQuery(query),
          });
          assert("id" in result.createProfile);

          for (const fileField of uploadFiles) {
            const profileTypeField = profileTypeFields.find((f) => f.alias === fileField.alias)!;
            const {
              createProfileFieldFileUploadLink: { uploads },
            } = await client.request(CreateProfile_createProfileFieldFileUploadLinkDocument, {
              profileId: result.createProfile.id,
              profileTypeFieldId: profileTypeField.id,
              data:
                fileField.value?.map((file) => ({
                  contentType: file.mimetype,
                  filename: file.originalname,
                  size: file.size,
                })) ?? [],
              expiryDate: fileField.expiryDate,
            });

            for (const [file, uploadData] of zip(fileField.value ?? [], uploads)) {
              await uploadFile(file, uploadData.presignedPostData);
            }

            const { profileFieldFileUploadComplete: uploadComplete } = await client.request(
              CreateProfile_profileFieldFileUploadCompleteDocument,
              {
                profileId: result.createProfile.id,
                profileTypeFieldId: profileTypeField.id,
                profileFieldFileIds: uploads.map((upload) => upload.file.id),
                ...getProfileIncludesFromQuery(query),
              },
            );

            assert("id" in uploadComplete[0].profile);
            return Created(mapProfile(uploadComplete[0].profile));
          }

          return Created(mapProfile(result.createProfile));
        } catch (error) {
          if (containsGraphQLError(error, "EXPIRY_ON_NON_EXPIRABLE_FIELD")) {
            throw new BadRequestError("You can't set an expiry date on a non-expirable field");
          }
          if (containsGraphQLError(error, "INVALID_PROFILE_FIELD_VALUE")) {
            throw new BadRequestError(
              error.response.errors?.[0]?.message ?? "INVALID_PROFILE_FIELD_VALUE",
              { errors: error.response.errors?.[0]?.extensions.aggregatedErrors ?? [] },
            );
          }
          throw error;
        }
      },
    );

  api
    .path("/profiles/:profileId", { params: { profileId } })
    .get(
      {
        operationId: "GetProfile",
        summary: "Get a profile",
        description: "Returns the specified profile",
        query: profileIncludeParam,
        responses: { 200: SuccessResponse(Profile) },
        tags: ["Profiles"],
      },
      async ({ client, params, query }) => {
        const _query = gql`
          query GetProfile_profile(
            $profileId: GID!
            $includeFields: Boolean!
            $includeSubscribers: Boolean!
          ) {
            profile(profileId: $profileId) {
              ...Profile
            }
          }
          ${ProfileFragment}
        `;

        const result = await client.request(GetProfile_profileDocument, {
          profileId: params.profileId,
          ...getProfileIncludesFromQuery(query),
        });
        assert("id" in result.profile);
        return Ok(mapProfile(result.profile));
      },
    )
    .put(
      {
        operationId: "UpdateProfileFieldValue",
        summary: "Update a profile",
        description: outdent`
        Updates the values of a profile.

        The profile has to be in \`OPEN\` status.
      `,
        tags: ["Profiles"],
        middleware: anyFileUploadMiddleware(),
        body: Body(
          [
            JsonBodyContent(UpdateProfileFieldValue),
            FormDataBodyContent(UpdateProfileFieldValue, {
              example: outdent`
                values.p_first_name: John
                values.p_id.value: 11111111H
                values.p_id.expiryDate: 2032-04-26
              `,
            }),
          ],
          {
            description: outdent`
              Update a profile values by setting the \`values\` property.
              Values is a key value object where the keys are the alias of the fields and the values are the value you want to store on the profile.
              
              Example:
              \`\`\`json
              {
                "values": {
                  "p_first_name": "John",
                  "p_last_name": "Smith"
                }
              }
              \`\`\`
              
              In case you want to update the expiry date of a field, instead of the value you can pass and object as shown below
              
              \`\`\`json
              {
                "values": {
                  "p_id": {"value": "11111111H", "expiryDate": "2031-05-28"}
                }
              }
              \`\`\`
              *(you can also pass just the expiry date if you don't intend to update the value of the field.)*

              In case you want to remove an existing value, you can pass \`null\` as the value.

              \`\`\`json
              {
                "values": {
                  "p_first_name": null
                }
              }
              \`\`\`
              
              In order to update FILE type fields, your request needs to be a \`multipart/form-data\` request instead of an \`application/json\` one.
              Files will be added to the current uploaded files on the value.

              The schema of the payload would be the same:
              - \`values.p_id_document\`: \`FILE\`

              or if you want to update the expiry date:
              - \`values.p_id_document.value\`: \`FILE\`
              - \`values.p_id_document.expiryDate\`: \`2031-05-28\`

              if you want to remove every uploaded file, you can leave the value empty.
            `,
          },
        ),
        responses: {
          200: SuccessResponse(Profile),
          400: ErrorResponse({ description: "Invalid request body" }),
          403: ErrorResponse({ description: "You don't have access to this resource" }),
        },
      },
      async ({ client, params, body, files }) => {
        const _query = gql`
          query UpdateProfileFieldValue_profile(
            $profileId: GID!
            $includeFields: Boolean!
            $includeSubscribers: Boolean!
          ) {
            profile(profileId: $profileId) {
              ...Profile
            }
          }
          ${ProfileFragment}
        `;

        const _mutations = [
          gql`
            mutation UpdateProfileFieldValue_updateProfileFieldValue(
              $profileId: GID!
              $fields: [UpdateProfileFieldValueInput!]!
            ) {
              updateProfileFieldValue(profileId: $profileId, fields: $fields) {
                id
              }
            }
          `,
          gql`
            mutation UpdateProfileFieldValue_createProfileFieldFileUploadLink(
              $profileId: GID!
              $profileTypeFieldId: GID!
              $data: [FileUploadInput!]!
              $expiryDate: Date
            ) {
              createProfileFieldFileUploadLink(
                profileId: $profileId
                profileTypeFieldId: $profileTypeFieldId
                data: $data
                expiryDate: $expiryDate
              ) {
                uploads {
                  file {
                    id
                  }
                  presignedPostData {
                    fields
                    url
                  }
                }
              }
            }
          `,
          gql`
            mutation UpdateProfileFieldValue_profileFieldFileUploadComplete(
              $profileId: GID!
              $profileTypeFieldId: GID!
              $profileFieldFileIds: [GID!]!
            ) {
              profileFieldFileUploadComplete(
                profileId: $profileId
                profileTypeFieldId: $profileTypeFieldId
                profileFieldFileIds: $profileFieldFileIds
              ) {
                id
              }
            }
          `,
          gql`
            mutation UpdateProfileFieldValue_deleteProfileFieldFile(
              $profileId: GID!
              $profileTypeFieldId: GID!
            ) {
              deleteProfileFieldFile(profileId: $profileId, profileTypeFieldId: $profileTypeFieldId)
            }
          `,
        ];

        const { profile } = await client.request(UpdateProfileFieldValue_profileDocument, {
          profileId: params.profileId,
          includeFields: true,
          includeSubscribers: false,
        });

        const profileTypeFields = profile.values
          .filter((v) => isDefined(v.field.alias))
          .map((v) => v.field);

        const updateFields: UpdateProfileFieldValueInput[] = [];
        const deleteFileFields: { id: string }[] = [];
        const uploadFiles: {
          alias: string;
          expiryDate?: string;
          value: Express.Multer.File[];
        }[] = [];
        try {
          for (const [field, content, expiryDate] of parseProfileTypeFieldInput(
            Object.assign({}, body?.values ?? {}, files?.values ?? {}),
            profileTypeFields,
            files?.values ?? {},
          )) {
            if (field.type === "FILE") {
              if (content?.value === null || content?.value === "") {
                deleteFileFields.push({ id: field.id });
              } else {
                uploadFiles.push({ alias: field.alias!, ...(content as any), expiryDate });
              }
            } else {
              updateFields.push({
                profileTypeFieldId: field.id,
                content,
                expiryDate,
              });
            }
          }
        } catch (e) {
          if (e instanceof Error) {
            throw new BadRequestError(e.message);
          }
          throw e;
        }

        try {
          if (updateFields.length > 0) {
            await client.request(UpdateProfileFieldValue_updateProfileFieldValueDocument, {
              profileId: params.profileId,
              fields: updateFields,
            });
          }

          for (const fileField of uploadFiles) {
            const profileTypeField = profile.values.find(
              (v) => v.field.alias === fileField.alias,
            )!.field;

            const {
              createProfileFieldFileUploadLink: { uploads },
            } = await client.request(
              UpdateProfileFieldValue_createProfileFieldFileUploadLinkDocument,
              {
                profileId: params.profileId,
                profileTypeFieldId: profileTypeField.id,
                data:
                  fileField.value?.map((file) => ({
                    contentType: file.mimetype,
                    filename: file.originalname,
                    size: file.size,
                  })) ?? [],
                expiryDate: fileField.expiryDate,
              },
            );

            for (const [file, uploadData] of zip(fileField.value ?? [], uploads)) {
              await uploadFile(file, uploadData.presignedPostData);
            }

            if (uploads.length > 0) {
              await client.request(UpdateProfileFieldValue_profileFieldFileUploadCompleteDocument, {
                profileId: params.profileId,
                profileTypeFieldId: profileTypeField.id,
                profileFieldFileIds: uploads.map((upload) => upload.file.id),
              });
            }
          }

          for (const fileField of deleteFileFields) {
            await client.request(UpdateProfileFieldValue_deleteProfileFieldFileDocument, {
              profileId: params.profileId,
              profileTypeFieldId: fileField.id,
            });
          }
        } catch (error) {
          if (containsGraphQLError(error, "INVALID_PROFILE_FIELD_VALUE")) {
            throw new BadRequestError(
              error.response.errors?.[0]?.message ?? "INVALID_PROFILE_FIELD_VALUE",
              { errors: error.response.errors?.[0]?.extensions.aggregatedErrors ?? [] },
            );
          }
          throw error;
        }

        const profileQuery = await client.request(UpdateProfileFieldValue_profileDocument, {
          profileId: params.profileId,
          ...getProfileIncludesFromQuery({ include: ["fields"] }),
        });

        assert("id" in profileQuery.profile);
        return Ok(mapProfile(profileQuery.profile));
      },
    );

  api
    .path("/profiles/:profileId/subscribers", { params: { profileId } })
    .get(
      {
        operationId: "GetProfileSubscribers",
        summary: "List profile subscribers",
        description: "Returns a list with all the users subscribed to the specified profile",
        tags: ["Profiles"],
        responses: { 200: SuccessResponse(ListOfProfileSubscriptions) },
      },
      async ({ client, params }) => {
        const _query = gql`
          query GetProfileSubscribers_profile($profileId: GID!) {
            profile(profileId: $profileId) {
              subscribers {
                user {
                  ...User
                }
              }
            }
          }
          ${UserFragment}
        `;

        const result = await client.request(GetProfileSubscribers_profileDocument, {
          profileId: params.profileId,
        });

        return Ok(result.profile.subscribers);
      },
    )
    .post(
      {
        operationId: "SubscribeToProfile",
        summary: "Subscribe to a profile",
        description: "Subscribes a user to the specified profile",
        tags: ["Profiles"],
        body: JsonBody(ProfileSubscriptionInput(true)),
        query: profileIncludeParam,
        responses: {
          201: SuccessResponse(Profile),
        },
      },
      async ({ client, params, body, query }) => {
        const _mutation = gql`
          mutation SubscribeToProfile_subscribeToProfile(
            $profileId: GID!
            $userIds: [GID!]!
            $includeFields: Boolean!
            $includeSubscribers: Boolean!
          ) {
            subscribeToProfile(profileIds: [$profileId], userIds: $userIds) {
              ...Profile
            }
          }
          ${ProfileFragment}
        `;
        const response = await client.request(SubscribeToProfile_subscribeToProfileDocument, {
          profileId: params.profileId,
          userIds: body.userIds,
          ...getProfileIncludesFromQuery(query),
        });

        assert(response.subscribeToProfile.length === 1);
        assert("id" in response.subscribeToProfile[0]);

        return Created(mapProfile(response.subscribeToProfile[0]));
      },
    )
    .delete(
      {
        operationId: "UnsubscribeFromProfile",
        summary: "Unsubscribe from a profile",
        description: "Unsubscribes a user from the specified profile",
        tags: ["Profiles"],
        query: profileIncludeParam,
        body: JsonBody(ProfileSubscriptionInput(false)),
        responses: {
          200: SuccessResponse(Profile),
        },
      },
      async ({ client, params, query, body }) => {
        const _mutation = gql`
          mutation UnsubscribeFromProfile_unsubscribeFromProfile(
            $profileId: GID!
            $userIds: [GID!]!
            $includeFields: Boolean!
            $includeSubscribers: Boolean!
          ) {
            unsubscribeFromProfile(profileIds: [$profileId], userIds: $userIds) {
              ...Profile
            }
          }
          ${ProfileFragment}
        `;

        const response = await client.request(
          UnsubscribeFromProfile_unsubscribeFromProfileDocument,
          {
            profileId: params.profileId,
            userIds: body.userIds,
            ...getProfileIncludesFromQuery(query),
          },
        );

        assert(response.unsubscribeFromProfile.length === 1);
        assert("id" in response.unsubscribeFromProfile[0]);

        return Ok(mapProfile(response.unsubscribeFromProfile[0]));
      },
    );

  api.path("/templates/:templateId/send", { params: { templateId } }).post(
    {
      // this endpoint is for Parc Taulí use case, don't expose it in the API docs
      excludeFromSpec: true,
      middleware: singleFileUploadMiddleware("file"),
      body: FormDataBody({ type: "object", format: "binary" }),
    },
    async ({ client, params, files }) => {
      const _mutations = gql`
        mutation BulkSendTemplate_createBulkPetitionSendTask(
          $templateId: GID!
          $temporaryFileId: GID!
        ) {
          createBulkPetitionSendTask(templateId: $templateId, temporaryFileId: $temporaryFileId) {
            ...Task
          }
        }
        ${TaskFragment}

        mutation BulkSendTemplate_uploadBulkPetitionSendTaskInputFile($file: FileUploadInput!) {
          uploadBulkPetitionSendTaskInputFile(file: $file)
        }
      `;
      const file = files?.["file"]?.[0];
      if (!file) {
        throw new BadRequestError("Input file is missing");
      }

      try {
        const fileUpload = await client.request(
          BulkSendTemplate_uploadBulkPetitionSendTaskInputFileDocument,
          { file: { contentType: file.mimetype, filename: file.originalname, size: file.size } },
        );

        const { temporaryFileId, presignedPostData } =
          fileUpload.uploadBulkPetitionSendTaskInputFile;

        await uploadFile(file, presignedPostData);

        const result = await client.request(BulkSendTemplate_createBulkPetitionSendTaskDocument, {
          templateId: params.templateId,
          temporaryFileId: temporaryFileId,
        });

        return Ok({ taskId: result.createBulkPetitionSendTask.id });
      } catch (error) {
        if (containsGraphQLError(error, "ARG_VALIDATION_ERROR")) {
          const { error_code: errorCode } = error.response.errors![0].extensions.extra as {
            error_code: string;
          };
          if (errorCode === "INVALID_CONTENT_TYPE_ERROR") {
            throw new BadRequestError(`File must be a CSV file`);
          }
          if (errorCode === "FILE_SIZE_EXCEEDED_ERROR") {
            throw new BadRequestError(`File size exceeded`);
          }
        }
        throw error;
      }
    },
  );

  api
    .path("/templates/:templateId/export", { params: { templateId } })
    .get({ excludeFromSpec: true }, async ({ client, params }) => {
      const _mutation = gql`
        mutation ExportTemplate_createTemplateRepliesCsvExportTask($templateId: GID!) {
          createTemplateRepliesCsvExportTask(templateId: $templateId) {
            ...Task
          }
        }
        ${TaskFragment}
      `;

      const result = await client.request(
        ExportTemplate_createTemplateRepliesCsvExportTaskDocument,
        {
          templateId: params.templateId,
        },
      );

      return Ok({ taskId: result.createTemplateRepliesCsvExportTask.id });
    });

  api
    .path("/tasks/:taskId/status", { params: { taskId: idParam({ type: "Task" }) } })
    .get({ excludeFromSpec: true }, async ({ client, params }) => {
      const _query = gql`
        query Task_TaskStatus($taskId: GID!) {
          task(id: $taskId) {
            id
            name
            progress
            status
            output
          }
        }
      `;

      const _mutation = gql`
        mutation Task_getTaskResultFile($taskId: GID!, $preview: Boolean) {
          getTaskResultFile(taskId: $taskId, preview: $preview) {
            url
          }
        }
      `;
      const result = await client.request(Task_TaskStatusDocument, {
        taskId: params.taskId,
        preview: true,
      });

      // for file exports, we return the file URL instead of task output
      if (
        result.task.status === "COMPLETED" &&
        result.task.name === "TEMPLATE_REPLIES_CSV_EXPORT"
      ) {
        const fileResult = await client.request(Task_getTaskResultFileDocument, {
          taskId: params.taskId,
        });

        return Ok({
          id: result.task.id,
          status: result.task.status,
          progress: (result.task.progress ?? 0) / 100,
          output: pick(fileResult.getTaskResultFile, ["url"]),
        });
      }

      return Ok({
        id: result.task.id,
        status: result.task.status,
        progress: (result.task.progress ?? 0) / 100,
        output: result.task.output,
      });
    });

  return api;
}

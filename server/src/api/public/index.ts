import stringify from "fast-safe-stringify";
import { unlink } from "fs/promises";
import { gql, GraphQLClient } from "graphql-request";
import { outdent } from "outdent";
import pMap from "p-map";
import { isDefined, omit, pick, uniq, zip } from "remeda";
import { EMAIL_REGEX } from "../../graphql/helpers/validators/validEmail";
import { isGlobalId, toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
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
  ClosePetition_closePetitionDocument,
  CreateContact_contactDocument,
  CreateOrUpdatePetitionCustomProperty_modifyPetitionCustomPropertyDocument,
  CreatePetition_petitionDocument,
  CreatePetitionRecipients_contactDocument,
  CreatePetitionRecipients_createContactDocument,
  CreatePetitionRecipients_petitionDocument,
  CreatePetitionRecipients_sendPetitionDocument,
  CreatePetitionRecipients_updateContactDocument,
  CreatePetitionRecipients_userByEmailDocument,
  CreateProfile_createProfileDocument,
  CreateProfile_updateProfileFieldValueDocument,
  CreateProfileFieldValue_createProfileFieldFileUploadLinkDocument,
  CreateProfileFieldValue_profileDocument,
  CreateProfileFieldValue_profileFieldFileUploadCompleteDocument,
  CreateProfileFieldValue_updateProfileFieldValueDocument,
  DeactivatePetitionRecipient_deactivateAccessesDocument,
  DeletePetition_deletePetitionsDocument,
  DeletePetitionCustomProperty_modifyPetitionCustomPropertyDocument,
  DeleteProfileFieldValue_deleteProfileFieldFileDocument,
  DeleteProfileFieldValue_profileDocument,
  DeleteProfileFieldValue_updateProfileFieldValueDocument,
  DeleteReply_deletePetitionReplyDocument,
  DeleteTemplate_deletePetitionsDocument,
  DisassociateProfileFromPetition_disassociateProfileFromPetitionDocument,
  DownloadFileReply_fileUploadReplyDownloadLinkDocument,
  DownloadSignedDocument_downloadAuditTrailDocument,
  DownloadSignedDocument_downloadSignedDocDocument,
  EventSubscriptions_createSubscriptionDocument,
  EventSubscriptions_deleteSubscriptionDocument,
  EventSubscriptions_getSubscriptionsDocument,
  ExportPetitionReplies_createExportRepliesTaskDocument,
  ExportPetitionReplies_createPrintPdfTaskDocument,
  GetContact_contactDocument,
  GetContacts_contactsDocument,
  GetMe_userDocument,
  GetOrganizationUsers_usersDocument,
  GetPermissions_permissionsDocument,
  GetPetition_petitionDocument,
  GetPetitionEvents_PetitionEventsDocument,
  GetPetitionProfiles_petitionDocument,
  GetPetitionRecipients_petitionAccessesDocument,
  GetPetitions_petitionsDocument,
  GetProfile_profileDocument,
  GetProfileFields_profileDocument,
  GetProfiles_profilesDocument,
  GetProfileSubscribers_profileDocument,
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
  RemoveUserGroupPermission_removePetitionPermissionDocument,
  RemoveUserPermission_removePetitionPermissionDocument,
  ReopenPetition_reopenPetitionDocument,
  SharePetition_addPetitionPermissionDocument,
  SharePetition_usersDocument,
  StartSignature_startSignatureRequestDocument,
  StopSharing_removePetitionPermissionDocument,
  SubmitReplies_bulkCreatePetitionRepliesDocument,
  SubmitReply_createFileUploadReplyCompleteDocument,
  SubmitReply_createFileUploadReplyDocument,
  SubmitReply_createPetitionFieldRepliesDocument,
  SubmitReply_petitionDocument,
  SubscribeToProfile_subscribeToProfileDocument,
  TagFragmentDoc,
  TagPetition_createTagDocument,
  TagPetition_tagPetitionDocument,
  TagPetition_tagsDocument,
  TemplateFragment as TemplateFragmentType,
  TransferPetition_searchUserByEmailDocument,
  TransferPetition_transferPetitionOwnershipDocument,
  UnsubscribeFromProfile_unsubscribeFromProfileDocument,
  UntagPetition_untagPetitionDocument,
  UpdatePetition_petitionDocument,
  UpdatePetition_updatePetitionDocument,
  UpdatePetitionField_updatePetitionFieldDocument,
  UpdatePetitionInput,
  UpdateProfileFieldValue_createProfileFieldFileUploadLinkDocument,
  UpdateProfileFieldValue_profileDocument,
  UpdateProfileFieldValue_profileFieldFileUploadCompleteDocument,
  UpdateProfileFieldValue_updateProfileFieldValueDocument,
  UpdateProfileFieldValueInput,
  UpdateReply_petitionDocument,
  UpdateReply_updateFileUploadReplyCompleteDocument,
  UpdateReply_updateFileUploadReplyDocument,
  UpdateReply_updatePetitionFieldRepliesDocument,
  UpdateReplyStatus_updatePetitionFieldRepliesStatusDocument,
  UserFragmentDoc,
} from "./__types";
import { description, newParallelEvent } from "./descriptions";
import {
  ContactFragment,
  PermissionFragment,
  PetitionAccessFragment,
  PetitionFieldFragment,
  PetitionFieldWithRepliesFragment,
  PetitionFragment,
  PetitionSignatureRequestFragment,
  PetitionTagFragment,
  ProfileFragment,
  SubscriptionFragment,
  TaskFragment,
  TemplateFragment,
  UserFragment,
} from "./fragments";
import {
  bodyMessageToRTE,
  buildSubmittedReplyContent,
  buildTagsFilter,
  containsGraphQLError,
  getTags,
  getTaskResultFileUrl,
  idParam,
  mapPetition,
  mapPetitionField,
  mapPetitionFieldRepliesContent,
  mapProfile,
  mapReplyResponse,
  mapSubscription,
  mapTemplate,
  paginationParams,
  sortByParam,
  uploadFile,
  waitForTask,
} from "./helpers";
import { anyFileUploadMiddleware, singleFileUploadMiddleware } from "./middleware";
import {
  _PetitionEvent,
  AssociatePetitionToProfileInput,
  Contact,
  CreateContact,
  CreateOrUpdatePetitionCustomProperty,
  CreatePetition,
  CreateProfile,
  CreateProfileFieldValue,
  CreateSubscription,
  ListOfPermissions,
  ListOfPetitionAccesses,
  ListOfPetitionEvents,
  ListOfPetitionFieldsWithReplies,
  ListOfProfileProperties,
  ListOfProfiles,
  ListOfProfileSubscriptions,
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
  petitionEventTypes,
  PetitionField,
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
  Subscription,
  TagPetition,
  Template,
  UpdatePetition,
  UpdatePetitionField,
  UpdateProfileFieldValueFormDataBody,
  UserWithOrg,
} from "./schemas";

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
      PetitionEvent: _PetitionEvent,
    },
  },
  "x-tagGroups": [
    {
      name: "Endpoints",
      tags: [
        "Parallels",
        "Parallel replies",
        "Parallel recipients",
        "Signatures",
        "Parallel Sharing",
        "Templates",
        "Tags",
        "Contacts",
        "Users",
        "Subscriptions",
        "Parallel Events",
        "Profiles",
      ],
    },
    { name: "Events", tags: ["Parallel Event"] },
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
      description: "Share your parallels with members of your organization for collaborative work",
    },
    {
      name: "Templates",
      description: "Use templates to quickly create new parallels for repetitive workflows",
    },
    {
      name: "Tags",
      description: "Use tags to organize your templates and parallels so you can find them faster",
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
      description: "Subscribe to our events to get real time updates on your parallels",
    },
    {
      name: "Parallel Event",
      description: "Subscribe to our events to get real time updates on your parallels",
    },
    {
      name: "Parallel Event",
      description: '<SchemaDefinition schemaRef="#/components/schemas/PetitionEvent" />',
    },
    { name: "Profiles", description: "Profiles allow you to store all your relevant information" },
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
});

function petitionIncludeParam({ includeRecipientUrl }: { includeRecipientUrl?: boolean } = {}) {
  return {
    include: enumParam({
      schemaTitle: "PetitionIncludeInResponse",
      description: "Include optional fields in the response",
      array: true,
      required: false,
      values: [
        "recipients",
        "fields",
        "tags",
        "replies",
        "progress",
        "signers",
        ...(includeRecipientUrl ? ["recipients.recipientUrl" as const] : []),
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
    values: ["fields", "fieldsByAlias", "subscribers"],
  }),
};

function getProfileIncludesFromQuery<
  Q extends {
    include: (typeof profileIncludeParam)["include"] extends RestParameter<infer T> ? T : never;
  },
>(query: Q) {
  return {
    includeFields: query.include?.includes("fields") ?? false,
    includeFieldsByAlias: query.include?.includes("fieldsByAlias") ?? false,
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
  type: "PetitionEventSubscription",
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
const profileTypeFieldId = idParam({
  type: "ProfileTypeField",
  description: "The ID of the profile type field",
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
        // for some reason types are doing weird things here
        status: enumParam<"DRAFT" | "PENDING" | "COMPLETED" | "CLOSED", false>({
          description: "Optionally filter parallels by their status",
          required: false,
          values: ["DRAFT", "PENDING", "COMPLETED", "CLOSED"],
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
      responses: { 200: SuccessResponse(PaginatedPetitions) },
      tags: ["Parallels"],
    },
    async ({ client, query }) => {
      let tags: PetitionTagFilter | undefined = undefined;
      if (isDefined(query.tags)) {
        try {
          const allTags = await getTags(client);
          tags = buildTagsFilter(allTags, query.tags);
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
          $fromTemplateId: [GID!]
        ) {
          petitions(
            offset: $offset
            limit: $limit
            sortBy: $sortBy
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
      const result = await client.request(GetPetitions_petitionsDocument, {
        ...pick(query, ["offset", "limit", "status", "fromTemplateId", "sortBy"]),
        tags,
        ...getPetitionIncludesFromQuery(query),
      });
      const { items, totalCount } = result.petitions;
      assertType<PetitionFragmentType[]>(items);
      return Ok({ items: items.map((p) => mapPetition(p)), totalCount });
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
          throw new BadRequestError(error.response.errors?.[0]?.message ?? "ARG_VALIDATION_ERROR");
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
          description: "The parallel is being shared with another user. Set force=true to delete.",
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
      query TagPetition_tags($search: String) {
        tags(offset: 0, limit: 1000, search: $search) {
          items {
            ...Tag
          }
        }
      }
      ${PetitionTagFragment}
    `;
    const queryResult = await client.request(TagPetition_tagsDocument, { search: body.name });
    // must have a 100% match on the result
    let tagId = queryResult.tags.items.find((t) => t.name === body.name)?.id;

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
        query UntagPetition_tags($search: String) {
          tags(offset: 0, limit: 1000, search: $search) {
            items {
              ...Tag
            }
          }
        }
        ${PetitionTagFragment}
      `;
      const queryResult = await client.request(TagPetition_tagsDocument, { search: params.name });
      const tagId = queryResult.tags.items.find((tag) => tag.name === params.name)?.id;

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
        tagId: tagId!,
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
      const contactIds = await pMap(
        body.contacts,
        async (item) => {
          if (typeof item === "string") {
            return item;
          } else {
            const { email, ...data } = item;
            const _query = gql`
              query CreatePetitionRecipients_contact($email: String!) {
                contacts: contactsByEmail(emails: [$email]) {
                  id
                  firstName
                  lastName
                }
              }
            `;
            const result = await client.request(CreatePetitionRecipients_contactDocument, {
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
        { concurrency: 3 },
      );
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
          $includeRecipients: Boolean!
          $includeFields: Boolean!
          $includeTags: Boolean!
          $includeRecipientUrl: Boolean!
          $includeReplies: Boolean!
          $includeProgress: Boolean!
          $includeSigners: Boolean!
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

          const queryResponse = await client.request(CreatePetitionRecipients_userByEmailDocument, {
            email: body.sendAs,
          });
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
        ...getPetitionIncludesFromQuery(query),
      });

      assert(result.sendPetition[0].petition !== null);
      assert("id" in result.sendPetition[0].petition);

      return Ok(mapPetition(result.sendPetition[0].petition));
    } catch (error) {
      if (containsGraphQLError(error, "PETITION_ALREADY_SENT_ERROR")) {
        throw new ConflictError("The parallel was already sent to some of the provided contacts");
      } else if (containsGraphQLError(error, "ARG_VALIDATION_ERROR")) {
        const { email, error_code: errorCode } = error.response.errors![0].extensions.extra as {
          email: string;
          error_code: string;
        };
        if (errorCode === "INVALID_EMAIL_ERROR" || errorCode === "INVALID_MX_EMAIL_ERROR") {
          throw new BadRequestError(`${email} is not a valid email`);
        }
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
        mutation ActivatePetitionRecipient_reactivateAccesses($petitionId: GID!, $accessId: GID!) {
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

      const result = await client.request(DeactivatePetitionRecipient_deactivateAccessesDocument, {
        petitionId: params.petitionId,
        accessId: params.accessId,
      });

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
      Update the title and/or description of the specified field on a parallel.
    `,
      body: JsonBody(UpdatePetitionField),
      responses: { 200: SuccessResponse(PetitionField) },
      tags: ["Parallels"],
    },
    async ({ client, params, body }) => {
      gql`
        mutation UpdatePetitionField_updatePetitionField(
          $petitionId: GID!
          $fieldId: GID!
          $title: String
          $description: String
        ) {
          updatePetitionField(
            petitionId: $petitionId
            fieldId: $fieldId
            data: { title: $title, description: $description }
          ) {
            ...PetitionField
          }
        }
        ${PetitionFieldFragment}
      `;
      const result = await client.request(UpdatePetitionField_updatePetitionFieldDocument, {
        petitionId: params.petitionId,
        fieldId: params.fieldId,
        description: body.description,
        title: body.title,
      });
      assert("id" in result.updatePetitionField!);
      return Ok(mapPetitionField(result.updatePetitionField));
    },
  );

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
      body: Body([JsonBodyContent(SubmitReply), FormDataBodyContent(SubmitFileReply)], {
        description: replyBodyDescription,
      }),
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
      const field = petition?.fields.find((f) => f.id === params.fieldId);

      try {
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
                content: buildSubmittedReplyContent(petition, params.fieldId, body),
              },
            ],
          }));
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
          const { subcode } = error.response.errors?.[0].extensions?.extra as { subcode: string };
          throw new BadRequestError(error.response.errors?.[0].message ?? "INVALID_REPLY_ERROR", {
            subcode,
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
      body: Body([JsonBodyContent(SubmitReply), FormDataBodyContent(SubmitFileReply)], {
        description: replyBodyDescription,
      }),
    },
    async ({ client, body, params, files }) => {
      const { petition } = await client.request(UpdateReply_petitionDocument, {
        petitionId: params.petitionId,
      });

      const field = petition?.fields.find((f) => f.replies.some((r) => r.id === params.replyId));

      try {
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
                content: buildSubmittedReplyContent(petition, params.fieldId, body),
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
          'http://www.onparallel.com/api/v1/petitions/{petitionId}/replies/{replyId}/download' \\
          > image.png
        ~~~
      `,
      tags: ["Parallel replies"],
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
          params,
        );
        return Redirect(result.fileUploadReplyDownloadLink.url!);
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
          'http://www.onparallel.com/api/v1/petitions/{petitionId}/export?format=pdf' \\
          > image.png
        ~~~
      `,
      query: {
        format: enumParam({
          values: ["pdf", "zip"],
          required: true,
          description: "The format of the export.",
        }),
      },
      tags: ["Parallel replies"],
      responses: {
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
          return Redirect(url);
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
        return Redirect(url);
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
        query SharePetition_users {
          me {
            organization {
              users(limit: 1000, offset: 0) {
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
      const userIds = body.userIds ?? [];
      if (isDefined(body.emails)) {
        if (!body.emails.every((email) => email.match(EMAIL_REGEX))) {
          throw new BadRequestError("Some of the provided emails are invalid");
        }

        const usersResponse = await client.request(SharePetition_usersDocument);
        const ids = usersResponse.me.organization.users.items
          .filter((u) => body.emails!.includes(u.email))
          .map((u) => u.id);
        if (body.emails.length !== ids.length) {
          throw new BadRequestError("Some of the provided emails are invalid");
        }
        userIds.push(...ids);
      }
      const result = await client.request(SharePetition_addPetitionPermissionDocument, {
        petitionId: params.petitionId,
        userIds: userIds.length > 0 ? uniq(userIds) : undefined,
        userGroupIds: body.userGroupIds,
      });

      return Ok(result.addPetitionPermission[0].permissions);
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
        throw new BadRequestError("Bad user input. You must specify an userId or an email");
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
        return Ok(data.petition?.signatureRequests ?? []);
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
        409: ErrorResponse({ description: "You can't start a signature request on the parallel." }),
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
        return Created(response.startSignatureRequest);
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
          'http://www.onparallel.com/api/v1/petitions/{petitionId}/signatures/{signatureId}/document' \\
          > signed.pdf
        ~~~
      `,
      responses: {
        302: RedirectResponse("Redirect to the resource on AWS S3"),
        400: ErrorResponse({
          description: "The signed document is not yet ready to be downloaded",
        }),
      },
      tags: ["Signatures"],
    },
    async ({ client, params }) => {
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
        return Redirect(signedPetitionDownloadLink.url!);
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
        'http://www.onparallel.com/api/v1/petitions/{petitionId}/signatures/{signatureId}/audit' \\
        > audit-trail.pdf
      ~~~
    `,
      responses: {
        302: RedirectResponse("Redirect to the resource on AWS S3"),
        400: ErrorResponse({
          description: "The document is not yet ready to be downloaded",
        }),
      },
      tags: ["Signatures"],
    },
    async ({ client, params }) => {
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
        return Redirect(signedPetitionDownloadLink.url!);
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
          $includeFieldsByAlias: Boolean!
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
          $includeFieldsByAlias: Boolean!
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
        const allTags = await getTags(client);
        tags = buildTagsFilter(allTags, query.tags);
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
        query GetContacts_contacts($offset: Int!, $limit: Int!, $sortBy: [QueryContacts_OrderBy!]) {
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
            ...Subscription
          }
        }
        ${SubscriptionFragment}
      `;
      const result = await client.request(EventSubscriptions_getSubscriptionsDocument);
      return Ok(result.subscriptions.map(mapSubscription));
    },
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
      },
      callbacks: {
        PetitionEventCreated: {
          "{$request.body#/eventsUrl}": {
            post: {
              operationId: "PetitionEventCreated",
              summary: "New Parallel Event",
              description: newParallelEvent,
              requestBody: {
                required: true,
                content: { "application/json": { schema: _PetitionEvent } },
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
      try {
        const _mutation = gql`
          mutation EventSubscriptions_createSubscription(
            $eventsUrl: String!
            $eventTypes: [PetitionEventType!]
            $name: String
            $fromTemplateId: GID
          ) {
            createEventSubscription(
              eventsUrl: $eventsUrl
              eventTypes: $eventTypes
              name: $name
              fromTemplateId: $fromTemplateId
            ) {
              ...Subscription
            }
          }
          ${SubscriptionFragment}
        `;
        const result = await client.request(EventSubscriptions_createSubscriptionDocument, {
          eventsUrl: body.eventsUrl,
          eventTypes: body.eventTypes,
          name: body.name,
          fromTemplateId: body.fromTemplateId,
        });

        return Created(mapSubscription(result.createEventSubscription));
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
    description: "Returns a list with your latest parallel events",
    query: {
      before: idParam({
        type: "PetitionEvent",
        description: "Fetch events that ocurred before this ID",
        required: false,
      }),
      eventTypes: enumParam({
        values: petitionEventTypes,
        description: "Filter events by types",
        required: false,
        array: true,
      }),
    },
    responses: { 200: SuccessResponse(ListOfPetitionEvents) },
    tags: ["Parallel Events"],
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
          $includeFieldsByAlias: Boolean!
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
      body: JsonBody(CreateProfile),
      query: profileIncludeParam,
      responses: {
        201: SuccessResponse(Profile),
        400: ErrorResponse({ description: "Invalid request body" }),
        403: ErrorResponse({ description: "You don't have access to this resource" }),
      },
      tags: ["Profiles"],
    },
    async ({ client, body, query }) => {
      const _mutations = [
        gql`
          mutation CreateProfile_createProfile(
            $profileTypeId: GID!
            $subscribe: Boolean
            $includeFields: Boolean!
            $includeFieldsByAlias: Boolean!
            $includeSubscribers: Boolean!
          ) {
            createProfile(profileTypeId: $profileTypeId, subscribe: $subscribe) {
              ...Profile
            }
          }
          ${ProfileFragment}
        `,
        gql`
          mutation CreateProfile_updateProfileFieldValue(
            $profileId: GID!
            $fields: [UpdateProfileFieldValueInput!]!
            $includeFields: Boolean!
            $includeFieldsByAlias: Boolean!
            $includeSubscribers: Boolean!
          ) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              ...Profile
            }
          }
          ${ProfileFragment}
        `,
      ];

      try {
        const result = await client.request(CreateProfile_createProfileDocument, {
          profileTypeId: body.profileTypeId,
          subscribe: body.subscribe,
          ...getProfileIncludesFromQuery(query),
        });
        assert("id" in result.createProfile);

        if (!isDefined(body.fields)) {
          return Created(mapProfile(result.createProfile));
        }

        const updatedProfileResult = await client.request(
          CreateProfile_updateProfileFieldValueDocument,
          {
            profileId: result.createProfile.id,
            fields: body.fields,
            ...getProfileIncludesFromQuery(query),
          },
        );

        return Created(mapProfile(updatedProfileResult.updateProfileFieldValue));
      } catch (error) {
        if (containsGraphQLError(error, "EXPIRY_ON_NON_EXPIRABLE_FIELD")) {
          throw new BadRequestError("You can't set an expiry date on a non-expirable field");
        }
        throw error;
      }
    },
  );

api.path("/profiles/:profileId", { params: { profileId } }).get(
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
        $includeFieldsByAlias: Boolean!
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
);

api
  .path("/profiles/:profileId/fields", { params: { profileId } })
  .get(
    {
      operationId: "GetProfileFields",
      summary: "List profile fields",
      description: "Returns a list with all the fields of the specified profile",
      responses: { 200: SuccessResponse(ListOfProfileProperties) },
      tags: ["Profiles"],
    },
    async ({ client, params }) => {
      const _query = gql`
        query GetProfileFields_profile(
          $profileId: GID!
          $includeFields: Boolean!
          $includeFieldsByAlias: Boolean!
          $includeSubscribers: Boolean!
        ) {
          profile(profileId: $profileId) {
            ...Profile
          }
        }
        ${ProfileFragment}
      `;

      const result = await client.request(GetProfileFields_profileDocument, {
        profileId: params.profileId,
        ...getProfileIncludesFromQuery({ include: ["fields"] }),
      });

      return Ok(mapProfile(result.profile).fields!);
    },
  )
  .put(
    {
      operationId: "CreateProfileFieldValue",
      summary: "Submit values by profile field alias",
      description: outdent`
        Submit a list of values on a profile given a form-data where each key is a field alias.
        The profile has to be in \`OPEN\` status.
      `,
      middleware: anyFileUploadMiddleware(),
      body: FormDataBody(CreateProfileFieldValue, {
        description: outdent`
          A multipart/form-data body where each key is a field alias and the value is the value to submit.

          e.g.: \`{ "name": "John Doe", "amount": 500, "date": "2023-06-27" }\` will submit the values \`"John Doe"\` for the field with alias \`"name"\`, \`500\` for the field with alias \`"amount"\` and \`"2023-06-27"\` for the field with alias \`"date"\`.

          If any of the keys does not match a field alias, it will be ignored.

          Have in mind that the value must match with the profile field type. For example, if the field is a \`DATE\` field, the value must be a valid date string. If the field is a \`FILE\` field, value must be a selection of Files to upload.
          `,
      }),
      tags: ["Profiles"],
      responses: {
        200: SuccessResponse(Profile),
        400: ErrorResponse({ description: "Bad request input" }),
      },
    },
    async ({ client, params, body }) => {
      const _query = gql`
        query CreateProfileFieldValue_profile(
          $profileId: GID!
          $includeFields: Boolean!
          $includeFieldsByAlias: Boolean!
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
          mutation CreateProfileFieldValue_updateProfileFieldValue(
            $profileId: GID!
            $fields: [UpdateProfileFieldValueInput!]!
          ) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
            }
          }
        `,
        gql`
          mutation CreateProfileFieldValue_createProfileFieldFileUploadLink(
            $profileId: GID!
            $profileTypeFieldId: GID!
            $data: [FileUploadInput!]!
          ) {
            createProfileFieldFileUploadLink(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
              data: $data
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
          mutation CreateProfileFieldValue_profileFieldFileUploadComplete(
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
      ];

      const queryResponse = await client.request(CreateProfileFieldValue_profileDocument, {
        profileId: params.profileId,
        ...getProfileIncludesFromQuery({ include: ["fields"] }),
      });
      const profileFields = queryResponse.profile.properties!.map((p) => p.field);

      const simpleTextUpdateFields: UpdateProfileFieldValueInput[] = [];
      const fileUpdateFields: { profileTypeFieldId: string; files: Express.Multer.File[] }[] = [];

      for (const [alias, value] of Object.entries(body)) {
        const field = profileFields.find((f) => f.alias === alias);
        if (field && value !== undefined) {
          if (field.type === "FILE") {
            if (typeof value !== "object") {
              throw new BadRequestError(
                `Invalid value for field ${field.alias}. Expected an array of files.`,
              );
            }
            fileUpdateFields.push({
              profileTypeFieldId: field.id,
              files: value as Express.Multer.File[],
            });
          } else {
            if (typeof value !== "string") {
              throw new BadRequestError(
                `Invalid value for field ${field.alias}. Expected a string.`,
              );
            }
            simpleTextUpdateFields.push({ profileTypeFieldId: field.id, content: { value } });
          }
        }
      }

      try {
        if (simpleTextUpdateFields.length > 0) {
          await client.request(CreateProfileFieldValue_updateProfileFieldValueDocument, {
            profileId: params.profileId,
            fields: simpleTextUpdateFields,
          });
        }

        if (fileUpdateFields.length > 0) {
          for (const fileUpdate of fileUpdateFields) {
            const fileUpdateResponse = await client.request(
              CreateProfileFieldValue_createProfileFieldFileUploadLinkDocument,
              {
                profileId: params.profileId,
                profileTypeFieldId: fileUpdate.profileTypeFieldId,
                data: fileUpdate.files.map((file) => ({
                  filename: file.filename,
                  contentType: file.mimetype,
                  size: file.size,
                })),
              },
            );
            for (const [file, presignedPostData] of zip(
              fileUpdate.files,
              fileUpdateResponse.createProfileFieldFileUploadLink.uploads.map(
                (u) => u.presignedPostData,
              ),
            )) {
              await uploadFile(file, presignedPostData);
            }

            await client.request(CreateProfileFieldValue_profileFieldFileUploadCompleteDocument, {
              profileId: params.profileId,
              profileTypeFieldId: fileUpdate.profileTypeFieldId,
              profileFieldFileIds: fileUpdateResponse.createProfileFieldFileUploadLink.uploads.map(
                (u) => u.file.id,
              ),
            });
          }
        }

        const response = await client.request(CreateProfileFieldValue_profileDocument, {
          profileId: params.profileId,
          ...getProfileIncludesFromQuery({ include: ["fieldsByAlias"] }),
        });

        assert("id" in response.profile);
        return Ok(mapProfile(response.profile));
      } catch (error) {
        if (containsGraphQLError(error, "INVALID_PROFILE_FIELD_VALUE")) {
          throw new BadRequestError(
            error.response.errors?.[0]?.message ?? "INVALID_PROFILE_FIELD_VALUE",
          );
        }
        throw error;
      }
    },
  );

api
  .path("/profiles/:profileId/fields/:profileTypeFieldId", {
    params: { profileId, profileTypeFieldId },
  })
  .delete(
    {
      operationId: "DeleteProfileFieldValue",
      summary: "Remove a value on the profile field",
      description: outdent`
      Removes a value on the profile field.
      If the field is of type \`FILE\`, the related files will be deleted.
      The profile has to be in \`OPEN\` status.
    `,
      tags: ["Profiles"],
      responses: { 200: SuccessResponse() },
    },
    async ({ client, params }) => {
      const _query = gql`
        query DeleteProfileFieldValue_profile($profileId: GID!) {
          profile(profileId: $profileId) {
            properties {
              field {
                id
                type
              }
            }
          }
        }
      `;

      const _mutations = [
        gql`
          mutation DeleteProfileFieldValue_updateProfileFieldValue(
            $profileId: GID!
            $fields: [UpdateProfileFieldValueInput!]!
          ) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
            }
          }
        `,
        gql`
          mutation DeleteProfileFieldValue_deleteProfileFieldFile(
            $profileId: GID!
            $profileTypeFieldId: GID!
          ) {
            deleteProfileFieldFile(profileId: $profileId, profileTypeFieldId: $profileTypeFieldId)
          }
        `,
      ];

      const queryResponse = await client.request(DeleteProfileFieldValue_profileDocument, {
        profileId: params.profileId,
      });

      const field = queryResponse.profile.properties!.find(
        (p) => p.field.id === params.profileTypeFieldId,
      )?.field;

      if (!field) {
        throw new ForbiddenError("You don't have access to this profile field");
      }

      if (field.type === "FILE") {
        await client.request(DeleteProfileFieldValue_deleteProfileFieldFileDocument, {
          profileId: params.profileId,
          profileTypeFieldId: params.profileTypeFieldId,
        });
      } else {
        await client.request(DeleteProfileFieldValue_updateProfileFieldValueDocument, {
          profileId: params.profileId,
          fields: [{ profileTypeFieldId: params.profileTypeFieldId, content: null }],
        });
      }

      return NoContent();
    },
  )
  .put(
    {
      operationId: "UpdateProfileFieldValue",
      summary: "Submit values",
      description: outdent`
      Creates or updates a value of a profile field.
      The profile has to be in \`OPEN\` status.
      `,
      tags: ["Profiles"],
      middleware: anyFileUploadMiddleware(),
      body: FormDataBody(UpdateProfileFieldValueFormDataBody, {
        description:
          "The request must be a `multipart/form-data` request containing the value or file(s) to upload.",
      }),
      responses: {
        200: SuccessResponse(Profile),
        403: ErrorResponse({ description: "You don't have access to this resource" }),
      },
    },
    async ({ client, params, body }) => {
      const _query = gql`
        query UpdateProfileFieldValue_profile(
          $profileId: GID!
          $includeFields: Boolean!
          $includeFieldsByAlias: Boolean!
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
      ];

      const queryResponse = await client.request(UpdateProfileFieldValue_profileDocument, {
        profileId: params.profileId,
        includeFields: true,
        includeFieldsByAlias: false,
        includeSubscribers: false,
      });

      const field = queryResponse.profile.properties!.find(
        (p) => p.field.id === params.profileTypeFieldId,
      )?.field;

      if (!isDefined(field)) {
        throw new ForbiddenError("You don't have access to this profile field");
      }

      if (field.type === "FILE") {
        if (typeof body.value !== "object") {
          throw new BadRequestError(`Invalid value for field. Expected an array of files.`);
        }
        const createUploadLinkResponse = await client.request(
          UpdateProfileFieldValue_createProfileFieldFileUploadLinkDocument,
          {
            profileId: params.profileId,
            profileTypeFieldId: params.profileTypeFieldId,
            data: (body.value as Express.Multer.File[]).map((file) => ({
              filename: file.originalname,
              contentType: file.mimetype,
              size: file.size,
            })),
            expiryDate: body.expiryDate,
          },
        );

        for (const [file, uploadData] of zip(
          body.value as Express.Multer.File[],
          createUploadLinkResponse.createProfileFieldFileUploadLink.uploads,
        )) {
          await uploadFile(file, uploadData.presignedPostData);
        }

        await client.request(UpdateProfileFieldValue_profileFieldFileUploadCompleteDocument, {
          profileId: params.profileId,
          profileTypeFieldId: params.profileTypeFieldId,
          profileFieldFileIds:
            createUploadLinkResponse.createProfileFieldFileUploadLink.uploads.map(
              (upload) => upload.file.id,
            ),
        });
      } else {
        if (typeof body.value === "object") {
          throw new BadRequestError(`Invalid value for field. Expected a string.`);
        }

        await client.request(UpdateProfileFieldValue_updateProfileFieldValueDocument, {
          profileId: params.profileId,
          fields: [
            {
              profileTypeFieldId: params.profileTypeFieldId,
              content: { value: body.value },
              expiryDate: body.expiryDate,
            },
          ],
        });
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
          $includeFieldsByAlias: Boolean!
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
          $includeFieldsByAlias: Boolean!
          $includeSubscribers: Boolean!
        ) {
          unsubscribeFromProfile(profileIds: [$profileId], userIds: $userIds) {
            ...Profile
          }
        }
        ${ProfileFragment}
      `;

      const response = await client.request(UnsubscribeFromProfile_unsubscribeFromProfileDocument, {
        profileId: params.profileId,
        userIds: body.userIds,
        ...getProfileIncludesFromQuery(query),
      });

      assert(response.unsubscribeFromProfile.length === 1);
      assert("id" in response.unsubscribeFromProfile[0]);

      return Ok(mapProfile(response.unsubscribeFromProfile[0]));
    },
  );

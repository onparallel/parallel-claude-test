import { mkdir, unlink } from "fs/promises";
import { ClientError, gql, GraphQLClient } from "graphql-request";
import multer from "multer";
import { outdent } from "outdent";
import pMap from "p-map";
import { isDefined, pick } from "remeda";
import { callbackify } from "util";
import { toGlobalId } from "../../util/globalId";
import { random } from "../../util/token";
import { Body, FormDataBody, FormDataBodyContent, JsonBody, JsonBodyContent } from "../rest/body";
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
  PetitionFieldWithRepliesFragment,
  PetitionFragment,
  SubscriptionFragment,
  TaskFragment,
  TemplateFragment,
  UserFragment,
} from "./fragments";
import {
  containsGraphQLError,
  getTags,
  getTaskResultFileUrl,
  idParam,
  mapPetition,
  mapPetitionField,
  mapReplyResponse,
  mapTemplate,
  paginationParams,
  sortByParam,
  uploadFile,
  waitForTask,
} from "./helpers";
import {
  Contact,
  CreateContact,
  CreateOrUpdatePetitionCustomProperty,
  CreatePetition,
  CreateSubscription,
  FileUpload,
  ListOfPermissions,
  ListOfPetitionAccesses,
  ListOfPetitionAttachments,
  ListOfPetitionFieldsWithReplies,
  ListOfSignatureRequests,
  ListOfSubscriptions,
  PaginatedContacts,
  PaginatedPetitions,
  PaginatedTags,
  PaginatedTemplates,
  PaginatedUsers,
  Petition,
  PetitionAttachment,
  PetitionCustomProperties,
  PetitionField,
  PetitionFieldReply,
  SendPetition,
  SharePetition,
  SubmitFileReply,
  SubmitReply,
  Subscription,
  Template,
  UpdatePetition,
  UpdatePetitionField,
  User,
  _PetitionEvent,
} from "./schemas";
import {
  CreateContact_contactDocument,
  CreateOrUpdatePetitionCustomProperty_modifyPetitionCustomPropertyDocument,
  CreatePetitionAttachment_createPetitionAttachmentUploadLinkDocument,
  CreatePetitionAttachment_petitionAttachmentUploadCompleteDocument,
  CreatePetitionRecipients_contactDocument,
  CreatePetitionRecipients_createContactDocument,
  CreatePetitionRecipients_sendPetitionDocument,
  CreatePetitionRecipients_updateContactDocument,
  CreatePetition_petitionDocument,
  DeletePetitionAttachment_deletePetitionAttachmentDocument,
  DeletePetitionCustomProperty_modifyPetitionCustomPropertyDocument,
  DeletePetition_deletePetitionsDocument,
  DeleteReply_deletePetitionReplyDocument,
  DeleteTemplate_deletePetitionsDocument,
  DEPRECATED_CreatePetitionRecipients_sendPetitionDocument,
  DownloadFileReply_fileUploadReplyDownloadLinkDocument,
  DownloadPetitionAttachment_petitionAttachmentDownloadLinkDocument,
  DownloadSignedDocument_downloadAuditTrailDocument,
  DownloadSignedDocument_downloadSignedDocDocument,
  EventSubscriptions_createSubscriptionDocument,
  EventSubscriptions_deleteSubscriptionDocument,
  EventSubscriptions_getSubscriptionsDocument,
  ExportPetitionReplies_createExportRepliesTaskDocument,
  ExportPetitionReplies_createPrintPdfTaskDocument,
  GetContacts_contactsDocument,
  GetContact_contactDocument,
  GetMe_userDocument,
  GetOrganizationUsers_usersDocument,
  GetPermissions_permissionsDocument,
  GetPetitionAttachments_petitionDocument,
  GetPetitionRecipients_petitionAccessesDocument,
  GetPetitions_petitionsDocument,
  GetPetition_petitionDocument,
  GetSignatures_petitionSignaturesDocument,
  GetTags_tagsDocument,
  GetTemplates_templatesDocument,
  GetTemplate_templateDocument,
  Maybe,
  PetitionFragment as PetitionFragmentType,
  PetitionReplies_repliesDocument,
  ReadPetitionCustomPropertiesDocument,
  RemoveUserGroupPermission_removePetitionPermissionDocument,
  RemoveUserPermission_removePetitionPermissionDocument,
  SharePetition_addPetitionPermissionDocument,
  StopSharing_removePetitionPermissionDocument,
  SubmitReply_createCheckboxReplyDocument,
  SubmitReply_createDynamicSelectReplyDocument,
  SubmitReply_createFileUploadReplyCompleteDocument,
  SubmitReply_createFileUploadReplyDocument,
  SubmitReply_createNumericReplyDocument,
  SubmitReply_createSimpleReplyDocument,
  SubmitReply_petitionDocument,
  TagFragmentDoc,
  TemplateFragment as TemplateFragmentType,
  TransferPetition_transferPetitionOwnershipDocument,
  UpdatePetitionField_updatePetitionFieldDocument,
  UpdatePetition_updatePetitionDocument,
  UpdateReplyStatus_updatePetitionFieldRepliesStatusDocument,
  UpdateReply_petitionDocument,
  UpdateReply_updateCheckboxReplyDocument,
  UpdateReply_updateDynamicSelectReplyDocument,
  UpdateReply_updateFileUploadReplyCompleteDocument,
  UpdateReply_updateFileUploadReplyDocument,
  UpdateReply_updateNumericReplyDocument,
  UpdateReply_updateSimpleReplyDocument,
  UserFragmentDoc,
} from "./__types";

const uploadFileMiddleware = multer({
  storage: multer.diskStorage({
    destination: callbackify(async function (req: any, file: any) {
      const path = `/tmp/${random(16)}`;
      await mkdir(path);
      return path;
    }),
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
});

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
      PetitionEvent: _PetitionEvent,
    },
  },
  "x-tagGroups": [
    {
      name: "Endpoints",
      tags: [
        "Petitions",
        "Petition replies",
        "Attachments",
        "Signatures",
        "Petition Sharing",
        "Templates",
        "Tags",
        "Contacts",
        "Users",
        "Subscriptions",
      ],
    },
    { name: "Events", tags: ["Petition Event"] },
  ],
  tags: [
    {
      name: "Petitions",
      description: "Petitions are the main entities in Parallel",
    },
    {
      name: "Petition replies",
      description: "See what your clients replied in your petitions",
    },
    { name: "Attachments", description: "Attach files to your petitions" },
    {
      name: "Signatures",
      description:
        "Request a digital signature on your petitions with our eSignature integrations.",
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
      name: "Tags",
      description: "Use tags to organize your templates and petitions so you can find them faster",
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

const petitionIncludeParam = {
  include: enumParam({
    description: "Include optional fields in the response",
    array: true,
    required: false,
    values: ["recipients", "fields", "tags"],
  }),
};

const templateIncludeParam = {
  include: enumParam({
    description: "Include optional fields in the response",
    array: true,
    required: false,
    values: ["fields", "tags"],
  }),
};

const petitionId = idParam({
  type: "Petition",
  description: "The ID of the petition",
});
const attachmentId = idParam({
  type: "PetitionAttachment",
  description: "The ID of the petition attachment",
});
const replyId = idParam({
  type: "PetitionFieldReply",
  description: "The ID of the reply",
});
const fieldId = idParam({
  type: "PetitionField",
  description: "The ID of the petition field",
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

api.path("/me").get(
  {
    operationId: "GetMe",
    summary: "Get user info",
    description: outdent`
    Get the information for the user who owns the token.
  `,
    responses: {
      200: SuccessResponse(User),
    },
    tags: ["Users"],
  },
  async ({ client }) => {
    const _query = gql`
      query GetMe_user {
        me {
          ...User
        }
      }
      ${UserFragmentDoc}
    `;
    const result = await client.request(GetMe_userDocument);
    return Ok(result.me);
  }
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
  }
);

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
        tags: stringParam({
          description: "List of tags to filter by",
          example: "todo,assigned",
          required: false,
          array: true,
        }),
        ...petitionIncludeParam,
      },
      responses: { 200: SuccessResponse(PaginatedPetitions) },
      tags: ["Petitions"],
    },
    async ({ client, query }) => {
      let tagIds: string[] | undefined = undefined;
      if (isDefined(query.tags)) {
        if (query.tags.length > 0) {
          const allTags = await getTags(client);
          const tags = query.tags.map((tagName) => allTags.find((t) => t.name === tagName));
          if (tags.some((t) => !isDefined(t))) {
            return Ok({ totalCount: 0, items: [] });
          }
          tagIds = tags.map((t) => t!.id);
        } else {
          tagIds = [];
        }
      }
      const _query = gql`
        query GetPetitions_petitions(
          $offset: Int!
          $limit: Int!
          $status: [PetitionStatus!]
          $tagIds: [GID!]
          $sortBy: [QueryPetitions_OrderBy!]
          $includeRecipients: Boolean!
          $includeFields: Boolean!
          $includeTags: Boolean!
        ) {
          petitions(
            offset: $offset
            limit: $limit
            sortBy: $sortBy
            filters: { status: $status, type: PETITION, tagIds: $tagIds }
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
        ...pick(query, ["offset", "limit", "status", "sortBy"]),
        tagIds,
        includeFields: query.include?.includes("fields") ?? false,
        includeRecipients: query.include?.includes("recipients") ?? false,
        includeTags: query.include?.includes("tags") ?? false,
      });
      const { items, totalCount } = result.petitions;
      assertType<PetitionFragmentType[]>(items);
      return Ok({ items: items.map((p) => mapPetition(p)), totalCount });
    }
  )
  .post(
    {
      operationId: "CreatePetition",
      summary: "Create petition",
      description: outdent`Create a new petition based on a template.`,
      body: JsonBody(CreatePetition),
      query: {
        ...petitionIncludeParam,
      },
      responses: { 201: SuccessResponse(Petition) },
      tags: ["Petitions"],
    },
    async ({ client, body, query }) => {
      const _mutation = gql`
        mutation CreatePetition_petition(
          $name: String
          $templateId: GID
          $includeRecipients: Boolean!
          $includeFields: Boolean!
          $includeTags: Boolean!
        ) {
          createPetition(name: $name, petitionId: $templateId) {
            ...Petition
          }
        }
        ${PetitionFragment}
      `;
      const result = await client.request(CreatePetition_petitionDocument, {
        ...body,
        includeFields: query.include?.includes("fields") ?? false,
        includeRecipients: query.include?.includes("recipients") ?? false,
        includeTags: query.include?.includes("tags") ?? false,
      });
      assert("id" in result.createPetition);
      return Created(mapPetition(result.createPetition));
    }
  );

api
  .path("/petitions/:petitionId", { params: { petitionId } })
  .get(
    {
      operationId: "GetPetition",
      summary: "Get petition",
      description: outdent`
        Returns the specified petition.
      `,
      query: {
        ...petitionIncludeParam,
      },
      responses: { 200: SuccessResponse(Petition) },
      tags: ["Petitions"],
    },
    async ({ client, params, query }) => {
      const _query = gql`
        query GetPetition_petition(
          $petitionId: GID!
          $includeRecipients: Boolean!
          $includeFields: Boolean!
          $includeTags: Boolean!
        ) {
          petition(id: $petitionId) {
            ...Petition
          }
        }
        ${PetitionFragment}
      `;
      const result = await client.request(GetPetition_petitionDocument, {
        petitionId: params.petitionId,
        includeFields: query.include?.includes("fields") ?? false,
        includeRecipients: query.include?.includes("recipients") ?? false,
        includeTags: query.include?.includes("tags") ?? false,
      });
      assert("id" in result.petition!);
      return Ok(mapPetition(result.petition!));
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
      query: {
        ...petitionIncludeParam,
      },
      responses: { 200: SuccessResponse(Petition) },
      tags: ["Petitions"],
    },
    async ({ client, params, body, query }) => {
      const _mutation = gql`
        mutation UpdatePetition_updatePetition(
          $petitionId: GID!
          $data: UpdatePetitionInput!
          $includeRecipients: Boolean!
          $includeFields: Boolean!
          $includeTags: Boolean!
        ) {
          updatePetition(petitionId: $petitionId, data: $data) {
            ...Petition
          }
        }
        ${PetitionFragment}
      `;
      const result = await client.request(UpdatePetition_updatePetitionDocument, {
        petitionId: params.petitionId,
        data: body,
        includeFields: query.include?.includes("fields") ?? false,
        includeRecipients: query.include?.includes("recipients") ?? false,
        includeTags: query.include?.includes("tags") ?? false,
      });
      assert("id" in result.updatePetition!);
      return Ok(mapPetition(result.updatePetition!));
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
  .path("/petitions/:petitionId/attachments", {
    params: { petitionId },
  })
  .get(
    {
      operationId: "GetPetitionAttachments",
      summary: "List the petition attachments",
      description: "Returns a list with information on files attached to the petition.",
      responses: {
        200: SuccessResponse(ListOfPetitionAttachments),
      },
      tags: ["Attachments"],
    },
    async ({ client, params }) => {
      const { petition } = await client.request(GetPetitionAttachments_petitionDocument, {
        id: params.petitionId,
      });

      return Ok(petition!.attachments);
    }
  )
  .post(
    {
      middleware: uploadFileMiddleware.single("file"),
      operationId: "CreatePetitionAttachment",
      summary: "Attach a file to the petition",
      description: "Attaches the provided file to the petition.",
      responses: {
        200: SuccessResponse(PetitionAttachment),
      },
      body: FormDataBody(FileUpload),
      tags: ["Attachments"],
    },
    async ({ client, params, files }) => {
      const file = files["file"][0];

      const {
        createPetitionAttachmentUploadLink: { presignedPostData, attachment },
      } = await client.request(
        CreatePetitionAttachment_createPetitionAttachmentUploadLinkDocument,
        {
          petitionId: params.petitionId,
          data: { size: file.size, contentType: file.mimetype, filename: file.originalname },
        }
      );

      const uploadResponse = await uploadFile(file, presignedPostData);
      if (uploadResponse.ok) {
        await unlink(file.path);
        const { petitionAttachmentUploadComplete } = await client.request(
          CreatePetitionAttachment_petitionAttachmentUploadCompleteDocument,
          {
            petitionId: params.petitionId,
            attachmentId: attachment.id,
          }
        );
        return Ok(petitionAttachmentUploadComplete);
      }

      throw new BadRequestError(uploadResponse.statusText);
    }
  );

api
  .path("/petitions/:petitionId/attachments/:attachmentId", {
    params: { petitionId, attachmentId },
  })
  .delete(
    {
      operationId: "DeletePetitionAttachment",
      summary: "Delete an attachment",
      description: "Removes an attachment from the petition.",
      responses: {
        204: SuccessResponse(),
      },
      tags: ["Attachments"],
    },
    async ({ client, params }) => {
      await client.request(DeletePetitionAttachment_deletePetitionAttachmentDocument, {
        petitionId: params.petitionId,
        attachmentId: params.attachmentId,
      });

      return NoContent();
    }
  );

api
  .path("/petitions/:petitionId/attachments/:attachmentId/download", {
    params: { petitionId, attachmentId },
  })
  .get(
    {
      operationId: "DownloadPetitionAttachment",
      summary: "Download an attachment",
      description: outdent`
        Download the attached file.

        ### Important
        Note that *there will be a redirect* to a temporary download endpoint on
        AWS S3 so make sure to configure your HTTP client to follow redirects.

        For example if you were to use curl you would need to provide the
        \`-L\` flag, e.g.:

        ~~~bash
        curl -s -L -XGET \\
          -H 'Authorization: Bearer <your API token>' \\
          'http://www.onparallel.com/api/v1/petitions/{petitionId}/attachments/{attachmentId}/download' \\
          > presentation.pdf
        ~~~
      `,
      responses: { 302: RedirectResponse("Redirect to the resource on AWS S3") },
      tags: ["Attachments"],
    },
    async ({ client, params }) => {
      const { petitionAttachmentDownloadLink } = await client.request(
        DownloadPetitionAttachment_petitionAttachmentDownloadLinkDocument,
        { petitionId: params.petitionId, attachmentId: params.attachmentId }
      );
      return Redirect(petitionAttachmentDownloadLink.url!);
    }
  );

api
  .path("/petitions/:petitionId/properties", {
    params: { petitionId },
  })
  .get(
    {
      operationId: "ReadPetitionCustomProperties",
      summary: "Get petition custom properties",
      description: "Returns a key-value object with the custom properties of the petition",
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
      operationId: "CreateOrUpdatePetitionCustomProperty",
      summary: "Create or update petition custom property",
      description: outdent`
        Creates or updates a custom property on the petition.

        If the provided key already exists as a property, its value is overwritten.
        If the provided key doesn't exist, it's added.

        The petition can have up to 20 different properties.
      `,
      body: JsonBody(CreateOrUpdatePetitionCustomProperty),
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
      operationId: "DeletePetitionCustomProperty",
      summary: "Deletes petition custom property",
      description: outdent`
        Removes the provided key from the custom properties of the petition.
      `,
      responses: { 204: SuccessResponse() },
      tags: ["Petitions"],
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
        params
      );

      return NoContent();
    }
  );

api.path("/petitions/:petitionId/send", { params: { petitionId } }).post(
  {
    operationId: "SendPetition",
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
    query: {
      ...petitionIncludeParam,
    },
    responses: {
      200: SuccessResponse(Petition),
      400: ErrorResponse({
        description: "Invalid parameter",
      }),
      409: ErrorResponse({
        description: "The petition was already sent to some of the provided contacts",
      }),
    },
    tags: ["Petitions"],
  },
  async ({ client, params, body, query }) => {
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
      { concurrency: 3 }
    );
    const message = isDefined(body.message)
      ? body.message.format === "PLAIN_TEXT"
        ? body.message.content.split("\n").map((line) => ({ children: [{ text: line }] }))
        : [{ children: [{ text: "" }] }]
      : null;
    try {
      const _mutation = gql`
        mutation CreatePetitionRecipients_sendPetition(
          $petitionId: GID!
          $contactIds: [GID!]!
          $subject: String
          $body: JSON
          $scheduledAt: DateTime
          $remindersConfig: RemindersConfigInput
          $includeRecipients: Boolean!
          $includeFields: Boolean!
          $includeTags: Boolean!
        ) {
          sendPetition(
            petitionId: $petitionId
            contactIds: $contactIds
            subject: $subject
            body: $body
            scheduledAt: $scheduledAt
            remindersConfig: $remindersConfig
          ) {
            petition {
              ...Petition
            }
          }
        }
        ${PetitionFragment}
      `;
      const result = await client.request(CreatePetitionRecipients_sendPetitionDocument, {
        petitionId: params.petitionId,
        contactIds,
        body: message,
        ...pick(body, ["subject", "remindersConfig", "scheduledAt"]),
        includeFields: query.include?.includes("fields") ?? false,
        includeRecipients: query.include?.includes("recipients") ?? false,
        includeTags: query.include?.includes("tags") ?? false,
      });
      assert("id" in result.sendPetition.petition!);
      return Ok(mapPetition(result.sendPetition.petition));
    } catch (error: any) {
      if (
        error instanceof ClientError &&
        containsGraphQLError(error, "PETITION_ALREADY_SENT_ERROR")
      ) {
        throw new ConflictError("The petition was already sent to some of the provided contacts");
      } else if (
        error instanceof ClientError &&
        containsGraphQLError(error, "MISSING_SUBJECT_OR_BODY")
      ) {
        throw new BadRequestError(
          "The subject or the message are missing and not defined on the petition"
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
      });
      assert("accesses" in result.petition!);
      return Ok(result.petition!.accesses);
    }
  )
  .post(
    {
      deprecated: true,
      operationId: "CreatePetitionRecipients",
      summary: "Send petition",
      description: outdent`
        This method is deprecated and will stop working soon. Please, use
        [SendPetition](#operation/SendPetition) instead.
      `,
      body: JsonBody(SendPetition),
      responses: {
        200: SuccessResponse(ListOfPetitionAccesses),
        400: ErrorResponse({
          description: "Invalid parameter",
        }),
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
        { concurrency: 3 }
      );
      const message = isDefined(body.message)
        ? body.message.format === "PLAIN_TEXT"
          ? body.message.content.split("\n").map((line) => ({ children: [{ text: line }] }))
          : [{ children: [{ text: "" }] }]
        : null;
      try {
        const _mutation = gql`
          mutation DEPRECATED_CreatePetitionRecipients_sendPetition(
            $petitionId: GID!
            $contactIds: [GID!]!
            $subject: String
            $body: JSON
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
        const result = await client.request(
          DEPRECATED_CreatePetitionRecipients_sendPetitionDocument,
          {
            petitionId: params.petitionId,
            contactIds,
            body: message,
            ...pick(body, ["subject", "remindersConfig", "scheduledAt"]),
          }
        );
        return Ok(result.sendPetition.accesses!);
      } catch (error: any) {
        if (
          error instanceof ClientError &&
          containsGraphQLError(error, "PETITION_ALREADY_SENT_ERROR")
        ) {
          throw new ConflictError("The petition was already sent to some of the provided contacts");
        } else if (
          error instanceof ClientError &&
          containsGraphQLError(error, "MISSING_SUBJECT_OR_BODY")
        ) {
          throw new BadRequestError(
            "The subject or the message are missing and not defined on the petition"
          );
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
    tags: ["Petition replies"],
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

    return Ok(mapPetition(result.petition!).fields);
  }
);

api
  .path("/petitions/:petitionId/fields/:fieldId", {
    params: { petitionId, fieldId },
  })
  .put(
    {
      operationId: "UpdatePetitionField",
      summary: "Update petition field",
      description: outdent`
      Update the title and/or description of the specified field on a petition.
    `,
      body: JsonBody(UpdatePetitionField),
      responses: { 200: SuccessResponse(PetitionField) },
      tags: ["Petitions"],
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
    }
  );

const replyBodyDescription = outdent`
  For \`FILE_UPLOAD\` fields the request mut be a \`multipart/form-data\` request containing the file to upload.
  For other types of fields the request will be a normal \`application/json\` request containing the value of the reply.
    - For \`TEXT\`, \`SHORT_TEXT\` and \`SELECT\` fields, the repy must be a string.
    - For \`NUMBER\`, fields, the reply must be a number
    - For \`CHECKBOX\` fields, the reply must be an array of strings containing all the chosen options.
    - For \`DYNAMIC_SELECT\` fields, the reply must be an array of strings in which each position in the array represents the selected option in the same level. 
`;

api
  .path("/petitions/:petitionId/fields/:fieldId/replies", {
    params: { petitionId, fieldId },
  })
  .post(
    {
      middleware: uploadFileMiddleware.single("reply"),
      operationId: "SubmitReply",
      summary: "Submit a reply",
      description: outdent`
        Submits a reply on a given field of the petition.
      `,
      body: Body([FormDataBodyContent(SubmitFileReply), JsonBodyContent(SubmitReply)], {
        description: replyBodyDescription,
      }),
      responses: {
        201: SuccessResponse(PetitionFieldReply),
        400: ErrorResponse({ description: "Invalid parameters" }),
        409: ErrorResponse({ description: "The field does not accept more replies." }),
      },
      tags: ["Petition replies"],
    },
    async ({ client, body, params, files }) => {
      const { petition } = await client.request(SubmitReply_petitionDocument, {
        petitionId: params.petitionId,
      });
      const field = petition?.fields.find((f) => f.id === params.fieldId);
      try {
        const fieldType = field?.type;
        let newReply;
        switch (fieldType) {
          case "TEXT":
          case "SHORT_TEXT":
          case "SELECT":
            if (typeof body.reply !== "string") {
              throw new BadRequestError(`Reply for ${fieldType} field must be plain text.`);
            }
            const { createSimpleReply } = await client.request(
              SubmitReply_createSimpleReplyDocument,
              {
                petitionId: params.petitionId,
                fieldId: params.fieldId,
                reply: body.reply,
              }
            );
            newReply = createSimpleReply;
            break;
          case "NUMBER": {
            if (typeof body.reply !== "number") {
              throw new BadRequestError(`Reply for ${fieldType} field must a valid number.`);
            }
            const { createNumericReply } = await client.request(
              SubmitReply_createNumericReplyDocument,
              {
                petitionId: params.petitionId,
                fieldId: params.fieldId,
                reply: body.reply,
              }
            );
            newReply = createNumericReply;
            break;
          }
          case "CHECKBOX":
            if (!Array.isArray(body.reply)) {
              throw new BadRequestError(
                `Reply for ${fieldType} field must be an array with the chosen options.`
              );
            }
            const { createCheckboxReply } = await client.request(
              SubmitReply_createCheckboxReplyDocument,
              {
                petitionId: params.petitionId,
                fieldId: params.fieldId,
                reply: body.reply as string[],
              }
            );
            newReply = createCheckboxReply;
            break;
          case "DYNAMIC_SELECT":
            if (!Array.isArray(body.reply)) {
              throw new BadRequestError(
                `Reply for ${fieldType} field must be an array with the chosen options.`
              );
            }
            const labels = petition?.fields.find((f) => f.id === params.fieldId)?.options
              ?.labels as string[];
            const replies = body.reply as Maybe<string>[];

            const { createDynamicSelectReply } = await client.request(
              SubmitReply_createDynamicSelectReplyDocument,
              {
                petitionId: params.petitionId,
                fieldId: params.fieldId,
                value: labels.map((label, i) => [label, replies[i]]),
              }
            );
            newReply = createDynamicSelectReply;
            break;
          case "FILE_UPLOAD":
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
                }
              );
              newReply = createFileUploadReplyComplete;
            } else {
              throw new BadRequestError(uploadResponse.statusText);
            }
            break;
          default:
            throw new BadRequestError(`Can't submit a reply for a field of type ${fieldType}`);
        }

        if (isDefined(body.status)) {
          const { updatePetitionFieldRepliesStatus } = await client.request(
            UpdateReplyStatus_updatePetitionFieldRepliesStatusDocument,
            {
              petitionId: params.petitionId,
              fieldId: params.fieldId,
              replyId: newReply.id,
              status: body.status,
            }
          );
          newReply = updatePetitionFieldRepliesStatus.replies[0];
        }

        return Ok(mapReplyResponse(newReply));
      } catch (error: any) {
        if (error instanceof ClientError) {
          if (containsGraphQLError(error, "INVALID_REPLY_ERROR")) {
            const subcode = error.response.errors?.[0].extensions?.extra?.subcode;
            throw new BadRequestError(error.response.errors?.[0].message ?? "INVALID_REPLY_ERROR", {
              subcode,
            });
          } else if (containsGraphQLError(error, "FIELD_ALREADY_REPLIED_ERROR")) {
            throw new BadRequestError(
              "The field is already replied and does not accept any more replies."
            );
          }
        }
        throw error;
      }
    }
  );

api
  .path("/petitions/:petitionId/fields/:fieldId/replies/:replyId", {
    params: { petitionId, fieldId, replyId },
  })
  .put(
    {
      middleware: uploadFileMiddleware.single("reply"),
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
      tags: ["Petition replies"],
      body: Body([FormDataBodyContent(SubmitFileReply), JsonBodyContent(SubmitReply)], {
        description: replyBodyDescription,
      }),
    },
    async ({ client, body, params, files }) => {
      const { petition } = await client.request(UpdateReply_petitionDocument, {
        petitionId: params.petitionId,
      });

      const field = petition?.fields.find((f) => f.replies.some((r) => r.id === params.replyId));

      const fieldType = field?.type;
      try {
        let updatedReply;
        switch (fieldType) {
          case "TEXT":
          case "SHORT_TEXT":
          case "SELECT":
            if (typeof body.reply !== "string") {
              throw new BadRequestError(`Reply for ${fieldType} field must be plain text.`);
            }
            const { updateSimpleReply } = await client.request(
              UpdateReply_updateSimpleReplyDocument,
              {
                petitionId: params.petitionId,
                replyId: params.replyId,
                reply: body.reply,
              }
            );
            updatedReply = updateSimpleReply;
            break;
          case "NUMBER": {
            if (typeof body.reply !== "number") {
              throw new BadRequestError(`Reply for ${fieldType} field must a valid number.`);
            }
            const { updateNumericReply } = await client.request(
              UpdateReply_updateNumericReplyDocument,
              {
                petitionId: params.petitionId,
                replyId: params.replyId,
                reply: body.reply,
              }
            );
            updatedReply = updateNumericReply;
            break;
          }
          case "CHECKBOX":
            if (!Array.isArray(body.reply)) {
              throw new BadRequestError(
                `Reply for ${fieldType} field must be an array with the chosen options.`
              );
            }
            const { updateCheckboxReply } = await client.request(
              UpdateReply_updateCheckboxReplyDocument,
              {
                petitionId: params.petitionId,
                replyId: params.replyId,
                values: body.reply,
              }
            );
            updatedReply = updateCheckboxReply;
            break;
          case "DYNAMIC_SELECT":
            if (!Array.isArray(body.reply)) {
              throw new BadRequestError(
                `Reply for ${fieldType} field must be an array with the chosen options.`
              );
            }
            const labels = field?.options?.labels as string[];
            const replies = body.reply as Maybe<string>[];

            const { updateDynamicSelectReply } = await client.request(
              UpdateReply_updateDynamicSelectReplyDocument,
              {
                petitionId: params.petitionId,
                replyId: params.replyId,
                value: labels.map((label, i) => [label, replies[i]]),
              }
            );
            updatedReply = updateDynamicSelectReply;
            break;

          case "FILE_UPLOAD":
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
                }
              );

              updatedReply = updateFileUploadReplyComplete;
            } else {
              throw new BadRequestError(uploadResponse.statusText);
            }
            break;
          default:
            throw new BadRequestError(`Can't submit a reply for a field of type ${fieldType}`);
        }
        return Ok(mapReplyResponse(updatedReply));
      } catch (error: any) {
        if (error instanceof ClientError) {
          if (containsGraphQLError(error, "INVALID_REPLY_ERROR")) {
            const subcode = error.response.errors?.[0].extensions?.extra?.subcode;
            throw new BadRequestError(error.response.errors?.[0].message ?? "INVALID_REPLY_ERROR", {
              subcode,
            });
          } else if (containsGraphQLError(error, "REPLY_ALREADY_APPROVED_ERROR")) {
            throw new BadRequestError("The reply is already approved and cannot be modified.");
          }
        }
        throw error;
      }
    }
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
      tags: ["Petition replies"],
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
      } catch (error: any) {
        if (
          error instanceof ClientError &&
          containsGraphQLError(error, "REPLY_ALREADY_APPROVED_ERROR")
        ) {
          throw new ConflictError("The reply is already approved and cannot be deleted.");
        }
        throw error;
      }
    }
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
      tags: ["Petition replies"],
    },
    async ({ client, params }) => {
      const { updatePetitionFieldRepliesStatus } = await client.request(
        UpdateReplyStatus_updatePetitionFieldRepliesStatusDocument,
        {
          petitionId: params.petitionId,
          fieldId: params.fieldId,
          replyId: params.replyId,
          status: "APPROVED",
        }
      );
      const updatedReply = updatePetitionFieldRepliesStatus.replies[0];
      return Ok(mapReplyResponse(updatedReply));
    }
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
      tags: ["Petition replies"],
    },
    async ({ client, params }) => {
      const { updatePetitionFieldRepliesStatus } = await client.request(
        UpdateReplyStatus_updatePetitionFieldRepliesStatusDocument,
        {
          petitionId: params.petitionId,
          fieldId: params.fieldId,
          replyId: params.replyId,
          status: "REJECTED",
        }
      );
      const updatedReply = updatePetitionFieldRepliesStatus.replies[0];
      return Ok(mapReplyResponse(updatedReply));
    }
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
      tags: ["Petition replies"],
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
  .path("/petitions/:petitionId/export", {
    params: { petitionId },
  })
  .get(
    {
      operationId: "ExportPetitionReplies",
      summary: "Export the petition replies",
      description: outdent`
        Export the replies to a petition in the specified format.

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
      tags: ["Petition replies"],
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
            }
          );
          await waitForTask(client, result.createExportRepliesTask);
          const url = await getTaskResultFileUrl(client, result.createExportRepliesTask);
          return Redirect(url);
        } catch (error: any) {
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

api.path("/petitions/:petitionId/signatures", { params: { petitionId } }).get(
  {
    operationId: "GetSignatures",
    summary: "List petition signatures",
    description: "List every signature request linked with your petition.",
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
              id
              status
              environment
              createdAt
              updatedAt
            }
          }
        }
      }
    `;
    const data = await client.request(GetSignatures_petitionSignaturesDocument, params);

    if (data.petition?.__typename === "PetitionTemplate") {
      return Ok([]);
    } else {
      return Ok(data.petition?.signatureRequests ?? []);
    }
  }
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
        }
      );
      if (signedPetitionDownloadLink.result === "FAILURE") {
        throw new BadRequestError("The signed document is not yet ready to be downloaded");
      } else {
        return Redirect(signedPetitionDownloadLink.url!);
      }
    }
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
        }
      );
      if (signedPetitionDownloadLink.result === "FAILURE") {
        throw new BadRequestError("The document is not yet ready to be downloaded");
      } else {
        return Redirect(signedPetitionDownloadLink.url!);
      }
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
    let tagIds: string[] | undefined = undefined;
    if (isDefined(query.tags)) {
      if (query.tags.length > 0) {
        const allTags = await getTags(client);
        const tags = query.tags.map((tagName) => allTags.find((t) => t.name === tagName));
        if (tags.some((t) => !isDefined(t))) {
          return Ok({ totalCount: 0, items: [] });
        }
        tagIds = tags.map((t) => t!.id);
      } else {
        tagIds = [];
      }
    }
    const _query = gql`
      query GetTemplates_templates(
        $offset: Int!
        $limit: Int!
        $tagIds: [GID!]
        $sortBy: [QueryPetitions_OrderBy!]
        $includeFields: Boolean!
        $includeTags: Boolean!
      ) {
        templates: petitions(
          offset: $offset
          limit: $limit
          sortBy: $sortBy
          filters: { type: TEMPLATE, tagIds: $tagIds }
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
      tagIds,
      includeFields: query.include?.includes("fields") ?? false,
      includeTags: query.include?.includes("tags") ?? false,
    });
    const { items, totalCount } = result.templates;
    assertType<TemplateFragmentType[]>(items);
    return Ok({ items: items.map((t) => mapTemplate(t)), totalCount });
  }
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
  .path("/templates/:templateId/properties", {
    params: { templateId },
  })
  .get(
    {
      operationId: "ReadTemplateCustomProperties",
      summary: "Get template custom properties",
      description: "Returns a key-value object with the custom properties of the template",
      responses: {
        200: SuccessResponse(PetitionCustomProperties),
      },
      tags: ["Templates"],
    },
    async ({ client, params }) => {
      const result = await client.request(ReadPetitionCustomPropertiesDocument, {
        petitionId: params.templateId,
      });

      return Ok(result.petition!.customProperties);
    }
  )
  .post(
    {
      operationId: "CreateOrUpdateTemplateCustomProperty",
      summary: "Create or update template custom property",
      description: outdent`
        Creates or updates a custom property on the template.

        If the provided key already exists as a property, its value is overwritten.
        If the provided key doesn't exist, it's added.

        The petition can have up to 20 different properties.
      `,
      body: JsonBody(CreateOrUpdatePetitionCustomProperty),
      responses: {
        200: SuccessResponse(PetitionCustomProperties),
        409: ErrorResponse({
          description: "You reached the maximum limit of custom properties on the template",
        }),
      },
      tags: ["Templates"],
    },
    async ({ client, body, params }) => {
      try {
        const result = await client.request(
          CreateOrUpdatePetitionCustomProperty_modifyPetitionCustomPropertyDocument,
          { petitionId: params.templateId, key: body.key, value: body.value }
        );
        return Ok(result.modifyPetitionCustomProperty.customProperties);
      } catch (error: any) {
        if (
          error instanceof ClientError &&
          containsGraphQLError(error, "CUSTOM_PROPERTIES_LIMIT_ERROR")
        ) {
          throw new ConflictError(
            "You reached the maximum limit of custom properties on the template."
          );
        }
        throw error;
      }
    }
  );

api
  .path("/templates/:templateId/properties/:key", {
    params: { templateId, key: stringParam({ required: true, maxLength: 100 }) },
  })
  .delete(
    {
      operationId: "DeleteTemplateCustomProperty",
      summary: "Delete template custom property",
      description: outdent`
        Removes the provided key from the custom properties of the template.
    `,
      responses: { 204: SuccessResponse() },
      tags: ["Templates"],
    },
    async ({ client, params }) => {
      await client.request(DeletePetitionCustomProperty_modifyPetitionCustomPropertyDocument, {
        petitionId: params.templateId,
        key: params.key,
      });

      return NoContent();
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
          mutation CreateContact_contact($data: CreateContactInput!) {
            createContact(data: $data) {
              ...Contact
            }
          }
          ${ContactFragment}
        `;
        const result = await client.request(CreateContact_contactDocument, { data: body });
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
  }
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
      },
      tags: ["Subscriptions"],
    },
    async ({ client, body }) => {
      try {
        const _mutation = gql`
          mutation EventSubscriptions_createSubscription($eventsUrl: String!) {
            createEventSubscription(eventsUrl: $eventsUrl) {
              ...Subscription
            }
          }
          ${SubscriptionFragment}
        `;
        const result = await client.request(EventSubscriptions_createSubscriptionDocument, body);

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
      mutation EventSubscriptions_deleteSubscription($ids: [GID!]!) {
        deleteEventSubscriptions(ids: $ids)
      }
    `;
    await client.request(EventSubscriptions_deleteSubscriptionDocument, {
      ids: [params.subscriptionId],
    });
    return NoContent();
  }
);

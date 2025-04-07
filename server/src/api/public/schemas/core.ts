import deepmerge from "deepmerge";
import { JSONSchema6TypeName } from "json-schema";
import { FromSchema } from "json-schema-to-ts";
import { outdent } from "outdent";
import {
  PetitionEventTypeValues,
  PetitionFieldTypeValues,
  ProfileEventTypeValues,
  ProfileTypeFieldTypeValues,
  UserLocaleValues,
} from "../../../db/__types";
import { toGlobalId } from "../../../util/globalId";

import { JsonSchema, JsonSchemaFor, schema } from "../../../util/jsonSchema";
import { UserLocale } from "../__types";
import { PetitionEvent, ProfileEvent } from "./events";

function _ListOf<T extends JsonSchema>(item: T) {
  return {
    title: `${item.title ?? "any"}[]`,
    type: "array",
    items: item,
  } as const;
}

function _OrNull<T extends JsonSchema>(
  item: T,
): Omit<T, "type"> & {
  type: T["type"] extends string[] ? [...T["type"], "null"] : [T["type"], "null"];
} {
  return {
    ...item,
    type: (Array.isArray(item.type)
      ? [...item.type, "null"]
      : [item.type as JSONSchema6TypeName, "null"]) as any,
  };
}

function _PaginationOf<T extends Exclude<JsonSchema, boolean>>(item: T) {
  return {
    title: `PaginatedList<${item.title ?? "*missing item title*"}>`,
    type: "object",
    description: "Paginated resource",
    additionalProperties: false,
    required: ["items", "totalCount"],
    properties: {
      items: {
        description: "The requested slice of items from this paginated resource",
        type: "array",
        items: item,
      },
      totalCount: {
        description: "The total count of elements in this paginated resource",
        type: "integer",
        minimum: 0,
        example: 42,
      },
    },
  } as const;
}

function ListOf<T extends JsonSchemaFor<any>>(
  item: T,
): T extends JsonSchemaFor<infer U> ? JsonSchemaFor<U[]> : never;
function ListOf<T extends JsonSchema>(item: T): JsonSchemaFor<FromSchema<T>[]>;
function ListOf(item: any) {
  return _ListOf(item);
}

const _User = {
  title: "User",
  type: "object",
  additionalProperties: false,
  required: ["id", "email", "firstName", "lastName", "fullName"],
  properties: {
    id: {
      description: "The ID of the user",
      type: "string",
    },
    email: {
      description: "The email of the user",
      type: "string",
    },
    firstName: {
      description: "The first name of the user",
      type: ["string", "null"],
    },
    lastName: {
      description: "The last name of the user",
      type: ["string", "null"],
    },
    fullName: {
      description: "The full name of the user",
      type: ["string", "null"],
    },
  },
  example: {
    id: toGlobalId("User", 42),
    email: "michael.scofield@yahoo.com",
    firstName: "Michael",
    lastName: "Scofield",
    fullName: "Michael Scofield",
  },
} as const;

const _Organization = {
  title: "Organization",
  type: "object",
  additionalProperties: false,
  required: ["id", "name"],
  properties: {
    id: {
      description: "The ID of the organization",
      type: "string",
    },
    name: {
      description: "The name of the organization",
      type: "string",
    },
  },
  example: {
    id: "yw7RQt2cQ4XDHdrbtL3",
    name: "Pied Piper",
  },
} as const;

const _UserWithOrg = {
  ..._User,
  title: "UserWithOrg",
  required: [..._User.required, "organization"],
  properties: { ..._User.properties, organization: _Organization },
  example: {
    ..._User.example,
    organization: _Organization.example,
  },
} as const;

const _UserGroup = {
  title: "UserGroup",
  type: "object",
  additionalProperties: false,
  required: ["id", "name"],
  properties: {
    id: {
      description: "The ID of the user group",
      type: "string",
    },
    name: {
      description: "The name of the user group",
      type: "string",
    },
  },
  example: {
    id: toGlobalId("UserGroup", 42),
    name: "Pearson Specter",
  },
} as const;

const _Contact = {
  title: "Contact",
  type: "object",
  additionalProperties: false,
  required: ["id", "email", "firstName", "lastName", "fullName", "createdAt", "updatedAt"],
  properties: {
    id: {
      type: "string",
      description: "The ID of the contact",
    },
    email: {
      type: "string",
      format: "email",
      description: "The email of the contact",
    },
    firstName: {
      type: "string",
      description: "The first name of the contact",
    },
    lastName: {
      type: ["string", "null"],
      description: "The last name of the contact",
    },
    fullName: {
      type: "string",
      description: "The full name of the contact",
    },
    createdAt: {
      type: "string",
      format: "date-time",
      description: "Creation date of the contact",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
      description: "Last update date of the contact",
    },
  },
  example: {
    id: toGlobalId("Contact", 42),
    email: "tyrion@casterlyrock.wes",
    firstName: "Tyrion",
    lastName: "Lannister",
    fullName: "Tyrion Lannister",
    createdAt: new Date(2020, 2, 15).toISOString(),
    updatedAt: new Date(2020, 2, 15).toISOString(),
  },
} as const;

const _PetitionAccess = {
  title: "PetitionAccess",
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "status",
    "contact",
    "granter",
    "reminderCount",
    "remindersLeft",
    "remindersActive",
    "nextReminderAt",
    "createdAt",
  ],
  properties: {
    id: {
      description: "The ID of the parallel access",
      type: "string",
      example: toGlobalId("PetitionAccess", 42),
    },
    contact: {
      ..._Contact,
      description: "The recipient contact of the parallel access",
      type: [_Contact.type, "null"],
    },
    granter: {
      ..._User,
      description: "The user who created this parallel access",
      type: [_User.type, "null"],
    },
    status: {
      description: "The status of the parallel access",
      type: "string",
      enum: ["ACTIVE", "INACTIVE"],
      example: "ACTIVE",
    },
    reminderCount: {
      description: "Number of reminders sent for the parallel access",
      type: "integer",
      example: 2,
    },
    remindersLeft: {
      description: "Number of reminders left for the parallel access",
      type: "integer",
      example: 8,
    },
    remindersActive: {
      description: "Whether reminders are active for the parallel access",
      type: "boolean",
      example: true,
    },
    nextReminderAt: {
      description: "Date of the next reminder",
      type: ["string", "null"],
      format: "date-time",
      example: new Date(2020, 2, 17, 8, 0, 0).toISOString(),
    },
    createdAt: {
      description: "Creation date of the parallel access",
      type: "string",
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
    recipientUrl: {
      description: "URL of the recipient portal for this parallel access",
      type: ["string", "null"],
      example: "https://www.onparallel.com/petition/38s5hnjATHXJp5XWHYcucQm",
    },
  },
} as const;

const _PetitionFieldInner = {
  title: "PetitionField",
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "title",
    "description",
    "type",
    "fromPetitionFieldId",
    "alias",
    "options",
    "optional",
    "multiple",
  ],
  properties: {
    id: {
      type: "string",
      description: "The ID of the parallel field",
      example: toGlobalId("PetitionField", 100),
    },
    title: {
      type: ["string", "null"],
      description: "Title of the field",
      example: "First name",
    },
    description: {
      type: ["string", "null"],
      description: "Description of the field",
      example: "Please, tell us your name",
    },
    type: {
      type: "string",
      enum: PetitionFieldTypeValues,
      description: "The type of the field",
      example: "TEXT",
    },
    fromPetitionFieldId: {
      type: ["string", "null"],
      description: "The field ID from where this field was cloned",
      example: toGlobalId("PetitionField", 30),
    },
    alias: {
      type: ["string", "null"],
      description: "The field alias specified within the request / template",
      example: "firstName",
    },
    options: {
      description:
        "For fields of type `SELECT` and `CHECKBOX`. An array with valid options for the reply.",
      anyOf: [
        {
          type: "array",
          items: {
            type: "string",
          },
        },
        {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["value", "label"],
            properties: {
              value: {
                type: "string",
                description: "The value of the option",
              },
              label: {
                type: "string",
                description: "The label of the option",
              },
            },
          },
        },
      ],
      example: [],
    },
    optional: {
      type: "boolean",
      description: "If `true`, this field is optional. Optional fields do not require a reply.",
      example: false,
    },
    multiple: {
      type: "boolean",
      description: "If `true`, this field allows an unlimited amount of replies.",
      example: false,
    },
  },
} as const;

const _PetitionField = {
  title: "PetitionField",
  type: "object",
  additionalProperties: false,
  required: [..._PetitionFieldInner.required, "children"],
  properties: {
    ..._PetitionFieldInner.properties,
    children: {
      type: ["array", "null"],
      example: null,
      description: "For fields of type `FIELD_GROUP`. An array with the linked fields.",
      items: {
        ..._PetitionFieldInner,
        properties: {
          ..._PetitionFieldInner.properties,
          type: {
            type: "string",
            enum: PetitionFieldTypeValues.filter((t) => !["HEADING", "FIELD_GROUP"].includes(t)),
            description: "The type of the field",
            example: "TEXT",
          },
        },
      },
    },
  },
} as const;

const _PetitionComment = {
  title: "PetitionFieldComment",
  type: "object",
  required: ["id", "content", "author", "mentions", "createdAt", "isAnonymized"],
  properties: {
    id: {
      type: "string",
      description: "The ID of the parallel comment",
      example: toGlobalId("PetitionFieldComment", 100),
    },
    content: {
      type: ["string", "null"],
      description:
        "The content of the comment in plain text, or `null` if the comment was anonymized by compliance rules.",
      example: `This is a comment for @[John Doe|id:${toGlobalId("User", 42)}]`,
    },
    author: {
      type: ["object", "null"],
      required: ["type", "id", "email", "fullName"],
      properties: {
        type: {
          type: "string",
          description: "The type of the comment author",
          enum: ["USER", "CONTACT"],
          example: "USER",
        },
        id: {
          type: "string",
          description: "The ID of the comment author",
          example: toGlobalId("User", 2),
        },
        email: {
          type: "string",
          description: "The email of the comment author",
          example: "mike.ross@example.com",
        },
        fullName: {
          type: ["string", "null"],
          description: "The full name of the comment author",
          example: "Mike Ross",
        },
      },
    },
    mentions: {
      type: "array",
      description: "The mentioned users and groups in the comment",
      items: {
        anyOf: [
          {
            title: "UserMention",
            type: ["object", "null"],
            required: ["id", "type", "email", "name"],
            properties: {
              type: { type: "string", const: "USER" },
              id: {
                type: "string",
                description: "The ID of the mentioned user",
                example: toGlobalId("User", 42),
              },
              email: {
                type: "string",
                description: "The email of the mentioned user",
                example: "john.doe@example.com",
              },
              name: {
                type: "string",
                description: "The full name of the mentioned user",
                example: "John Doe",
              },
            },
          },
          {
            title: "UserGroupMention",
            type: ["object", "null"],
            required: ["id", "type", "name"],
            properties: {
              type: { type: "string", const: "GROUP" },
              id: {
                type: "string",
                description: "The ID of the mentioned group",
                example: toGlobalId("UserGroup", 42),
              },
              name: {
                type: "string",
                description: "The name of the mentioned group",
                example: "Developers",
              },
            },
          },
        ],
      },
    },
    createdAt: {
      type: "string",
      format: "date-time",
      description: "Creation date of the comment",
      example: new Date(2020, 2, 15).toISOString(),
    },
    isAnonymized: {
      type: "boolean",
      description:
        "`true` if this comment was anonymized by compliance rules defined on the organization, `false` otherwise.",
      example: false,
    },
  },
} as const;

const _PetitionFieldReplyInner = {
  title: "PetitionFieldReply",
  type: "object",
  required: ["id", "content", "status", "createdAt", "updatedAt"],
  properties: {
    id: {
      type: "string",
      description: "The ID of the parallel field reply",
      example: toGlobalId("PetitionFieldReply", 100),
    },
    status: {
      type: "string",
      description: "Status of the reply. `APPROVED` replies cannot be updated or deleted.",
      enum: ["PENDING", "APPROVED", "REJECTED"],
      example: "PENDING",
    },
    metadata: {
      type: "object",
      description:
        "Only for fields of type `FILE_UPLOAD`, `ES_TAX_DOCUMENTS` and `ID_VERIFICATION`. Contains extra information on the uploaded file",
    },
    content: {
      anyOf: [
        {
          title: "Text reply",
          type: "string",
          description: "The text content of the reply",
          example: "Robert Baratheon",
        },
        {
          title: "File reply",
          type: "object",
          required: ["filename", "size", "contentType"],
          additionalProperties: false,
          properties: {
            filename: {
              type: "string",
              description: "The name of the submitted file",
              example: "Photo_ID.jpeg",
            },
            size: {
              type: "integer",
              description: "The size of the file in bytes",
              example: 1928824,
            },
            contentType: {
              type: "string",
              description: "The content-type of the file",
              example: "image/jpeg",
            },
          },
        },
        {
          title: "Dynamic select reply",
          description:
            "An array of tuples where the first element is the name of the field and the second element is the reply",
          type: "array",
          minItems: 2,
          items: {
            type: "array",
            items: [{ type: "string" }, { type: "string" }],
          },
          example: [
            ["Comunidad autónoma", "Andalucía"],
            ["Provincia", "Cádiz"],
          ],
        },
        {
          title: "Checkbox reply",
          description: "An array with the selected choices.",
          type: "array",
          items: {
            type: "string",
          },
          example: ["Option 1", "Option 3"],
        },
        {
          title: "Number reply",
          type: "number",
          description: "The value entered by the recipient",
          example: 123,
        },
        {
          title: "Datetime reply",
          description: "An object with the date and timezone.",
          type: "object",
          required: ["value", "datetime", "timezone"],
          additionalProperties: false,
          properties: {
            value: {
              type: "string",
              description: "The date in UTC ISO 8601 format",
              example: "2023-03-03T02:01:00.000Z",
            },
            datetime: {
              type: "string",
              description: "The date in YYYY-MM-DDTHH:mm format",
              example: "2003-03-03T02:00",
            },
            timezone: {
              type: "string",
              description: "The timezone of the date",
              example: "Europe/Madrid",
            },
          },
        },
        {
          title: "Field group reply",
          type: "object",
          description: "The reply group for fields of type `FIELD_GROUP`",
          example: {},
        },
        {
          title: "Background Check reply",
          type: "object",
          description: "The reply for fields of type `BACKGROUND_CHECK`",
          required: ["query", "search"],
          properties: {
            query: {
              type: "object",
              example: {
                name: "Jon Doe",
                date: "2022-10-10",
              },
            },
            search: {
              type: "object",
              example: {
                totalCount: 3,
                createdAt: "2022-10-10T09:30:21",
                items: [{ id: "1", type: "Person", properties: {} }],
              },
            },
            entity: {
              type: ["object", "null"],
            },
          },
        },
      ],
    },
    createdAt: {
      type: "string",
      format: "date-time",
      description: "Creation date of the reply",
      example: new Date(2020, 2, 15).toISOString(),
    },
    updatedAt: {
      type: "string",
      format: "date-time",
      description: "Last time update of the reply",
      example: new Date(2020, 2, 20).toISOString(),
    },
  },
} as const;

const _PetitionFieldReply = {
  title: "PetitionFieldReply",
  type: "object",
  required: [..._PetitionFieldReplyInner.required, "children"],
  properties: {
    ..._PetitionFieldReplyInner.properties,
    children: {
      title: "PetitionFieldReplyGroup",
      type: ["array", "null"],
      example: null,
      description:
        "For fields of type `FIELD_GROUP`. An array with the linked field replies. Each child contains the replies of a field on the reply group.",
      items: {
        type: "object",
        required: ["field", "replies"],
        properties: {
          field: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "The ID of the parallel field",
                example: toGlobalId("PetitionField", 100),
              },
              type: {
                type: "string",
                enum: PetitionFieldTypeValues.filter(
                  (v) => !["HEADING", "FIELD_GROUP"].includes(v),
                ),
                description: "The type of the field",
                example: "TEXT",
              },
            },
          },
          replies: {
            type: "array",
            items: _PetitionFieldReplyInner,
          },
        },
      },
    },
  },
} as const;

const _PetitionFieldWithReplies = {
  ..._PetitionField,
  required: [..._PetitionField.required, "replies"],
  properties: {
    ..._PetitionField.properties,
    replies: {
      type: "array",
      items: { ..._PetitionFieldReply },
    },
  },
} as const;

export const _PetitionSigner = {
  type: "object",
  title: "PetitionSigner",
  description: "Information about the signer",
  required: ["email", "firstName", "lastName"],
  additionalProperties: false,
  properties: {
    firstName: { type: "string" },
    lastName: { type: ["string", "null"] },
    email: { type: "string" },
  },
  example: {
    firstName: "Tywin",
    lastName: "Lannister",
    email: "tywin@casterlyrock.com",
  },
} as const;

const _VariablesResult = {
  type: "object",
  title: "VariablesResult",
  description: "Information about the variables",
  required: ["name", "value"],
  additionalProperties: false,
  properties: {
    name: { type: "string", description: "The name of the variable" },
    value: {
      type: ["number", "null"],
      description:
        "The final value of the variable based on the calculations applied on each field. This can be null if some calculation results in a non-numeric value, like division by zero.",
    },
  },
} as const;

const _SignatureRequest = {
  type: "object",
  additionalProperties: false,
  required: ["id", "environment", "createdAt", "updatedAt", "status", "signers"],
  properties: {
    id: {
      type: "string",
      description: "The ID of the parallel signature request",
      example: toGlobalId("PetitionSignatureRequest", 1),
    },
    environment: {
      description:
        "The environment of the used signature integration. DEMO signatures have no legal validity.",
      type: "string",
      enum: ["DEMO", "PRODUCTION"],
      example: "PRODUCTION",
    },
    status: {
      type: "string",
      enum: ["ENQUEUED", "PROCESSING", "PROCESSED", "CANCELLING", "CANCELLED", "COMPLETED"],
      description: "Current status of the signature request",
      example: "COMPLETED",
    },
    signers: {
      type: "array",
      items: _PetitionSigner,
      description: "The list of signers",
    },
    createdAt: {
      description: "Creation date of the signature request",
      type: "string",
      format: "date-time",
      example: new Date(2021, 1, 15).toISOString(),
    },
    updatedAt: {
      description: "Date and time of the last event on the signature request",
      type: "string",
      format: "date-time",
      example: new Date(2021, 2, 15).toISOString(),
    },
  },
} as const;
export const ListOfSignatureRequests = ListOf(_SignatureRequest);
export const SignatureRequest = schema(_SignatureRequest);

const _Petition = {
  title: "Petition",
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "name",
    "path",
    "status",
    "deadline",
    "locale",
    "createdAt",
    "customProperties",
    "isAnonymized",
  ],
  properties: {
    id: {
      description: "The ID of the parallel",
      type: "string",
      example: toGlobalId("Petition", 42),
    },
    path: {
      description: "The path of the parallel",
      type: "string",
      example: "/",
    },
    name: {
      description: "The name of the parallel",
      example: "My parallel",
      type: ["string", "null"],
    },
    status: {
      description: "The status of the parallel",
      type: "string",
      enum: ["DRAFT", "PENDING", "COMPLETED", "CLOSED"],
    },
    deadline: {
      description: "The deadline of the parallel for informative purposes",
      type: ["string", "null"],
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
    locale: {
      description: "The locale of the parallel",
      type: "string",
      enum: ["ca", "en", "es", "it", "pt"],
      example: "en",
    },
    createdAt: {
      description: "Creation date of the parallel",
      type: "string",
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
    fromTemplateId: {
      description: "ID of the template used to create the parallel",
      type: ["string", "null"],
      example: toGlobalId("Petition", 1),
    },
    customProperties: {
      description: "The custom properties of the parallel",
      type: "object",
      example: { clientId: "1234" },
    },
    recipients: {
      description:
        "If parameter `include` contains `recipients`, this will be the list of recipients this parallel has been sent to.",
      ..._ListOf(_PetitionAccess),
    },
    fields: {
      description:
        "If parameter `include` contains `fields`, this will be the list of the parallel fields with their submitted replies.",
      ..._ListOf(_PetitionFieldWithReplies),
    },
    tags: {
      type: "array",
      description:
        "If parameter `include` contains `tags`, this will be the list of tags of the parallel.",
      items: {
        type: "string",
      },
      example: ["priority", "kyc"],
    },
    replies: {
      type: "object",
      description: outdent`
      If parameter \`include\` contains \`replies\`, this will be a key-value object where each key is a field alias and the value is the submitted replies on the field.
      For FILE_UPLOAD, ES_TAX_DOCUMENTS, ID_VERIFICATION and DOW_JONES_KYC fields, the value will contain the \`replyId\`, with which you can use the [/download](#operation/DownloadFileReply) endpoint to download the file.
      `,
      example: {
        firstName: "Robert Baratheon",
        certificateOfBirth: {
          filename: "robert_baratheon_cob.pdf",
          size: 10344,
          contentType: "application/pdf",
          extension: "pdf",
          uploadComplete: true,
          replyId: toGlobalId("PetitionFieldReply", 21),
          metadata: { external_id: 123 },
        },
      },
    },
    progress: {
      type: "object",
      description: outdent`
        The progress on the parallel separated into internal and external fields.

        Each category has values for:
          - \`approved\`: Replied and approved fields.
          - \`replied\`: Replied but not approved.
          - \`optional\`: Non-replied fields that are optional.
          - \`total\`: The total number of repliable fields in the category.
      `,
      example: {
        external: {
          approved: 0,
          replied: 1,
          optional: 0,
          total: 1,
        },
        internal: {
          approved: 0,
          replied: 0,
          optional: 0,
          total: 0,
        },
      },
    },
    signers: {
      description:
        "If parameter `include` contains `signers`, this will be the list of signers of the parallel.",
      ...ListOf(_PetitionSigner),
    },
    variablesResult: {
      description:
        "If parameter `include` contains `variablesResult`, this will be the list of defined variables of the parallel.",
      ...ListOf(_VariablesResult),
    },
    signatures: {
      description:
        "If parameter `include` contains `signatures`, this will be the list of ongoing and finished signatures of the parallel.",
      ...ListOfSignatureRequests,
    },
    owner: {
      description:
        "If parameter `include` contains `owner`, this will be the owner of the parallel.",
      ..._User,
    },
    isAnonymized: {
      type: "boolean",
      description:
        "`true` if this parallel was anonymized by compliance rules defined on the organization, `false` otherwise.",
      example: false,
    },
  },
} as const;

const _Template = {
  title: "Template",
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "path", "description", "locale", "createdAt", "customProperties"],
  properties: {
    id: {
      description: "The ID of the template",
      type: "string",
      example: toGlobalId("Petition", 42),
    },
    name: {
      description: "The name of the template",
      type: ["string", "null"],
      example: "My parallel",
    },
    path: {
      description: "The path of the template",
      type: "string",
      example: "/",
    },
    description: {
      description: "The description of the template",
      type: ["string", "null"],
      example:
        "Lorem ipsum dolor sit amet consectetur adipiscing elit magnis porttitor tempor, imperdiet class neque purus ornare justo aptent orci sed pellentesque, natoque laoreet tincidunt volutpat ultricies suscipit iaculis hendrerit inceptos.",
    },
    locale: {
      description: "The locale of the template",
      type: "string",
      enum: ["ca", "en", "es", "it", "pt"],
      example: "en",
    },
    createdAt: {
      description: "Creation date of the template",
      type: "string",
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
    customProperties: {
      description: "The custom properties of the template",
      type: "object",
      example: { clientId: "1234" },
    },
    fields: {
      description:
        "If parameter `include` contains `fields`, this will be the list of the parallel fields.",
      ..._ListOf(_PetitionField),
    },
    tags: {
      type: "array",
      description: "List of tags of the template",
      items: {
        type: "string",
      },
      example: ["priority", "kyc"],
    },
  },
} as const;

const _RemindersConfig = {
  title: "RemindersConfig",
  description: "The configuration on when the reminders should be sent",
  type: "object",
  required: ["offset", "time", "timezone", "weekdaysOnly"],
  additionalProperties: false,
  properties: {
    offset: {
      description: "The amount of days between reminders",
      type: "integer",
      minimum: 1,
    },
    time: {
      description: "The time of the day at which the reminder should be sent (00:00 - 23:59)",
      type: "string",
      format: "time",
    },
    timezone: {
      description: "The IANA timezone the time is referring to",
      type: "string",
      format: "time-zone",
    },
    weekdaysOnly: {
      description: "Whether to send reminders only on weekdays",
      type: "boolean",
    },
    limit: {
      description: "Whether to send reminders only on weekdays",
      type: "integer",
      maximum: 10,
      minimum: 1,
    },
  },
  example: {
    offset: 2,
    time: "09:30",
    timezone: "Europe/Madrid",
    weekdaysOnly: false,
    limit: 5,
  },
} as const;

const _MessageBody = {
  title: "PlainTextMessage",
  type: "object",
  required: ["format", "content"],
  additionalProperties: false,
  properties: {
    format: {
      type: "string",
      description:
        "Constant value `PLAIN_TEXT` indicating that the content is in plain text format",
      const: "PLAIN_TEXT",
      example: "PLAIN_TEXT",
    },
    content: {
      description: "The content of the message",
      type: "string",
      example: "Hi Daryl,\nPlease fill the following information\n\nRegards,\nRick",
    },
  },
} as const;

const _CommonPermission = {
  permissionType: {
    description: outdent`
      The type of permission.  
      \`OWNER\`: Full access to the parallel. There can only be one owner per parallel.  
      \`READ\`: Read-only access. Users with READ permission can't modify the parallel in any way.  
      \`WRITE\`: Same level of access as the owner.   
    `,
    type: "string",
    enum: ["OWNER", "READ", "WRITE"],
    example: "OWNER",
  },
  createdAt: {
    description: "Creation date of the permission",
    type: "string",
    format: "date-time",
    example: new Date(2020, 2, 15).toISOString(),
  },
} as const;

const _Permission = {
  title: "PetitionPermission",
  type: "object",
  anyOf: [
    {
      type: "object",
      title: "UserPetitionPermission",
      required: ["permissionType", "user", "createdAt"],
      additionalProperties: false,
      properties: {
        user: {
          ..._User,
          description: "The user linked to this permission",
        },
        ..._CommonPermission,
      },
    },
    {
      type: "object",
      title: "UserGroupPetitionPermission",
      required: ["permissionType", "group", "createdAt"],
      additionalProperties: false,
      properties: {
        group: {
          ..._UserGroup,
          description: "The user group linked to this permission",
        },
        ..._CommonPermission,
      },
    },
  ],
} as const;

export const Petition = schema(_Petition);
export const UpdatePetition = schema({
  title: "UpdatePetition",
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    name: {
      description: "The name of the parallel",
      type: ["string", "null"],
      example: "My parallel",
    },
    deadline: {
      description: "The deadline of the parallel for informative purposes",
      type: ["string", "null"],
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
    locale: {
      description: "The locale of the parallel",
      type: "string",
      enum: ["en", "es"],
      example: "en",
    },
    signers: {
      description: "The list of signers of the parallel",
      ..._ListOf(_PetitionSigner),
      type: ["array", "null"],
      minItems: 1,
    },
  },
} as const);

export const CreatePetition = schema({
  title: "CreatePetition",
  type: "object",
  additionalProperties: false,
  required: ["templateId"],
  properties: {
    templateId: {
      description: "The ID of the template to use as base",
      type: "string",
      example: toGlobalId("Petition", 42),
    },
    name: {
      description: "An optional name for the created parallel",
      type: ["string", "null"],
      example: "My parallel",
    },
  },
} as const);
export const UpdatePetitionField = schema({
  title: "UpdatePetitionField",
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    title: {
      description: "The title of the parallel field",
      type: ["string", "null"],
      example: "ID",
    },
    description: {
      description: "The description of the parallel field",
      type: ["string", "null"],
      example: "Please, write your ID number",
    },
    options: {
      description:
        "For fields of type `SELECT` and `CHECKBOX`. An array with valid options. Items in the array can be strings or objects with `value` and `label` properties.",
      anyOf: [
        {
          type: "array",
          maxItems: 1000,
          items: {
            type: "string",
            minLength: 1,
            maxLength: 2000,
          },
        },
        {
          type: "array",
          maxItems: 1000,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["value", "label"],
            properties: {
              value: {
                type: "string",
                description: "The value of the option",
                minLength: 1,
                maxLength: 2000,
              },
              label: {
                type: "string",
                description: "The label of the option",
                minLength: 1,
                maxLength: 2000,
              },
            },
          },
        },
      ],
    },
  },
} as const);

const _Tag = { type: "string", example: ["kyc", "priority"] } as const;

export const PetitionField = schema(_PetitionField);
export const PetitionComment = schema(_PetitionComment);
export const ListOfPetitionComments = ListOf(_PetitionComment);
export const PaginatedTags = schema(_PaginationOf(_Tag));
export const PaginatedPetitions = schema(_PaginationOf(_Petition));
export const PaginatedUsers = schema(_PaginationOf(_User));
export const PetitionAccess = schema(_PetitionAccess);
export const ListOfPetitionAccesses = ListOf(_PetitionAccess);
export const Template = schema(_Template);
export const PaginatedTemplates = schema(_PaginationOf(_Template));
export const Contact = schema(_Contact);
export const User = schema(_User);
export const UserWithOrg = schema(_UserWithOrg);

export const CreatePetitionComment = schema({
  title: "CreatePetitionComment",
  type: "object",
  additionalProperties: false,
  required: ["content"],
  properties: {
    content: {
      type: "string",
      description: outdent`
        The content of the comment.
    
        You can mention other users and groups in your organization by using special tags in your comment:
    
        \`@[id:${toGlobalId("User", 1)}]\` will mention the user with id \`${toGlobalId("User", 1)}\`.
    
        \`@[email:john.doe@example.com]\` will mention the user with email \`john.doe@example.com\`.
    
        \`@[group:Marketing]\` will mention the group named \`Marketing\`.
    
        Have in mind:
        - When mentioning by group name, the first group found with that name will be mentioned.
        - Mentions by group name are case-insensitive but must match the group name exactly.
        - If no user or group is found, the comment will not be submitted and an error will be returned.
      `,
      example: "This is a comment for @[id:6SgRex7ZDC]",
    },
    sharePermission: {
      type: "string",
      description:
        "Share the parallel with READ or WRITE permission if mentioned users or groups don't have access to it. This has no effect if the mentioned users or groups already have access to the parallel.",
      enum: ["READ", "WRITE"],
      example: "READ",
    },
    subscribe: {
      type: "boolean",
      description:
        "Subscribe mentioned users or groups to the parallel when sharing. Has no effect if sharePermission is not set.",
      example: true,
    },
  },
} as const);

export const CreateContact = schema({
  title: "CreateContact",
  type: "object",
  additionalProperties: false,
  required: ["email", "firstName"],
  properties: {
    email: {
      type: "string",
      format: "email",
      description: "The email of the contact",
    },
    firstName: {
      type: "string",
      maxLength: 255,
      description: "The first name of the contact",
    },
    lastName: {
      type: ["string", "null"],
      maxLength: 255,
      description: "The last name of the contact",
    },
  },
  example: {
    email: "tyrion@casterlyrock.wes",
    firstName: "Tyrion",
    lastName: "Lannister",
  },
} as const);
export const PaginatedContacts = schema(_PaginationOf(_Contact));
export const SendPetition = schema({
  title: "SendPetition",
  type: "object",
  required: ["contacts"],
  additionalProperties: false,
  properties: {
    contacts: {
      description: "A list of recipients to send this parallel to",
      type: "array",
      items: {
        oneOf: [
          {
            description: "The ID of the contact to send this parallel to",
            type: "string",
            example: toGlobalId("Contact", 42),
          },
          {
            title: "CreateOrUpdateContact",
            type: "object",
            additionalProperties: false,
            required: ["email", "firstName"],
            properties: {
              email: {
                type: "string",
                format: "email",
                description: "The email of the contact to send this parallel to",
              },
              firstName: {
                type: "string",
                description: "The first name of the contact",
                maxLength: 255,
              },
              lastName: {
                type: ["string", "null"],
                description: "The last name of the contact",
                maxLength: 255,
              },
            },
            example: {
              email: "tyrion@casterlyrock.wes",
              firstName: "Tyrion",
              lastName: "Lannister",
            },
          },
        ],
      },
    },
    message: _OrNull({
      ..._MessageBody,
      description: "The message to include in the email",
    }),
    subject: _OrNull({
      description: "The subject of the email that will be sent to the contacts",
      type: "string",
      maxLength: 255,
      example: "Please fill this parallel",
    }),
    remindersConfig: {
      ..._RemindersConfig,
      type: [_RemindersConfig.type, "null"],
    },
    scheduledAt: {
      description: "Optional date at which to send the email",
      type: ["string", "null"],
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
    sendAs: {
      description:
        "Send the parallel as one of the users that delegated you to send on their behalf. You can pass either the ID or the email of the delegate",
      type: "string",
      example: toGlobalId("User", 1003),
    },
    skipEmailSend: {
      description: "If `true`, the email will not be sent to the contacts",
      type: "boolean",
    },
  },
} as const);

export const SharePetition = schema({
  title: "SharePetition",
  type: "object",
  additionalProperties: false,
  required: [],
  properties: {
    emails: {
      description: "List with emails of the users you want to share the parallel with",
      type: "array",
      maxItems: 100,
      items: {
        type: "string",
        example: "user@domain.com",
      },
    },
    userIds: {
      description: "IDs of the users you want to share the parallel with",
      type: "array",
      items: {
        type: "string",
        example: toGlobalId("User", 42),
      },
    },
    userGroupIds: {
      description: "IDs of the user groups you want to share the parallel with",
      type: "array",
      items: {
        type: "string",
        example: toGlobalId("UserGroup", 42),
      },
    },
    // permissionType: {
    //   description: "The type of permission you want to assign to the users",
    //   type: "string",
    //   enum: ["READ", "WRITE"],
    // },
  },
} as const);

const _TextReplySubmitContent = {
  title: "TextReplySubmitContent",
  type: "string",
  description:
    "For text replies. The referred field must be of type `TEXT`, `SHORT_TEXT`, `SELECT` or `PHONE`.",
  example: "Jamie Lannister",
} as const;

const _DateReplySubmitContent = {
  title: "DateReplySubmitContent",
  type: "string",
  format: "date",
  description: "For fields of type `DATE`, with format YYYY-MM-DD.",
  example: "2022-02-15",
} as const;

const _NumberReplySubmitContent = {
  title: "NumberReplyContent",
  type: "number",
  description: "For fields of type `NUMBER`.",
  example: 42,
} as const;

const _FileUploadReplySubmitContent = {
  title: "FileUploadReplyContent",
  type: "object",
  isFile: true,
  description:
    "For fields of type `FILE_UPLOAD`. The content of this reply is the file to be uploaded.",
  example: "<binary data>",
} as const;

const _CheckboxReplySubmitContent = {
  title: "CheckboxReplyContent",
  type: "array",
  description:
    "For fields of type `CHECKBOX`. Each of the elements in the array is an option of the checkbox field.",
  items: { type: "string", example: "Option 1" },
  example: ["Option 1", "Option 2"],
} as const;

const _DynamicSelectReplySubmitContent = {
  title: "DynamicSelectReplyContent",
  type: "array",
  description: "For fields of type `DYNAMIC_SELECT`.",
  items: { type: "string", example: "Cataluña" },
  example: ["Cataluña", "Barcelona"],
} as const;

const _DateTimeReplySubmitContent = {
  title: "DateTimeReplySubmitContent",
  type: "object",
  additionalProperties: false,
  properties: {
    datetime: {
      type: "string",
      description: "The date in YYYY-MM-DDTHH:mm format",
      example: "2003-03-03T02:00",
    },
    timezone: {
      type: "string",
      description: "The timezone of the date",
      example: "Europe/Madrid",
    },
  },
} as const;

const _PetitionFieldReplyStatus = {
  type: "string",
  title: "PetitionFieldReplyStatus",
  description:
    "Optionally, you can pass a status for the reply. `APPROVED` replies can't be updated or deleted. This can be useful when you don't want your replies to be modified.",
  enum: ["PENDING", "APPROVED", "REJECTED"],
  example: "APPROVED",
} as const;

const _PetitionFieldReplyParentReplyId = {
  type: "string",
  description: `The ID of the FIELD_GROUP reply. Only for replying children of \`FIELD_GROUP\``,
  example: null,
} as const;

export const SubmitReply = schema({
  title: "SubmitReply",
  type: "object",
  additionalProperties: false,
  required: ["reply"],
  properties: {
    reply: {
      anyOf: [
        _TextReplySubmitContent,
        _DateReplySubmitContent,
        _NumberReplySubmitContent,
        _CheckboxReplySubmitContent,
        _DynamicSelectReplySubmitContent,
        _DateTimeReplySubmitContent,
      ],
    },
    status: _PetitionFieldReplyStatus,
    parentReplyId: _PetitionFieldReplyParentReplyId,
  },
} as const);

export const UpdateReply = schema({
  title: "UpdateReply",
  type: "object",
  additionalProperties: false,
  required: ["reply"],
  properties: {
    reply: {
      anyOf: [
        _TextReplySubmitContent,
        _DateReplySubmitContent,
        _NumberReplySubmitContent,
        _CheckboxReplySubmitContent,
        _DynamicSelectReplySubmitContent,
        _DateTimeReplySubmitContent,
      ],
    },
  },
} as const);

export const SubmitFileReply = schema({
  title: "SubmitReply",
  type: "object",
  additionalProperties: false,
  required: ["reply"],
  properties: {
    reply: _FileUploadReplySubmitContent,
    password: {
      type: "string",
      description: "Provide password when uploading a password-protected PDF file",
    } as const,
    status: _PetitionFieldReplyStatus,
    parentReplyId: _PetitionFieldReplyParentReplyId,
  },
} as const);

export const UpdateFileReply = schema({
  title: "UpdateFileReply",
  type: "object",
  additionalProperties: false,
  required: ["reply"],
  properties: {
    reply: _FileUploadReplySubmitContent,
    password: {
      type: "string",
      description: "Provide password when uploading a password-protected PDF file",
    },
  },
} as const);

export const ListOfPermissions = ListOf(_Permission);

export const ListOfPetitionFieldsWithReplies = ListOf(_PetitionFieldWithReplies);

export const PetitionFieldReply = schema(_PetitionFieldReply);

export const FileDownload = schema({
  type: "object",
  description: "The generated temporary file URL",
  required: ["file"],
  additionalProperties: false,
  properties: {
    file: {
      type: "string",
    },
  },
} as const);

export const ListOfPetitionEvents = ListOf(PetitionEvent);
export const ListOfProfileEvents = ListOf(ProfileEvent);

const _PetitionEventSubscription = {
  title: "PetitionEventSubscription",
  type: "object",
  additionalProperties: false,
  required: ["id", "type", "name", "eventsUrl", "isEnabled", "eventTypes", "fromTemplateId"],
  properties: {
    id: {
      type: "string",
      description: "ID of the subscription",
      example: toGlobalId("PetitionEventSubscription", 10),
    },
    type: {
      type: "string",
      const: "PETITION",
    },
    name: {
      type: ["string", "null"],
      description: "Name of the subscription",
      example: "My subscription",
    },
    eventsUrl: {
      type: "string",
      description: "URL where we will send POST requests with real-time parallel events",
      example: "https://www.example.com/events",
    },
    isEnabled: {
      type: "boolean",
      description: "Wether this subscription is currently enabled or not",
      example: true,
    },
    eventTypes: {
      type: ["array", "null"],
      description: "The events linked with the subscription. If null, every event will be sent.",
      example: ["PETITION_COMPLETED", "MESSAGE_SENT"],
      items: { type: "string", enum: PetitionEventTypeValues },
    },
    fromTemplateId: {
      type: ["string", "null"],
      description:
        "Optional template ID. If specified, only events originating in parallels created from this template will be sent.",
      example: toGlobalId("Petition", 10),
    },
  },
} as const;

const _ProfileEventSubscription = {
  title: "ProfileEventSubscription",
  type: "object",
  additionalProperties: false,
  required: ["id", "type", "name", "eventsUrl", "isEnabled", "eventTypes", "fromProfileTypeId"],
  properties: {
    id: {
      type: "string",
      description: "ID of the subscription",
      example: toGlobalId("ProfileEventSubscription", 10),
    },
    type: {
      type: "string",
      const: "PROFILE",
    },
    name: {
      type: ["string", "null"],
      description: "Name of the subscription",
      example: "My subscription",
    },
    eventsUrl: {
      type: "string",
      description: "URL where we will send POST requests with real-time parallel events",
      example: "https://www.example.com/events",
    },
    isEnabled: {
      type: "boolean",
      description: "Wether this subscription is currently enabled or not",
      example: true,
    },
    eventTypes: {
      type: ["array", "null"],
      description: "The events linked with the subscription. If null, every event will be sent.",
      example: ["PROFILE_CREATED", "PROFILE_FIELD_VALUE_UPDATED"],
      items: { type: "string", enum: ProfileEventTypeValues },
    },
    fromProfileTypeId: {
      type: ["string", "null"],
      description:
        "Optional profile type ID. If specified, only events originating in profiles created from this profile type will be sent.",
      example: toGlobalId("ProfileType", 10),
    },
  },
} as const;

const _EventSubscription = {
  type: "object",
  anyOf: [_PetitionEventSubscription, _ProfileEventSubscription],
} as const;

export const ListOfSubscriptions = ListOf(_EventSubscription);
export const EventSubscription = schema(_EventSubscription);

const _CreatePetitionEventSubscription = {
  title: "CreatePetitionEventSubscription",
  type: "object",
  additionalProperties: false,
  required: ["type", "eventsUrl"],
  properties: {
    name: {
      type: ["string", "null"],
      description: "Optional name to identify the subscription",
      example: "My subscription",
    },
    type: {
      type: "string",
      const: "PETITION",
    },
    eventsUrl: {
      description: "The URL where you will receive POST requests with real time parallel events",
      type: "string",
      example: "https://www.example.com/events",
    },
    eventTypes: {
      type: ["array", "null"],
      description:
        "The type of events you want to subscribe to. If null, you will be subscribed to all the events.",
      example: ["PETITION_COMPLETED", "COMMENT_PUBLISHED", "SIGNATURE_STARTED"],
      items: {
        type: "string",
        enum: PetitionEventTypeValues,
      },
    },
    fromTemplateId: {
      type: ["string", "null"],
      description:
        "Optional template ID. If specified, only events originating in parallels created from this template will be sent.",
      example: toGlobalId("Petition", 10),
    },
  },
} as const;

const _CreateProfileEventSubscription = {
  title: "CreateProfileEventSubscription",
  type: "object",
  additionalProperties: false,
  required: ["type", "eventsUrl"],
  properties: {
    name: {
      type: ["string", "null"],
      description: "Optional name to identify the subscription",
      example: "My subscription",
    },
    type: {
      type: "string",
      const: "PROFILE",
    },
    eventsUrl: {
      description: "The URL where you will receive POST requests with real time parallel events",
      type: "string",
      example: "https://www.example.com/events",
    },
    eventTypes: {
      type: ["array", "null"],
      description:
        "The type of events you want to subscribe to. If null, you will be subscribed to all the events.",
      example: ["PROFILE_CREATED", "PROFILE_FIELD_VALUE_UPDATED"],
      items: {
        type: "string",
        enum: ProfileEventTypeValues,
      },
    },
    fromProfileTypeId: {
      type: ["string", "null"],
      description:
        "Optional profile type ID. If specified, only events originating in profiles created from this profile type will be sent.",
      example: toGlobalId("ProfileType", 10),
    },
  },
} as const;

export const CreateEventSubscription = schema<
  typeof _CreatePetitionEventSubscription | typeof _CreateProfileEventSubscription
>({
  type: "object",
  oneOf: [_CreatePetitionEventSubscription, _CreateProfileEventSubscription],
} as any);

export const PetitionCustomProperties = schema({
  type: "object",
  additionalProperties: true,
  example: { "Client Id": "1234" },
} as const);

export const CreateOrUpdatePetitionCustomProperty = schema({
  title: "CreateOrUpdateCustomProperty",
  type: "object",
  required: ["key", "value"],
  additionalProperties: false,
  properties: {
    key: {
      description: "Key of the property",
      example: "Client Id",
      type: "string",
      maxLength: 100,
    },
    value: {
      description: "The value of the property",
      type: "string",
      example: "12345",
      maxLength: 1000,
    },
  },
} as const);

export const SignatureRequestInput = schema({
  title: "SignatureRequestInput",
  type: "object",
  additionalProperties: false,
  properties: {
    message: {
      description: "An optional message to be displayed to the signer",
      type: "string",
      example: "Please, sign this petition",
      maxLength: 1000,
    },
    file: {
      description: "The file to be signed",
      type: "object",
      isFile: true,
    },
  },
});

export const SubmitPetitionReplies = schema({
  title: "SubmitPetitionReplies",
  type: "object",
  description: outdent`
    Based on the type of the field you want to submit a reply to, the values on this JSON object will vary:
    
    e.g.: 

    For \`TEXT\`, \`SHORT_TEXT\` and \`SELECT\` fields:
    \`{ "name": "James" }\` where "name" is the alias of the field, and "James" is the reply.
    or: \`{ "name": ["James", "Mike"]}\` for submitting two different replies on the same field at once.

    For \`CHECKBOX\` fields:
      \`{ "options": ["A", "B"] }\` will submit a **SINGLE** reply on the field with alias "options", selecting options "A" and "B".
    or: \`{ "options": [["A", "B"], ["C"]] }\` will submit two replies, the first selecting options "A" and "B" and the second selecting option "C".
    The provided values here must match with the preconfigured options on the field, otherwise the entry will be ignored.

    For \`DATE\` fields:
    \`{ "date": "2022-05-31" }\` will submit a single reply on the date field with the provided date.
    or: \`{ "date": ["2022-05-31", "2022-01-10"] }\` will submit two replies on the field.
    The date must be passed in format \`YYYY-MM-DD\`.

    For \`DATE_TIME\` fields:
    \`{ "datetime" : {"datetime": "2022-05-31T02:00", timezone: "Etc/UTC"} }\` will submit a single reply on the datetime field with the provided date and timezone.
    or: \`{ "datetime": [{"datetime": "2022-05-31T02:00", timezone: "Etc/UTC"}, {"datetime": "2022-02-31T04:00", timezone: "Europe/Madrid"}] }\` will submit two replies on the field.
    The date must be passed in format \`YYYY-MM-DDTHH:mm\` and the timezone must be a valid [tz database timezone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).

    For \`PHONE\` fields:
    \`{ "phone": "+3400000000" }\` will submit a single reply on the phone field with the provided value.
    or: \`{ "phone": ["+3400000000", "+3400000001"] }\` will submit two replies on the field.
    The phone must be valid and start with the country code number.

    For \`NUMBER\` fields:
    \`{ "number": 100 }\` will submit a single reply on the number field with value 100.
    or: \`{ "number": [2000, 50] }\` will submit two replies on the field.

    For \`DYNAMIC_SELECT\` fields:
    \`{ "select": ["Spain", "Barcelona"] }\` will submit a single reply on the field where the first level of options of a list of countries and the second level is a list of cities within the selected country.
    or: \`{ "select": [["Spain", "Barcelona"], ["Argentina", "Buenos Aires"]] }\` will submit two replies on the field with same options as the previous.

    For \`FIELD_GROUP\` fields, you need to pass an object where each key is the alias of a field inside the group and the value is the reply to that field. Above examples apply here too.
    \`{ "fieldGroup": { "name": "James", "age": 30 } }\` will submit a single reply on the field group, where "fieldGroup" is the alias of the group, and "name" and "age" are the aliases of the fields inside the group.
    \`{ "fieldGroup": [{ "name": "James", "age": 30 }, { "name": "Mike", "age": 24 }] }\` will submit two replies on the field group.
    You also can submit multiple replies on a single field inside the group by passing an array of values instead of a single value.

    If no field is found with the provided alias or the reply is invalid given the field type and options, that entry will be ignored.

    \`HEADING\`, \`FILE_UPLOAD\`, \`ES_TAX_DOCUMENTS\`, \`ID_VERIFICATION\`, \`BACKGROUND_CHECK\` and \`DOW_JONES_KYC\` fields do not accept reply submission via this endpoint.
  `,
  example: {
    fullName: "Robert Baratheon",
    dateOfBirth: "1200-10-29",
    position: "King",
    location: ["Westeros", "King's Landing"],
    hobbies: ["Wild Boar Hunting", "Wine drinking"],
    siblings: ["Renly Baratheon", "Stannis Baratheon"],
    numberOfChildren: 20,
  },
} as const);

export const SubmitPetitionRepliesResponse = schema({
  ..._Petition,
  example: {
    id: toGlobalId("Petition", 10),
    name: "Robert Baratheon KYC",
    status: "PENDING",
    deadline: new Date(2020, 2, 15).toISOString(),
    locale: "en",
    createdAt: new Date(2020, 1, 1).toISOString(),
    fromTemplateId: null,
    customProperties: {
      clientId: "1234",
    },
    recipients: [
      {
        id: toGlobalId("PetitionAccess", 42),
        contact: {
          id: toGlobalId("Contact", 42),
          email: "tyrion@casterlyrock.wes",
          firstName: "Tyrion",
          lastName: "Lannister",
          fullName: "Tyrion Lannister",
          createdAt: new Date(2020, 2, 15).toISOString(),
          updatedAt: new Date(2020, 2, 15).toISOString(),
        },
        granter: {
          id: toGlobalId("User", 42),
          email: "michael.scofield@yahoo.com",
          firstName: "Michael",
          lastName: "Scofield",
          fullName: "Michael Scofield",
        },
        status: "ACTIVE",
        reminderCount: 2,
        remindersLeft: 8,
        remindersActive: true,
        nextReminderAt: new Date(2020, 2, 17, 8, 0, 0).toISOString(),
        createdAt: new Date(2020, 2, 15).toISOString(),
      },
    ],
    fields: [
      {
        id: toGlobalId("PetitionField", 1),
        title: "Full name",
        description: "Please, enter your full name",
        type: "SHORT_TEXT",
        alias: "fullName",
        options: null,
        multiple: false,
        replies: [
          {
            id: toGlobalId("PetitionFieldReply", 1),
            status: "APPROVED",
            content: "Robert Baratheon",
            createdAt: new Date(2020, 1, 2).toISOString(),
            updatedAt: new Date(2020, 1, 2).toISOString(),
          },
        ],
      },
      {
        id: toGlobalId("PetitionField", 2),
        title: "Date of birth",
        description: "Please, enter your date of birth",
        type: "DATE",
        alias: "dateOfBirth",
        options: null,
        multiple: false,
        replies: [
          {
            id: toGlobalId("PetitionFieldReply", 2),
            status: "PENDING",
            content: "1200-10-29",
            createdAt: new Date(2020, 1, 2).toISOString(),
            updatedAt: new Date(2020, 1, 2).toISOString(),
          },
        ],
      },
      {
        id: toGlobalId("PetitionField", 3),
        title: "Position",
        description: "What do you do for a living?",
        type: "SELECT",
        alias: "position",
        options: ["Hand of the King", "King", "Jester"],
        multiple: false,
        replies: [
          {
            id: toGlobalId("PetitionFieldReply", 3),
            status: "APPROVED",
            content: "King",
            createdAt: new Date(2020, 1, 2).toISOString(),
            updatedAt: new Date(2020, 1, 2).toISOString(),
          },
        ],
      },
      {
        id: toGlobalId("PetitionField", 4),
        title: "Location",
        description: "Where do you usually work?",
        type: "DYNAMIC_SELECT",
        alias: "location",
        options: [
          ["Westeros", ["King's Landing", "The Wall", "Winterfell", "Dorne"]],
          ["Essos", ["Pentos", "Volantis", "Mereen"]],
        ],
        multiple: false,
        replies: [
          {
            id: toGlobalId("PetitionFieldReply", 4),
            status: "APPROVED",
            content: ["Westeros", "King's Landing"],
            createdAt: new Date(2020, 1, 2).toISOString(),
            updatedAt: new Date(2020, 1, 2).toISOString(),
          },
        ],
      },
      {
        id: toGlobalId("PetitionField", 5),
        title: "Hobbies",
        description: "What do you like to do in your free time?",
        type: "TEXT",
        alias: "hobbies",
        options: null,
        multiple: true,
        replies: [
          {
            id: toGlobalId("PetitionFieldReply", 5),
            status: "APPROVED",
            content: "Wild Boar Hunting",
            createdAt: new Date(2020, 1, 2).toISOString(),
            updatedAt: new Date(2020, 1, 2).toISOString(),
          },
          {
            id: toGlobalId("PetitionFieldReply", 6),
            status: "PENDING",
            content: "Wine drinking",
            createdAt: new Date(2020, 1, 2).toISOString(),
            updatedAt: new Date(2020, 1, 2).toISOString(),
          },
        ],
      },
      {
        id: toGlobalId("PetitionField", 6),
        title: "Siblings",
        description: "Please, enter the full name of all your siblings",
        type: "TEXT",
        alias: "siblings",
        options: null,
        multiple: true,
        replies: [
          {
            id: toGlobalId("PetitionFieldReply", 7),
            status: "APPROVED",
            content: "Renly Baratheon",
            createdAt: new Date(2020, 1, 2).toISOString(),
            updatedAt: new Date(2020, 1, 2).toISOString(),
          },
          {
            id: toGlobalId("PetitionFieldReply", 8),
            status: "APPROVED",
            content: "Stannis Baratheon",
            createdAt: new Date(2020, 1, 2).toISOString(),
            updatedAt: new Date(2020, 1, 2).toISOString(),
          },
        ],
      },
      {
        id: toGlobalId("PetitionField", 7),
        title: "Children",
        description: "How many children do you have?",
        type: "NUMBER",
        alias: "numberOfChildren",
        options: null,
        multiple: false,
        replies: [
          {
            id: toGlobalId("PetitionFieldReply", 9),
            status: "APPROVED",
            content: 20,
            createdAt: new Date(2020, 1, 2).toISOString(),
            updatedAt: new Date(2020, 1, 2).toISOString(),
          },
        ],
      },
    ],
    tags: ["kyc", "priority"],
    replies: {
      fullName: "Robert Baratheon",
      dateOfBirth: "1200-10-29",
      position: "King",
      location: ["Westeros", "King's Landing"],
      hobbies: ["Wild Boar Hunting", "Wine drinking"],
      siblings: ["Renly Baratheon", "Stannis Baratheon"],
      numberOfChildren: 20,
    },
  },
} as const);

export const TagPetition = schema({
  title: "TagPetition",
  type: "object",
  additionalProperties: false,
  required: ["name"],
  properties: {
    name: {
      type: "string",
      description: "Name of the tag.",
      maxLength: 100,
      examples: ["priority"],
    },
  },
} as const);

export const SendReminder = schema({
  title: "SendReminder",
  type: "object",
  additionalProperties: false,
  required: ["message"],
  properties: {
    message: _OrNull({
      ..._MessageBody,
      description: "Optional message to include in the reminder email",
    }),
  },
} as const);

const _LocalizableUserText = {
  name: "LocalizableUserText",
  type: "object",
  additionalProperties: false,
  anyOf: UserLocaleValues.map((key) => ({ required: [key] })),
  properties: Object.fromEntries(
    UserLocaleValues.map((key) => [key, { type: "string" }]),
  ) as Record<UserLocale, { type: "string" }>,
  example: { es: "Persona Jurídica", en: "Legal Entity" },
} as const;

const _ProfileTypeField = {
  title: "ProfileTypeField",
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "alias", "type", "isExpirable"],
  properties: {
    id: {
      type: "string",
      description: "ID of the profile type field",
      example: toGlobalId("ProfileTypeField", 1),
    },
    name: _LocalizableUserText,
    alias: {
      type: ["string", "null"],
      description: "Alias of the profile type field",
      example: "name",
    },
    type: {
      type: "string",
      description: "Type of the profile type field",
      example: "TEXT",
      enum: ProfileTypeFieldTypeValues,
    },
    isExpirable: {
      type: "boolean",
      description: "Whether the profile type field is expirable",
      example: false,
    },
    options: {
      type: "object",
      description:
        "If parameter `include` includes `fields` and `fields.options`, this field will be included. For fields of type `SELECT`, contains the list of possible values.",
      oneOf: [
        {
          title: "SELECT",
          type: "object",
          required: ["values"],
          additionalProperties: false,
          properties: {
            values: {
              type: "array",
              maxItems: 1000,
              items: {
                type: "object",
                required: ["label", "value"],
                properties: {
                  label: _LocalizableUserText,
                  value: { type: "string", maxLength: 50 },
                  color: { type: "string" },
                },
              },
            },
          },
        },
        {
          type: "object",
          properties: {},
        },
      ],
    },
  },
} as const;

const _ProfileFieldValue = {
  title: "ProfileFieldValue",
  type: "object",
  additionalProperties: false,
  required: ["id", "content", "expiresAt", "createdAt"],
  properties: {
    id: {
      type: "string",
      description: "ID of the profile field value",
      example: toGlobalId("ProfileFieldValue", 1),
    },
    content: {
      type: "object",
      description: "Content of the profile field value",
      example: { value: "Parallel Solutions" },
    },
    expiresAt: {
      type: ["string", "null"],
      description: "Expiration date of the profile field value",
      example: new Date(2026, 1, 2).toISOString(),
    },
    createdAt: {
      type: "string",
      description: "Creation date of the profile field value",
      example: new Date(2023, 1, 2).toISOString(),
    },
  },
} as const;

const _ProfileFieldFile = {
  title: "ProfileFieldFile",
  type: "object",
  additionalProperties: false,
  required: ["id", "file", "expiresAt", "createdAt"],
  properties: {
    id: {
      type: "string",
      description: "ID of the profile field file",
      example: toGlobalId("ProfileFieldFile", 1),
    },
    file: {
      type: "object",
      required: ["filename", "size", "contentType"],
      properties: {
        filename: {
          type: "string",
          example: "file.pdf",
        },
        size: {
          type: "number",
          example: 1024 ^ 4,
        },
        contentType: {
          type: "string",
          example: "application/pdf",
        },
      },
    },
    expiresAt: {
      type: ["string", "null"],
      description: "Expiration date of the profile field file",
      example: new Date(2026, 1, 2).toISOString(),
    },
    createdAt: {
      type: "string",
      description: "Creation date of the profile field file",
      example: new Date(2023, 1, 2).toISOString(),
    },
  },
} as const;

const _ProfileFieldProperty = {
  title: "ProfileFieldProperty",
  type: "object",
  additionalProperties: false,
  anyOf: [
    {
      title: "ProfileFieldPropertyValue",
      required: ["field", "value"],
      properties: {
        field: deepmerge(
          _ProfileTypeField,
          {
            properties: {
              type: {
                enum: ProfileTypeFieldTypeValues.filter((v) => v !== "FILE"),
              },
            },
          },
          {
            arrayMerge: (_, src) => src, // don't merge arrays
          },
        ),
        value: { ..._ProfileFieldValue, type: ["object", "null"] },
      },
    },
    {
      title: "ProfileFieldPropertyFiles",
      required: ["field", "files"],
      properties: {
        field: deepmerge(_ProfileTypeField, {
          properties: {
            type: {
              const: "FILE",
              enum: null,
            },
          },
        }),
        files: { type: ["array", "null"], items: _ProfileFieldFile },
      },
    },
  ],
} as const;

const _ProfileBase = {
  title: "Profile",
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "status", "profileType", "createdAt"],
  properties: {
    id: {
      type: "string",
      description: "ID of the profile",
      example: toGlobalId("Profile", 101),
    },
    name: {
      type: "string",
      description: "The name of the profile",
      example: "Parallel Solutions",
    },
    status: {
      type: "string",
      description: "The status of the profile",
      enum: ["OPEN", "CLOSED", "DELETION_SCHEDULED"],
      example: "OPEN",
    },
    profileType: {
      title: "ProfileType",
      type: "object",
      additionalProperties: false,
      required: ["id", "name"],
      properties: {
        id: {
          type: "string",
          description: "ID of the profile type",
          example: toGlobalId("ProfileType", 1),
        },
        name: _LocalizableUserText,
      },
    },
    createdAt: {
      type: "string",
      format: "date-time",
      description: "Date and time when the profile was created",
      example: new Date(2020, 2, 15).toISOString(),
    },
  },
} as const;

const _ProfileRelationship = {
  title: "ProfileSubscription",
  type: "object",
  additionalProperties: false,
  required: ["id", "inverse", "relationshipType", "profile"],
  properties: {
    id: {
      type: "string",
      description: "ID of the profile relationship",
      example: toGlobalId("ProfileRelationship", 101),
    },
    inverse: {
      type: "boolean",
      description: outdent`
        When obtaining relationships of profile A and a relationship with profile B appears:
        - If inverse is false A is [relationshipType.name] of B
        - If inverse is true A is [relationshipType.inverseName] of B
      `,
      example: "false",
    },
    relationshipType: {
      title: "ProfileRelationshipType",
      type: "object",
      additionalProperties: false,
      required: ["id", "alias", "name", "inverseName"],
      properties: {
        id: {
          type: "string",
          description: "ID of the profile relationship type",
          example: toGlobalId("ProfileRelationshipType", 1),
        },
        alias: {
          type: ["string", "null"],
          description: "Readable identifier of the relationship type",
          example: "p_parent__child",
        },
        name: { ..._LocalizableUserText, example: { es: "Padre/Madre", en: "Parent" } },
        inverseName: { ..._LocalizableUserText, example: { es: "Hijo/Hija", en: "Child" } },
      },
    },
    profile: _ProfileBase,
  },
} as const;
export const ProfileRelationship = schema(_ProfileRelationship);
export const CreateProfileRelationship = schema({
  title: "CreateProfileRelationship",
  type: "object",
  oneOf: [
    {
      required: ["relationshipTypeId", "profileId", "inverse"],
      additionalProperties: false,
      properties: {
        relationshipTypeId: {
          type: "string",
          description: "ID of the profile relationship type",
          example: toGlobalId("ProfileRelationshipType", 1),
        },
        profileId: {
          type: "string",
          description: "ID of the profile to create the relationship with",
          example: toGlobalId("Profile", 1),
        },
        inverse: {
          type: "boolean",
          description: outdent`
            When obtaining relationships of profile A and a relationship with profile B appears:
            - If inverse is false A is [relationshipType.name] of B
            - If inverse is true A is [relationshipType.inverseName] of B
          `,
          example: "false",
        },
      },
    },
    {
      required: ["relationshipTypeAlias", "profileId", "inverse"],
      additionalProperties: false,
      properties: {
        relationshipTypeAlias: {
          type: "string",
          description: "Alias of the profile relationship type",
          example: "p_parent__child",
        },
        profileId: {
          type: "string",
          description: "ID of the profile to create the relationship with",
          example: toGlobalId("Profile", 1),
        },
        inverse: {
          type: "boolean",
          description: outdent`
            When obtaining relationships of profile A and a relationship with profile B appears:
            - If inverse is false A is [relationshipType.name] of B
            - If inverse is true A is [relationshipType.inverseName] of B
          `,
          example: "false",
        },
      },
    },
  ],
} as const);

const _ProfileSubscription = {
  title: "ProfileSubscription",
  type: "object",
  additionalProperties: false,
  required: ["user"],
  properties: {
    user: _User,
  },
} as const;

const _Profile = {
  ..._ProfileBase,
  required: [..._ProfileBase.required, "values"],
  additionalProperties: false,
  properties: {
    ..._ProfileBase.properties,
    fields: {
      ...ListOf(_ProfileFieldProperty as any),
      description:
        "If parameter `include` contains `fields`, this will be the list of profile fields and files",
    },
    values: {
      type: "object",
      description: "The list of profile field values indexed by alias",
      example: {
        p_entity_name: "Parallel Solutions",
      },
    },
    subscribers: {
      type: "array",
      description:
        "If parameter `include` contains `subscribers`, this will be the list of users subscribed to the profile",
      items: _ProfileSubscription,
    },
    relationships: {
      type: "array",
      description:
        "If parameter `include` contains `relationships`, this will be the list of relationships of the profile",
      items: _ProfileRelationship,
    },
  },
} as const;

export const PaginatedProfiles = schema(_PaginationOf(_Profile as JsonSchema));
export const Profile = schema(_Profile as JsonSchema);
export const ListOfProfiles = ListOf(_Profile as JsonSchema);

const CreateProfileValue = {
  oneOf: [
    { type: "string", example: "Parallel Solutions", description: "Value of the property" },
    {
      type: "array",
      items: {
        type: "object",
        isFile: true,
      },
    },
    {
      type: "array",
      items: {
        type: "string",
      },
    },
  ],
} as const;

export const CreateProfile = schema({
  title: "CreateProfile",
  type: "object",
  additionalProperties: false,
  required: ["profileTypeId"],
  properties: {
    profileTypeId: {
      description: "The ID of the profile type to use",
      type: "string",
      example: toGlobalId("ProfileType", 42),
    },
    subscribe: {
      anyOf: [
        {
          type: "boolean",
          description: "Whether to subscribe the user to the profile type",
          example: true,
        },
        {
          type: "string",
          enum: ["true", "false"],
          description: "Whether to subscribe the user to the profile type",
          example: "true",
        },
      ],
    },
    values: {
      type: "object",
      description: "The profile field values to assign to the created profile, indexed by alias",
      properties: {},
      additionalProperties: {
        oneOf: [
          CreateProfileValue,
          {
            type: "object",
            required: ["value"],
            additionalProperties: false,
            properties: {
              value: CreateProfileValue,
              expiryDate: {
                type: "string",
                format: "date",
                example: "2023-06-27",
                description: "Expiration date of the value",
              },
            },
          },
        ],
      },
      example: {
        p_entity_name: "Parallel Solutions",
      },
    },
  },
} as const);

export const ListOfProfileRelationships = ListOf(_ProfileRelationship);
export const ListOfProfileSubscriptions = ListOf(_ProfileSubscription);

export const ProfileSubscriptionInput = (subscribe: boolean) =>
  schema({
    title: "ProfileSubscriptionInput",
    type: "object",
    additionalProperties: false,
    required: ["userIds"],
    properties: {
      userIds: {
        type: "array",
        description: subscribe
          ? "The IDs of the users to subscribe to the profile"
          : "The IDs of the users to unsubscribe from the profile",
        minItems: 1,
        items: {
          type: "string",
          example: toGlobalId("User", 42),
        },
      },
    },
  } as const);

export const ListOfProfileProperties = ListOf(_ProfileFieldProperty as any);

const UpdateProfileValue = {
  oneOf: [
    { type: "null" },
    { type: "number", example: 42, description: "Value of the property" },
    { type: "string", example: "Parallel Solutions", description: "Value of the property" },
    {
      type: "array",
      items: {
        type: "object",
        isFile: true,
      },
    },
    {
      type: "array",
      items: {
        type: "string",
      },
    },
  ],
} as const;

export const UpdateProfileFieldValues = schema({
  type: "object",
  required: ["values"],
  additionalProperties: false,
  properties: {
    values: {
      type: "object",
      description:
        "The profile field values to update or delete, indexed by alias. Pass `null` or an empty string to delete the value.",
      properties: {},
      additionalProperties: {
        oneOf: [
          UpdateProfileValue,
          {
            type: "object",
            additionalProperties: false,
            properties: {
              value: UpdateProfileValue,
              expiryDate: {
                type: ["string", "null"],
                format: "date",
                example: "2023-06-27",
                description: "Expiration date of the value",
              },
            },
          },
        ],
      },
      example: {
        p_entity_name: "Parallel Solutions",
      },
    },
  },
} as const);

export const AssociatePetitionToProfileInput = schema({
  title: "AssociatePetitionToProfileInput",
  type: "object",
  additionalProperties: false,
  required: ["profileId"],
  properties: {
    profileId: {
      type: "string",
      description: "The ID of the profile to associate the parallel to",
      example: toGlobalId("Profile", 101),
    },
  },
} as const);

export const BulkSendTemplateInput = schema({
  type: "object",
  required: ["file"],
  additionalProperties: false,
  properties: { file: { type: "object", isFile: true } },
} as const);

const _ProfileType = {
  type: "object",
  required: ["id", "name"],
  additionalProperties: false,
  properties: {
    id: {
      type: "string",
      description: "ID of the profile type",
      example: toGlobalId("ProfileType", 1),
    },
    name: _LocalizableUserText,
    fields: {
      type: "array",
      description:
        "If parameter `include` contains `fields`, this will be the list of profile type fields",
      items: _ProfileTypeField,
    },
  },
} as const;

export const PaginatedProfileTypes = schema(_PaginationOf(_ProfileType as JsonSchema));
export const ProfileType = schema(_ProfileType as JsonSchema);

const operator = {
  type: "string",
  enum: [
    "HAS_VALUE",
    "NOT_HAS_VALUE",
    "EQUAL",
    "NOT_EQUAL",
    "START_WITH",
    "END_WITH",
    "CONTAIN",
    "NOT_CONTAIN",
    "IS_ONE_OF",
    "NOT_IS_ONE_OF",
    "LESS_THAN",
    "LESS_THAN_OR_EQUAL",
    "GREATER_THAN",
    "GREATER_THAN_OR_EQUAL",
    "HAS_BG_CHECK_RESULTS",
    "NOT_HAS_BG_CHECK_RESULTS",
    "HAS_BG_CHECK_MATCH",
    "NOT_HAS_BG_CHECK_MATCH",
    "HAS_BG_CHECK_TOPICS",
    "NOT_HAS_BG_CHECK_TOPICS",
  ],
} as const;
const value = {
  oneOf: [
    { type: ["string", "number", "null"] as const },
    {
      type: "array",
      minItems: 1,
      items: { type: "string" },
    },
  ],
} as const;
export const ProfileValuesFilterSchema = schema({
  anyOf: [
    {
      title: `Filter by profileTypeFieldId`,
      type: "object",
      required: ["profileTypeFieldId", "operator"],
      additionalProperties: false,
      properties: {
        profileTypeFieldId: { type: "string" },
        operator,
        value,
      },
    },
    {
      title: `Filter by alias`,
      type: "object",
      required: ["alias", "operator"],
      additionalProperties: false,
      properties: {
        alias: { type: "string" },
        operator,
        value,
      },
    },
  ],
} as const);

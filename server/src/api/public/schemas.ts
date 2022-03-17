import { JSONSchema6TypeName } from "json-schema";
import { outdent } from "outdent";
import { PetitionEventType } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { titleize } from "../../util/strings";
import { JsonSchema, schema } from "../rest/schemas";

function _ListOf<T extends JsonSchema>(item: T) {
  return {
    title: `${item.title ?? "any"}[]`,
    type: "array",
    items: item,
  } as const;
}

function _OrNull<T extends JsonSchema>(
  item: T
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
      description: "The ID of the petition access",
      type: "string",
      example: toGlobalId("PetitionAccess", 42),
    },
    contact: {
      ..._Contact,
      description: "The recipient contact of the petition access",
      type: [_Contact.type, "null"],
    },
    granter: {
      ..._User,
      description: "The user who created this petition access",
      type: [_User.type, "null"],
    },
    status: {
      description: "The status of the petition access",
      type: "string",
      enum: ["ACTIVE", "INACTIVE"],
      example: "ACTIVE",
    },
    reminderCount: {
      description: "Number of reminders sent for the petition access",
      type: "integer",
      example: 2,
    },
    remindersLeft: {
      description: "Number of reminders left for the petition access",
      type: "integer",
      example: 8,
    },
    remindersActive: {
      description: "Whether reminders are active for the petition access",
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
      description: "Creation date of the petition access",
      type: "string",
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
  },
} as const;

const _PetitionField = {
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "type", "multiple"],
  properties: {
    id: {
      type: "string",
      description: "The ID of the petition field",
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
      enum: [
        "HEADING",
        "TEXT",
        "SHORT_TEXT",
        "FILE_UPLOAD",
        "SELECT",
        "DYNAMIC_SELECT",
        "CHECKBOX",
        "NUMBER",
        "DATE",
        "PHONE",
      ],
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
      example: "first-name",
    },
    options: {
      type: ["array", "null"],
      description:
        "For fields of type `SELECT`, `DYNAMIC_SELECT` and `CHECKBOX`. An array with valid options for the reply.",
    },
    multiple: {
      type: "boolean",
      description: "If `true`, this field allows an unlimited amount of replies.",
      example: false,
    },
  },
} as const;

const _PetitionFieldReply = {
  type: "object",
  required: ["id", "content", "status", "createdAt", "updatedAt"],
  properties: {
    id: {
      type: "string",
      description: "The ID of the petition field reply",
      example: toGlobalId("PetitionFieldReply", 100),
    },
    status: {
      type: "string",
      description: "Status of the reply. `APPROVED` replies cannot be updated or deleted.",
      enum: ["PENDING", "APPROVED", "REJECTED"],
      example: "PENDING",
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

const _Petition = {
  title: "Petition",
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "status", "deadline", "locale", "createdAt", "customProperties"],
  properties: {
    id: {
      description: "The ID of the petition",
      type: "string",
      example: toGlobalId("Petition", 42),
    },
    name: {
      description: "The name of the petition",
      example: "My petition",
      type: ["string", "null"],
    },
    status: {
      description: "The status of the petition",
      type: "string",
      enum: ["DRAFT", "PENDING", "COMPLETED", "CLOSED"],
    },
    deadline: {
      description: "The deadline of the petition for informative purposes",
      type: ["string", "null"],
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
    locale: {
      description: "The locale of the petition",
      type: "string",
      enum: ["en", "es"],
      example: "en",
    },
    createdAt: {
      description: "Creation date of the petition",
      type: "string",
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
    fromTemplateId: {
      description: "ID of the template used to create the petition",
      type: ["string", "null"],
      example: toGlobalId("Petition", 1),
    },
    customProperties: {
      description: "The custom properties of the petition",
      type: "object",
      example: { clientId: "1234" },
    },
    recipients: {
      description:
        "If parameter `include` contains `recipients`, this will be the list of recipients this petition has been sent to.",
      ..._ListOf(_PetitionAccess),
    },
    fields: {
      description:
        "If parameter `include` contains `fields`, this will be the list of the petition fields with their submitted replies.",
      ..._ListOf(_PetitionFieldWithReplies),
    },
    tags: {
      type: "array",
      description: "List of tags of the petition",
      items: {
        type: "string",
      },
      example: ["priority", "kyc"],
    },
  },
} as const;

const _Template = {
  title: "Template",
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "description", "locale", "createdAt", "customProperties"],
  properties: {
    id: {
      description: "The ID of the template",
      type: "string",
      example: toGlobalId("Petition", 42),
    },
    name: {
      description: "The name of the template",
      type: ["string", "null"],
      example: "My petition",
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
      enum: ["en", "es"],
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
        "If parameter `include` contains `fields`, this will be the list of the petition fields.",
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
  },
  example: {
    offset: 2,
    time: "09:30",
    timezone: "Europe/Madrid",
    weekdaysOnly: false,
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
      \`OWNER\`: Full access to the petition. There can only be one owner per petition.  
      \`READ\`: Read-only access. Users with READ permission can't modify the petition in any way.  
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
  title: "Permission",
  type: "object",
  anyOf: [
    {
      type: "object",
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
      description: "The name of the petition",
      type: ["string", "null"],
      example: "My petition",
    },
    deadline: {
      description: "The deadline of the petition for informative purposes",
      type: ["string", "null"],
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
    locale: {
      description: "The locale of the petition",
      type: "string",
      enum: ["en", "es"],
      example: "en",
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
      description: "An optional name for the created petition",
      type: ["string", "null"],
      example: "My petition",
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
      description: "The title of the petition field",
      type: ["string", "null"],
      example: "ID",
    },
    description: {
      description: "The description of the petition field",
      type: ["string", "null"],
      example: "Please, write your ID number",
    },
  },
} as const);
export const PetitionField = schema(_PetitionField);
export const PaginatedTags = PaginatedListOf({ type: "string", example: ["kyc", "priority"] });
export const PaginatedPetitions = PaginatedListOf(_Petition);
export const PaginatedUsers = PaginatedListOf(_User);
export const PetitionAccess = schema(_PetitionAccess);
export const ListOfPetitionAccesses = ListOf(_PetitionAccess);
export const Template = schema(_Template);
export const PaginatedTemplates = PaginatedListOf(_Template);
export const Contact = schema(_Contact);
export const User = schema(_User);
export const UserWithOrg = schema(_UserWithOrg);
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
export const PaginatedContacts = PaginatedListOf(_Contact);
export const SendPetition = schema({
  title: "SendPetition",
  type: "object",
  required: ["contacts"],
  additionalProperties: false,
  properties: {
    contacts: {
      description: "A list of recipients to send this petition to",
      type: "array",
      items: {
        oneOf: [
          {
            description: "The ID of the contact to send this petition to",
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
                description: "The email of the contact to send this petition to",
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
      example: "Please fill this petition",
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
  },
} as const);

export const SharePetition = schema({
  title: "SharePetition",
  type: "object",
  additionalProperties: false,
  required: [],
  properties: {
    userIds: {
      description: "IDs of the users you want to share the petition with",
      type: "array",
      items: {
        type: "string",
        example: toGlobalId("User", 42),
      },
    },
    userGroupIds: {
      description: "IDs of the user groups you want to share the petition with",
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
  description: "For fields of type `DATE`, with format YYYY-MM-DD.",
  example: "2022-02-15",
};

const _NumberReplySubmitContent = {
  title: "NumberReplyContent",
  type: "number",
  description: "For fields of type `NUMBER`.",
  example: 42,
} as const;

const _FileUploadReplySubmitContent = {
  title: "FileUploadReplyContent",
  type: "object",
  format: "binary",
  description:
    "For fields of type `FILE_UPLOAD`. The content of this reply is the file to be uploaded.",
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

const _PetitionFieldReplyStatus = {
  type: "string",
  description:
    "Optionally, you can pass a status for the reply. `APPROVED` replies can't be updated or deleted. This can be useful when you don't want your replies to be modified.",
  enum: ["PENDING", "APPROVED", "REJECTED"],
  example: "APPROVED",
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
      ],
    },
    status: _PetitionFieldReplyStatus,
  },
} as const);

export const SubmitFileReply = schema({
  title: "SubmitReply",
  type: "object",
  additionalProperties: false,
  required: ["reply"],
  properties: {
    reply: _FileUploadReplySubmitContent,
    status: _PetitionFieldReplyStatus,
  },
} as const);

export const ListOfPermissions = ListOf(_Permission);

export const ListOfPetitionFieldsWithReplies = ListOf(_PetitionFieldWithReplies);

export const PetitionFieldReply = schema(_PetitionFieldReply);

export const FieldReplyDownloadContent = schema({
  type: "string",
  example: "Jon Snow",
  description: "The text-content of the reply, or a download URL for `FILE` replies",
} as const);

const _PetitionSigner = {
  type: "object",
  description: "Information about the signer",
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

const PetitionEventSchemas = {
  ACCESS_ACTIVATED: {
    description: "The user created or reactivated an access on the petition",
    properties: {
      petitionAccessId: {
        description: "The ID of the petition access",
        type: "string",
        example: toGlobalId("PetitionAccess", 2),
      },
      userId: {
        description: "The ID of the user",
        type: "string",
        example: toGlobalId("User", 1),
      },
    },
  },
  ACCESS_DEACTIVATED: {
    description: "An access on the petition has been deactivated.",
    properties: {
      petitionAccessId: {
        description: "The ID of the petition access",
        type: "string",
        example: toGlobalId("PetitionAccess", 2),
      },
      userId: {
        description:
          "The ID of the user that deactivated the access. Only set if `reason` is `DEACTIVATED_BY_USER`. If `null`, the access was automatically deactivated because a bounce ocurred when trying to delivery an email.",
        type: ["string", "null"],
        example: toGlobalId("User", 1),
      },
      reason: {
        type: "string",
        description:
          "Wether the access was deactivated manually by an user, or it was deactivated automatically because an email was bounced.",
        enum: ["DEACTIVATED_BY_USER", "EMAIL_BOUNCED"],
        example: "DEACTIVATED_BY_USER",
      },
    },
  },
  ACCESS_DELEGATED: {
    description:
      "A recipient delegated their petition to another person, creating a new access on the petition",
    properties: {
      newPetitionAccessId: {
        description: "The ID of the new access created by the recipient",
        type: "string",
        example: toGlobalId("PetitionAccess", 21),
      },
      petitionAccessId: {
        description: "The ID of the original access where the delegation happened",
        type: "string",
        example: toGlobalId("PetitionAccess", 20),
      },
    },
  },
  ACCESS_OPENED: {
    description: "A recipient opened their access to the petition",
    properties: {
      petitionAccessId: {
        description: "The ID of the petition access",
        type: "string",
        example: toGlobalId("PetitionAccess", 2),
      },
    },
  },
  COMMENT_DELETED: {
    description: "A comment was deleted either by a recipient or an user.",
    properties: {
      petitionFieldCommentId: {
        description: "The ID of the comment",
        type: "string",
        example: toGlobalId("PetitionFieldComment", 10),
      },
      petitionFieldId: {
        description: "The ID of the field where the comment belongs",
        type: "string",
        example: toGlobalId("PetitionField", 10),
      },
      petitionAccessId: {
        description:
          "The ID of the access where the comment was deleted. If set, the comment was deleted by the recipient linked to this access",
        type: ["string", "null"],
        example: toGlobalId("PetitionAccess", 10),
      },
      userId: {
        description: "The ID of the user. If set, the comment was deleted by this user.",
        type: ["string", "null"],
        example: null,
      },
    },
  },
  COMMENT_PUBLISHED: {
    description: "A comment was published on a petition field",
    properties: {
      petitionFieldCommentId: {
        description: "The ID of the comment",
        type: "string",
        example: toGlobalId("PetitionFieldComment", 10),
      },
      petitionFieldId: {
        description: "The ID of the field where the comment belongs",
        type: "string",
        example: toGlobalId("PetitionField", 10),
      },
    },
  },
  MESSAGE_CANCELLED: {
    description: "A user cancelled a scheduled message",
    properties: {
      petitionMessageId: {
        description: "The ID of the cancelled message",
        type: "string",
        example: toGlobalId("PetitionMessage", 10),
      },
      userId: {
        description:
          "The ID of the user that cancelled the send of the message. Only set if `reason` is `CANCELLED_BY_USER`. If `null`, the message was automatically cancelled because a bounce ocurred when trying to delivery an email.",
        type: ["string", "null"],
        example: toGlobalId("User", 10),
      },
      reason: {
        type: "string",
        description:
          "Wether the message was cancelled manually by an user, or it was cancelled automatically because an email was bounced.",
        enum: ["CANCELLED_BY_USER", "EMAIL_BOUNCED"],
        example: "CANCELLED_BY_USER",
      },
    },
  },
  MESSAGE_SCHEDULED: {
    description: "A user scheduled a message",
    properties: {
      petitionMessageId: {
        description: "The ID of the scheduled message",
        type: "string",
        example: toGlobalId("PetitionMessage", 10),
      },
    },
  },
  MESSAGE_SENT: {
    description: "A user sent a message",
    properties: {
      petitionMessageId: {
        description: "The ID of the message",
        type: "string",
        example: toGlobalId("PetitionMessage", 10),
      },
    },
  },
  OWNERSHIP_TRANSFERRED: {
    description: "A user transferred the ownership of a petition to another user",
    properties: {
      userId: {
        description: "The ID of the user that transferred the petition",
        type: "string",
        example: toGlobalId("User", 10),
      },
      ownerId: {
        description: "The ID of the new owner of the petition",
        type: "string",
        example: toGlobalId("User", 1),
      },
      previousOwnerId: {
        description: "The ID of the previous owner of the petition",
        type: ["string", "null"],
        example: toGlobalId("User", 2),
      },
    },
  },
  PETITION_CLOSED: {
    description: "A petition was marked as `closed` by an user",
    properties: {
      userId: {
        description: "The ID of the user that closed the petition",
        type: "string",
        example: toGlobalId("User", 1),
      },
    },
  },
  PETITION_CLOSED_NOTIFIED: {
    description: "A user notified a recipient that the petition was closed",
    properties: {
      userId: {
        description: "The ID of the user",
        type: "string",
        example: toGlobalId("User", 1),
      },
      petitionAccessId: {
        description: "The ID of the petition access",
        type: "string",
        example: toGlobalId("PetitionAccess", 1),
      },
    },
  },
  PETITION_COMPLETED: {
    description:
      "A petition was completed. If a user completed it, `userId` will be set in the event data. Else, `petitionAccessId` will be set.",
    properties: {
      userId: {
        description: "The ID of the user that completed the petition",
        type: ["string", "null"],
        example: toGlobalId("User", 1),
      },
      petitionAccessId: {
        description: "The ID of the petition access linked to the recipient",
        type: ["string", "null"],
        example: toGlobalId("PetitionAccess", 1),
      },
    },
  },
  PETITION_CREATED: {
    description: "A petition was created",
    properties: {
      userId: {
        description: "The ID of the user that created the petition",
        type: "string",
        example: toGlobalId("User", 10),
      },
    },
  },
  PETITION_REOPENED: {
    description: "A user reopened a closed petition",
    properties: {
      userId: {
        description: "The ID of the user that reopened the petition",
        type: "string",
        example: toGlobalId("User", 5),
      },
    },
  },
  REMINDER_SENT: {
    description: "A manual or automatic reminder was sent to the petition recipients",
    properties: {
      petitionReminderId: {
        description: "The ID of the reminder",
        type: "string",
        example: toGlobalId("PetitionReminder", 100),
      },
    },
  },
  REPLY_CREATED: {
    description: "A reply on the petition was submitted either by a recipient or an user.",
    properties: {
      petitionAccessId: {
        description:
          "The ID of the access. If set, the reply was submitted by the recipient linked to this access",
        type: ["string", "null"],
        example: toGlobalId("PetitionAccess", 1),
      },
      userId: {
        description: "The ID of the user. If set, the reply was submitted by this user.",
        type: ["string", "null"],
        example: null,
      },
      petitionFieldId: {
        description: "The ID of the field replied by the recipient",
        type: "string",
        example: toGlobalId("PetitionField", 14),
      },
      petitionFieldReplyId: {
        description: "The ID of the new reply",
        type: "string",
        example: toGlobalId("PetitionFieldReply", 11),
      },
    },
  },
  REPLY_DELETED: {
    description: "A reply on the petition was deleted either by a recipient or an user.",
    properties: {
      petitionAccessId: {
        description:
          "The ID of the access. If set, the reply was deleted by the recipient linked to this access",
        type: ["string", "null"],
        example: toGlobalId("PetitionAccess", 1),
      },
      userId: {
        description: "The ID of the user. If set, the reply was deleted by this user.",
        type: ["string", "null"],
        example: toGlobalId("User", 1),
      },
      petitionFieldId: {
        description: "The ID of the field where the reply belongs",
        type: "string",
        example: toGlobalId("PetitionField", 1),
      },
      petitionFieldReplyId: {
        description: "The ID of the deleted reply",
        type: "string",
        example: toGlobalId("PetitionFieldReply", 1),
      },
    },
  },
  REPLY_UPDATED: {
    description: "A reply on the petition was updated either by a recipient or an user.",
    properties: {
      petitionAccessId: {
        description:
          "The ID of the access. If set, the reply was updated by the recipient linked to this access",
        type: ["string", "null"],
        example: toGlobalId("PetitionAccess", 1),
      },
      userId: {
        description: "The ID of the user. If set, the reply was updated by this user.",
        type: ["string", "null"],
        example: null,
      },
      petitionFieldId: {
        description: "The ID of the field where the reply belongs",
        type: "string",
        example: toGlobalId("PetitionField", 1),
      },
      petitionFieldReplyId: {
        description: "The ID of the updated reply",
        type: "string",
        example: toGlobalId("PetitionFieldReply", 1),
      },
    },
  },
  SIGNATURE_CANCELLED: {
    description: "An eSignature request on the petition was cancelled.",
    properties: {
      petitionSignatureRequestId: {
        description:
          "The ID of the eSignature request. Only set if the request was already started when the cancellation happens.",
        type: ["string", "null"],
        example: toGlobalId("PetitionSignatureRequest", 1),
      },
      cancelReason: {
        description: "The reason of the cancel.",
        type: "string",
        enum: ["CANCELLED_BY_USER", "DECLINED_BY_SIGNER", "REQUEST_ERROR", "REQUEST_RESTARTED"],
        example: "CANCELLED_BY_USER",
      },
      cancelData: {
        description: "Information about who and why cancelled the eSignature request",
        type: "object",
        properties: {
          userId: {
            type: ["string", "null"],
            description: outdent`
              The ID of the user that cancelled or restarted the signature.  
              Only set if cancelReason is \`CANCELLED_BY_USER\` or \`REQUEST_RESTARTED\`.
            `,
            example: toGlobalId("User", 2),
          },
          petitionAccessId: {
            type: ["string", "null"],
            description: outdent`
              The ID of the petition access linked to the recipient that restarted the signature.
              Only set if cancelReason is \`REQUEST_RESTARTED\`.
            `,
            example: null,
          },
          declineReason: {
            type: ["string", "null"],
            description: outdent`
              Reason of cancellation.  
              Only set if cancelReason is \`DECLINED_BY_SIGNER\`.
          `,
            example: null,
          },
          canceller: {
            description: outdent`
              Information about the signer that declined the request.
              Only set if cancelReason is \`DECLINED_BY_SIGNER\`.
            `,
            type: ["object", "null"],
            properties: {
              firstName: { type: "string" },
              lastName: { type: "string" },
              email: { type: "string" },
            },
            example: null,
          },
          error: {
            description: outdent`
              The server error that cancelled the signature.
              Only set of cancelReason is \`REQUEST_ERROR\`.
            `,
            type: ["string", "null"],
            example: null,
          },
          errorCode: {
            description: outdent`
              The error code of the cancelled the signature.
              Only set of cancelReason is \`REQUEST_ERROR\`.
            `,
            type: ["string", "null"],
            example: null,
          },
        },
      },
    },
  },
  SIGNATURE_OPENED: {
    description: "A signer has opened the signing page on the signature provider",
    properties: {
      signer: _PetitionSigner,
      petitionSignatureRequestId: {
        type: "string",
        description: "The ID of the signature request",
        example: toGlobalId("PetitionSignatureRequest", 2),
      },
    },
  },
  SIGNATURE_COMPLETED: {
    description: "The eSignature request on the petition was completed",
    properties: {
      fileUploadId: {
        description: "The ID of the signed PDF file",
        type: "string",
        example: toGlobalId("FileUpload", 1),
      },
      petitionSignatureRequestId: {
        description: "The ID of the eSignature request",
        type: "string",
        example: toGlobalId("PetitionSignatureRequest", 1),
      },
    },
  },
  SIGNATURE_STARTED: {
    description: "An eSignature request on the petition started",
    properties: {
      petitionSignatureRequestId: {
        description: "The ID of the eSignature request",
        type: "string",
        example: toGlobalId("PetitionSignatureRequest", 1),
      },
    },
  },
  SIGNATURE_REMINDER: {
    description: "A user sent a reminder email to the pending signers",
    properties: {
      userId: {
        description: "The ID of the user that sent the reminder",
        type: "string",
        example: toGlobalId("User", 1),
      },
      petitionSignatureRequestId: {
        description: "The ID of the eSignature request",
        type: "string",
        example: toGlobalId("PetitionSignatureRequest", 11),
      },
    },
  },
  USER_PERMISSION_ADDED: {
    description: "The user shared their petition with another user",
    properties: {
      permissionType: {
        description: "The type of permission for the new user",
        type: "string",
        enum: ["READ", "WRITE"],
        example: "WRITE",
      },
      userId: {
        description: "The ID of the user that shared the petition",
        type: "string",
        example: toGlobalId("User", 10),
      },
      permissionUserId: {
        description: "The ID of the user linked to the new permission",
        type: "string",
        example: toGlobalId("User", 100),
      },
    },
  },
  USER_PERMISSION_EDITED: {
    description: "The user modified the type of permission on a shared petition",
    properties: {
      permissionType: {
        description: "The new permission for the user",
        type: "string",
        enum: ["READ", "WRITE"],
        example: "READ",
      },
      userId: {
        description: "The ID of the user that edited the permission",
        type: "string",
        example: toGlobalId("User", 10),
      },
      permissionUserId: {
        description: "The ID of the user linked to the modified permission",
        type: "string",
        example: toGlobalId("User", 20),
      },
    },
  },
  USER_PERMISSION_REMOVED: {
    description: "The user removed a permission on their petition",
    properties: {
      userId: {
        description: "The ID of the user that removed the permission",
        type: "string",
        example: toGlobalId("User", 10),
      },
      permissionUserId: {
        description: "The ID of the user that lost its permission",
        type: "string",
        example: toGlobalId("User", 20),
      },
    },
  },
  GROUP_PERMISSION_ADDED: {
    description: "The user shared their petition with a user group",
    properties: {
      permissionType: {
        description: "The type of permission for the group members",
        type: "string",
        enum: ["READ", "WRITE"],
        example: "READ",
      },
      userId: {
        description: "The ID of the user that shared the petition",
        type: "string",
        example: toGlobalId("User", 10),
      },
      userGroupId: {
        description: "The ID of the group linked to the new permission",
        type: "string",
        example: toGlobalId("UserGroup", 10),
      },
    },
  },
  GROUP_PERMISSION_EDITED: {
    description: "The user modified the type of permission on a shared petition",
    properties: {
      permissionType: {
        description: "The new permission for the group",
        type: "string",
        enum: ["READ", "WRITE"],
        example: "WRITE",
      },
      userId: {
        description: "The ID of the user that edited the permission",
        type: "string",
        example: toGlobalId("User", 10),
      },
      userGroupId: {
        description: "The ID of the group linked to the modified permission",
        type: "string",
        example: toGlobalId("UserGroup", 10),
      },
    },
  },
  GROUP_PERMISSION_REMOVED: {
    description: "The user removed a permission on their petition",
    properties: {
      userId: {
        description: "The ID of the user that removed the permission",
        type: "string",
        example: toGlobalId("User", 10),
      },
      userGroupId: {
        description: "The ID of the group that lost its permission",
        type: "string",
        example: toGlobalId("UserGroup", 10),
      },
    },
  },
  PETITION_CLONED: {
    description: "The user cloned a petition",
    properties: {
      newPetitionId: {
        description: "The ID of the new created petition",
        type: "string",
        example: toGlobalId("Petition", 1),
      },
      type: {
        description: "The type of the new created petition",
        enum: ["PETITION", "TEMPLATE"],
        example: "PETITION",
      },
      userId: {
        description: "The ID of the user that cloned the petition",
        type: "string",
        example: toGlobalId("User", 10),
      },
    },
  },
  PETITION_DELETED: {
    description: "The user deleted a petition",
    properties: {
      userId: {
        description: "The ID of the user that deleted the petition",
        type: "string",
        example: toGlobalId("User", 10),
      },
      status: {
        description: "The status of the petition in the moment it was deleted",
        enum: ["CLOSED", "COMPLETED", "DRAFT", "PENDING"],
        example: "COMPLETED",
      },
    },
  },
  TEMPLATE_USED: {
    description: "A template has been used to create a petition",
    properties: {
      userId: {
        description: "The ID of the user that used the template",
        type: "string",
        example: toGlobalId("User", 10),
      },
      newPetitionId: {
        description: "The ID of the new created petition",
        type: "string",
        example: toGlobalId("Petition", 1),
      },
    },
  },
  REMINDERS_OPT_OUT: {
    description: "The contact has opted out from receiving reminders for this petition",
    properties: {
      petitionAccessId: {
        description: "The ID of the petition access",
        type: "string",
        example: toGlobalId("PetitionAccess", 10),
      },
      reason: {
        description: "Code representing the reason for opting out.",
        type: "string",
        enum: ["NOT_INTERESTED", "NOT_REQUESTED", "WRONG_PERSON", "NO_REMINDERS", "OTHER"],
        example: "NOT_INTERESTED",
      },
      other: {
        description: "If reason is OTHER, this will be the explanation added by the contact",
        type: ["string", "null"],
        example: null,
      },
    },
  },
  ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK: {
    description: "A contact started and sent itself a petition through a public petition link",
    properties: {
      petitionAccessId: {
        description: "The ID of the petition access",
        type: "string",
        example: toGlobalId("PetitionAccess", 10),
      },
    },
  },
  PETITION_MESSAGE_BOUNCED: {
    description: "A message email has bounced",
    properties: {
      petitionMessageId: {
        description: "The ID of the petition message that caused the bounce",
        type: "string",
        example: toGlobalId("PetitionMessage", 10),
      },
    },
  },
  PETITION_REMINDER_BOUNCED: {
    description: "A reminder email has bounced",
    properties: {
      petitionReminderId: {
        description: "The ID of the petition reminder that caused the bounce",
        type: "string",
        example: toGlobalId("PetitionReminder", 10),
      },
    },
  },
  RECIPIENT_SIGNED: {
    description: "A recipient has signed the document.",
    properties: {
      signer: _PetitionSigner,
      petitionSignatureRequestId: {
        type: "string",
        description: "The ID of the signature request",
        example: toGlobalId("PetitionSignatureRequest", 2),
      },
    },
  },
} as Record<PetitionEventType, JsonSchema>;

export const _PetitionEvent = {
  type: "object",
  oneOf: Object.entries(PetitionEventSchemas)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([event, data]) =>
        ({
          type: "object",
          title: titleize(event),
          description: data.description, // should be visible after merging https://github.com/Redocly/redoc/pull/1497
          additionalProperties: false,
          properties: {
            id: {
              type: "string",
              description: "The ID of the petition event",
              example: toGlobalId("PetitionEvent", 1),
            },
            type: {
              type: "string",
              const: event as PetitionEventType,
              description: `\`${event}\``,
              example: event,
            },
            petitionId: {
              type: "string",
              description: "The ID of the petition where this event occurred",
              example: toGlobalId("Petition", 42),
            },
            data: {
              type: "object",
              description: "The payload of the event",
              additionalProperties: false,
              required: data.required ?? Object.keys(data.properties!),
              properties: data.properties! as any,
            } as unknown as { type: "object" },
            createdAt: {
              description: "Creation date of the event",
              type: "string",
              format: "date-time",
              example: new Date(2020, 2, 15).toISOString(),
            },
          },
        } as const)
    ),
} as const;

export const PetitionEvent = schema(_PetitionEvent);

const _Subscription = {
  title: "Subscription",
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "eventsUrl", "isEnabled", "eventTypes"],
  properties: {
    id: {
      type: "string",
      description: "ID of the subscription",
      example: toGlobalId("OrgIntegration", 10),
    },
    name: {
      type: ["string", "null"],
      description: "Name of the subscription",
      example: "My subscription",
    },
    eventsUrl: {
      type: "string",
      description: "URL where we will send POST requests with real-time petition events",
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
      items: { type: "string", enum: Object.keys(PetitionEventSchemas) },
    },
  },
} as const;
export const ListOfSubscriptions = ListOf(_Subscription);
export const Subscription = schema(_Subscription);
export const CreateSubscription = schema({
  title: "CreateSubscription",
  type: "object",
  additionalProperties: false,
  required: ["eventsUrl"],
  properties: {
    name: {
      type: ["string", "null"],
      description: "Optional name to identify the subscription",
      example: "My subscription",
    },
    eventsUrl: {
      description: "The URL where you will receive POST requests with real time petition events",
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
        enum: Object.keys(PetitionEventSchemas) as PetitionEventType[],
      },
    },
  },
} as const);

function PaginatedListOf<T extends Exclude<JsonSchema, boolean>>(item: T) {
  return schema({
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
  } as const);
}

function ListOf<T extends JsonSchema>(item: T) {
  return schema(_ListOf(item));
}

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

const _PetitionAttachment = {
  title: "PetitionAttachment",
  type: "object",
  required: ["id", "file", "createdAt"],
  additionalProperties: false,
  properties: {
    id: {
      type: "string",
      description: "The ID of the petition attachment",
      example: toGlobalId("PetitionAttachment", 1),
    },
    file: {
      type: "object",
      additionalProperties: false,
      required: ["filename", "contentType", "size", "isComplete"],
      properties: {
        filename: {
          type: "string",
          description: "The name of the file",
        },
        contentType: {
          type: "string",
          description: "content-type of the file",
        },
        size: {
          type: "integer",
          description: "size of the file in bytes",
        },
        isComplete: {
          type: "boolean",
          description: "Whether this file is correctly uploaded or not",
        },
      },
      example: {
        filename: "presentation.pdf",
        contentType: "application/pdf",
        size: 5614,
        isComplete: true,
      },
    },
    createdAt: {
      type: "string",
      format: "date-time",
      description: "Creation date of the attachment",
    },
  },
} as const;
export const PetitionAttachment = schema(_PetitionAttachment);
export const ListOfPetitionAttachments = ListOf(_PetitionAttachment);

export const FileUpload = schema({
  title: "FileUpload",
  type: "object",
  additionalProperties: false,
  required: ["file"],
  properties: {
    file: {
      type: "object",
      format: "binary",
    },
  },
} as const);

const _SignatureRequest = {
  type: "object",
  additionalProperties: false,
  required: ["id", "environment", "createdAt", "updatedAt", "status"],
  properties: {
    id: {
      type: "string",
      description: "The ID of the petition signature request",
      example: toGlobalId("PetitionSignatureRequest", 1),
    },
    environment: {
      description:
        "The environment of the used signature integration. DEMO signatures have no legal validity.",
      type: "string",
      enum: ["DEMO", "PRODUCTION"],
      example: "PRODUCTION",
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
    status: {
      type: "string",
      enum: ["ENQUEUED", "PROCESSING", "PROCESSED", "CANCELLED", "COMPLETED"],
      description: "Current status of the signature request",
      example: "COMPLETED",
    },
  },
} as const;
export const ListOfSignatureRequests = ListOf(_SignatureRequest);

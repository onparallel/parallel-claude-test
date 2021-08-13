import { outdent } from "outdent";
import { PetitionEventType } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { titleize } from "../../util/strings";
import { JsonSchema, schema } from "../rest/schemas";

const _Petition = {
  title: "Petition",
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "status", "deadline", "locale", "createdAt"],
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
  },
} as const;

const _Template = {
  title: "Template",
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "description", "locale", "createdAt"],
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
  },
} as const;

const _User = {
  title: "User",
  type: "object",
  additionalProperties: false,
  required: ["id", "firstName", "lastName", "fullName"],
  properties: {
    id: {
      description: "The ID of the user",
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
      type: ["string", "null"],
      description: "The first name of the contact",
    },
    lastName: {
      type: ["string", "null"],
      description: "The last name of the contact",
    },
    fullName: {
      type: ["string", "null"],
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

const _Subscription = {
  title: "Subscription",
  type: "object",
  additionalProperties: false,
  required: ["id", "endpoint", "createdAt"],
  properties: {
    id: {
      description: "The ID of the subscription",
      type: "string",
      example: toGlobalId("Subscription", 42),
    },
    endpoint: {
      description: "The URL on which to receive POST requests with the petition events.",
      type: "string",
      example: "https://my.endpoint.com/parallel",
    },
    createdAt: {
      description: "Creation date of the subscription",
      type: "string",
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
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

const _PetitionFieldReply = {
  title: "PetitionFieldReply",
  type: "object",
  additionalProperties: false,
  required: ["id", "type", "content", "fieldId", "updatedAt", "createdAt"],
  properties: {
    id: {
      type: "string",
      description: "The ID of the reply",
      example: toGlobalId("PetitionFieldReply", 100),
    },
    type: {
      type: "string",
      enum: ["TEXT", "SHORT_TEXT", "FILE_UPLOAD", "SELECT", "DYNAMIC_SELECT", "CHECKBOX"],
      description: "The type of the field this reply originated from",
      example: "TEXT",
    },
    content: {
      oneOf: [
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
        },
        {
          title: "Checkbox reply",
          description: "An array with the selected choices.",
          type: "array",
          items: {
            type: "string",
          },
        },
      ],
    },
    fieldId: {
      type: "string",
      description: "The ID of the field this reply belongs to",
      example: toGlobalId("PetitionField", 2),
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
    eventsUrl: {
      description: "URL to receive real-time events of this petition",
      type: ["string", "null"],
      example: "https://my.endpoint.com/parallel",
    },
  },
} as const);
export const PaginatedPetitions = PaginatedListOf(_Petition);
export const PaginatedUsers = PaginatedListOf(_User);
export const PetitionAccess = schema(_PetitionAccess);
export const ListOfPetitionAccesses = ListOf(_PetitionAccess);
export const Template = schema(_Template);
export const PaginatedTemplates = PaginatedListOf(_Template);
export const Contact = schema(_Contact);
export const CreateContact = schema({
  title: "CreateContact",
  type: "object",
  additionalProperties: false,
  required: ["email"],
  properties: {
    email: {
      type: "string",
      format: "email",
      description: "The email of the contact",
    },
    firstName: {
      type: ["string", "null"],
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
  required: ["contacts", "message", "subject"],
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
            required: ["email"],
            properties: {
              email: {
                type: "string",
                format: "email",
                description: "The email of the contact to send this petition to",
              },
              firstName: {
                type: ["string", "null"],
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
    message: {
      ..._MessageBody,
      description: "The message to include in the email",
    },
    subject: {
      description: "The subject of the email that will be sent to the contacts",
      type: "string",
      maxLength: 255,
      example: "Please fill this petition",
    },
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

export const CreateSubscription = schema({
  title: "CreateSubscription",
  type: "object",
  additionalProperties: false,
  required: ["endpoint"],
  properties: {
    endpoint: {
      description: "The URL on which to receive the petition events.",
      type: "string",
      format: "uri",
      example: "https://my.endpoint.com/parallel",
    },
  },
} as const);
export const Subscription = schema(_Subscription);
export const ListOfSubscriptions = ListOf(_Subscription);

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

export const ListOfPermissions = ListOf(_Permission);

export const ListOfReplies = ListOf(_PetitionFieldReply);

export const FieldReplyDownloadContent = schema({
  type: "string",
  example: "Jon Snow",
  description: "The text-content of the reply, or a download URL for `FILE` replies",
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
  return schema({
    title: `${item.title ?? "any"}[]`,
    type: "array",
    items: item,
  } as const);
}

export const PetitionEvent = schema({
  type: "object",
  oneOf: Object.entries({
    ACCESS_ACTIVATED: {
      description: "The user created or reactivated an access on the petition",
      properties: {
        petitionAccessId: {
          description: "The ID of the petition access",
          type: "string",
        },
        userId: {
          description: "The ID of the user",
          type: "string",
        },
      },
    },
    ACCESS_DEACTIVATED: {
      description: "The user deactivated an access on the petition",
      properties: {
        petitionAccessId: {
          description: "The ID of the petition access",
          type: "string",
        },
        userId: {
          description: "The ID of the user",
          type: "string",
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
        },
        petitionAccessId: {
          description: "The ID of the original access where the delegation happened",
          type: "string",
        },
      },
    },
    ACCESS_OPENED: {
      description: "A recipient opened their access to the petition",
      properties: {
        petitionAccessId: {
          description: "The ID of the petition access",
          type: "string",
        },
      },
    },
    COMMENT_DELETED: {
      description: "A comment was deleted either by a recipient or an user.",
      properties: {
        petitionFieldCommentId: {
          description: "The ID of the comment",
          type: "string",
        },
        petitionFieldId: {
          description: "The ID of the field where the comment belongs",
          type: "string",
        },
        petitionAccessId: {
          description:
            "The ID of the access where the comment was deleted. If set, the comment was deleted by the recipient linked to this access",
          type: ["string", "null"],
        },
        userId: {
          description: "The ID of the user. If set, the comment was deleted by this user.",
          type: ["string", "null"],
        },
      },
    },
    COMMENT_PUBLISHED: {
      description: "A comment was published on a petition field",
      properties: {
        petitionFieldCommentId: {
          description: "The ID of the comment",
          type: "string",
        },
        petitionFieldId: {
          description: "The ID of the field where the comment belongs",
          type: "string",
        },
      },
    },
    MESSAGE_CANCELLED: {
      description: "A user cancelled a scheduled message",
      properties: {
        petitionMessageId: {
          description: "The ID of the cancelled message",
          type: "string",
        },
        userId: {
          description: "The ID of the user that cancelled the message",
          type: "string",
        },
      },
    },
    MESSAGE_SCHEDULED: {
      description: "A user scheduled a message",
      properties: {
        petitionMessageId: {
          description: "The ID of the scheduled message",
          type: "string",
        },
      },
    },
    MESSAGE_SENT: {
      description: "A user sent a message",
      properties: {
        petitionMessageId: {
          description: "The ID of the message",
          type: "string",
        },
      },
    },
    OWNERSHIP_TRANSFERRED: {
      description: "A user transferred the ownership of a petition to another user",
      properties: {
        userId: {
          description: "The ID of the user that transferred the petition",
          type: "string",
        },
        ownerId: {
          description: "The ID of the new owner of the petition",
          type: "string",
        },
        previousOwnerId: {
          description: "The ID of the previous owner of the petition",
          type: ["string", "null"],
        },
      },
    },
    PETITION_CLOSED: {
      description: "A petition was marked as `closed` by an user",
      properties: {
        userId: {
          description: "The ID of the user that closed the petition",
          type: "string",
        },
      },
    },
    PETITION_CLOSED_NOTIFIED: {
      description: "A user notified a recipient that the petition was closed",
      properties: {
        userId: {
          description: "The ID of the user",
          type: "string",
        },
        petitionAccessId: {
          description: "The ID of the petition access",
          type: "string",
        },
      },
    },
    PETITION_COMPLETED: {
      description: "A petition was completed by the recipient",
      properties: {
        petitionAccessId: {
          description: "The ID of the petition access linked to the recipient",
          type: "string",
        },
      },
    },
    PETITION_CREATED: {
      description: "A petition was created",
      properties: {
        userId: {
          description: "The ID of the user that created the petition",
          type: "string",
        },
      },
    },
    PETITION_REOPENED: {
      description: "A user reopened a closed petition",
      properties: {
        userId: {
          description: "The ID of the user that reopened the petition",
          type: "string",
        },
      },
    },
    REMINDER_SENT: {
      description: "A manual or automatic reminder was sent to the petition recipients",
      properties: {
        petitionReminderId: {
          description: "The ID of the reminder",
          type: "string",
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
        },
        userId: {
          description: "The ID of the user. If set, the reply was submitted by this user.",
          type: ["string", "null"],
        },
        petitionFieldId: {
          description: "The ID of the field replied by the recipient",
          type: "string",
        },
        petitionFieldReplyId: {
          description: "The ID of the new reply",
          type: "string",
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
        },
        userId: {
          description: "The ID of the user. If set, the reply was deleted by this user.",
          type: ["string", "null"],
        },
        petitionFieldId: {
          description: "The ID of the field where the reply belongs",
          type: "string",
        },
        petitionFieldReplyId: {
          description: "The ID of the deleted reply",
          type: "string",
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
        },
        userId: {
          description: "The ID of the user. If set, the reply was updated by this user.",
          type: ["string", "null"],
        },
        petitionFieldId: {
          description: "The ID of the field where the reply belongs",
          type: "string",
        },
        petitionFieldReplyId: {
          description: "The ID of the updated reply",
          type: "string",
        },
      },
    },
    SIGNATURE_CANCELLED: {
      description: "An eSignature request on the petition was cancelled.",
      properties: {
        petitionSignatureRequestId: {
          description: "The ID of the eSignature request",
          type: "string",
          example: toGlobalId("PetitionSignatureRequest", 1),
        },
        cancelReason: {
          description: "The reason of the cancel.",
          type: "string",
          enum: ["CANCELLED_BY_USER", "DECLINED_BY_SIGNER", "REQUEST_ERROR"],
          example: "CANCELLED_BY_USER",
        },
        cancelData: {
          description: "Information about who and why cancelled the eSignature request",
          type: "object",
          properties: {
            userId: {
              type: ["string", "null"],
              description: outdent`
                The ID of the user that cancelled the request.  
                Only set if cancelReason is \`CANCELLED_BY_USER\`.
              `,
              example: toGlobalId("User", 2),
            },
            contactId: {
              type: ["string", "null"],
              description: outdent`
                The ID of the contact that declined the signature.  
                Only set if cancelReason is \`DECLINED_BY_SIGNER\`.
              `,
              example: toGlobalId("Contact", 2),
            },
            reason: {
              type: ["string", "null"],
              description: "Reason of cancellation",
              example: "This document is outdated.",
            },
          },
        },
      },
    },
    SIGNATURE_COMPLETED: {
      description: "The eSignature request on the petition was completed",
      properties: {
        fileUploadId: {
          description: "The ID of the signed PDF file",
          type: "string",
        },
        petitionSignatureRequestId: {
          description: "The ID of the eSignature request",
          type: "string",
        },
      },
    },
    SIGNATURE_STARTED: {
      description: "An eSignature request on the petition started",
      properties: {
        petitionSignatureRequestId: {
          description: "The ID of the eSignature request",
          type: "string",
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
        },
        userId: {
          description: "The ID of the user that shared the petition",
          type: "string",
        },
        permissionUserId: {
          description: "The ID of the user linked to the new permission",
          type: "string",
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
        },
        userId: {
          description: "The ID of the user that edited the permission",
          type: "string",
        },
        permissionUserId: {
          description: "The ID of the user linked to the modified permission",
          type: "string",
        },
      },
    },
    USER_PERMISSION_REMOVED: {
      description: "The user removed a permission on their petition",
      properties: {
        userId: {
          description: "The ID of the user that removed the permission",
          type: "string",
        },
        permissionUserId: {
          description: "The ID of the user that lost its permission",
          type: "string",
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
        },
        userId: {
          description: "The ID of the user that shared the petition",
          type: "string",
        },
        userGroupId: {
          description: "The ID of the group linked to the new permission",
          type: "string",
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
        },
        userId: {
          description: "The ID of the user that edited the permission",
          type: "string",
        },
        userGroupId: {
          description: "The ID of the group linked to the modified permission",
          type: "string",
        },
      },
    },
    GROUP_PERMISSION_REMOVED: {
      description: "The user removed a permission on their petition",
      properties: {
        userId: {
          description: "The ID of the user that removed the permission",
          type: "string",
        },
        userGroupId: {
          description: "The ID of the group that lost its permission",
          type: "string",
        },
      },
    },
    PETITION_CLONED: {
      description: "The user cloned a petition",
      properties: {
        userId: {
          description: "The ID of the user that cloned the petition",
          type: "string",
        },
      },
    },
    PETITION_DELETED: {
      description: "The user deleted a petition",
      properties: {
        userId: {
          description: "The ID of the user that deleted the petition",
          type: "string",
        },
      },
    },
    TEMPLATE_USED: {
      description: "A template has been used to create a petition",
      properties: {
        userId: {
          description: "The ID of the user that used the template",
          type: "string",
        },
      },
    },
    REMINDERS_OPT_OUT: {
      description: "The contact has opted out from receiving reminders for this petition",
      required: ["petitionAccessId", "reason"],
      properties: {
        petitionAccessId: {
          description: "The ID of the petition access",
          type: "string",
        },
        reason: {
          type: "string",
          description: "Code representing the reason for opting out.",
          enum: ["NOT_INTERESTED", "NOT_REQUESTED", "WRONG_PERSON", "NO_REMINDERS", "OTHER"],
        },
        other: {
          type: "string",
          description: "If reason is OTHER, this will be the explanation added by the contact",
        },
      },
    },
    ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK: {
      description: "A contact started and sent itself a petition through a public petition link",
      required: ["petitionAccessId"],
      properties: {
        petitionAccessId: {
          description: "The ID of the petition access",
        },
      },
    },
    PETITION_MESSAGE_BOUNCED: {
      description: "A message email has bounced",
      required: ["petitionMessageId"],
      properties: {
        petitionMessageId: {
          description: "The ID of the petition message that caused the bounce",
          type: "string",
        },
      },
    },
    PETITION_REMINDER_BOUNCED: {
      description: "A reminder email has bounced",
      required: ["petitionReminderId"],
      properties: {
        petitionReminderId: {
          description: "The ID of the petition reminder that caused the bounce",
          type: "string",
        },
      },
    },
    RECIPIENT_SIGNED: {
      description: "A recipient has signed the document.",
      required: ["contactId", "petitionSignatureRequestId"],
      properties: {
        contactId: {
          type: "string",
          description: "The ID of the contact that signed the document",
          example: toGlobalId("Contact", 2),
        },
        petitionSignatureRequestId: {
          type: "string",
          description: "The ID of the signature request",
          example: toGlobalId("PetitionSignatureRequest", 2),
        },
      },
    },
  } as Record<PetitionEventType, JsonSchema>).map(
    ([event, data]) =>
      ({
        type: "object",
        title: titleize(event),
        description: data.description, // should be visible after merging https://github.com/Redocly/redoc/pull/1497
        additionalProperties: false,
        required: ["id", "type", "petitionId", "data", "createdAt"],
        properties: {
          id: {
            type: "string",
            description: "The ID of the petition event",
            example: toGlobalId("PetitionEvent", 1),
          },
          type: {
            type: "string",
            const: event,
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
            properties: data.properties!,
          },
          createdAt: {
            description: "Creation date of the event",
            type: "string",
            format: "date-time",
            example: new Date(2020, 2, 15).toISOString(),
          },
        },
      } as JsonSchema)
  ),
} as any);

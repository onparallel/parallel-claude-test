import { toGlobalId } from "../../util/globalId";
import { JSONSchema, schema } from "../rest/schemas";

const _Petition = {
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
      type: ["string", "null"],
      example: "My petition",
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
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "description", "locale", "createdAt"],
  properties: {
    id: {
      description: "The ID of the petition",
      type: "string",
      example: toGlobalId("Petition", 42),
    },
    name: {
      description: "The name of the petition",
      type: ["string", "null"],
      example: "My petition",
    },
    description: {
      description: "The description of the petition",
      type: ["string", "null"],
      example:
        "Lorem ipsum dolor sit amet consectetur adipiscing elit magnis porttitor tempor, imperdiet class neque purus ornare justo aptent orci sed pellentesque, natoque laoreet tincidunt volutpat ultricies suscipit iaculis hendrerit inceptos.",
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

const _User = {
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

const _Contact = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "email",
    "firstName",
    "lastName",
    "fullName",
    "createdAt",
    "updatedAt",
  ],
  properties: {
    id: {
      description: "The ID of the contact",
      type: "string",
    },
    email: {
      description: "The email of the contact",
      type: "string",
    },
    firstName: {
      description: "The first name of the contact",
      type: ["string", "null"],
    },
    lastName: {
      description: "The last name of the contact",
      type: ["string", "null"],
    },
    fullName: {
      description: "The full name of the contact",
      type: ["string", "null"],
    },
    createdAt: {
      description: "Creation date of the contact",
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      description: "Last update date of the contact",
      type: "string",
      format: "date-time",
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
      description:
        "The time of the day at which the reminder should be sent (00:00 - 23:59)",
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
  type: "object",
  oneOf: [
    {
      required: ["format", "content"],
      additionalProperties: false,
      properties: {
        format: {
          type: "string",
          const: "PLAIN_TEXT",
          example: "PLAIN_TEXT",
        },
        content: {
          description: "The content of the message",
          type: "string",
          example:
            "Hi Daryl,\nPlease fill the following information\n\nRegards,\nRick",
        },
      },
    },
  ],
} as const;

export const Petition = schema(_Petition);
export const CreatePetition = schema({
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

export const PaginatedPetitions = PaginatedListOf(_Petition);
export const PetitionAccess = schema(_PetitionAccess);
export const ListOfPetitionAccesses = ListOf(_PetitionAccess);
export const Template = schema(_Template);
export const PaginatedTemplates = PaginatedListOf(_Template);
export const Contact = schema(_Contact);
export const PaginatedContacts = PaginatedListOf(_Contact);
export const SendPetition = schema({
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
            type: "object",
            additionalProperties: false,
            required: ["email"],
            properties: {
              email: {
                description:
                  "The email of the contact to send this petition to",
                type: "string",
              },
              firstName: {
                description: "The first name of the contact",
                type: ["string", "null"],
                maxLength: 255,
              },
              lastName: {
                description: "The last name of the contact",
                type: ["string", "null"],
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
      formate: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
  },
} as const);

function PaginatedListOf<T extends Exclude<JSONSchema, boolean>>(item: T) {
  return schema({
    type: "object",
    description: "Paginated resource",
    additionalProperties: false,
    required: ["totalCount", "items"],
    properties: {
      totalCount: {
        description: "The total count of elements in this paginated resource",
        type: "integer",
        minimum: 0,
        example: 42,
      },
      items: {
        description:
          "The requested slice of items from this paginated resource",
        type: "array",
        items: item,
      },
    },
  } as const);
}

function ListOf<T extends JSONSchema>(item: T) {
  return schema({
    type: "array",
    items: item,
  } as const);
}

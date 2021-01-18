import { toGlobalId } from "../../util/globalId";
import { JSONSchema, schema } from "../rest/schemas";

const _Petition = {
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "status", "deadline", "locale", "createdAt"],
  properties: {
    id: {
      title: "The ID of the petition",
      type: "string",
      example: toGlobalId("Petition", 42),
    },
    name: {
      title: "The name of the petition",
      type: ["string", "null"],
      example: "My petition",
    },
    status: {
      title: "The status of the petition",
      type: "string",
      enum: ["DRAFT", "PENDING", "COMPLETED", "CLOSED"],
    },
    deadline: {
      title: "The deadline of the petition for informative purposes",
      type: ["string", "null"],
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
    locale: {
      title: "The locale of the petition",
      type: "string",
      enum: ["en", "es"],
      example: "en",
    },
    createdAt: {
      title: "Creation date of the petition",
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
      title: "The ID of the petition",
      type: "string",
      example: toGlobalId("Petition", 42),
    },
    name: {
      title: "The name of the petition",
      type: ["string", "null"],
      example: "My petition",
    },
    description: {
      title: "The description of the petition",
      type: ["string", "null"],
      example:
        "Lorem ipsum dolor sit amet consectetur adipiscing elit magnis porttitor tempor, imperdiet class neque purus ornare justo aptent orci sed pellentesque, natoque laoreet tincidunt volutpat ultricies suscipit iaculis hendrerit inceptos.",
    },
    locale: {
      title: "The locale of the petition",
      type: "string",
      enum: ["en", "es"],
      example: "en",
    },
    createdAt: {
      title: "Creation date of the petition",
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
      title: "The ID of the user",
      type: "string",
      example: toGlobalId("User", 42),
    },
    firstName: {
      title: "The first name of the user",
      type: ["string", "null"],
      example: "Michael",
    },
    lastName: {
      title: "The last name of the user",
      type: ["string", "null"],
      example: "Scofield",
    },
    fullName: {
      title: "The full name of the user",
      type: ["string", "null"],
      example: "Michael Scofield",
    },
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
      title: "The ID of the contact",
      type: "string",
      example: toGlobalId("Contact", 42),
    },
    email: {
      title: "The email of the contact",
      type: "string",
      example: "tyrion@casterlyrock.wes",
    },
    firstName: {
      title: "The first name of the contact",
      type: ["string", "null"],
      example: "Tyrion",
    },
    lastName: {
      title: "The last name of the contact",
      type: ["string", "null"],
      example: "Lannister",
    },
    fullName: {
      title: "The full name of the contact",
      type: ["string", "null"],
      example: "Tyrion Lannister",
    },
    createdAt: {
      title: "Creation date of the contact",
      type: "string",
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
    updatedAt: {
      title: "Last update date of the contact",
      type: "string",
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
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
      title: "The ID of the petition access",
      type: "string",
      example: toGlobalId("PetitionAccess", 42),
    },
    contact: {
      ..._Contact,
      title: "The recipient contact of the petition access",
      type: ["object", "null"],
    },
    granter: {
      ..._User,
      title: "The user who created this petition access",
      type: ["object", "null"],
    },
    status: {
      title: "The status of the petition access",
      type: "string",
      enum: ["ACTIVE", "INACTIVE"],
      example: "ACTIVE",
    },
    reminderCount: {
      title: "Number of reminders sent for the petition access",
      type: "integer",
      example: 2,
    },
    remindersLeft: {
      title: "Number of reminders left for the petition access",
      type: "integer",
      example: 8,
    },
    remindersActive: {
      title: "Whether reminders are active for the petition access",
      type: "boolean",
      example: true,
    },
    nextReminderAt: {
      title: "Date of the next reminder",
      type: ["string", "null"],
      format: "date-time",
      example: new Date(2020, 2, 17, 8, 0, 0).toISOString(),
    },
    createdAt: {
      title: "Creation date of the petition access",
      type: "string",
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
  },
} as const;

export const Petition = schema(_Petition);
export const CreatePetition = schema({
  type: "object",
  additionalProperties: false,
  required: ["templateId"],
  properties: {
    templateId: {
      title: "The ID of the template to use as base",
      type: "string",
      example: toGlobalId("Petition", 42),
    },
    name: {
      title: "An optional name for the created petition",
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

function PaginatedListOf<T extends Exclude<JSONSchema, boolean>>(item: T) {
  return schema({
    type: "object",
    additionalProperties: false,
    required: ["totalCount", "items"],
    properties: {
      totalCount: {
        title: "The total count of elements in this paginated resource",
        type: "integer",
        minimum: 0,
        example: 42,
      },
      items: {
        title: "The requested slice of items from this paginated resource",
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

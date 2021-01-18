import { toGlobalId } from "../../util/globalId";
import { JSONSchema, schema } from "../rest/schemas";

export const _Petition = {
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "createdAt"],
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
    createdAt: {
      title: "Creation date of the petition",
      type: "string",
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
  },
} as const;

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

export const Petition = schema(_Petition);
export const PaginatedPetitions = PaginatedListOf(_Petition);

const _PetitionAccess = {
  type: "object",
  additionalProperties: false,
  required: [],
  properties: {
    id: {
      title: "The ID of the petition access",
      type: "string",
      example: toGlobalId("PetitionAccess", 42),
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

export const PetitionAccess = schema(_PetitionAccess);
export const ListOfPetitionAccesses = ListOf(_PetitionAccess);

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

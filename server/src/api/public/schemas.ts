import { toGlobalId } from "../../util/globalId";
import { JSONSchema, schema } from "../rest/schemas";

export const _Petition = {
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "createdAt"],
  properties: {
    id: {
      type: "string",
      example: toGlobalId("Petition", 42),
    },
    name: {
      type: ["string", "null"],
      example: "My petition",
    },
    createdAt: {
      type: "string",
      format: "date-time",
      example: new Date(2020, 2, 15).toISOString(),
    },
  },
} as const;

export const Petition = schema(_Petition);
export const PaginatedPetitions = Paginated(_Petition);

function Paginated<T extends JSONSchema>(item: T) {
  return schema({
    type: "object",
    additionalProperties: false,
    required: ["totalCount", "items"],
    properties: {
      totalCount: {
        type: "integer",
        minimum: 0,
        example: 42,
      },
      items: {
        type: "array",
        items: item,
      },
    },
  } as const);
}

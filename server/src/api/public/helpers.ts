import { ClientError } from "graphql-request";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { RestParameter } from "../rest/core";
import {
  buildDefinition,
  buildParse,
  enumParam,
  GeneratedParameterType,
  IdParameterOptions,
  intParam,
  ParseError,
} from "../rest/params";
import { PetitionFieldType, PetitionFieldWithRepliesFragment } from "./__types";

export function paginationParams() {
  return {
    offset: intParam({
      description: "How many items to skip",
      defaultValue: 0,
      required: false,
      minimum: 0,
      example: 5,
    }),
    limit: intParam({
      description: "How many items to return at most",
      required: true,
      minimum: 0,
      example: 10,
    }),
  };
}

type SortByDirection = "ASC" | "DESC";

export function sortByParam<T extends string>(fields: T[]) {
  const values = fields.flatMap((f) => [`${f}_ASC`, `${f}_DESC`]) as `${T}_${SortByDirection}`[];
  return {
    sortBy: enumParam({
      description: "Sort this resource list by one of the available options",
      values,
      required: false,
      array: true,
      example: values[0],
    }),
  };
}

export function idParam<
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined
>(
  options: IdParameterOptions<TRequired, TArray>
): RestParameter<GeneratedParameterType<string, TRequired, TArray>> {
  // ignore defaultValue
  delete options.defaultValue;
  const { type } = options;
  return {
    parse: buildParse(options, (value) => {
      try {
        if (fromGlobalId(value).type !== type) {
          throw new Error();
        }
      } catch {
        throw new ParseError(value, `Value is not a valid ID`);
      }
      return value;
    }),
    spec: buildDefinition(options, {
      type: "string",
      example: toGlobalId(type, 42),
    } as any),
  };
}

export function containsGraphQLError(error: ClientError, errorCode: string) {
  return ((error.response.errors![0] as any).extensions.code as string) === errorCode;
}

export function mapFieldReplyContent(fieldType: PetitionFieldType, content: any) {
  switch (fieldType) {
    case "FILE_UPLOAD":
      return content as {
        filename: string;
        contentType: string;
        size: number;
      };
    case "DYNAMIC_SELECT":
      return content.columns as [string, string][];
    case "CHECKBOX":
      return content.choices as string[];
    default:
      return content.text as string;
  }
}

export function mapPetitionFieldRepliesContent<
  T extends { fields?: PetitionFieldWithRepliesFragment[] }
>(petition: T) {
  return {
    ...petition,
    fields: petition.fields?.map((field) => ({
      ...field,
      replies: field.replies.map((reply) => ({
        ...reply,
        content: mapFieldReplyContent(field.type, reply.content),
      })),
    })),
  };
}

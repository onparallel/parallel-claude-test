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

export function paginationParams() {
  return {
    offset: intParam({
      description: "How many items to skip",
      defaultValue: 0,
      required: false,
      minimum: 0,
    }),
    limit: intParam({
      description: "How many items to return at most",
      required: true,
      minimum: 0,
    }),
  };
}

export function sortByParam<T extends string>(values: T[]) {
  return {
    sortBy: enumParam({
      description: "Sort this resource list by one of the available options",
      values: values.flatMap((option) => [
        `${option}_ASC`,
        `${option}_DESC`,
      ]) as `${T}_${"ASC" | "DESC"}`[],
      required: false,
      array: true,
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
  return (
    ((error.response.errors![0] as any).extensions.code as string) === errorCode
  );
}

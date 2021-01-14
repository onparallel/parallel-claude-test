import { OpenAPIV3 } from "openapi-types";
import { fromGlobalId } from "../../util/globalId";
import { MaybePromise } from "../../util/types";
import { RestParameter } from "./core";
import { JSONSchema } from "./schemas";

export class ParseError extends Error {
  constructor(public readonly value: string | undefined, message: string) {
    super(message);
  }
}

type ArrayIfTrue<T, IsArray extends boolean | undefined> = IsArray extends true
  ? T[]
  : T;

export interface BaseParameterOptions<
  T,
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined
> {
  defaultValue?: TDefaultValue;
  description?: string;
  deprecated?: boolean;
  required?: TRequired;
  array?: TArray;
}

interface ArrayParameterOptions {
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
}

export type ParameterOptions<
  T,
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined
> = BaseParameterOptions<T, TRequired, TArray, TDefaultValue> &
  (TArray extends true ? ArrayParameterOptions : {});

type GeneratedParameterType<
  T,
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined
> = TRequired extends true | undefined
  ? ArrayIfTrue<T, TArray>
  : TDefaultValue extends undefined
  ? ArrayIfTrue<T, TArray> | undefined
  : ArrayIfTrue<T, TArray>;

interface ParameterParser<
  T,
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined
> {
  (value?: string): MaybePromise<
    GeneratedParameterType<T, TRequired, TArray, TDefaultValue>
  >;
}

export function buildParse<
  T,
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined
>(
  options: ParameterOptions<T, TRequired, TArray, TDefaultValue>,
  parser: (value: string) => MaybePromise<T>
): ParameterParser<T, TRequired, TArray, TDefaultValue> {
  return async function (value?: string) {
    const { required = true, array = false, defaultValue } = options;
    if (value === undefined) {
      if (required) {
        throw new ParseError(value, "Parameter is missing but it is required");
      }
      return defaultValue;
    } else {
      if (array) {
        return await Promise.all(
          value.split(/(?<!\\),/).map(async (part) => {
            return await parser(part.replace(/\\,/g, ","));
          })
        );
      } else {
        return await parser(value);
      }
    }
  } as any;
}

export function buildDefinition<
  T,
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined
>(
  options: ParameterOptions<T, TRequired, TArray, TDefaultValue>,
  schema: JSONSchema
): OpenAPIV3.ParameterBaseObject {
  const { required = true, array = false, deprecated, description } = options;
  return {
    description,
    deprecated,
    required,
    ...(array
      ? {
          explode: false,
          schema: {
            type: "array",
            items: schema,
          } as any,
        }
      : { schema: schema as any }),
  };
}

export type NumberParameterOptions<
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<number, TArray> | undefined = undefined
> = ParameterOptions<number, TRequired, TArray, TDefaultValue> & {
  minimum?: number;
  exclusiveMinimum?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
};

function _numberParam(integer: boolean) {
  return function numberParam<
    TRequired extends boolean = true,
    TArray extends boolean | undefined = undefined,
    TDefaultValue extends ArrayIfTrue<number, TArray> | undefined = undefined
  >(
    options: NumberParameterOptions<TRequired, TArray, TDefaultValue>
  ): RestParameter<
    GeneratedParameterType<number, TRequired, TArray, TDefaultValue>
  > {
    const {
      minimum,
      exclusiveMinimum,
      maximum,
      exclusiveMaximum,
      multipleOf,
    } = options;
    return {
      parse: buildParse(options, (value) => {
        const result = integer ? parseInt(value) : parseFloat(value);
        if (Number.isNaN(result)) {
          throw new ParseError(
            value,
            `Value must be ${integer ? "an integer" : "a float"}`
          );
        }
        if (minimum !== undefined && result < minimum) {
          throw new ParseError(
            value,
            `Value must be greater or equal than ${minimum}`
          );
        }
        if (exclusiveMinimum !== undefined && result <= exclusiveMinimum) {
          throw new ParseError(
            value,
            `Value must be greater than ${exclusiveMinimum}`
          );
        }
        if (maximum !== undefined && result > maximum) {
          throw new ParseError(
            value,
            `Value must be lower or equal than ${maximum}`
          );
        }
        if (exclusiveMaximum !== undefined && result >= exclusiveMaximum) {
          throw new ParseError(
            value,
            `Value must be lower than ${exclusiveMaximum}`
          );
        }
        if (multipleOf !== undefined) {
          const rem = result % multipleOf;
          // 0.3 % 0.1 -> 0.09999999999999998
          if (rem !== 0 && Math.abs(rem - multipleOf) > Number.EPSILON) {
            throw new ParseError(
              value,
              `Value must be a multiple of ${multipleOf}`
            );
          }
        }
        return result;
      }),
      definition: buildDefinition(options, {
        type: integer ? "integer" : "number",
        minimum,
        exclusiveMinimum,
        maximum,
        exclusiveMaximum,
        multipleOf,
      }),
    };
  };
}

export const intParam = _numberParam(true);
export const numberParam = _numberParam(false);

export type StringParameterOptions<
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<string, TArray> | undefined = undefined
> = ParameterOptions<string, TRequired, TArray, TDefaultValue> & {
  pattern?: RegExp;
  maxLength?: number;
  minLength?: number;
};

export function stringParam<
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<string, TArray> | undefined = undefined
>(
  options: StringParameterOptions<TRequired, TArray, TDefaultValue>
): RestParameter<
  GeneratedParameterType<string, TRequired, TArray, TDefaultValue>
> {
  const { pattern, maxLength, minLength } = options;
  return {
    parse: buildParse(options, (value) => {
      if (pattern !== undefined && !pattern.test(value)) {
        throw new ParseError(
          value,
          `Value must match pattern ${JSON.stringify(pattern.toString())}`
        );
      }
      if (maxLength !== undefined && value.length > maxLength) {
        throw new ParseError(
          value,
          `Value must not exceed maximum length of ${maxLength}`
        );
      }
      if (minLength !== undefined && value.length < minLength) {
        throw new ParseError(
          value,
          `Value must not be less than minimum length of ${minLength}`
        );
      }
      return value;
    }),
    definition: buildDefinition(options, {
      type: "string",
      pattern: pattern?.toString(),
      minLength,
      maxLength,
    }),
  };
}

export type EnumParameterOptions<
  T extends string,
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined
> = ParameterOptions<T, TRequired, TArray, TDefaultValue> & {
  values: T[];
};

export function enumParam<
  T extends string,
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined
>(
  options: EnumParameterOptions<T, TRequired, TArray, TDefaultValue>
): RestParameter<GeneratedParameterType<T, TRequired, TArray, TDefaultValue>> {
  const { values } = options;
  return {
    parse: buildParse(options, (value: string) => {
      if (!values.includes(value as T)) {
        throw new ParseError(
          value,
          `Value must be one of ${values
            .map((v) => JSON.stringify(v))
            .join(", ")}`
        );
      }
      return value as T;
    }),
    definition: buildDefinition(options, {
      type: "string",
      enum: values,
    }),
  };
}

export type IdParameterOptions<
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined
> = ParameterOptions<string, TRequired, TArray, undefined> & {
  type: string;
};

export function idParam<
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined
>(options: IdParameterOptions<TRequired, TArray>) {
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
    definition: buildDefinition(options, {
      type: "string",
    }),
  };
}

import Ajv from "ajv";
import { OpenAPIV3 } from "openapi-types";
import { isDefined } from "remeda";
import { If, MaybePromise } from "../../util/types";
import { RestParameter } from "./core";
import { JsonSchema } from "./schemas";

export class ParseError extends Error {
  constructor(
    public readonly value: any,
    message: string,
  ) {
    super(message);
  }
}

type ArrayIfTrue<T, IsArray extends boolean | undefined> = If<IsArray, T[], T>;

export interface BaseParameterOptions<
  T,
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined,
> {
  defaultValue?: TDefaultValue;
  description?: string;
  deprecated?: boolean;
  required?: TRequired;
  array?: TArray;
  example?: any;
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
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined,
> = BaseParameterOptions<T, TRequired, TArray, TDefaultValue> &
  If<TArray, ArrayParameterOptions, {}>;

export type GeneratedParameterType<
  T,
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined,
> = If<
  TRequired,
  ArrayIfTrue<T, TArray>,
  TDefaultValue extends undefined ? ArrayIfTrue<T, TArray> | undefined : ArrayIfTrue<T, TArray>
>;

export interface ParameterParser<
  T,
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined,
> {
  (value?: unknown): MaybePromise<GeneratedParameterType<T, TRequired, TArray, TDefaultValue>>;
}

export function buildParse<
  T,
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined,
>(
  options: ParameterOptions<T, TRequired, TArray, TDefaultValue>,
  parser: (value: unknown) => MaybePromise<T>,
): ParameterParser<T, TRequired, TArray, TDefaultValue> {
  return async function (value: any) {
    const { required = true, array = false, defaultValue } = options;
    if (value === undefined) {
      if (required) {
        throw new ParseError(value, "Parameter is missing but it is required");
      }
      return defaultValue;
    } else {
      if (array) {
        if (value === "") {
          return [];
        } else {
          if (Array.isArray(value)) {
            return await Promise.all(value.map(async (item: any) => await parser(item)));
          } else if (typeof value === "string") {
            return await Promise.all(
              value.split(/(?<!\\),/).map(async (part) => await parser(part.replace(/\\,/g, ","))),
            );
          } else {
            throw new ParseError(value, "Expected an array but something else was received");
          }
        }
      } else {
        if (Array.isArray(value)) {
          throw new ParseError(value, "Parameter is an array but an array was not expected");
        }
        return await parser(value);
      }
    }
  } as any;
}

export function buildDefinition<
  T,
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined,
>(
  options: ParameterOptions<T, TRequired, TArray, TDefaultValue>,
  schema: JsonSchema,
): OpenAPIV3.ParameterBaseObject {
  const { required = true, array = false, deprecated, description, example } = options;
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
    example,
  };
}

export type NumberParameterOptions<
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<number, TArray> | undefined = undefined,
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
    TDefaultValue extends ArrayIfTrue<number, TArray> | undefined = undefined,
  >(
    options: NumberParameterOptions<TRequired, TArray, TDefaultValue>,
  ): RestParameter<GeneratedParameterType<number, TRequired, TArray, TDefaultValue>> {
    const { minimum, exclusiveMinimum, maximum, exclusiveMaximum, multipleOf } = options;
    return {
      parse: buildParse(options, (value) => {
        if (typeof value !== "string") {
          throw new ParseError(value, "Raw value must be a string");
        }
        const result = integer ? parseInt(value) : parseFloat(value);
        if (Number.isNaN(result)) {
          throw new ParseError(value, `Value must be ${integer ? "an integer" : "a float"}`);
        }
        if (minimum !== undefined && result < minimum) {
          throw new ParseError(value, `Value must be greater or equal than ${minimum}`);
        }
        if (exclusiveMinimum !== undefined && result <= exclusiveMinimum) {
          throw new ParseError(value, `Value must be greater than ${exclusiveMinimum}`);
        }
        if (maximum !== undefined && result > maximum) {
          throw new ParseError(value, `Value must be lower or equal than ${maximum}`);
        }
        if (exclusiveMaximum !== undefined && result >= exclusiveMaximum) {
          throw new ParseError(value, `Value must be lower than ${exclusiveMaximum}`);
        }
        if (multipleOf !== undefined) {
          const rem = result % multipleOf;
          // 0.3 % 0.1 -> 0.09999999999999998
          if (rem !== 0 && Math.abs(rem - multipleOf) > Number.EPSILON) {
            throw new ParseError(value, `Value must be a multiple of ${multipleOf}`);
          }
        }
        return result;
      }),
      spec: buildDefinition(options, {
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
  TDefaultValue extends ArrayIfTrue<string, TArray> | undefined = undefined,
> = ParameterOptions<string, TRequired, TArray, TDefaultValue> & {
  pattern?: RegExp;
  maxLength?: number;
  minLength?: number;
};

export function stringParam<
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<string, TArray> | undefined = undefined,
>(
  options: StringParameterOptions<TRequired, TArray, TDefaultValue>,
): RestParameter<GeneratedParameterType<string, TRequired, TArray, TDefaultValue>> {
  const { pattern, maxLength, minLength } = options;
  return {
    parse: buildParse(options, (value) => {
      if (typeof value !== "string") {
        throw new ParseError(value, "Value must be a string");
      }
      if (pattern !== undefined && !pattern.test(value)) {
        throw new ParseError(
          value,
          `Value must match pattern ${JSON.stringify(pattern.toString())}`,
        );
      }
      if (maxLength !== undefined && value.length > maxLength) {
        throw new ParseError(value, `Value must not exceed maximum length of ${maxLength}`);
      }
      if (minLength !== undefined && value.length < minLength) {
        throw new ParseError(value, `Value must not be less than minimum length of ${minLength}`);
      }
      return value;
    }),
    spec: buildDefinition(options, {
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
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined,
> = ParameterOptions<T, TRequired, TArray, TDefaultValue> & {
  schemaTitle?: string;
  values: T[];
};

export function enumParam<
  T extends string,
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<T, TArray> | undefined = undefined,
>(
  options: EnumParameterOptions<T, TRequired, TArray, TDefaultValue>,
): RestParameter<GeneratedParameterType<T, TRequired, TArray, TDefaultValue>> {
  const { values, schemaTitle } = options;
  return {
    parse: buildParse(options, (value) => {
      if (value && typeof value !== "string") {
        throw new ParseError(value, "Value must be a string");
      }
      if (!values.includes(value as T)) {
        throw new ParseError(
          value,
          `Value must be one of ${values.map((v) => JSON.stringify(v)).join(", ")}`,
        );
      }
      return value as T;
    }),
    spec: buildDefinition(options, {
      title: schemaTitle,
      type: "string",
      enum: values,
    }),
  };
}

export type IdParameterOptions<
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
> = ParameterOptions<string, TRequired, TArray, undefined> & {
  type: string | string[];
};

export function booleanParam<
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
  TDefaultValue extends ArrayIfTrue<boolean, TArray> | undefined = undefined,
>(
  options: ParameterOptions<boolean, TRequired, TArray, TDefaultValue>,
): RestParameter<GeneratedParameterType<boolean, TRequired, TArray, TDefaultValue>> {
  return {
    parse: buildParse(options, (value) => {
      if (typeof value !== "string") {
        throw new ParseError(value, "Raw value must be a string");
      }
      if (!["true", "false"].includes(value)) {
        throw new ParseError(value, `Value must be "true" or "false"`);
      }
      return value === "true";
    }),
    spec: buildDefinition(options, {
      type: "string",
    }),
  };
}

export type ObjectParameterOptions<
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
> = ParameterOptions<any, TRequired, TArray, undefined> & {
  schema: JsonSchema;
  validate?: (key: string, value: any) => void;
};

export function objectParam<
  TRequired extends boolean = true,
  TArray extends boolean | undefined = undefined,
>(
  options: ObjectParameterOptions<TRequired, TArray>,
): RestParameter<GeneratedParameterType<any, TRequired, TArray>> {
  const ajv = new Ajv({ allowUnionTypes: true });
  return {
    parse: buildParse(options, (value) => {
      if (typeof value !== "object" || value === null) {
        throw new ParseError(value, "Value must be an object");
      }
      const isValid = ajv.validate(options.schema, value);
      if (!isValid) {
        throw new ParseError(value, ajv.errorsText());
      }

      if (isDefined(options.validate)) {
        try {
          for (const [key, val] of Object.entries(value)) {
            options.validate(key, val);
          }
        } catch (e) {
          if (e instanceof Error) {
            throw new ParseError(value, e.message);
          }
          throw e;
        }
      }

      return value;
    }),
    spec: buildDefinition(options, options.schema),
  };
}

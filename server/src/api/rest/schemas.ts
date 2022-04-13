import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { FromSchema, JSONSchema as _JSONSchema } from "json-schema-to-ts";
import { isValidTime, isValidTimezone } from "../../util/validators";

export type JsonSchema = Exclude<_JSONSchema, boolean>;

export type JsonSchemaFor<T> = JsonSchema & {
  __type?: T;
};

export function schema<T>(value: T): JsonSchemaFor<FromSchema<T>> {
  return value;
}

export function buildValidateSchema<T>(schema: JsonSchemaFor<T>): ValidateFunction<T>;
export function buildValidateSchema<T = any>(schema: JsonSchema): ValidateFunction<T>;
export function buildValidateSchema<T = any>(schema: JsonSchema) {
  const ajv = new Ajv({ strict: false });
  addFormats(ajv, ["date-time", "date", "email", "uri", "binary"]);
  ajv.addFormat("time-zone", isValidTimezone);
  ajv.addFormat("time", isValidTime);
  return ajv.compile<T>(schema);
}

import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { FromSchema, JSONSchema as _JSONSchema } from "json-schema-to-ts";
import { isValidTime, isValidTimezone } from "../../util/validators";

export type JSONSchema = Exclude<_JSONSchema, boolean>;

export type JSONSchemaFor<T> = JSONSchema & {
  __type?: T;
};

export function schema<T>(value: T): JSONSchemaFor<FromSchema<T>> {
  return value;
}

export function buildValidateSchema<T>(
  schema: JSONSchemaFor<T>
): ValidateFunction<T>;
export function buildValidateSchema<T = any>(
  schema: JSONSchema
): ValidateFunction<T>;
export function buildValidateSchema<T = any>(schema: JSONSchema) {
  const ajv = new Ajv({ strict: false });
  addFormats(ajv, ["date-time"]);
  ajv.addFormat("time-zone", isValidTimezone);
  ajv.addFormat("time", isValidTime);
  return ajv.compile<T>(schema);
}

import Ajv from "ajv";
import addFormats from "ajv-formats";
import { FromSchema, JSONSchema } from "json-schema-to-ts";
import { isValidTime, isValidTimezone } from "../../util/validators";
export type { JSONSchema } from "json-schema-to-ts";

export type JSONSchemaFor<T> = JSONSchema & {
  __type?: T;
};

export function schema<T>(value: T): JSONSchemaFor<FromSchema<T>> {
  return value;
}

export function buildValidateSchema<T = any>(schema: JSONSchema) {
  const ajv = new Ajv({ strict: false });
  addFormats(ajv, ["date-time"]);
  ajv.addFormat("time-zone", isValidTimezone);
  ajv.addFormat("time", isValidTime);
  return ajv.compile<T>(schema);
}

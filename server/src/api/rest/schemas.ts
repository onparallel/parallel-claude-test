import { JSONSchema, FromSchema } from "json-schema-to-ts";
export type { JSONSchema } from "json-schema-to-ts";

export type JSONSchemaFor<T> = JSONSchema & {
  __type?: T;
};

export function schema<T>(value: T): JSONSchemaFor<FromSchema<T>> {
  return value;
}

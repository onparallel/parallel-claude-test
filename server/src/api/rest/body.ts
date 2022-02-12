import { Request } from "express";
import { outdent } from "outdent";
import { isDefined } from "remeda";
import typeIs from "type-is";
import { unMaybeArray } from "../../util/arrays";
import { RestApiContext, RestBody, RestBodyContent } from "./core";
import { InvalidRequestBodyError } from "./errors";
import { buildValidateSchema, JsonSchemaFor } from "./schemas";

export interface BodyOptions {
  description?: string;
  required?: boolean;
}

export function JsonBodyContent<T>(schema: JsonSchemaFor<T>): RestBodyContent<T> {
  const validate = buildValidateSchema(schema);
  return {
    contentType: "application/json",
    schema,
    validate: (req, context) => {
      const valid = validate(req.body);
      if (!valid) {
        const error = validate.errors![0];
        throw new InvalidRequestBodyError(`Property at ${error.instancePath} ${error.message}`);
      }
      context.body = req.body;
    },
  };
}

export function FormDataBodyContent<T>(schema: JsonSchemaFor<T>): RestBodyContent<T> {
  const validate = buildValidateSchema(schema);
  return {
    contentType: "multipart/form-data",
    schema,
    validate: (req, context) => {
      const body = { ...(req.body ?? {}) };
      const files: typeof context.files = {};
      if (isDefined(req.file)) {
        body[req.file.fieldname] = req.file;
        files[req.file.fieldname] = [req.file];
      }
      // This needs to be tested
      if (isDefined(req.files)) {
        if (Array.isArray(req.files)) {
          for (const file of req.files) {
            body[file.fieldname] = [...(body[file.fieldname] ?? []), file];
            files[file.fieldname] = [...(files[file.fieldname] ?? []), file];
          }
        } else {
          for (const [fieldname, _files] of Object.entries(req.files)) {
            body[fieldname] = _files;
            files[fieldname] = _files;
          }
        }
      }
      const valid = validate(body);
      if (!valid) {
        const error = validate.errors![0];
        throw new InvalidRequestBodyError(`Property at ${error.instancePath} ${error.message}`);
      }
      context.body = body;
      context.files = files;
    },
  };
}

export function Body<T extends RestBodyContent<any>>(
  contents: T[],
  options?: BodyOptions
): RestBody<T extends RestBodyContent<infer U> ? U : never> {
  const { description, required = true } = options ?? {};
  const _contents = unMaybeArray(contents);
  return {
    spec: {
      description,
      required,
      content: Object.fromEntries(
        _contents.map(({ contentType, schema }) => [contentType, { schema: schema as any }])
      ),
    },
    validate: (req: Request, context: RestApiContext) => {
      if (!isDefined(req.body)) {
        if (required) {
          throw new InvalidRequestBodyError("Body is required");
        }
      }
      for (const { contentType, validate } of _contents) {
        if (typeIs(req, [contentType])) {
          return validate(req, context);
        }
      }
      throw new InvalidRequestBodyError(outdent`
        Invalid Content-Type.
        The following Content-Type are accepted: ${_contents.map((c) => c.contentType).join(", ")}
      `);
    },
  };
}

export function FormDataBody<T>(schema: JsonSchemaFor<T>, options?: BodyOptions): RestBody<T> {
  return Body([FormDataBodyContent(schema)], options);
}

export function JsonBody<T>(schema: JsonSchemaFor<T>, options?: BodyOptions): RestBody<T> {
  return Body([JsonBodyContent(schema)], options);
}

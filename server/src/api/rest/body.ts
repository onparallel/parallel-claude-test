import { Request } from "express";
import { unflatten } from "flat";
import { OpenAPIV3 } from "openapi-types";
import { outdent } from "outdent";
import { isDefined } from "remeda";
import typeIs from "type-is";
import { unMaybeArray } from "../../util/arrays";
import { FormDataFile, RestApiContext, RestBody, RestBodyContent } from "./core";
import { InvalidRequestBodyError } from "./errors";
import { JsonSchemaFor, buildValidateSchema } from "./schemas";

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

export function FormDataBodyContent<T>(
  schema: JsonSchemaFor<T>,
  other?: Pick<OpenAPIV3.MediaTypeObject, "example" | "examples">,
): RestBodyContent<T> {
  const validate = buildValidateSchema(schema);
  return {
    contentType: "multipart/form-data",
    validate: (req, context) => {
      const body = { ...(req.body ?? {}) };
      context.files = {};
      if (isDefined(req.file)) {
        const file = new FormDataFile(req.file);
        body[req.file.fieldname] = file;
        context.files[req.file.fieldname] = [file];
      }
      // This needs to be tested
      if (isDefined(req.files)) {
        if (Array.isArray(req.files)) {
          for (const file of req.files) {
            const _file = new FormDataFile(file);
            body[file.fieldname] = [...(body[file.fieldname] ?? []), _file];
            context.files[file.fieldname] = [...(context.files[file.fieldname] ?? []), _file];
          }
        } else {
          for (const [fieldname, files] of Object.entries(req.files)) {
            const _files = files.map((file) => new FormDataFile(file));
            body[fieldname] = _files;
            context.files[fieldname] = _files;
          }
        }
      }
      const unflattenedBody = unflatten(body);
      const valid = validate(unflattenedBody);
      if (!valid) {
        const error = validate.errors![0];
        throw new InvalidRequestBodyError(`Property at ${error.instancePath} ${error.message}`);
      }
      context.body = unflattenedBody;
    },
    ...other,
  };
}

export function Body<T extends RestBodyContent<any>>(
  contents: T[],
  options?: BodyOptions,
): RestBody<T extends RestBodyContent<infer U> ? U : never> {
  const { description, required = true } = options ?? {};
  const _contents = unMaybeArray(contents);
  return {
    spec: {
      description,
      required,
      content: Object.fromEntries(
        _contents.map(({ contentType, validate, ...rest }) => [contentType, rest as any]),
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

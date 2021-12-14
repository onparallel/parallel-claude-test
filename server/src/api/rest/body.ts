import { isDefined } from "remeda";
import { RestBody } from "./core";
import { InvalidRequestBodyError } from "./errors";
import { buildValidateSchema, JsonSchemaFor } from "./schemas";

export interface JsonBodyOptions {
  description?: string;
  required?: boolean;
}

export function JsonBody<T>(schema: JsonSchemaFor<T>, options?: JsonBodyOptions): RestBody<T> {
  const { description, required = true } = options ?? {};
  const validate = buildValidateSchema(schema);
  return {
    spec: {
      description,
      required,
      content: {
        "application/json": { schema: schema as any },
      },
    },
    validate: (req, context) => {
      if (!isDefined(req.body)) {
        if (required) {
          throw new InvalidRequestBodyError("Body is missing but it is required");
        }
      } else {
        const valid = validate(req.body);
        if (!valid) {
          const error = validate.errors![0];
          throw new InvalidRequestBodyError(`Property at ${error.instancePath} ${error.message}`);
        }
      }
      context.body = req.body;
    },
  };
}

export function FormDataBody<T>(schema: JsonSchemaFor<T>, options?: JsonBodyOptions): RestBody<T> {
  const { description, required = true } = options ?? {};
  const validate = buildValidateSchema(schema);
  return {
    spec: {
      description,
      required,
      content: {
        "multipart/form-data": { schema: schema as any },
      },
    },
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

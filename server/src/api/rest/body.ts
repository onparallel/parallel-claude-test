import { outdent } from "outdent";
import { isDefined } from "../../util/remedaExtensions";
import { RestBody } from "./core";
import { InvalidRequestBodyError } from "./errors";
import { buildValidateSchema, JsonSchemaFor, documentSchema } from "./schemas";

export interface JsonBodyOptions {
  description?: string;
  required?: boolean;
}

export function JsonBody<T>(
  schema: JsonSchemaFor<T>,
  options?: JsonBodyOptions
): RestBody<T> {
  const { description, required = true } = options ?? {};
  const validate = buildValidateSchema(schema);
  return {
    spec: {
      description: description
        ? outdent`
        ${description}
        ${documentSchema(schema)}
      `
        : documentSchema(schema),
      required,
      content: {
        "application/json": { schema: schema as any },
      },
    },
    validate: (value: any) => {
      if (!isDefined(value)) {
        if (required) {
          throw new InvalidRequestBodyError(
            "Body is missing but it is required"
          );
        }
      } else {
        const valid = validate(value);
        if (!valid) {
          const error = validate.errors![0];
          throw new InvalidRequestBodyError(
            `Property at ${error.dataPath} ${error.message}`
          );
        }
      }
    },
  };
}

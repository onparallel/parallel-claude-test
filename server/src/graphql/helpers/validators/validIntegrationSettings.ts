import Ajv from "ajv";
import { core } from "nexus";
import { IntegrationSettings } from "../../../db/repositories/IntegrationRepository";
import { IntegrationType } from "../../../db/__types";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

const schema = {
  definitions: {
    root: {
      type: "object",
      anyOf: [
        { $ref: "#/definitions/signature" },
        { $ref: "#/definitions/sso" },
        { $ref: "#/definitions/userProvisioning" },
      ],
    },
    signature: {
      type: "object",
      additionalProperties: false,
      required: ["API_KEY"],
      properties: {
        API_KEY: { type: "string" },
        ENVIRONMENT: { enum: ["production", "sandbox"] },
        EN_FORMAL_BRANDING_ID: { type: ["string", "null"] },
        ES_FORMAL_BRANDING_ID: { type: ["string", "null"] },
        EN_INFORMAL_BRANDING_ID: { type: ["string", "null"] },
        ES_INFORMAL_BRANDING_ID: { type: ["string", "null"] },
      },
    },
    sso: {
      type: "object",
      additionalProperties: false,
      required: ["EMAIL_DOMAINS", "COGNITO_PROVIDER"],
      properties: {
        EMAIL_DOMAINS: { type: "array", items: { type: "string" } },
        COGNITO_PROVIDER: { type: "string" },
      },
    },
    userProvisioning: {
      type: "object",
      additionalProperties: false,
      required: ["AUTH_KEY"],
      properties: {
        AUTH_KEY: { type: "string" },
      },
    },
  },
  $ref: "#/definitions/root",
};

function validateIntegrationSettingsByType(type: IntegrationType, settings: any) {
  const validator = new Ajv();

  let validateFunction;
  if (type === "SIGNATURE") {
    validateFunction = validator.compile<IntegrationSettings<"SIGNATURE">>(
      schema.definitions.signature
    );
  } else if (type === "SSO") {
    validateFunction = validator.compile<IntegrationSettings<"SSO">>(schema.definitions.sso);
  } else if (type === "USER_PROVISIONING") {
    validateFunction = validator.compile<IntegrationSettings<"USER_PROVISIONING">>(
      schema.definitions.userProvisioning
    );
  } else {
    throw new Error(`Schema not defined for validating integration settings of type ${type}`);
  }

  if (!validateFunction(settings)) {
    throw new Error(JSON.stringify(validateFunction.errors));
  }
}

export function validIntegrationSettings<TypeName extends string, FieldName extends string>(
  integrationType: IntegrationType,
  settingsProp: (args: core.ArgsValue<TypeName, FieldName>) => any,
  argName: string
) {
  return ((root, args, ctx, info) => {
    try {
      const settings = settingsProp(args);
      validateIntegrationSettingsByType(integrationType, settings);
    } catch (e: any) {
      throw new ArgValidationError(info, argName, e.message);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

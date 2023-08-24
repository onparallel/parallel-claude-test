import { IntrospectionField, IntrospectionType } from "graphql";

export const supportMethods: {
  field: IntrospectionField;
  queryType: "mutation" | "query";
}[] = [
  {
    field: {
      name: "anonymizePetition",
      description: "Anonymizes a petition",
      args: [
        {
          name: "petitionId",
          description: null,
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "GID", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "mutation",
  },
  {
    field: {
      name: "exportPetitionToJson",
      description: "Exports basic petition + fields configuration as JSON object",
      args: [
        {
          name: "petitionId",
          description: null,
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "GID", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "query",
  },
  {
    field: {
      name: "forceUpdateSignatureOrganizationBrandings",
      description:
        "Forces an update of the branding of every signature integration of the selected organization.",
      args: [
        {
          name: "orgId",
          description: "Global ID of the Organization",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "GID", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "mutation",
  },
  {
    field: {
      name: "getApiTokenOwner",
      description: "Get the user who owns an API Token",
      args: [
        {
          name: "token",
          description: null,
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "String", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "query",
  },
  {
    field: {
      name: "globalIdDecode",
      description: "Decodes the given Global ID into an entity in the database.",
      args: [
        {
          name: "id",
          description: "Global ID to decode",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "ID", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "query",
  },
  {
    field: {
      name: "globalIdEncode",
      description: "Encodes the given ID into a Global ID.",
      args: [
        {
          name: "id",
          description: "ID to encode",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "String", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "type",
          description: "ID type",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "String", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "query",
  },
  {
    field: {
      name: "importPetitionFromJson",
      description: "Imports a petition from a JSON file",
      args: [
        {
          name: "json",
          description: "Petition to import in json format @form:type=textarea",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "String", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "userId",
          description: "Global ID of the user to assign this petition",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "GID", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "mutation",
  },
  {
    field: {
      name: "petitionInformation",
      description:
        "Returns information about a petition: The name of the organization and emails of users with access to the petition",
      args: [
        {
          name: "petitionId",
          description: null,
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "GID", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "query",
  },
  {
    field: {
      name: "removePetitionPassword",
      description: "Removes the password on a petition or template",
      args: [
        {
          name: "petitionId",
          description: null,
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "GID", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "mutation",
  },
  {
    field: {
      name: "resetUserPassword",
      description:
        "Resets the given user password on AWS Cognito and sends an email with new temporary.",
      args: [
        {
          name: "email",
          description: null,
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "String", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "locale",
          description: null,
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "ENUM", name: "UserLocale", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "mutation",
  },
  {
    field: {
      name: "restoreDeletedPetition",
      description: "Restores a deleted petition if it's not already anonymized.",
      args: [
        {
          name: "petitionId",
          description: null,
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "GID", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "mutation",
  },
  {
    field: {
      name: "signaturitIntegrationShowSecurityStamp",
      description: "Enables/disables security stamp on documents for Signaturit integrations.",
      args: [
        {
          name: "integrationId",
          description: "Numeric ID of the integration",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "Int", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "showCsv",
          description: "Enable CSV stamp",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "Boolean", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "mutation",
  },
  {
    field: {
      name: "transferOrganizationOwnership",
      description: "Transfers the ownership of an organization to a given user.",
      args: [
        {
          name: "orgId",
          description: "Global ID of the Organization",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "GID", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "userId",
          description: "Global ID of the new owner",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "GID", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "mutation",
  },
  {
    field: {
      name: "updateLandingTemplateMetadata",
      description: "Updates the metadata of a public landing template.",
      args: [
        {
          name: "backgroundColor",
          description: "for example: #A0FFCE",
          type: { kind: "SCALAR", name: "String", ofType: null },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "categories",
          description: "comma-separated list of categories",
          type: { kind: "SCALAR", name: "String", ofType: null },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "description",
          description: "short description for the template",
          type: { kind: "SCALAR", name: "String", ofType: null },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "image",
          description: null,
          type: { kind: "SCALAR", name: "Upload", ofType: null },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "slug",
          description: "must be URL-friendly",
          type: { kind: "SCALAR", name: "String", ofType: null },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "templateId",
          description: "Global ID of the template",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "GID", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "mutation",
  },
  {
    field: {
      name: "updateOrganizationTier",
      description: "Applies a given tier to the organization",
      args: [
        {
          name: "orgId",
          description: "Global ID of the Organization",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "GID", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "tier",
          description: "e.g.: FREE, APPSUMO1, APPSUMO2, APPSUMO3...",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "String", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "mutation",
  },
  {
    field: {
      name: "updatePublicTemplateVisibility",
      description: "Updates template_public from template",
      args: [
        {
          name: "isPublic",
          description: "Public visiblity of template",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "Boolean", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "templateId",
          description: "global ID of the template",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "GID", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "mutation",
  },
  {
    field: {
      name: "uploadUserAvatar",
      description: "Uploads a user avatar image",
      args: [
        {
          name: "image",
          description: null,
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "Upload", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "userId",
          description: "Global ID of the user",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "GID", ofType: null },
          },
          defaultValue: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      type: {
        kind: "NON_NULL",
        name: null,
        ofType: { kind: "OBJECT", name: "SupportMethodResponse", ofType: null },
      },
      isDeprecated: false,
      deprecationReason: null,
    },
    queryType: "mutation",
  },
] as any;

export const schemaTypes: IntrospectionType[] = [
  {
    kind: "OBJECT",
    name: "SupportMethodResponse",
    description: "Return type for all support methods",
    specifiedByURL: null,
    fields: [
      {
        name: "message",
        description: null,
        args: [],
        type: { kind: "SCALAR", name: "String", ofType: null },
        isDeprecated: false,
        deprecationReason: null,
      },
      {
        name: "result",
        description: null,
        args: [],
        type: {
          kind: "NON_NULL",
          name: null,
          ofType: { kind: "ENUM", name: "Result", ofType: null },
        },
        isDeprecated: false,
        deprecationReason: null,
      },
      {
        name: "type",
        description: null,
        args: [],
        type: { kind: "SCALAR", name: "String", ofType: null },
        isDeprecated: false,
        deprecationReason: null,
      },
    ],
    inputFields: null,
    interfaces: [],
    enumValues: null,
    possibleTypes: null,
  },
  {
    kind: "ENUM",
    name: "Result",
    description: "Represents the result of an operation.",
    specifiedByURL: null,
    fields: null,
    inputFields: null,
    interfaces: null,
    enumValues: [
      { name: "FAILURE", description: null, isDeprecated: false, deprecationReason: null },
      { name: "SUCCESS", description: null, isDeprecated: false, deprecationReason: null },
    ],
    possibleTypes: null,
  },
  {
    kind: "ENUM",
    name: "UserLocale",
    description: "The preferred locale for the user",
    specifiedByURL: null,
    fields: null,
    inputFields: null,
    interfaces: null,
    enumValues: [
      { name: "en", description: null, isDeprecated: false, deprecationReason: null },
      { name: "es", description: null, isDeprecated: false, deprecationReason: null },
    ],
    possibleTypes: null,
  },
] as any;

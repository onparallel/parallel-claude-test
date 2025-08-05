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
      name: "associateProfilesToPetitionsExcel",
      description:
        "Associates profiles to petitions from an excel file. First column must contain Profile ID, second column must contain Petition ID. Duplicated entries or existing associations will be ignored.",
      args: [
        {
          name: "file",
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
          name: "orgId",
          description: "Global ID of the organization",
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
      name: "closePetitionsFromTemplate",
      description:
        "Closes every parallel with status PENDING or COMPLETED that was created from the selected template. Parallels with ongoing signatures will NOT be closed.",
      args: [
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
      name: "createAnthropicCompletionIntegration",
      description: "Creates a new Anthropic AI Completion integration on the provided organization",
      args: [
        {
          name: "model",
          description:
            "e.g. claude-3-5-haiku-20241022; claude-3-7-sonnet-20250219; claude-3-5-sonnet-20241022",
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
          name: "orgId",
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
      name: "createAzureOpenAiIntegration",
      description: "Creates a new Azure OpenAI integration on the provided organization",
      args: [
        {
          name: "apiKey",
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
          name: "endpoint",
          description: "https://<resource name>.openai.azure.com/",
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
          name: "orgId",
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
      name: "createBankflipDocumentProcessingIntegration",
      description:
        "Creates a new Bankflip Document Processing integration on the provided organization",
      args: [
        {
          name: "apiKey",
          description: "Bankflip Account API KEY",
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
          name: "host",
          description: "e.g. https://core.bankflip.io",
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
          name: "orgId",
          description: "e.g. yw7RQt2cQ4XDHdrbtL3",
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
          name: "webhookSecret",
          description: "Secret for webhook verification",
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
      name: "createBankflipIdVerificationIntegration",
      description:
        "Creates a new Bankflip ID Verification integration on the provided organization",
      args: [
        {
          name: "apiKey",
          description: "Bankflip Account API KEY",
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
          name: "host",
          description: "e.g. https://core.bankflip.io",
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
          name: "orgId",
          description: "e.g. yw7RQt2cQ4XDHdrbtL3",
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
          name: "webhookSecret",
          description: "Secret for webhook verification",
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
      name: "createCompaniesHouseProfileExternalSourceIntegration",
      description:
        "Creates a new Companies House Profile External Source integration on the provided organization, or updates it if the organization already has one.",
      args: [
        {
          name: "apiKey",
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
          name: "orgId",
          description: "e.g. yw7RQt2cQ4XDHdrbtL3",
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
      name: "createEInformaProfileExternalSourceIntegration",
      description:
        "Creates a new eInforma Profile External Source integration on the provided organization, or updates it if the organization already has one.",
      args: [
        {
          name: "clientId",
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
          name: "clientSecret",
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
          name: "isPaidSubscription",
          description: "Paid subscription will allow to access real data for entity details",
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
          name: "orgId",
          description: "e.g. yw7RQt2cQ4XDHdrbtL3",
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
      name: "createIManageFileExportIntegration",
      description: "Creates a new iManage File Export integration on the provided organization",
      args: [
        {
          name: "clientId",
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
          name: "orgId",
          description: "e.g. yw7RQt2cQ4XDHdrbtL3",
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
      name: "createProfileRelationshipsExcel",
      description:
        "Creates relationships between profiles from an excel file. 1st and 2nd columns must be Profile IDs, 3rd column is the relationship alias. Direction is inferred from the profile IDs order.",
      args: [
        {
          name: "file",
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
          name: "orgId",
          description: "Global ID of the organization",
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
      name: "deleteAzureOpenAiIntegration",
      description: "Removes the Azure OpenAI integration of the user's organization",
      args: [
        {
          name: "id",
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
          description: "Numeric or global ID of the petition",
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
      name: "transferAdminPermissions",
      description:
        'Creates an "Admins" team on the organization and removes Admin-only permissions from "All Users". Org owner will be added to "Admins" team.',
      args: [
        {
          name: "organizationId",
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
      name: "updateBackgroundCheckOrganizationCutoff",
      description: "Updates the cutoff for the background check service",
      args: [
        {
          name: "cutoff",
          description: "Cutoff value between 0 and 1",
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
          name: "orgId",
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
      name: "updateCompaniesHouseCustomProperties",
      description: null,
      args: [
        {
          name: "json",
          description:
            "{[profileTypeId: number]: {[profileTypeFieldId: number]: string }} @form:type=textarea",
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
          name: "orgId",
          description: "e.g. yw7RQt2cQ4XDHdrbtL3",
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
      name: "updateEinformaCustomProperties",
      description: null,
      args: [
        {
          name: "json",
          description:
            "{[profileTypeId: number]: {[profileTypeFieldId: number]: string }} @form:type=textarea",
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
          name: "orgId",
          description: "e.g. yw7RQt2cQ4XDHdrbtL3",
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
      name: "updateStandardListDefinitions",
      description: "Updates the standard list definitions with values defined in excel file",
      args: [
        {
          name: "file",
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
    isOneOf: null,
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
    isOneOf: null,
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
    isOneOf: null,
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

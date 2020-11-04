import { IntrospectionField, IntrospectionType } from "graphql";

export const supportMethods: {
  field: IntrospectionField;
  queryType: "mutation" | "query";
}[] = [
  {
    field: {
      name: "assignPetitionToUser",
      description:
        "Clones the petition and assigns the given user as owner and creator.",
      args: [
        {
          name: "petitionId",
          description: "Global ID of the petition",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "ID", ofType: null },
          },
          defaultValue: null,
        },
        {
          name: "userId",
          description: "ID of the user",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "Int", ofType: null },
          },
          defaultValue: null,
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
      name: "createOrganization",
      description: "Creates a new organization.",
      args: [
        {
          name: "identifier",
          description: "Identifier of the organization",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "String", ofType: null },
          },
          defaultValue: null,
        },
        {
          name: "name",
          description: "Name of the organization",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "String", ofType: null },
          },
          defaultValue: null,
        },
        {
          name: "status",
          description: null,
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "ENUM", name: "OrganizationStatus", ofType: null },
          },
          defaultValue: null,
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
      name: "createUser",
      description: "Creates a new user in the specified organization.",
      args: [
        {
          name: "email",
          description: "Email of the user",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "String", ofType: null },
          },
          defaultValue: null,
        },
        {
          name: "firstName",
          description: "First name of the user",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "String", ofType: null },
          },
          defaultValue: null,
        },
        {
          name: "lastName",
          description: "Last name of the user",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "String", ofType: null },
          },
          defaultValue: null,
        },
        {
          name: "organizationId",
          description: "ID of the organization",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "Int", ofType: null },
          },
          defaultValue: null,
        },
        {
          name: "password",
          description: "Temporary of the user",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "String", ofType: null },
          },
          defaultValue: null,
        },
        {
          name: "role",
          description: "Role of the user",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "ENUM", name: "OrganizationRole", ofType: null },
          },
          defaultValue: null,
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
      name: "deletePetition",
      description: "Soft-deletes any given petition on the database.",
      args: [
        {
          name: "petitionId",
          description: "Global ID of the petition",
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "SCALAR", name: "ID", ofType: null },
          },
          defaultValue: null,
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
      name: "globalIdDecode",
      description:
        "Decodes the given Global ID into an entity in the database.",
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
            ofType: { kind: "SCALAR", name: "Int", ofType: null },
          },
          defaultValue: null,
        },
        {
          name: "type",
          description: null,
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: { kind: "ENUM", name: "EntityType", ofType: null },
          },
          defaultValue: null,
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
] as any;

export const schemaTypes: IntrospectionType[] = [
  {
    kind: "OBJECT",
    name: "SupportMethodResponse",
    description: "Return type for all support methods",
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
    fields: null,
    inputFields: null,
    interfaces: null,
    enumValues: [
      {
        name: "FAILURE",
        description: null,
        isDeprecated: false,
        deprecationReason: null,
      },
      {
        name: "SUCCESS",
        description: null,
        isDeprecated: false,
        deprecationReason: null,
      },
    ],
    possibleTypes: null,
  },
  {
    kind: "ENUM",
    name: "OrganizationStatus",
    description: "The status of the organization.",
    fields: null,
    inputFields: null,
    interfaces: null,
    enumValues: [
      {
        name: "ACTIVE",
        description: "Used for regular clients",
        isDeprecated: false,
        deprecationReason: null,
      },
      {
        name: "CHURNED",
        description: "Used on churned clients",
        isDeprecated: false,
        deprecationReason: null,
      },
      {
        name: "DEMO",
        description: "Used for demoing the product",
        isDeprecated: false,
        deprecationReason: null,
      },
      {
        name: "DEV",
        description: "Used for development or testing purposes",
        isDeprecated: false,
        deprecationReason: null,
      },
    ],
    possibleTypes: null,
  },
  {
    kind: "ENUM",
    name: "OrganizationRole",
    description: "The roles of a user within an organization.",
    fields: null,
    inputFields: null,
    interfaces: null,
    enumValues: [
      {
        name: "ADMIN",
        description: null,
        isDeprecated: false,
        deprecationReason: null,
      },
      {
        name: "NORMAL",
        description: null,
        isDeprecated: false,
        deprecationReason: null,
      },
    ],
    possibleTypes: null,
  },
  {
    kind: "ENUM",
    name: "EntityType",
    description: null,
    fields: null,
    inputFields: null,
    interfaces: null,
    enumValues: [
      {
        name: "Contact",
        description: null,
        isDeprecated: false,
        deprecationReason: null,
      },
      {
        name: "Organization",
        description: null,
        isDeprecated: false,
        deprecationReason: null,
      },
      {
        name: "Petition",
        description: null,
        isDeprecated: false,
        deprecationReason: null,
      },
      {
        name: "User",
        description: null,
        isDeprecated: false,
        deprecationReason: null,
      },
    ],
    possibleTypes: null,
  },
] as any;

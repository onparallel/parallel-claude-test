import {
  SapEntityMapping,
  SapEntityRelationshipMapping,
  SapEntitySetFilter,
  SapProfileSyncIntegrationSettings,
} from "./types";

interface BusinessPartnerMappedProfileTypeFieldIds {
  name: number;
  email: number;
  phone: number;
  externalId: number;
  relationship: number;
  addressId: number;
  clientPartner: number;
  clientStatus: number;
  city: number;
  postalCode: number;
  country: number;
  taxNumber: number;
  isNewClient: number;
  entityType?: number;
  nonFaceToFaceCustomer: number;
  language: number;
  activity: number;
  kycRefreshDate: number;
  kycStartDate: number;
  prescoringRisk: number;
  globalRisk: number;
  risk: number;
}

export function getOsborneSapSettings({
  individualProfileTypeId,
  individualProfileTypeFieldIds,
  legalEntityProfileTypeId,
  legalEntityProfileTypeFieldIds,
  matterProfileTypeId,
  matterProfileTypeFieldIds,
  clientMatterRelationshipTypeId,
  businessPartnerFilter,
  projectFilter,
}: {
  individualProfileTypeId: number;
  individualProfileTypeFieldIds: BusinessPartnerMappedProfileTypeFieldIds;
  legalEntityProfileTypeId: number;
  legalEntityProfileTypeFieldIds: BusinessPartnerMappedProfileTypeFieldIds;
  matterProfileTypeId: number;
  matterProfileTypeFieldIds: {
    projectId: number;
    matterName: number;
    matterDescription: number;
    matterStatus: number;
    matterSupervisor: number;
    practiceGroup: number;
    subpracticeGroup: number;
    amlSubjectMatters: number;
    transactionVolume: number;
    countriesInvolved: number;
    matterRisk: number;
    tempActiveUntil: number;
  };
  clientMatterRelationshipTypeId: number;
  businessPartnerFilter?: SapEntitySetFilter;
  projectFilter?: SapEntitySetFilter;
}): SapProfileSyncIntegrationSettings {
  const [user, password] = process.env.OSBORNE_CREDENTIALS!.split(":");
  return {
    baseUrl: "https://my303668-api.s4hana.ondemand.com/sap/opu/odata",
    additionalHeaders: {
      "sap-language": "es",
    },
    authorization: {
      type: "BASIC",
      user,
      password,
    },
    mappings: [
      ...[
        {
          name: "Individual",
          profileTypeId: individualProfileTypeId,
          profileTypeFieldIds: individualProfileTypeFieldIds,
          isNaturalPerson: true,
        },
        {
          name: "Legal Entity",
          profileTypeId: legalEntityProfileTypeId,
          profileTypeFieldIds: legalEntityProfileTypeFieldIds,
          isNaturalPerson: false,
        },
      ].map(
        ({ name, profileTypeId, profileTypeFieldIds, isNaturalPerson }) =>
          ({
            name: `Business Partner to ${name}`,
            entityDefinition: {
              servicePath: "sap/API_BUSINESS_PARTNER",
              serviceNamespace: "API_BUSINESS_PARTNER",
              entitySetName: "A_BusinessPartner",
              remoteEntityKey: ["BusinessPartner"],
            },
            profileTypeId: profileTypeId,
            remoteEntityKeyBinding: {
              profileTypeFieldIds: [profileTypeFieldIds.externalId],
            },
            localIdBinding: {
              remoteEntityFields: ["YY1_bp_id_Parallel_bus", "YY1_bp_Link_Parallel_bus"],
              toRemoteTransforms: [
                { type: "REPEAT", times: 2 },
                {
                  type: "AT",
                  index: [1],
                  transforms: [
                    { type: "PREPEND", value: "https://www.onparallel.com/app/profiles/" },
                  ],
                },
              ],
            },
            filter: {
              operator: "and",
              conditions: [
                {
                  left: { type: "property", name: "IsNaturalPerson" },
                  operator: "eq",
                  right: { type: "literal", value: isNaturalPerson ? "'X'" : "''" },
                },
                // fetch only bp that are customers
                {
                  left: { type: "property", name: "Customer" },
                  operator: "ne",
                  right: { type: "literal", value: "null" },
                },
                ...(businessPartnerFilter ? [businessPartnerFilter] : []),
              ],
            },
            initialSyncOrderBy: [
              ["CreationDate", "asc"],
              ["CreationTime", "asc"],
              ["BusinessPartnerUUID", "asc"],
            ],
            changeDetection: {
              type: "POLLING",
              remoteLastChange: {
                type: "DATETIME_TIME",
                fields: ["LastChangeDate", "LastChangeTime"],
              },
            },
            fieldMappings: [
              {
                remoteEntityFields: ["OrganizationBPName1"],
                profileTypeFieldIds: [profileTypeFieldIds.name],
                direction: "TO_LOCAL",
              },
              {
                remoteEntityFields: ["YY1_AMT_CLIENT_STATUS_bus"],
                profileTypeFieldIds: [profileTypeFieldIds.clientStatus],
                direction: "BOTH",
                toLocalTransforms: [
                  { type: "IGNORE_IF", value: "" },
                  { type: "PREPEND", value: "_" },
                ],
                toRemoteTransforms: [{ type: "REGEX_REPLACE", pattern: "^_", replacement: "" }],
              },
              {
                remoteEntityFields: ["YY1_bp_is_new_client_bus"],
                profileTypeFieldIds: [profileTypeFieldIds.isNewClient],
                direction: "BOTH",
                toLocalTransforms: [
                  { type: "COERCE", to: "string" },
                  {
                    type: "MAP",
                    map: [
                      { from: "true", to: "YES" },
                      { from: "false", to: "NO" },
                    ],
                  },
                ],
                toRemoteTransforms: [
                  {
                    type: "MAP",
                    map: [
                      { from: "YES", to: "true" },
                      { from: "NO", to: "false" },
                    ],
                  },
                  { type: "COERCE", to: "boolean" },
                ],
              },
              {
                remoteEntityFields: ["YY1_bp_activity_bus"],
                profileTypeFieldIds: [profileTypeFieldIds.activity],
                direction: "BOTH",
                toLocalTransforms: [
                  { type: "IGNORE_IF", value: "" },
                  { type: "PREPEND", value: "_" },
                ],
                toRemoteTransforms: [{ type: "REGEX_REPLACE", pattern: "^_", replacement: "" }],
              },
              {
                remoteEntityFields: ["YY1_bp_kyc_refresh_dat_bus"],
                profileTypeFieldIds: [profileTypeFieldIds.kycRefreshDate],
                direction: "TO_REMOTE",
                toLocalTransforms: [{ type: "SAP_DATETIME_TO_DATE" }],
                toRemoteTransforms: [{ type: "DATE_TO_SAP_DATETIME" }],
              },
              ...[
                ["YY1_bp_prescoring_risk_bus", profileTypeFieldIds.prescoringRisk],
                ["YY1_bp_global_risk_bus", profileTypeFieldIds.globalRisk],
                ["YY1_bp_risk_bus", profileTypeFieldIds.risk],
              ].map(([field, profileTypeFieldId]) => ({
                remoteEntityFields: [field],
                profileTypeFieldIds: [profileTypeFieldId],
                direction: "TO_REMOTE",
                toLocalTransforms: [
                  { type: "IGNORE_IF", value: "" },
                  {
                    type: "MAP",
                    map: [
                      { from: "01", to: "LOW" },
                      { from: "02", to: "MEDIUM" },
                      { from: "03", to: "HIGH" },
                    ],
                  },
                ],
                toRemoteTransforms: [
                  {
                    type: "MAP",
                    map: [
                      { from: "LOW", to: "01" },
                      { from: "MEDIUM", to: "02" },
                      { from: "HIGH", to: "03" },
                    ],
                  },
                ],
              })),
              {
                remoteEntityFields: ["YY1_bp_kyc_integration_bus"],
                profileTypeFieldIds: [profileTypeFieldIds.kycStartDate],
                direction: "TO_REMOTE",
                toLocalTransforms: [{ type: "SAP_DATETIME_TO_DATE" }],
                toRemoteTransforms: [{ type: "DATE_TO_SAP_DATETIME" }],
              },
              ...(isNaturalPerson
                ? []
                : [
                    {
                      remoteEntityFields: ["YY1_bp_entity_type_bus"],
                      profileTypeFieldIds: [profileTypeFieldIds.entityType],
                      direction: "BOTH",
                      toLocalTransforms: [
                        { type: "IGNORE_IF", value: "" },
                        {
                          type: "MAP",
                          default: "SAME", // SAP had a short character limit for the code
                          map: [
                            { from: "LLC", to: "LIMITED_LIABILITY_COMPANY" },
                            { from: "LLP", to: "LIMITED_LIABILITY_PARTNERSHIP" },
                          ],
                        },
                      ],
                      toRemoteTransforms: [
                        {
                          type: "MAP",
                          default: "SAME",
                          map: [
                            { from: "LIMITED_LIABILITY_COMPANY", to: "LLC" },
                            { from: "LIMITED_LIABILITY_PARTNERSHIP", to: "LLP" },
                          ],
                        },
                      ],
                    },
                  ]),
            ],
            relationshipMappings: [
              {
                name: "to_BusinessPartnerAddress",
                syncStrategy: {
                  type: "EMBED_INTO_PARENT",
                  fieldMappings: [
                    {
                      remoteEntityFields: ["StreetName"],
                      profileTypeFieldIds: [profileTypeFieldIds.addressId],
                      direction: "BOTH",
                    },
                    {
                      remoteEntityFields: ["CityName"],
                      profileTypeFieldIds: [profileTypeFieldIds.city],
                      direction: "BOTH",
                    },
                    {
                      remoteEntityFields: ["PostalCode"],
                      profileTypeFieldIds: [profileTypeFieldIds.postalCode],
                      direction: "BOTH",
                    },
                    {
                      remoteEntityFields: ["Country"],
                      profileTypeFieldIds: [profileTypeFieldIds.country],
                      direction: "BOTH",
                    },
                    {
                      remoteEntityFields: ["Language"],
                      profileTypeFieldIds: [profileTypeFieldIds.language],
                      direction: "TO_LOCAL",
                      toLocalTransforms: [{ type: "IGNORE_IF", value: "" }],
                    },
                  ],
                  relationshipMappings: [
                    {
                      name: "to_EmailAddress",
                      syncStrategy: {
                        type: "EMBED_INTO_PARENT",
                        multipleCardinalitySelector: "$[?(@.IsDefaultEmailAddress == true)]",
                        multipleCardinalitySelectorDependencies: ["IsDefaultEmailAddress"],
                        fieldMappings: [
                          {
                            remoteEntityFields: ["EmailAddress"],
                            profileTypeFieldIds: [profileTypeFieldIds.email],
                            direction: "BOTH",
                          },
                        ],
                      },
                      fetchStrategy: {
                        type: "FROM_NAVIGATION_PROPERTY",
                        expectedCardinality: "MANY",
                        navigationProperty: "to_EmailAddress",
                        entityDefinition: {
                          servicePath: "sap/API_BUSINESS_PARTNER",
                          serviceNamespace: "API_BUSINESS_PARTNER",
                          entitySetName: "A_AddressEmailAddress",
                          remoteEntityKey: ["AddressID", "Person", "OrdinalNumber"],
                        },
                      },
                    },
                    {
                      name: "to_PhoneNumber",
                      syncStrategy: {
                        type: "EMBED_INTO_PARENT",
                        multipleCardinalitySelector: "$[?(@.IsDefaultPhoneNumber == true)]",
                        multipleCardinalitySelectorDependencies: ["IsDefaultPhoneNumber"],
                        fieldMappings: [
                          {
                            remoteEntityFields: ["InternationalPhoneNumber"],
                            profileTypeFieldIds: [profileTypeFieldIds.phone],
                            direction: "TO_LOCAL",
                          },
                          {
                            remoteEntityFields: ["PhoneNumber", "DestinationLocationCountry"],
                            profileTypeFieldIds: [profileTypeFieldIds.phone],
                            direction: "TO_REMOTE",
                            toRemoteTransforms: [{ type: "PARSE_INT_PHONE_NUMBER" }],
                          },
                        ],
                      },
                      fetchStrategy: {
                        type: "FROM_NAVIGATION_PROPERTY",
                        expectedCardinality: "MANY",
                        navigationProperty: "to_PhoneNumber",
                        entityDefinition: {
                          servicePath: "sap/API_BUSINESS_PARTNER",
                          serviceNamespace: "API_BUSINESS_PARTNER",
                          entitySetName: "A_AddressPhoneNumber",
                          remoteEntityKey: ["AddressID", "Person", "OrdinalNumber"],
                        },
                      },
                    },
                  ],
                },
                fetchStrategy: {
                  type: "FROM_NAVIGATION_PROPERTY",
                  expectedCardinality: "MANY",
                  navigationProperty: "to_BusinessPartnerAddress",
                  entityDefinition: {
                    servicePath: "sap/API_BUSINESS_PARTNER",
                    serviceNamespace: "API_BUSINESS_PARTNER",
                    entitySetName: "A_BusinessPartnerAddress",
                    remoteEntityKey: ["BusinessPartner", "AddressID"],
                  },
                },
              },
              {
                name: "to_BusinessPartnerTax",
                syncStrategy: {
                  type: "EMBED_INTO_PARENT",
                  fieldMappings: [
                    {
                      remoteEntityFields: ["BPTaxNumber"],
                      profileTypeFieldIds: [profileTypeFieldIds.taxNumber],
                      direction: "TO_LOCAL",
                    },
                  ],
                },
                fetchStrategy: {
                  type: "FROM_NAVIGATION_PROPERTY",
                  expectedCardinality: "MANY",
                  navigationProperty: "to_BusinessPartnerTax",
                  entityDefinition: {
                    servicePath: "sap/API_BUSINESS_PARTNER",
                    serviceNamespace: "API_BUSINESS_PARTNER",
                    entitySetName: "A_BusinessPartnerTaxNumber",
                    remoteEntityKey: ["BusinessPartner", "BPTaxType"],
                  },
                },
              },
              {
                name: "to_Customer",
                syncStrategy: {
                  type: "EMBED_INTO_PARENT",
                  fieldMappings: [
                    {
                      remoteEntityFields: ["YY1_NoPresentialCustom_cus"],
                      profileTypeFieldIds: [profileTypeFieldIds.nonFaceToFaceCustomer],
                      direction: "TO_LOCAL",
                      toLocalTransforms: [
                        { type: "COERCE", to: "string" },
                        {
                          type: "MAP",
                          map: [
                            { from: "true", to: "YES" },
                            { from: "false", to: "NO" },
                          ],
                        },
                      ],
                    },
                  ],
                  relationshipMappings: [
                    {
                      name: "fetch Client Partner ID",
                      syncStrategy: {
                        type: "EMBED_INTO_PARENT",
                        relationshipMappings: [
                          {
                            name: "Client Partner",
                            syncStrategy: {
                              type: "EMBED_INTO_PARENT",
                              fieldMappings: [
                                {
                                  remoteEntityFields: ["DefaultEmailAddress"],
                                  profileTypeFieldIds: [profileTypeFieldIds.clientPartner],
                                  direction: "TO_LOCAL",
                                  toLocalTransforms: [{ type: "IGNORE_IF", value: "" }],
                                },
                              ],
                            },
                            fetchStrategy: {
                              type: "FROM_ENTITY",
                              entityDefinition: {
                                servicePath: "sap/YY1_PARALLEL_BP_PERSONNELN_CDS",
                                serviceNamespace: "YY1_PARALLEL_BP_PERSONNELN_CDS",
                                entitySetName: "YY1_Parallel_BP_PersonnelN",
                                remoteEntityKey: ["Person"],
                              },
                              key: {
                                Person: {
                                  entityFields: ["BusinessPartner"],
                                },
                              },
                            },
                          },
                        ],
                      },
                      fetchStrategy: {
                        type: "FROM_ENTITY_SET",
                        entityDefinition: {
                          servicePath: "sap/API_BUSINESS_PARTNER",
                          serviceNamespace: "API_BUSINESS_PARTNER",
                          entitySetName: "A_BuPaIdentification",
                          remoteEntityKey: [
                            "BusinessPartner",
                            "BPIdentificationType",
                            "BPIdentificationNumber",
                          ],
                        },
                        filter: {
                          operator: "and",
                          conditions: [
                            {
                              left: { type: "property", name: "BPIdentificationType" },
                              operator: "eq",
                              right: { type: "literal", value: "'HCM032'" },
                            },
                            {
                              left: { type: "property", name: "BPIdentificationNumber" },
                              operator: "eq",
                              right: { type: "literal", value: "'{{clientPartnerId}}'" },
                            },
                          ],
                        },
                        filterParams: {
                          clientPartnerId: {
                            entityFields: ["YY1_ClientPartnerNum_cus"],
                          },
                        },
                      },
                    },
                  ],
                },
                fetchStrategy: {
                  type: "FROM_NAVIGATION_PROPERTY",
                  expectedCardinality: "ONE",
                  navigationProperty: "to_Customer",
                  entityDefinition: {
                    servicePath: "sap/API_BUSINESS_PARTNER",
                    serviceNamespace: "API_BUSINESS_PARTNER",
                    entitySetName: "A_Customer",
                    remoteEntityKey: ["Customer"],
                  },
                },
              },
              {
                name: "projects",
                syncStrategy: {
                  type: "REPLICATE_RELATIONSHIP",
                  profileRelationshipTypeId: clientMatterRelationshipTypeId,
                  parentProfileRelationshipSide: "LEFT",
                  entityMappingIndex: 2,
                  missingRemoteRelationshipStrategy: "IGNORE",
                },
                fetchStrategy: {
                  type: "FROM_ENTITY_SET",
                  entityDefinition: {
                    servicePath: "CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV",
                    serviceNamespace: "CPD.SC_PROJ_ENGMT_CREATE_UPD_SRV",
                    entitySetName: "ProjectSet",
                    remoteEntityKey: ["ProjectID"],
                  },
                  filter: {
                    operator: "and",
                    conditions: [
                      {
                        left: { type: "property", name: "Customer" },
                        operator: "eq",
                        right: { type: "literal", value: "'{{businessPartnerId}}'" },
                      },
                      ...(projectFilter ? [projectFilter] : []),
                    ],
                  },
                  filterParams: {
                    businessPartnerId: {
                      entityFields: ["BusinessPartner"],
                    },
                  },
                },
              },
            ],
          }) as SapEntityMapping,
      ),
      {
        name: "Projects to Matters",
        entityDefinition: {
          servicePath: "CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV",
          serviceNamespace: "CPD.SC_PROJ_ENGMT_CREATE_UPD_SRV",
          entitySetName: "ProjectSet",
          remoteEntityKey: ["ProjectID"],
        },
        remoteEntityKeyBinding: {
          profileTypeFieldIds: [matterProfileTypeFieldIds.projectId],
        },
        localIdBinding: {
          remoteEntityFields: ["YY1_EP_id_Parallel_Cpr"],
        },
        profileTypeId: matterProfileTypeId,
        initialSyncOrderBy: [
          ["CreatedOn", "asc"],
          ["ProjectID", "asc"],
        ],
        changeDetection: {
          type: "POLLING",
          remoteLastChange: {
            type: "DATETIME_OFFSET",
            field: "ChangedOn",
          },
        },
        filter: projectFilter,
        fieldMappings: [
          {
            remoteEntityFields: ["ProjectName"],
            profileTypeFieldIds: [matterProfileTypeFieldIds.matterName],
            direction: "TO_LOCAL",
            toLocalTransforms: [{ type: "REGEX_REPLACE", pattern: "(\r?\n)+$", replacement: "" }],
          },
          {
            remoteEntityFields: ["ProjectDesc"],
            profileTypeFieldIds: [matterProfileTypeFieldIds.matterDescription],
            direction: "BOTH",
          },
          {
            remoteEntityFields: ["YY1_PRACTICEGROUP_Cpr"],
            profileTypeFieldIds: [matterProfileTypeFieldIds.practiceGroup],
            direction: "TO_LOCAL",
            toLocalTransforms: [
              { type: "IGNORE_IF", value: "" },
              { type: "PREPEND", value: "_" },
            ],
            toRemoteTransforms: [{ type: "REGEX_REPLACE", pattern: "^_", replacement: "" }],
          },
          {
            remoteEntityFields: ["YY1_SubPracticeGroup_Cpr"],
            profileTypeFieldIds: [matterProfileTypeFieldIds.subpracticeGroup],
            direction: "TO_LOCAL",
            toLocalTransforms: [
              { type: "IGNORE_IF", value: "" },
              { type: "PREPEND", value: "_" },
            ],
            toRemoteTransforms: [{ type: "REGEX_REPLACE", pattern: "^_", replacement: "" }],
          },
          {
            remoteEntityFields: ["YY1_EP_matter_status_Cpr"],
            profileTypeFieldIds: [matterProfileTypeFieldIds.matterStatus],
            direction: "BOTH",
            toLocalTransforms: [
              { type: "IGNORE_IF", value: "" },
              { type: "PREPEND", value: "_" },
            ],
            toRemoteTransforms: [{ type: "REGEX_REPLACE", pattern: "^_", replacement: "" }],
          },
          {
            remoteEntityFields: ["YY1_EP_aml_subject_ma_Cpr"],
            profileTypeFieldIds: [matterProfileTypeFieldIds.amlSubjectMatters],
            direction: "BOTH",
            toLocalTransforms: [
              { type: "IGNORE_IF", value: "" },
              { type: "REGEX_REPLACE", pattern: "^\\[(.*)\\]$", replacement: "$1" },
              { type: "SPLIT", separator: "," },
              { type: "PREPEND", value: "_" },
              { type: "WRAP_IN_ARRAY" },
              { type: "IGNORE_IF_EMPTY_ARRAY" },
            ],
            toRemoteTransforms: [
              { type: "FLATTEN_ARRAY" },
              { type: "REGEX_REPLACE", pattern: "^_", replacement: "" },
              { type: "TAKE", count: 10 },
              { type: "JOIN", separator: "," },
              { type: "REGEX_REPLACE", pattern: "^(.*)$", replacement: "[$1]" },
            ],
          },
          {
            remoteEntityFields: ["YY1_EP_transaction_vo_Cpr"],
            profileTypeFieldIds: [matterProfileTypeFieldIds.transactionVolume],
            direction: "TO_LOCAL",
            toLocalTransforms: [
              { type: "IGNORE_IF", value: "" },
              { type: "PREPEND", value: "_" },
            ],
            toRemoteTransforms: [{ type: "REGEX_REPLACE", pattern: "^_", replacement: "" }],
          },
          {
            remoteEntityFields: ["YY1_EP_countries_invo_Cpr"],
            profileTypeFieldIds: [matterProfileTypeFieldIds.countriesInvolved],
            direction: "BOTH",
            toLocalTransforms: [
              { type: "IGNORE_IF", value: "" },
              { type: "REGEX_REPLACE", pattern: "^\\[(.*)\\]$", replacement: "$1" },
              { type: "SPLIT", separator: "," },
              { type: "WRAP_IN_ARRAY" },
              { type: "IGNORE_IF_EMPTY_ARRAY" },
            ],
            toRemoteTransforms: [
              { type: "FLATTEN_ARRAY" },
              { type: "TAKE", count: 10 },
              { type: "JOIN", separator: "," },
              { type: "REGEX_REPLACE", pattern: "^(.*)$", replacement: "[$1]" },
            ],
          },
          {
            remoteEntityFields: ["YY1_EP_matter_risk_Cpr"],
            profileTypeFieldIds: [matterProfileTypeFieldIds.matterRisk],
            direction: "TO_REMOTE",
            toLocalTransforms: [
              { type: "IGNORE_IF", value: "" },
              {
                type: "MAP",
                map: [
                  { from: "02", to: "MEDIUM" },
                  { from: "03", to: "HIGH" },
                ],
              },
            ],
            toRemoteTransforms: [
              {
                type: "MAP",
                map: [
                  { from: "MEDIUM", to: "02" },
                  { from: "HIGH", to: "03" },
                ],
              },
            ],
          },
          {
            remoteEntityFields: ["YY1_EP_temp_active_unt_Cpr"],
            profileTypeFieldIds: [matterProfileTypeFieldIds.tempActiveUntil],
            direction: "TO_REMOTE",
            toLocalTransforms: [{ type: "SAP_DATETIME_TO_DATE" }],
            toRemoteTransforms: [{ type: "DATE_TO_SAP_DATETIME" }],
          },
        ],
        // We need to fetch BusinessPartner twice, once as an individual and once as a legal entity, because we need to know
        // what kind the business partner is to know which profile type to use in Parallel
        relationshipMappings: [
          ...[
            {
              name: "BusinessPartner (Individual)",
              isNaturalPerson: true,
            },
            {
              name: "BusinessPartner (Legal Entity)",
              isNaturalPerson: false,
            },
          ].map(
            ({ name, isNaturalPerson }, index) =>
              ({
                name,
                syncStrategy: {
                  type: "REPLICATE_RELATIONSHIP",
                  profileRelationshipTypeId: clientMatterRelationshipTypeId,
                  parentProfileRelationshipSide: "RIGHT",
                  entityMappingIndex: index,
                  missingRemoteRelationshipStrategy: "IGNORE",
                },
                fetchStrategy: {
                  type: "FROM_ENTITY_SET",
                  entityDefinition: {
                    servicePath: "sap/API_BUSINESS_PARTNER",
                    serviceNamespace: "API_BUSINESS_PARTNER",
                    entitySetName: "A_BusinessPartner",
                    remoteEntityKey: ["BusinessPartner"],
                  },
                  filter: {
                    operator: "and",
                    conditions: [
                      {
                        left: { type: "property", name: "IsNaturalPerson" },
                        operator: "eq",
                        right: { type: "literal", value: isNaturalPerson ? "'X'" : "''" },
                      },
                      {
                        left: { type: "property", name: "BusinessPartner" },
                        operator: "eq",
                        right: { type: "literal", value: "'{{businessPartnerId}}'" },
                      },
                    ],
                  },
                  filterParams: {
                    businessPartnerId: {
                      entityFields: ["Customer"],
                    },
                  },
                },
              }) as SapEntityRelationshipMapping,
          ),
          {
            name: "Matter supervisor",
            syncStrategy: {
              type: "EMBED_INTO_PARENT",
              fieldMappings: [
                {
                  remoteEntityFields: ["DefaultEmailAddress"],
                  profileTypeFieldIds: [matterProfileTypeFieldIds.matterSupervisor],
                  direction: "TO_LOCAL",
                  toLocalTransforms: [{ type: "IGNORE_IF", value: "" }],
                },
              ],
            },
            fetchStrategy: {
              type: "FROM_ENTITY_SET",
              entityDefinition: {
                servicePath: "sap/YY1_PARALLEL_BP_PERSONNELN_CDS",
                serviceNamespace: "YY1_PARALLEL_BP_PERSONNELN_CDS",
                entitySetName: "YY1_Parallel_BP_PersonnelN",
                remoteEntityKey: ["Person"],
              },
              filter: {
                left: { type: "property", name: "PersonExternalID" },
                operator: "eq",
                right: { type: "literal", value: "'{{matterSupervisorExternalId}}'" },
              },
              filterParams: {
                matterSupervisorExternalId: {
                  entityFields: ["ProjControllerExtId"],
                },
              },
            },
          },
        ],
      },
    ],
  };
}

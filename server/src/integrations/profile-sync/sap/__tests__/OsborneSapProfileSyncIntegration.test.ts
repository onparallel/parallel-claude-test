import { readFileSync } from "fs";
import { Container } from "inversify";
import { Knex } from "knex";
import { join } from "path";
import { indexBy, omit, range } from "remeda";
import { createTestContainer } from "../../../../../test/testContainer";
import {
  Organization,
  ProfileRelationshipType,
  ProfileType,
  ProfileTypeField,
  User,
} from "../../../../db/__types";
import { KNEX } from "../../../../db/knex";
import { Mocks } from "../../../../db/repositories/__tests__/mocks";
import { FETCH_SERVICE, FetchService, IFetchService } from "../../../../services/FetchService";
import {
  IIntegrationsSetupService,
  INTEGRATIONS_SETUP_SERVICE,
} from "../../../../services/IntegrationsSetupService";
import { ILogger, LOGGER } from "../../../../services/Logger";
import {
  IProfilesSetupService,
  PROFILES_SETUP_SERVICE,
} from "../../../../services/ProfilesSetupService";
import { IStorageService, STORAGE_SERVICE } from "../../../../services/StorageService";
import { deleteAllData } from "../../../../util/knexUtils";
import { waitFor } from "../../../../util/promises/waitFor";
import {
  PROFILE_SYNC_LISTENER,
  ProfileSyncListener,
} from "../../../../workers/queues/event-listeners/ProfileSyncListener";
import { buildPollingLastChangeFilter, dateToSapDatetime } from "../helpers";
import { getOsborneSapSettings } from "../osborne";
import {
  ISapOdataClient,
  SAP_ODATA_CLIENT,
  SAP_ODATA_CLIENT_FACTORY,
  SapOdataClient,
  SapOdataClientFactory,
} from "../SapOdataClient";
import {
  SAP_PROFILE_SYNC_INTEGRATION_FACTORY,
  SapProfileSyncIntegrationFactory,
} from "../SapProfileSyncIntegration";
import {
  SapEntitySetFilter,
  SapPollingChangeDetectionStrategy,
  SapProfileSyncIntegrationSettings,
} from "../types";
import { expectProfilesAndRelationships, loadProfiles, ProfileWithValues } from "./utils";

// these tests are meant to be run manually and not by the CI as they depend on real external SAP data
// which may change and break the tests. Also some of these are long running tests which and hit real APIs
// which may lead to rate limiting if run too often.
(process.env.OSBORNE_CREDENTIALS ? describe : describe.skip)(
  "OSBORNE - SapProfileSyncIntegration REAL DATA",
  () => {
    let container!: Container;
    let organization: Organization;

    let mocks: Mocks;
    let knex: Knex;

    let individual: ProfileType;
    let individualFields: Record<string, ProfileTypeField>;
    let legalEntity: ProfileType;
    let legalEntityFields: Record<string, ProfileTypeField>;
    let matter: ProfileType;
    let matterFields: Record<string, ProfileTypeField>;

    let clientMatterRelationshipType: ProfileRelationshipType;
    let user: User;
    const users: Record<string, number> = {};

    let osborneSettings: Pick<
      Parameters<typeof getOsborneSapSettings>[0],
      | "individualProfileTypeId"
      | "individualProfileTypeFieldIds"
      | "legalEntityProfileTypeId"
      | "legalEntityProfileTypeFieldIds"
      | "matterProfileTypeId"
      | "matterProfileTypeFieldIds"
      | "clientMatterRelationshipTypeId"
    >;

    let fileUploadSpy: jest.SpyInstance;

    beforeEach(async () => {
      container = await createTestContainer();

      await container.unbind(SAP_ODATA_CLIENT);
      container.bind<ISapOdataClient>(SAP_ODATA_CLIENT).to(SapOdataClient);

      await container.unbind(FETCH_SERVICE);
      container.bind<IFetchService>(FETCH_SERVICE).to(FetchService);

      knex = container.get<Knex>(KNEX);
      mocks = new Mocks(knex);

      const storageService = container.get<IStorageService>(STORAGE_SERVICE);
      fileUploadSpy = jest.spyOn(storageService.temporaryFiles, "uploadFile");

      [organization] = await mocks.createRandomOrganizations(1);
      await mocks.createFeatureFlags([{ name: "PROFILE_SYNC", default_value: true }]);

      [user] = await mocks.createRandomUsers(organization.id, 1);

      const profilesSetup = container.get<IProfilesSetupService>(PROFILES_SETUP_SERVICE);

      [individual, legalEntity] = await profilesSetup.createDefaultProfileTypes(
        organization.id,
        "TEST",
      );
      matter = await profilesSetup.createMatterProfileType(
        {
          org_id: organization.id,
          name: { en: "Matter", es: "Asunto" },
          name_plural: { en: "Matters", es: "Asuntos" },
        },
        "TEST",
      );

      for (const profileTypeId of [individual.id, legalEntity.id]) {
        await mocks.createProfileTypeFields(organization.id, profileTypeId, [
          {
            name: { en: "Client partner", es: "Socio Cliente" },
            alias: "client_partner",
            type: "USER_ASSIGNMENT",
          },
          {
            name: { en: "Client partner (Text)", es: "Socio Cliente (Text)" },
            alias: "client_partner_text",
            type: "SHORT_TEXT",
            options: { format: "EMAIL" },
          },
          {
            name: { en: "External ID", es: "ID externo" },
            alias: "external_id",
            type: "SHORT_TEXT",
            is_unique: true,
          },
          ...(profileTypeId === individual.id
            ? [
                {
                  name: { en: "Full name", es: "Nombre completo" },
                  alias: "full_name",
                  type: "SHORT_TEXT",
                } as const,
              ]
            : []),
          ...(profileTypeId === legalEntity.id
            ? [
                {
                  name: { en: "Email", es: "Email" },
                  alias: "email",
                  type: "SHORT_TEXT",
                  options: { format: "EMAIL" },
                } as const,
              ]
            : []),
          {
            name: { en: "Client status", es: "Estado del cliente" },
            alias: "oc_client_status",
            type: "SELECT",
            options: {
              values: range(1, 11).map((i) => ({
                value: `_${i.toString().padStart(2, "0")}`,
                label: { en: i.toString().padStart(2, "0") },
              })),
            },
          },
          {
            name: { en: "Is new client", es: "Es nuevo cliente" },
            alias: "is_new_client",
            type: "SELECT",
            options: {
              values: [
                { value: "YES", label: { en: "Yes" } },
                { value: "NO", label: { en: "No" } },
              ],
            },
          },
          {
            name: { en: "Non face to face customer", es: "Cliente no presencial" },
            alias: "non_face_to_face_customer",
            type: "SELECT",
            options: {
              values: [
                { value: "YES", label: { en: "Yes" } },
                { value: "NO", label: { en: "No" } },
              ],
            },
          },
          {
            name: { en: "Language", es: "Idioma" },
            alias: "language",
            type: "SELECT",
            options: {
              values:
                "SR,ZH,TH,KO,RO,SL,HR,MS,UK,ET,AR,HE,CS,DE,EN,FR,EL,HU,IT,JA,DA,PL,ZF,NL,NO,PT,SK,RU,ES,TR,FI,SV,BG,LT,LV,Z1,AF,IS,CA,SH,ID,HI,KK,VI"
                  .split(",")
                  .map((value) => ({ value, label: { en: value } })),
            },
          },
          {
            name: { en: "Activity", es: "Actividad" },
            alias: "activity",
            type: "SELECT",
            options: {
              values: range(0, 10).map((i) => ({
                value: `_${i.toString().padStart(2, "0")}`,
                label: { en: i.toString().padStart(2, "0") },
              })),
            },
          },
          {
            name: { en: "KYC refresh date", es: "Fecha de refresco de KYC" },
            alias: "kyc_refresh_date",
            type: "DATE",
          },
          {
            name: { en: "KYC start date", es: "Fecha de inicio de KYC" },
            alias: "kyc_start_date",
            type: "DATE",
          },
          {
            name: { en: "Prescoring risk", es: "Riesgo de prescoring" },
            alias: "prescoring_risk",
            type: "SELECT",
            options: {
              values: ["LOW", "MEDIUM", "HIGH"].map((value) => ({ value, label: { en: value } })),
            },
          },
          {
            name: { en: "Global risk", es: "Riesgo global" },
            alias: "global_risk",
            type: "SELECT",
            options: {
              values: ["LOW", "MEDIUM", "HIGH"].map((value) => ({ value, label: { en: value } })),
            },
          },
        ]);
      }

      await mocks.createProfileTypeFields(organization.id, matter.id, [
        {
          name: { en: "Practice group", es: "Grupo de práctica" },
          alias: "practice_group",
          type: "SHORT_TEXT",
        },
        {
          name: { en: "Subpractice group", es: "Subgrupo de práctica" },
          alias: "subpractice_group",
          type: "SELECT",
          options: {
            values: (
              [
                [1, 11],
                [2, 5], // it should really be up to 0204 but there are some instances of 0205 in the sandbox data
                [5, 6],
                [6, 11],
                [7, 10],
                [8, 4],
                [9, 7],
                [10, 3],
                [11, 3],
              ] as [number, number][]
            ).flatMap(([x, y]) =>
              range(1, y + 1).map((i) => ({
                value: `_${x.toString().padStart(2, "0")}${i.toString().padStart(2, "0")}`,
                label: { en: `${x.toString().padStart(2, "0")}${i.toString().padStart(2, "0")}` },
              })),
            ),
          },
        },
        {
          name: { en: "Matter supervisor", es: "Supervisor del expediente" },
          alias: "matter_supervisor",
          type: "USER_ASSIGNMENT",
        },
        {
          name: { en: "Matter supervisor (Text)", es: "Supervisor del expediente (Text)" },
          alias: "matter_supervisor_text",
          type: "SHORT_TEXT",
          options: { format: "EMAIL" },
        },
        {
          name: { en: "List of legal advice", es: "Lista de asesorías legales" },
          alias: "aml_subject_matters",
          type: "CHECKBOX",
          options: {
            values: range(0, 127).map((i) => ({
              value: `_${i.toString().padStart(3, "0")}`,
              label: { en: i.toString().padStart(3, "0") },
            })),
          },
        },
        {
          name: { en: "Transaction volume", es: "Volumen de transacciones" },
          alias: "transaction_volume",
          type: "SELECT",
          options: {
            values: "0,0_100K,100K_500K,500K_1M,1M_20M,20M_"
              .split(",")
              .map((value) => ({ value: `_${value}`, label: { en: value } })),
          },
        },
        {
          name: { en: "Temporary active until", es: "Activo provisionalmente hasta" },
          alias: "temp_active_until",
          type: "DATE",
        },
        {
          name: { en: "Status", es: "Estado" },
          alias: "matter_status",
          type: "SELECT",
          options: {
            values: range(1, 6).map((i) => ({
              value: `_${i.toString().padStart(2, "0")}`,
              label: { en: i.toString().padStart(2, "0") },
            })),
          },
        },
      ]);

      const _fields = await mocks.knex
        .from("profile_type_field")
        .whereNull("deleted_at")
        .select("*");
      individualFields = indexBy(
        _fields.filter((f) => f.profile_type_id === individual.id),
        (f) => f.alias!,
      );
      legalEntityFields = indexBy(
        _fields.filter((f) => f.profile_type_id === legalEntity.id),
        (f) => f.alias!,
      );
      matterFields = indexBy(
        _fields.filter((f) => f.profile_type_id === matter.id),
        (f) => f.alias!,
      );

      await mocks.knex
        .from("profile_type_field")
        .where({ id: legalEntityFields["p_entity_type"].id })
        .update({
          options: mocks.knex.raw(
            `options || jsonb_build_object('values', options->'values' || ?::jsonb)`,
            [
              JSON.stringify([
                { value: "UTE", label: { en: "UTE" } },
                { value: "SPV", label: { en: "Special Purpose Vehicle" } },
                { value: "SC", label: { en: "Sports Club" } },
              ]),
            ],
          ),
        });

      const USERS = [
        "javier.ares@osborneclarke.com",
        "eduard.arruga@fakemail.com",
        "lluisglt@gmail.com",
        "francisco.diezamoretti@fakemail.com",
      ];

      for (const email of USERS) {
        const user = await mocks.createRandomUsers(organization.id, 1, undefined, (i) => ({
          email,
        }));
        users[email] = user[0].id;
      }

      [clientMatterRelationshipType] = await mocks.knex
        .from("profile_relationship_type")
        .where({
          org_id: organization.id,
          alias: "p_client__matter",
        })
        .select("*");

      osborneSettings = {
        individualProfileTypeId: individual.id,
        individualProfileTypeFieldIds: {
          addressId: individualFields["p_address"].id,
          city: individualFields["p_city"].id,
          postalCode: individualFields["p_zip"].id,
          country: individualFields["p_country_of_residence"].id,
          email: individualFields["p_email"].id,
          phone: individualFields["p_phone_number"].id,
          name: individualFields["full_name"].id,
          taxNumber: individualFields["p_tax_id"].id,
          clientStatus: individualFields["oc_client_status"].id,
          isNewClient: individualFields["is_new_client"].id,
          clientPartner: individualFields["client_partner"].id,
          clientPartnerText: individualFields["client_partner_text"].id,
          externalId: individualFields["external_id"].id,
          relationship: individualFields["p_relationship"].id,
          nonFaceToFaceCustomer: individualFields["non_face_to_face_customer"].id,
          language: individualFields["language"].id,
          activity: individualFields["activity"].id,
          kycRefreshDate: individualFields["kyc_refresh_date"].id,
          kycStartDate: individualFields["kyc_start_date"].id,
          prescoringRisk: individualFields["prescoring_risk"].id,
          globalRisk: individualFields["global_risk"].id,
          risk: individualFields["p_risk"].id,
        },
        legalEntityProfileTypeId: legalEntity.id,
        legalEntityProfileTypeFieldIds: {
          addressId: legalEntityFields["p_registered_address"].id,
          city: legalEntityFields["p_city"].id,
          postalCode: legalEntityFields["p_zip"].id,
          country: legalEntityFields["p_country"].id,
          phone: legalEntityFields["p_phone_number"].id,
          name: legalEntityFields["p_entity_name"].id,
          taxNumber: legalEntityFields["p_tax_id"].id,
          clientStatus: legalEntityFields["oc_client_status"].id,
          email: legalEntityFields["email"].id,
          isNewClient: legalEntityFields["is_new_client"].id,
          clientPartner: legalEntityFields["client_partner"].id,
          clientPartnerText: legalEntityFields["client_partner_text"].id,
          externalId: legalEntityFields["external_id"].id,
          entityType: legalEntityFields["p_entity_type"].id,
          relationship: legalEntityFields["p_relationship"].id,
          nonFaceToFaceCustomer: legalEntityFields["non_face_to_face_customer"].id,
          language: legalEntityFields["language"].id,
          activity: legalEntityFields["activity"].id,
          kycRefreshDate: legalEntityFields["kyc_refresh_date"].id,
          kycStartDate: legalEntityFields["kyc_start_date"].id,
          prescoringRisk: legalEntityFields["prescoring_risk"].id,
          globalRisk: legalEntityFields["global_risk"].id,
          risk: legalEntityFields["p_risk"].id,
        },
        matterProfileTypeId: matter.id,
        matterProfileTypeFieldIds: {
          matterDescription: matterFields["p_matter_description"].id,
          matterName: matterFields["p_matter_name"].id,
          matterStatus: matterFields["matter_status"].id,
          practiceGroup: matterFields["practice_group"].id,
          subpracticeGroup: matterFields["subpractice_group"].id,
          projectId: matterFields["p_matter_id"].id,
          matterSupervisor: matterFields["matter_supervisor"].id,
          matterSupervisorText: matterFields["matter_supervisor_text"].id,
          amlSubjectMatters: matterFields["aml_subject_matters"].id,
          transactionVolume: matterFields["transaction_volume"].id,
          countriesInvolved: matterFields["p_countries_involved"].id,
          matterRisk: matterFields["p_matter_risk"].id,
          tempActiveUntil: matterFields["temp_active_until"].id,
        },
        clientMatterRelationshipTypeId: clientMatterRelationshipType.id,
      };
    });

    afterEach(async () => {
      jest.restoreAllMocks();
      await deleteAllData(knex);
      await knex.destroy();
    });

    async function createSapIntegration(settings: SapProfileSyncIntegrationSettings) {
      await mocks.knex.from("org_integration").update({ deleted_at: null });

      return await container
        .get<IIntegrationsSetupService>(INTEGRATIONS_SETUP_SERVICE)
        .createSapProfileSyncIntegration(
          {
            org_id: organization.id,
            name: "SAP",
            settings: {
              ...omit(settings, ["authorization"]),
              CREDENTIALS:
                settings.authorization.type === "BASIC"
                  ? {
                      type: "BASIC" as const,
                      password: settings.authorization.password,
                      user: settings.authorization.user,
                    }
                  : settings.authorization,
            },
          },
          "TEST",
        );
    }

    it("initialSync", async () => {
      // These BP should not be edited, or the test may fail
      const customers = ["1505312", "1505315"];

      const orgIntegration = await createSapIntegration(
        getOsborneSapSettings({
          ...osborneSettings,
          businessPartnerFilter: {
            operator: "or",
            conditions: customers.map(
              (customer) =>
                ({
                  left: { type: "property", name: "BusinessPartner" },
                  operator: "eq",
                  right: { type: "literal", value: `'${customer}'` },
                }) as SapEntitySetFilter,
            ),
          },
          projectFilter: {
            operator: "or",
            conditions: customers.map(
              (customer) =>
                ({
                  left: { type: "property", name: "Customer" },
                  operator: "eq",
                  right: { type: "literal", value: `'${customer}'` },
                }) as SapEntitySetFilter,
            ),
          },
        }),
      );

      const integration = container.get<SapProfileSyncIntegrationFactory>(
        SAP_PROFILE_SYNC_INTEGRATION_FACTORY,
      )(orgIntegration.id);

      await integration.initialSync();

      const syncLog = await mocks.knex
        .from("profile_sync_log")
        .where("integration_id", orgIntegration.id)
        .select("*");

      const expectedProfilesWithMatters: {
        client: ProfileWithValues;
        matters: ProfileWithValues[];
      }[] = [
        {
          client: {
            profile_type_id: individual.id,
            values: {
              external_id: "1505312",
              is_new_client: "NO",
              oc_client_status: "_01",
              p_tax_id: "ESB67505586",
              full_name: "Parallel - Pruebas locales  NO TOCAR",
              p_address: "C/Noguera Pallaresa 43",
              p_city: "Madrid",
              p_zip: "08014",
              p_country_of_residence: "ES",
              p_email: "bla@bla.com",
              p_phone_number: "+34666666666",
              client_partner: users["javier.ares@osborneclarke.com"],
              client_partner_text: "javier.ares@osborneclarke.com",
              non_face_to_face_customer: "NO",
              language: "ES",
            },
          },
          matters: [
            {
              profile_type_id: matter.id,
              values: {
                aml_subject_matters: ["_001", "_003", "_005"],
                matter_status: "_02",
                matter_supervisor: users["javier.ares@osborneclarke.com"],
                matter_supervisor_text: "javier.ares@osborneclarke.com",
                p_countries_involved: ["AD", "AM", "BF", "CM"],
                p_matter_description: "Descripción del expediente",
                p_matter_name: "Prueba expediente Parallel",
                practice_group: "_01",
                p_matter_id: "4591",
                subpractice_group: "_0103",
                temp_active_until: "2026-02-13",
              },
            },
          ],
        },
        {
          client: {
            profile_type_id: legalEntity.id,
            values: {
              client_partner: users["javier.ares@osborneclarke.com"],
              client_partner_text: "javier.ares@osborneclarke.com",
              external_id: "1505315",
              is_new_client: "YES",
              oc_client_status: "_05",
              p_city: "Barcelona",
              p_country: "ES",
              p_entity_name: "Parallel - Pruebas locales  NO TOCAR",
              p_entity_type: "LIMITED_LIABILITY_COMPANY",
              p_registered_address: "C/...",
              p_tax_id: "B67505586",
              p_zip: "08014",
              non_face_to_face_customer: "NO",
              language: "CA",
              activity: "_02",
              kyc_refresh_date: "2026-06-01",
            },
          },
          matters: [
            {
              profile_type_id: matter.id,
              values: {
                p_matter_description: "Hola",
                p_matter_name: "Prueba Parallel 7/1/2026",
                practice_group: "_01",
                p_matter_id: "4631",
                subpractice_group: "_0102",
                transaction_volume: "_100K_500K",
                p_countries_involved: ["ES", "AD"],
                temp_active_until: "2026-01-14",
              },
            },
            {
              profile_type_id: matter.id,
              values: {
                matter_supervisor: users["eduard.arruga@fakemail.com"],
                matter_supervisor_text: "eduard.arruga@fakemail.com",
                p_matter_description: "",
                p_matter_name: "Prueba Parallel 08/01/2026",
                practice_group: "_01",
                p_matter_id: "4632",
                subpractice_group: "_0102",
              },
            },
            {
              profile_type_id: matter.id,
              values: {
                aml_subject_matters: ["_001", "_002", "_003"],
                matter_status: "_01",
                matter_supervisor: users["lluisglt@gmail.com"],
                matter_supervisor_text: "lluisglt@gmail.com",
                p_countries_involved: ["ES"],
                p_matter_description: "Hola que tal!!!!!",
                p_matter_name: "Prueba 19/1",
                practice_group: "_10",
                p_matter_id: "4641",
                subpractice_group: "_1001",
                temp_active_until: "2026-01-19",
                transaction_volume: "_1M_20M",
              },
            },
          ],
        },
      ];
      await expectProfilesAndRelationships(
        knex,
        organization.id,
        expectedProfilesWithMatters.flatMap((p) => [p.client, ...p.matters]),
        expectedProfilesWithMatters.flatMap((p) =>
          p.matters.map(
            (m) =>
              [
                "p_client__matter",
                [p.client.profile_type_id, "external_id", p.client.values.external_id],
                [m.profile_type_id, "p_matter_id", m.values.p_matter_id],
              ] as [
                alias: string,
                [profile_type_id: number, alias: string, value: string],
                [profile_type_id: number, alias: string, value: string],
              ],
          ),
        ),
      );

      expect(syncLog).toMatchObject([
        {
          sync_type: "INITIAL",
          status: "COMPLETED",
          error: null,
          output: { output: "DATABASE" },
          sync_data: [
            { temporary_file_id: expect.any(Number) }, // Business Partner to Individual
            { temporary_file_id: expect.any(Number) }, // Business Partner to Legal Entity
            { temporary_file_id: expect.any(Number) }, // Projects to Matters
          ],
        },
      ]);

      expect(fileUploadSpy).toHaveBeenCalledTimes(3);
    }, 60_000);

    it(
      "initialSync with bulk data BusinessPartner le '1001500' and projects created after 2025-01-01",
      async () => {
        // There are 2000 BPs with ID le '1001500'
        const orgIntegration = await createSapIntegration(
          getOsborneSapSettings({
            ...osborneSettings,
            businessPartnerFilter: {
              operator: "and",
              conditions: [
                {
                  left: { type: "property", name: "BusinessPartner" },
                  operator: "le",
                  right: { type: "literal", value: "'1001500'" },
                },
              ],
            },
            projectFilter: {
              operator: "and",
              conditions: [
                {
                  left: { type: "property", name: "Customer" },
                  operator: "le",
                  right: { type: "literal", value: "'1001500'" },
                },
                {
                  left: { type: "property", name: "CreatedOn" },
                  operator: "ge",
                  right: { type: "literal", value: "datetime'2025-01-01T00:00:00'" },
                },
              ],
            },
          }),
        );

        const integration = container.get<SapProfileSyncIntegrationFactory>(
          SAP_PROFILE_SYNC_INTEGRATION_FACTORY,
        )(orgIntegration.id);

        await integration.initialSync();

        const profiles = await loadProfiles(knex, organization.id);

        const individualProfiles = profiles.filter((p) => p.profile_type_id === individual.id);
        const legalEntityProfiles = profiles.filter((p) => p.profile_type_id === legalEntity.id);
        const matterProfiles = profiles.filter((p) => p.profile_type_id === matter.id);

        expect(individualProfiles.length + legalEntityProfiles.length).toBe(2001);
        expect(matterProfiles.length).toBe(100);

        const syncLog = await mocks.knex
          .from("profile_sync_log")
          .where("integration_id", orgIntegration.id)
          .select("*");

        expect(syncLog).toMatchObject([
          {
            sync_type: "INITIAL",
            status: "COMPLETED",
            error: null,
            output: { output: "DATABASE" },
          },
        ]);
      },
      20 * 60_000,
    );

    it("profileUpdated events", async () => {
      const customers = ["1505383"];
      const sapSettings = getOsborneSapSettings({
        ...osborneSettings,
        businessPartnerFilter: {
          operator: "or",
          conditions: customers.map(
            (customer) =>
              ({
                left: { type: "property", name: "BusinessPartner" },
                operator: "eq",
                right: { type: "literal", value: `'${customer}'` },
              }) as SapEntitySetFilter,
          ),
        },
        projectFilter: {
          operator: "or",
          conditions: customers.map(
            (customer) =>
              ({
                left: { type: "property", name: "Customer" },
                operator: "eq",
                right: { type: "literal", value: `'${customer}'` },
              }) as SapEntitySetFilter,
          ),
        },
      });
      const orgIntegration = await createSapIntegration(sapSettings);

      const integration = container.get<SapProfileSyncIntegrationFactory>(
        SAP_PROFILE_SYNC_INTEGRATION_FACTORY,
      )(orgIntegration.id);

      await integration.initialSync();

      let [clientProfile] = await loadProfiles(knex, organization.id);

      expect(clientProfile.values).toMatchObject({ external_id: "1505383" });

      expect(
        await mocks.knex
          .from("profile_sync_log")
          .where("integration_id", orgIntegration.id)
          .select("*"),
      ).toMatchObject([
        {
          sync_type: "INITIAL",
          status: "COMPLETED",
          error: null,
          output: { output: "DATABASE" },
          sync_data: [
            { temporary_file_id: expect.any(Number) }, // Business Partner to Individual
            { temporary_file_id: expect.any(Number) }, // Business Partner to Legal Entity
            { temporary_file_id: expect.any(Number) }, // Projects to Matters
          ],
        },
      ]);

      expect(fileUploadSpy).toHaveBeenCalledTimes(3);

      const listener = container.get<ProfileSyncListener>(PROFILE_SYNC_LISTENER);
      // Update to_BusinessPartnerAddress and flip city to test bidirectional sync
      let updateData: any =
        clientProfile.values["p_city"] === "Madrid"
          ? { city: "Barcelona", zip: "08036" }
          : { city: "Madrid", zip: "28046" };
      await mocks.createProfileFieldValues(clientProfile.id, [
        {
          type: "SHORT_TEXT",
          profile_type_field_id: legalEntityFields["p_city"].id,
          content: JSON.stringify({
            value: updateData.city,
          }),
        },
        {
          type: "SHORT_TEXT",
          profile_type_field_id: legalEntityFields["p_zip"].id,
          content: JSON.stringify({
            value: updateData.zip,
          }),
        },
      ]);

      await listener.handle({
        org_id: organization.id,
        profile_id: clientProfile.id,
        type: "PROFILE_UPDATED",
        data: {
          user_id: user.id,
          org_integration_id: null,
          profile_type_field_ids: [legalEntityFields["p_city"].id, legalEntityFields["p_zip"].id],
        },
      } as any);
      const logger = container.get<ILogger>(LOGGER);
      using client = container.get<SapOdataClientFactory>(SAP_ODATA_CLIENT_FACTORY)(
        logger,
        sapSettings.baseUrl,
        sapSettings.authorization,
        sapSettings.additionalHeaders,
      );

      let remoteEntity = await client.getEntity(
        sapSettings.mappings.find((m) => m.name === "Business Partner to Legal Entity")!
          .entityDefinition,
        { BusinessPartner: clientProfile.values["external_id"] },
        {
          $expand: ["to_BusinessPartnerAddress"],
          $select: [
            "BusinessPartner",
            "to_BusinessPartnerAddress/CityName",
            "to_BusinessPartnerAddress/PostalCode",
          ],
        },
      );

      expect(clientProfile.values["p_city"]).not.toEqual(updateData.city);
      expect(clientProfile.values["p_zip"]).not.toEqual(updateData.zip);

      expect(remoteEntity.to_BusinessPartnerAddress.results[0]).toMatchObject({
        CityName: updateData.city,
        PostalCode: updateData.zip,
      });

      // Update to_EmailAddress and to_PhoneNumber in nested entities
      updateData =
        clientProfile.values["email"] === "test@test.com"
          ? { email: "test2@test.com", p_phone_number: "+34678123456" }
          : { email: "test@test.com", p_phone_number: "+34678654321" };
      await mocks.createProfileFieldValues(
        clientProfile.id,
        Object.entries(updateData).map(([field, value]) => ({
          type: legalEntityFields[field].type,
          profile_type_field_id: legalEntityFields[field].id,
          content: JSON.stringify({ value }),
        })),
      );

      await listener.handle({
        org_id: organization.id,
        profile_id: clientProfile.id,
        type: "PROFILE_UPDATED",
        data: {
          user_id: user.id,
          org_integration_id: null,
          profile_type_field_ids: Object.keys(updateData).map(
            (field) => legalEntityFields[field].id,
          ),
        },
      } as any);

      remoteEntity = await client.getEntity(
        {
          servicePath: "sap/API_BUSINESS_PARTNER",
          serviceNamespace: "API_BUSINESS_PARTNER",
          entitySetName: "A_BusinessPartner",
          remoteEntityKey: ["BusinessPartner"],
        },
        { BusinessPartner: clientProfile.values["external_id"] },
        {
          $expand: [
            "to_BusinessPartnerAddress",
            "to_BusinessPartnerAddress/to_EmailAddress",
            "to_BusinessPartnerAddress/to_PhoneNumber",
          ],
          $select: [
            "BusinessPartner",
            "to_BusinessPartnerAddress/to_EmailAddress",
            "to_BusinessPartnerAddress/to_PhoneNumber",
          ],
        },
      );
      const address = remoteEntity.to_BusinessPartnerAddress.results[0];
      expect(
        address.to_EmailAddress?.results.find((e: any) => e.IsDefaultEmailAddress),
      ).toMatchObject({
        EmailAddress: updateData.email,
      });
      expect(
        address.to_PhoneNumber?.results.find((e: any) => e.IsDefaultPhoneNumber),
      ).toMatchObject({
        InternationalPhoneNumber: updateData.p_phone_number,
      });

      // Test syncing risk levels and other custom fields
      const RISKS = ["LOW", "MEDIUM", "HIGH"];
      updateData = {
        oc_client_status: clientProfile.values["oc_client_status"] === "_01" ? "_10" : "_01",
        ...Object.fromEntries(
          ["p_risk", "global_risk", "prescoring_risk"].map((field) => [
            field,
            RISKS[(RISKS.indexOf(clientProfile.values[field]) + 1) % RISKS.length],
          ]),
        ),
        is_new_client: clientProfile.values["is_new_client"] === "YES" ? "NO" : "YES",
        activity: clientProfile.values["activity"] === "_01" ? "_02" : "_01",
        kyc_refresh_date:
          clientProfile.values["kyc_refresh_date"] === "2026-01-01" ? "2026-01-02" : "2026-01-01",
        kyc_start_date:
          clientProfile.values["kyc_start_date"] === "2026-02-01" ? "2026-02-02" : "2026-02-01",
        p_entity_type:
          clientProfile.values["entity_type"] === "LIMITED_LIABILITY_COMPANY"
            ? "LIMITED_LIABILITY_PARTNERSHIP"
            : "LIMITED_LIABILITY_COMPANY",
      };
      await mocks.createProfileFieldValues(
        clientProfile.id,
        Object.entries(updateData).map(([field, value]) => ({
          type: legalEntityFields[field].type,
          profile_type_field_id: legalEntityFields[field].id,
          content: JSON.stringify({ value }),
        })),
      );

      await listener.handle({
        org_id: organization.id,
        profile_id: clientProfile.id,
        type: "PROFILE_UPDATED",
        data: {
          user_id: user.id,
          org_integration_id: null,
          profile_type_field_ids: Object.keys(updateData).map(
            (field) => legalEntityFields[field].id,
          ),
        },
      } as any);

      remoteEntity = await client.getEntity(
        {
          servicePath: "sap/API_BUSINESS_PARTNER",
          serviceNamespace: "API_BUSINESS_PARTNER",
          entitySetName: "A_BusinessPartner",
          remoteEntityKey: ["BusinessPartner"],
        },
        { BusinessPartner: clientProfile.values["external_id"] },
        {
          $select: [
            "BusinessPartner",
            "YY1_AMT_CLIENT_STATUS_bus",
            "YY1_bp_risk_bus",
            "YY1_bp_global_risk_bus",
            "YY1_bp_prescoring_risk_bus",
            "YY1_bp_is_new_client_bus",
            "YY1_bp_activity_bus",
            "YY1_bp_kyc_refresh_dat_bus",
            "YY1_bp_kyc_integration_bus",
            "YY1_bp_entity_type_bus",
          ],
        },
      );

      expect(remoteEntity).toMatchObject({
        YY1_AMT_CLIENT_STATUS_bus: updateData.oc_client_status.replace("_", ""),
        YY1_bp_risk_bus: `${RISKS.indexOf(updateData.p_risk) + 1}`.padStart(2, "0"),
        YY1_bp_global_risk_bus: `${RISKS.indexOf(updateData.global_risk) + 1}`.padStart(2, "0"),
        YY1_bp_prescoring_risk_bus: `${RISKS.indexOf(updateData.prescoring_risk) + 1}`.padStart(
          2,
          "0",
        ),
        YY1_bp_is_new_client_bus: updateData.is_new_client === "YES" ? true : false,
        YY1_bp_activity_bus: updateData.activity.replace("_", ""),
        YY1_bp_kyc_refresh_dat_bus: dateToSapDatetime(new Date(updateData.kyc_refresh_date)),
        YY1_bp_kyc_integration_bus: dateToSapDatetime(new Date(updateData.kyc_start_date)),
        YY1_bp_entity_type_bus:
          updateData.p_entity_type === "LIMITED_LIABILITY_COMPANY"
            ? "LLC"
            : updateData.p_entity_type === "LIMITED_LIABILITY_PARTNERSHIP"
              ? "LLP"
              : updateData.p_entity_type,
      });

      remoteEntity = await client.getEntity(
        {
          servicePath: "sap/API_BUSINESS_PARTNER",
          serviceNamespace: "API_BUSINESS_PARTNER",
          entitySetName: "A_BusinessPartner",
          remoteEntityKey: ["BusinessPartner"],
        },
        { BusinessPartner: clientProfile.values["external_id"] },
        {
          $expand: ["to_Customer"],
          $select: [
            "BusinessPartner",
            "to_Customer/YY1_NoPresentialCustom_cus",
            "to_Customer/Customer",
          ],
        },
      );

      // Test polling: flip YY1_NoPresentialCustom_cus in SAP and poll for changes
      const date = new Date();
      await waitFor(1_000); // wait as SAP change fields have 1s granularity
      const nonFaceToFaceCustomer = clientProfile.values["non_face_to_face_customer"] === "YES";
      await client.updateEntity(
        {
          servicePath: "sap/API_BUSINESS_PARTNER",
          serviceNamespace: "API_BUSINESS_PARTNER",
          entitySetName: "A_Customer",
          remoteEntityKey: ["Customer"],
        },
        { Customer: remoteEntity.to_Customer.Customer },
        { YY1_NoPresentialCustom_cus: !nonFaceToFaceCustomer },
      );

      await integration.pollForChangedEntities(date);

      [clientProfile] = await loadProfiles(knex, organization.id);

      expect(clientProfile.values["non_face_to_face_customer"]).toEqual(
        !nonFaceToFaceCustomer ? "YES" : "NO",
      );

      expect(
        await mocks.knex
          .from("profile_sync_log")
          .where("integration_id", orgIntegration.id)
          .select("*")
          .orderBy("id", "asc"),
      ).toMatchObject([
        {
          sync_type: "INITIAL",
          status: "COMPLETED",
          error: null,
          output: { output: "DATABASE" },
        },
        {
          sync_type: "TO_REMOTE",
          status: "COMPLETED",
          error: null,
          output: { output: "DATABASE" },
        },
        {
          sync_type: "TO_REMOTE",
          status: "COMPLETED",
          error: null,
          output: { output: "DATABASE" },
        },
        {
          sync_type: "TO_REMOTE",
          status: "COMPLETED",
          error: null,
          output: { output: "DATABASE" },
        },
        {
          sync_type: "TO_LOCAL",
          status: "COMPLETED",
          error: null,
          output: { output: "DATABASE" },
        },
      ]);
    }, 60_000);

    it.only("polling with localIdBinding writes IDs and stabilizes", async () => {
      const customer = "1505315";
      const sapSettings = getOsborneSapSettings({
        ...osborneSettings,
        businessPartnerFilter: {
          left: { type: "property", name: "BusinessPartner" },
          operator: "eq",
          right: { type: "literal", value: `'${customer}'` },
        },
        projectFilter: {
          left: { type: "property", name: "Customer" },
          operator: "eq",
          right: { type: "literal", value: `'${customer}'` },
        },
      });

      const orgIntegration = await createSapIntegration(sapSettings);

      const integration = container.get<SapProfileSyncIntegrationFactory>(
        SAP_PROFILE_SYNC_INTEGRATION_FACTORY,
      )(orgIntegration.id);

      const logger = container.get<ILogger>(LOGGER);
      using client = container.get<SapOdataClientFactory>(SAP_ODATA_CLIENT_FACTORY)(
        logger,
        sapSettings.baseUrl,
        sapSettings.authorization,
        sapSettings.additionalHeaders,
      );

      const projectsMapping = sapSettings.mappings.find((x) => x.name === "Projects to Matters")!;

      const projectEntityDefinition = projectsMapping.entityDefinition;

      // Step 1: Clear project localId fields to simulate "new" projects
      const { results: projects } = await client.getEntitySet(projectEntityDefinition, {
        $filter: {
          left: { type: "property", name: "Customer" },
          operator: "eq",
          right: { type: "literal", value: `'${customer}'` },
        },
        $select: ["ProjectID", "YY1_EP_id_Parallel_Cpr"],
        $orderby: [["ProjectID", "asc"]],
      });

      expect(projects.length).toBeGreaterThan(0);

      for (const project of projects) {
        await client.updateEntity(
          projectEntityDefinition,
          { ProjectID: project.ProjectID },
          { YY1_EP_id_Parallel_Cpr: "" },
        );
      }

      await waitFor(1_000);

      // Step 2: initialSync - writes localIds to all entities
      const dateBeforeSync = new Date();
      await waitFor(1_000);
      await integration.initialSync();

      async function fetchChangedProjects(date: Date) {
        const { results } = await client.getEntitySet(projectEntityDefinition, {
          $filter: {
            operator: "and",
            conditions: [
              {
                left: { type: "property", name: "Customer" },
                operator: "eq",
                right: { type: "literal", value: `'${customer}'` },
              },
              buildPollingLastChangeFilter(
                (projectsMapping.changeDetection as SapPollingChangeDetectionStrategy)
                  .remoteLastChange,
                date,
              ),
            ],
          },
          $orderby: [["ChangedOn", "desc"]],
          $select: ["ProjectID", "ChangedOn", "YY1_EP_id_Parallel_Cpr"],
        });
        return results;
      }
      await waitFor(1_000);
      expect(await fetchChangedProjects(dateBeforeSync)).toHaveLength(projects.length);

      const dateAfterSync = new Date();
      const profilesAfterSync = await loadProfiles(knex, organization.id);

      // Step 3: First poll - detects changes from localId writes, but IDs match → no updateEntity
      await integration.pollForChangedEntities(dateBeforeSync);

      expect(await fetchChangedProjects(dateAfterSync)).toHaveLength(0);

      const profilesAfterPoll1 = await loadProfiles(knex, organization.id);
      expect(profilesAfterPoll1).toEqual(profilesAfterSync);

      // Step 4: Simulate a "new" project by clearing localId on one project
      const dateBeforeClear = new Date();
      const targetProject = projects[0];
      await client.updateEntity(
        projectEntityDefinition,
        { ProjectID: targetProject.ProjectID },
        { YY1_EP_id_Parallel_Cpr: "" },
      );

      await waitFor(1_000);
      expect(await fetchChangedProjects(dateBeforeClear)).toHaveLength(1);

      // Step 5: Second poll - detects the cleared project, localId doesn't match → writes it back
      await integration.pollForChangedEntities(dateBeforeClear);
      const dateAfterPoll2 = new Date();

      const profilesAfterPoll2 = await loadProfiles(knex, organization.id);
      expect(profilesAfterPoll2).toEqual(profilesAfterSync);

      // Step 6: Third poll - detects change from the write, but IDs now match → no updateEntity
      await waitFor(1_000);
      expect(await fetchChangedProjects(dateAfterPoll2)).toHaveLength(0);
      await integration.pollForChangedEntities(dateAfterPoll2);
      const dateAfterPoll3 = new Date();

      const profilesAfterPoll3 = await loadProfiles(knex, organization.id);
      expect(profilesAfterPoll3).toEqual(profilesAfterSync);

      // Step 7: Fourth poll - no changes, verify stability
      await waitFor(1_000);
      expect(await fetchChangedProjects(dateAfterPoll3)).toHaveLength(0);
      await integration.pollForChangedEntities(dateAfterPoll3);
      const dateAfterPoll4 = new Date();

      const profilesAfterPoll4 = await loadProfiles(knex, organization.id);
      expect(profilesAfterPoll4).toEqual(profilesAfterSync);

      await waitFor(1_000);
      // Step 8: Verify no pending changes via manual getEntitySet with polling params
      expect(await fetchChangedProjects(dateAfterPoll4)).toHaveLength(0);
    }, 120_000);

    it("works with certificate", async () => {
      // Make sure certificate.pfx and passphrase.txt are placed in the __tests__ folder next to this file
      const sapSettings: SapProfileSyncIntegrationSettings = {
        ...getOsborneSapSettings(osborneSettings),
        authorization: {
          type: "CERTIFICATE",
          pfx: readFileSync(join(__dirname, "certificate.pfx")).toString("base64"),
          passphrase: readFileSync(join(__dirname, "passphrase.txt")).toString("utf-8").trim(),
        },
      };

      const logger = container.get<ILogger>(LOGGER);
      using client = container.get<SapOdataClientFactory>(SAP_ODATA_CLIENT_FACTORY)(
        logger,
        sapSettings.baseUrl,
        sapSettings.authorization,
        sapSettings.additionalHeaders,
      );

      const entity = await client.getEntity(
        {
          servicePath: "sap/API_BUSINESS_PARTNER",
          serviceNamespace: "API_BUSINESS_PARTNER",
          entitySetName: "A_BusinessPartner",
          remoteEntityKey: ["BusinessPartner"],
        },
        { BusinessPartner: "1505383" },
        { $select: ["BusinessPartner"] },
      );

      expect(entity).toMatchObject({ BusinessPartner: "1505383" });
    });
  },
);

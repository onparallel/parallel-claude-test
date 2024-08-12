import gql from "graphql-tag";
import { Knex } from "knex";
import { indexBy } from "remeda";
import {
  Organization,
  Petition,
  PetitionField,
  PetitionFieldType,
  Profile,
  ProfileRelationshipType,
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldTypeValues,
  User,
} from "../../db/__types";
import { mapProfileTypeFieldToPetitionField } from "../../db/helpers/petitionProfileMapper";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { PROFILES_SETUP_SERVICE, ProfilesSetupService } from "../../services/ProfilesSetupService";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

describe("GraphQL/Profiles to Petitions", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let user: User;
  let organization: Organization;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    await mocks.createOrganizationUsageLimit(organization.id, "PETITION_SEND", 1000);
    await mocks.createFeatureFlags([{ name: "PROFILES", default_value: true }]);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("createPetitionFromProfile", () => {
    let template: Petition;

    let individual: ProfileType;
    let legalEntity: ProfileType;
    let contract: ProfileType;

    let individualIdx: Record<string, ProfileTypeField>;
    let legalEntityIdx: Record<string, ProfileTypeField>;
    let contractIdx: Record<string, ProfileTypeField>;

    let relationshipTypes: ProfileRelationshipType[];

    let mainProfile: Profile;
    let yourFamilyMemberProfiles: Profile[];
    let yourCompaniesProfiles: Profile[];
    let yourContractsProfiles: Profile[];

    let you: PetitionField;
    let youChildren: PetitionField[];

    let yourFamily: PetitionField;
    let yourFamilyChildren: PetitionField[];

    let yourCompanies: PetitionField;
    let yourCompaniesChildren: PetitionField[];

    let yourContracts: PetitionField;
    let yourContractsChildren: PetitionField[];

    beforeAll(async () => {
      const profilesSetup = testClient.container.get<ProfilesSetupService>(PROFILES_SETUP_SERVICE);
      await profilesSetup.createDefaultProfileTypes(organization.id, `User:${user.id}`);
      await profilesSetup.createDefaultProfileRelationshipTypes(organization.id, `User:${user.id}`);

      [individual] = await mocks.knex
        .from("profile_type")
        .where({
          standard_type: "INDIVIDUAL",
          org_id: organization.id,
          deleted_at: null,
        })
        .select("*");

      [legalEntity] = await mocks.knex
        .from("profile_type")
        .where({
          standard_type: "LEGAL_ENTITY",
          org_id: organization.id,
          deleted_at: null,
        })
        .select("*");

      [contract] = await mocks.knex
        .from("profile_type")
        .where({
          standard_type: "CONTRACT",
          org_id: organization.id,
          deleted_at: null,
        })
        .select("*");

      relationshipTypes = await mocks.knex
        .from("profile_relationship_type")
        .where({ org_id: organization.id, deleted_at: null })
        .select("*");

      const individualProperties = await mocks.knex
        .from("profile_type_field")
        .where({ deleted_at: null, profile_type_id: individual.id })
        .orderBy("position", "asc")
        .select("*");
      const legalEntityProperties = await mocks.knex
        .from("profile_type_field")
        .where({ deleted_at: null, profile_type_id: legalEntity.id })
        .orderBy("position", "asc")
        .select("*");
      const contractProperties = await mocks.knex
        .from("profile_type_field")
        .where({ deleted_at: null, profile_type_id: contract.id })
        .orderBy("position", "asc")
        .select("*");

      /*
       * ========================
       * CREATE TEMPLATE
       * ========================
       */
      [template] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        is_template: true,
      }));

      [you, yourFamily, yourCompanies, yourContracts] = await mocks.createRandomPetitionFields(
        template.id,
        4,
        (i) => ({
          type: "FIELD_GROUP",
          profile_type_id: [individual.id, individual.id, legalEntity.id, contract.id][i],
          multiple: i > 0,
        }),
      );

      const individualFields = individualProperties.map((p) =>
        mapProfileTypeFieldToPetitionField(p, "en"),
      );
      const legalEntityFields = legalEntityProperties.map((p) =>
        mapProfileTypeFieldToPetitionField(p, "en"),
      );
      const contractFields = contractProperties.map((p) =>
        mapProfileTypeFieldToPetitionField(p, "en"),
      );

      youChildren = await mocks.createRandomPetitionFields(
        template.id,
        individualFields.length,
        (i) => ({
          ...individualFields[i],
          parent_petition_field_id: you.id,
        }),
      );
      yourFamilyChildren = await mocks.createRandomPetitionFields(
        template.id,
        individualFields.length,
        (i) => ({
          ...individualFields[i],
          parent_petition_field_id: yourFamily.id,
        }),
      );
      yourCompaniesChildren = await mocks.createRandomPetitionFields(
        template.id,
        legalEntityFields.length,
        (i) => ({
          ...legalEntityFields[i],
          parent_petition_field_id: yourCompanies.id,
        }),
      );
      yourContractsChildren = await mocks.createRandomPetitionFields(
        template.id,
        contractFields.length,
        (i) => ({
          ...contractFields[i],
          parent_petition_field_id: yourContracts.id,
        }),
      );
      /*
       * ========================
       * CREATE TEMPLATE FIELDS RELATIONSHIPS
       * ========================
       */
      const rFamilyMember = relationshipTypes.find((rt) => rt.alias === "p_family_member")!;
      const rManagedCompany = relationshipTypes.find(
        (rt) => rt.alias === "p_director__managed_by",
      )!;
      const rContract = relationshipTypes.find((rt) => rt.alias === "p_contract__counterparty")!;

      await mocks.knex.from("petition_field_group_relationship").insert([
        {
          petition_id: template.id,
          left_side_petition_field_id: you.id,
          right_side_petition_field_id: yourFamily.id,
          profile_relationship_type_id: rFamilyMember.id,
          direction: "LEFT_RIGHT",
        },
        {
          petition_id: template.id,
          left_side_petition_field_id: you.id,
          right_side_petition_field_id: yourCompanies.id,
          profile_relationship_type_id: rManagedCompany.id,
          direction: "LEFT_RIGHT",
        },
        {
          petition_id: template.id,
          left_side_petition_field_id: you.id,
          right_side_petition_field_id: yourContracts.id,
          profile_relationship_type_id: rContract.id,
          direction: "RIGHT_LEFT",
        },
      ]);

      /*
       * ========================
       * CREATE PROFILES
       * ========================
       */
      [mainProfile] = await mocks.createRandomProfiles(organization.id, individual.id, 1, () => ({
        localizable_name: { en: "Homer Simpson" },
      }));
      yourFamilyMemberProfiles = await mocks.createRandomProfiles(
        organization.id,
        individual.id,
        3,
        (i) => ({
          localizable_name: { en: ["Marge Bouvier", "Bart Simpson", "Lisa Simpson"][i] },
        }),
      );
      yourCompaniesProfiles = await mocks.createRandomProfiles(
        organization.id,
        legalEntity.id,
        2,
        (i) => ({
          localizable_name: { en: ["Springfield Nuclear Power Plant", "Moe's Tavern"][i] },
        }),
      );
      yourContractsProfiles = await mocks.createRandomProfiles(
        organization.id,
        contract.id,
        1,
        () => ({
          localizable_name: { en: "Contract with Springfield Nuclear Power Plant" },
        }),
      );

      /*
       * ========================
       * ADD RELATIONSHIPS
       * ========================
       */

      await mocks.knex.from("profile_relationship").insert([
        ...yourFamilyMemberProfiles.map((familyMember) => ({
          org_id: organization.id,
          created_by_user_id: user.id,
          left_side_profile_id: mainProfile.id,
          profile_relationship_type_id: rFamilyMember.id,
          right_side_profile_id: familyMember.id,
        })),
        ...yourCompaniesProfiles.map((company) => ({
          org_id: organization.id,
          created_by_user_id: user.id,
          left_side_profile_id: mainProfile.id,
          profile_relationship_type_id: rManagedCompany.id,
          right_side_profile_id: company.id,
        })),
        ...yourContractsProfiles.map((contract) => ({
          org_id: organization.id,
          created_by_user_id: user.id,
          left_side_profile_id: contract.id,
          profile_relationship_type_id: rContract.id,
          right_side_profile_id: mainProfile.id,
        })),
      ]);

      individualIdx = indexBy(individualProperties, (p) => p.alias);
      legalEntityIdx = indexBy(legalEntityProperties, (p) => p.alias);
      contractIdx = indexBy(contractProperties, (p) => p.alias);
      /*
       * ========================
       * FILL HOMER SIMPSON PROFILE
       * ========================
       */
      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_first_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Homer" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_last_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Simpson" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_email"].id,
          type: "SHORT_TEXT",
          content: { value: "homer@springfield.com" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_phone_number"].id,
          type: "PHONE",
          content: { value: "+34611611611" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_mobile_phone_number"].id,
          type: "PHONE",
          content: { value: "+34611611612" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_birth_date"].id,
          type: "DATE",
          content: { value: "1956-05-12" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_gender"].id,
          type: "SELECT",
          content: { value: "M" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_address"].id,
          type: "SHORT_TEXT",
          content: { value: "742 Evergreen Terrace" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_city"].id,
          type: "SHORT_TEXT",
          content: { value: "Springfield" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_zip"].id,
          type: "SHORT_TEXT",
          content: { value: "12345" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_country_of_residence"].id,
          type: "SHORT_TEXT",
          content: { value: "US" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_citizenship"].id,
          type: "SHORT_TEXT",
          content: { value: "US" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: { value: "123456789" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_passport_number"].id,
          type: "SHORT_TEXT",
          content: { value: "P123456789" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_is_pep"].id,
          type: "SELECT",
          content: { value: "N" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_risk"].id,
          type: "SELECT",
          content: { value: "MEDIUM" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_source_of_funds"].id,
          type: "TEXT",
          content: { value: "Salary" },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_background_check"].id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Homer Simpson",
              date: "1956-05-12",
              type: "PERSON",
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Simpson, Homer J",
                  properties: {},
                },
              ],
              createdAt: new Date().toISOString(),
            },
            entity: {
              id: "Q7747",
              type: "Person",
              name: "Simpson, Homer J",
              properties: {},
            },
          },
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_occupation"].id,
          type: "SHORT_TEXT",
          content: { value: "Nuclear Safety Inspector" },
          created_by_user_id: user.id,
        },
      ]);
      const homerFiles = await mocks.createRandomFileUpload(4, (i) => ({
        filename: [
          "proof_of_address_document__homer_simpson",
          "id_document__homer_simpson",
          "passport_document__homer_simpson",
          "risk_assessment__homer_simpson",
        ][i],
      }));
      await mocks.knex.from("profile_field_file").insert([
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_proof_of_address_document"].id,
          type: "FILE",
          file_upload_id: homerFiles.find(
            (f) => f.filename === "proof_of_address_document__homer_simpson",
          )!.id,
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_id_document"].id,
          type: "FILE",
          file_upload_id: homerFiles.find((f) => f.filename === "id_document__homer_simpson")!.id,
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_passport_document"].id,
          type: "FILE",
          file_upload_id: homerFiles.find((f) => f.filename === "passport_document__homer_simpson")!
            .id,
          created_by_user_id: user.id,
        },
        {
          profile_id: mainProfile.id,
          profile_type_field_id: individualIdx["p_risk_assessment"].id,
          type: "FILE",
          file_upload_id: homerFiles.find((f) => f.filename === "risk_assessment__homer_simpson")!
            .id,
          created_by_user_id: user.id,
        },
      ]);

      /*
       * ========================
       * FILL MARGE BOUVIER PROFILE
       * ========================
       */
      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_first_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Marge" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_last_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Bouvier" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_email"].id,
          type: "SHORT_TEXT",
          content: { value: "marge@springfield.com" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_phone_number"].id,
          type: "PHONE",
          content: { value: "+34611611613" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_mobile_phone_number"].id,
          type: "PHONE",
          content: { value: "+34611611614" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_birth_date"].id,
          type: "DATE",
          content: { value: "1956-10-12" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_gender"].id,
          type: "SELECT",
          content: { value: "F" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_address"].id,
          type: "SHORT_TEXT",
          content: { value: "742 Evergreen Terrace" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_city"].id,
          type: "SHORT_TEXT",
          content: { value: "Springfield" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_zip"].id,
          type: "SHORT_TEXT",
          content: { value: "12345" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_country_of_residence"].id,
          type: "SHORT_TEXT",
          content: { value: "US" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_citizenship"].id,
          type: "SHORT_TEXT",
          content: { value: "US" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: { value: "123456780" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_passport_number"].id,
          type: "SHORT_TEXT",
          content: { value: "X123456789" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_is_pep"].id,
          type: "SELECT",
          content: { value: "N" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_risk"].id,
          type: "SELECT",
          content: { value: "LOW" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_source_of_funds"].id,
          type: "TEXT",
          content: { value: "Husband" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_background_check"].id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Marge Bouvier",
              date: "1956-10-12",
              type: "PERSON",
            },
            search: {
              totalCount: 0,
              items: [],
              createdAt: new Date().toISOString(),
            },
            entity: null,
          },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_occupation"].id,
          type: "SHORT_TEXT",
          content: { value: "Housewife" },
          created_by_user_id: user.id,
        },
      ]);
      const margeFiles = await mocks.createRandomFileUpload(4, (i) => ({
        filename: [
          "proof_of_address_document__marge_bouvier",
          "id_document__marge_bouvier",
          "passport_document__marge_bouvier",
          "risk_assessment__marge_bouvier",
        ][i],
      }));
      await mocks.knex.from("profile_field_file").insert([
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_proof_of_address_document"].id,
          type: "FILE",
          file_upload_id: margeFiles.find(
            (f) => f.filename === "proof_of_address_document__marge_bouvier",
          )!.id,
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,

          profile_type_field_id: individualIdx["p_id_document"].id,
          type: "FILE",
          file_upload_id: margeFiles.find((f) => f.filename === "id_document__marge_bouvier")!.id,
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,

          profile_type_field_id: individualIdx["p_passport_document"].id,
          type: "FILE",
          file_upload_id: margeFiles.find((f) => f.filename === "passport_document__marge_bouvier")!
            .id,
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[0].id,
          profile_type_field_id: individualIdx["p_risk_assessment"].id,
          type: "FILE",
          file_upload_id: margeFiles.find((f) => f.filename === "risk_assessment__marge_bouvier")!
            .id,
          created_by_user_id: user.id,
        },
      ]);

      /*
       * ========================
       * FILL BART SIMPSON PROFILE
       * ========================
       */
      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: yourFamilyMemberProfiles[1].id,
          profile_type_field_id: individualIdx["p_first_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Bart" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[1].id,
          profile_type_field_id: individualIdx["p_last_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Simpson" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[1].id,
          profile_type_field_id: individualIdx["p_email"].id,
          type: "SHORT_TEXT",
          content: { value: "bart@springfield.com" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[1].id,
          profile_type_field_id: individualIdx["p_birth_date"].id,
          type: "DATE",
          content: { value: "1980-04-01" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[1].id,
          profile_type_field_id: individualIdx["p_gender"].id,
          type: "SELECT",
          content: { value: "M" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[1].id,
          profile_type_field_id: individualIdx["p_address"].id,
          type: "SHORT_TEXT",
          content: { value: "742 Evergreen Terrace" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[1].id,
          profile_type_field_id: individualIdx["p_city"].id,
          type: "SHORT_TEXT",
          content: { value: "Springfield" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[1].id,
          profile_type_field_id: individualIdx["p_zip"].id,
          type: "SHORT_TEXT",
          content: { value: "12345" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[1].id,
          profile_type_field_id: individualIdx["p_country_of_residence"].id,
          type: "SHORT_TEXT",
          content: { value: "US" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[1].id,
          profile_type_field_id: individualIdx["p_citizenship"].id,
          type: "SHORT_TEXT",
          content: { value: "US" },
          created_by_user_id: user.id,
        },
      ]);
      const bartFiles = await mocks.createRandomFileUpload(1, () => ({
        filename: "id_document__bart_simpson",
      }));
      await mocks.knex.from("profile_field_file").insert([
        {
          profile_id: yourFamilyMemberProfiles[1].id,
          profile_type_field_id: individualIdx["p_id_document"].id,
          type: "FILE",
          file_upload_id: bartFiles.find((f) => f.filename === "id_document__bart_simpson")!.id,
          created_by_user_id: user.id,
        },
      ]);

      /*
       * ========================
       * FILL LISA SIMPSON PROFILE
       * ========================
       */
      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: yourFamilyMemberProfiles[2].id,
          profile_type_field_id: individualIdx["p_first_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Lisa" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[2].id,
          profile_type_field_id: individualIdx["p_last_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Simpson" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[2].id,
          profile_type_field_id: individualIdx["p_email"].id,
          type: "SHORT_TEXT",
          content: { value: "lisa@springfield.com" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[2].id,
          profile_type_field_id: individualIdx["p_birth_date"].id,
          type: "DATE",
          content: { value: "1984-05-12" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[2].id,
          profile_type_field_id: individualIdx["p_gender"].id,
          type: "SELECT",
          content: { value: "F" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[2].id,
          profile_type_field_id: individualIdx["p_address"].id,
          type: "SHORT_TEXT",
          content: { value: "742 Evergreen Terrace" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourFamilyMemberProfiles[2].id,
          profile_type_field_id: individualIdx["p_city"].id,
          type: "SHORT_TEXT",
          content: { value: "Springfield" },
          created_by_user_id: user.id,
        },
      ]);
      const lisaFiles = await mocks.createRandomFileUpload(1, () => ({
        filename: "id_document__lisa_simpson",
      }));
      await mocks.knex.from("profile_field_file").insert([
        {
          profile_id: yourFamilyMemberProfiles[2].id,
          profile_type_field_id: individualIdx["p_id_document"].id,
          type: "FILE",
          file_upload_id: lisaFiles.find((f) => f.filename === "id_document__lisa_simpson")!.id,
          created_by_user_id: user.id,
        },
      ]);

      /*
       * ========================
       * FILL MOE'S TAVERN PROFILE
       * ========================
       */
      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: yourCompaniesProfiles[0].id,
          profile_type_field_id: legalEntityIdx["p_entity_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Moe's Tavern" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[0].id,
          profile_type_field_id: legalEntityIdx["p_trade_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Moe's Tavern INC" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[0].id,
          profile_type_field_id: legalEntityIdx["p_entity_type"].id,
          type: "SELECT",
          content: { value: "INCORPORATED" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[0].id,
          profile_type_field_id: legalEntityIdx["p_registration_number"].id,
          type: "SHORT_TEXT",
          content: { value: "12345" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[0].id,
          profile_type_field_id: legalEntityIdx["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: { value: "123456789" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[0].id,
          profile_type_field_id: legalEntityIdx["p_registered_address"].id,
          type: "SHORT_TEXT",
          content: { value: "123 Main Street" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[0].id,
          profile_type_field_id: legalEntityIdx["p_city"].id,
          type: "SHORT_TEXT",
          content: { value: "Springfield" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[0].id,
          profile_type_field_id: legalEntityIdx["p_zip"].id,
          type: "SHORT_TEXT",
          content: { value: "123" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[0].id,
          profile_type_field_id: legalEntityIdx["p_country_of_incorporation"].id,
          type: "SELECT",
          content: { value: "US" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[0].id,
          profile_type_field_id: legalEntityIdx["p_date_of_incorporation"].id,
          type: "DATE",
          content: { value: "1980-01-01" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[0].id,
          profile_type_field_id: legalEntityIdx["p_main_business_activity"].id,
          type: "SHORT_TEXT",
          content: { value: "Bar" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[0].id,
          profile_type_field_id: legalEntityIdx["p_risk"].id,
          type: "SELECT",
          content: { value: "LOW" },
          created_by_user_id: user.id,
        },
      ]);
      const moesFiles = await mocks.createRandomFileUpload(1, () => ({
        filename: "financial_statements__moes_tavern",
      }));
      await mocks.knex.from("profile_field_file").insert([
        {
          profile_id: yourCompaniesProfiles[0].id,
          profile_type_field_id: legalEntityIdx["p_financial_statements"].id,
          type: "FILE",
          file_upload_id: moesFiles.find((f) => f.filename === "financial_statements__moes_tavern")!
            .id,
          created_by_user_id: user.id,
        },
      ]);

      /*
       * ========================
       * FILL POWER PLANT PROFILE
       * ========================
       */
      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_entity_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Springfield Nuclear Power Plant" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_trade_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Springfield Nuclear Power Plant LLC" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_entity_type"].id,
          type: "SELECT",
          content: { value: "LIMITED_LIABILITY_COMPANY" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_registration_number"].id,
          type: "SHORT_TEXT",
          content: { value: "123456789" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: { value: "TAX123" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_registered_address"].id,
          type: "SHORT_TEXT",
          content: { value: "123 Industrial Av" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_city"].id,
          type: "SHORT_TEXT",
          content: { value: "Springfield" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_zip"].id,
          type: "SHORT_TEXT",
          content: { value: "12345" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_country_of_incorporation"].id,
          type: "SELECT",
          content: { value: "US" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_date_of_incorporation"].id,
          type: "DATE",
          content: { value: "1900-01-01" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_main_business_activity"].id,
          type: "SHORT_TEXT",
          content: { value: "Power Plant" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_risk"].id,
          type: "SELECT",
          content: { value: "HIGH" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_poa_types"].id,
          type: "SELECT",
          content: { value: "SPECIAL_POA" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_poa_scope"].id,
          type: "SHORT_TEXT",
          content: { value: "All" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_poa_effective_date"].id,
          type: "DATE",
          content: { value: "1900-01-01" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_poa_expiration_date"].id,
          type: "DATE",
          content: { value: "2000-01-01" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_poa_revocation_conditions"].id,
          type: "SHORT_TEXT",
          content: { value: "None" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_poa_registered"].id,
          type: "SELECT",
          content: { value: "Y" },
          created_by_user_id: user.id,
        },
      ]);
      const powerPlantFiles = await mocks.createRandomFileUpload(5, (i) => ({
        filename: [
          "ownership_structure__power_plant",
          "ubo_statement__power_plant",
          "financial_statements__power_plant",
          "risk_assessment__power_plant",
          "poa_document__power_plant",
        ][i],
      }));
      await mocks.knex.from("profile_field_file").insert([
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_ownership_structure"].id,
          type: "FILE",
          file_upload_id: powerPlantFiles.find(
            (f) => f.filename === "ownership_structure__power_plant",
          )!.id,
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_ubo_statement"].id,
          type: "FILE",
          file_upload_id: powerPlantFiles.find((f) => f.filename === "ubo_statement__power_plant")!
            .id,
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_financial_statements"].id,
          type: "FILE",
          file_upload_id: powerPlantFiles.find(
            (f) => f.filename === "financial_statements__power_plant",
          )!.id,
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_risk_assessment"].id,
          type: "FILE",
          file_upload_id: powerPlantFiles.find(
            (f) => f.filename === "risk_assessment__power_plant",
          )!.id,
          created_by_user_id: user.id,
        },
        {
          profile_id: yourCompaniesProfiles[1].id,
          profile_type_field_id: legalEntityIdx["p_poa_document"].id,
          type: "FILE",
          file_upload_id: powerPlantFiles.find((f) => f.filename === "poa_document__power_plant")!
            .id,
          created_by_user_id: user.id,
        },
      ]);

      /*
       * ========================
       * FILL CONTRACT PROFILE
       * ========================
       */
      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_counterparty"].id,
          type: "SHORT_TEXT",
          content: { value: "Homer Simpson" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_contract_type"].id,
          type: "SELECT",
          content: { value: "EMPLOYMENT_CONTRACT" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_effective_date"].id,
          type: "DATE",
          content: { value: "1980-01-01" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_expiration_date"].id,
          type: "DATE",
          content: { value: "1990-01-01" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_jurisdiction"].id,
          type: "SELECT",
          content: { value: "US" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_contract_value"].id,
          type: "NUMBER",
          content: { value: 1500 },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_contract_currency"].id,
          type: "SELECT",
          content: { value: "USD" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_payment_terms"].id,
          type: "SHORT_TEXT",
          content: { value: "Monthly" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_renewal_terms"].id,
          type: "SHORT_TEXT",
          content: { value: "Based on performance" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_termination_clauses"].id,
          type: "SHORT_TEXT",
          content: { value: "None" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_confidentiality_agreement"].id,
          type: "SELECT",
          content: { value: "Y" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_performance_metrics"].id,
          type: "SHORT_TEXT",
          content: { value: "None" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_dispute_resolution_mechanism"].id,
          type: "SHORT_TEXT",
          content: { value: "None" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_compliance_obligations"].id,
          type: "SHORT_TEXT",
          content: { value: "None" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_security_provisions"].id,
          type: "SHORT_TEXT",
          content: { value: "None" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_notes"].id,
          type: "TEXT",
          content: { value: "None" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_billing_contact_full_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Homer Simpson" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_billing_contact_email"].id,
          type: "SHORT_TEXT",
          content: { value: "homer@springfield.com" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_legal_contact_full_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Montgomery Burns" },
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_legal_contact_email"].id,
          type: "SHORT_TEXT",
          content: { value: "monty@springfield.com" },
          created_by_user_id: user.id,
        },
      ]);
      const powerPlantContractFiles = await mocks.createRandomFileUpload(2, (i) => ({
        filename: ["original_document__power_plant_contract", "amendments__power_plant_contract"][
          i
        ],
      }));
      await mocks.knex.from("profile_field_file").insert([
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_original_document"].id,
          type: "FILE",
          file_upload_id: powerPlantContractFiles.find(
            (f) => f.filename === "original_document__power_plant_contract",
          )!.id,
          created_by_user_id: user.id,
        },
        {
          profile_id: yourContractsProfiles[0].id,
          profile_type_field_id: contractIdx["p_amendments"].id,
          type: "FILE",
          file_upload_id: powerPlantContractFiles.find(
            (f) => f.filename === "amendments__power_plant_contract",
          )!.id,
          created_by_user_id: user.id,
        },
      ]);
    });

    it("creates a petition with groups prefilled from a profile and all its relationships", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $templateId: GID!
            $profileId: GID!
            $petitionFieldId: GID
            $prefill: [CreatePetitionFromProfilePrefillInput!]!
          ) {
            createPetitionFromProfile(
              templateId: $templateId
              petitionFieldId: $petitionFieldId
              profileId: $profileId
              prefill: $prefill
            ) {
              id
              fields {
                type
                fromPetitionFieldId
                replies {
                  associatedProfile {
                    id
                  }
                  children {
                    field {
                      type
                      fromPetitionFieldId
                      profileTypeField {
                        id
                      }
                    }
                    replies {
                      content
                    }
                  }
                }
              }
            }
          }
        `,
        {
          templateId: toGlobalId("Petition", template.id),
          petitionFieldId: toGlobalId("PetitionField", you.id),
          profileId: toGlobalId("Profile", mainProfile.id),
          prefill: [
            {
              petitionFieldId: toGlobalId("PetitionField", you.id),
              profileIds: [toGlobalId("Profile", mainProfile.id)],
            },
            {
              petitionFieldId: toGlobalId("PetitionField", yourFamily.id),
              profileIds: yourFamilyMemberProfiles.map((p) => toGlobalId("Profile", p.id)),
            },
            {
              petitionFieldId: toGlobalId("PetitionField", yourCompanies.id),
              profileIds: yourCompaniesProfiles.map((p) => toGlobalId("Profile", p.id)),
            },
            {
              petitionFieldId: toGlobalId("PetitionField", yourContracts.id),
              profileIds: yourContractsProfiles.map((p) => toGlobalId("Profile", p.id)),
            },
          ],
        },
      );

      expect(errors).toBeUndefined();

      expect(data?.createPetitionFromProfile).toEqual({
        id: expect.any(String),
        fields: [
          {
            type: "FIELD_GROUP",
            fromPetitionFieldId: toGlobalId("PetitionField", you.id),
            replies: [
              {
                associatedProfile: {
                  id: toGlobalId("Profile", mainProfile.id),
                },
                children: [
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_first_name"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_first_name"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Homer",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_last_name"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_last_name"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Simpson",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_email"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_email"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "homer@springfield.com",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "PHONE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_phone_number"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_phone_number"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "+34611611611",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "PHONE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) =>
                            f.profile_type_field_id === individualIdx["p_mobile_phone_number"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          individualIdx["p_mobile_phone_number"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "+34611611612",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "DATE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_birth_date"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_birth_date"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "1956-05-12",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_gender"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_gender"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "M",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_address"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_address"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "742 Evergreen Terrace",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_city"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_city"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Springfield",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_zip"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_zip"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "12345",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) =>
                            f.profile_type_field_id === individualIdx["p_country_of_residence"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          individualIdx["p_country_of_residence"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "US",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) =>
                            f.profile_type_field_id ===
                            individualIdx["p_proof_of_address_document"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          individualIdx["p_proof_of_address_document"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "proof_of_address_document__homer_simpson",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_citizenship"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_citizenship"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "US",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_tax_id"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_tax_id"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "123456789",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_id_document"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_id_document"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "id_document__homer_simpson",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) =>
                            f.profile_type_field_id === individualIdx["p_passport_document"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_passport_document"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "passport_document__homer_simpson",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_passport_number"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_passport_number"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "P123456789",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_is_pep"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_is_pep"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "N",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_risk"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_risk"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "MEDIUM",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_risk_assessment"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_risk_assessment"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "risk_assessment__homer_simpson",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_source_of_funds"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_source_of_funds"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Salary",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "BACKGROUND_CHECK",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_background_check"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_background_check"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          query: {
                            name: "Homer Simpson",
                            date: "1956-05-12",
                            type: "PERSON",
                          },
                          search: {
                            totalCount: 1,
                          },
                          entity: {
                            id: "Q7747",
                            type: "Person",
                            name: "Simpson, Homer J",
                            properties: {},
                          },
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        youChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_occupation"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_occupation"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Nuclear Safety Inspector",
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "FIELD_GROUP",
            fromPetitionFieldId: toGlobalId("PetitionField", yourFamily.id),
            replies: [
              {
                associatedProfile: {
                  id: toGlobalId("Profile", yourFamilyMemberProfiles[0].id),
                },
                children: [
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_first_name"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_first_name"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Marge",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_last_name"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_last_name"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Bouvier",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_email"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_email"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "marge@springfield.com",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "PHONE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_phone_number"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_phone_number"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "+34611611613",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "PHONE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) =>
                            f.profile_type_field_id === individualIdx["p_mobile_phone_number"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          individualIdx["p_mobile_phone_number"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "+34611611614",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "DATE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_birth_date"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_birth_date"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "1956-10-12",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_gender"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_gender"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "F",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_address"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_address"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "742 Evergreen Terrace",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_city"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_city"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Springfield",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_zip"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_zip"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "12345",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) =>
                            f.profile_type_field_id === individualIdx["p_country_of_residence"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          individualIdx["p_country_of_residence"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "US",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) =>
                            f.profile_type_field_id ===
                            individualIdx["p_proof_of_address_document"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          individualIdx["p_proof_of_address_document"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "proof_of_address_document__marge_bouvier",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_citizenship"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_citizenship"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "US",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_tax_id"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_tax_id"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "123456780",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_id_document"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_id_document"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "id_document__marge_bouvier",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) =>
                            f.profile_type_field_id === individualIdx["p_passport_document"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_passport_document"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "passport_document__marge_bouvier",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_passport_number"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_passport_number"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "X123456789",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_is_pep"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_is_pep"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "N",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_risk"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_risk"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "LOW",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_risk_assessment"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_risk_assessment"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "risk_assessment__marge_bouvier",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_source_of_funds"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_source_of_funds"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Husband",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "BACKGROUND_CHECK",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_background_check"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_background_check"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          query: {
                            name: "Marge Bouvier",
                            date: "1956-10-12",
                            type: "PERSON",
                          },
                          search: {
                            totalCount: 0,
                          },
                          entity: null,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_occupation"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_occupation"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Housewife",
                        },
                      },
                    ],
                  },
                ],
              },
              {
                associatedProfile: {
                  id: toGlobalId("Profile", yourFamilyMemberProfiles[1].id),
                },
                children: [
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_first_name"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_first_name"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Bart",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_last_name"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_last_name"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Simpson",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_email"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_email"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "bart@springfield.com",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "PHONE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_phone_number"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_phone_number"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "PHONE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) =>
                            f.profile_type_field_id === individualIdx["p_mobile_phone_number"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          individualIdx["p_mobile_phone_number"].id,
                        ),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "DATE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_birth_date"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_birth_date"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "1980-04-01",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_gender"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_gender"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "M",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_address"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_address"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "742 Evergreen Terrace",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_city"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_city"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Springfield",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_zip"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_zip"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "12345",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) =>
                            f.profile_type_field_id === individualIdx["p_country_of_residence"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          individualIdx["p_country_of_residence"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "US",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) =>
                            f.profile_type_field_id ===
                            individualIdx["p_proof_of_address_document"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          individualIdx["p_proof_of_address_document"].id,
                        ),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_citizenship"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_citizenship"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "US",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_tax_id"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_tax_id"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_id_document"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_id_document"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "id_document__bart_simpson",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) =>
                            f.profile_type_field_id === individualIdx["p_passport_document"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_passport_document"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_passport_number"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_passport_number"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_is_pep"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_is_pep"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_risk"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_risk"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_risk_assessment"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_risk_assessment"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_source_of_funds"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_source_of_funds"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "BACKGROUND_CHECK",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_background_check"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_background_check"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_occupation"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_occupation"].id),
                      },
                    },
                    replies: [],
                  },
                ],
              },
              {
                associatedProfile: {
                  id: toGlobalId("Profile", yourFamilyMemberProfiles[2].id),
                },
                children: [
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_first_name"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_first_name"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Lisa",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_last_name"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_last_name"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Simpson",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_email"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_email"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "lisa@springfield.com",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "PHONE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_phone_number"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_phone_number"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "PHONE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) =>
                            f.profile_type_field_id === individualIdx["p_mobile_phone_number"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          individualIdx["p_mobile_phone_number"].id,
                        ),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "DATE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_birth_date"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_birth_date"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "1984-05-12",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_gender"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_gender"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "F",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_address"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_address"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "742 Evergreen Terrace",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_city"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_city"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Springfield",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_zip"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_zip"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) =>
                            f.profile_type_field_id === individualIdx["p_country_of_residence"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          individualIdx["p_country_of_residence"].id,
                        ),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) =>
                            f.profile_type_field_id ===
                            individualIdx["p_proof_of_address_document"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          individualIdx["p_proof_of_address_document"].id,
                        ),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_citizenship"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_citizenship"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_tax_id"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_tax_id"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_id_document"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_id_document"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "id_document__lisa_simpson",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) =>
                            f.profile_type_field_id === individualIdx["p_passport_document"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_passport_document"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_passport_number"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_passport_number"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_is_pep"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_is_pep"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_risk"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_risk"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_risk_assessment"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_risk_assessment"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_source_of_funds"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_source_of_funds"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "BACKGROUND_CHECK",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_background_check"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_background_check"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourFamilyChildren.find(
                          (f) => f.profile_type_field_id === individualIdx["p_occupation"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", individualIdx["p_occupation"].id),
                      },
                    },
                    replies: [],
                  },
                ],
              },
            ],
          },
          {
            type: "FIELD_GROUP",
            fromPetitionFieldId: toGlobalId("PetitionField", yourCompanies.id),
            replies: [
              {
                associatedProfile: {
                  id: toGlobalId("Profile", yourCompaniesProfiles[0].id),
                },
                children: [
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_entity_name"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_entity_name"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Moe's Tavern",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_trade_name"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_trade_name"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Moe's Tavern INC",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_entity_type"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_entity_type"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "INCORPORATED",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id === legalEntityIdx["p_registration_number"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_registration_number"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "12345",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_tax_id"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_tax_id"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "123456789",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id === legalEntityIdx["p_registered_address"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_registered_address"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "123 Main Street",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_city"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_city"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Springfield",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_zip"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_zip"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "123",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id ===
                            legalEntityIdx["p_country_of_incorporation"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_country_of_incorporation"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "US",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "DATE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id ===
                            legalEntityIdx["p_date_of_incorporation"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_date_of_incorporation"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "1980-01-01",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id ===
                            legalEntityIdx["p_main_business_activity"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_main_business_activity"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Bar",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id === legalEntityIdx["p_ownership_structure"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_ownership_structure"].id,
                        ),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_ubo_statement"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_ubo_statement"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id === legalEntityIdx["p_financial_statements"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_financial_statements"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "financial_statements__moes_tavern",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_risk"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_risk"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "LOW",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_risk_assessment"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_risk_assessment"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_poa_types"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_poa_types"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_poa_scope"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_poa_scope"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_poa_document"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_poa_document"].id),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "DATE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id === legalEntityIdx["p_poa_effective_date"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_poa_effective_date"].id,
                        ),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "DATE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id === legalEntityIdx["p_poa_expiration_date"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_poa_expiration_date"].id,
                        ),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id ===
                            legalEntityIdx["p_poa_revocation_conditions"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_poa_revocation_conditions"].id,
                        ),
                      },
                    },
                    replies: [],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_poa_registered"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_poa_registered"].id),
                      },
                    },
                    replies: [],
                  },
                ],
              },
              {
                associatedProfile: {
                  id: toGlobalId("Profile", yourCompaniesProfiles[1].id),
                },
                children: [
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_entity_name"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_entity_name"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Springfield Nuclear Power Plant",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_trade_name"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_trade_name"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Springfield Nuclear Power Plant LLC",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_entity_type"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_entity_type"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "LIMITED_LIABILITY_COMPANY",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id === legalEntityIdx["p_registration_number"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_registration_number"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "123456789",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_tax_id"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_tax_id"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "TAX123",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id === legalEntityIdx["p_registered_address"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_registered_address"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "123 Industrial Av",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_city"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_city"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Springfield",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_zip"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_zip"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "12345",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id ===
                            legalEntityIdx["p_country_of_incorporation"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_country_of_incorporation"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "US",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "DATE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id ===
                            legalEntityIdx["p_date_of_incorporation"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_date_of_incorporation"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "1900-01-01",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id ===
                            legalEntityIdx["p_main_business_activity"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_main_business_activity"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Power Plant",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id === legalEntityIdx["p_ownership_structure"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_ownership_structure"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "ownership_structure__power_plant",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_ubo_statement"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_ubo_statement"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "ubo_statement__power_plant",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id === legalEntityIdx["p_financial_statements"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_financial_statements"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "financial_statements__power_plant",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_risk"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_risk"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "HIGH",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_risk_assessment"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_risk_assessment"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "risk_assessment__power_plant",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_poa_types"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_poa_types"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "SPECIAL_POA",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_poa_scope"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_poa_scope"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "All",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_poa_document"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_poa_document"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "poa_document__power_plant",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "DATE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id === legalEntityIdx["p_poa_effective_date"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_poa_effective_date"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "1900-01-01",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "DATE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id === legalEntityIdx["p_poa_expiration_date"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_poa_expiration_date"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "2000-01-01",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) =>
                            f.profile_type_field_id ===
                            legalEntityIdx["p_poa_revocation_conditions"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          legalEntityIdx["p_poa_revocation_conditions"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "None",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourCompaniesChildren.find(
                          (f) => f.profile_type_field_id === legalEntityIdx["p_poa_registered"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", legalEntityIdx["p_poa_registered"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Y",
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "FIELD_GROUP",
            fromPetitionFieldId: toGlobalId("PetitionField", yourContracts.id),
            replies: [
              {
                associatedProfile: {
                  id: toGlobalId("Profile", yourContractsProfiles[0].id),
                },
                children: [
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) => f.profile_type_field_id === contractIdx["p_counterparty"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_counterparty"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Homer Simpson",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) => f.profile_type_field_id === contractIdx["p_contract_type"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_contract_type"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "EMPLOYMENT_CONTRACT",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "DATE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) => f.profile_type_field_id === contractIdx["p_effective_date"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_effective_date"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "1980-01-01",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "DATE",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) => f.profile_type_field_id === contractIdx["p_expiration_date"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_expiration_date"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "1990-01-01",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) => f.profile_type_field_id === contractIdx["p_jurisdiction"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_jurisdiction"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "US",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "NUMBER",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) => f.profile_type_field_id === contractIdx["p_contract_value"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_contract_value"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: 1500,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) => f.profile_type_field_id === contractIdx["p_contract_currency"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_contract_currency"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "USD",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) => f.profile_type_field_id === contractIdx["p_payment_terms"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_payment_terms"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Monthly",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) => f.profile_type_field_id === contractIdx["p_renewal_terms"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_renewal_terms"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Based on performance",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) => f.profile_type_field_id === contractIdx["p_original_document"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_original_document"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "original_document__power_plant_contract",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "FILE_UPLOAD",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) => f.profile_type_field_id === contractIdx["p_amendments"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_amendments"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          id: expect.any(String),
                          filename: "amendments__power_plant_contract",
                          size: "100",
                          contentType: "application/pdf",
                          extension: "pdf",
                          uploadComplete: true,
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) =>
                            f.profile_type_field_id === contractIdx["p_termination_clauses"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_termination_clauses"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "None",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SELECT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) =>
                            f.profile_type_field_id ===
                            contractIdx["p_confidentiality_agreement"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          contractIdx["p_confidentiality_agreement"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Y",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) =>
                            f.profile_type_field_id === contractIdx["p_performance_metrics"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_performance_metrics"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "None",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) =>
                            f.profile_type_field_id ===
                            contractIdx["p_dispute_resolution_mechanism"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          contractIdx["p_dispute_resolution_mechanism"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "None",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) =>
                            f.profile_type_field_id === contractIdx["p_compliance_obligations"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          contractIdx["p_compliance_obligations"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "None",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) =>
                            f.profile_type_field_id === contractIdx["p_security_provisions"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_security_provisions"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "None",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) => f.profile_type_field_id === contractIdx["p_notes"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_notes"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "None",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) =>
                            f.profile_type_field_id ===
                            contractIdx["p_billing_contact_full_name"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          contractIdx["p_billing_contact_full_name"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Homer Simpson",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) =>
                            f.profile_type_field_id === contractIdx["p_billing_contact_email"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          contractIdx["p_billing_contact_email"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "homer@springfield.com",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) =>
                            f.profile_type_field_id === contractIdx["p_legal_contact_full_name"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId(
                          "ProfileTypeField",
                          contractIdx["p_legal_contact_full_name"].id,
                        ),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "Montgomery Burns",
                        },
                      },
                    ],
                  },
                  {
                    field: {
                      type: "SHORT_TEXT",
                      fromPetitionFieldId: toGlobalId(
                        "PetitionField",
                        yourContractsChildren.find(
                          (f) =>
                            f.profile_type_field_id === contractIdx["p_legal_contact_email"].id,
                        )!.id,
                      ),
                      profileTypeField: {
                        id: toGlobalId("ProfileTypeField", contractIdx["p_legal_contact_email"].id),
                      },
                    },
                    replies: [
                      {
                        content: {
                          value: "monty@springfield.com",
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("creates an empty petition if passing empty prefill input", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $templateId: GID!
            $profileId: GID!
            $petitionFieldId: GID
            $prefill: [CreatePetitionFromProfilePrefillInput!]!
          ) {
            createPetitionFromProfile(
              templateId: $templateId
              petitionFieldId: $petitionFieldId
              profileId: $profileId
              prefill: $prefill
            ) {
              id
            }
          }
        `,
        {
          templateId: toGlobalId("Petition", template.id),
          profileId: toGlobalId("Profile", mainProfile.id),
          petitionFieldId: null,
          prefill: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFromProfile).toEqual({
        id: expect.any(String),
      });

      const dbFields = await mocks.knex
        .from("petition_field")
        .where("petition_id", fromGlobalId(data!.createPetitionFromProfile.id).id)
        .whereNull("deleted_at")
        .select("*");

      const dbReplies = await mocks.knex
        .from("petition_field_reply")
        .whereIn(
          "petition_field_id",
          dbFields.map((f) => f.id),
        )
        .whereNull("deleted_at")
        .select("*");

      expect(dbReplies).toHaveLength(4);

      expect(
        // only replies are the "empty" ones for each field group
        dbReplies.every(
          (r) => r.parent_petition_field_reply_id === null && r.type === "FIELD_GROUP",
        ),
      ).toBeTrue();
    });

    it("sends error if profiles are not previously associated", async () => {
      const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);

      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $templateId: GID!
            $petitionFieldId: GID
            $profileId: GID!
            $prefill: [CreatePetitionFromProfilePrefillInput!]!
          ) {
            createPetitionFromProfile(
              templateId: $templateId
              petitionFieldId: $petitionFieldId
              profileId: $profileId
              prefill: $prefill
            ) {
              id
            }
          }
        `,
        {
          templateId: toGlobalId("Petition", template.id),
          petitionFieldId: toGlobalId("PetitionField", yourFamily.id),
          profileId: toGlobalId("Profile", mainProfile.id),
          prefill: [
            {
              petitionFieldId: toGlobalId("PetitionField", yourFamily.id),
              profileIds: [toGlobalId("Profile", profile.id)],
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if field is not linked to same profile type id as its profiles", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $templateId: GID!
            $profileId: GID!
            $petitionFieldId: GID
            $prefill: [CreatePetitionFromProfilePrefillInput!]!
          ) {
            createPetitionFromProfile(
              templateId: $templateId
              petitionFieldId: $petitionFieldId
              profileId: $profileId
              prefill: $prefill
            ) {
              id
            }
          }
        `,
        {
          templateId: toGlobalId("Petition", template.id),
          petitionFieldId: toGlobalId("PetitionField", yourFamily.id),
          profileId: toGlobalId("Profile", mainProfile.id),
          prefill: [
            {
              petitionFieldId: toGlobalId("PetitionField", yourFamily.id),
              profileIds: [toGlobalId("Profile", yourCompaniesProfiles[0].id)],
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if trying to input 2 profiles on a single-reply field", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $templateId: GID!
            $profileId: GID!
            $petitionFieldId: GID
            $prefill: [CreatePetitionFromProfilePrefillInput!]!
          ) {
            createPetitionFromProfile(
              templateId: $templateId
              petitionFieldId: $petitionFieldId
              profileId: $profileId
              prefill: $prefill
            ) {
              id
            }
          }
        `,
        {
          templateId: toGlobalId("Petition", template.id),
          petitionFieldId: toGlobalId("PetitionField", you.id),
          profileId: toGlobalId("Profile", mainProfile.id),
          prefill: [
            {
              petitionFieldId: toGlobalId("PetitionField", you.id),
              profileIds: [
                toGlobalId("Profile", mainProfile.id),
                toGlobalId("Profile", yourFamilyMemberProfiles[0].id),
              ],
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if fields are repeated on prefill input", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $templateId: GID!
            $petitionFieldId: GID
            $profileId: GID!
            $prefill: [CreatePetitionFromProfilePrefillInput!]!
          ) {
            createPetitionFromProfile(
              templateId: $templateId
              petitionFieldId: $petitionFieldId
              profileId: $profileId
              prefill: $prefill
            ) {
              id
            }
          }
        `,
        {
          templateId: toGlobalId("Petition", template.id),
          petitionFieldId: toGlobalId("PetitionField", yourFamily.id),
          profileId: toGlobalId("Profile", mainProfile.id),
          prefill: [
            {
              petitionFieldId: toGlobalId("PetitionField", yourFamily.id),
              profileIds: [toGlobalId("Profile", yourFamilyMemberProfiles[0].id)],
            },
            {
              petitionFieldId: toGlobalId("PetitionField", yourFamily.id),
              profileIds: [toGlobalId("Profile", yourFamilyMemberProfiles[1].id)],
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("ignores hidden properties on profiles", async () => {
      const updatedFields = await mocks.knex
        .from("profile_type_field")
        .whereIn("alias", [
          "p_email",
          "p_city",
          "p_address",
          "p_proof_of_address_document",
          "p_id_document",
          "p_risk",
          "p_background_check",
        ])
        .update({ permission: "HIDDEN" })
        .returning("*");

      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $templateId: GID!
            $petitionFieldId: GID
            $profileId: GID!
            $prefill: [CreatePetitionFromProfilePrefillInput!]!
          ) {
            createPetitionFromProfile(
              templateId: $templateId
              petitionFieldId: $petitionFieldId
              profileId: $profileId
              prefill: $prefill
            ) {
              id
              fields {
                type
                fromPetitionFieldId
                replies {
                  associatedProfile {
                    id
                  }
                  children {
                    field {
                      type
                      fromPetitionFieldId
                      profileTypeField {
                        id
                      }
                    }
                    replies {
                      content
                    }
                  }
                }
              }
            }
          }
        `,
        {
          templateId: toGlobalId("Petition", template.id),
          petitionFieldId: toGlobalId("PetitionField", you.id),
          profileId: toGlobalId("Profile", mainProfile.id),
          prefill: [
            {
              petitionFieldId: toGlobalId("PetitionField", you.id),
              profileIds: [toGlobalId("Profile", mainProfile.id)],
            },
          ],
        },
      );

      expect(errors).toBeUndefined();

      expect(data?.createPetitionFromProfile.fields[0]).toEqual({
        type: "FIELD_GROUP",
        fromPetitionFieldId: toGlobalId("PetitionField", you.id),
        replies: [
          {
            associatedProfile: {
              id: toGlobalId("Profile", mainProfile.id),
            },
            children: [
              {
                field: {
                  type: "SHORT_TEXT",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_first_name"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_first_name"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      value: "Homer",
                    },
                  },
                ],
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_last_name"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_last_name"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      value: "Simpson",
                    },
                  },
                ],
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_email"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_email"].id),
                  },
                },
                replies: [],
              },
              {
                field: {
                  type: "PHONE",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_phone_number"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_phone_number"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      value: "+34611611611",
                    },
                  },
                ],
              },
              {
                field: {
                  type: "PHONE",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_mobile_phone_number"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_mobile_phone_number"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      value: "+34611611612",
                    },
                  },
                ],
              },
              {
                field: {
                  type: "DATE",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_birth_date"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_birth_date"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      value: "1956-05-12",
                    },
                  },
                ],
              },
              {
                field: {
                  type: "SELECT",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_gender"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_gender"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      value: "M",
                    },
                  },
                ],
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_address"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_address"].id),
                  },
                },
                replies: [],
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find((f) => f.profile_type_field_id === individualIdx["p_city"].id)!
                      .id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_city"].id),
                  },
                },
                replies: [],
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find((f) => f.profile_type_field_id === individualIdx["p_zip"].id)!
                      .id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_zip"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      value: "12345",
                    },
                  },
                ],
              },
              {
                field: {
                  type: "SELECT",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_country_of_residence"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_country_of_residence"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      value: "US",
                    },
                  },
                ],
              },
              {
                field: {
                  type: "FILE_UPLOAD",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) =>
                        f.profile_type_field_id === individualIdx["p_proof_of_address_document"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId(
                      "ProfileTypeField",
                      individualIdx["p_proof_of_address_document"].id,
                    ),
                  },
                },
                replies: [],
              },
              {
                field: {
                  type: "SELECT",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_citizenship"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_citizenship"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      value: "US",
                    },
                  },
                ],
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_tax_id"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_tax_id"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      value: "123456789",
                    },
                  },
                ],
              },
              {
                field: {
                  type: "FILE_UPLOAD",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_id_document"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_id_document"].id),
                  },
                },
                replies: [],
              },
              {
                field: {
                  type: "FILE_UPLOAD",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_passport_document"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_passport_document"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      id: expect.any(String),
                      filename: "passport_document__homer_simpson",
                      size: "100",
                      contentType: "application/pdf",
                      extension: "pdf",
                      uploadComplete: true,
                    },
                  },
                ],
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_passport_number"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_passport_number"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      value: "P123456789",
                    },
                  },
                ],
              },
              {
                field: {
                  type: "SELECT",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_is_pep"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_is_pep"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      value: "N",
                    },
                  },
                ],
              },
              {
                field: {
                  type: "SELECT",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find((f) => f.profile_type_field_id === individualIdx["p_risk"].id)!
                      .id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_risk"].id),
                  },
                },
                replies: [],
              },
              {
                field: {
                  type: "FILE_UPLOAD",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_risk_assessment"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_risk_assessment"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      id: expect.any(String),
                      filename: "risk_assessment__homer_simpson",
                      size: "100",
                      contentType: "application/pdf",
                      extension: "pdf",
                      uploadComplete: true,
                    },
                  },
                ],
              },
              {
                field: {
                  type: "TEXT",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_source_of_funds"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_source_of_funds"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      value: "Salary",
                    },
                  },
                ],
              },
              {
                field: {
                  type: "BACKGROUND_CHECK",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_background_check"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_background_check"].id),
                  },
                },
                replies: [],
              },
              {
                field: {
                  type: "SHORT_TEXT",
                  fromPetitionFieldId: toGlobalId(
                    "PetitionField",
                    youChildren.find(
                      (f) => f.profile_type_field_id === individualIdx["p_occupation"].id,
                    )!.id,
                  ),
                  profileTypeField: {
                    id: toGlobalId("ProfileTypeField", individualIdx["p_occupation"].id),
                  },
                },
                replies: [
                  {
                    content: {
                      value: "Nuclear Safety Inspector",
                    },
                  },
                ],
              },
            ],
          },
        ],
      });

      await mocks.knex
        .from("profile_type_field")
        .whereIn(
          "id",
          updatedFields.map((f) => f.id),
        )
        .update({ permission: "WRITE" });
    });
  });

  describe("createFieldGroupReplyFromProfile", () => {
    let petition: Petition;
    let fieldGroup: PetitionField;
    let groupChildren: PetitionField[];

    let profile: Profile;
    let profileType: ProfileType;
    let propertiesIdx: Record<string, ProfileTypeField>;

    beforeAll(async () => {
      [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      const properties = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        ProfileTypeFieldTypeValues.length,
        (i) => {
          const type = ProfileTypeFieldTypeValues[i];
          return {
            type,
            position: i,
            alias: type.toLowerCase(),
            options:
              type === "DATE"
                ? { useReplyAsExpiryDate: false }
                : type === "SELECT"
                  ? {
                      values: [
                        { label: { en: "High", es: "Alto" }, value: "HIGH" },
                        { label: { en: "Medium", es: "Medio" }, value: "MEDIUM" },
                        { label: { en: "Low", es: "Bajo" }, value: "LOW" },
                      ],
                    }
                  : {},
          };
        },
      );

      propertiesIdx = indexBy(properties, (p) => p.type);

      [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);

      await mocks.knex.from("profile_field_value").insert([
        {
          type: "TEXT",
          profile_id: profile.id,
          profile_type_field_id: propertiesIdx["TEXT"].id,
          content: { value: "Mike" },
          created_by_user_id: user.id,
        },
        {
          type: "SHORT_TEXT",
          profile_id: profile.id,
          profile_type_field_id: propertiesIdx["SHORT_TEXT"].id,
          content: { value: "Ross" },
          created_by_user_id: user.id,
        },
        {
          type: "DATE",
          profile_id: profile.id,
          profile_type_field_id: propertiesIdx["DATE"].id,
          content: { value: "2020-10-09" },
          created_by_user_id: user.id,
        },
        {
          type: "PHONE",
          profile_id: profile.id,
          profile_type_field_id: propertiesIdx["PHONE"].id,
          content: { value: "+34611676433" },
          created_by_user_id: user.id,
        },
        {
          type: "NUMBER",
          profile_id: profile.id,
          profile_type_field_id: propertiesIdx["NUMBER"].id,
          content: { value: 1234 },
          created_by_user_id: user.id,
        },
        {
          type: "SELECT",
          profile_id: profile.id,
          profile_type_field_id: propertiesIdx["SELECT"].id,
          content: { value: "LOW" },
          created_by_user_id: user.id,
        },
        {
          type: "BACKGROUND_CHECK",
          profile_id: profile.id,
          profile_type_field_id: propertiesIdx["BACKGROUND_CHECK"].id,
          content: {
            query: {
              name: "Mike Ross",
              date: "2020-10-09",
              type: "PERSON",
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Mike ROSS",
                  properties: {},
                },
              ],
              createdAt: expect.any(String),
            },
            entity: {
              id: "Q7747",
              type: "Person",
              name: "Mike ROSS",
              properties: {},
            },
          },
        },
      ]);

      const [file] = await mocks.createRandomFileUpload(1, () => ({
        filename: "id_document__mike_ross",
        size: "1024",
        content_type: "application/pdf",
      }));

      await mocks.knex.from("profile_field_file").insert({
        profile_id: profile.id,
        profile_type_field_id: propertiesIdx["FILE"].id,
        type: "FILE",
        file_upload_id: file.id,
        created_by_user_id: user.id,
      });

      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
        profile_type_id: profileType.id,
      }));

      groupChildren = await mocks.createRandomPetitionFields(
        petition.id,
        ProfileTypeFieldTypeValues.length + 1,
        (i) =>
          [
            {
              type: "TEXT" as PetitionFieldType,
              parent_petition_field_id: fieldGroup.id,
              profile_type_field_id: propertiesIdx["TEXT"].id,
            },
            {
              type: "SHORT_TEXT" as PetitionFieldType,
              parent_petition_field_id: fieldGroup.id,
              profile_type_field_id: propertiesIdx["SHORT_TEXT"].id,
            },
            {
              type: "FILE_UPLOAD" as PetitionFieldType,
              parent_petition_field_id: fieldGroup.id,
              profile_type_field_id: propertiesIdx["FILE"].id,
            },
            {
              type: "DATE" as PetitionFieldType,
              parent_petition_field_id: fieldGroup.id,
              profile_type_field_id: propertiesIdx["DATE"].id,
            },
            {
              type: "PHONE" as PetitionFieldType,
              parent_petition_field_id: fieldGroup.id,
              profile_type_field_id: propertiesIdx["PHONE"].id,
            },
            {
              type: "NUMBER" as PetitionFieldType,
              parent_petition_field_id: fieldGroup.id,
              profile_type_field_id: propertiesIdx["NUMBER"].id,
            },
            {
              type: "SELECT" as PetitionFieldType,
              parent_petition_field_id: fieldGroup.id,
              profile_type_field_id: propertiesIdx["SELECT"].id,
            },
            {
              type: "BACKGROUND_CHECK" as PetitionFieldType,
              parent_petition_field_id: fieldGroup.id,
              profile_type_field_id: propertiesIdx["BACKGROUND_CHECK"].id,
            },
            {
              type: "SHORT_TEXT" as PetitionFieldType,
              parent_petition_field_id: fieldGroup.id,
              profile_type_field_id: null,
            },
          ][i],
      );
    });

    beforeEach(async () => {
      await mocks.knex.from("petition_field_reply").delete();
      await mocks.knex.from("petition_profile").delete();
      await mocks.knex.from("petition_event").delete();
    });

    it("creates a new field group reply with the contents of the profile", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));

      const [unlinkedReply] = await mocks.createRandomTextReply(
        groupChildren.at(-1)!.id,
        undefined,
        1,
        () => ({
          parent_petition_field_reply_id: groupReply.id,
          user_id: user.id,
          type: "SHORT_TEXT",
          content: { value: "This reply is not linked to a profile field" },
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
          ) {
            createFieldGroupReplyFromProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
            ) {
              id
              associatedProfile {
                id
              }
              field {
                petition {
                  ... on Petition {
                    profiles {
                      id
                    }
                  }
                }
              }
              children {
                field {
                  id
                  type
                  profileTypeField {
                    id
                  }
                }
                replies {
                  id
                  content
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
          parentReplyId: toGlobalId("PetitionFieldReply", groupReply.id),
          profileId: toGlobalId("Profile", profile.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createFieldGroupReplyFromProfile).toEqual({
        id: toGlobalId("PetitionFieldReply", groupReply.id),
        associatedProfile: {
          id: toGlobalId("Profile", profile.id),
        },
        field: {
          petition: {
            profiles: [{ id: toGlobalId("Profile", profile.id) }],
          },
        },
        children: [
          {
            field: {
              id: expect.any(String),
              type: "TEXT",
              profileTypeField: { id: toGlobalId("ProfileTypeField", propertiesIdx["TEXT"].id) },
            },
            replies: [{ id: expect.any(String), content: { value: "Mike" } }],
          },
          {
            field: {
              id: expect.any(String),
              type: "SHORT_TEXT",
              profileTypeField: {
                id: toGlobalId("ProfileTypeField", propertiesIdx["SHORT_TEXT"].id),
              },
            },
            replies: [{ id: expect.any(String), content: { value: "Ross" } }],
          },
          {
            field: {
              id: expect.any(String),
              type: "FILE_UPLOAD",
              profileTypeField: {
                id: toGlobalId("ProfileTypeField", propertiesIdx["FILE"].id),
              },
            },
            replies: [
              {
                id: expect.any(String),
                content: {
                  id: expect.any(String),
                  filename: "id_document__mike_ross",
                  size: "1024",
                  contentType: "application/pdf",
                  extension: "pdf",
                  uploadComplete: true,
                },
              },
            ],
          },
          {
            field: {
              id: expect.any(String),
              type: "DATE",
              profileTypeField: {
                id: toGlobalId("ProfileTypeField", propertiesIdx["DATE"].id),
              },
            },
            replies: [{ id: expect.any(String), content: { value: "2020-10-09" } }],
          },
          {
            field: {
              id: expect.any(String),
              type: "PHONE",
              profileTypeField: {
                id: toGlobalId("ProfileTypeField", propertiesIdx["PHONE"].id),
              },
            },
            replies: [{ id: expect.any(String), content: { value: "+34611676433" } }],
          },
          {
            field: {
              id: expect.any(String),
              type: "NUMBER",
              profileTypeField: {
                id: toGlobalId("ProfileTypeField", propertiesIdx["NUMBER"].id),
              },
            },
            replies: [{ id: expect.any(String), content: { value: 1234 } }],
          },
          {
            field: {
              id: expect.any(String),
              type: "SELECT",
              profileTypeField: {
                id: toGlobalId("ProfileTypeField", propertiesIdx["SELECT"].id),
              },
            },
            replies: [{ id: expect.any(String), content: { value: "LOW" } }],
          },
          {
            field: {
              id: expect.any(String),
              type: "BACKGROUND_CHECK",
              profileTypeField: {
                id: toGlobalId("ProfileTypeField", propertiesIdx["BACKGROUND_CHECK"].id),
              },
            },
            replies: [
              {
                id: expect.any(String),
                content: {
                  query: {
                    name: "Mike Ross",
                    date: "2020-10-09",
                    type: "PERSON",
                  },
                  search: {
                    totalCount: 1,
                  },
                  entity: {
                    id: "Q7747",
                    type: "Person",
                    name: "Mike ROSS",
                    properties: {},
                  },
                },
              },
            ],
          },
          {
            field: {
              id: expect.any(String),
              type: "SHORT_TEXT",
              profileTypeField: null,
            },
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", unlinkedReply.id),
                content: { value: "This reply is not linked to a profile field" },
              },
            ],
          },
        ],
      });
    });

    it("updates field group reply if it already exists and replaces associated_profile_id, disassociating old profile from petition", async () => {
      const [newProfile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      await mocks.knex.from("profile_field_value").insert({
        type: "TEXT",
        profile_id: newProfile.id,
        profile_type_field_id: propertiesIdx["TEXT"].id,
        content: { value: "Harvey" },
        created_by_user_id: user.id,
      });

      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
        associated_profile_id: profile.id,
      }));

      const [unlinkedReply] = await mocks.createRandomTextReply(
        groupChildren.at(-1)!.id,
        undefined,
        1,
        () => ({
          parent_petition_field_reply_id: groupReply.id,
          user_id: user.id,
          type: "SHORT_TEXT",
          content: { value: "This reply is not linked to a profile field" },
        }),
      );

      await mocks.knex.from("petition_field_reply").insert([
        {
          content: { value: "Mike" },
          parent_petition_field_reply_id: groupReply.id,
          petition_field_id: groupChildren.find(
            (f) => f.profile_type_field_id === propertiesIdx["TEXT"].id,
          )!.id,
          type: "TEXT",
          status: "APPROVED", // doesn't matter, it will be replaced
          user_id: user.id,
        },
        {
          content: { value: "Ross" },
          parent_petition_field_reply_id: groupReply.id,
          petition_field_id: groupChildren.find(
            (f) => f.profile_type_field_id === propertiesIdx["SHORT_TEXT"].id,
          )!.id,
          type: "SHORT_TEXT",
          status: "APPROVED", // doesn't matter, it will be replaced
          user_id: user.id,
        },
      ]);

      await mocks.knex.from("petition_profile").insert({
        petition_id: petition.id,
        profile_id: profile.id,
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
          ) {
            createFieldGroupReplyFromProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
            ) {
              id
              associatedProfile {
                id
              }
              field {
                petition {
                  ... on Petition {
                    profiles {
                      id
                    }
                    events(limit: 100, offset: 0) {
                      totalCount
                      items {
                        type
                        data
                      }
                    }
                  }
                }
              }
              children {
                field {
                  id
                  type
                  profileTypeField {
                    id
                  }
                }
                replies {
                  id
                  content
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
          parentReplyId: toGlobalId("PetitionFieldReply", groupReply.id),
          profileId: toGlobalId("Profile", newProfile.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createFieldGroupReplyFromProfile).toEqual({
        id: toGlobalId("PetitionFieldReply", groupReply.id),
        associatedProfile: {
          id: toGlobalId("Profile", newProfile.id),
        },
        field: {
          petition: {
            profiles: [{ id: toGlobalId("Profile", newProfile.id) }],
            events: {
              totalCount: 3,
              items: [
                {
                  type: "REPLY_CREATED",
                  data: {
                    petitionAccessId: null,
                    userId: toGlobalId("User", user.id),
                    petitionFieldId: toGlobalId(
                      "PetitionField",
                      groupChildren.find(
                        (f) => f.profile_type_field_id === propertiesIdx["TEXT"].id,
                      )!.id,
                    ),
                    petitionFieldReplyId: expect.any(String),
                  },
                },
                {
                  type: "PROFILE_ASSOCIATED",
                  data: {
                    profileId: toGlobalId("Profile", newProfile.id),
                    userId: toGlobalId("User", user.id),
                  },
                },
                {
                  type: "PROFILE_DISASSOCIATED",
                  data: {
                    profileId: toGlobalId("Profile", profile.id),
                    userId: toGlobalId("User", user.id),
                    petitionAccessId: null,
                  },
                },
              ],
            },
          },
        },
        children: [
          {
            field: {
              id: expect.any(String),
              type: "TEXT",
              profileTypeField: { id: toGlobalId("ProfileTypeField", propertiesIdx["TEXT"].id) },
            },
            replies: [{ id: expect.any(String), content: { value: "Harvey" } }],
          },
          {
            field: {
              id: expect.any(String),
              type: "SHORT_TEXT",
              profileTypeField: {
                id: toGlobalId("ProfileTypeField", propertiesIdx["SHORT_TEXT"].id),
              },
            },
            replies: [],
          },
          {
            field: {
              id: expect.any(String),
              type: "FILE_UPLOAD",
              profileTypeField: {
                id: toGlobalId("ProfileTypeField", propertiesIdx["FILE"].id),
              },
            },
            replies: [],
          },
          {
            field: {
              id: expect.any(String),
              type: "DATE",
              profileTypeField: {
                id: toGlobalId("ProfileTypeField", propertiesIdx["DATE"].id),
              },
            },
            replies: [],
          },
          {
            field: {
              id: expect.any(String),
              type: "PHONE",
              profileTypeField: {
                id: toGlobalId("ProfileTypeField", propertiesIdx["PHONE"].id),
              },
            },
            replies: [],
          },
          {
            field: {
              id: expect.any(String),
              type: "NUMBER",
              profileTypeField: {
                id: toGlobalId("ProfileTypeField", propertiesIdx["NUMBER"].id),
              },
            },
            replies: [],
          },
          {
            field: {
              id: expect.any(String),
              type: "SELECT",
              profileTypeField: {
                id: toGlobalId("ProfileTypeField", propertiesIdx["SELECT"].id),
              },
            },
            replies: [],
          },
          {
            field: {
              id: expect.any(String),
              type: "BACKGROUND_CHECK",
              profileTypeField: {
                id: toGlobalId("ProfileTypeField", propertiesIdx["BACKGROUND_CHECK"].id),
              },
            },
            replies: [],
          },
          {
            field: {
              id: expect.any(String),
              type: "SHORT_TEXT",
              profileTypeField: null,
            },
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", unlinkedReply.id),
                content: { value: "This reply is not linked to a profile field" },
              },
            ],
          },
        ],
      });
    });

    it("does not disassociate old profile if it is still being referenced on another reply", async () => {
      const [newProfile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      await mocks.knex.from("profile_field_value").insert({
        type: "TEXT",
        profile_id: newProfile.id,
        profile_type_field_id: propertiesIdx["TEXT"].id,
        content: { value: "Harvey" },
        created_by_user_id: user.id,
      });

      const [, groupReply2] = await mocks.createFieldGroupReply(
        fieldGroup.id,
        undefined,
        2,
        () => ({
          user_id: user.id,
          associated_profile_id: profile.id,
        }),
      );

      await mocks.knex.from("petition_profile").insert({
        petition_id: petition.id,
        profile_id: profile.id,
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
          ) {
            createFieldGroupReplyFromProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
            ) {
              id
              associatedProfile {
                id
              }
              field {
                petition {
                  ... on Petition {
                    profiles {
                      id
                    }
                    events(limit: 100, offset: 0) {
                      totalCount
                      items {
                        type
                        data
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
          parentReplyId: toGlobalId("PetitionFieldReply", groupReply2.id),
          profileId: toGlobalId("Profile", newProfile.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createFieldGroupReplyFromProfile).toEqual({
        id: toGlobalId("PetitionFieldReply", groupReply2.id),
        associatedProfile: {
          id: toGlobalId("Profile", newProfile.id),
        },
        field: {
          petition: {
            profiles: [
              { id: toGlobalId("Profile", profile.id) },
              { id: toGlobalId("Profile", newProfile.id) },
            ],
            events: {
              totalCount: 2,
              items: [
                {
                  type: "REPLY_CREATED",
                  data: {
                    petitionAccessId: null,
                    userId: toGlobalId("User", user.id),
                    petitionFieldId: expect.any(String),
                    petitionFieldReplyId: expect.any(String),
                  },
                },
                {
                  type: "PROFILE_ASSOCIATED",
                  data: {
                    profileId: toGlobalId("Profile", newProfile.id),
                    userId: toGlobalId("User", user.id),
                  },
                },
              ],
            },
          },
        },
      });
    });

    it("sends error if there are no visible completed properties for the user and force=false", async () => {
      const [newProfile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      await mocks.knex
        .from("profile_type_field")
        .where("id", propertiesIdx["TEXT"].id)
        .update("permission", "HIDDEN");

      // only replied value is HIDDEN
      await mocks.knex.from("profile_field_value").insert({
        type: "TEXT",
        profile_id: newProfile.id,
        profile_type_field_id: propertiesIdx["TEXT"].id,
        content: { value: "Harvey" },
        created_by_user_id: user.id,
      });

      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
          ) {
            createFieldGroupReplyFromProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
            ) {
              id
              associatedProfile {
                id
              }
              field {
                petition {
                  ... on Petition {
                    profiles {
                      id
                    }
                    events(limit: 100, offset: 0) {
                      totalCount
                      items {
                        type
                        data
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
          parentReplyId: toGlobalId("PetitionFieldReply", groupReply.id),
          profileId: toGlobalId("Profile", newProfile.id),
        },
      );

      expect(errors).toContainGraphQLError("NOTHING_TO_IMPORT_ERROR");
      expect(data).toBeNull();

      await mocks.knex
        .from("profile_type_field")
        .where("id", propertiesIdx["TEXT"].id)
        .update("permission", "READ");
    });

    it("only associates the empty reply to the profile if there are no visible completed properties for the user and force=true", async () => {
      const [newProfile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      await mocks.knex
        .from("profile_type_field")
        .where("id", propertiesIdx["TEXT"].id)
        .update("permission", "HIDDEN");

      // only replied value is HIDDEN
      await mocks.knex.from("profile_field_value").insert({
        type: "TEXT",
        profile_id: newProfile.id,
        profile_type_field_id: propertiesIdx["TEXT"].id,
        content: { value: "Harvey" },
        created_by_user_id: user.id,
      });

      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
          ) {
            createFieldGroupReplyFromProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              force: true
            ) {
              id
              associatedProfile {
                id
              }
              field {
                petition {
                  ... on Petition {
                    profiles {
                      id
                    }
                    events(limit: 100, offset: 0) {
                      totalCount
                      items {
                        type
                        data
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
          parentReplyId: toGlobalId("PetitionFieldReply", groupReply.id),
          profileId: toGlobalId("Profile", newProfile.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createFieldGroupReplyFromProfile).toEqual({
        id: toGlobalId("PetitionFieldReply", groupReply.id),
        associatedProfile: {
          id: toGlobalId("Profile", newProfile.id),
        },
        field: {
          petition: {
            profiles: [{ id: toGlobalId("Profile", newProfile.id) }],
            events: {
              totalCount: 1,
              items: [
                {
                  type: "PROFILE_ASSOCIATED",
                  data: {
                    profileId: toGlobalId("Profile", newProfile.id),
                    userId: toGlobalId("User", user.id),
                  },
                },
              ],
            },
          },
        },
      });

      await mocks.knex
        .from("profile_type_field")
        .where("id", propertiesIdx["TEXT"].id)
        .update("permission", "READ");
    });

    it("associates profile to petition only once", async () => {
      const [groupReply1, groupReply2] = await mocks.createFieldGroupReply(
        fieldGroup.id,
        undefined,
        2,
        () => ({ user_id: user.id }),
      );

      const { errors: errors1, data: data1 } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
          ) {
            createFieldGroupReplyFromProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
            ) {
              id
              associatedProfile {
                id
              }
              field {
                petition {
                  ... on Petition {
                    profiles {
                      id
                    }
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
          parentReplyId: toGlobalId("PetitionFieldReply", groupReply1.id),
          profileId: toGlobalId("Profile", profile.id),
        },
      );

      expect(errors1).toBeUndefined();
      expect(data1?.createFieldGroupReplyFromProfile).toEqual({
        id: toGlobalId("PetitionFieldReply", groupReply1.id),
        associatedProfile: {
          id: toGlobalId("Profile", profile.id),
        },
        field: {
          petition: {
            profiles: [{ id: toGlobalId("Profile", profile.id) }],
          },
        },
      });

      const { errors: errors2, data: data2 } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
          ) {
            createFieldGroupReplyFromProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
            ) {
              id
              associatedProfile {
                id
              }
              field {
                petition {
                  ... on Petition {
                    profiles {
                      id
                    }
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
          parentReplyId: toGlobalId("PetitionFieldReply", groupReply2.id),
          profileId: toGlobalId("Profile", profile.id),
        },
      );

      expect(errors2).toBeUndefined();
      expect(data2?.createFieldGroupReplyFromProfile).toEqual({
        id: toGlobalId("PetitionFieldReply", groupReply2.id),
        associatedProfile: {
          id: toGlobalId("Profile", profile.id),
        },
        field: {
          petition: {
            profiles: [{ id: toGlobalId("Profile", profile.id) }],
          },
        },
      });
    });
  });
});

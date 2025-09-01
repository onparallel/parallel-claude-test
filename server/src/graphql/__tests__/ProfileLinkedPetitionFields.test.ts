import { gql } from "graphql-request";
import { Knex } from "knex";
import { indexBy, pick } from "remeda";
import {
  FileUpload,
  Organization,
  Petition,
  PetitionField,
  PetitionFieldReply,
  PetitionFieldType,
  Profile,
  ProfileRelationshipType,
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldTypeValues,
  User,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { BackgroundCheckContent } from "../../services/BackgroundCheckService";
import { PROFILES_SETUP_SERVICE, ProfilesSetupService } from "../../services/ProfilesSetupService";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("ProfileLinkedPetitionFields", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let user: User;
  let organization: Organization;

  let individual: ProfileType;
  let legalEntity: ProfileType;
  let contract: ProfileType;

  let petition: Petition;
  let fieldGroup: PetitionField;

  let relationshipTypes: ProfileRelationshipType[];

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
      recipient_locale: "en",
    }));
    [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
      type: "FIELD_GROUP",
    }));

    await mocks.createFeatureFlags([{ name: "PROFILES", default_value: true }]);
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
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("linkFieldGroupToProfileType", () => {
    it("links a FIELD_GROUP field to an individual profile type", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $petitionFieldId: GID!, $profileTypeId: GID) {
            linkFieldGroupToProfileType(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              profileTypeId: $profileTypeId
            ) {
              id
              isLinkedToProfileType
              profileType {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
          profileTypeId: toGlobalId("ProfileType", individual.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.linkFieldGroupToProfileType).toEqual({
        id: toGlobalId("PetitionField", fieldGroup.id),
        isLinkedToProfileType: true,
        profileType: {
          id: toGlobalId("ProfileType", individual.id),
        },
      });
    });

    it("fails if trying to remove profile_type_id but field has children linked as profile properties", async () => {
      const profileTypeFields = await mocks.knex
        .from("profile_type_field")
        .where("profile_type_id", individual.id)
        .select("*");

      await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "SHORT_TEXT",
        parent_petition_field_id: fieldGroup.id,
        profile_type_field_id: profileTypeFields.find((p) => p.alias === "p_first_name")!.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $petitionFieldId: GID!, $profileTypeId: GID) {
            linkFieldGroupToProfileType(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              profileTypeId: $profileTypeId
            ) {
              id
              isLinkedToProfileType
              profileType {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
          profileTypeId: null,
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if trying to update profile_type_id but field has relationships with other fields", async () => {
      await mocks.knex.from("petition_field").where("id", fieldGroup.id).update({
        profile_type_id: individual.id,
      });

      const [secondGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
        profile_type_id: individual.id,
      }));

      await mocks.knex.from("petition_field_group_relationship").insert({
        petition_id: petition.id,
        left_side_petition_field_id: fieldGroup.id,
        right_side_petition_field_id: secondGroup.id,
        profile_relationship_type_id: relationshipTypes.find((r) => r.alias === "p_parent__child")!
          .id,
        direction: "LEFT_RIGHT",
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $petitionFieldId: GID!, $profileTypeId: GID) {
            linkFieldGroupToProfileType(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              profileTypeId: $profileTypeId
            ) {
              id
              isLinkedToProfileType
              profileType {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
          profileTypeId: null,
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("createProfileLinkedPetitionField", () => {
    it("links a field child with a profile type field", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", fieldGroup.id)
        .update({ profile_type_id: legalEntity.id });

      const profileTypeFields = await mocks.knex
        .from("profile_type_field")
        .where("profile_type_id", legalEntity.id)
        .select("*");

      const entityName = profileTypeFields.find((f) => f.alias === "p_entity_name")!;
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
            createProfileLinkedPetitionField(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              profileTypeFieldId: $profileTypeFieldId
            ) {
              id
              parent {
                id
                isLinkedToProfileType
              }
              isLinkedToProfileTypeField
              profileTypeField {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fieldGroup.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", entityName.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileLinkedPetitionField).toEqual({
        id: expect.any(String),
        parent: {
          id: toGlobalId("PetitionField", fieldGroup.id),
          isLinkedToProfileType: true,
        },
        isLinkedToProfileTypeField: true,
        profileTypeField: {
          id: toGlobalId("ProfileTypeField", entityName.id),
        },
      });
    });

    it("fails if parent field is not linked to a profile type", async () => {
      const profileTypeFields = await mocks.knex
        .from("profile_type_field")
        .where("profile_type_id", legalEntity.id)
        .select("*");

      const entityName = profileTypeFields.find((f) => f.alias === "p_entity_name")!;

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
            createProfileLinkedPetitionField(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              profileTypeFieldId: $profileTypeFieldId
            ) {
              id
              parent {
                id
                isLinkedToProfileType
              }
              isLinkedToProfileTypeField
              profileTypeField {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fieldGroup.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", entityName.id),
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if profile type field does not belong to profile type of the parent field", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", fieldGroup.id)
        .update({ profile_type_id: contract.id });

      const profileTypeFields = await mocks.knex
        .from("profile_type_field")
        .where("profile_type_id", legalEntity.id)
        .select("*");

      const entityName = profileTypeFields.find((f) => f.alias === "p_entity_name")!;
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
            createProfileLinkedPetitionField(
              petitionId: $petitionId
              parentFieldId: $parentFieldId
              profileTypeFieldId: $profileTypeFieldId
            ) {
              id
              parent {
                id
                isLinkedToProfileType
              }
              isLinkedToProfileTypeField
              profileTypeField {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          parentFieldId: toGlobalId("PetitionField", fieldGroup.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", entityName.id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if the profile type field is already linked as child of the field", async () => {
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
        profile_type_id: legalEntity.id,
      }));

      const profileTypeFields = await mocks.knex
        .from("profile_type_field")
        .where("profile_type_id", legalEntity.id)
        .select("*");

      const entityName = profileTypeFields.find((f) => f.alias === "p_entity_name")!;

      for (const expectedError of [false, true]) {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
              createProfileLinkedPetitionField(
                petitionId: $petitionId
                parentFieldId: $parentFieldId
                profileTypeFieldId: $profileTypeFieldId
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            parentFieldId: toGlobalId("PetitionField", fieldGroup.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", entityName.id),
          },
        );

        if (expectedError) {
          expect(errors).toContainGraphQLError("FORBIDDEN");
          expect(data).toBeNull();
        } else {
          expect(errors).toBeUndefined();
          expect(data?.createProfileLinkedPetitionField).toEqual({
            id: expect.any(String),
          });
        }
      }
    });

    it("maps property options to profile field options", async () => {
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
        profile_type_id: individual.id,
      }));

      const individualFields = await mocks.knex
        .from("profile_type_field")
        .where("profile_type_id", individual.id)
        .select("*");

      for (const property of [
        {
          alias: "p_first_name",
          type: "SHORT_TEXT",
          multiple: false,
          isInternal: false,
          options: {
            placeholder: null,
            maxLength: null,
            format: null,
          },
        },
        {
          alias: "p_email",
          type: "SHORT_TEXT",
          multiple: false,
          isInternal: false,
          options: {
            placeholder: null,
            maxLength: null,
            format: "EMAIL",
          },
        },
        {
          alias: "p_phone_number",
          type: "PHONE",
          multiple: false,
          isInternal: false,
          options: {
            placeholder: null,
          },
        },
        {
          alias: "p_birth_date",
          type: "DATE",
          multiple: false,
          isInternal: false,
          options: {},
        },
        {
          alias: "p_gender",
          type: "SELECT",
          multiple: false,
          isInternal: false,
          options: {
            placeholder: null,
            values: ["M", "F"],
            labels: ["Male", "Female"],
            standardList: null,
          },
        },
        {
          alias: "p_country_of_residence",
          type: "SELECT",
          multiple: false,
          isInternal: false,
          options: {
            placeholder: null,
            values: expect.toBeArrayOfSize(250),
            labels: expect.toBeArrayOfSize(250),
            standardList: "COUNTRIES",
          },
        },
        {
          alias: "p_proof_of_address_document",
          type: "FILE_UPLOAD",
          multiple: true,
          isInternal: false,
          options: {
            accepts: null,
            attachToPdf: false,
            documentProcessing: null,
            maxFileSize: null,
            processDocument: false,
          },
        },
        {
          alias: "p_source_of_funds",
          type: "TEXT",
          multiple: false,
          isInternal: false,
          options: {
            maxLength: null,
            placeholder: null,
          },
        },
        {
          alias: "p_background_check",
          type: "BACKGROUND_CHECK",
          multiple: false,
          isInternal: true,
          options: {
            autoSearchConfig: null,
          },
        },
      ]) {
        const profileField = individualFields.find((f) => f.alias === property.alias)!;

        expect(profileField).toBeDefined();

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
              createProfileLinkedPetitionField(
                petitionId: $petitionId
                parentFieldId: $parentFieldId
                profileTypeFieldId: $profileTypeFieldId
              ) {
                type
                multiple
                isInternal
                options
                alias
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            parentFieldId: toGlobalId("PetitionField", fieldGroup.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileField.id),
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createProfileLinkedPetitionField).toEqual({
          ...property,
          options: {
            ...property.options,
            replyOnlyFromProfile: false,
          },
          alias: null,
        });
      }
    });
  });

  describe("archiveFieldGroupReplyIntoProfile", () => {
    let petition: Petition;

    let textField: PetitionField;
    let individualField: PetitionField;
    let legalEntityField: PetitionField;
    let contractField: PetitionField;
    let contractChildFields: PetitionField[];

    let individualChildFields: PetitionField[];
    let legalEntityChildFields: PetitionField[];

    let individualReply: PetitionFieldReply;
    let individualChildReplies: PetitionFieldReply[];
    let legalEntityReply: PetitionFieldReply;
    let legalEntityChildReplies: PetitionFieldReply[];
    let contractReply: PetitionFieldReply;
    let contractChildReplies: PetitionFieldReply[];

    let individualProfileTypeFields: Record<string, ProfileTypeField>;
    let legalEntityProfileTypeFields: Record<string, ProfileTypeField>;
    let contractProfileTypeFields: Record<string, ProfileTypeField>;

    let fileUploads: FileUpload[];

    /**
     * - create a FIELD_GROUP on the petition for every standard profile type
     * - add field children linked to profile type fields. 1 child per profile property
     * - create replies for every field
     */
    beforeAll(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      // create fields and link to profile type
      [textField, individualField, legalEntityField, contractField] =
        await mocks.createRandomPetitionFields(petition.id, 4, (i) => ({
          type: ["TEXT", "FIELD_GROUP", "FIELD_GROUP", "FIELD_GROUP"][i] as PetitionFieldType,
          profile_type_id: [null, individual.id, legalEntity.id, contract.id][i],
        }));

      const profileTypeFields = await mocks.knex
        .from("profile_type_field")
        .whereIn("profile_type_id", [individual.id, legalEntity.id, contract.id])
        .whereNull("deleted_at")
        .orderBy("position", "asc")
        .select("*");

      individualProfileTypeFields = indexBy(
        profileTypeFields.filter((f) => f.profile_type_id === individual.id).slice(0, 23),
        (f) => f.alias!,
      );

      for (const individualProfileTypeField of Object.values(individualProfileTypeFields)) {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
              createProfileLinkedPetitionField(
                petitionId: $petitionId
                parentFieldId: $parentFieldId
                profileTypeFieldId: $profileTypeFieldId
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            parentFieldId: toGlobalId("PetitionField", individualField.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", individualProfileTypeField.id),
          },
        );

        expect(errors).toBeUndefined();

        await mocks.knex
          .from("petition_field")
          .where("id", fromGlobalId(data!.createProfileLinkedPetitionField.id).id)
          .update({
            alias: `i_${individualProfileTypeField.alias}`,
          });
      }

      legalEntityProfileTypeFields = indexBy(
        profileTypeFields.filter((f) => f.profile_type_id === legalEntity.id).slice(0, 25),
        (f) => f.alias!,
      );

      for (const legalEntityProfileTypeField of Object.values(legalEntityProfileTypeFields)) {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
              createProfileLinkedPetitionField(
                petitionId: $petitionId
                parentFieldId: $parentFieldId
                profileTypeFieldId: $profileTypeFieldId
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            parentFieldId: toGlobalId("PetitionField", legalEntityField.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", legalEntityProfileTypeField.id),
          },
        );

        expect(errors).toBeUndefined();

        await mocks.knex
          .from("petition_field")
          .where("id", fromGlobalId(data!.createProfileLinkedPetitionField.id).id)
          .update({
            alias: `le_${legalEntityProfileTypeField.alias}`,
          });
      }

      contractProfileTypeFields = indexBy(
        profileTypeFields.filter((f) => f.profile_type_id === contract.id).slice(0, 22),
        (f) => f.alias!,
      );

      for (const contractProfileTypeField of Object.values(contractProfileTypeFields)) {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $parentFieldId: GID!, $profileTypeFieldId: GID!) {
              createProfileLinkedPetitionField(
                petitionId: $petitionId
                parentFieldId: $parentFieldId
                profileTypeFieldId: $profileTypeFieldId
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            parentFieldId: toGlobalId("PetitionField", contractField.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", contractProfileTypeField.id),
          },
        );

        expect(errors).toBeUndefined();

        await mocks.knex
          .from("petition_field")
          .where("id", fromGlobalId(data!.createProfileLinkedPetitionField.id).id)
          .update({
            alias: `c_${contractProfileTypeField.alias}`,
          });
      }

      // create replies for INDIVIDUAL field
      [individualReply] = await mocks.createFieldGroupReply(
        individualField.id,
        undefined,
        1,
        () => ({ user_id: user.id }),
      );
      individualChildFields = await mocks.knex
        .from("petition_field")
        .where({
          petition_id: petition.id,
          parent_petition_field_id: individualField.id,
          deleted_at: null,
        })
        .select("*");

      let fileCount = 0;
      fileUploads = await mocks.createRandomFileUpload(
        profileTypeFields.filter((f) => f.type === "FILE").length,
      );

      // insert replies for every field on INDIVIDUAL group
      individualChildReplies = await mocks.knex.from("petition_field_reply").insert(
        [
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_first_name")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Mike" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_last_name")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Wazowski" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_email")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "mwazowski@monsterinc.com" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_phone_number")!
              .id,
            parent_petition_field_reply_id: individualReply.id,
            type: "PHONE",
            user_id: user.id,
            content: { value: "+123456789" },
          },
          {
            petition_field_id: individualChildFields.find(
              (f) => f.alias === "i_p_mobile_phone_number",
            )!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "PHONE",
            user_id: user.id,
            content: { value: "+987654321" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_birth_date")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "DATE",
            user_id: user.id,
            content: { value: "1990-02-02" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_gender")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "M" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_address")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "1234 Elm Street" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_city")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Monstropolis" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_zip")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "12345" },
          },
          {
            petition_field_id: individualChildFields.find(
              (f) => f.alias === "i_p_country_of_residence",
            )!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "US" },
          },
          {
            petition_field_id: individualChildFields.find(
              (f) => f.alias === "i_p_proof_of_address_document",
            )!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_citizenship")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "US" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_tax_id")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "123456789" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_id_document")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: individualChildFields.find(
              (f) => f.alias === "i_p_passport_document",
            )!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_passport_number")!
              .id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "A2345678X" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_is_pep")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "N" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_risk")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "LOW" },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_risk_assessment")!
              .id,
            parent_petition_field_reply_id: individualReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_source_of_funds")!
              .id,
            parent_petition_field_reply_id: individualReply.id,
            type: "TEXT",
            user_id: user.id,
            content: { value: "Salary" },
          },
          {
            petition_field_id: individualChildFields.find(
              (f) => f.alias === "i_p_background_check",
            )!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "BACKGROUND_CHECK",
            user_id: user.id,
            content: {
              query: { name: "Mike Wazowski", date: null, type: "Person" },
              search: {
                totalCount: 1,
                items: [{ id: "1", type: "Person", name: "Mike Wazowski", properties: {} }],
                createdAt: new Date(),
              },
              entity: { id: "1", type: "Person", name: "Mike Wazowski", properties: {} },
            },
          },
          {
            petition_field_id: individualChildFields.find((f) => f.alias === "i_p_occupation")!.id,
            parent_petition_field_reply_id: individualReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Scarer" },
          },
        ],
        "*",
      );

      [legalEntityReply] = await mocks.createFieldGroupReply(
        legalEntityField.id,
        undefined,
        1,
        () => ({ user_id: user.id }),
      );
      legalEntityChildFields = await mocks.knex
        .from("petition_field")
        .where({
          petition_id: petition.id,
          parent_petition_field_id: legalEntityField.id,
          deleted_at: null,
        })
        .select("*");

      // insert replies for every field on LEGAL_ENTITY group
      legalEntityChildReplies = await mocks.knex.from("petition_field_reply").insert(
        [
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_entity_name")!
              .id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Monsters Inc." },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_trade_name")!
              .id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Monsters Inc." },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_entity_type")!
              .id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "INCORPORATED" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_registration_number",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "123456" },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_tax_id")!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "ABCDEF" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_registered_address",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "1234 Monster Street" },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_city")!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Monstropolis" },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_zip")!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "12345" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_country_of_incorporation",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "US" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_date_of_incorporation",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "DATE",
            user_id: user.id,
            content: { value: "1890-12-24" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_main_business_activity",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Scaring" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_ownership_structure",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_ubo_statement")!
              .id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_financial_statements",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_risk")!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "MEDIUM" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_risk_assessment",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_poa_types")!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "GENERAL_POA" },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_poa_scope")!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "All" },
          },
          {
            petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_poa_document")!
              .id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_poa_effective_date",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "DATE",
            user_id: user.id,
            content: { value: "2020-01-01" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_poa_expiration_date",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "DATE",
            user_id: user.id,
            content: { value: "2031-01-01" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_poa_revocation_conditions",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "None" },
          },
          {
            petition_field_id: legalEntityChildFields.find(
              (f) => f.alias === "le_p_poa_registered",
            )!.id,
            parent_petition_field_reply_id: legalEntityReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "Y" },
          },
        ],
        "*",
      );

      [contractReply] = await mocks.createFieldGroupReply(contractField.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      contractChildFields = await mocks.knex
        .from("petition_field")
        .where({
          petition_id: petition.id,
          parent_petition_field_id: contractField.id,
          deleted_at: null,
        })
        .select("*");

      // insert replies for every field on CONTRACT group
      contractChildReplies = await mocks.knex.from("petition_field_reply").insert(
        [
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_counterparty")!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Sulley" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_contract_type")!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "EMPLOYMENT_CONTRACT" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_effective_date")!
              .id,
            parent_petition_field_reply_id: contractReply.id,
            type: "DATE",
            user_id: user.id,
            content: { value: "2020-01-01" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_expiration_date")!
              .id,
            parent_petition_field_reply_id: contractReply.id,
            type: "DATE",
            user_id: user.id,
            content: { value: "2022-01-01" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_jurisdiction")!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "US" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_contract_value")!
              .id,
            parent_petition_field_reply_id: contractReply.id,
            type: "NUMBER",
            user_id: user.id,
            content: { value: 1000000 },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_contract_currency")!
              .id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "USD" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_payment_terms")!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Net 30" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_renewal_terms")!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "None" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_original_document")!
              .id,
            parent_petition_field_reply_id: contractReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_amendments")!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "FILE_UPLOAD",
            user_id: user.id,
            content: { file_upload_id: fileUploads[fileCount++].id },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_termination_clauses",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "None" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_confidentiality_agreement",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SELECT",
            user_id: user.id,
            content: { value: "Y" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_performance_metrics",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Metrics are good" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_dispute_resolution_mechanism",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Arbitration" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_compliance_obligations",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "None" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_security_provisions",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "None" },
          },
          {
            petition_field_id: contractChildFields.find((f) => f.alias === "c_p_notes")!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "TEXT",
            user_id: user.id,
            content: { value: "No notes" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_billing_contact_full_name",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "James P. Sullivan" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_billing_contact_email",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "jpsullivan@monsterinc.com" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_legal_contact_full_name",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "Randall Boggs" },
          },
          {
            petition_field_id: contractChildFields.find(
              (f) => f.alias === "c_p_legal_contact_email",
            )!.id,
            parent_petition_field_reply_id: contractReply.id,
            type: "SHORT_TEXT",
            user_id: user.id,
            content: { value: "rboggs@monsterinc.com" },
          },
        ],
        "*",
      );

      await mocks.knex.from("petition").where("id", petition.id).update({
        status: "CLOSED",
        closed_at: new Date(),
      });
    });

    beforeEach(async () => {
      await mocks.knex.from("petition_event").delete();
      await mocks.knex.from("petition_field_group_relationship").delete();
      await mocks.knex.from("profile_relationship").delete();
    });

    it("archives INDIVIDUAL FIELD_GROUP reply into an empty profile", async () => {
      const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
              field {
                petition {
                  ... on Petition {
                    events(limit: 10, offset: 0) {
                      totalCount
                      items {
                        type
                        data
                      }
                    }
                  }
                }
              }
              associatedProfile {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                properties {
                  field {
                    type
                    alias
                  }
                  files {
                    id
                  }
                  value {
                    id
                    content
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", individualField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();

      expect(pick(data?.archiveFieldGroupReplyIntoProfile, ["id", "field"])).toEqual({
        id: toGlobalId("PetitionFieldReply", individualReply.id),
        field: {
          petition: {
            events: {
              totalCount: 1,
              items: [
                {
                  type: "PROFILE_ASSOCIATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileId: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
                  },
                },
              ],
            },
          },
        },
      });

      expect(
        pick(data?.archiveFieldGroupReplyIntoProfile.associatedProfile, ["id", "events"]),
      ).toEqual({
        id: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
        events: {
          totalCount: 25,
          items: [
            {
              type: "PROFILE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
              },
            },

            ...[
              "p_occupation",
              "p_background_check",
              "p_source_of_funds",
              "p_risk",
              "p_is_pep",
              "p_passport_number",
              "p_tax_id",
              "p_citizenship",
              "p_country_of_residence",
              "p_zip",
              "p_city",
              "p_address",
              "p_gender",
              "p_birth_date",
              "p_mobile_phone_number",
              "p_phone_number",
              "p_email",
              "p_last_name",
              "p_first_name",
            ].map((alias) => ({
              type: "PROFILE_FIELD_VALUE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualProfileTypeFields[alias].id,
                ),
                alias,
              },
            })),
            ...[
              "p_risk_assessment",
              "p_passport_document",
              "p_id_document",
              "p_proof_of_address_document",
            ].map((alias) => ({
              type: "PROFILE_FIELD_FILE_ADDED",
              data: {
                userId: toGlobalId("User", user.id),
                profileFieldFileId: expect.any(String),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualProfileTypeFields[alias].id,
                ),
                alias,
              },
            })),
            {
              type: "PETITION_ASSOCIATED",
              data: {
                petitionId: toGlobalId("Petition", petition.id),
                userId: toGlobalId("User", user.id),
              },
            },
          ],
        },
      });

      expect(
        data?.archiveFieldGroupReplyIntoProfile.associatedProfile.properties.slice(0, 28),
      ).toEqual([
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_first_name",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Mike" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_last_name",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Wazowski" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_email",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "mwazowski@monsterinc.com" },
          },
        },
        {
          field: {
            type: "PHONE",
            alias: "p_phone_number",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "+123456789", pretty: "+1 23456789" },
          },
        },
        {
          field: {
            type: "PHONE",
            alias: "p_mobile_phone_number",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "+987654321", pretty: "+98 7654321" },
          },
        },
        {
          field: {
            type: "DATE",
            alias: "p_birth_date",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "1990-02-02" },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_gender",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "M" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_address",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "1234 Elm Street" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_city",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Monstropolis" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_zip",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "12345" },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_country_of_residence",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "US" },
          },
        },
        {
          field: {
            type: "FILE",
            alias: "p_proof_of_address_document",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "SELECT",
            alias: "p_citizenship",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "US" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_tax_id",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "123456789" },
          },
        },
        {
          field: {
            type: "FILE",
            alias: "p_id_document",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "FILE",
            alias: "p_passport_document",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_passport_number",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "A2345678X" },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_is_pep",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "N" },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_risk",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "LOW" },
          },
        },
        {
          field: {
            type: "FILE",
            alias: "p_risk_assessment",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "TEXT",
            alias: "p_source_of_funds",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Salary" },
          },
        },
        {
          field: {
            type: "BACKGROUND_CHECK",
            alias: "p_background_check",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: {
              query: {
                name: "Mike Wazowski",
                date: null,
                type: "Person",
              },
              search: {
                totalCount: 1,
                createdAt: expect.any(String),
                falsePositivesCount: 0,
              },
              entity: {
                id: "1",
                type: "Person",
                name: "Mike Wazowski",
                properties: {},
              },
            },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_occupation",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Scarer" },
          },
        },
        {
          field: {
            alias: "p_poa",
            type: "FILE",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_position",
            type: "SHORT_TEXT",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_client_status",
            type: "SELECT",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_marital_status",
            type: "SELECT",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_relationship",
            type: "CHECKBOX",
          },
          files: null,
          value: null,
        },
      ]);

      for (const [alias, ptf] of Object.entries(individualProfileTypeFields)) {
        const reply = individualChildReplies.find(
          (r) =>
            r.parent_petition_field_reply_id === individualReply.id &&
            r.petition_field_id === individualChildFields.find((f) => f.alias === `i_${alias}`)!.id,
        );
        if (!reply) {
          continue;
        }

        if (ptf.type === "FILE") {
          const [pff] = await mocks.knex
            .from("profile_field_file")
            .where({
              profile_id: profile.id,
              profile_type_field_id: ptf.id,
              removed_at: null,
              deleted_at: null,
            })
            .select("*");
          expect(pff).toBeDefined();
          expect(pff.petition_field_reply_id).toEqual(reply.id);
        } else {
          const [pfv] = await mocks.knex
            .from("profile_field_value")
            .where({
              profile_id: profile.id,
              profile_type_field_id: ptf.id,
              removed_at: null,
              deleted_at: null,
            })
            .select("*");
          expect(pfv).toBeDefined();
          expect(pfv.petition_field_reply_id).toEqual(reply.id);
        }
      }
    });

    it("archives LEGAL_ENTITY FIELD_GROUP reply into an empty profile", async () => {
      const [profile] = await mocks.createRandomProfiles(organization.id, legalEntity.id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
              field {
                petition {
                  ... on Petition {
                    events(limit: 10, offset: 0) {
                      totalCount
                      items {
                        type
                        data
                      }
                    }
                  }
                }
              }
              associatedProfile {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                properties {
                  field {
                    type
                    alias
                  }
                  files {
                    id
                  }
                  value {
                    id
                    content
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", legalEntityField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", legalEntityReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();

      expect(pick(data?.archiveFieldGroupReplyIntoProfile, ["id", "field"])).toEqual({
        id: toGlobalId("PetitionFieldReply", legalEntityReply.id),
        field: {
          petition: {
            events: {
              totalCount: 1,
              items: [
                {
                  type: "PROFILE_ASSOCIATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileId: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
                  },
                },
              ],
            },
          },
        },
      });

      expect(
        pick(data.archiveFieldGroupReplyIntoProfile.associatedProfile, ["id", "events"]),
      ).toEqual({
        id: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
        events: {
          totalCount: 25,
          items: [
            {
              type: "PROFILE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
              },
            },
            ...[
              "p_poa_registered",
              "p_poa_revocation_conditions",
              "p_poa_expiration_date",
              "p_poa_effective_date",
              "p_poa_scope",
              "p_poa_types",
              "p_risk",
              "p_main_business_activity",
              "p_date_of_incorporation",
              "p_country_of_incorporation",
              "p_zip",
              "p_city",
              "p_registered_address",
              "p_tax_id",
              "p_registration_number",
              "p_entity_type",
              "p_trade_name",
              "p_entity_name",
            ].map((alias) => ({
              type: "PROFILE_FIELD_VALUE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields[alias].id,
                ),
                alias,
              },
            })),
            ...[
              "p_poa_document",
              "p_risk_assessment",
              "p_financial_statements",
              "p_ubo_statement",
              "p_ownership_structure",
            ].map((alias) => ({
              type: "PROFILE_FIELD_FILE_ADDED",
              data: {
                userId: toGlobalId("User", user.id),
                profileFieldFileId: expect.any(String),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields[alias].id,
                ),
                alias,
              },
            })),
            {
              type: "PETITION_ASSOCIATED",
              data: {
                petitionId: toGlobalId("Petition", petition.id),
                userId: toGlobalId("User", user.id),
              },
            },
          ],
        },
      });

      expect(
        data.archiveFieldGroupReplyIntoProfile.associatedProfile.properties.slice(0, 31),
      ).toEqual([
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_entity_name",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Monsters Inc." },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_trade_name",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Monsters Inc." },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_entity_type",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "INCORPORATED" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_registration_number",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "123456" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_tax_id",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "ABCDEF" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_registered_address",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "1234 Monster Street" },
          },
        },
        {
          field: {
            type: "PHONE",
            alias: "p_phone_number",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_city",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Monstropolis" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_zip",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "12345" },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_country",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "SELECT",
            alias: "p_country_of_incorporation",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "US" },
          },
        },
        {
          field: {
            type: "DATE",
            alias: "p_date_of_incorporation",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "1890-12-24" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_main_business_activity",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Scaring" },
          },
        },
        {
          field: {
            type: "FILE",
            alias: "p_ownership_structure",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "FILE",
            alias: "p_ubo_statement",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "FILE",
            alias: "p_financial_statements",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "SELECT",
            alias: "p_risk",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "MEDIUM" },
          },
        },
        {
          field: {
            type: "FILE",
            alias: "p_risk_assessment",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "SELECT",
            alias: "p_poa_types",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "GENERAL_POA" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_poa_scope",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "All" },
          },
        },
        {
          field: {
            type: "FILE",
            alias: "p_poa_document",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "DATE",
            alias: "p_poa_effective_date",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "2020-01-01" },
          },
        },
        {
          field: {
            type: "DATE",
            alias: "p_poa_expiration_date",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "2031-01-01" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_poa_revocation_conditions",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "None" },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_poa_registered",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Y" },
          },
        },
        {
          field: {
            alias: "p_background_check",
            type: "BACKGROUND_CHECK",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_tax_id_document",
            type: "FILE",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_deed_incorporation",
            type: "FILE",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_bylaws",
            type: "FILE",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_client_status",
            type: "SELECT",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_relationship",
            type: "CHECKBOX",
          },
          files: null,
          value: null,
        },
      ]);

      for (const [alias, ptf] of Object.entries(legalEntityProfileTypeFields)) {
        const reply = legalEntityChildReplies.find(
          (r) =>
            r.parent_petition_field_reply_id === legalEntityReply.id &&
            r.petition_field_id ===
              legalEntityChildFields.find((f) => f.alias === `le_${alias}`)!.id,
        );
        if (!reply) {
          continue;
        }

        if (ptf.type === "FILE") {
          const [pff] = await mocks.knex
            .from("profile_field_file")
            .where({
              profile_id: profile.id,
              profile_type_field_id: ptf.id,
              removed_at: null,
              deleted_at: null,
            })
            .select("*");
          expect(pff).toBeDefined();
          expect(pff.petition_field_reply_id).toEqual(reply.id);
        } else {
          const [pfv] = await mocks.knex
            .from("profile_field_value")
            .where({
              profile_id: profile.id,
              profile_type_field_id: ptf.id,
              removed_at: null,
              deleted_at: null,
            })
            .select("*");
          expect(pfv).toBeDefined();
          expect(pfv.petition_field_reply_id).toEqual(reply.id);
        }
      }
    });

    it("archives CONTRACT FIELD_GROUP reply into an empty profile", async () => {
      const [profile] = await mocks.createRandomProfiles(organization.id, contract.id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
              field {
                petition {
                  ... on Petition {
                    events(limit: 10, offset: 0) {
                      totalCount
                      items {
                        type
                        data
                      }
                    }
                  }
                }
              }
              associatedProfile {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                properties {
                  field {
                    type
                    alias
                  }
                  files {
                    id
                  }
                  value {
                    id
                    content
                    expiryDate
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", contractField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", contractReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [], // should not ask for expiration on p:expiry_date field as it is already defined and has option useReplyAsExpiryDate
        },
      );

      expect(errors).toBeUndefined();

      expect(pick(data?.archiveFieldGroupReplyIntoProfile, ["id", "field"])).toEqual({
        id: toGlobalId("PetitionFieldReply", contractReply.id),
        field: {
          petition: {
            events: {
              totalCount: 1,
              items: [
                {
                  type: "PROFILE_ASSOCIATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileId: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
                  },
                },
              ],
            },
          },
        },
      });

      expect(
        pick(data?.archiveFieldGroupReplyIntoProfile.associatedProfile, ["id", "events"]),
      ).toEqual({
        id: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
        events: {
          totalCount: 25,
          items: [
            {
              type: "PROFILE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
              },
            },

            ...[
              "p_legal_contact_email",
              "p_legal_contact_full_name",
              "p_billing_contact_email",
              "p_billing_contact_full_name",
              "p_notes",
              "p_security_provisions",
              "p_compliance_obligations",
              "p_dispute_resolution_mechanism",
              "p_performance_metrics",
              "p_confidentiality_agreement",
              "p_termination_clauses",
              "p_renewal_terms",
              "p_payment_terms",
              "p_contract_currency",
              "p_contract_value",
              "p_jurisdiction",
            ].map((alias) => ({
              type: "PROFILE_FIELD_VALUE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  contractProfileTypeFields[alias].id,
                ),
                alias,
              },
            })),
            {
              type: "PROFILE_FIELD_EXPIRY_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  contractProfileTypeFields["p_expiration_date"].id,
                ),
                alias: "p_expiration_date",
                expiryDate: "2022-01-01",
              },
            },
            ...["p_expiration_date", "p_effective_date", "p_contract_type", "p_counterparty"].map(
              (alias) => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    contractProfileTypeFields[alias].id,
                  ),
                  alias,
                },
              }),
            ),
            ...["p_amendments", "p_original_document"].map((alias) => ({
              type: "PROFILE_FIELD_FILE_ADDED",
              data: {
                userId: toGlobalId("User", user.id),
                profileFieldFileId: expect.any(String),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  contractProfileTypeFields[alias].id,
                ),
                alias,
              },
            })),
            {
              type: "PETITION_ASSOCIATED",
              data: {
                petitionId: toGlobalId("Petition", petition.id),
                userId: toGlobalId("User", user.id),
              },
            },
          ],
        },
      });

      expect(
        data.archiveFieldGroupReplyIntoProfile.associatedProfile.properties.slice(0, 23),
      ).toEqual([
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_counterparty",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Sulley" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_contract_type",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "EMPLOYMENT_CONTRACT" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "DATE",
            alias: "p_effective_date",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "2020-01-01" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "DATE",
            alias: "p_expiration_date",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "2022-01-01" },
            expiryDate: "2022-01-01",
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_jurisdiction",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "US" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "NUMBER",
            alias: "p_contract_value",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: 1000000 },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_contract_currency",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "USD" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_payment_terms",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Net 30" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_renewal_terms",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "None" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "FILE",
            alias: "p_original_document",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "FILE",
            alias: "p_amendments",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_termination_clauses",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "None" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_confidentiality_agreement",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Y" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_performance_metrics",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Metrics are good" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_dispute_resolution_mechanism",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Arbitration" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_compliance_obligations",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "None" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_security_provisions",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "None" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "TEXT",
            alias: "p_notes",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "No notes" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_billing_contact_full_name",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "James P. Sullivan" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_billing_contact_email",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "jpsullivan@monsterinc.com" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_legal_contact_full_name",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Randall Boggs" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_legal_contact_email",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "rboggs@monsterinc.com" },
            expiryDate: null,
          },
        },
        {
          field: {
            type: "DATE",
            alias: "p_signature_date",
          },
          value: null,
          files: null,
        },
      ]);

      for (const [alias, ptf] of Object.entries(contractProfileTypeFields)) {
        const reply = contractChildReplies.find(
          (r) =>
            r.parent_petition_field_reply_id === contractReply.id &&
            r.petition_field_id === contractChildFields.find((f) => f.alias === `c_${alias}`)!.id,
        );
        if (!reply) {
          continue;
        }

        if (ptf.type === "FILE") {
          const [pff] = await mocks.knex
            .from("profile_field_file")
            .where({
              profile_id: profile.id,
              profile_type_field_id: ptf.id,
              removed_at: null,
              deleted_at: null,
            })
            .select("*");
          expect(pff).toBeDefined();
          expect(pff.petition_field_reply_id).toEqual(reply.id);
        } else {
          const [pfv] = await mocks.knex
            .from("profile_field_value")
            .where({
              profile_id: profile.id,
              profile_type_field_id: ptf.id,
              removed_at: null,
              deleted_at: null,
            })
            .select("*");
          expect(pfv).toBeDefined();
          expect(pfv.petition_field_reply_id).toEqual(reply.id);
        }
      }
    });

    it("does not update value or create event if BACKGROUND_CHECK value is already present on profile and its the same", async () => {
      const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);

      await mocks.createProfileFieldValues(profile.id, [
        {
          type: "BACKGROUND_CHECK",
          created_by_user_id: user.id,
          profile_type_field_id: individualProfileTypeFields["p_background_check"].id,
          content: {
            query: { name: "Mike Wazowski", date: null, type: "Person" },
            search: {
              totalCount: 1,
              items: [{ id: "1", type: "Person", name: "Mike Wazowski", properties: {} }],
              createdAt: new Date(),
            },
            entity: { id: "1", type: "Person", name: "Mike Wazowski", properties: {} },
          },
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            $propertiesFilter: [ProfileFieldPropertyFilter!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
              associatedProfile {
                id
                properties(filter: $propertiesFilter) {
                  field {
                    type
                    alias
                  }
                  files {
                    id
                  }
                  value {
                    id
                    content
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", individualField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [],
          propertiesFilter: [
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                individualProfileTypeFields["p_background_check"].id,
              ),
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
        id: toGlobalId("PetitionFieldReply", individualReply.id),
        associatedProfile: {
          id: toGlobalId("Profile", profile.id),
          properties: [
            {
              field: {
                type: "BACKGROUND_CHECK",
                alias: "p_background_check",
              },
              files: null,
              value: {
                id: expect.any(String),
                content: {
                  query: { name: "Mike Wazowski", date: null, type: "Person" },
                  search: {
                    totalCount: 1,
                    createdAt: expect.any(String),
                    falsePositivesCount: 0,
                  },
                  entity: { id: "1", type: "Person", name: "Mike Wazowski", properties: {} },
                },
              },
            },
          ],
        },
      });
    });

    it("sends error when expiration info is required and not provided", async () => {
      const [profile] = await mocks.createRandomProfiles(organization.id, contract.id, 1);

      await mocks.knex
        .from("profile_type_field")
        .where("id", contractProfileTypeFields["p_expiration_date"].id)
        .update({
          options: JSON.stringify({
            ...contractProfileTypeFields["p_expiration_date"].options,
            useReplyAsExpiryDate: false,
          }),
        });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", contractField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", contractReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toContainGraphQLError("CONFLICT_RESOLUTION_REQUIRED_ERROR", {
        conflictResolutions: [],
        expirations: [
          toGlobalId("ProfileTypeField", contractProfileTypeFields["p_expiration_date"].id),
        ],
      });
      expect(data).toBeNull();

      await mocks.knex
        .from("profile_type_field")
        .where("id", contractProfileTypeFields["p_expiration_date"].id)
        .update({
          options: JSON.stringify({
            ...contractProfileTypeFields["p_expiration_date"].options,
            useReplyAsExpiryDate: true,
          }),
        });
    });

    it("sends error when a conflict exists with a current value in the profile and conflictResolution is not provided", async () => {
      const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", contract.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                contractProfileTypeFields["p_counterparty"].id,
              ),
              content: {
                value: "Mike Wazowski",
              },
            },
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                contractProfileTypeFields["p_contract_type"].id,
              ),
              content: { value: "SERVICE_AGREEMENT" },
            },
          ],
        },
      );

      expect(createProfileErrors).toBeUndefined();
      expect(createProfileData?.createProfile).toEqual({
        id: expect.any(String),
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", contractField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", contractReply.id),
          profileId: createProfileData!.createProfile.id,
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toContainGraphQLError("CONFLICT_RESOLUTION_REQUIRED_ERROR", {
        conflictResolutions: [
          toGlobalId("ProfileTypeField", contractProfileTypeFields["p_counterparty"].id),
          toGlobalId("ProfileTypeField", contractProfileTypeFields["p_contract_type"].id),
        ],
        expirations: [],
      });
      expect(data).toBeNull();
    });

    it("skips value if it already exists on the profile and its the same content", async () => {
      const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
              events(limit: 100, offset: 0) {
                totalCount
                items {
                  type
                  data
                }
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", contract.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                contractProfileTypeFields["p_counterparty"].id,
              ),
              content: {
                value: "Sulley",
              },
            },
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                contractProfileTypeFields["p_contract_type"].id,
              ),
              content: { value: "EMPLOYMENT_CONTRACT" },
            },
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                contractProfileTypeFields["p_effective_date"].id,
              ),
              content: { value: "2020-01-01" },
            },
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                contractProfileTypeFields["p_expiration_date"].id,
              ),
              content: { value: "2022-01-01" },
            },
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                contractProfileTypeFields["p_jurisdiction"].id,
              ),
              content: { value: "US" },
            },
          ],
        },
      );

      expect(createProfileErrors).toBeUndefined();

      expect(createProfileData?.createProfile).toEqual({
        id: expect.any(String),
        events: {
          totalCount: 8,
          items: [
            {
              type: "PROFILE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
              },
            },
            {
              type: "PROFILE_FIELD_VALUE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  contractProfileTypeFields["p_jurisdiction"].id,
                ),
                alias: "p_jurisdiction",
              },
            },
            {
              type: "PROFILE_FIELD_EXPIRY_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  contractProfileTypeFields["p_expiration_date"].id,
                ),
                alias: "p_expiration_date",
                expiryDate: "2022-01-01",
              },
            },
            ...["p_expiration_date", "p_effective_date", "p_contract_type", "p_counterparty"].map(
              (alias) => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    contractProfileTypeFields[alias].id,
                  ),
                  alias,
                },
              }),
            ),
            {
              type: "PROFILE_CREATED",
              data: {
                userId: toGlobalId("User", user.id),
              },
            },
          ],
        },
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
              associatedProfile {
                id
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
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", contractField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", contractReply.id),
          profileId: createProfileData!.createProfile.id,
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
        id: toGlobalId("PetitionFieldReply", contractReply.id),
        associatedProfile: {
          id: createProfileData!.createProfile.id,
          events: {
            totalCount: 27,
            items: expect.toIncludeSameMembers([
              {
                type: "PROFILE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                },
              },
              ...[
                "p_notes",
                "p_performance_metrics",
                "p_renewal_terms",
                "p_billing_contact_full_name",
                "p_contract_value",
                "p_termination_clauses",
                "p_confidentiality_agreement",
                "p_contract_currency",
                "p_compliance_obligations",
                "p_legal_contact_full_name",
                "p_dispute_resolution_mechanism",
                "p_legal_contact_email",
                "p_billing_contact_email",
                "p_security_provisions",
                "p_payment_terms",
              ].map((alias) => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    contractProfileTypeFields[alias].id,
                  ),
                  alias,
                },
              })),
              ...["p_amendments", "p_original_document"].map((alias) => ({
                type: "PROFILE_FIELD_FILE_ADDED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileFieldFileId: expect.any(String),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    contractProfileTypeFields[alias].id,
                  ),
                  alias,
                },
              })),
              {
                type: "PETITION_ASSOCIATED",
                data: {
                  petitionId: toGlobalId("Petition", petition.id),
                  userId: toGlobalId("User", user.id),
                },
              },
              // EVENTS FROM BEFORE
              {
                type: "PROFILE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                },
              },
              {
                type: "PROFILE_FIELD_EXPIRY_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    contractProfileTypeFields["p_expiration_date"].id,
                  ),
                  alias: "p_expiration_date",
                  expiryDate: "2022-01-01",
                },
              },
              ...[
                "p_jurisdiction",
                "p_expiration_date",
                "p_effective_date",
                "p_contract_type",
                "p_counterparty",
              ].map((alias) => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    contractProfileTypeFields[alias].id,
                  ),
                  alias,
                },
              })),
              {
                type: "PROFILE_CREATED",
                data: {
                  userId: toGlobalId("User", user.id),
                },
              },
            ]),
          },
        },
      });

      // make sure first event is PROFILE_UPDATED
      expect(
        data?.archiveFieldGroupReplyIntoProfile.associatedProfile.events.items[0].type,
      ).toEqual("PROFILE_UPDATED");
      //make sure last event is PROFILE_CREATED
      expect(
        data?.archiveFieldGroupReplyIntoProfile.associatedProfile.events.items[
          data?.archiveFieldGroupReplyIntoProfile.associatedProfile.events.items.length - 1
        ].type,
      ).toEqual("PROFILE_CREATED");
    });

    it("skips file if it already exists on the profile and it has the same path", async () => {
      const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", individual.id),
          fields: [],
        },
      );

      expect(createProfileErrors).toBeUndefined();
      expect(createProfileData?.createProfile).toEqual({
        id: expect.any(String),
      });

      const clonedFiles = await mocks.createRandomFileUpload(4, (i) => ({
        path: fileUploads[i].path,
      }));

      // add files to profile
      const profileFieldFiles = await mocks.knex.from("profile_field_file").insert(
        [
          "p_proof_of_address_document",
          "p_id_document",
          "p_passport_document",
          "p_risk_assessment",
        ].map((alias, i) => ({
          created_by_user_id: user.id,
          file_upload_id: clonedFiles[i].id,
          profile_id: fromGlobalId(createProfileData!.createProfile.id).id,
          type: "FILE",
          profile_type_field_id: individualProfileTypeFields[alias].id,
        })),
        "*",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
              associatedProfile {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                properties {
                  field {
                    alias
                    type
                  }
                  value {
                    content
                  }
                  files {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", individualField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
          profileId: createProfileData!.createProfile.id,
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data.archiveFieldGroupReplyIntoProfile.id).toEqual(
        toGlobalId("PetitionFieldReply", individualReply.id),
      );

      expect(
        pick(data.archiveFieldGroupReplyIntoProfile.associatedProfile, ["id", "events"]),
      ).toEqual({
        id: createProfileData!.createProfile.id,
        events: {
          totalCount: 22,
          items: [
            {
              type: "PROFILE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
              },
            },
            ...[
              "p_occupation",
              "p_background_check",
              "p_source_of_funds",
              "p_risk",
              "p_is_pep",
              "p_passport_number",
              "p_tax_id",
              "p_citizenship",
              "p_country_of_residence",
              "p_zip",
              "p_city",
              "p_address",
              "p_gender",
              "p_birth_date",
              "p_mobile_phone_number",
              "p_phone_number",
              "p_email",
              "p_last_name",
              "p_first_name",
            ].map((alias) => ({
              type: "PROFILE_FIELD_VALUE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualProfileTypeFields[alias].id,
                ),
                alias,
              },
            })),
            {
              type: "PETITION_ASSOCIATED",
              data: {
                petitionId: toGlobalId("Petition", petition.id),
                userId: toGlobalId("User", user.id),
              },
            },
            {
              type: "PROFILE_CREATED",
              data: {
                userId: toGlobalId("User", user.id),
              },
            },
          ],
        },
      });

      const fileProperties =
        data.archiveFieldGroupReplyIntoProfile.associatedProfile.properties.filter(
          (p: any) => p.field.type === "FILE",
        );

      expect(fileProperties).toEqual([
        {
          field: {
            alias: "p_proof_of_address_document",
            type: "FILE",
          },
          value: null,
          files: [
            {
              id: toGlobalId("ProfileFieldFile", profileFieldFiles[0].id),
            },
          ],
        },

        {
          field: {
            alias: "p_id_document",
            type: "FILE",
          },
          value: null,
          files: [
            {
              id: toGlobalId("ProfileFieldFile", profileFieldFiles[1].id),
            },
          ],
        },
        {
          field: {
            alias: "p_passport_document",
            type: "FILE",
          },
          value: null,
          files: [
            {
              id: toGlobalId("ProfileFieldFile", profileFieldFiles[2].id),
            },
          ],
        },

        {
          field: {
            alias: "p_risk_assessment",
            type: "FILE",
          },
          value: null,
          files: [
            {
              id: toGlobalId("ProfileFieldFile", profileFieldFiles[3].id),
            },
          ],
        },

        {
          field: {
            alias: "p_poa",
            type: "FILE",
          },
          files: null,
          value: null,
        },
      ]);
    });

    it("ignoring TEXT conflict on an expirable field should not trigger an expiration conflict", async () => {
      // make field expirable just for this test
      await mocks.knex
        .from("profile_type_field")
        .where("id", individualProfileTypeFields["p_risk"].id)
        .update("is_expirable", true);

      const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", individual.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                individualProfileTypeFields["p_risk"].id,
              ),
              content: {
                value: "HIGH",
              },
            },
          ],
        },
      );

      expect(createProfileErrors).toBeUndefined();
      expect(createProfileData?.createProfile).toEqual({
        id: expect.any(String),
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
              associatedProfile {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", individualField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
          profileId: createProfileData!.createProfile.id,
          conflictResolutions: [
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                individualProfileTypeFields["p_risk"].id,
              ),
              action: "IGNORE",
            },
          ],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
        id: toGlobalId("PetitionFieldReply", individualReply.id),
        associatedProfile: {
          id: createProfileData!.createProfile.id,
        },
      });

      await mocks.knex
        .from("profile_type_field")
        .where("id", individualProfileTypeFields["p_risk"].id)
        .update("is_expirable", false);
    });

    it("ignoring FILE conflict on an expirable field should not trigger an expiration conflict", async () => {
      // make field expirable just for this test
      await mocks.knex
        .from("profile_type_field")
        .where("id", individualProfileTypeFields["p_id_document"].id)
        .update("is_expirable", true);

      const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", individual.id),
          fields: [],
        },
      );

      expect(createProfileErrors).toBeUndefined();
      expect(createProfileData?.createProfile).toEqual({
        id: expect.any(String),
      });

      const [fileUpload] = await mocks.createRandomFileUpload(1);

      // add file to profile
      await mocks.knex.from("profile_field_file").insert(
        {
          created_by_user_id: user.id,
          file_upload_id: fileUpload.id,
          profile_id: fromGlobalId(createProfileData!.createProfile.id).id,
          type: "FILE",
          profile_type_field_id: individualProfileTypeFields["p_id_document"].id,
        },
        "*",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
              associatedProfile {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", individualField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
          profileId: createProfileData!.createProfile.id,
          conflictResolutions: [
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                individualProfileTypeFields["p_id_document"].id,
              ),
              action: "IGNORE",
            },
          ],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
        id: toGlobalId("PetitionFieldReply", individualReply.id),
        associatedProfile: {
          id: createProfileData!.createProfile.id,
        },
      });

      await mocks.knex
        .from("profile_type_field")
        .where("id", individualProfileTypeFields["p_id_document"].id)
        .update("is_expirable", false);
    });

    it("appends new files to the profile when passing APPEND resolution", async () => {
      const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", legalEntity.id),
          fields: [],
        },
      );

      expect(createProfileErrors).toBeUndefined();
      expect(createProfileData?.createProfile).toEqual({
        id: expect.any(String),
      });

      const [replyFile, profileFile1, profileFile2] = await mocks.createRandomFileUpload(
        3,
        (i) => ({
          path: ["/same-path", "/same-path", "/other-path"][i],
        }),
      );

      // add file to profile
      const profileFieldFiles = await mocks.knex.from("profile_field_file").insert(
        [profileFile1, profileFile2].map((file) => ({
          created_by_user_id: user.id,
          file_upload_id: file.id,
          profile_id: fromGlobalId(createProfileData!.createProfile.id).id,
          type: "FILE",
          profile_type_field_id: legalEntityProfileTypeFields["p_poa_document"].id,
        })),
        "*",
      );

      // add file with same path to the petition reply
      const [reply] = await mocks.knex.from("petition_field_reply").insert(
        {
          user_id: user.id,
          parent_petition_field_reply_id: individualReply.id,
          petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_poa_document")!
            .id,
          content: { file_upload_id: replyFile.id },
          type: "FILE_UPLOAD",
        },
        "*",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
              associatedProfile {
                id
                properties {
                  field {
                    alias
                    type
                  }
                  value {
                    content
                  }
                  files {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", legalEntityField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", legalEntityReply.id),
          profileId: createProfileData!.createProfile.id,
          conflictResolutions: [
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                legalEntityProfileTypeFields["p_poa_document"].id,
              ),
              action: "APPEND",
            },
          ],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data.archiveFieldGroupReplyIntoProfile.id).toEqual(
        toGlobalId("PetitionFieldReply", legalEntityReply.id),
      );
      expect(data?.archiveFieldGroupReplyIntoProfile.associatedProfile.id).toEqual(
        createProfileData!.createProfile.id,
      );

      const fileProperties =
        data?.archiveFieldGroupReplyIntoProfile.associatedProfile.properties.filter(
          (p: any) => p.field.type === "FILE",
        );

      expect(fileProperties).toEqual([
        {
          field: {
            alias: "p_ownership_structure",
            type: "FILE",
          },
          value: null,
          files: [
            {
              id: expect.any(String),
            },
          ],
        },
        {
          field: {
            alias: "p_ubo_statement",
            type: "FILE",
          },
          value: null,
          files: [
            {
              id: expect.any(String),
            },
          ],
        },
        {
          field: {
            alias: "p_financial_statements",
            type: "FILE",
          },
          value: null,
          files: [
            {
              id: expect.any(String),
            },
          ],
        },
        {
          field: {
            alias: "p_risk_assessment",
            type: "FILE",
          },
          value: null,
          files: [
            {
              id: expect.any(String),
            },
          ],
        },
        {
          field: {
            alias: "p_poa_document",
            type: "FILE",
          },
          value: null,
          files: [
            {
              id: toGlobalId("ProfileFieldFile", profileFieldFiles[0].id),
            },
            {
              id: toGlobalId("ProfileFieldFile", profileFieldFiles[1].id),
            },
            {
              id: expect.any(String),
            },
          ],
        },
        {
          field: {
            alias: "p_tax_id_document",
            type: "FILE",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_deed_incorporation",
            type: "FILE",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_bylaws",
            type: "FILE",
          },
          files: null,
          value: null,
        },
      ]);

      await mocks.knex.from("petition_field_reply").where("id", reply.id).delete();
    });

    it("replaces all distinct files from field when passing OVERWRITE resolution", async () => {
      const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", legalEntity.id),
          fields: [],
        },
      );

      expect(createProfileErrors).toBeUndefined();
      expect(createProfileData?.createProfile).toEqual({
        id: expect.any(String),
      });

      const [replyFile1, profileFile1, profileFile2] = await mocks.createRandomFileUpload(
        3,
        (i) => ({
          path: ["/reply-1", "/reply-1", "/profile-2"][i],
        }),
      );

      // add file to profile
      const profileFieldFiles = await mocks.knex.from("profile_field_file").insert(
        [profileFile1, profileFile2].map((file) => ({
          created_by_user_id: user.id,
          file_upload_id: file.id,
          profile_id: fromGlobalId(createProfileData!.createProfile.id).id,
          type: "FILE",
          profile_type_field_id: legalEntityProfileTypeFields["p_poa_document"].id,
        })),
        "*",
      );

      // add file with same path to the petition reply
      const [reply] = await mocks.knex.from("petition_field_reply").insert(
        {
          user_id: user.id,
          parent_petition_field_reply_id: legalEntityReply.id,
          petition_field_id: legalEntityChildFields.find((f) => f.alias === "le_p_poa_document")!
            .id,
          content: { file_upload_id: replyFile1.id },
          type: "FILE_UPLOAD",
        },
        "*",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
              associatedProfile {
                id
                properties {
                  field {
                    alias
                    type
                  }
                  value {
                    content
                  }
                  files {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", legalEntityField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", legalEntityReply.id),
          profileId: createProfileData!.createProfile.id,
          conflictResolutions: [
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                legalEntityProfileTypeFields["p_poa_document"].id,
              ),
              action: "OVERWRITE",
            },
          ],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile.id).toEqual(
        toGlobalId("PetitionFieldReply", legalEntityReply.id),
      );
      expect(data?.archiveFieldGroupReplyIntoProfile.associatedProfile.id).toEqual(
        createProfileData!.createProfile.id,
      );

      const fileProperties =
        data?.archiveFieldGroupReplyIntoProfile.associatedProfile.properties.filter(
          (p: any) => p.field.type === "FILE",
        );

      expect(fileProperties).toEqual([
        {
          field: {
            alias: "p_ownership_structure",
            type: "FILE",
          },
          value: null,
          files: [
            {
              id: expect.any(String),
            },
          ],
        },
        {
          field: {
            alias: "p_ubo_statement",
            type: "FILE",
          },
          value: null,
          files: [
            {
              id: expect.any(String),
            },
          ],
        },
        {
          field: {
            alias: "p_financial_statements",
            type: "FILE",
          },
          value: null,
          files: [
            {
              id: expect.any(String),
            },
          ],
        },
        {
          field: {
            alias: "p_risk_assessment",
            type: "FILE",
          },
          value: null,
          files: [
            {
              id: expect.any(String),
            },
          ],
        },
        {
          field: {
            alias: "p_poa_document",
            type: "FILE",
          },
          value: null,
          files: [
            {
              id: toGlobalId("ProfileFieldFile", profileFieldFiles[0].id),
            },
            {
              id: expect.any(String),
            },
          ],
        },
        {
          field: {
            alias: "p_tax_id_document",
            type: "FILE",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_deed_incorporation",
            type: "FILE",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_bylaws",
            type: "FILE",
          },
          files: null,
          value: null,
        },
      ]);

      await mocks.knex.from("petition_field_reply").where("id", reply.id).delete();
    });

    it("fails if petition is not closed", async () => {
      await mocks.knex
        .from("petition")
        .where("id", petition.id)
        .update({ status: "PENDING", closed_at: null });

      const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", individualField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toContainGraphQLError("PETITION_STATUS_ERROR");
      expect(data).toBeNull();

      await mocks.knex
        .from("petition")
        .where("id", petition.id)
        .update({ status: "CLOSED", closed_at: new Date() });
    });

    it("fails if field is not linked to a profile type", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", individualField.id)
        .update("profile_type_id", null);

      const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", individualField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();

      await mocks.knex
        .from("petition_field")
        .where("id", individualField.id)
        .update("profile_type_id", individual.id);
    });

    it("fails if field group is not visible", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", individualField.id)
        .update({
          visibility: {
            type: "HIDE",
            operator: "AND",
            conditions: [
              {
                value: "HIDE_INDIVIDUAL",
                fieldId: textField.id,
                modifier: "ANY",
                operator: "EQUAL",
              },
            ],
          },
        });

      await mocks.knex.from("petition_field_reply").insert({
        content: { value: "HIDE_INDIVIDUAL" },
        petition_field_id: textField.id,
        user_id: user.id,
        type: "TEXT",
      });

      const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", individualField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();

      await mocks.knex.from("petition_field").where("id", individualField.id).update({
        visibility: null,
      });
    });

    it("ignores replies on fields that are not visible on current visibility config", async () => {
      await mocks.knex
        .from("petition_field")
        .whereIn(
          "id",
          [
            "le_p_registration_number",
            "le_p_tax_id",
            "le_p_registered_address",
            "le_p_city",
            "le_p_zip",
            "le_p_financial_statements",
          ].map((alias) => legalEntityChildFields.find((c) => c.alias === alias)!.id),
        )
        .update({
          visibility: {
            type: "HIDE",
            operator: "AND",
            conditions: [
              {
                fieldId: legalEntityChildFields.find((c) => c.alias === "le_p_entity_type")!.id,
                modifier: "ANY",
                operator: "EQUAL",
                value: "INCORPORATED",
              },
            ],
          },
        });

      const [profile] = await mocks.createRandomProfiles(organization.id, legalEntity.id, 1);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
              associatedProfile {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                properties {
                  field {
                    type
                    alias
                  }
                  value {
                    content
                  }
                  files {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", legalEntityField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", legalEntityReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          overrideFields: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data.archiveFieldGroupReplyIntoProfile.id).toEqual(
        toGlobalId("PetitionFieldReply", legalEntityReply.id),
      );
      expect(
        pick(data?.archiveFieldGroupReplyIntoProfile.associatedProfile, ["id", "events"]),
      ).toEqual({
        id: expect.any(String),
        events: {
          totalCount: 19,
          items: [
            {
              type: "PROFILE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
              },
            },
            ...[
              "p_poa_registered",
              "p_poa_revocation_conditions",
              "p_poa_expiration_date",
              "p_poa_effective_date",
              "p_poa_scope",
              "p_poa_types",
              "p_risk",
              "p_main_business_activity",
              "p_date_of_incorporation",
              "p_country_of_incorporation",
              "p_entity_type",
              "p_trade_name",
              "p_entity_name",
            ].map((alias) => ({
              type: "PROFILE_FIELD_VALUE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields[alias].id,
                ),
                alias,
              },
            })),
            ...[
              "p_poa_document",
              "p_risk_assessment",
              "p_ubo_statement",
              "p_ownership_structure",
            ].map((alias) => ({
              type: "PROFILE_FIELD_FILE_ADDED",
              data: {
                userId: toGlobalId("User", user.id),
                profileFieldFileId: expect.any(String),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields[alias].id,
                ),
                alias,
              },
            })),
            {
              type: "PETITION_ASSOCIATED",
              data: {
                petitionId: toGlobalId("Petition", petition.id),
                userId: toGlobalId("User", user.id),
              },
            },
          ],
        },
      });

      expect(
        data.archiveFieldGroupReplyIntoProfile.associatedProfile.properties.slice(0, 31),
      ).toEqual([
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_entity_name",
          },
          files: null,
          value: {
            content: { value: "Monsters Inc." },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_trade_name",
          },
          files: null,
          value: {
            content: { value: "Monsters Inc." },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_entity_type",
          },
          files: null,
          value: {
            content: { value: "INCORPORATED" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_registration_number",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_tax_id",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_registered_address",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "PHONE",
            alias: "p_phone_number",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_city",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_zip",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "SELECT",
            alias: "p_country",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "SELECT",
            alias: "p_country_of_incorporation",
          },
          files: null,
          value: {
            content: { value: "US" },
          },
        },
        {
          field: {
            type: "DATE",
            alias: "p_date_of_incorporation",
          },
          files: null,
          value: {
            content: { value: "1890-12-24" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_main_business_activity",
          },
          files: null,
          value: {
            content: { value: "Scaring" },
          },
        },
        {
          field: {
            type: "FILE",
            alias: "p_ownership_structure",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "FILE",
            alias: "p_ubo_statement",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "FILE",
            alias: "p_financial_statements",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "SELECT",
            alias: "p_risk",
          },
          files: null,
          value: {
            content: { value: "MEDIUM" },
          },
        },
        {
          field: {
            type: "FILE",
            alias: "p_risk_assessment",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "SELECT",
            alias: "p_poa_types",
          },
          files: null,
          value: {
            content: { value: "GENERAL_POA" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_poa_scope",
          },
          files: null,
          value: {
            content: { value: "All" },
          },
        },
        {
          field: {
            type: "FILE",
            alias: "p_poa_document",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "DATE",
            alias: "p_poa_effective_date",
          },
          files: null,
          value: {
            content: { value: "2020-01-01" },
          },
        },
        {
          field: {
            type: "DATE",
            alias: "p_poa_expiration_date",
          },
          files: null,
          value: {
            content: { value: "2031-01-01" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_poa_revocation_conditions",
          },
          files: null,
          value: {
            content: { value: "None" },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_poa_registered",
          },
          files: null,
          value: {
            content: { value: "Y" },
          },
        },
        {
          field: {
            alias: "p_background_check",
            type: "BACKGROUND_CHECK",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_tax_id_document",
            type: "FILE",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_deed_incorporation",
            type: "FILE",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_bylaws",
            type: "FILE",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_client_status",
            type: "SELECT",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_relationship",
            type: "CHECKBOX",
          },
          files: null,
          value: null,
        },
      ]);

      await mocks.knex
        .from("petition_field")
        .where("parent_petition_field_id", legalEntityField.id)
        .update({ visibility: null });
    });

    it("fails if profile has different profile_type than the field group", async () => {
      const [profile] = await mocks.createRandomProfiles(organization.id, contract.id, 1);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", individualField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if user does not have WRITE permission on a field to overwrite", async () => {
      await mocks.knex
        .from("profile_type_field")
        .where("id", individualProfileTypeFields["p_first_name"].id)
        .update("permission", "READ");

      const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);
      await mocks.createProfileFieldValues(profile.id, [
        {
          created_by_user_id: user.id,
          profile_type_field_id: individualProfileTypeFields["p_first_name"].id,
          type: "SHORT_TEXT",
          content: { value: "Jane" },
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", individualField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                individualProfileTypeFields["p_first_name"].id,
              ),
              action: "OVERWRITE",
            },
          ],
          expirations: [],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();

      await mocks.knex
        .from("profile_type_field")
        .where("id", individualProfileTypeFields["p_first_name"].id)
        .update("permission", "WRITE");
    });

    it("does not create values on properties with READ or HIDDEN permission", async () => {
      await mocks.knex
        .from("profile_type_field")
        .whereIn("id", [
          individualProfileTypeFields["p_first_name"].id,
          individualProfileTypeFields["p_last_name"].id,
          individualProfileTypeFields["p_id_document"].id,
        ])
        .update("permission", ["HIDDEN", "READ"][Math.round(Math.random())]);

      const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
              field {
                petition {
                  ... on Petition {
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
              associatedProfile {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                properties {
                  field {
                    type
                    alias
                  }
                  files {
                    id
                  }
                  value {
                    id
                    content
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", individualField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();

      expect(pick(data.archiveFieldGroupReplyIntoProfile, ["id", "field"])).toEqual({
        id: toGlobalId("PetitionFieldReply", individualReply.id),
        field: {
          petition: {
            events: {
              totalCount: 1,
              items: [
                {
                  type: "PROFILE_ASSOCIATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileId: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
                  },
                },
              ],
            },
          },
        },
      });
      expect(
        pick(data?.archiveFieldGroupReplyIntoProfile.associatedProfile, ["id", "events"]),
      ).toEqual({
        id: data!.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
        events: {
          totalCount: 22,
          items: [
            {
              type: "PROFILE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
              },
            },
            ...[
              "p_occupation",
              "p_background_check",
              "p_source_of_funds",
              "p_risk",
              "p_is_pep",
              "p_passport_number",
              "p_tax_id",
              "p_citizenship",
              "p_country_of_residence",
              "p_zip",
              "p_city",
              "p_address",
              "p_gender",
              "p_birth_date",
              "p_mobile_phone_number",
              "p_phone_number",
              "p_email",
            ].map((alias) => ({
              type: "PROFILE_FIELD_VALUE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualProfileTypeFields[alias].id,
                ),
                alias,
              },
            })),
            ...["p_risk_assessment", "p_passport_document", "p_proof_of_address_document"].map(
              (alias) => ({
                type: "PROFILE_FIELD_FILE_ADDED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileFieldFileId: expect.any(String),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    individualProfileTypeFields[alias].id,
                  ),
                  alias,
                },
              }),
            ),
            {
              type: "PETITION_ASSOCIATED",
              data: {
                petitionId: toGlobalId("Petition", petition.id),
                userId: toGlobalId("User", user.id),
              },
            },
          ],
        },
      });

      expect(
        data.archiveFieldGroupReplyIntoProfile.associatedProfile.properties.slice(0, 28),
      ).toEqual([
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_first_name",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_last_name",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_email",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "mwazowski@monsterinc.com" },
          },
        },
        {
          field: {
            type: "PHONE",
            alias: "p_phone_number",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "+123456789", pretty: "+1 23456789" },
          },
        },
        {
          field: {
            type: "PHONE",
            alias: "p_mobile_phone_number",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "+987654321", pretty: "+98 7654321" },
          },
        },
        {
          field: {
            type: "DATE",
            alias: "p_birth_date",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "1990-02-02" },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_gender",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "M" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_address",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "1234 Elm Street" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_city",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Monstropolis" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_zip",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "12345" },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_country_of_residence",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "US" },
          },
        },
        {
          field: {
            type: "FILE",
            alias: "p_proof_of_address_document",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "SELECT",
            alias: "p_citizenship",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "US" },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_tax_id",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "123456789" },
          },
        },
        {
          field: {
            type: "FILE",
            alias: "p_id_document",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "FILE",
            alias: "p_passport_document",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_passport_number",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "A2345678X" },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_is_pep",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "N" },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_risk",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "LOW" },
          },
        },
        {
          field: {
            type: "FILE",
            alias: "p_risk_assessment",
          },
          files: [{ id: expect.any(String) }],
          value: null,
        },
        {
          field: {
            type: "TEXT",
            alias: "p_source_of_funds",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Salary" },
          },
        },
        {
          field: {
            type: "BACKGROUND_CHECK",
            alias: "p_background_check",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: {
              query: {
                name: "Mike Wazowski",
                date: null,
                type: "Person",
              },
              search: {
                totalCount: 1,
                createdAt: expect.any(String),
                falsePositivesCount: 0,
              },
              entity: {
                id: "1",
                type: "Person",
                name: "Mike Wazowski",
                properties: {},
              },
            },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_occupation",
          },
          files: null,
          value: {
            id: expect.any(String),
            content: { value: "Scarer" },
          },
        },
        {
          field: {
            alias: "p_poa",
            type: "FILE",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_position",
            type: "SHORT_TEXT",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_client_status",
            type: "SELECT",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_marital_status",
            type: "SELECT",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_relationship",
            type: "CHECKBOX",
          },
          files: null,
          value: null,
        },
      ]);

      await mocks.knex
        .from("profile_type_field")
        .whereIn("id", [
          individualProfileTypeFields["p_first_name"].id,
          individualProfileTypeFields["p_last_name"].id,
          individualProfileTypeFields["p_id_document"].id,
        ])
        .update("permission", "WRITE");
    });

    it("removes values and files from profile if overwriting with empty replies", async () => {
      const { errors: createProfileErrors, data: createProfileData } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
            createProfile(profileTypeId: $profileTypeId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", legalEntity.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                legalEntityProfileTypeFields["p_entity_name"].id,
              ),
              content: { value: "Parallel INC" },
            },
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                legalEntityProfileTypeFields["p_risk"].id,
              ),
              content: { value: "LOW" },
            },
          ],
        },
      );

      expect(createProfileErrors).toBeUndefined();
      expect(createProfileData?.createProfile).toEqual({
        id: expect.any(String),
      });

      const fileUploads = await mocks.createRandomFileUpload(2);
      // also insert some files
      await mocks.knex.from("profile_field_file").insert(
        ["p_ownership_structure", "p_ubo_statement"].map((alias, i) => ({
          created_by_user_id: user.id,
          file_upload_id: fileUploads[i].id,
          profile_id: fromGlobalId(createProfileData!.createProfile.id).id,
          profile_type_field_id: legalEntityProfileTypeFields[alias].id,
          type: "FILE",
        })),
      );

      // temporally delete replies from these fields
      const deletedReplies = await mocks.knex
        .from("petition_field_reply")
        .where("parent_petition_field_reply_id", legalEntityReply.id)
        .whereIn("petition_field_id", [
          legalEntityChildFields.find((f) => f.alias === "le_p_entity_name")!.id,
          legalEntityChildFields.find((f) => f.alias === "le_p_risk")!.id,
          legalEntityChildFields.find((f) => f.alias === "le_p_ownership_structure")!.id,
          legalEntityChildFields.find((f) => f.alias === "le_p_ubo_statement")!.id,
        ])
        .update({ deleted_at: new Date(), deleted_by: "TEST" })
        .returning("*");

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
              associatedProfile {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                properties {
                  field {
                    type
                    alias
                  }
                  files {
                    id
                  }
                  value {
                    content
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", legalEntityField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", legalEntityReply.id),
          profileId: createProfileData!.createProfile.id,
          conflictResolutions: [
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                legalEntityProfileTypeFields["p_entity_name"].id,
              ),
              action: "OVERWRITE",
            },
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                legalEntityProfileTypeFields["p_risk"].id,
              ),
              action: "OVERWRITE",
            },
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                legalEntityProfileTypeFields["p_ownership_structure"].id,
              ),
              action: "OVERWRITE",
            },
            {
              profileTypeFieldId: toGlobalId(
                "ProfileTypeField",
                legalEntityProfileTypeFields["p_ubo_statement"].id,
              ),
              action: "OVERWRITE",
            },
          ],
          expirations: [],
        },
      );

      await mocks.knex
        .from("petition_field_reply")
        .whereIn(
          "id",
          deletedReplies.map((r) => r.id),
        )
        .update({ deleted_at: null, deleted_by: null });

      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile.id).toEqual(
        toGlobalId("PetitionFieldReply", legalEntityReply.id),
      );
      expect(
        pick(data?.archiveFieldGroupReplyIntoProfile.associatedProfile, ["id", "events"]),
      ).toEqual({
        id: createProfileData.createProfile.id,
        events: {
          totalCount: 29,
          items: expect.toIncludeSameMembers([
            {
              type: "PROFILE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
              },
            },
            ...[
              "p_risk",
              "p_entity_name",
              "p_poa_registered",
              "p_poa_revocation_conditions",
              "p_poa_expiration_date",
              "p_poa_effective_date",
              "p_poa_scope",
              "p_poa_types",
              "p_main_business_activity",
              "p_date_of_incorporation",
              "p_country_of_incorporation",
              "p_zip",
              "p_city",
              "p_registered_address",
              "p_tax_id",
              "p_registration_number",
              "p_entity_type",
              "p_trade_name",
            ].map((alias) => ({
              type: "PROFILE_FIELD_VALUE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields[alias].id,
                ),
                alias,
              },
            })),
            ...["p_poa_document", "p_risk_assessment", "p_financial_statements"].map((alias) => ({
              type: "PROFILE_FIELD_FILE_ADDED",
              data: {
                userId: toGlobalId("User", user.id),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields[alias].id,
                ),
                profileFieldFileId: expect.any(String),
                alias,
              },
            })),
            ...["p_ubo_statement", "p_ownership_structure"].map((alias) => ({
              type: "PROFILE_FIELD_FILE_REMOVED",
              data: {
                userId: toGlobalId("User", user.id),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields[alias].id,
                ),
                profileFieldFileId: expect.any(String),
                alias,
              },
            })),
            {
              type: "PETITION_ASSOCIATED",
              data: {
                petitionId: toGlobalId("Petition", petition.id),
                userId: toGlobalId("User", user.id),
              },
            },
            {
              type: "PROFILE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
              },
            },
            ...["p_risk", "p_entity_name"].map((alias) => ({
              type: "PROFILE_FIELD_VALUE_UPDATED",
              data: {
                userId: toGlobalId("User", user.id),
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  legalEntityProfileTypeFields[alias].id,
                ),
                alias,
              },
            })),
            {
              type: "PROFILE_CREATED",
              data: {
                userId: toGlobalId("User", user.id),
              },
            },
          ]),
        },
      });

      // make sure first event is PROFILE_UPDATED
      expect(
        data?.archiveFieldGroupReplyIntoProfile.associatedProfile.events.items[0].type,
      ).toEqual("PROFILE_UPDATED");

      expect(
        data.archiveFieldGroupReplyIntoProfile.associatedProfile.properties.slice(0, 31),
      ).toEqual([
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_entity_name",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_trade_name",
          },
          files: null,
          value: {
            content: {
              value: "Monsters Inc.",
            },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_entity_type",
          },
          files: null,
          value: {
            content: {
              value: "INCORPORATED",
            },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_registration_number",
          },
          files: null,
          value: {
            content: {
              value: "123456",
            },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_tax_id",
          },
          files: null,
          value: {
            content: {
              value: "ABCDEF",
            },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_registered_address",
          },
          files: null,
          value: {
            content: {
              value: "1234 Monster Street",
            },
          },
        },
        {
          field: {
            type: "PHONE",
            alias: "p_phone_number",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_city",
          },
          files: null,
          value: {
            content: {
              value: "Monstropolis",
            },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_zip",
          },
          files: null,
          value: {
            content: {
              value: "12345",
            },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_country",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "SELECT",
            alias: "p_country_of_incorporation",
          },
          files: null,
          value: {
            content: {
              value: "US",
            },
          },
        },
        {
          field: {
            type: "DATE",
            alias: "p_date_of_incorporation",
          },
          files: null,
          value: {
            content: {
              value: "1890-12-24",
            },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_main_business_activity",
          },
          files: null,
          value: {
            content: {
              value: "Scaring",
            },
          },
        },
        {
          field: {
            type: "FILE",
            alias: "p_ownership_structure",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "FILE",
            alias: "p_ubo_statement",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "FILE",
            alias: "p_financial_statements",
          },
          files: [
            {
              id: expect.any(String),
            },
          ],
          value: null,
        },
        {
          field: {
            type: "SELECT",
            alias: "p_risk",
          },
          files: null,
          value: null,
        },
        {
          field: {
            type: "FILE",
            alias: "p_risk_assessment",
          },
          files: [
            {
              id: expect.any(String),
            },
          ],
          value: null,
        },
        {
          field: {
            type: "SELECT",
            alias: "p_poa_types",
          },
          files: null,
          value: {
            content: {
              value: "GENERAL_POA",
            },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_poa_scope",
          },
          files: null,
          value: {
            content: {
              value: "All",
            },
          },
        },
        {
          field: {
            type: "FILE",
            alias: "p_poa_document",
          },
          files: [
            {
              id: expect.any(String),
            },
          ],
          value: null,
        },
        {
          field: {
            type: "DATE",
            alias: "p_poa_effective_date",
          },
          files: null,
          value: {
            content: {
              value: "2020-01-01",
            },
          },
        },
        {
          field: {
            type: "DATE",
            alias: "p_poa_expiration_date",
          },
          files: null,
          value: {
            content: {
              value: "2031-01-01",
            },
          },
        },
        {
          field: {
            type: "SHORT_TEXT",
            alias: "p_poa_revocation_conditions",
          },
          files: null,
          value: {
            content: {
              value: "None",
            },
          },
        },
        {
          field: {
            type: "SELECT",
            alias: "p_poa_registered",
          },
          files: null,
          value: {
            content: {
              value: "Y",
            },
          },
        },
        {
          field: {
            alias: "p_background_check",
            type: "BACKGROUND_CHECK",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_tax_id_document",
            type: "FILE",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_deed_incorporation",
            type: "FILE",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_bylaws",
            type: "FILE",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_client_status",
            type: "SELECT",
          },
          files: null,
          value: null,
        },
        {
          field: {
            alias: "p_relationship",
            type: "CHECKBOX",
          },
          files: null,
          value: null,
        },
      ]);
    });

    it("creates profile relationships based on the relationships between fields", async () => {
      await mocks.knex.from("petition_field_group_relationship").insert([
        {
          petition_id: petition.id,
          left_side_petition_field_id: individualField.id,
          right_side_petition_field_id: legalEntityField.id,
          direction: "LEFT_RIGHT",
          profile_relationship_type_id: relationshipTypes.find(
            (r) => r.alias === "p_director__managed_by",
          )!.id,
        },
        {
          petition_id: petition.id,
          left_side_petition_field_id: legalEntityField.id,
          right_side_petition_field_id: individualField.id,
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipTypes.find(
            (r) => r.alias === "p_legal_representative__legally_represented",
          )!.id,
        },
      ]);

      const [individualProfile] = await mocks.createRandomProfiles(
        organization.id,
        individual.id,
        1,
      );

      await mocks.knex
        .from("petition_field_reply")
        .where("id", individualReply.id)
        .update("associated_profile_id", individualProfile.id);

      const [legalEntityProfile] = await mocks.createRandomProfiles(
        organization.id,
        legalEntity.id,
        1,
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
              associatedProfile {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                relationships {
                  leftSideProfile {
                    id
                  }
                  rightSideProfile {
                    id
                  }
                  relationshipType {
                    alias
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", legalEntityField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", legalEntityReply.id),
          profileId: toGlobalId("Profile", legalEntityProfile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
        id: toGlobalId("PetitionFieldReply", legalEntityReply.id),
        associatedProfile: {
          id: expect.any(String),
          events: {
            totalCount: 27,
            items: [
              {
                type: "PROFILE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                },
              },
              ...[
                "p_poa_registered",
                "p_poa_revocation_conditions",
                "p_poa_expiration_date",
                "p_poa_effective_date",
                "p_poa_scope",
                "p_poa_types",
                "p_risk",
                "p_main_business_activity",
                "p_date_of_incorporation",
                "p_country_of_incorporation",
                "p_zip",
                "p_city",
                "p_registered_address",
                "p_tax_id",
                "p_registration_number",
                "p_entity_type",
                "p_trade_name",
                "p_entity_name",
              ].map((alias) => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    legalEntityProfileTypeFields[alias].id,
                  ),
                  alias,
                },
              })),
              ...[
                "p_poa_document",
                "p_risk_assessment",
                "p_financial_statements",
                "p_ubo_statement",
                "p_ownership_structure",
              ].map((alias) => ({
                type: "PROFILE_FIELD_FILE_ADDED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileFieldFileId: expect.any(String),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    legalEntityProfileTypeFields[alias].id,
                  ),
                  alias,
                },
              })),
              {
                type: "PROFILE_RELATIONSHIP_CREATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileRelationshipId: expect.any(String),
                  relationshipAlias: "p_director__managed_by",
                },
              },
              {
                type: "PROFILE_RELATIONSHIP_CREATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileRelationshipId: expect.any(String),
                  relationshipAlias: "p_legal_representative__legally_represented",
                },
              },
              {
                type: "PETITION_ASSOCIATED",
                data: {
                  petitionId: toGlobalId("Petition", petition.id),
                  userId: toGlobalId("User", user.id),
                },
              },
            ],
          },
          relationships: expect.toIncludeSameMembers([
            {
              leftSideProfile: {
                id: toGlobalId("Profile", individualProfile.id),
              },
              rightSideProfile: {
                id: data.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
              },
              relationshipType: {
                alias: "p_director__managed_by",
              },
            },
            {
              leftSideProfile: {
                id: toGlobalId("Profile", individualProfile.id),
              },
              rightSideProfile: {
                id: data.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
              },
              relationshipType: {
                alias: "p_legal_representative__legally_represented",
              },
            },
          ]),
        },
      });
    });

    it("does not insert a profile relationship if profile is already associated", async () => {
      await mocks.knex.from("petition_field_group_relationship").insert([
        {
          petition_id: petition.id,
          left_side_petition_field_id: individualField.id,
          right_side_petition_field_id: legalEntityField.id,
          direction: "LEFT_RIGHT",
          profile_relationship_type_id: relationshipTypes.find(
            (r) => r.alias === "p_director__managed_by",
          )!.id,
        },
      ]);

      const [individualProfile] = await mocks.createRandomProfiles(
        organization.id,
        individual.id,
        1,
      );

      const [legalEntityProfile] = await mocks.createRandomProfiles(
        organization.id,
        legalEntity.id,
        1,
      );

      await mocks.knex.from("profile_relationship").insert({
        created_by_user_id: user.id,
        left_side_profile_id: individualProfile.id,
        right_side_profile_id: legalEntityProfile.id,
        org_id: organization.id,
        profile_relationship_type_id: relationshipTypes.find(
          (r) => r.alias === "p_director__managed_by",
        )!.id,
      });

      await mocks.knex
        .from("petition_field_reply")
        .where("id", individualReply.id)
        .update("associated_profile_id", individualProfile.id);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              id
              associatedProfile {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                    data
                  }
                }
                relationships {
                  leftSideProfile {
                    id
                  }
                  rightSideProfile {
                    id
                  }
                  relationshipType {
                    alias
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", legalEntityField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", legalEntityReply.id),
          profileId: toGlobalId("Profile", legalEntityProfile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
        id: toGlobalId("PetitionFieldReply", legalEntityReply.id),
        associatedProfile: {
          id: toGlobalId("Profile", legalEntityProfile.id),
          events: {
            totalCount: 25,
            items: [
              {
                type: "PROFILE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                },
              },
              ...[
                "p_poa_registered",
                "p_poa_revocation_conditions",
                "p_poa_expiration_date",
                "p_poa_effective_date",
                "p_poa_scope",
                "p_poa_types",
                "p_risk",
                "p_main_business_activity",
                "p_date_of_incorporation",
                "p_country_of_incorporation",
                "p_zip",
                "p_city",
                "p_registered_address",
                "p_tax_id",
                "p_registration_number",
                "p_entity_type",
                "p_trade_name",
                "p_entity_name",
              ].map((alias) => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    legalEntityProfileTypeFields[alias].id,
                  ),
                  alias,
                },
              })),
              ...[
                "p_poa_document",
                "p_risk_assessment",
                "p_financial_statements",
                "p_ubo_statement",
                "p_ownership_structure",
              ].map((alias) => ({
                type: "PROFILE_FIELD_FILE_ADDED",
                data: {
                  userId: toGlobalId("User", user.id),
                  profileFieldFileId: expect.any(String),
                  profileTypeFieldId: toGlobalId(
                    "ProfileTypeField",
                    legalEntityProfileTypeFields[alias].id,
                  ),
                  alias,
                },
              })),
              {
                type: "PETITION_ASSOCIATED",
                data: {
                  petitionId: toGlobalId("Petition", petition.id),
                  userId: toGlobalId("User", user.id),
                },
              },
            ],
          },
          relationships: [
            {
              leftSideProfile: {
                id: toGlobalId("Profile", individualProfile.id),
              },
              rightSideProfile: {
                id: data.archiveFieldGroupReplyIntoProfile.associatedProfile.id,
              },
              relationshipType: {
                alias: "p_director__managed_by",
              },
            },
          ],
        },
      });
    });

    it("creates relationships between different replies of the same field", async () => {
      await mocks.knex.from("petition_field_group_relationship").insert([
        {
          petition_id: petition.id,
          left_side_petition_field_id: individualField.id,
          right_side_petition_field_id: individualField.id,
          direction: "LEFT_RIGHT",
          profile_relationship_type_id: relationshipTypes.find(
            (r) => r.alias === "p_close_associate",
          )!.id,
        },
        {
          petition_id: petition.id,
          left_side_petition_field_id: individualField.id,
          right_side_petition_field_id: individualField.id,
          direction: "RIGHT_LEFT",
          profile_relationship_type_id: relationshipTypes.find(
            (r) => r.alias === "p_family_member",
          )!.id,
        },
      ]);

      const [individualA, individualB, individualC] = await mocks.createRandomProfiles(
        organization.id,
        individual.id,
        3,
      );

      const [individualReply2, individualReply3] = await mocks.createFieldGroupReply(
        individualField.id,
        undefined,
        2,
        () => ({
          user_id: user.id,
        }),
      );

      const { errors: individualAErrors, data: individualAData } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                relationships {
                  leftSideProfile {
                    id
                  }
                  rightSideProfile {
                    id
                  }
                  relationshipType {
                    alias
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", individualField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", individualReply.id),
          profileId: toGlobalId("Profile", individualA.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(individualAErrors).toBeUndefined();
      expect(individualAData?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", individualA.id),
          relationships: [], // first created profile will have no relationships
        },
      });

      const { errors: individualBErrors, data: individualBData } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                relationships {
                  leftSideProfile {
                    id
                  }
                  rightSideProfile {
                    id
                  }
                  relationshipType {
                    alias
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", individualField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", individualReply2.id),
          profileId: toGlobalId("Profile", individualB.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(individualBErrors).toBeUndefined();
      expect(individualBData?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", individualB.id),
          relationships: expect.toIncludeSameMembers([
            {
              leftSideProfile: {
                id: toGlobalId("Profile", individualA.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", individualB.id),
              },
              relationshipType: {
                alias: "p_close_associate",
              },
            },
            {
              leftSideProfile: {
                id: toGlobalId("Profile", individualA.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", individualB.id),
              },
              relationshipType: {
                alias: "p_family_member",
              },
            },
          ]),
        },
      });

      const { errors: individualCErrors, data: individualCData } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                relationships {
                  leftSideProfile {
                    id
                  }
                  rightSideProfile {
                    id
                  }
                  relationshipType {
                    alias
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", individualField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", individualReply3.id),
          profileId: toGlobalId("Profile", individualC.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(individualCErrors).toBeUndefined();
      expect(individualCData?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", individualC.id),
          relationships: expect.toIncludeSameMembers([
            {
              leftSideProfile: {
                id: toGlobalId("Profile", individualA.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", individualC.id),
              },
              relationshipType: {
                alias: "p_close_associate",
              },
            },
            {
              leftSideProfile: {
                id: toGlobalId("Profile", individualB.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", individualC.id),
              },
              relationshipType: {
                alias: "p_close_associate",
              },
            },
            {
              leftSideProfile: {
                id: toGlobalId("Profile", individualA.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", individualC.id),
              },
              relationshipType: {
                alias: "p_family_member",
              },
            },
            {
              leftSideProfile: {
                id: toGlobalId("Profile", individualB.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", individualC.id),
              },
              relationshipType: {
                alias: "p_family_member",
              },
            },
          ]),
        },
      });

      await mocks.knex
        .from("petition_field_reply")
        .whereIn("id", [individualReply2.id, individualReply3.id])
        .delete();
    });

    it("archives family members profiles and creates relationships", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        status: "CLOSED",
      }));

      const [aboutYouField, yourParentsField, yourSiblingsField] =
        await mocks.createRandomPetitionFields(petition.id, 3, (i) => ({
          type: "FIELD_GROUP",
          multiple: i > 0,
          profile_type_id: individual.id,
        }));

      const [aboutYouFirstName, aboutYouLastName] = await mocks.createRandomPetitionFields(
        petition.id,
        2,
        (i) => ({
          type: "SHORT_TEXT",
          multiple: false,
          parent_petition_field_id: aboutYouField.id,
          profile_type_field_id: [
            individualProfileTypeFields["p_first_name"].id,
            individualProfileTypeFields["p_last_name"].id,
          ][i],
        }),
      );

      const [yourParentsFirstName, yourParentsLastName] = await mocks.createRandomPetitionFields(
        petition.id,
        2,
        (i) => ({
          type: "SHORT_TEXT",
          multiple: false,
          parent_petition_field_id: yourParentsField.id,
          profile_type_field_id: [
            individualProfileTypeFields["p_first_name"].id,
            individualProfileTypeFields["p_last_name"].id,
          ][i],
        }),
      );

      const [yourSiblingsFirstName, yourSiblingsLastName] = await mocks.createRandomPetitionFields(
        petition.id,
        2,
        (i) => ({
          type: "SHORT_TEXT",
          multiple: false,
          parent_petition_field_id: yourSiblingsField.id,
          profile_type_field_id: [
            individualProfileTypeFields["p_first_name"].id,
            individualProfileTypeFields["p_last_name"].id,
          ][i],
        }),
      );

      await mocks.knex.from("petition_field_group_relationship").insert([
        {
          petition_id: petition.id,
          left_side_petition_field_id: aboutYouField.id,
          profile_relationship_type_id: relationshipTypes.find(
            (t) => t.alias === "p_parent__child",
          )!.id,
          right_side_petition_field_id: yourParentsField.id,
          direction: "RIGHT_LEFT",
        },
        {
          petition_id: petition.id,
          left_side_petition_field_id: aboutYouField.id,
          profile_relationship_type_id: relationshipTypes.find(
            (t) => t.alias === "p_family_member",
          )!.id,
          right_side_petition_field_id: yourSiblingsField.id,
          direction: "RIGHT_LEFT",
        },
        {
          petition_id: petition.id,
          left_side_petition_field_id: yourParentsField.id,
          profile_relationship_type_id: relationshipTypes.find((t) => t.alias === "p_spouse")!.id,
          right_side_petition_field_id: yourParentsField.id,
          direction: "RIGHT_LEFT",
        },
        {
          petition_id: petition.id,
          left_side_petition_field_id: yourSiblingsField.id,
          profile_relationship_type_id: relationshipTypes.find(
            (t) => t.alias === "p_parent__child",
          )!.id,
          right_side_petition_field_id: yourParentsField.id,
          direction: "RIGHT_LEFT",
        },
        {
          petition_id: petition.id,
          left_side_petition_field_id: yourSiblingsField.id,
          profile_relationship_type_id: relationshipTypes.find(
            (t) => t.alias === "p_family_member",
          )!.id,
          right_side_petition_field_id: yourSiblingsField.id,
          direction: "RIGHT_LEFT",
        },
      ]);

      // create replies
      const [aboutYouReply, yourMotherReply, yourFatherReply, yourSisterReply, yourSisterReply2] =
        await mocks.createFieldGroupReply(aboutYouField.id, undefined, 5, (i) => ({
          user_id: user.id,
          petition_field_id: [
            aboutYouField.id,
            yourParentsField.id,
            yourParentsField.id,
            yourSiblingsField.id,
            yourSiblingsField.id,
          ][i],
        }));

      await mocks.knex.from("petition_field_reply").insert([
        {
          parent_petition_field_reply_id: aboutYouReply.id,
          petition_field_id: aboutYouFirstName.id,
          content: { value: "Bart" },
          type: "SHORT_TEXT",
          user_id: user.id,
        },
        {
          parent_petition_field_reply_id: aboutYouReply.id,
          petition_field_id: aboutYouLastName.id,
          content: { value: "Simpson" },
          type: "SHORT_TEXT",
          user_id: user.id,
        },
        {
          parent_petition_field_reply_id: yourMotherReply.id,
          petition_field_id: yourParentsFirstName.id,

          content: { value: "Marge" },
          type: "SHORT_TEXT",
          user_id: user.id,
        },
        {
          parent_petition_field_reply_id: yourMotherReply.id,
          petition_field_id: yourParentsLastName.id,
          content: { value: "Bouvier" },
          type: "SHORT_TEXT",
          user_id: user.id,
        },
        {
          parent_petition_field_reply_id: yourFatherReply.id,
          petition_field_id: yourParentsFirstName.id,
          content: { value: "Homer" },
          type: "SHORT_TEXT",
          user_id: user.id,
        },
        {
          parent_petition_field_reply_id: yourFatherReply.id,
          petition_field_id: yourParentsLastName.id,
          content: { value: "Simpson" },
          type: "SHORT_TEXT",
          user_id: user.id,
        },
        {
          parent_petition_field_reply_id: yourSisterReply.id,
          petition_field_id: yourSiblingsFirstName.id,
          content: { value: "Lisa" },
          type: "SHORT_TEXT",
          user_id: user.id,
        },
        {
          parent_petition_field_reply_id: yourSisterReply.id,
          petition_field_id: yourSiblingsLastName.id,
          content: { value: "Simpson" },
          type: "SHORT_TEXT",
          user_id: user.id,
        },
        {
          parent_petition_field_reply_id: yourSisterReply2.id,
          petition_field_id: yourSiblingsFirstName.id,
          content: { value: "Maggie" },
          type: "SHORT_TEXT",
          user_id: user.id,
        },
        {
          parent_petition_field_reply_id: yourSisterReply2.id,
          petition_field_id: yourSiblingsLastName.id,
          content: { value: "Simpson" },
          type: "SHORT_TEXT",
          user_id: user.id,
        },
      ]);

      const [
        bartSimpsonProfile,
        margeBouvierProfile,
        homerSimpsonProfile,
        lisaSimpsonProfile,
        maggieSimpsonProfile,
      ] = await mocks.createRandomProfiles(organization.id, individual.id, 5, () => ({
        status: "OPEN",
      }));

      const { errors: bartErrors, data: bartData } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                relationships {
                  leftSideProfile {
                    id
                  }
                  rightSideProfile {
                    id
                  }
                  relationshipType {
                    alias
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", aboutYouField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", aboutYouReply.id),
          profileId: toGlobalId("Profile", bartSimpsonProfile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );
      expect(bartErrors).toBeUndefined();

      expect(bartData?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", bartSimpsonProfile.id),
          relationships: [],
        },
      });

      const { errors: margeErrors, data: margeData } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                relationships {
                  leftSideProfile {
                    id
                  }
                  rightSideProfile {
                    id
                  }
                  relationshipType {
                    alias
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", yourParentsField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", yourMotherReply.id),
          profileId: toGlobalId("Profile", margeBouvierProfile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(margeErrors).toBeUndefined();

      expect(margeData?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", margeBouvierProfile.id),
          relationships: [
            {
              leftSideProfile: {
                id: toGlobalId("Profile", margeBouvierProfile.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", bartSimpsonProfile.id),
              },
              relationshipType: {
                alias: "p_parent__child",
              },
            },
          ],
        },
      });

      const { errors: homerErrors, data: homerData } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                relationships {
                  leftSideProfile {
                    id
                  }
                  rightSideProfile {
                    id
                  }
                  relationshipType {
                    alias
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", yourParentsField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", yourFatherReply.id),
          profileId: toGlobalId("Profile", homerSimpsonProfile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(homerErrors).toBeUndefined();

      expect(homerData?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", homerSimpsonProfile.id),
          relationships: expect.toIncludeSameMembers([
            {
              leftSideProfile: {
                id: toGlobalId("Profile", homerSimpsonProfile.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", bartSimpsonProfile.id),
              },
              relationshipType: {
                alias: "p_parent__child",
              },
            },
            {
              leftSideProfile: {
                id: toGlobalId("Profile", margeBouvierProfile.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", homerSimpsonProfile.id),
              },
              relationshipType: {
                alias: "p_spouse",
              },
            },
          ]),
        },
      });

      const { errors: lisaErrors, data: lisaData } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                relationships {
                  leftSideProfile {
                    id
                  }
                  rightSideProfile {
                    id
                  }
                  relationshipType {
                    alias
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", yourSiblingsField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", yourSisterReply.id),
          profileId: toGlobalId("Profile", lisaSimpsonProfile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(lisaErrors).toBeUndefined();

      expect(lisaData?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", lisaSimpsonProfile.id),
          relationships: expect.toIncludeSameMembers([
            {
              leftSideProfile: {
                id: toGlobalId("Profile", bartSimpsonProfile.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", lisaSimpsonProfile.id),
              },
              relationshipType: {
                alias: "p_family_member",
              },
            },
            {
              leftSideProfile: {
                id: toGlobalId("Profile", margeBouvierProfile.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", lisaSimpsonProfile.id),
              },
              relationshipType: {
                alias: "p_parent__child",
              },
            },
            {
              leftSideProfile: {
                id: toGlobalId("Profile", homerSimpsonProfile.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", lisaSimpsonProfile.id),
              },
              relationshipType: {
                alias: "p_parent__child",
              },
            },
          ]),
        },
      });

      const { errors: maggieErrors, data: maggieData } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                relationships {
                  leftSideProfile {
                    id
                  }
                  rightSideProfile {
                    id
                  }
                  relationshipType {
                    alias
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", yourSiblingsField.id),
          parentReplyId: toGlobalId("PetitionFieldReply", yourSisterReply2.id),
          profileId: toGlobalId("Profile", maggieSimpsonProfile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(maggieErrors).toBeUndefined();

      expect(maggieData?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", maggieSimpsonProfile.id),
          relationships: expect.toIncludeSameMembers([
            {
              leftSideProfile: {
                id: toGlobalId("Profile", bartSimpsonProfile.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", maggieSimpsonProfile.id),
              },
              relationshipType: {
                alias: "p_family_member",
              },
            },
            {
              leftSideProfile: {
                id: toGlobalId("Profile", lisaSimpsonProfile.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", maggieSimpsonProfile.id),
              },
              relationshipType: {
                alias: "p_family_member",
              },
            },
            {
              leftSideProfile: {
                id: toGlobalId("Profile", homerSimpsonProfile.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", maggieSimpsonProfile.id),
              },
              relationshipType: {
                alias: "p_parent__child",
              },
            },
            {
              leftSideProfile: {
                id: toGlobalId("Profile", margeBouvierProfile.id),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", maggieSimpsonProfile.id),
              },
              relationshipType: {
                alias: "p_parent__child",
              },
            },
          ]),
        },
      });
    });

    describe("with unique properties", () => {
      let profileType: ProfileType;
      let idField: ProfileTypeField;
      let nameField: ProfileTypeField;

      let profile: Profile;
      let otherProfile: Profile;

      let petition: Petition;
      let fieldGroup: PetitionField;
      let fieldGroupReply: PetitionFieldReply;

      beforeAll(async () => {
        [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);

        [idField, nameField] = await mocks.createRandomProfileTypeFields(
          organization.id,
          profileType.id,
          2,
          (i) => ({
            name: [
              { en: "ID", es: "ID" },
              { en: "Name", es: "Nombre" },
            ][i],
            type: "SHORT_TEXT",
            alias: ["id", "name"][i],
            is_unique: [true, false][i],
          }),
        );

        await mocks.knex
          .from("profile_type")
          .where("id", profileType.id)
          .update({
            profile_name_pattern: JSON.stringify([nameField.id]),
          });

        [profile, otherProfile] = await mocks.createRandomProfiles(
          organization.id,
          profileType.id,
          2,
          (i) => ({
            status: "OPEN",
            localizable_name: [
              { en: "Pedro Paramo", es: "Pedro Paramo" },
              { en: "Jose Paramo", es: "Jose Paramo" },
            ][i],
          }),
        );
        await mocks.createProfileFieldValues(profile.id, [
          {
            profile_type_field_id: idField.id,
            type: "SHORT_TEXT",
            content: { value: "123456789" },
            created_by_user_id: user.id,
          },
          {
            profile_type_field_id: nameField.id,
            type: "SHORT_TEXT",
            content: { value: "Pedro Paramo" },
            created_by_user_id: user.id,
          },
        ]);

        await mocks.createProfileFieldValues(otherProfile.id, [
          {
            profile_type_field_id: idField.id,
            type: "SHORT_TEXT",
            content: { value: "ABCDEFGHI" },
            created_by_user_id: user.id,
          },
          {
            profile_type_field_id: nameField.id,
            type: "SHORT_TEXT",
            content: { value: "Jose Paramo" },
            created_by_user_id: user.id,
          },
        ]);

        [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
          status: "CLOSED",
        }));

        [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "FIELD_GROUP",
          profile_type_id: profileType.id,
        }));
        const [idChild, nameChild] = await mocks.createRandomPetitionFields(
          petition.id,
          2,
          (i) => ({
            type: "SHORT_TEXT",
            parent_petition_field_id: fieldGroup.id,
            profile_type_field_id: [idField.id, nameField.id][i],
          }),
        );

        [fieldGroupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
          user_id: user.id,
        }));

        await mocks.createPetitionFieldReply(idChild.id, 1, () => ({
          content: { value: "123456789" },
          type: "SHORT_TEXT",
          parent_petition_field_reply_id: fieldGroupReply.id,
          user_id: user.id,
        }));

        await mocks.createPetitionFieldReply(nameChild.id, 1, () => ({
          content: { value: "Peter Frampton" },
          type: "SHORT_TEXT",
          parent_petition_field_reply_id: fieldGroupReply.id,
          user_id: user.id,
        }));
      });

      afterAll(async () => {
        await mocks.knex.from("profile_type").where("id", profileType.id).update({
          deleted_at: new Date(),
          deleted_by: "TEST",
          archived_at: new Date(),
          archived_by_user_id: user.id,
        });
        await mocks.knex
          .from("profile_type_field")
          .where("profile_type_id", profileType.id)
          .update({ deleted_at: new Date(), deleted_by: "TEST" });
        await mocks.knex
          .from("profile")
          .where("profile_type_id", profileType.id)
          .update({ deleted_at: new Date(), deleted_by: "TEST" });
      });

      it("sends error if archiving a FIELD_GROUP reply results on a duplicated value on a UNIQUE field", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
            parentReplyId: toGlobalId("PetitionFieldReply", fieldGroupReply.id),
            profileId: toGlobalId("Profile", otherProfile.id),
            conflictResolutions: [
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", idField.id),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", nameField.id),
                action: "OVERWRITE",
              },
            ],
            expirations: [],
          },
        );

        expect(errors).toContainGraphQLError("PROFILE_FIELD_VALUE_UNIQUE_CONSTRAINT", {
          conflicts: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", idField.id),
              profileTypeFieldName: { en: "ID", es: "ID" },
              profileId: toGlobalId("Profile", profile.id),
              profileName: { en: "Pedro Paramo", es: "Pedro Paramo" },
              profileStatus: "OPEN",
            },
          ],
        });
        expect(data).toBeNull();
      });

      it("allows to archive a FIELD_GROUP reply results on a profile with the same UNIQUE value", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $petitionId: GID!
              $petitionFieldId: GID!
              $parentReplyId: GID!
              $profileId: GID!
              $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
              $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            ) {
              archiveFieldGroupReplyIntoProfile(
                petitionId: $petitionId
                petitionFieldId: $petitionFieldId
                parentReplyId: $parentReplyId
                profileId: $profileId
                conflictResolutions: $conflictResolutions
                expirations: $expirations
              ) {
                id
                associatedProfile {
                  id
                  events(limit: 10, offset: 0) {
                    totalCount
                    items {
                      type
                      data
                    }
                  }
                  properties {
                    field {
                      id
                    }
                    value {
                      id
                      content
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
            parentReplyId: toGlobalId("PetitionFieldReply", fieldGroupReply.id),
            profileId: toGlobalId("Profile", profile.id),
            conflictResolutions: [
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", idField.id),
                action: "OVERWRITE",
              },
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", nameField.id),
                action: "OVERWRITE",
              },
            ],
            expirations: [],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
          id: toGlobalId("PetitionFieldReply", fieldGroupReply.id),
          associatedProfile: {
            id: toGlobalId("Profile", profile.id),
            properties: [
              {
                field: { id: toGlobalId("ProfileTypeField", idField.id) },
                value: {
                  id: expect.any(String),
                  content: { value: "123456789" },
                },
              },
              {
                field: { id: toGlobalId("ProfileTypeField", nameField.id) },
                value: {
                  id: expect.any(String),
                  content: { value: "Peter Frampton" },
                },
              },
            ],
            events: {
              totalCount: 3,
              items: [
                { type: "PROFILE_UPDATED", data: { userId: toGlobalId("User", user.id) } },
                {
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    profileTypeFieldId: toGlobalId("ProfileTypeField", nameField.id),
                    alias: "name",
                  },
                },
                {
                  type: "PETITION_ASSOCIATED",
                  data: {
                    userId: toGlobalId("User", user.id),
                    petitionId: toGlobalId("Petition", petition.id),
                  },
                },
              ],
            },
          },
        });
      });
    });
  });

  describe("archiveFieldGroupReplyIntoProfile / custom profile types", () => {
    let profileType: ProfileType;
    let profileTypeFields: ProfileTypeField[];

    let petition: Petition;
    let fieldGroup: PetitionField;
    let checkboxChild: PetitionField;
    let backgroundCheckChild: PetitionField;

    beforeEach(async () => {
      [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      profileTypeFields = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        ProfileTypeFieldTypeValues.length,
        (i) => ({ type: ProfileTypeFieldTypeValues[i], alias: ProfileTypeFieldTypeValues[i] }),
      );

      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        status: "CLOSED",
      }));
      [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
        profile_type_id: profileType.id,
      }));
      [checkboxChild, backgroundCheckChild] = await mocks.createRandomPetitionFields(
        petition.id,
        2,
        (i) => {
          const type = ["CHECKBOX", "BACKGROUND_CHECK"][i] as PetitionFieldType;
          return {
            type,
            parent_petition_field_id: fieldGroup.id,
            profile_type_field_id: profileTypeFields.find((f) => f.type === type)!.id,
          };
        },
      );
    });

    it("archives a CHECKBOX reply into a profile", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createCheckboxReply(checkboxChild.id, { userId: user.id }, ["A", "C"], () => ({
        parent_petition_field_reply_id: groupReply.id,
      }));

      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            $profileTypeFieldId: GID!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                properties(filter: [{ profileTypeFieldId: $profileTypeFieldId }]) {
                  field {
                    id
                    type
                  }
                  value {
                    isDraft
                    content
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
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[8].id),
          conflictResolutions: [],
          expirations: [],
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", profile.id),
          properties: [
            {
              field: {
                id: toGlobalId("ProfileTypeField", profileTypeFields[8].id),
                type: "CHECKBOX",
              },
              value: {
                isDraft: false,
                content: { value: ["A", "C"] },
              },
            },
          ],
        },
      });
    });

    it("throws conflict error if current CHECKBOX value in profile differs from parallel reply", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createCheckboxReply(checkboxChild.id, { userId: user.id }, ["A", "C"], () => ({
        parent_petition_field_reply_id: groupReply.id,
      }));

      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      await mocks.createProfileFieldValues(profile.id, [
        {
          profile_type_field_id: profileTypeFields.find((f) => f.type === "CHECKBOX")!.id,
          type: "CHECKBOX",
          content: { value: ["A"] },
          created_by_user_id: user.id,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                properties {
                  field {
                    id
                    type
                  }
                  value {
                    content
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
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );
      expect(errors).toContainGraphQLError("CONFLICT_RESOLUTION_REQUIRED_ERROR", {
        conflictResolutions: [
          toGlobalId("ProfileTypeField", profileTypeFields.find((f) => f.type === "CHECKBOX")!.id),
        ],
        expirations: [],
      });
      expect(data).toBeNull();
    });

    it("does not conflict if CHECKBOX values are the same but in different order", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createCheckboxReply(checkboxChild.id, { userId: user.id }, ["A", "C"], () => ({
        parent_petition_field_reply_id: groupReply.id,
      }));

      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      await mocks.createProfileFieldValues(profile.id, [
        {
          profile_type_field_id: profileTypeFields.find((f) => f.type === "CHECKBOX")!.id,
          type: "CHECKBOX",
          content: { value: ["C", "A"] },
          created_by_user_id: user.id,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            $profileTypeFieldId: GID!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                properties(filter: [{ profileTypeFieldId: $profileTypeFieldId }]) {
                  field {
                    id
                    type
                  }
                  value {
                    content
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
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[8].id),
          conflictResolutions: [],
          expirations: [],
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", profile.id),
          properties: [
            {
              field: {
                id: toGlobalId("ProfileTypeField", profileTypeFields[8].id),
                type: "CHECKBOX",
              },
              value: {
                content: { value: ["C", "A"] }, // keep the value in the profile
              },
            },
          ],
        },
      });
    });

    it("archiving a FIELD_GROUP with a BACKGROUND_CHECK reply with saved entity should create a non-draft on profile", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createPetitionFieldReply(backgroundCheckChild.id, 1, () => ({
        user_id: user.id,
        type: "BACKGROUND_CHECK",
        parent_petition_field_reply_id: groupReply.id,
        content: {
          query: {
            name: "John Doe",
            type: null,
            date: null,
          },
          search: {
            totalCount: 2,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },

              {
                id: "rupep-company-718",
                type: "Company",
                name: "Putin Consulting LLC",
                properties: {},
              },
            ],
            createdAt: new Date(),
          },
          entity: {
            id: "Q7747",
            name: "Vladimir Vladimirovich PUTIN",
            type: "Person",
            properties: {},
            createdAt: new Date(),
          },
          falsePositives: [
            { id: "rupep-company-718", addedAt: new Date(), addedByUserId: user.id },
          ],
        } as BackgroundCheckContent,
      }));

      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            $profileTypeFieldId: GID!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                properties(filter: [{ profileTypeFieldId: $profileTypeFieldId }]) {
                  field {
                    id
                    type
                  }
                  value {
                    isDraft
                    content
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
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", profile.id),
          properties: [
            {
              field: {
                id: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
                type: "BACKGROUND_CHECK",
              },
              value: {
                isDraft: false,
                content: {
                  query: {
                    name: "John Doe",
                    type: null,
                    date: null,
                  },
                  search: {
                    totalCount: 2,
                    falsePositivesCount: 1,
                    createdAt: expect.any(String),
                  },
                  entity: {
                    id: "Q7747",
                    name: "Vladimir Vladimirovich PUTIN",
                    type: "Person",
                    createdAt: expect.any(String),
                    properties: {},
                  },
                },
              },
            },
          ],
        },
      });
    });

    it("archiving a FIELD_GROUP with a BACKGROUND_CHECK reply with all false positives should create a non-draft on profile", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createPetitionFieldReply(backgroundCheckChild.id, 1, () => ({
        user_id: user.id,
        type: "BACKGROUND_CHECK",
        parent_petition_field_reply_id: groupReply.id,
        content: {
          query: {
            name: "John Doe",
            type: null,
            date: null,
          },
          search: {
            totalCount: 2,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },

              {
                id: "rupep-company-718",
                type: "Company",
                name: "Putin Consulting LLC",
                properties: {},
              },
            ],
            createdAt: new Date(),
          },
          entity: null,
          falsePositives: [
            { id: "rupep-company-718", addedAt: new Date(), addedByUserId: user.id },
            { id: "Q7747", addedAt: new Date(), addedByUserId: user.id },
          ],
        } as BackgroundCheckContent,
      }));

      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            $profileTypeFieldId: GID!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                properties(filter: [{ profileTypeFieldId: $profileTypeFieldId }]) {
                  field {
                    id
                    type
                  }
                  value {
                    isDraft
                    content
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
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", profile.id),
          properties: [
            {
              field: {
                id: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
                type: "BACKGROUND_CHECK",
              },
              value: {
                isDraft: false,
                content: {
                  query: {
                    name: "John Doe",
                    type: null,
                    date: null,
                  },
                  search: {
                    totalCount: 2,
                    falsePositivesCount: 2,
                    createdAt: expect.any(String),
                  },
                  entity: null,
                },
              },
            },
          ],
        },
      });
    });

    it("archiving a FIELD_GROUP with a BACKGROUND_CHECK reply with an empty search should create a draft on profile", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createPetitionFieldReply(backgroundCheckChild.id, 1, () => ({
        user_id: user.id,
        type: "BACKGROUND_CHECK",
        parent_petition_field_reply_id: groupReply.id,
        content: {
          query: {
            name: "John Doe",
            type: null,
            date: null,
          },
          search: {
            totalCount: 0,
            items: [],
            createdAt: new Date(),
          },
          entity: null,
        } as BackgroundCheckContent,
      }));

      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            $profileTypeFieldId: GID!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                properties(filter: [{ profileTypeFieldId: $profileTypeFieldId }]) {
                  field {
                    id
                    type
                  }
                  value {
                    isDraft
                    content
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
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", profile.id),
          properties: [
            {
              field: {
                id: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
                type: "BACKGROUND_CHECK",
              },
              value: {
                isDraft: true,
                content: {
                  query: {
                    name: "John Doe",
                    type: null,
                    date: null,
                  },
                  search: {
                    totalCount: 0,
                    falsePositivesCount: 0,
                    createdAt: expect.any(String),
                  },
                  entity: null,
                },
              },
            },
          ],
        },
      });
    });

    it("archiving a FIELD_GROUP with a BACKGROUND_CHECK reply with no saved entity should create a draft on profile", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createPetitionFieldReply(backgroundCheckChild.id, 1, () => ({
        user_id: user.id,
        type: "BACKGROUND_CHECK",
        parent_petition_field_reply_id: groupReply.id,
        content: {
          query: {
            name: "John Doe",
            type: null,
            date: null,
          },
          search: {
            totalCount: 2,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },

              {
                id: "rupep-company-718",
                type: "Company",
                name: "Putin Consulting LLC",
                properties: {},
              },
            ],
            createdAt: new Date(),
          },
          entity: null,
          falsePositives: [
            { id: "rupep-company-718", addedAt: new Date(), addedByUserId: user.id },
          ],
        } as BackgroundCheckContent,
      }));

      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            $profileTypeFieldId: GID!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                properties(filter: [{ profileTypeFieldId: $profileTypeFieldId }]) {
                  field {
                    id
                    type
                  }
                  value {
                    isDraft
                    content
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
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", profile.id),
          properties: [
            {
              field: {
                id: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
                type: "BACKGROUND_CHECK",
              },
              value: {
                isDraft: true,
                content: {
                  query: {
                    name: "John Doe",
                    type: null,
                    date: null,
                  },
                  search: {
                    totalCount: 2,
                    falsePositivesCount: 1,
                    createdAt: expect.any(String),
                  },
                  entity: null,
                },
              },
            },
          ],
        },
      });
    });

    it("archiving a FIELD_GROUP with a BACKGROUND_CHECK incomplete reply entity should create a draft on profile with a draft value", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createPetitionFieldReply(backgroundCheckChild.id, 1, () => ({
        user_id: user.id,
        type: "BACKGROUND_CHECK",
        parent_petition_field_reply_id: groupReply.id,
        content: {
          query: {
            name: "John Doe",
            type: null,
            date: null,
          },
          search: {
            totalCount: 2,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
              {
                id: "rupep-company-718",
                type: "Company",
                name: "Putin Consulting LLC",
                properties: {},
              },
            ],
            createdAt: new Date(),
          },
          entity: null,
          falsePositives: [
            { id: "rupep-company-718", addedAt: new Date(), addedByUserId: user.id },
          ],
        } as BackgroundCheckContent,
      }));

      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      await mocks.createProfileFieldValues(profile.id, [
        {
          profile_type_field_id: profileTypeFields[7].id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Mike Ross",
              type: "PERSON",
              date: null,
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: "mike-1",
                  type: "Person",
                  name: "Mike Ross",
                  properties: {},
                },
              ],
              createdAt: new Date(),
            },
            entity: null,
          },
          created_by_user_id: user.id,
          is_draft: true,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            $profileTypeFieldId: GID!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                properties(filter: [{ profileTypeFieldId: $profileTypeFieldId }]) {
                  field {
                    id
                    type
                  }
                  value {
                    isDraft
                    content
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
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", profile.id),
          properties: [
            {
              field: {
                id: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
                type: "BACKGROUND_CHECK",
              },
              value: {
                isDraft: true,
                content: {
                  query: {
                    name: "John Doe",
                    type: null,
                    date: null,
                  },
                  search: {
                    totalCount: 2,
                    falsePositivesCount: 1,
                    createdAt: expect.any(String),
                  },
                  entity: null,
                },
              },
            },
          ],
        },
      });

      const pfvs = await mocks
        .knex("profile_field_value")
        .where("profile_id", profile.id)
        .where("profile_type_field_id", profileTypeFields[7].id);

      expect(pfvs).toHaveLength(1);
      expect(pick(pfvs[0], ["content", "is_draft", "removed_at"])).toEqual({
        content: {
          query: {
            name: "John Doe",
            type: null,
            date: null,
          },
          search: {
            totalCount: 2,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
              {
                id: "rupep-company-718",
                type: "Company",
                name: "Putin Consulting LLC",
                properties: {},
              },
            ],
            createdAt: expect.any(String),
          },
          entity: null,
          falsePositives: [
            { id: "rupep-company-718", addedAt: expect.any(String), addedByUserId: user.id },
          ],
        },
        is_draft: true,
        removed_at: null,
      });
    });

    it("archiving a FIELD_GROUP with a BACKGROUND_CHECK complete reply entity should create a non-draft value on profile with a draft value, and remove the draft", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createPetitionFieldReply(backgroundCheckChild.id, 1, () => ({
        user_id: user.id,
        type: "BACKGROUND_CHECK",
        parent_petition_field_reply_id: groupReply.id,
        content: {
          query: {
            name: "John Doe",
            type: null,
            date: null,
          },
          search: {
            totalCount: 2,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
              {
                id: "rupep-company-718",
                type: "Company",
                name: "Putin Consulting LLC",
                properties: {},
              },
            ],
            createdAt: new Date(),
          },
          entity: {
            id: "rupep-company-718",
            type: "Company",
            name: "Putin Consulting LLC",
            properties: {},
          },
          falsePositives: [{ id: "Q7747", addedAt: new Date(), addedByUserId: user.id }],
        } as BackgroundCheckContent,
      }));

      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      await mocks.createProfileFieldValues(profile.id, [
        {
          profile_type_field_id: profileTypeFields[7].id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "John Doe",
              type: null,
              date: null,
            },
            search: {
              totalCount: 2,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
                {
                  id: "rupep-company-718",
                  type: "Company",
                  name: "Putin Consulting LLC",
                  properties: {},
                },
              ],
              createdAt: new Date(),
            },
            entity: null,
            falsePositives: [{ id: "Q7747", addedAt: new Date(), addedByUserId: user.id }],
          },
          created_by_user_id: user.id,
          is_draft: true,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            $profileTypeFieldId: GID!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                properties(filter: [{ profileTypeFieldId: $profileTypeFieldId }]) {
                  field {
                    id
                    type
                  }
                  value {
                    isDraft
                    content
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
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", profile.id),
          properties: [
            {
              field: {
                id: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
                type: "BACKGROUND_CHECK",
              },
              value: {
                isDraft: false,
                content: {
                  query: {
                    name: "John Doe",
                    type: null,
                    date: null,
                  },
                  search: {
                    totalCount: 2,
                    falsePositivesCount: 1,
                    createdAt: expect.any(String),
                  },
                  entity: {
                    id: "rupep-company-718",
                    type: "Company",
                    name: "Putin Consulting LLC",
                    properties: {},
                  },
                },
              },
            },
          ],
        },
      });

      const pfvs = await mocks
        .knex("profile_field_value")
        .where("profile_id", profile.id)
        .where("profile_type_field_id", profileTypeFields[7].id);

      expect(pfvs).toHaveLength(2);
      expect(pfvs.map(pick(["content", "is_draft", "removed_at"]))).toIncludeSameMembers([
        {
          content: {
            query: {
              name: "John Doe",
              type: null,
              date: null,
            },
            search: {
              totalCount: 2,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
                {
                  id: "rupep-company-718",
                  type: "Company",
                  name: "Putin Consulting LLC",
                  properties: {},
                },
              ],
              createdAt: expect.any(String),
            },
            entity: null,
            falsePositives: [{ id: "Q7747", addedAt: expect.any(String), addedByUserId: user.id }],
          },
          is_draft: true,
          removed_at: expect.any(Date),
        },
        {
          content: {
            query: {
              name: "John Doe",
              type: null,
              date: null,
            },
            search: {
              totalCount: 2,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
                {
                  id: "rupep-company-718",
                  type: "Company",
                  name: "Putin Consulting LLC",
                  properties: {},
                },
              ],
              createdAt: expect.any(String),
            },
            entity: {
              id: "rupep-company-718",
              type: "Company",
              name: "Putin Consulting LLC",
              properties: {},
            },
            falsePositives: [{ id: "Q7747", addedAt: expect.any(String), addedByUserId: user.id }],
          },
          is_draft: false,
          removed_at: null,
        },
      ]);
    });

    it("archiving a FIELD_GROUP with a BACKGROUND_CHECK incomplete reply should create a draft value on profile with a non-draft value, and keep the non-draft", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createPetitionFieldReply(backgroundCheckChild.id, 1, () => ({
        user_id: user.id,
        type: "BACKGROUND_CHECK",
        parent_petition_field_reply_id: groupReply.id,
        content: {
          query: {
            name: "John Doe",
            type: null,
            date: null,
          },
          search: {
            totalCount: 2,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
              {
                id: "rupep-company-718",
                type: "Company",
                name: "Putin Consulting LLC",
                properties: {},
              },
            ],
            createdAt: new Date(),
          },
          entity: null,
        } as BackgroundCheckContent,
      }));

      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      await mocks.createProfileFieldValues(profile.id, [
        {
          profile_type_field_id: profileTypeFields[7].id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Mike Ross",
              type: "PERSON",
              date: null,
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: "mike-1",
                  type: "Person",
                  name: "Mike Ross",
                  properties: {},
                },
              ],
              createdAt: new Date(),
            },
            entity: {
              id: "mike-1",
              type: "Person",
              name: "Mike Ross",
              properties: {},
            },
          },
          created_by_user_id: user.id,
          is_draft: false,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
            $profileTypeFieldId: GID!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              associatedProfile {
                id
                properties(filter: [{ profileTypeFieldId: $profileTypeFieldId }]) {
                  field {
                    id
                    type
                  }
                  value {
                    isDraft
                    content
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
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.archiveFieldGroupReplyIntoProfile).toEqual({
        associatedProfile: {
          id: toGlobalId("Profile", profile.id),
          properties: [
            {
              field: {
                id: toGlobalId("ProfileTypeField", profileTypeFields[7].id),
                type: "BACKGROUND_CHECK",
              },
              value: {
                isDraft: true,
                content: {
                  query: {
                    name: "John Doe",
                    type: null,
                    date: null,
                  },
                  search: {
                    totalCount: 2,
                    falsePositivesCount: 0,
                    createdAt: expect.any(String),
                  },
                  entity: null,
                },
              },
            },
          ],
        },
      });

      const pfvs = await mocks
        .knex("profile_field_value")
        .where("profile_id", profile.id)
        .where("profile_type_field_id", profileTypeFields[7].id);

      expect(pfvs).toHaveLength(2);
      expect(pfvs.map(pick(["content", "is_draft", "removed_at"]))).toIncludeSameMembers([
        {
          content: {
            query: {
              name: "John Doe",
              type: null,
              date: null,
            },
            search: {
              totalCount: 2,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
                {
                  id: "rupep-company-718",
                  type: "Company",
                  name: "Putin Consulting LLC",
                  properties: {},
                },
              ],
              createdAt: expect.any(String),
            },
            entity: null,
          },
          is_draft: true,
          removed_at: null,
        },
        {
          content: {
            query: {
              name: "Mike Ross",
              type: "PERSON",
              date: null,
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: "mike-1",
                  type: "Person",
                  name: "Mike Ross",
                  properties: {},
                },
              ],
              createdAt: expect.any(String),
            },
            entity: {
              id: "mike-1",
              type: "Person",
              name: "Mike Ross",
              properties: {},
            },
          },
          is_draft: false,
          removed_at: null,
        },
      ]);
    });

    it("sends conflict if trying to archive background check on a profile with different search results", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createPetitionFieldReply(backgroundCheckChild.id, 1, () => ({
        user_id: user.id,
        type: "BACKGROUND_CHECK",
        parent_petition_field_reply_id: groupReply.id,
        content: {
          query: {
            name: "John Doe",
            type: null,
            date: null,
          },
          search: {
            totalCount: 2,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
              {
                id: "rupep-company-718",
                type: "Company",
                name: "Putin Consulting LLC",
                properties: {},
              },
            ],
            createdAt: new Date(),
          },
          entity: null,
          falsePositives: [
            { id: "Q7747", addedAt: new Date(), addedByUserId: user.id },
            { id: "rupep-company-718", addedAt: new Date(), addedByUserId: user.id },
          ],
        } as BackgroundCheckContent,
      }));

      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      await mocks.createProfileFieldValues(profile.id, [
        {
          profile_type_field_id: profileTypeFields[7].id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "John Doe",
              type: null,
              date: null,
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: "mike-1",
                  type: "Person",
                  name: "Mike Ross",
                  properties: {},
                },
              ],
              createdAt: new Date(),
            },
            entity: null,
            falsePositives: [{ id: "mike-1", addedAt: new Date(), addedByUserId: user.id }],
          },
          created_by_user_id: user.id,
          is_draft: false,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              __typename
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
          parentReplyId: toGlobalId("PetitionFieldReply", groupReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toContainGraphQLError("CONFLICT_RESOLUTION_REQUIRED_ERROR", {
        conflictResolutions: [toGlobalId("ProfileTypeField", profileTypeFields[7].id)],
        expirations: [],
      });
      expect(data).toBeNull();
    });

    it("sends conflict if trying to archive background check on a profile with a different entity", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createPetitionFieldReply(backgroundCheckChild.id, 1, () => ({
        user_id: user.id,
        type: "BACKGROUND_CHECK",
        parent_petition_field_reply_id: groupReply.id,
        content: {
          query: {
            name: "John Doe",
            type: null,
            date: null,
          },
          search: {
            totalCount: 2,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
              {
                id: "rupep-company-718",
                type: "Company",
                name: "Putin Consulting LLC",
                properties: {},
              },
            ],
            createdAt: new Date(),
          },
          entity: {
            id: "rupep-company-718",
            type: "Company",
            name: "Putin Consulting LLC",
            properties: {},
          },
        } as BackgroundCheckContent,
      }));

      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      await mocks.createProfileFieldValues(profile.id, [
        {
          profile_type_field_id: profileTypeFields[7].id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "John Doe",
              type: null,
              date: null,
            },
            search: {
              totalCount: 2,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
                {
                  id: "rupep-company-718",
                  type: "Company",
                  name: "Putin Consulting LLC",
                  properties: {},
                },
              ],
              createdAt: new Date(),
            },
            entity: {
              id: "Q7747",
              type: "Person",
              name: "Vladimir Vladimirovich PUTIN",
              properties: {},
            },
          },
          created_by_user_id: user.id,
          is_draft: false,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              __typename
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
          parentReplyId: toGlobalId("PetitionFieldReply", groupReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toContainGraphQLError("CONFLICT_RESOLUTION_REQUIRED_ERROR", {
        conflictResolutions: [toGlobalId("ProfileTypeField", profileTypeFields[7].id)],
        expirations: [],
      });
      expect(data).toBeNull();
    });

    it("sends conflict if trying to archive background check with saved entity on a profile with non-draft value", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createPetitionFieldReply(backgroundCheckChild.id, 1, () => ({
        user_id: user.id,
        type: "BACKGROUND_CHECK",
        parent_petition_field_reply_id: groupReply.id,
        content: {
          query: {
            name: "John Doe",
            type: null,
            date: null,
          },
          search: {
            totalCount: 2,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
              {
                id: "rupep-company-718",
                type: "Company",
                name: "Putin Consulting LLC",
                properties: {},
              },
            ],
            createdAt: new Date(),
          },
          entity: {
            id: "rupep-company-718",
            type: "Company",
            name: "Putin Consulting LLC",
            properties: {},
          },
        } as BackgroundCheckContent,
      }));

      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      await mocks.createProfileFieldValues(profile.id, [
        {
          profile_type_field_id: profileTypeFields[7].id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "John Doe",
              type: null,
              date: null,
            },
            search: {
              totalCount: 2,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
                {
                  id: "rupep-company-718",
                  type: "Company",
                  name: "Putin Consulting LLC",
                  properties: {},
                },
              ],
              createdAt: new Date(),
            },
            entity: null,
            falsePositives: [
              { id: "Q7747", addedAt: new Date(), addedByUserId: user.id },
              { id: "rupep-company-718", addedAt: new Date(), addedByUserId: user.id },
            ],
          },
          created_by_user_id: user.id,
          is_draft: false,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              __typename
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
          parentReplyId: toGlobalId("PetitionFieldReply", groupReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toContainGraphQLError("CONFLICT_RESOLUTION_REQUIRED_ERROR", {
        conflictResolutions: [toGlobalId("ProfileTypeField", profileTypeFields[7].id)],
        expirations: [],
      });
      expect(data).toBeNull();
    });

    it("does not send conflict if trying to archive background check on a profile with the same entity", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createPetitionFieldReply(backgroundCheckChild.id, 1, () => ({
        user_id: user.id,
        type: "BACKGROUND_CHECK",
        parent_petition_field_reply_id: groupReply.id,
        content: {
          query: {
            name: "John Doe",
            type: null,
            date: null,
          },
          search: {
            totalCount: 2,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
              {
                id: "rupep-company-718",
                type: "Company",
                name: "Putin Consulting LLC",
                properties: {},
              },
            ],
            createdAt: new Date(),
          },
          entity: {
            id: "rupep-company-718",
            type: "Company",
            name: "Putin Consulting LLC",
            properties: {},
          },
        } as BackgroundCheckContent,
      }));

      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      await mocks.createProfileFieldValues(profile.id, [
        {
          profile_type_field_id: profileTypeFields[7].id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "John Doe",
              type: null,
              date: null,
            },
            search: {
              totalCount: 2,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
                {
                  id: "rupep-company-718",
                  type: "Company",
                  name: "Putin Consulting LLC",
                  properties: {},
                },
              ],
              createdAt: new Date(),
            },
            entity: {
              id: "rupep-company-718",
              type: "Company",
              name: "Putin Consulting LLC",
              properties: {},
            },
          },
          created_by_user_id: user.id,
          is_draft: false,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              __typename
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
          parentReplyId: toGlobalId("PetitionFieldReply", groupReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data).not.toBeNull();
    });

    it("does not send conflict if trying to archive background check on a profile with the same search results and false positives", async () => {
      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createPetitionFieldReply(backgroundCheckChild.id, 1, () => ({
        user_id: user.id,
        type: "BACKGROUND_CHECK",
        parent_petition_field_reply_id: groupReply.id,
        content: {
          query: {
            name: "John Doe",
            type: null,
            date: null,
          },
          search: {
            totalCount: 2,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
              {
                id: "rupep-company-718",
                type: "Company",
                name: "Putin Consulting LLC",
                properties: {},
              },
            ],
            createdAt: new Date(),
          },
          entity: null,
          falsePositives: [
            { id: "Q7747", addedAt: new Date(), addedByUserId: user.id },
            { id: "rupep-company-718", addedAt: new Date(), addedByUserId: user.id },
          ],
        } as BackgroundCheckContent,
      }));

      const [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
      await mocks.createProfileFieldValues(profile.id, [
        {
          profile_type_field_id: profileTypeFields[7].id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "John Doe",
              type: null,
              date: null,
            },
            search: {
              totalCount: 2,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
                {
                  id: "rupep-company-718",
                  type: "Company",
                  name: "Putin Consulting LLC",
                  properties: {},
                },
              ],
              createdAt: new Date(),
            },
            entity: null,
            falsePositives: [
              { id: "Q7747", addedAt: new Date(), addedByUserId: user.id },
              { id: "rupep-company-718", addedAt: new Date(), addedByUserId: user.id },
            ],
          },
          created_by_user_id: user.id,
          is_draft: false,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $parentReplyId: GID!
            $profileId: GID!
            $conflictResolutions: [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
            $expirations: [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
          ) {
            archiveFieldGroupReplyIntoProfile(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              parentReplyId: $parentReplyId
              profileId: $profileId
              conflictResolutions: $conflictResolutions
              expirations: $expirations
            ) {
              __typename
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", fieldGroup.id),
          parentReplyId: toGlobalId("PetitionFieldReply", groupReply.id),
          profileId: toGlobalId("Profile", profile.id),
          conflictResolutions: [],
          expirations: [],
        },
      );

      expect(errors).toBeUndefined();
      expect(data).not.toBeNull();
    });
  });

  describe("updatePetitionFieldGroupRelationships", () => {
    let petition: Petition;
    let individualFields: PetitionField[];
    let legalEntityFields: PetitionField[];
    let contractFields: PetitionField[];

    beforeAll(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);

      individualFields = await mocks.createRandomPetitionFields(petition.id, 2, () => ({
        type: "FIELD_GROUP",
        profile_type_id: individual.id,
      }));

      legalEntityFields = await mocks.createRandomPetitionFields(petition.id, 2, () => ({
        type: "FIELD_GROUP",
        profile_type_id: legalEntity.id,
      }));

      contractFields = await mocks.createRandomPetitionFields(petition.id, 2, () => ({
        type: "FIELD_GROUP",
        profile_type_id: contract.id,
      }));
    });

    afterEach(async () => {
      await mocks.knex
        .from("petition_field_group_relationship")
        .where("petition_id", petition.id)
        .delete();
    });

    it("creates a relationship between two field groups", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              id
              fieldRelationships {
                leftSidePetitionField {
                  id
                  profileType {
                    id
                  }
                }
                rightSidePetitionField {
                  id
                  profileType {
                    id
                  }
                }
                relationshipTypeWithDirection {
                  direction
                  profileRelationshipType {
                    alias
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[0].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_associated_company")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionFieldGroupRelationships).toEqual({
        id: toGlobalId("Petition", petition.id),
        fieldRelationships: [
          {
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[0].id),
              profileType: {
                id: toGlobalId("ProfileType", individual.id),
              },
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[1].id),
              profileType: {
                id: toGlobalId("ProfileType", individual.id),
              },
            },
            relationshipTypeWithDirection: {
              direction: "LEFT_RIGHT",
              profileRelationshipType: {
                alias: "p_parent__child",
              },
            },
          },
          {
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", legalEntityFields[0].id),
              profileType: {
                id: toGlobalId("ProfileType", legalEntity.id),
              },
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", legalEntityFields[0].id),
              profileType: {
                id: toGlobalId("ProfileType", legalEntity.id),
              },
            },
            relationshipTypeWithDirection: {
              direction: "LEFT_RIGHT",
              profileRelationshipType: {
                alias: "p_associated_company",
              },
            },
          },
        ],
      });
    });

    it("adds a 3rd relationship on same fields after previously adding other 2", async () => {
      const { errors: mutation1Errors, data: mutation1Data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              fieldRelationships {
                id
                leftSidePetitionField {
                  id
                }
                rightSidePetitionField {
                  id
                }
                relationshipTypeWithDirection {
                  direction
                  profileRelationshipType {
                    alias
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find(
                  (r) => r.alias === "p_legal_representative__legally_represented",
                )!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_family_member")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(mutation1Errors).toBeUndefined();
      expect(mutation1Data?.updatePetitionFieldGroupRelationships).toEqual({
        fieldRelationships: [
          {
            id: expect.any(String),
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[0].id),
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[1].id),
            },
            relationshipTypeWithDirection: {
              direction: "LEFT_RIGHT",
              profileRelationshipType: {
                alias: "p_legal_representative__legally_represented",
              },
            },
          },
          {
            id: expect.any(String),
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[0].id),
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[1].id),
            },
            relationshipTypeWithDirection: {
              direction: "LEFT_RIGHT",
              profileRelationshipType: {
                alias: "p_family_member",
              },
            },
          },
        ],
      });

      const { errors: mutation2Errors, data: mutation2Data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              fieldRelationships {
                id
                leftSidePetitionField {
                  id
                }
                rightSidePetitionField {
                  id
                }
                relationshipTypeWithDirection {
                  direction
                  profileRelationshipType {
                    alias
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              id: mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[0].id,
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find(
                  (r) => r.alias === "p_legal_representative__legally_represented",
                )!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              id: mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[1].id,
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_family_member")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(mutation2Errors).toBeUndefined();
      expect(mutation2Data?.updatePetitionFieldGroupRelationships).toEqual({
        fieldRelationships: [
          {
            id: mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[0].id,
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[0].id),
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[1].id),
            },
            relationshipTypeWithDirection: {
              direction: "LEFT_RIGHT",
              profileRelationshipType: {
                alias: "p_legal_representative__legally_represented",
              },
            },
          },
          {
            id: mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[1].id,
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[0].id),
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[1].id),
            },
            relationshipTypeWithDirection: {
              direction: "LEFT_RIGHT",
              profileRelationshipType: {
                alias: "p_family_member",
              },
            },
          },
          {
            id: expect.any(String),
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[0].id),
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[1].id),
            },
            relationshipTypeWithDirection: {
              direction: "LEFT_RIGHT",
              profileRelationshipType: {
                alias: "p_parent__child",
              },
            },
          },
        ],
      });
    });

    it("sends error if trying to create a reciprocal relationship twice with different directions", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_associated_company")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_associated_company")!.id,
              ),
              direction: "RIGHT_LEFT",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing same relationship twice", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", contractFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", contractFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_main_contract__annex")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", contractFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", contractFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_main_contract__annex")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing same relationships twice with inverted sides", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", contractFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", contractFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_main_contract__annex")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", contractFields[1].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", contractFields[0].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_main_contract__annex")!.id,
              ),
              direction: "RIGHT_LEFT",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if one of the fields is not linked to a profile type", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", individualFields[0].id)
        .update("profile_type_id", null);

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();

      await mocks.knex
        .from("petition_field")
        .where("id", individualFields[0].id)
        .update("profile_type_id", individual.id);
    });

    it("sends error if trying to pass an invalid relationship", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", contractFields[0].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_RELATIONSHIP_TYPE_ERROR");
      expect(data).toBeNull();
    });

    it("removes every relationship when passing empty array", async () => {
      const { errors: mutation1Errors, data: mutation1Data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              fieldRelationships {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find(
                  (r) => r.alias === "p_legal_representative__legally_represented",
                )!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_family_member")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(mutation1Errors).toBeUndefined();
      expect(mutation1Data?.updatePetitionFieldGroupRelationships.fieldRelationships).toHaveLength(
        3,
      );

      const { errors: mutation2Errors, data: mutation2Data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              fieldRelationships {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [],
        },
      );

      expect(mutation2Errors).toBeUndefined();
      expect(mutation2Data?.updatePetitionFieldGroupRelationships).toEqual({
        fieldRelationships: [],
      });
    });

    it("resets relationships when passing new array", async () => {
      const { errors: mutation1Errors, data: mutation1Data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              fieldRelationships {
                leftSidePetitionField {
                  id
                }
                rightSidePetitionField {
                  id
                }
                relationshipTypeWithDirection {
                  profileRelationshipType {
                    alias
                  }
                  direction
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find(
                  (r) => r.alias === "p_legal_representative__legally_represented",
                )!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_family_member")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(mutation1Errors).toBeUndefined();
      expect(mutation1Data?.updatePetitionFieldGroupRelationships).toEqual({
        fieldRelationships: [
          {
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[0].id),
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[1].id),
            },
            relationshipTypeWithDirection: {
              profileRelationshipType: {
                alias: "p_legal_representative__legally_represented",
              },
              direction: "LEFT_RIGHT",
            },
          },
          {
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[0].id),
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[1].id),
            },
            relationshipTypeWithDirection: {
              profileRelationshipType: {
                alias: "p_family_member",
              },
              direction: "LEFT_RIGHT",
            },
          },
          {
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[0].id),
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[1].id),
            },
            relationshipTypeWithDirection: {
              profileRelationshipType: {
                alias: "p_parent__child",
              },
              direction: "LEFT_RIGHT",
            },
          },
        ],
      });

      const { errors: mutation2Errors, data: mutation2Data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              fieldRelationships {
                leftSidePetitionField {
                  id
                }
                rightSidePetitionField {
                  id
                }
                relationshipTypeWithDirection {
                  profileRelationshipType {
                    alias
                  }
                  direction
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", legalEntityFields[1].id),
              direction: "LEFT_RIGHT",
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find(
                  (r) => r.alias === "p_legal_representative__legally_represented",
                )!.id,
              ),
            },
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", contractFields[1].id),
              direction: "RIGHT_LEFT",
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_contract__counterparty")!.id,
              ),
            },
          ],
        },
      );

      expect(mutation2Errors).toBeUndefined();
      expect(mutation2Data?.updatePetitionFieldGroupRelationships).toEqual({
        fieldRelationships: [
          {
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[0].id),
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", legalEntityFields[1].id),
            },
            relationshipTypeWithDirection: {
              profileRelationshipType: {
                alias: "p_legal_representative__legally_represented",
              },
              direction: "LEFT_RIGHT",
            },
          },
          {
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[0].id),
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", contractFields[1].id),
            },
            relationshipTypeWithDirection: {
              profileRelationshipType: {
                alias: "p_contract__counterparty",
              },
              direction: "RIGHT_LEFT",
            },
          },
        ],
      });
    });

    it("deletes every relationship and updates the one with provided id", async () => {
      const { errors: mutation1Errors, data: mutation1Data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              fieldRelationships {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find(
                  (r) => r.alias === "p_legal_representative__legally_represented",
                )!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_family_member")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(mutation1Errors).toBeUndefined();
      expect(mutation1Data?.updatePetitionFieldGroupRelationships).toEqual({
        fieldRelationships: [
          { id: expect.any(String) },
          { id: expect.any(String) },
          { id: expect.any(String) },
        ],
      });

      const { errors: mutation2Errors, data: mutation2Data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              fieldRelationships {
                leftSidePetitionField {
                  id
                }
                rightSidePetitionField {
                  id
                }
                relationshipTypeWithDirection {
                  profileRelationshipType {
                    alias
                  }
                  direction
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              id: mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[1].id,
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_family_member")!.id,
              ),
              direction: "RIGHT_LEFT",
            },
            {
              id: mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[2].id,
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_close_associate")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(mutation2Errors).toBeUndefined();
      expect(mutation2Data?.updatePetitionFieldGroupRelationships).toEqual({
        fieldRelationships: [
          {
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[0].id),
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[1].id),
            },
            relationshipTypeWithDirection: {
              profileRelationshipType: {
                alias: "p_family_member",
              },
              direction: "RIGHT_LEFT",
            },
          },
          {
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[0].id),
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", individualFields[1].id),
            },
            relationshipTypeWithDirection: {
              profileRelationshipType: {
                alias: "p_close_associate",
              },
              direction: "LEFT_RIGHT",
            },
          },
        ],
      });

      const dbData = await mocks.knex
        .from("petition_field_group_relationship")
        .where("petition_id", petition.id)
        .select("*");

      expect(
        dbData.map(
          pick([
            "id",
            "left_side_petition_field_id",
            "right_side_petition_field_id",
            "profile_relationship_type_id",
            "deleted_at",
          ]),
        ),
      ).toIncludeSameMembers([
        {
          id: fromGlobalId(
            mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[0].id,
          ).id,
          left_side_petition_field_id: individualFields[0].id,
          right_side_petition_field_id: individualFields[1].id,
          profile_relationship_type_id: relationshipTypes.find(
            (r) => r.alias === "p_legal_representative__legally_represented",
          )!.id,
          deleted_at: expect.any(Date),
        },
        {
          id: fromGlobalId(
            mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[1].id,
          ).id,
          left_side_petition_field_id: individualFields[0].id,
          right_side_petition_field_id: individualFields[1].id,
          profile_relationship_type_id: relationshipTypes.find(
            (r) => r.alias === "p_family_member",
          )!.id,
          deleted_at: null,
        },
        {
          id: fromGlobalId(
            mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[2].id,
          ).id,
          left_side_petition_field_id: individualFields[0].id,
          right_side_petition_field_id: individualFields[1].id,
          profile_relationship_type_id: relationshipTypes.find(
            (r) => r.alias === "p_close_associate",
          )!.id,
          deleted_at: null,
        },
      ]);
    });

    it("deletes every relationship and creates a new one", async () => {
      const { errors: mutation1Errors, data: mutation1Data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              fieldRelationships {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find(
                  (r) => r.alias === "p_legal_representative__legally_represented",
                )!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_family_member")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(mutation1Errors).toBeUndefined();
      expect(mutation1Data?.updatePetitionFieldGroupRelationships).toEqual({
        fieldRelationships: [
          { id: expect.any(String) },
          { id: expect.any(String) },
          { id: expect.any(String) },
        ],
      });

      const { errors: mutation2Errors, data: mutation2Data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              fieldRelationships {
                leftSidePetitionField {
                  id
                }
                rightSidePetitionField {
                  id
                }
                relationshipTypeWithDirection {
                  profileRelationshipType {
                    alias
                  }
                  direction
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", contractFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", contractFields[1].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_main_contract__annex")!.id,
              ),
              direction: "RIGHT_LEFT",
            },
          ],
        },
      );

      expect(mutation2Errors).toBeUndefined();
      expect(mutation2Data?.updatePetitionFieldGroupRelationships).toEqual({
        fieldRelationships: [
          {
            leftSidePetitionField: {
              id: toGlobalId("PetitionField", contractFields[0].id),
            },
            rightSidePetitionField: {
              id: toGlobalId("PetitionField", contractFields[1].id),
            },
            relationshipTypeWithDirection: {
              profileRelationshipType: {
                alias: "p_main_contract__annex",
              },
              direction: "RIGHT_LEFT",
            },
          },
        ],
      });

      const dbData = await mocks.knex
        .from("petition_field_group_relationship")
        .where("petition_id", petition.id)
        .select("*");

      expect(
        dbData.map(
          pick([
            "id",
            "left_side_petition_field_id",
            "right_side_petition_field_id",
            "profile_relationship_type_id",
            "deleted_at",
          ]),
        ),
      ).toIncludeSameMembers([
        {
          id: fromGlobalId(
            mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[0].id,
          ).id,
          left_side_petition_field_id: individualFields[0].id,
          right_side_petition_field_id: individualFields[1].id,
          profile_relationship_type_id: relationshipTypes.find(
            (r) => r.alias === "p_legal_representative__legally_represented",
          )!.id,
          deleted_at: expect.any(Date),
        },
        {
          id: fromGlobalId(
            mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[1].id,
          ).id,
          left_side_petition_field_id: individualFields[0].id,
          right_side_petition_field_id: individualFields[1].id,
          profile_relationship_type_id: relationshipTypes.find(
            (r) => r.alias === "p_family_member",
          )!.id,
          deleted_at: expect.any(Date),
        },
        {
          id: fromGlobalId(
            mutation1Data.updatePetitionFieldGroupRelationships.fieldRelationships[2].id,
          ).id,
          left_side_petition_field_id: individualFields[0].id,
          right_side_petition_field_id: individualFields[1].id,
          profile_relationship_type_id: relationshipTypes.find(
            (r) => r.alias === "p_parent__child",
          )!.id,
          deleted_at: expect.any(Date),
        },
        {
          id: expect.any(Number),
          left_side_petition_field_id: contractFields[0].id,
          right_side_petition_field_id: contractFields[1].id,
          profile_relationship_type_id: relationshipTypes.find(
            (r) => r.alias === "p_main_contract__annex",
          )!.id,
          deleted_at: null,
        },
      ]);
    });

    it("sends error if trying to create non-reciprocal relationship on the same field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
          ) {
            updatePetitionFieldGroupRelationships(
              petitionId: $petitionId
              relationships: $relationships
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          relationships: [
            {
              leftSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              rightSidePetitionFieldId: toGlobalId("PetitionField", individualFields[0].id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((r) => r.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});

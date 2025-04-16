import { faker } from "@faker-js/faker";
import { Container } from "inversify";
import { Knex } from "knex";
import { groupBy, partition, range } from "remeda";
import { createTestContainer } from "../../../test/testContainer";
import {
  Organization,
  ProfileFieldValue,
  ProfileType,
  ProfileTypeField,
  User,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { deleteAllData } from "../../util/knexUtils";
import {
  PROFILE_EXCEL_IMPORT_SERVICE,
  ProfileExcelImportService,
} from "../ProfileExcelImportService";

describe("ProfileExcelImportService", () => {
  let container: Container;
  let knex: Knex;
  let mocks: Mocks;
  let importService: ProfileExcelImportService;

  let profileType: ProfileType;
  let profileTypeFields: ProfileTypeField[];
  let organization: Organization;
  let user: User;

  beforeAll(async () => {
    container = await createTestContainer();
    knex = container.get(KNEX);
    mocks = new Mocks(knex);

    importService = container.get<ProfileExcelImportService>(PROFILE_EXCEL_IMPORT_SERVICE);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
    profileTypeFields = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileType.id,
      8,
      (i) =>
        (
          [
            {
              alias: "p_short_text",
              type: "SHORT_TEXT",
            },
            {
              alias: "p_select_countries",
              type: "SELECT",
              options: {
                standardList: "COUNTRIES",
              },
            },
            {
              alias: "p_expirable_date",
              type: "DATE",
              is_expirable: true,
              options: {
                useReplyAsExpiryDate: true,
              },
            },
            {
              alias: "p_expirable_text",
              type: "TEXT",
              is_expirable: true,
            },
            {
              alias: "p_checkbox",
              type: "CHECKBOX",
            },
            {
              alias: "p_number",
              type: "NUMBER",
            },
            {
              alias: "p_file",
              type: "FILE",
            },
            {
              alias: "p_background_check",
              type: "BACKGROUND_CHECK",
            },
          ] satisfies Partial<ProfileTypeField>[]
        )[i],
    );
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  afterEach(async () => {
    await knex.from("profile_event").delete();
    await knex.from("profile_field_value").delete();
    await knex.from("profile").delete();
  });

  describe("importDataIntoProfiles", () => {
    it("should create profiles with the provided data", async () => {
      await importService.importDataIntoProfiles(
        profileType.id,
        // insert 100 new profiles with the provided data
        range(0, 100).map(() => ({
          profileId: null,
          values: [
            {
              profileTypeFieldId: profileTypeFields[0].id,
              alias: "p_short_text",
              type: "SHORT_TEXT" as const,
              content: { value: faker.lorem.words(3) },
              expiryDate: null,
            },
            {
              profileTypeFieldId: profileTypeFields[1].id,
              alias: "p_select_countries",
              type: "SELECT" as const,
              content: { value: ["AR", "ES", "FR", "UY"][Math.floor(Math.random() * 4)] },
              expiryDate: null,
            },
            {
              profileTypeFieldId: profileTypeFields[2].id,
              alias: "p_expirable_date",
              type: "DATE" as const,
              content: { value: "2020-01-01" },
              expiryDate: "2020-01-01",
            },
            {
              profileTypeFieldId: profileTypeFields[3].id,
              alias: "p_expirable_text",
              type: "TEXT" as const,
              content: { value: faker.lorem.words(3) },
              expiryDate: "2022-01-01",
            },
            {
              profileTypeFieldId: profileTypeFields[4].id,
              alias: "p_checkbox",
              type: "CHECKBOX" as const,
              content: { value: ["A", "C"] },
              expiryDate: null,
            },
            {
              profileTypeFieldId: profileTypeFields[5].id,
              alias: "p_number",
              type: "NUMBER" as const,
              content: { value: 123 },
              expiryDate: null,
            },
          ],
        })),
        user,
      );

      // there should be 100 profiles in total in BBDD
      const dbProfiles = await knex("profile")
        .from("profile")
        .where({
          org_id: organization.id,
          profile_type_id: profileType.id,
          deleted_at: null,
        })
        .select("*");

      const profileIds = dbProfiles.map((p) => p.id);
      expect(profileIds).toHaveLength(100);

      // each profile should have 6 values: 100 * 6 = 600 values in total
      const dbValues = await knex
        .from("profile_field_value")
        .where({
          deleted_at: null,
        })
        .select("*");
      expect(dbValues).toHaveLength(600);

      const byProfileId = groupBy(dbValues, (v) => v.profile_id);
      // there should be 100 different profiles in total
      expect(Object.keys(byProfileId)).toHaveLength(100);
      for (const values of Object.values(byProfileId)) {
        // each profile should have 6 values
        expect(values.map((v) => v.profile_type_field_id)).toIncludeSameMembers(
          profileTypeFields
            .filter((f) => f.type !== "FILE" && f.type !== "BACKGROUND_CHECK")
            .map((f) => f.id),
        );
      }

      const dbEvents = await knex("profile_event")
        .where({
          org_id: organization.id,
        })
        .select("*");

      // there should be 100 profile created events
      const profileCreated = dbEvents.filter((e) => e.type === "PROFILE_CREATED");
      expect(profileCreated).toHaveLength(100);
      expect(Object.keys(groupBy(profileCreated, (e) => e.profile_id))).toIncludeSameMembers(
        profileIds.map((id) => id.toString()), // groupBy converts the ids to strings
      );

      // there should be 100 * 6 profile field value updated events
      const profileFieldValueUpdated = dbEvents.filter(
        (e) => e.type === "PROFILE_FIELD_VALUE_UPDATED",
      );
      expect(profileFieldValueUpdated).toHaveLength(100 * 6);
      expect(
        Object.keys(groupBy(profileFieldValueUpdated, (e) => e.profile_id)),
      ).toIncludeSameMembers(profileIds.map((id) => id.toString()));

      // there should be 100*2 profile field expiry updated events
      const profileFieldExpiryUpdated = dbEvents.filter(
        (e) => e.type === "PROFILE_FIELD_EXPIRY_UPDATED",
      );
      expect(profileFieldExpiryUpdated).toHaveLength(100 * 2);
      expect(
        Object.keys(groupBy(profileFieldExpiryUpdated, (e) => e.profile_id)),
      ).toIncludeSameMembers(profileIds.map((id) => id.toString()));

      // there should be 100 profile updated events
      const profileUpdated = dbEvents.filter((e) => e.type === "PROFILE_UPDATED");
      expect(profileUpdated).toHaveLength(100);
      expect(Object.keys(groupBy(profileUpdated, (e) => e.profile_id))).toIncludeSameMembers(
        profileIds.map((id) => id.toString()), // groupBy converts the ids to strings
      );

      // there should be 100*6 + 100*2 + 100 = 900 events in total
      expect(dbEvents).toHaveLength(
        profileCreated.length +
          profileFieldValueUpdated.length +
          profileFieldExpiryUpdated.length +
          profileUpdated.length,
      );
    });

    it("should update profiles with the provided data", async () => {
      const profiles = await mocks.createRandomProfiles(organization.id, profileType.id, 100);
      for (const profile of profiles) {
        await mocks.createProfileFieldValues(profile.id, [
          {
            type: "SHORT_TEXT",
            created_by_user_id: user.id,
            profile_type_field_id: profileTypeFields[0].id,
            content: { value: faker.lorem.words(3) },
          },
          {
            type: "SELECT",
            created_by_user_id: user.id,
            profile_type_field_id: profileTypeFields[1].id,
            content: { value: ["AR", "ES", "FR", "UY"][Math.floor(Math.random() * 4)] },
          },
          {
            type: "DATE",
            created_by_user_id: user.id,
            profile_type_field_id: profileTypeFields[2].id,
            content: { value: "2020-01-01" },
            expiry_date: "2020-01-01",
          },
          {
            type: "TEXT",
            created_by_user_id: user.id,
            profile_type_field_id: profileTypeFields[3].id,
            content: { value: faker.lorem.words(3) },
            expiry_date: "2022-01-01",
          },
          {
            type: "CHECKBOX",
            created_by_user_id: user.id,
            profile_type_field_id: profileTypeFields[4].id,
            content: { value: ["A", "B", "C"] },
          },
          {
            type: "NUMBER",
            created_by_user_id: user.id,
            profile_type_field_id: profileTypeFields[5].id,
            content: { value: 456 },
          },
        ]);
      }

      // updates every value in each profile
      await importService.importDataIntoProfiles(
        profileType.id,
        profiles.map((profile) => ({
          profileId: profile.id,
          values: [
            {
              profileTypeFieldId: profileTypeFields[0].id,
              alias: "p_short_text",
              type: "SHORT_TEXT" as const,
              content: { value: faker.lorem.words(3) },
              expiryDate: null,
            },
            {
              profileTypeFieldId: profileTypeFields[1].id,
              alias: "p_select_countries",
              type: "SELECT" as const,
              content: { value: "CL" },
              expiryDate: null,
            },
            {
              profileTypeFieldId: profileTypeFields[2].id,
              alias: "p_expirable_date",
              type: "DATE" as const,
              content: { value: "2024-01-01" },
              expiryDate: "2024-01-01",
            },
            {
              profileTypeFieldId: profileTypeFields[3].id,
              alias: "p_expirable_text",
              type: "TEXT" as const,
              content: { value: faker.lorem.words(3) },
              expiryDate: "2025-01-01",
            },
            {
              profileTypeFieldId: profileTypeFields[4].id,
              alias: "p_checkbox",
              type: "CHECKBOX" as const,
              content: { value: ["A", "C"] },
              expiryDate: null,
            },
            {
              profileTypeFieldId: profileTypeFields[5].id,
              alias: "p_number",
              type: "NUMBER" as const,
              content: { value: 123 },
              expiryDate: null,
            },
          ],
        })),
        user,
      );

      const dbProfiles = await knex("profile")
        .from("profile")
        .where({
          org_id: organization.id,
          profile_type_id: profileType.id,
          deleted_at: null,
        })
        .select("*");

      // same amount of profiles as before
      expect(dbProfiles).toHaveLength(100);

      // there should be double the amount of values as one value has been removed and other inserted for each value
      const dbValues = await knex("profile_field_value")
        .from("profile_field_value")
        .where({
          deleted_at: null,
        })
        .select("*");
      expect(dbValues).toHaveLength(100 * 6 * 2);

      const [removedDbValues, insertedDbValues] = partition(
        dbValues,
        (v) => v.removed_by_user_id !== null,
      );
      expect(removedDbValues).toHaveLength(100 * 6);
      expect(insertedDbValues).toHaveLength(100 * 6);

      const byProfileId = groupBy(insertedDbValues, (v) => v.profile_id);
      expect(Object.keys(byProfileId)).toIncludeSameMembers(profiles.map((p) => p.id.toString()));

      for (const values of Object.values(byProfileId)) {
        expect(values.map((v) => v.profile_type_field_id)).toIncludeSameMembers(
          profileTypeFields
            .filter((f) => f.type !== "FILE" && f.type !== "BACKGROUND_CHECK")
            .map((f) => f.id),
        );
      }

      const dbEvents = await knex("profile_event")
        .where({
          org_id: organization.id,
        })
        .select("*");

      // there should be 100 profile updated events
      const profileUpdated = dbEvents.filter((e) => e.type === "PROFILE_UPDATED");
      expect(profileUpdated).toHaveLength(100);
      expect(Object.keys(groupBy(profileUpdated, (e) => e.profile_id))).toIncludeSameMembers(
        profiles.map((p) => p.id.toString()),
      );

      // there should be 100 * 6 profile field value updated events
      const profileFieldValueUpdated = dbEvents.filter(
        (e) => e.type === "PROFILE_FIELD_VALUE_UPDATED",
      );
      expect(profileFieldValueUpdated).toHaveLength(100 * 6);
      expect(
        Object.keys(groupBy(profileFieldValueUpdated, (e) => e.profile_id)),
      ).toIncludeSameMembers(profiles.map((p) => p.id.toString()));

      // there should be 100 * 2 profile field expiry updated events
      const profileFieldExpiryUpdated = dbEvents.filter(
        (e) => e.type === "PROFILE_FIELD_EXPIRY_UPDATED",
      );
      expect(profileFieldExpiryUpdated).toHaveLength(100 * 2);
      expect(
        Object.keys(groupBy(profileFieldExpiryUpdated, (e) => e.profile_id)),
      ).toIncludeSameMembers(profiles.map((p) => p.id.toString()));

      // there should be 100 * 6 + 100 * 2 + 100 = 900 events in total
      expect(dbEvents).toHaveLength(
        profileUpdated.length + profileFieldValueUpdated.length + profileFieldExpiryUpdated.length,
      );
    });

    it("should not update values that are not provided or contents are equal to previous", async () => {
      const profiles = await mocks.createRandomProfiles(organization.id, profileType.id, 100);
      const valuesById: Record<number, ProfileFieldValue[]> = {};
      for (const profile of profiles) {
        const values = await mocks.createProfileFieldValues(profile.id, [
          {
            type: "SHORT_TEXT",
            created_by_user_id: user.id,
            profile_type_field_id: profileTypeFields[0].id,
            content: { value: "Harvey Specter" },
          },
          {
            type: "SELECT",
            created_by_user_id: user.id,
            profile_type_field_id: profileTypeFields[1].id,
            content: { value: ["AR", "ES", "FR", "UY"][Math.floor(Math.random() * 4)] },
          },
          {
            type: "DATE",
            created_by_user_id: user.id,
            profile_type_field_id: profileTypeFields[2].id,
            content: { value: "2020-01-01" },
            expiry_date: "2020-01-01",
          },
          {
            type: "TEXT",
            created_by_user_id: user.id,
            profile_type_field_id: profileTypeFields[3].id,
            content: { value: faker.lorem.words(3) },
            expiry_date: "2022-01-01",
          },
          {
            type: "CHECKBOX",
            created_by_user_id: user.id,
            profile_type_field_id: profileTypeFields[4].id,
            content: { value: ["A", "B", "C"] },
          },
          {
            type: "NUMBER",
            created_by_user_id: user.id,
            profile_type_field_id: profileTypeFields[5].id,
            content: { value: 456 },
          },
        ]);

        valuesById[profile.id] = values;
      }

      await importService.importDataIntoProfiles(
        profileType.id,
        [
          // first 50 profiles will be identical to current values
          ...profiles.slice(0, 50).map((profile) => ({
            profileId: profile.id,
            values: valuesById[profile.id].map((v) => ({
              profileTypeFieldId: v.profile_type_field_id,
              alias: profileTypeFields.find((f) => f.id === v.profile_type_field_id)!.alias,
              type: v.type,
              content: v.content,
              expiryDate: v.expiry_date,
            })),
          })),
          // last 50 profiles will have some values updated or removed
          ...profiles.slice(50, 100).map((profile) => ({
            profileId: profile.id,
            values: [
              {
                profileTypeFieldId: profileTypeFields[0].id,
                alias: "p_short_text",
                type: "SHORT_TEXT" as const,
                content: { value: "Harvey Specter" },
                expiryDate: null,
              },
              {
                profileTypeFieldId: profileTypeFields[1].id,
                alias: "p_select_countries",
                type: "SELECT" as const,
                content: null,
                expiryDate: null,
              },
              {
                profileTypeFieldId: profileTypeFields[2].id,
                alias: "p_expirable_date",
                type: "DATE" as const,
                content: { value: "2020-01-01" },
                expiryDate: "2020-11-11", // only change the expiry date
              },
              {
                profileTypeFieldId: profileTypeFields[3].id,
                alias: "p_expirable_text",
                type: "TEXT" as const,
                content: { value: "Mike Ross" }, // only change the content
                expiryDate: "2022-01-01",
              },
              {
                profileTypeFieldId: profileTypeFields[4].id,
                alias: "p_checkbox",
                type: "CHECKBOX" as const,
                content: { value: ["A", "C", "B"] }, // change in order should not be considered as an update
                expiryDate: null,
              },
            ],
          })),
        ],
        user,
      );

      const dbProfiles = await knex("profile")
        .from("profile")
        .where({
          org_id: organization.id,
          profile_type_id: profileType.id,
          deleted_at: null,
        })
        .select("*");

      expect(dbProfiles).toHaveLength(100);
      // there should be 600 (initial 6 values * 100 profiles)
      // plus 50*2 new values (2 on each updated profile: p_expirable_date updated expiry date and p_expirable_text updated content)
      const dbValues = await knex("profile_field_value")
        .from("profile_field_value")
        .where({
          deleted_at: null,
        })
        .select("*");

      // 100 SHORT_TEXT (no updates)
      // 100 SELECT (no updates, 50 of them removed)
      // 150 DATE (50 original + 50 removed + 50 updated)
      // 150 TEXT (50 original + 50 removed + 50 updated)
      // 100 CHECKBOX (no updates, only order changed)
      // 100 NUMBER (no updates)

      const shortTextValues = dbValues.filter(
        (v) => v.type === "SHORT_TEXT" && v.profile_type_field_id === profileTypeFields[0].id,
      );
      expect(shortTextValues).toHaveLength(100);
      expect(shortTextValues.every((v) => v.removed_by_user_id === null)).toBe(true);
      expect(Object.keys(groupBy(shortTextValues, (v) => v.profile_id))).toIncludeSameMembers(
        profiles.map((p) => p.id.toString()),
      );

      const selectValues = dbValues.filter(
        (v) => v.type === "SELECT" && v.profile_type_field_id === profileTypeFields[1].id,
      );
      expect(selectValues).toHaveLength(100);
      const [removedSelect, notRemovedSelect] = partition(
        selectValues,
        (v) => v.removed_by_user_id !== null,
      );
      expect(removedSelect).toHaveLength(50);
      expect(notRemovedSelect).toHaveLength(50);

      const dateValues = dbValues.filter(
        (v) => v.type === "DATE" && v.profile_type_field_id === profileTypeFields[2].id,
      );
      expect(dateValues).toHaveLength(150);
      const [removedDate, notRemovedDate] = partition(
        dateValues,
        (v) => v.removed_by_user_id !== null,
      );
      expect(removedDate).toHaveLength(50);
      expect(notRemovedDate).toHaveLength(100);

      const textValues = dbValues.filter(
        (v) => v.type === "TEXT" && v.profile_type_field_id === profileTypeFields[3].id,
      );
      expect(textValues).toHaveLength(150);
      const [removedText, notRemovedText] = partition(
        textValues,
        (v) => v.removed_by_user_id !== null,
      );
      expect(removedText).toHaveLength(50);
      expect(notRemovedText).toHaveLength(100);

      const checkboxValues = dbValues.filter(
        (v) => v.type === "CHECKBOX" && v.profile_type_field_id === profileTypeFields[4].id,
      );
      expect(checkboxValues).toHaveLength(100);
      expect(checkboxValues.every((v) => v.removed_by_user_id === null)).toBe(true);

      const numberValues = dbValues.filter(
        (v) => v.type === "NUMBER" && v.profile_type_field_id === profileTypeFields[5].id,
      );
      expect(numberValues).toHaveLength(100);
      expect(numberValues.every((v) => v.removed_by_user_id === null)).toBe(true);

      expect(dbValues).toHaveLength(700);

      const dbEvents = await knex("profile_event")
        .where({
          org_id: organization.id,
        })
        .select("*");

      const profileUpdated = dbEvents.filter((e) => e.type === "PROFILE_UPDATED");
      expect(profileUpdated).toHaveLength(50);
      const updatedProfileIds = profileUpdated.map((e) => e.profile_id);
      expect(updatedProfileIds).toIncludeSameMembers(profiles.slice(50, 100).map((p) => p.id));

      const profileFieldValueUpdated = dbEvents.filter(
        (e) => e.type === "PROFILE_FIELD_VALUE_UPDATED",
      );

      // 50 SELECT updates (removed)
      // 50 DATE updates (removed + updated)
      // 50 TEXT updates (removed + updated)
      expect(profileFieldValueUpdated).toHaveLength(150);

      const profileFieldExpiryUpdated = dbEvents.filter(
        (e) => e.type === "PROFILE_FIELD_EXPIRY_UPDATED",
      );
      expect(profileFieldExpiryUpdated).toHaveLength(50);

      expect(dbEvents).toHaveLength(
        profileUpdated.length + profileFieldValueUpdated.length + profileFieldExpiryUpdated.length,
      );
    });
  });
});

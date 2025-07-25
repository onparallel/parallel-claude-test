import { Container } from "inversify";
import { Knex } from "knex";
import { isNonNullish, pick } from "remeda";
import { createTestContainer } from "../../../../test/testContainer";
import { deleteAllData } from "../../../util/knexUtils";
import {
  Organization,
  Profile,
  ProfileStatus,
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldType,
  User,
} from "../../__types";
import { KNEX } from "../../knex";
import { ProfileRepository } from "../ProfileRepository";
import { Mocks } from "./mocks";

describe("repositories/ProfileRepository", () => {
  let container: Container;
  let knex: Knex;
  let mocks: Mocks;
  let organization: Organization;
  let user: User;
  let repo: ProfileRepository;

  beforeAll(async () => {
    container = await createTestContainer();
    knex = container.get<Knex>(KNEX);
    repo = container.get(ProfileRepository);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1);
    [user] = await mocks.createRandomUsers(organization.id, 1);
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  describe("getProfileIdsWithActiveMonitoringByProfileTypeFieldId", () => {
    let backgroundCheckField: ProfileTypeField;
    let selectField: ProfileTypeField;
    let profiles: Profile[];

    beforeEach(async () => {
      const [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      [backgroundCheckField, selectField] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        2,
        (i) => ({
          type: ["BACKGROUND_CHECK", "SELECT"][i] as ProfileTypeFieldType,
          options:
            i === 1
              ? {
                  values: [
                    { value: "high", label: { en: "high" } },
                    { value: "medium", label: { en: "medium" } },
                    { value: "low", label: { en: "low" } },
                  ],
                }
              : {},
        }),
      );

      profiles = await mocks.createRandomProfiles(organization.id, profileType.id, 5, () => ({
        status: "OPEN",
      }));

      // Closed profiles should not appear in results
      await mocks.createRandomProfiles(organization.id, profileType.id, 2, (i) => ({
        status: ["CLOSED", "DELETION_SCHEDULED"][i] as ProfileStatus,
        closed_at: new Date(),
        deletion_scheduled_at: i === 1 ? new Date() : null,
      }));

      // profiles of another profile type should not appear
      const [otherProfileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      await mocks.createRandomProfiles(organization.id, otherProfileType.id, 2);
    });

    it("returns nothing if field has no monitoring", async () => {
      const result = await repo.getProfileIdsWithActiveMonitoringByProfileTypeFieldId(
        backgroundCheckField.id,
      );

      expect(result).toHaveLength(0);
    });

    it("returns all profiles if field has no activation conditions", async () => {
      await mocks.knex
        .from("profile_type_field")
        .where("id", backgroundCheckField.id)
        .update({
          options: { monitoring: { searchFrequency: { type: "FIXED", frequency: "3_MONTHS" } } },
        });

      const result = await repo.getProfileIdsWithActiveMonitoringByProfileTypeFieldId(
        backgroundCheckField.id,
      );
      expect(result).toIncludeSameMembers(profiles.map((p) => p.id));
    });

    it("returns profiles with SELECT values that match activation conditions", async () => {
      await mocks.knex
        .from("profile_type_field")
        .where("id", backgroundCheckField.id)
        .update({
          options: {
            monitoring: {
              searchFrequency: { type: "FIXED", frequency: "3_MONTHS" },
              activationCondition: {
                profileTypeFieldId: selectField.id,
                values: ["high", "medium"],
              },
            },
          },
        });

      await mocks.createProfileFieldValues(profiles[0].id, [
        {
          profile_type_field_id: selectField.id,
          content: { value: "high" },
          created_by_user_id: user.id,
          removed_at: new Date(),
          removed_by_user_id: user.id,
          type: "SELECT",
        },
      ]);

      await mocks.createProfileFieldValues(profiles[1].id, [
        {
          profile_type_field_id: selectField.id,
          content: { value: "medium" },
          created_by_user_id: user.id,
          type: "SELECT",
        },
      ]);

      await mocks.createProfileFieldValues(profiles[2].id, [
        {
          profile_type_field_id: selectField.id,
          content: { value: "low" },
          created_by_user_id: user.id,
          type: "SELECT",
        },
      ]);

      await mocks.createProfileFieldValues(profiles[3].id, [
        {
          profile_type_field_id: selectField.id,
          content: { value: "high" },
          created_by_user_id: user.id,
          type: "SELECT",
          removed_at: new Date(),
          removed_by_user_id: user.id,
          deleted_at: new Date(),
          deleted_by: `User:${user.id}`,
          anonymized_at: new Date(),
        },
      ]);

      await mocks.createProfileFieldValues(profiles[4].id, [
        {
          profile_type_field_id: selectField.id,
          content: { value: "high" },
          created_by_user_id: user.id,
          type: "SELECT",
        },
      ]);

      const result = await repo.getProfileIdsWithActiveMonitoringByProfileTypeFieldId(
        backgroundCheckField.id,
      );
      expect(result).toIncludeSameMembers([profiles[1].id, profiles[4].id]);
    });
  });

  describe("getProfileFieldValuesForRefreshByOrgId", () => {
    let bgCheckWithMonitoring: ProfileTypeField;
    let bgCheckNoMonitoring: ProfileTypeField;
    let adverseMediaWithMonitoring: ProfileTypeField;
    let adverseMediaNoMonitoring: ProfileTypeField;
    let profiles: Profile[];

    beforeEach(async () => {
      const [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      [
        bgCheckWithMonitoring,
        bgCheckNoMonitoring,
        adverseMediaWithMonitoring,
        adverseMediaNoMonitoring,
      ] = await mocks.createRandomProfileTypeFields(organization.id, profileType.id, 4, (i) => ({
        type: [
          "BACKGROUND_CHECK",
          "BACKGROUND_CHECK",
          "ADVERSE_MEDIA_SEARCH",
          "ADVERSE_MEDIA_SEARCH",
        ][i] as ProfileTypeFieldType,
        options:
          i === 0 || i === 2
            ? { monitoring: { searchFrequency: { type: "FIXED", frequency: "3_MONTHS" } } }
            : { monitoring: null },
      }));

      profiles = await mocks.createRandomProfiles(organization.id, profileType.id, 5, (i) => ({
        status: i === 4 ? "CLOSED" : "OPEN",
        closed_at: i === 4 ? new Date() : null,
      }));
    });

    it("returns all current values with defined monitoring rules", async () => {
      const p0Values = await mocks.createProfileFieldValues(profiles[0].id, [
        {
          content: { query: "query", search: "search" }, // mocked, doesn't matter
          profile_type_field_id: bgCheckWithMonitoring.id,
          created_by_user_id: user.id,
          type: "BACKGROUND_CHECK",
          active_monitoring: true,
        },
        {
          content: { query: "query", search: "search" },
          profile_type_field_id: bgCheckNoMonitoring.id,
          created_by_user_id: user.id,
          type: "BACKGROUND_CHECK",
          active_monitoring: true,
        },
      ]);

      const p1Values = await mocks.createProfileFieldValues(profiles[1].id, [
        {
          content: { query: "query", search: "search" },
          profile_type_field_id: bgCheckWithMonitoring.id,
          created_by_user_id: user.id,
          type: "BACKGROUND_CHECK",
          active_monitoring: true,
        },
      ]);

      // value is removed
      await mocks.createProfileFieldValues(profiles[2].id, [
        {
          content: { query: "query", search: "search" },
          profile_type_field_id: bgCheckWithMonitoring.id,
          created_by_user_id: user.id,
          type: "BACKGROUND_CHECK",
          removed_at: new Date(),
          removed_by_user_id: user.id,
          active_monitoring: true,
        },
      ]);

      // monitoring disabled on this value
      await mocks.createProfileFieldValues(profiles[3].id, [
        {
          content: { query: "query", search: "search" },
          profile_type_field_id: bgCheckWithMonitoring.id,
          created_by_user_id: user.id,
          type: "BACKGROUND_CHECK",
          active_monitoring: false,
        },
      ]);

      // value only has a draft
      await mocks.createProfileFieldValues(profiles[3].id, [
        {
          content: { query: "query", search: "search" },
          profile_type_field_id: bgCheckWithMonitoring.id,
          created_by_user_id: user.id,
          type: "BACKGROUND_CHECK",
          active_monitoring: true,
          is_draft: true,
        },
      ]);

      // profile is closed
      await mocks.createProfileFieldValues(profiles[4].id, [
        {
          content: { query: "query", search: "search" },
          profile_type_field_id: bgCheckWithMonitoring.id,
          created_by_user_id: user.id,
          type: "BACKGROUND_CHECK",
          active_monitoring: true,
        },
      ]);

      const result = await repo.getProfileFieldValuesForRefreshByOrgId(
        organization.id,
        "BACKGROUND_CHECK",
        (_, monitoring) => isNonNullish(monitoring),
      );
      expect(result.map((r) => r.id)).toIncludeSameMembers([p0Values[0].id, p1Values[0].id]);
    });

    it("returns stored value if draft is present", async () => {
      const p0Values = await mocks.createProfileFieldValues(profiles[0].id, [
        {
          content: {
            search: [],
            articles: { totalCount: 0, items: [], createdAt: new Date() },
            relevant_articles: [],
            dismissed_articles: [],
            irrelevant_articles: [],
          },
          profile_type_field_id: adverseMediaWithMonitoring.id,
          created_by_user_id: user.id,
          type: "ADVERSE_MEDIA_SEARCH",
          active_monitoring: true,
          is_draft: false,
        },
        {
          content: {
            search: [],
            articles: { totalCount: 0, items: [], createdAt: new Date() },
            relevant_articles: [],
            dismissed_articles: [],
            irrelevant_articles: [],
          },
          profile_type_field_id: adverseMediaNoMonitoring.id,
          created_by_user_id: user.id,
          type: "ADVERSE_MEDIA_SEARCH",
          active_monitoring: true,
        },
      ]);

      const p1Values = await mocks.createProfileFieldValues(profiles[1].id, [
        {
          content: {
            search: [],
            articles: { totalCount: 0, items: [], createdAt: new Date() },
            relevant_articles: [],
            dismissed_articles: [],
            irrelevant_articles: [],
          },
          profile_type_field_id: adverseMediaWithMonitoring.id,
          created_by_user_id: user.id,
          type: "ADVERSE_MEDIA_SEARCH",
          active_monitoring: true,
          is_draft: false,
        },
        {
          content: {
            search: [],
            articles: { totalCount: 0, items: [], createdAt: new Date() },
            relevant_articles: [],
            dismissed_articles: [],
            irrelevant_articles: [],
          },
          profile_type_field_id: adverseMediaWithMonitoring.id,
          created_by_user_id: user.id,
          type: "ADVERSE_MEDIA_SEARCH",
          active_monitoring: true,
          is_draft: true,
        },
      ]);

      const result = await repo.getProfileFieldValuesForRefreshByOrgId(
        organization.id,
        "ADVERSE_MEDIA_SEARCH",
        (_, monitoring) => isNonNullish(monitoring),
      );

      expect(result.map(pick(["id", "has_draft"]))).toIncludeSameMembers([
        { id: p0Values[0].id, has_draft: false },
        { id: p1Values[0].id, has_draft: true },
      ]);
    });
  });

  describe("getSubscribedUsersWithReadPermissions", () => {
    let fieldDefaultHidden: ProfileTypeField;
    let fieldDefaultRead: ProfileTypeField;
    let profiles: Profile[];

    let user2: User;
    let user3: User;

    beforeEach(async () => {
      [user2, user3] = await mocks.createRandomUsers(organization.id, 2);

      const [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      [fieldDefaultHidden, fieldDefaultRead] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        2,
        (i) => ({
          type: "BACKGROUND_CHECK",
          options: { monitoring: null },
          permission: i === 0 ? "HIDDEN" : "READ",
        }),
      );

      profiles = await mocks.createRandomProfiles(organization.id, profileType.id, 2, (i) => ({
        status: "OPEN",
      }));

      await mocks.knex.from("profile_subscription").insert([
        { profile_id: profiles[0].id, user_id: user.id },
        { profile_id: profiles[0].id, user_id: user2.id },
        { profile_id: profiles[1].id, user_id: user2.id },
        { profile_id: profiles[1].id, user_id: user3.id },
      ]);

      await mocks.knex.from("profile_type_field_permission").insert({
        user_id: user2.id,
        profile_type_field_id: fieldDefaultHidden.id,
        permission: "READ",
      });
    });

    it("returns list of profile field values grouped by user", async () => {
      const results = await repo.getSubscribedUsersWithReadPermissions([
        { profile_id: profiles[0].id, profile_type_field_id: fieldDefaultHidden.id },
        { profile_id: profiles[0].id, profile_type_field_id: fieldDefaultRead.id },
        { profile_id: profiles[1].id, profile_type_field_id: fieldDefaultHidden.id },
        { profile_id: profiles[1].id, profile_type_field_id: fieldDefaultRead.id },
      ]);

      expect(results).toEqual({
        [user.id]: [{ profileId: profiles[0].id, profileTypeFieldId: fieldDefaultRead.id }],
        [user2.id]: expect.toIncludeSameMembers([
          { profileId: profiles[0].id, profileTypeFieldId: fieldDefaultRead.id },
          { profileId: profiles[0].id, profileTypeFieldId: fieldDefaultHidden.id },
          { profileId: profiles[1].id, profileTypeFieldId: fieldDefaultRead.id },
          { profileId: profiles[1].id, profileTypeFieldId: fieldDefaultHidden.id },
        ]),
        [user3.id]: [{ profileId: profiles[1].id, profileTypeFieldId: fieldDefaultRead.id }],
      });
    });
  });

  describe("anonymizeProfile", () => {
    let profileType: ProfileType;
    let fields: ProfileTypeField[];

    beforeAll(async () => {
      [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      fields = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        3,
        (i) =>
          [
            {
              type: "SHORT_TEXT" as const,
            },
            {
              type: "DATE" as const,
              is_expirable: true,
              options: JSON.stringify({
                useReplyAsExpiryDate: true,
              }),
            },
            {
              type: "SELECT" as const,
              options: JSON.stringify({
                values: [
                  { value: "HIGH", label: { en: "high" } },
                  { value: "MEDIUM", label: { en: "medium" } },
                  { value: "LOW", label: { en: "low" } },
                ],
              }),
            },
          ][i],
      );
    });

    it("anonymizes entire profile with its values and clears cache", async () => {
      const [profile] = await repo.createProfiles(
        {
          org_id: organization.id,
          profile_type_id: profileType.id,
          status: "OPEN",
        },
        user.id,
      );

      await repo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            profileTypeFieldId: fields[0].id,
            type: "SHORT_TEXT",
            content: { value: "test" },
          },
          {
            profileId: profile.id,
            profileTypeFieldId: fields[1].id,
            type: "DATE",
            content: { value: "2024-10-10" },
            expiryDate: "2024-10-10",
          },
          {
            profileId: profile.id,
            profileTypeFieldId: fields[2].id,
            type: "SELECT",
            content: { value: "HIGH" },
          },
        ],
        user.id,
        organization.id,
      );

      const [profileBefore] = await mocks.knex.from("profile").where("id", profile.id).select("*");
      expect(profileBefore).toMatchObject({
        anonymized_at: null,
        value_cache: {
          [fields[0].id]: { content: { value: "test" } },
          [fields[1].id]: { content: { value: "2024-10-10" }, expiry_date: "2024-10-10" },
          [fields[2].id]: { content: { value: "HIGH" } },
        },
      });

      await repo.deleteProfile([profile.id], `User:${user.id}`);
      await repo.anonymizeProfile([profile.id]);

      const [profileAfter] = await mocks.knex.from("profile").where("id", profile.id).select("*");
      expect(profileAfter).toMatchObject({
        deleted_at: expect.any(Date),
        anonymized_at: expect.any(Date),
        value_cache: {},
      });

      const valuesAfter = await mocks.knex
        .from("profile_field_value")
        .where("profile_id", profile.id)
        .select("*");

      expect(valuesAfter.every((v) => v.anonymized_at !== null && v.content.value === null)).toBe(
        true,
      );
    });
  });

  describe("updateProfileFieldValues", () => {
    let profileType: ProfileType;
    let fields: ProfileTypeField[];
    beforeAll(async () => {
      [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      fields = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        4,
        (i) => ({
          type: ["SHORT_TEXT", "CHECKBOX", "BACKGROUND_CHECK", "ADVERSE_MEDIA_SEARCH"][
            i
          ] as ProfileTypeFieldType,
          options:
            i === 1
              ? JSON.stringify({
                  values: [
                    { label: { en: "A" }, value: "A" },
                    { label: { en: "B" }, value: "B" },
                    { label: { en: "C" }, value: "C" },
                  ],
                })
              : {},
        }),
      );
    });

    it("does nothing if updating SHORT_TEXT field with exactly same content", async () => {
      const [profile] = await repo.createProfiles(
        { org_id: organization.id, profile_type_id: profileType.id, status: "OPEN" },
        user.id,
      );

      const dbEvents1 = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "asc")
        .select("type");

      expect(dbEvents1).toEqual([{ type: "PROFILE_CREATED" }]);

      await repo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            profileTypeFieldId: fields[0].id,
            type: "SHORT_TEXT",
            content: { value: "test" },
          },
        ],
        user.id,
        organization.id,
      );

      const dbEvents2 = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "asc")
        .select("type");

      expect(dbEvents2).toEqual([
        { type: "PROFILE_CREATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
        { type: "PROFILE_UPDATED" },
      ]);

      await repo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            profileTypeFieldId: fields[0].id,
            type: "SHORT_TEXT",
            content: { value: "test" },
          },
        ],
        user.id,
        organization.id,
      );

      const dbEvents3 = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "asc")
        .select("type");

      expect(dbEvents3).toEqual([
        { type: "PROFILE_CREATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
        { type: "PROFILE_UPDATED" },
      ]);

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where("profile_id", profile.id)
        .select("*");

      expect(pfvs).toHaveLength(1);
    });

    it("does nothing if updating CHECKBOX field with exactly same content", async () => {
      const [profile] = await repo.createProfiles(
        { org_id: organization.id, profile_type_id: profileType.id, status: "OPEN" },
        user.id,
      );

      const dbEvents1 = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "asc")
        .select("type");

      expect(dbEvents1).toEqual([{ type: "PROFILE_CREATED" }]);

      await repo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            profileTypeFieldId: fields[1].id,
            type: "CHECKBOX",
            content: { value: ["A", "C"] },
          },
        ],
        user.id,
        organization.id,
      );

      const dbEvents2 = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "asc")
        .select("type");

      expect(dbEvents2).toEqual([
        { type: "PROFILE_CREATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
        { type: "PROFILE_UPDATED" },
      ]);

      await repo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            profileTypeFieldId: fields[1].id,
            type: "CHECKBOX",
            content: { value: ["C", "A"] }, // order doesn't matter
          },
        ],
        user.id,
        organization.id,
      );

      const dbEvents3 = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "asc")
        .select("type");

      expect(dbEvents3).toEqual([
        { type: "PROFILE_CREATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
        { type: "PROFILE_UPDATED" },
      ]);

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where("profile_id", profile.id)
        .select("*");

      expect(pfvs).toHaveLength(1);
    });

    it("updates BACKGROUND_CHECK field with exactly same content", async () => {
      const [profile] = await repo.createProfiles(
        { org_id: organization.id, profile_type_id: profileType.id, status: "OPEN" },
        user.id,
      );

      const dbEvents1 = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "asc")
        .select("type");

      expect(dbEvents1).toEqual([{ type: "PROFILE_CREATED" }]);

      await repo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            profileTypeFieldId: fields[2].id,
            type: "BACKGROUND_CHECK",
            content: {
              query: {
                name: "John Doe",
                date: "2024-10-10",
                type: "PERSON",
                country: "FR",
              },
              entity: {
                id: "123",
                type: "PERSON",
                name: "John Doe",
                properties: {},
              },
              search: {
                totalCount: 1,
                items: [
                  {
                    id: "123",
                    type: "PERSON",
                    name: "John Doe",
                    properties: {},
                  },
                ],
                createdAt: new Date(),
              },
            },
          },
        ],
        user.id,
        organization.id,
      );

      const dbEvents2 = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "asc")
        .select("type");

      expect(dbEvents2).toEqual([
        { type: "PROFILE_CREATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
        { type: "PROFILE_UPDATED" },
      ]);

      await repo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            profileTypeFieldId: fields[2].id,
            type: "BACKGROUND_CHECK",
            content: {
              query: {
                name: "John Doe",
                date: "2024-10-10",
                type: "PERSON",
                country: "FR",
              },
              entity: {
                id: "123",
                type: "PERSON",
                name: "John Doe",
                properties: {},
              },
              search: {
                totalCount: 1,
                items: [
                  {
                    id: "123",
                    type: "PERSON",
                    name: "John Doe",
                    properties: {},
                  },
                ],
                createdAt: new Date(),
              },
            },
          },
        ],
        user.id,
        organization.id,
      );

      const dbEvents3 = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "asc")
        .select("type");

      expect(dbEvents3).toEqual([
        { type: "PROFILE_CREATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
        { type: "PROFILE_UPDATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
        { type: "PROFILE_UPDATED" },
      ]);

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where("profile_id", profile.id)
        .select("*");

      expect(pfvs).toHaveLength(2);
      expect(
        pfvs.map(pick(["profile_type_field_id", "content", "is_draft", "removed_at"])),
      ).toIncludeSameMembers([
        {
          profile_type_field_id: fields[2].id,
          content: {
            query: {
              name: "John Doe",
              date: "2024-10-10",
              type: "PERSON",
              country: "FR",
            },
            entity: {
              id: "123",
              type: "PERSON",
              name: "John Doe",
              properties: {},
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: "123",
                  type: "PERSON",
                  name: "John Doe",
                  properties: {},
                },
              ],
              createdAt: expect.any(String),
            },
          },
          is_draft: false,
          removed_at: expect.any(Date),
        },
        {
          profile_type_field_id: fields[2].id,
          content: {
            query: {
              name: "John Doe",
              date: "2024-10-10",
              type: "PERSON",
              country: "FR",
            },
            entity: {
              id: "123",
              type: "PERSON",
              name: "John Doe",
              properties: {},
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: "123",
                  type: "PERSON",
                  name: "John Doe",
                  properties: {},
                },
              ],
              createdAt: expect.any(String),
            },
          },
          is_draft: false,
          removed_at: null,
        },
      ]);
    });

    it("updates ADVERSE_MEDIA_SEARCH field with exactly same content", async () => {
      const [profile] = await repo.createProfiles(
        { org_id: organization.id, profile_type_id: profileType.id, status: "OPEN" },
        user.id,
      );

      const dbEvents1 = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "asc")
        .select("type");

      expect(dbEvents1).toEqual([{ type: "PROFILE_CREATED" }]);

      await repo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            profileTypeFieldId: fields[3].id,
            type: "ADVERSE_MEDIA_SEARCH",
            content: {
              search: [{ term: "John Doe" }, { wikiDataId: "Q7747", label: "Vladimir Putin" }],
              articles: {
                totalCount: 4,
                items: [
                  {
                    id: "1",
                    header: "John Doe is a good person",
                    timestamp: 1712345678,
                    source: "Google",
                  },
                  {
                    id: "2",
                    header: "Putin's speech",
                    timestamp: 1712345678,
                    source: "Google",
                  },
                  {
                    id: "3",
                    header: "Vladimir Putin in talks with Trump",
                    timestamp: 1712345678,
                    source: "Google",
                  },
                  {
                    id: "4",
                    header: "Jane Smith wins prestigious award",
                    timestamp: 1712345678,
                    source: "Google",
                  },
                ],
                createdAt: new Date(),
              },
              relevant_articles: [{ id: "1" }],
              irrelevant_articles: [{ id: "2" }, { id: "4" }],
              dismissed_articles: [{ id: "3" }],
            },
          },
        ],
        user.id,
        organization.id,
      );

      const dbEvents2 = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "asc")
        .select("type");

      expect(dbEvents2).toEqual([
        { type: "PROFILE_CREATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
        { type: "PROFILE_UPDATED" },
      ]);

      await repo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            profileTypeFieldId: fields[3].id,
            type: "ADVERSE_MEDIA_SEARCH",
            content: {
              search: [{ term: "John Doe" }, { wikiDataId: "Q7747", label: "Vladimir Putin" }],
              articles: {
                totalCount: 4,
                items: [
                  {
                    id: "1",
                    header: "John Doe is a good person",
                    timestamp: 1712345678,
                    source: "Google",
                  },
                  {
                    id: "2",
                    header: "Putin's speech",
                    timestamp: 1712345678,
                    source: "Google",
                  },
                  {
                    id: "3",
                    header: "Vladimir Putin in talks with Trump",
                    timestamp: 1712345678,
                    source: "Google",
                  },
                  {
                    id: "4",
                    header: "Jane Smith wins prestigious award",
                    timestamp: 1712345678,
                    source: "Google",
                  },
                ],
                createdAt: new Date(),
              },
              relevant_articles: [{ id: "1" }],
              irrelevant_articles: [{ id: "2" }, { id: "4" }],
              dismissed_articles: [{ id: "3" }],
            },
          },
        ],
        user.id,
        organization.id,
      );

      const dbEvents3 = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "asc")
        .select("type");

      expect(dbEvents3).toEqual([
        { type: "PROFILE_CREATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
        { type: "PROFILE_UPDATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
        { type: "PROFILE_UPDATED" },
      ]);

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where("profile_id", profile.id)
        .select("*");

      expect(pfvs).toHaveLength(2);
      expect(
        pfvs.map(pick(["profile_type_field_id", "content", "is_draft", "removed_at"])),
      ).toIncludeSameMembers([
        {
          profile_type_field_id: fields[3].id,
          content: {
            search: [{ term: "John Doe" }, { wikiDataId: "Q7747", label: "Vladimir Putin" }],
            articles: {
              totalCount: 4,
              items: [
                {
                  id: "1",
                  header: "John Doe is a good person",
                  timestamp: 1712345678,
                  source: "Google",
                },
                {
                  id: "2",
                  header: "Putin's speech",
                  timestamp: 1712345678,
                  source: "Google",
                },
                {
                  id: "3",
                  header: "Vladimir Putin in talks with Trump",
                  timestamp: 1712345678,
                  source: "Google",
                },
                {
                  id: "4",
                  header: "Jane Smith wins prestigious award",
                  timestamp: 1712345678,
                  source: "Google",
                },
              ],
              createdAt: expect.any(String),
            },
            relevant_articles: [{ id: "1" }],
            irrelevant_articles: [{ id: "2" }, { id: "4" }],
            dismissed_articles: [{ id: "3" }],
          },
          is_draft: false,
          removed_at: expect.any(Date),
        },
        {
          profile_type_field_id: fields[3].id,
          content: {
            search: [{ term: "John Doe" }, { wikiDataId: "Q7747", label: "Vladimir Putin" }],
            articles: {
              totalCount: 4,
              items: [
                {
                  id: "1",
                  header: "John Doe is a good person",
                  timestamp: 1712345678,
                  source: "Google",
                },
                {
                  id: "2",
                  header: "Putin's speech",
                  timestamp: 1712345678,
                  source: "Google",
                },
                {
                  id: "3",
                  header: "Vladimir Putin in talks with Trump",
                  timestamp: 1712345678,
                  source: "Google",
                },
                {
                  id: "4",
                  header: "Jane Smith wins prestigious award",
                  timestamp: 1712345678,
                  source: "Google",
                },
              ],
              createdAt: expect.any(String),
            },
            relevant_articles: [{ id: "1" }],
            irrelevant_articles: [{ id: "2" }, { id: "4" }],
            dismissed_articles: [{ id: "3" }],
          },
          is_draft: false,
          removed_at: null,
        },
      ]);
    });

    it("removes draft when removing value", async () => {
      const [profile] = await repo.createProfiles(
        { org_id: organization.id, profile_type_id: profileType.id, status: "OPEN" },
        user.id,
      );

      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: profile.id,
          profile_type_field_id: fields[0].id,
          type: "SHORT_TEXT",
          content: { value: "Original Content" },
          is_draft: false,
          created_by_user_id: user.id,
        },
        {
          profile_id: profile.id,
          profile_type_field_id: fields[0].id,
          type: "SHORT_TEXT",
          content: { value: "my edited content" },
          is_draft: true,
          created_by_user_id: user.id,
        },
      ]);

      await repo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            profileTypeFieldId: fields[0].id,
            type: "SHORT_TEXT",
            content: null,
          },
        ],
        user.id,
        organization.id,
      );

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where("profile_id", profile.id)
        .select("*");

      expect(pfvs).toHaveLength(2);
      expect(pfvs.map(pick(["content", "is_draft", "removed_at"]))).toIncludeSameMembers([
        {
          content: { value: "Original Content" },
          is_draft: false,
          removed_at: expect.any(Date),
        },
        {
          content: { value: "my edited content" },
          is_draft: true,
          removed_at: expect.any(Date),
        },
      ]);
    });

    it("sets active_monitoring when creating BACKGROUND_CHECK and ADVERSE_MEDIA_SEARCH values", async () => {
      const [profile] = await repo.createProfiles(
        { org_id: organization.id, profile_type_id: profileType.id, status: "OPEN" },
        user.id,
      );

      await repo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            profileTypeFieldId: fields[0].id,
            type: "SHORT_TEXT",
            content: {
              value: "Original Content",
            },
          },
          {
            profileId: profile.id,
            profileTypeFieldId: fields[2].id,
            type: "BACKGROUND_CHECK",
            content: {
              query: {
                name: "John Doe",
                date: "2024-10-10",
                type: "PERSON",
                country: "FR",
              },
              search: {
                totalCount: 1,
                items: [
                  {
                    id: "123",
                    type: "PERSON",
                    name: "John Doe",
                    properties: {},
                  },
                ],
                createdAt: new Date(),
              },
              entity: {
                id: "123",
                type: "PERSON",
                name: "John Doe",
                properties: {},
              },
            },
          },
          {
            profileId: profile.id,
            profileTypeFieldId: fields[3].id,
            type: "ADVERSE_MEDIA_SEARCH",
            content: {
              search: [{ term: "John Doe" }],
              articles: {
                totalCount: 0,
                items: [],
                createdAt: new Date(),
              },
              relevant_articles: [],
              irrelevant_articles: [],
              dismissed_articles: [],
            },
          },
        ],
        user.id,
        organization.id,
      );

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where("profile_id", profile.id)
        .select("*");

      expect(pfvs).toHaveLength(3);
      expect(pfvs.map(pick(["type", "active_monitoring"]))).toIncludeSameMembers([
        {
          type: "SHORT_TEXT",
          active_monitoring: false,
        },
        {
          type: "BACKGROUND_CHECK",
          active_monitoring: true,
        },
        {
          type: "ADVERSE_MEDIA_SEARCH",
          active_monitoring: true,
        },
      ]);
    });

    it("maintains active_monitoring value when updating", async () => {
      const [profile] = await repo.createProfiles(
        { org_id: organization.id, profile_type_id: profileType.id, status: "OPEN" },
        user.id,
      );

      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: profile.id,
          profile_type_field_id: fields[0].id,
          type: "SHORT_TEXT",
          content: { value: "Original Content" },
          is_draft: false,
          created_by_user_id: user.id,
          active_monitoring: true,
        },
      ]);

      await repo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            profileTypeFieldId: fields[0].id,
            type: "SHORT_TEXT",
            content: { value: "my edited content" },
          },
        ],
        user.id,
        organization.id,
      );

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where("profile_id", profile.id)
        .select("*");

      expect(pfvs).toHaveLength(2);
      expect(pfvs.map(pick(["content", "removed_at", "active_monitoring"]))).toIncludeSameMembers([
        {
          content: { value: "Original Content" },
          removed_at: expect.any(Date),
          active_monitoring: true,
        },
        {
          content: { value: "my edited content" },
          removed_at: null,
          active_monitoring: true,
        },
      ]);
    });

    it("sets pending_review value when updating", async () => {
      const [profile] = await repo.createProfiles(
        { org_id: organization.id, profile_type_id: profileType.id, status: "OPEN" },
        user.id,
      );

      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: profile.id,
          profile_type_field_id: fields[0].id,
          type: "SHORT_TEXT",
          content: { value: "Original Content" },
          is_draft: false,
          created_by_user_id: user.id,
          active_monitoring: true,
        },
      ]);

      await repo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            profileTypeFieldId: fields[0].id,
            type: "SHORT_TEXT",
            content: { value: "my edited content" },
            pendingReview: true,
          },
        ],
        user.id,
        organization.id,
      );

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where("profile_id", profile.id)
        .select("*");

      expect(pfvs).toHaveLength(2);
      expect(pfvs.map(pick(["content", "removed_at", "pending_review"]))).toIncludeSameMembers([
        {
          content: { value: "Original Content" },
          removed_at: expect.any(Date),
          pending_review: false,
        },
        {
          content: { value: "my edited content" },
          removed_at: null,
          pending_review: true,
        },
      ]);
    });

    it("sets pending_review value when creating", async () => {
      const [profile] = await repo.createProfiles(
        { org_id: organization.id, profile_type_id: profileType.id, status: "OPEN" },
        user.id,
      );

      await repo.updateProfileFieldValues(
        [
          {
            profileId: profile.id,
            profileTypeFieldId: fields[0].id,
            type: "SHORT_TEXT",
            content: { value: "My Original Content" },
            pendingReview: true,
          },
        ],
        user.id,
        organization.id,
      );

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where("profile_id", profile.id)
        .select("*");

      expect(pfvs).toHaveLength(1);
      expect(pfvs.map(pick(["content", "removed_at", "pending_review"]))).toIncludeSameMembers([
        {
          content: { value: "My Original Content" },
          removed_at: null,
          pending_review: true,
        },
      ]);
    });
  });
});

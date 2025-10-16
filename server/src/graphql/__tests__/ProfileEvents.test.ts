import { gql } from "graphql-request";
import { Knex } from "knex";
import { pick } from "remeda";
import {
  Organization,
  Profile,
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldType,
  User,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("ProfileEvents", () => {
  let testClient: TestClient;

  let mocks: Mocks;
  let organization: Organization;
  let sessionUser: User;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user: sessionUser } = await mocks.createSessionUserAndOrganization());

    await knex
      .from("organization")
      .update({ default_timezone: "Europe/Madrid" })
      .where("id", organization.id);

    await mocks.createFeatureFlags([
      { name: "PROFILES", default_value: true },
      { name: "BACKGROUND_CHECK", default_value: true },
    ]);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("updateProfileFieldValue", () => {
    let profileType: ProfileType;
    let profileTypeFields: ProfileTypeField[];

    let profile: Profile;

    beforeAll(async () => {
      [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);

      profileTypeFields = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        4,
        (i) => ({
          type: ["SHORT_TEXT", "DATE", "DATE", "BACKGROUND_CHECK"][i] as ProfileTypeFieldType,
          options:
            i === 1
              ? { useReplyAsExpiryDate: true }
              : i === 2
                ? { useReplyAsExpiryDate: false }
                : {},
          is_expirable: i === 1 || i === 2,
        }),
      );
    });

    beforeEach(async () => {
      [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
    });

    it("should send PROFILE_FIELD_VALUE_UPDATED event when updating a simple DATE field with no previous value", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              events(limit: 10, offset: 0) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
              content: { value: "2020-10-10" },
            },
          ],
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.updateProfileFieldValue).toEqual({
        id: toGlobalId("Profile", profile.id),
        events: {
          totalCount: 2,
          items: [{ type: "PROFILE_UPDATED" }, { type: "PROFILE_FIELD_VALUE_UPDATED" }],
        },
      });

      const dbEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "desc")
        .select("*");

      expect(dbEvents.map(pick(["type", "data"]))).toEqual([
        {
          type: "PROFILE_UPDATED",
          data: { user_id: sessionUser.id, org_integration_id: null },
        },
        {
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: sessionUser.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeFields[2].id,
            current_profile_field_value_id: expect.any(Number),
            previous_profile_field_value_id: null,
            alias: null,
          },
        },
      ]);
    });

    it("should send PROFILE_FIELD_VALUE_UPDATED event when updating contents of a simple DATE field", async () => {
      // first update
      await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
              content: { value: "2020-10-10" },
            },
          ],
        },
      );

      // second update
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              events(limit: 10, offset: 0) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
              content: { value: "2024-10-10" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileFieldValue).toEqual({
        id: toGlobalId("Profile", profile.id),
        events: {
          totalCount: 4,
          items: [
            { type: "PROFILE_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
            { type: "PROFILE_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
          ],
        },
      });

      const dbEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "desc")
        .select("*");

      expect(dbEvents.map(pick(["type", "data"]))).toEqual([
        {
          type: "PROFILE_UPDATED",
          data: { user_id: sessionUser.id, org_integration_id: null },
        },
        {
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: sessionUser.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeFields[2].id,
            current_profile_field_value_id: expect.any(Number),
            previous_profile_field_value_id: dbEvents[3].data.current_profile_field_value_id,
            alias: null,
          },
        },
        {
          type: "PROFILE_UPDATED",
          data: { user_id: sessionUser.id, org_integration_id: null },
        },
        {
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: sessionUser.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeFields[2].id,
            current_profile_field_value_id: expect.any(Number),
            previous_profile_field_value_id: null,
            alias: null,
          },
        },
      ]);
    });

    it("should send PROFILE_FIELD_EXPIRY_UPDATED event when only updating expiryDate on an expirable DATE field with useReplyAsExpiryDate=false", async () => {
      // first create the value
      await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
              content: { value: "2020-10-10" },
            },
          ],
        },
      );

      // second update, updating expiry date, passing same content as before
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              events(limit: 10, offset: 0) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
              content: { value: "2020-10-10" },
              expiryDate: "2026-10-10",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileFieldValue).toEqual({
        id: toGlobalId("Profile", profile.id),
        events: {
          totalCount: 4,
          items: [
            // ---- second query ----
            { type: "PROFILE_UPDATED" },
            { type: "PROFILE_FIELD_EXPIRY_UPDATED" },
            // ---- first query ----
            { type: "PROFILE_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
          ],
        },
      });

      const dbEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "desc")
        .select("*");

      expect(dbEvents.map(pick(["type", "data"]))).toEqual([
        {
          type: "PROFILE_UPDATED",
          data: { user_id: sessionUser.id, org_integration_id: null },
        },
        {
          type: "PROFILE_FIELD_EXPIRY_UPDATED",
          data: {
            user_id: sessionUser.id,
            org_integration_id: null,
            profile_type_field_id: profileTypeFields[2].id,
            expiry_date: "2026-10-10",
            alias: null,
          },
        },
        {
          type: "PROFILE_UPDATED",
          data: { user_id: sessionUser.id, org_integration_id: null },
        },
        {
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: sessionUser.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeFields[2].id,
            current_profile_field_value_id: expect.any(Number),
            previous_profile_field_value_id: null,
            alias: null,
          },
        },
      ]);
    });

    it("should send PROFILE_FIELD_VALUE_UPDATED and PROFILE_FIELD_EXPIRY_UPDATED events when updating content and expiryDate on an expirable DATE field with useReplyAsExpiryDate=false", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              events(limit: 10, offset: 0) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
              content: { value: "2020-10-10" },
              expiryDate: "2026-10-10",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileFieldValue).toEqual({
        id: toGlobalId("Profile", profile.id),
        events: {
          totalCount: 3,
          items: [
            { type: "PROFILE_UPDATED" },
            { type: "PROFILE_FIELD_EXPIRY_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
          ],
        },
      });

      const dbEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "desc")
        .select("*");

      expect(dbEvents.map(pick(["type", "data"]))).toEqual([
        {
          type: "PROFILE_UPDATED",
          data: { user_id: sessionUser.id, org_integration_id: null },
        },
        {
          type: "PROFILE_FIELD_EXPIRY_UPDATED",
          data: {
            user_id: sessionUser.id,
            org_integration_id: null,
            profile_type_field_id: profileTypeFields[2].id,
            expiry_date: "2026-10-10",
            alias: null,
          },
        },
        {
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: sessionUser.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeFields[2].id,
            current_profile_field_value_id: expect.any(Number),
            previous_profile_field_value_id: null,
            alias: null,
          },
        },
      ]);
    });

    it("should send PROFILE_FIELD_VALUE_UPDATED and PROFILE_FIELD_EXPIRY_UPDATED when updating value on an expirable DATE field with useReplyAsExpiryDate=true", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              events(limit: 10, offset: 0) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
              content: { value: "2026-10-10" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileFieldValue).toEqual({
        id: toGlobalId("Profile", profile.id),
        events: {
          totalCount: 3,
          items: [
            { type: "PROFILE_UPDATED" },
            { type: "PROFILE_FIELD_EXPIRY_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
          ],
        },
      });

      const dbEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "desc")
        .select("*");

      expect(dbEvents.map(pick(["type", "data"]))).toEqual([
        {
          type: "PROFILE_UPDATED",
          data: { user_id: sessionUser.id, org_integration_id: null },
        },
        {
          type: "PROFILE_FIELD_EXPIRY_UPDATED",
          data: {
            user_id: sessionUser.id,
            org_integration_id: null,
            profile_type_field_id: profileTypeFields[1].id,
            expiry_date: "2026-10-10",
            alias: null,
          },
        },
        {
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: sessionUser.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeFields[1].id,
            current_profile_field_value_id: expect.any(Number),
            previous_profile_field_value_id: null,
            alias: null,
          },
        },
      ]);
    });

    it("should not send any event when updating a field with exactly same content", async () => {
      // first update
      await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              events(limit: 10, offset: 0) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
              content: { value: "Mike Ross" },
            },
          ],
        },
      );

      // second update with same contents
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              events(limit: 10, offset: 0) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
              content: { value: "Mike Ross" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileFieldValue).toEqual({
        id: toGlobalId("Profile", profile.id),
        events: {
          totalCount: 2,
          items: [{ type: "PROFILE_UPDATED" }, { type: "PROFILE_FIELD_VALUE_UPDATED" }],
        },
      });

      const dbEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "desc")
        .select("*");

      expect(dbEvents.map(pick(["type", "data"]))).toEqual([
        {
          type: "PROFILE_UPDATED",
          data: { user_id: sessionUser.id, org_integration_id: null },
        },
        {
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: sessionUser.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeFields[0].id,
            current_profile_field_value_id: expect.any(Number),
            previous_profile_field_value_id: null,
            alias: null,
          },
        },
      ]);
    });

    it("should send PROFILE_FIELD_VALUE_UPDATED when removing a value from a simple field", async () => {
      // first create the value
      await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              events(limit: 10, offset: 0) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
              content: { value: "Mike Ross" },
            },
          ],
        },
      );

      // second update, removing the value
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              events(limit: 10, offset: 0) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
              content: null,
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileFieldValue).toEqual({
        id: toGlobalId("Profile", profile.id),
        events: {
          totalCount: 4,
          items: [
            { type: "PROFILE_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
            { type: "PROFILE_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
          ],
        },
      });

      const dbEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "desc")
        .select("*");

      expect(dbEvents.map(pick(["type", "data"]))).toEqual([
        {
          type: "PROFILE_UPDATED",
          data: { user_id: sessionUser.id, org_integration_id: null },
        },
        {
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: sessionUser.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeFields[0].id,
            current_profile_field_value_id: null,
            previous_profile_field_value_id: dbEvents[3].data.current_profile_field_value_id,
            alias: null,
          },
        },
        {
          type: "PROFILE_UPDATED",
          data: { user_id: sessionUser.id, org_integration_id: null },
        },
        {
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: sessionUser.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeFields[0].id,
            current_profile_field_value_id: expect.any(Number),
            previous_profile_field_value_id: null,
            alias: null,
          },
        },
      ]);
    });

    it("should send PROFILE_FIELD_VALUE_UPDATED when removing a value from a BACKGROUND_CHECK field", async () => {
      // first create and save the value
      const { errors: searchErrors } = await testClient.execute(
        gql`
          query ($token: String!) {
            backgroundCheckEntitySearch(
              token: $token
              name: "John Doe"
              country: "ES"
              type: PERSON
            ) {
              __typename
            }
          }
        `,
        {
          token: btoa(
            JSON.stringify({
              profileId: toGlobalId("Profile", profile.id),
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            }),
          ),
        },
      );

      expect(searchErrors).toBeUndefined();

      // save the draft
      await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!) {
            saveProfileFieldValueDraft(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
            )
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
        },
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
            updateProfileFieldValue(profileId: $profileId, fields: $fields) {
              id
              events(limit: 10, offset: 0) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          fields: [
            {
              profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
              content: null,
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileFieldValue).toEqual({
        id: toGlobalId("Profile", profile.id),
        events: {
          totalCount: 4,
          items: [
            { type: "PROFILE_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
            { type: "PROFILE_UPDATED" },
            { type: "PROFILE_FIELD_VALUE_UPDATED" },
          ],
        },
      });

      const dbEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("id", "desc")
        .select("*");

      expect(dbEvents.map(pick(["type", "data"]))).toEqual([
        {
          type: "PROFILE_UPDATED",
          data: {
            user_id: sessionUser.id,
            org_integration_id: null,
          },
        },
        {
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: sessionUser.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeFields[3].id,
            current_profile_field_value_id: null,
            previous_profile_field_value_id: dbEvents[3].data.current_profile_field_value_id,
            alias: null,
          },
        },
        {
          type: "PROFILE_UPDATED",
          data: { user_id: sessionUser.id, org_integration_id: null },
        },
        {
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: sessionUser.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeFields[3].id,
            current_profile_field_value_id: expect.any(Number),
            previous_profile_field_value_id: null,
            alias: null,
          },
        },
      ]);
    });
  });
});

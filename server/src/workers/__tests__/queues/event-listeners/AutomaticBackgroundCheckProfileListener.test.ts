import { gql } from "graphql-request";
import { Knex } from "knex";
import {
  Organization,
  Profile,
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldType,
  User,
} from "../../../../db/__types";
import { ProfileUpdatedEvent } from "../../../../db/events/ProfileEvent";
import { KNEX } from "../../../../db/knex";
import { Mocks } from "../../../../db/repositories/__tests__/mocks";
import { initServer, TestClient } from "../../../../graphql/__tests__/server";
import { IQueuesService, QUEUES_SERVICE } from "../../../../services/QueuesService";
import { toGlobalId } from "../../../../util/globalId";
import { BackgroundCheckProfileSearchQueue } from "../../../queues/BackgroundCheckProfileSearchQueue";
import {
  AUTOMATIC_BACKGROUND_CHECK_PROFILE_LISTENER,
  AutomaticBackgroundCheckProfileListener,
} from "../../../queues/event-listeners/AutomaticBackgroundCheckProfileListener";

describe("Worker - Automatic Background Check Profile Listener", () => {
  let knex: Knex;
  let mocks: Mocks;

  let testClient: TestClient;
  let organization: Organization;
  let user: User;

  let queueSpy: jest.SpyInstance<
    ReturnType<IQueuesService["enqueueMessages"]>,
    Parameters<IQueuesService["enqueueMessages"]>
  >;

  let backgroundCheckProfileQueue: BackgroundCheckProfileSearchQueue;

  let profileType: ProfileType;
  let profileTypeFields: ProfileTypeField[];
  let backgroundCheckField: ProfileTypeField;

  let profile: Profile;

  async function handleListenerEvent(event: ProfileUpdatedEvent) {
    return await testClient.container
      .get<AutomaticBackgroundCheckProfileListener>(AUTOMATIC_BACKGROUND_CHECK_PROFILE_LISTENER)
      .handle(event);
  }

  beforeAll(async () => {
    testClient = await initServer();

    knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    await mocks.createFeatureFlags([
      { name: "PROFILES", default_value: true },
      { name: "BACKGROUND_CHECK", default_value: true },
    ]);

    [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);

    profileTypeFields = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileType.id,
      5,
      (i) => ({
        type: ["SHORT_TEXT", "SHORT_TEXT", "DATE", "SELECT", "SHORT_TEXT"][
          i
        ] as ProfileTypeFieldType,
        options: i === 3 ? { standardList: "COUNTRIES" } : {},
      }),
    );

    [backgroundCheckField] = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileType.id,
      1,
      () => ({
        type: "BACKGROUND_CHECK",
        options: {
          autoSearchConfig: {
            name: [profileTypeFields[0].id, profileTypeFields[1].id],
            date: null,
            country: profileTypeFields[3].id,
            birthCountry: profileTypeFields[3].id,
            type: "PERSON",
            activationCondition: {
              profileTypeFieldId: profileTypeFields[3].id,
              values: ["AR", "ES"],
            },
          },
        },
      }),
    );

    backgroundCheckProfileQueue = testClient.container.get(BackgroundCheckProfileSearchQueue);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  beforeEach(async () => {
    queueSpy = jest.spyOn(
      testClient.container.get<IQueuesService>(QUEUES_SERVICE),
      "enqueueMessages",
    );

    [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
  });

  afterEach(async () => {
    queueSpy.mockClear();

    await mocks.knex
      .from("profile_type_field")
      .where("id", backgroundCheckField.id)
      .update({
        options: JSON.stringify({
          autoSearchConfig: {
            name: [profileTypeFields[0].id, profileTypeFields[1].id],
            date: null,
            country: profileTypeFields[3].id,
            birthCountry: profileTypeFields[3].id,
            type: "PERSON",
            activationCondition: {
              profileTypeFieldId: profileTypeFields[3].id,
              values: ["AR", "ES"],
            },
          },
        }),
      });
  });

  it("triggers background check search if field is automated and not replied when updating the profile", async () => {
    const { errors, data } = await testClient.execute(
      gql`
        mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
          updateProfileFieldValue(profileId: $profileId, fields: $fields) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
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
            content: { value: "John" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            content: { value: "Doe" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            content: { value: "1990-01-01" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            content: { value: "AR" },
          },
        ],
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.updateProfileFieldValue).toEqual({
      id: toGlobalId("Profile", profile.id),
      properties: [
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "John" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Doe" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            type: "DATE",
          },
          value: {
            id: expect.any(String),
            content: { value: "1990-01-01" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            type: "SELECT",
          },
          value: {
            id: expect.any(String),
            content: { value: "AR" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            type: "SHORT_TEXT",
          },
          value: null,
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            type: "BACKGROUND_CHECK",
          },
          value: null,
        },
      ],
      events: {
        totalCount: 5,
        items: [
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
        ],
      },
    });

    const events = await knex.from("profile_event").where("profile_id", profile.id).select("*");
    const profileUpdatedEvent = events.find((e) => e.type === "PROFILE_UPDATED");
    expect(profileUpdatedEvent).toBeDefined();

    await handleListenerEvent(profileUpdatedEvent as ProfileUpdatedEvent);

    expect(queueSpy).toHaveBeenCalledExactlyOnceWith("background-check-profile-search", {
      body: {
        orgId: organization.id,
        profileId: profile.id,
        profileTypeFieldId: backgroundCheckField.id,
        query: { name: "John Doe", date: null, country: "AR", type: "PERSON", birthCountry: "AR" },
      },
    });

    await backgroundCheckProfileQueue.handler({
      orgId: organization.id,
      profileId: profile.id,
      profileTypeFieldId: backgroundCheckField.id,
      query: { name: "John Doe", date: null, country: "AR", type: "PERSON", birthCountry: "AR" },
    });

    const { errors: queryErrors, data: queryData } = await testClient.execute(
      gql`
        query ($profileId: GID!) {
          profile(profileId: $profileId) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
              totalCount
              items {
                type
              }
            }
          }
        }
      `,
      { profileId: toGlobalId("Profile", profile.id) },
    );

    expect(queryErrors).toBeUndefined();
    expect(queryData?.profile).toEqual({
      id: toGlobalId("Profile", profile.id),
      properties: [
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "John" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Doe" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            type: "DATE",
          },
          value: {
            id: expect.any(String),
            content: { value: "1990-01-01" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            type: "SELECT",
          },
          value: {
            id: expect.any(String),
            content: { value: "AR" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            type: "SHORT_TEXT",
          },
          value: null,
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            type: "BACKGROUND_CHECK",
          },
          value: {
            id: expect.any(String),
            content: {
              query: {
                name: "John Doe",
                date: null,
                country: "AR",
                type: "PERSON",
                birthCountry: "AR",
              },
              search: {
                totalCount: 1,
                falsePositivesCount: 0,
                createdAt: expect.any(String),
              },
              entity: null,
            },
          },
        },
      ],
      events: {
        totalCount: 7,
        items: [
          // ----- background check update -----
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          // -----------------------------------
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
        ],
      },
    });
  });

  it("triggers background check search if field does not have activation condition", async () => {
    await mocks.knex
      .from("profile_type_field")
      .where("id", backgroundCheckField.id)
      .update({
        options: JSON.stringify({
          autoSearchConfig: {
            name: [profileTypeFields[0].id, profileTypeFields[1].id],
            date: profileTypeFields[2].id,
            country: profileTypeFields[3].id,
            birthCountry: profileTypeFields[3].id,
            type: "PERSON",
            activationCondition: null,
          },
        }),
      });

    const { errors, data } = await testClient.execute(
      gql`
        mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
          updateProfileFieldValue(profileId: $profileId, fields: $fields) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
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
            content: { value: "John" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            content: { value: "Doe" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            content: { value: "1990-01-01" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            content: { value: "UY" },
          },
        ],
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.updateProfileFieldValue).toEqual({
      id: toGlobalId("Profile", profile.id),
      properties: [
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "John" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Doe" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            type: "DATE",
          },
          value: {
            id: expect.any(String),
            content: { value: "1990-01-01" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            type: "SELECT",
          },
          value: {
            id: expect.any(String),
            content: { value: "UY" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            type: "SHORT_TEXT",
          },
          value: null,
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            type: "BACKGROUND_CHECK",
          },
          value: null,
        },
      ],
      events: {
        totalCount: 5,
        items: [
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
        ],
      },
    });

    const events = await knex.from("profile_event").where("profile_id", profile.id).select("*");

    const profileUpdatedEvent = events.find((e) => e.type === "PROFILE_UPDATED");

    expect(profileUpdatedEvent).toBeDefined();

    await handleListenerEvent(profileUpdatedEvent as ProfileUpdatedEvent);

    expect(queueSpy).toHaveBeenCalledExactlyOnceWith("background-check-profile-search", {
      body: {
        orgId: organization.id,
        profileId: profile.id,
        profileTypeFieldId: backgroundCheckField.id,
        query: {
          name: "John Doe",
          date: "1990-01-01",
          country: "UY",
          type: "PERSON",
          birthCountry: "UY",
        },
      },
    });

    await backgroundCheckProfileQueue.handler({
      orgId: organization.id,
      profileId: profile.id,
      profileTypeFieldId: backgroundCheckField.id,
      query: {
        name: "John Doe",
        date: "1990-01-01",
        country: "UY",
        type: "PERSON",
        birthCountry: "UY",
      },
    });

    const { errors: queryErrors, data: queryData } = await testClient.execute(
      gql`
        query ($profileId: GID!) {
          profile(profileId: $profileId) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
              totalCount
              items {
                type
              }
            }
          }
        }
      `,
      { profileId: toGlobalId("Profile", profile.id) },
    );

    expect(queryErrors).toBeUndefined();
    expect(queryData?.profile).toEqual({
      id: toGlobalId("Profile", profile.id),
      properties: [
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "John" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Doe" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            type: "DATE",
          },
          value: {
            id: expect.any(String),
            content: { value: "1990-01-01" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            type: "SELECT",
          },
          value: {
            id: expect.any(String),
            content: { value: "UY" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            type: "SHORT_TEXT",
          },
          value: null,
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            type: "BACKGROUND_CHECK",
          },
          value: {
            id: expect.any(String),
            content: {
              query: {
                name: "John Doe",
                date: "1990-01-01",
                country: "UY",
                birthCountry: "UY",
                type: "PERSON",
              },
              search: {
                totalCount: 1,
                falsePositivesCount: 0,
                createdAt: expect.any(String),
              },
              entity: null,
            },
          },
        },
      ],
      events: {
        totalCount: 7,
        items: [
          // ----- background check update -----
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          // -----------------------------------
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
        ],
      },
    });
  });

  it("does not trigger background check search if any of its configured fields are not replied", async () => {
    const { errors, data } = await testClient.execute(
      gql`
        mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
          updateProfileFieldValue(profileId: $profileId, fields: $fields) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
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
            content: { value: "John" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            content: { value: "1990-01-01" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            content: { value: "AR" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            content: { value: "Engineer" },
          },
        ],
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.updateProfileFieldValue).toEqual({
      id: toGlobalId("Profile", profile.id),
      properties: [
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "John" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            type: "SHORT_TEXT",
          },
          value: null,
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            type: "DATE",
          },
          value: {
            id: expect.any(String),
            content: { value: "1990-01-01" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            type: "SELECT",
          },
          value: {
            id: expect.any(String),
            content: { value: "AR" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Engineer" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            type: "BACKGROUND_CHECK",
          },
          value: null,
        },
      ],
      events: {
        totalCount: 5,
        items: [
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
        ],
      },
    });

    const events = await knex.from("profile_event").where("profile_id", profile.id).select("*");

    const profileUpdatedEvent = events.find((e) => e.type === "PROFILE_UPDATED");

    expect(profileUpdatedEvent).toBeDefined();

    await handleListenerEvent(profileUpdatedEvent as ProfileUpdatedEvent);

    expect(queueSpy).not.toHaveBeenCalled();
  });

  it("does not trigger background check search if activation condition is not met", async () => {
    const { errors, data } = await testClient.execute(
      gql`
        mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
          updateProfileFieldValue(profileId: $profileId, fields: $fields) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
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
            content: { value: "John" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            content: { value: "Doe" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            content: { value: "1990-01-01" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            content: { value: "FR" },
          },
        ],
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.updateProfileFieldValue).toEqual({
      id: toGlobalId("Profile", profile.id),
      properties: [
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "John" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Doe" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            type: "DATE",
          },
          value: {
            id: expect.any(String),
            content: { value: "1990-01-01" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            type: "SELECT",
          },
          value: {
            id: expect.any(String),
            content: { value: "FR" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            type: "SHORT_TEXT",
          },
          value: null,
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            type: "BACKGROUND_CHECK",
          },
          value: null,
        },
      ],
      events: {
        totalCount: 5,
        items: [
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
        ],
      },
    });

    const events = await knex.from("profile_event").where("profile_id", profile.id).select("*");

    const profileUpdatedEvent = events.find((e) => e.type === "PROFILE_UPDATED");

    expect(profileUpdatedEvent).toBeDefined();

    await handleListenerEvent(profileUpdatedEvent as ProfileUpdatedEvent);

    expect(queueSpy).not.toHaveBeenCalled();
  });

  it("triggers background check search if field is already replied but does not have a match", async () => {
    await mocks.knex.from("profile_field_value").insert({
      profile_id: profile.id,
      profile_type_field_id: backgroundCheckField.id,
      type: "BACKGROUND_CHECK",
      content: {
        query: {
          name: "Mike Ross",
          date: "1992-01-01",
          country: "US",
          birthCountry: "US",
          type: "PERSON",
        },
        search: {
          totalCount: 1,
          items: [],
          createdAt: new Date(),
        },
        entity: null,
      },
      created_by_user_id: user.id,
    });

    const { errors, data } = await testClient.execute(
      gql`
        mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
          updateProfileFieldValue(profileId: $profileId, fields: $fields) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
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
            content: { value: "John" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            content: { value: "Doe" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            content: { value: "1990-01-01" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            content: { value: "AR" },
          },
        ],
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.updateProfileFieldValue).toEqual({
      id: toGlobalId("Profile", profile.id),
      properties: [
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "John" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Doe" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            type: "DATE",
          },
          value: {
            id: expect.any(String),
            content: { value: "1990-01-01" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            type: "SELECT",
          },
          value: {
            id: expect.any(String),
            content: { value: "AR" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            type: "SHORT_TEXT",
          },
          value: null,
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            type: "BACKGROUND_CHECK",
          },
          value: {
            id: expect.any(String),
            content: {
              query: {
                name: "Mike Ross",
                date: "1992-01-01",
                country: "US",
                birthCountry: "US",
                type: "PERSON",
              },
              search: {
                totalCount: 1,
                falsePositivesCount: 0,
                createdAt: expect.any(String),
              },
              entity: null,
            },
          },
        },
      ],
      events: {
        totalCount: 5,
        items: [
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
        ],
      },
    });

    const events = await knex.from("profile_event").where("profile_id", profile.id).select("*");

    const profileUpdatedEvent = events.find((e) => e.type === "PROFILE_UPDATED");

    expect(profileUpdatedEvent).toBeDefined();

    await handleListenerEvent(profileUpdatedEvent as ProfileUpdatedEvent);

    expect(queueSpy).toHaveBeenCalledExactlyOnceWith("background-check-profile-search", {
      body: {
        orgId: organization.id,
        profileId: profile.id,
        profileTypeFieldId: backgroundCheckField.id,
        query: { name: "John Doe", date: null, country: "AR", type: "PERSON", birthCountry: "AR" },
      },
    });

    await backgroundCheckProfileQueue.handler({
      orgId: organization.id,
      profileId: profile.id,
      profileTypeFieldId: backgroundCheckField.id,
      query: { name: "John Doe", date: null, country: "AR", type: "PERSON", birthCountry: "AR" },
    });

    const { errors: queryErrors, data: queryData } = await testClient.execute(
      gql`
        query ($profileId: GID!) {
          profile(profileId: $profileId) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
              totalCount
              items {
                type
              }
            }
          }
        }
      `,
      { profileId: toGlobalId("Profile", profile.id) },
    );

    expect(queryErrors).toBeUndefined();
    expect(queryData?.profile).toEqual({
      id: toGlobalId("Profile", profile.id),
      properties: [
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "John" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Doe" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            type: "DATE",
          },
          value: {
            id: expect.any(String),
            content: { value: "1990-01-01" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            type: "SELECT",
          },
          value: {
            id: expect.any(String),
            content: { value: "AR" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            type: "SHORT_TEXT",
          },
          value: null,
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            type: "BACKGROUND_CHECK",
          },
          value: {
            id: expect.any(String),
            content: {
              query: {
                name: "John Doe",
                date: null,
                country: "AR",
                birthCountry: "AR",
                type: "PERSON",
              },
              search: {
                totalCount: 1,
                falsePositivesCount: 0,
                createdAt: expect.any(String),
              },
              entity: null,
            },
          },
        },
      ],
      events: {
        totalCount: 7,
        items: [
          // ----- background check update -----
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          // -----------------------------------
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
        ],
      },
    });
  });

  it("does not trigger background check search if field is already replied and has a match", async () => {
    await mocks.knex.from("profile_field_value").insert({
      profile_id: profile.id,
      profile_type_field_id: backgroundCheckField.id,
      type: "BACKGROUND_CHECK",
      content: {
        query: {
          name: "Mike Ross",
          date: "1992-01-01",
          country: "US",
          birthCountry: "US",
          type: "PERSON",
        },
        search: {
          totalCount: 1,
          items: [],
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
    });

    const { errors, data } = await testClient.execute(
      gql`
        mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
          updateProfileFieldValue(profileId: $profileId, fields: $fields) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
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
            content: { value: "John" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            content: { value: "Doe" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            content: { value: "1990-01-01" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            content: { value: "AR" },
          },
        ],
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.updateProfileFieldValue).toEqual({
      id: toGlobalId("Profile", profile.id),
      properties: [
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "John" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Doe" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            type: "DATE",
          },
          value: {
            id: expect.any(String),
            content: { value: "1990-01-01" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            type: "SELECT",
          },
          value: {
            id: expect.any(String),
            content: { value: "AR" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            type: "SHORT_TEXT",
          },
          value: null,
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            type: "BACKGROUND_CHECK",
          },
          value: {
            id: expect.any(String),
            content: {
              query: {
                name: "Mike Ross",
                date: "1992-01-01",
                country: "US",
                birthCountry: "US",
                type: "PERSON",
              },
              search: {
                totalCount: 1,
                falsePositivesCount: 0,
                createdAt: expect.any(String),
              },
              entity: {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
            },
          },
        },
      ],
      events: {
        totalCount: 5,
        items: [
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
        ],
      },
    });

    const events = await knex.from("profile_event").where("profile_id", profile.id).select("*");

    const profileUpdatedEvent = events.find((e) => e.type === "PROFILE_UPDATED");

    expect(profileUpdatedEvent).toBeDefined();

    await handleListenerEvent(profileUpdatedEvent as ProfileUpdatedEvent);

    expect(queueSpy).not.toHaveBeenCalled();
  });

  it("does not update background check search if profile is updated with new values", async () => {
    const { errors, data } = await testClient.execute(
      gql`
        mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
          updateProfileFieldValue(profileId: $profileId, fields: $fields) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
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
            content: { value: "John" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            content: { value: "Doe" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            content: { value: "1990-01-01" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            content: { value: "AR" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            content: { value: "Engineer" },
          },
        ],
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.updateProfileFieldValue).toEqual({
      id: toGlobalId("Profile", profile.id),
      properties: [
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "John" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Doe" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            type: "DATE",
          },
          value: {
            id: expect.any(String),
            content: { value: "1990-01-01" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            type: "SELECT",
          },
          value: {
            id: expect.any(String),
            content: { value: "AR" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Engineer" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            type: "BACKGROUND_CHECK",
          },
          value: null,
        },
      ],
      events: {
        totalCount: 6,
        items: [
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
        ],
      },
    });

    const events = await knex.from("profile_event").where("profile_id", profile.id).select("*");

    const profileUpdatedEvent = events.find((e) => e.type === "PROFILE_UPDATED");

    expect(profileUpdatedEvent).toBeDefined();

    await handleListenerEvent(profileUpdatedEvent as ProfileUpdatedEvent);

    expect(queueSpy).toHaveBeenCalledExactlyOnceWith("background-check-profile-search", {
      body: {
        orgId: organization.id,
        profileId: profile.id,
        profileTypeFieldId: backgroundCheckField.id,
        query: { name: "John Doe", date: null, country: "AR", type: "PERSON", birthCountry: "AR" },
      },
    });

    await backgroundCheckProfileQueue.handler({
      orgId: organization.id,
      profileId: profile.id,
      profileTypeFieldId: backgroundCheckField.id,
      query: { name: "John Doe", date: null, country: "AR", type: "PERSON", birthCountry: "AR" },
    });

    const { errors: updateErrors, data: updateData } = await testClient.execute(
      gql`
        mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
          updateProfileFieldValue(profileId: $profileId, fields: $fields) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
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
            content: { value: "Mike" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            content: { value: "Ross" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            content: { value: "1992-01-01" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            content: { value: "US" },
          },
        ],
      },
    );

    expect(updateErrors).toBeUndefined();
    expect(updateData?.updateProfileFieldValue).toEqual({
      id: toGlobalId("Profile", profile.id),
      properties: [
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Mike" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Ross" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            type: "DATE",
          },
          value: {
            id: expect.any(String),
            content: { value: "1992-01-01" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            type: "SELECT",
          },
          value: {
            id: expect.any(String),
            content: { value: "US" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Engineer" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            type: "BACKGROUND_CHECK",
          },
          value: {
            id: expect.any(String),
            content: {
              query: {
                name: "John Doe",
                date: null,
                country: "AR",
                birthCountry: "AR",
                type: "PERSON",
              },
              search: {
                totalCount: 1,
                falsePositivesCount: 0,
                createdAt: expect.any(String),
              },
              entity: null,
            },
          },
        },
      ],
      events: {
        totalCount: 13,
        items: [
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          // ----- background check update -----
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          // -----------------------------------
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
        ],
      },
    });

    await handleListenerEvent(profileUpdatedEvent as ProfileUpdatedEvent);

    expect(queueSpy).toHaveBeenCalledTimes(1);
  });

  it("does not trigger background check search if its current background_check value is removed", async () => {
    await testClient.execute(
      gql`
        mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
          updateProfileFieldValue(profileId: $profileId, fields: $fields) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
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
            content: { value: "John" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            content: { value: "Doe" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            content: { value: "1990-01-01" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            content: { value: "AR" },
          },
        ],
      },
    );

    const events = await knex.from("profile_event").where("profile_id", profile.id).select("*");

    const profileUpdatedEvent = events.find((e) => e.type === "PROFILE_UPDATED");

    expect(profileUpdatedEvent).toBeDefined();

    // run first search
    await handleListenerEvent(profileUpdatedEvent as ProfileUpdatedEvent);

    expect(queueSpy).toHaveBeenCalledExactlyOnceWith("background-check-profile-search", {
      body: {
        orgId: organization.id,
        profileId: profile.id,
        profileTypeFieldId: backgroundCheckField.id,
        query: { name: "John Doe", date: null, country: "AR", type: "PERSON", birthCountry: "AR" },
      },
    });

    await backgroundCheckProfileQueue.handler({
      orgId: organization.id,
      profileId: profile.id,
      profileTypeFieldId: backgroundCheckField.id,
      query: { name: "John Doe", date: null, country: "AR", type: "PERSON", birthCountry: "AR" },
    });

    const { errors: removeErrors, data: removeData } = await testClient.execute(
      gql`
        mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
          updateProfileFieldValue(profileId: $profileId, fields: $fields) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
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
            profileTypeFieldId: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            content: null,
          },
        ],
      },
    );

    expect(removeErrors).toBeUndefined();
    expect(removeData?.updateProfileFieldValue).toEqual({
      id: toGlobalId("Profile", profile.id),
      properties: [
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "John" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Doe" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            type: "DATE",
          },
          value: {
            id: expect.any(String),
            content: { value: "1990-01-01" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            type: "SELECT",
          },
          value: {
            id: expect.any(String),
            content: { value: "AR" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            type: "SHORT_TEXT",
          },
          value: null,
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            type: "BACKGROUND_CHECK",
          },
          value: null,
        },
      ],
      events: {
        totalCount: 9,
        items: [
          // ----- background check removal -----
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          // -----------------------------------
          // ----- background check search -----
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          // -----------------------------------
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
        ],
      },
    });

    const latestProfileUpdatedEvent = await mocks.knex
      .from("profile_event")
      .where("profile_id", profile.id)
      .where("type", "PROFILE_UPDATED")
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .first();

    //this should not trigger a new search
    await handleListenerEvent(latestProfileUpdatedEvent as ProfileUpdatedEvent);
    expect(queueSpy).toHaveBeenCalledTimes(1);
  });

  it("triggers background check search if its current background_check value is removed but any of its other fields are updated", async () => {
    await mocks.knex.from("profile_field_value").insert({
      profile_id: profile.id,
      profile_type_field_id: backgroundCheckField.id,
      type: "BACKGROUND_CHECK",
      content: {
        query: {
          name: "Mike Ross",
          date: "1992-01-01",
          country: "US",
          birthCountry: "US",
          type: "PERSON",
        },
        search: {
          totalCount: 1,
          items: [],
          createdAt: new Date(),
        },
        entity: null,
      },
      created_by_user_id: user.id,
    });

    const { errors, data } = await testClient.execute(
      gql`
        mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
          updateProfileFieldValue(profileId: $profileId, fields: $fields) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
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
            profileTypeFieldId: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            content: null,
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
            content: { value: "Harvey" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            content: { value: "Doe" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            content: { value: "1990-01-01" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            content: { value: "AR" },
          },
        ],
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.updateProfileFieldValue).toEqual({
      id: toGlobalId("Profile", profile.id),
      properties: [
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Harvey" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Doe" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            type: "DATE",
          },
          value: {
            id: expect.any(String),
            content: { value: "1990-01-01" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            type: "SELECT",
          },
          value: {
            id: expect.any(String),
            content: { value: "AR" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            type: "SHORT_TEXT",
          },
          value: null,
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            type: "BACKGROUND_CHECK",
          },
          value: null,
        },
      ],
      events: {
        totalCount: 6,
        items: [
          { type: "PROFILE_UPDATED" },
          // ----- background check removal -----
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          // -----------------------------------
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
        ],
      },
    });

    const events = await knex.from("profile_event").where("profile_id", profile.id).select("*");

    const profileUpdatedEvent = events.find((e) => e.type === "PROFILE_UPDATED");

    expect(profileUpdatedEvent).toBeDefined();

    await handleListenerEvent(profileUpdatedEvent as ProfileUpdatedEvent);

    expect(queueSpy).toHaveBeenCalledExactlyOnceWith("background-check-profile-search", {
      body: {
        orgId: organization.id,
        profileId: profile.id,
        profileTypeFieldId: backgroundCheckField.id,
        query: {
          name: "Harvey Doe",
          date: null,
          country: "AR",
          type: "PERSON",
          birthCountry: "AR",
        },
      },
    });

    await backgroundCheckProfileQueue.handler({
      orgId: organization.id,
      profileId: profile.id,
      profileTypeFieldId: backgroundCheckField.id,
      query: { name: "Harvey Doe", date: null, country: "AR", type: "PERSON", birthCountry: "AR" },
    });

    const { errors: queryErrors, data: queryData } = await testClient.execute(
      gql`
        query ($profileId: GID!) {
          profile(profileId: $profileId) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
              totalCount
              items {
                type
              }
            }
          }
        }
      `,
      { profileId: toGlobalId("Profile", profile.id) },
    );

    expect(queryErrors).toBeUndefined();
    expect(queryData?.profile).toEqual({
      id: toGlobalId("Profile", profile.id),
      properties: [
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[0].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Harvey" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            type: "SHORT_TEXT",
          },
          value: {
            id: expect.any(String),
            content: { value: "Doe" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            type: "DATE",
          },
          value: {
            id: expect.any(String),
            content: { value: "1990-01-01" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            type: "SELECT",
          },
          value: {
            id: expect.any(String),
            content: { value: "AR" },
          },
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            type: "SHORT_TEXT",
          },
          value: null,
        },
        {
          field: {
            id: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            type: "BACKGROUND_CHECK",
          },
          value: {
            id: expect.any(String),
            content: {
              query: {
                name: "Harvey Doe",
                date: null,
                country: "AR",
                birthCountry: "AR",
                type: "PERSON",
              },
              search: {
                totalCount: 1,
                falsePositivesCount: 0,
                createdAt: expect.any(String),
              },
              entity: null,
            },
          },
        },
      ],
      events: {
        totalCount: 8,
        items: [
          // ----- background check update -----
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          // -----------------------------------
          // ----- background check removal -----
          { type: "PROFILE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          // -----------------------------------
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
          { type: "PROFILE_FIELD_VALUE_UPDATED" },
        ],
      },
    });
  });

  it("does not trigger a search if only unrelated values are updated", async () => {
    await testClient.execute(
      gql`
        mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
          updateProfileFieldValue(profileId: $profileId, fields: $fields) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
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
            content: { value: "John" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[1].id),
            content: { value: "Doe" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[2].id),
            content: { value: "1990-01-01" },
          },
          {
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[3].id),
            content: { value: "AR" },
          },
        ],
      },
    );

    const events = await knex.from("profile_event").where("profile_id", profile.id).select("*");

    const profileUpdatedEvent = events.find((e) => e.type === "PROFILE_UPDATED");

    expect(profileUpdatedEvent).toBeDefined();

    // run first search
    await handleListenerEvent(profileUpdatedEvent as ProfileUpdatedEvent);

    expect(queueSpy).toHaveBeenCalledExactlyOnceWith("background-check-profile-search", {
      body: {
        orgId: organization.id,
        profileId: profile.id,
        profileTypeFieldId: backgroundCheckField.id,
        query: { name: "John Doe", date: null, country: "AR", type: "PERSON", birthCountry: "AR" },
      },
    });

    await backgroundCheckProfileQueue.handler({
      orgId: organization.id,
      profileId: profile.id,
      profileTypeFieldId: backgroundCheckField.id,
      query: { name: "John Doe", date: null, country: "AR", type: "PERSON", birthCountry: "AR" },
    });

    await testClient.execute(
      gql`
        mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
          updateProfileFieldValue(profileId: $profileId, fields: $fields) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
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
            profileTypeFieldId: toGlobalId("ProfileTypeField", backgroundCheckField.id),
            content: null,
          },
        ],
      },
    );

    let latestProfileUpdatedEvent = await mocks.knex
      .from("profile_event")
      .where("profile_id", profile.id)
      .where("type", "PROFILE_UPDATED")
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .first();

    // this should not trigger a new search
    await handleListenerEvent(latestProfileUpdatedEvent as ProfileUpdatedEvent);
    expect(queueSpy).toHaveBeenCalledTimes(1);

    // updating an unrelated field should not trigger a new search
    const { errors } = await testClient.execute(
      gql`
        mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
          updateProfileFieldValue(profileId: $profileId, fields: $fields) {
            id
            properties {
              field {
                id
                type
              }
              value {
                id
                content
              }
            }
            events(limit: 100, offset: 0) {
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
            profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeFields[4].id),
            content: { value: "Engineer" },
          },
        ],
      },
    );

    expect(errors).toBeUndefined();

    latestProfileUpdatedEvent = await mocks.knex
      .from("profile_event")
      .where("profile_id", profile.id)
      .where("type", "PROFILE_UPDATED")
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .first();

    expect(latestProfileUpdatedEvent).toBeDefined();

    await handleListenerEvent(latestProfileUpdatedEvent as ProfileUpdatedEvent);

    expect(queueSpy).toHaveBeenCalledTimes(1);
  });
});

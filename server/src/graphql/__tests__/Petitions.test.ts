import { datatype, internet } from "faker";
import gql from "graphql-tag";
import { Knex } from "knex";
import { omit, sortBy } from "remeda";
import { USER_COGNITO_ID } from "../../../test/mocks";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Contact,
  Organization,
  OrganizationUsageLimit,
  Petition,
  PetitionField,
  PetitionFieldType,
  PetitionPermission,
  Tag,
  User,
  UserGroup,
} from "../../db/__types";
import { AUTH, IAuth } from "../../services/auth";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { deleteAllData } from "../../util/knexUtils";
import { fromPlainText } from "../../util/slate";
import { initServer, TestClient } from "./server";

function petitionsBuilder(orgId: number) {
  return (index: number): Partial<Petition> => ({
    is_template: index > 5,
    status: index > 5 ? null : "DRAFT",
    template_public: index > 7,
    org_id: orgId,
    created_at: new Date(),
    created_by: "User:1",
    locale: "en",
    name: index > 5 ? `Template ${index}` : `Petition ${index}`,
    template_description: index > 5 ? `Template description ${index}` : null,
    signature_config:
      index === 5
        ? {
            contactIds: [],
            provider: "SIGNATURIT",
            review: false,
            timezone: "Europe/Madrid",
            title: "Signature",
          }
        : null,
  });
}

describe("GraphQL/Petitions", () => {
  let testClient: TestClient;

  let organization: Organization;
  let sessionUser: User;
  let petitions: Petition[];
  let sameOrgUser: User;

  let otherOrg: Organization;
  let otherUser: User;
  let otherPetition: Petition;

  let publicTemplate: Petition;

  let mocks: Mocks;

  let fields: PetitionField[];

  let tags: Tag[];
  let privateTag: Tag;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    await deleteAllData(knex);

    // main organization
    [organization] = await mocks.createRandomOrganizations(1, () => ({
      name: "Parallel",
      status: "DEV",
    }));

    // secondary org
    [otherOrg] = await mocks.createRandomOrganizations(1);

    // logged user
    [sessionUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
      cognito_id: USER_COGNITO_ID,
      first_name: "Harvey",
      last_name: "Specter",
      org_id: organization.id,
    }));

    // user from the same organization as logged
    [sameOrgUser] = await mocks.createRandomUsers(organization.id, 1);

    // user from other organization
    [otherUser] = await mocks.createRandomUsers(otherOrg.id, 1);

    // logged user petitions
    petitions = await mocks.createRandomPetitions(
      organization.id,
      sessionUser.id,
      10,
      petitionsBuilder(organization.id)
    );

    tags = await mocks.createRandomTags(organization.id, 11);
    await mocks.tagPetitions([petitions[0].id, petitions[1].id], tags[0].id);
    await mocks.tagPetitions([petitions[0].id], tags[1].id);

    [privateTag] = await mocks.createRandomTags(otherOrg.id, 1);

    fields = await mocks.createRandomPetitionFields(petitions[0].id, 2, () => ({
      type: "TEXT",
    }));

    await mocks.knex.raw("UPDATE petition_field set visibility = ? where id = ?", [
      JSON.stringify({
        type: "SHOW",
        operator: "AND",
        conditions: [
          {
            fieldId: fields[0].id,
            modifier: "NONE",
            operator: "CONTAIN",
            value: "$",
          },
        ],
      }),
      fields[1].id,
    ]);

    // petitions[0] and petitions[1] are shared to another user
    await mocks.sharePetitions([petitions[0].id, petitions[1].id], sameOrgUser.id, "WRITE");

    // a public template from secondary organization
    [publicTemplate] = await mocks.createRandomPetitions(otherOrg.id, otherUser.id, 1, () => ({
      locale: "en",
      template_public: true,
      is_template: true,
      status: null,
      name: "KYC (Know Your Client)",
      template_description: "Template description for KYC",
    }));

    // a petition from secondary user
    [otherPetition] = await mocks.createRandomPetitions(otherOrg.id, otherUser.id, 1);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("Queries", () => {
    it("fetches all user petitions", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($limit: Int) {
            petitions(limit: $limit) {
              totalCount
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
      expect(data!.petitions.totalCount).toBe(6);
    });

    it("filters petition by single tag", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($filters: PetitionFilter) {
            petitions(filters: $filters, limit: 10) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        variables: {
          filters: {
            tagIds: [toGlobalId("Tag", tags[0].id)],
          },
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.petitions).toEqual({
        totalCount: 2,
        items: sortBy(petitions.slice(0, 2), (p) => p.id).map((p) => ({
          id: toGlobalId("Petition", p.id),
        })),
      });
    });

    it("filters petition by multiple tags", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($filters: PetitionFilter) {
            petitions(filters: $filters, limit: 10) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        variables: {
          filters: {
            tagIds: [toGlobalId("Tag", tags[0].id), toGlobalId("Tag", tags[1].id)],
          },
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.petitions).toEqual({
        totalCount: 1,
        items: [{ id: toGlobalId("Petition", petitions[0].id) }],
      });
    });

    it("should not allow to filter by a tag id in another organization", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($filters: PetitionFilter) {
            petitions(filters: $filters, limit: 10) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        variables: {
          filters: {
            tagIds: [toGlobalId("Tag", privateTag.id)],
          },
        },
      });

      expect(errors).toContainGraphQLError("INVALID_FILTER");
      expect(data).toBeNull();
    });

    it("filters petitions with tags when passing an empty tagIds array", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($filters: PetitionFilter) {
            petitions(filters: $filters, limit: 100, offset: 0) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        variables: { filters: { tagIds: [] } },
      });

      const expectedPetitions = petitions.filter(
        (p) => !p.is_template && p.id !== petitions[0].id && p.id !== petitions[1].id
      );
      expect(errors).toBeUndefined();
      expect(data?.petitions).toEqual({
        totalCount: 4,
        items: expectedPetitions.map((p) => ({
          id: toGlobalId("Petition", p.id),
        })),
      });
    });

    it("should not allow to filter by more than 10 tags", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($filters: PetitionFilter) {
            petitions(filters: $filters, limit: 10) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        variables: {
          filters: {
            tagIds: tags.map((tag) => toGlobalId("Tag", tag.id)),
          },
        },
      });

      expect(errors).toContainGraphQLError("INVALID_FILTER");
      expect(data).toBeNull();
    });

    it("fetches a limited amount of petitions", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($limit: Int, $type: PetitionBaseType) {
            petitions(limit: $limit, filters: { type: $type }) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        variables: { limit: 2, type: "PETITION" },
      });
      expect(errors).toBeUndefined();
      expect(data!.petitions.totalCount).toBe(6);
      expect(data!.petitions.items).toHaveLength(2);
    });

    it("fetches only templates", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($limit: Int, $type: PetitionBaseType) {
            petitions(limit: $limit, filters: { type: $type }) {
              totalCount
            }
          }
        `,
        variables: { type: "TEMPLATE" },
      });
      expect(errors).toBeUndefined();
      expect(data!.petitions.totalCount).toBe(4);
    });

    it("fetches my templates ordered by last used", async () => {
      const { data: templates } = await testClient.query({
        query: gql`
          query {
            templates: petitions(
              limit: 100
              sortBy: [lastUsedAt_DESC]
              filters: { type: TEMPLATE }
            ) {
              items {
                id
              }
            }
          }
        `,
      });

      expect(templates).not.toBeNull();
      const { items } = templates!.templates;

      // pick a random templateId that is not on first position of items array
      const index = datatype.number({ min: 1, max: items.length - 1 });
      const templateId = items[index].id;

      // use this random template to create a petition
      await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID) {
            createPetition(type: PETITION, petitionId: $petitionId, locale: en) {
              id
            }
          }
        `,
        variables: {
          petitionId: templateId,
        },
      });

      // templateId should be in first position for petitions query
      const { errors, data } = await testClient.query({
        query: gql`
          query {
            templates: petitions(
              limit: 100
              sortBy: [lastUsedAt_DESC]
              filters: { type: TEMPLATE }
            ) {
              items {
                id
              }
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
      expect(data!.templates).toEqual({
        // first the recently used template, then the rest
        items: [{ id: templateId }].concat(
          items.filter(({ id }: { id: string }) => id !== templateId)
        ),
      });
    });

    it("fetches a single petition from logged user", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($petitionId: GID!) {
            petition(id: $petitionId) {
              name
              owner {
                id
              }
              __typename
            }
          }
        `,
        variables: { petitionId: toGlobalId("Petition", petitions[0].id) },
      });

      expect(errors).toBeUndefined();
      expect(data!.petition.owner.id).toBe(toGlobalId("User", sessionUser.id));
      expect(data!.petition.__typename).toBe("Petition");
    });

    it("fetches a public template from another organization", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($petitionId: GID!) {
            petition(id: $petitionId) {
              owner {
                id
                organization {
                  id
                }
              }
              __typename
            }
          }
        `,
        variables: { petitionId: toGlobalId("Petition", publicTemplate.id) },
      });

      expect(errors).toBeUndefined();
      expect(data!.petition.owner.organization.id).toBe(toGlobalId("Organization", otherOrg.id));
      expect(data!.petition.owner.id).toBe(toGlobalId("User", otherUser.id));
      expect(data!.petition.__typename).toBe("PetitionTemplate");
    });

    it("fetches all public templates", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query {
            publicTemplates {
              totalCount
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
      expect(data!.publicTemplates.totalCount).toBe(3);
    });

    it("orders public templates by last used", async () => {
      const { data: templates } = await testClient.query({
        query: gql`
          query {
            publicTemplates(limit: 100) {
              items {
                id
              }
            }
          }
        `,
      });

      expect(templates).not.toBeNull();
      const { items } = templates!.publicTemplates;

      // pick a random templateId that is not on first position of items array
      const index = datatype.number({ min: 1, max: items.length - 1 });
      const templateId = items[index].id;

      // use this random template to create a petition
      await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID) {
            createPetition(type: PETITION, petitionId: $petitionId, locale: en) {
              id
            }
          }
        `,
        variables: {
          petitionId: templateId,
        },
      });

      // templateId should be in first position for publicTemplates query
      const { errors, data } = await testClient.query({
        query: gql`
          query {
            publicTemplates(limit: 100) {
              items {
                id
              }
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
      expect(data!.publicTemplates).toEqual({
        // first the recently used template, then the rest
        items: [{ id: templateId }].concat(
          items.filter(({ id }: { id: string }) => id !== templateId)
        ),
      });
    });

    it("fetches all public templates with name matching search query", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($search: String) {
            publicTemplates(search: $search) {
              totalCount
            }
          }
        `,
        variables: { search: "Know your Client" },
      });
      expect(errors).toBeUndefined();
      expect(data!.publicTemplates.totalCount).toBe(1);
    });

    it("fetches all public templates with description matching search query", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($search: String) {
            publicTemplates(search: $search) {
              totalCount
            }
          }
        `,
        variables: { search: "description for kyc" },
      });

      expect(errors).toBeUndefined();
      expect(data!.publicTemplates.totalCount).toBe(1);
    });

    it("sends error when trying to fetch a private petition from other user", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($petitionId: GID!) {
            petition(id: $petitionId) {
              id
            }
          }
        `,
        variables: { petitionId: toGlobalId("Petition", otherPetition.id) },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data!.petition).toBeNull();
    });

    it("sends error when trying to access private information through a public template", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query {
            publicTemplates(limit: 100) {
              items {
                owner {
                  organization {
                    users {
                      totalCount
                    }
                  }
                }
              }
            }
          }
        `,
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("createPetition", () => {
    it("creates a petition from scratch with given name", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($name: String, $locale: PetitionLocale!) {
            createPetition(name: $name, locale: $locale) {
              name
              locale
              owner {
                id
              }
              fields {
                isFixed
                type
              }
              __typename
            }
          }
        `,
        variables: {
          name: "New blank petition",
          locale: "en",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toEqual({
        name: "New blank petition",
        locale: "en",
        owner: { id: toGlobalId("User", sessionUser.id) },
        fields: [
          {
            type: "HEADING",
            isFixed: true,
          },
          {
            type: "SHORT_TEXT",
            isFixed: false,
          },
        ],
        __typename: "Petition",
      });
    });

    it("creates a template from scratch with given name", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($name: String, $locale: PetitionLocale!, $type: PetitionBaseType) {
            createPetition(name: $name, locale: $locale, type: $type) {
              name
              locale
              owner {
                id
              }
              fields {
                isFixed
                type
              }
              __typename
            }
          }
        `,
        variables: {
          name: "nueva plantilla",
          type: "TEMPLATE",
          locale: "es",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toEqual({
        name: "nueva plantilla",
        locale: "es",
        owner: { id: toGlobalId("User", sessionUser.id) },
        fields: [
          {
            type: "HEADING",
            isFixed: true,
          },
          {
            type: "SHORT_TEXT",
            isFixed: false,
          },
        ],
        __typename: "PetitionTemplate",
      });
    });

    it("creates a petition using another created by same user as reference", async () => {
      const base = petitions[3];
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($locale: PetitionLocale!, $petitionId: GID, $type: PetitionBaseType) {
            createPetition(locale: $locale, petitionId: $petitionId, type: $type) {
              name
              owner {
                id
              }
              __typename
            }
          }
        `,
        variables: {
          locale: "en",
          petitionId: toGlobalId("Petition", base.id),
          type: "PETITION",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toEqual({
        name: base.name,
        owner: { id: toGlobalId("User", sessionUser.id) },
        __typename: "Petition",
      });
    });

    it("creates a template based on a public template from other organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($locale: PetitionLocale!, $petitionId: GID, $type: PetitionBaseType) {
            createPetition(locale: $locale, petitionId: $petitionId, type: $type) {
              name
              locale
              owner {
                id
              }
              ... on PetitionTemplate {
                isPublic
              }
              __typename
            }
          }
        `,
        variables: {
          locale: "en",
          petitionId: toGlobalId("Petition", publicTemplate.id),
          type: "TEMPLATE",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toEqual({
        name: publicTemplate.name,
        locale: "en",
        owner: { id: toGlobalId("User", sessionUser.id) },
        isPublic: false,
        __typename: "PetitionTemplate",
      });
    });

    it("don't copy tags when creating a petition from a public template", async () => {
      const [tag] = await mocks.createRandomTags(otherOrg.id);
      const [publicTemplateWithTags] = await mocks.createRandomPetitions(
        otherOrg.id,
        otherUser.id,
        1,
        () => ({
          template_public: true,
          is_template: true,
          status: null,
          name: "KYC",
        })
      );
      await mocks.tagPetitions([publicTemplateWithTags.id], tag.id);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $name: String
            $locale: PetitionLocale!
            $petitionId: GID
            $type: PetitionBaseType
          ) {
            createPetition(name: $name, locale: $locale, petitionId: $petitionId, type: $type) {
              tags {
                id
              }
            }
          }
        `,
        variables: {
          name: "Test tags",
          locale: "es",
          type: "PETITION",
          petitionId: toGlobalId("Petition", publicTemplateWithTags.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createPetition).toEqual({ tags: [] });
    });

    it("don't copy reminders configuration when creating a petition from a template", async () => {
      const [template] = await mocks.createRandomPetitions(
        organization.id,
        sessionUser.id,
        1,
        () => ({
          template_public: false,
          is_template: true,
          status: null,
          name: "KYC",
          reminders_active: true,
          reminders_config: {
            time: "12:00",
            offset: 1,
            timezone: "Europe/Madrid",
            weekdaysOnly: true,
          },
        })
      );

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID, $locale: PetitionLocale!) {
            createPetition(petitionId: $petitionId, locale: $locale) {
              ... on Petition {
                remindersConfig {
                  offset
                  time
                  timezone
                  weekdaysOnly
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", template.id),
          locale: "es",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createPetition).toEqual({ remindersConfig: null });
    });

    it("don't copy deadline configuration when creating a petition from a template", async () => {
      const [template] = await mocks.createRandomPetitions(
        organization.id,
        sessionUser.id,
        1,
        () => ({
          template_public: false,
          is_template: true,
          status: null,
          name: "KYC",
          deadline: new Date(),
        })
      );

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID, $locale: PetitionLocale!) {
            createPetition(petitionId: $petitionId, locale: $locale) {
              ... on Petition {
                deadline
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", template.id),
          locale: "es",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createPetition).toEqual({ deadline: null });
    });

    it("copy reminders and deadline config when cloning a petition", async () => {
      const deadline = new Date();
      const [petition] = await mocks.createRandomPetitions(
        organization.id,
        sessionUser.id,
        1,
        () => ({
          template_public: false,
          is_template: false,
          status: "DRAFT",
          name: "KYC",
          deadline,
          reminders_active: true,
          reminders_config: {
            time: "12:00",
            offset: 1,
            timezone: "Europe/Madrid",
            weekdaysOnly: true,
          },
        })
      );

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID, $locale: PetitionLocale!) {
            createPetition(petitionId: $petitionId, locale: $locale) {
              ... on Petition {
                deadline
                remindersConfig {
                  offset
                  time
                  timezone
                  weekdaysOnly
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          locale: "es",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createPetition).toEqual({
        remindersConfig: {
          time: "12:00",
          offset: 1,
          timezone: "Europe/Madrid",
          weekdaysOnly: true,
        },
        deadline: deadline.toISOString(),
      });
    });

    it("creates a petition based on a public template", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $name: String
            $locale: PetitionLocale!
            $petitionId: GID
            $type: PetitionBaseType
          ) {
            createPetition(name: $name, locale: $locale, petitionId: $petitionId, type: $type) {
              name
              locale
              owner {
                id
              }
              ... on Petition {
                status
              }
              __typename
            }
          }
        `,
        variables: {
          locale: "en",
          petitionId: toGlobalId("Petition", publicTemplate.id),
          type: "PETITION",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toEqual({
        name: null, // name is not copied when making a petition from template
        locale: publicTemplate.locale,
        owner: { id: toGlobalId("User", sessionUser.id) },
        status: "DRAFT",
        __typename: "Petition",
      });
    });

    it("creates a petition and subscribes to its events with a given URL", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID, $eventsUrl: String) {
            createPetition(petitionId: $petitionId, eventsUrl: $eventsUrl) {
              id
              owner {
                id
              }
              __typename
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", publicTemplate.id),
          eventsUrl: "https://example.url.com",
        },
      });

      expect(errors).toBeUndefined();
      expect(omit(data!.createPetition, ["id"])).toEqual({
        owner: { id: toGlobalId("User", sessionUser.id) },
        __typename: "Petition",
      });

      const { rows: subscriptions } = await mocks.knex.raw(
        /* sql */ `
        select endpoint from petition_event_subscription
        where petition_id = ? and deleted_at is null`,
        [fromGlobalId(data!.createPetition.id, "Petition").id]
      );

      expect(subscriptions).toEqual([{ endpoint: "https://example.url.com" }]);
    });

    it("ignores name and locale parameters when creating a petition from a valid petitionId", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $locale: PetitionLocale!
            $name: String
            $petitionId: GID
            $type: PetitionBaseType
          ) {
            createPetition(locale: $locale, name: $name, petitionId: $petitionId, type: $type) {
              name
              locale
            }
          }
        `,
        variables: {
          name: "name should not be changed",
          locale: "es",
          petitionId: toGlobalId("Petition", publicTemplate.id),
          type: "TEMPLATE",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createPetition).toEqual({
        name: publicTemplate.name,
        locale: "en",
      });
    });

    it("sends error when trying to create a petition based on a private petition from other organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($locale: PetitionLocale!, $petitionId: GID, $type: PetitionBaseType) {
            createPetition(locale: $locale, petitionId: $petitionId, type: $type) {
              id
            }
          }
        `,
        variables: {
          locale: "en",
          petitionId: toGlobalId("Petition", otherPetition.id),
          type: "PETITION",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("clonePetition", () => {
    it("clones a single petition from a valid id", async () => {
      const petition = petitions[3];
      const petitionGID = toGlobalId("Petition", petition.id);
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              name
              locale
              owner {
                id
              }
              ... on Petition {
                status
              }
              __typename
            }
          }
        `,
        variables: { petitionIds: [petitionGID] },
      });

      expect(errors).toBeUndefined();
      expect(data!.clonePetitions).toEqual([
        {
          name: petition.name!.concat(" (copy)"),
          locale: petition.locale,
          owner: { id: toGlobalId("User", sessionUser.id) },
          status: "DRAFT",
          __typename: "Petition",
        },
      ]);
    });

    it("clones a valid list of petitions", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              id
            }
          }
        `,
        variables: {
          petitionIds: petitions.map((p) => toGlobalId("Petition", p.id)),
        },
      });
      expect(errors).toBeUndefined();
      expect(data!.clonePetitions).toHaveLength(petitions.length);
    });

    it("clones a public template and saves it as private", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              name
              ... on PetitionTemplate {
                isPublic
              }
              __typename
            }
          }
        `,
        variables: { petitionIds: [toGlobalId("Petition", publicTemplate.id)] },
      });
      expect(errors).toBeUndefined();
      expect(data!.clonePetitions[0]).toEqual({
        name: publicTemplate.name?.concat(publicTemplate.locale === "en" ? " (copy)" : " (copia)"),
        isPublic: false,
        __typename: "PetitionTemplate",
      });
    });

    it("inserts a new petition when cloning", async () => {
      const { data } = await testClient.query({
        query: gql`
          query ($type: PetitionBaseType) {
            petitions(filters: { type: $type }) {
              totalCount
            }
          }
        `,
        variables: { type: "PETITION" },
      });
      const availablePetitions = data!.petitions.totalCount;

      await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              id
            }
          }
        `,
        variables: { petitionIds: [toGlobalId("Petition", petitions[0].id)] },
      });

      const { data: newData } = await testClient.query({
        query: gql`
          query ($type: PetitionBaseType) {
            petitions(filters: { type: $type }) {
              totalCount
            }
          }
        `,
        variables: { type: "PETITION" },
      });

      const newAvailablePetitions = newData!.petitions.totalCount;

      expect(availablePetitions + 1).toBe(newAvailablePetitions);
    });

    it("sends error when passing an empty array of ids", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              id
            }
          }
        `,
        variables: { petitionIds: [] },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when an petition on the list is not accessible for session user", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              id
            }
          }
        `,
        variables: { petitionIds: [toGlobalId("Petition", otherPetition.id)] },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("updates referenced fieldIds on visibility conditions when cloning a petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              fields {
                id
                visibility
              }
            }
          }
        `,
        variables: { petitionIds: [toGlobalId("Petition", petitions[0].id)] },
      });

      const clonedFieldIds = data!.clonePetitions[0].fields.map((f: any) => f.id);

      expect(errors).toBeUndefined();
      expect(data!.clonePetitions[0]).toEqual({
        fields: [
          { id: clonedFieldIds[0], visibility: null },
          {
            id: clonedFieldIds[1],
            visibility: {
              conditions: [
                {
                  fieldId: clonedFieldIds[0],
                  modifier: "NONE",
                  operator: "CONTAIN",
                  value: "$",
                },
              ],
              operator: "AND",
              type: "SHOW",
            },
          },
        ],
      });
    });

    it("copies field attachments when cloning the petition", async () => {
      await mocks.createPetitionFieldAttachment(fields[0].id, 1);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              fields {
                id
                attachments {
                  id
                }
              }
            }
          }
        `,
        variables: { petitionIds: [toGlobalId("Petition", petitions[0].id)] },
      });

      expect(errors).toBeUndefined();
      expect(data?.clonePetitions[0].fields[0].attachments).toHaveLength(1);
      expect(data?.clonePetitions[0].fields[1].attachments).toHaveLength(0);
    });

    it("copies tags when cloning the petition", async () => {
      const [tag] = await mocks.createRandomTags(organization.id);
      const [petitionWithTags] = await mocks.createRandomPetitions(
        organization.id,
        sessionUser.id,
        1,
        () => ({
          template_public: false,
          is_template: false,
          status: "DRAFT",
          name: "KYC",
        })
      );
      await mocks.tagPetitions([petitionWithTags.id], tag.id);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              tags {
                id
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", petitionWithTags.id)],
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.clonePetitions[0].tags).toHaveLength(1);
    });

    it("copies signature configuration when cloning the petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              ... on Petition {
                signatureConfig {
                  contacts {
                    id
                  }
                  provider
                  review
                  timezone
                  title
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", petitions[5].id)],
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.clonePetitions[0]).toEqual({
        signatureConfig: {
          contacts: [],
          provider: "SIGNATURIT",
          review: false,
          timezone: "Europe/Madrid",
          title: "Signature",
        },
      });
    });

    it("copies subscription flag when cloning a petition", async () => {
      const [unsubscribed] = await mocks.createRandomPetitions(
        organization.id,
        sessionUser.id,
        1,
        () => ({}),
        () => ({ is_subscribed: false })
      );

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              myEffectivePermission {
                isSubscribed
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", unsubscribed.id)],
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.clonePetitions).toEqual([{ myEffectivePermission: { isSubscribed: false } }]);
    });
  });

  describe("deletePetitions", () => {
    let petitionsToDelete: Petition[];
    beforeEach(async () => {
      petitionsToDelete = await mocks.createRandomPetitions(
        organization.id,
        sessionUser.id,
        2,
        petitionsBuilder(organization.id)
      );

      await mocks.sharePetitions([petitionsToDelete[0].id], sameOrgUser.id, "WRITE");
    });
    afterEach(async () => {
      await mocks.clearSharedPetitions();
    });

    it("deletes a user petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!, $force: Boolean) {
            deletePetitions(ids: $ids, force: $force)
          }
        `,
        variables: { ids: [toGlobalId("Petition", petitionsToDelete[1].id)] },
      });

      expect(errors).toBeUndefined();
      expect(data!.deletePetitions).toBe("SUCCESS");
    });

    it("deletes an owned shared petition when passing the force flag", async () => {
      const sharedByMe = petitionsToDelete[0];
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!, $force: Boolean) {
            deletePetitions(ids: $ids, force: $force)
          }
        `,
        variables: {
          ids: [toGlobalId("Petition", sharedByMe.id)],
          force: true,
        },
      });
      expect(errors).toBeUndefined();
      expect(data!.deletePetitions).toBe("SUCCESS");
    });

    it("removes the petition and every permission when deleting an owned shared petition", async () => {
      const sharedByMe = petitionsToDelete[0];
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!, $force: Boolean) {
            deletePetitions(ids: $ids, force: $force)
          }
        `,
        variables: {
          ids: [toGlobalId("Petition", sharedByMe.id)],
          force: true,
        },
      });
      expect(errors).toBeUndefined();
      expect(data!.deletePetitions).toBe("SUCCESS");

      // make sure that nobody has access to a force-deleted petition owned by me
      const permissions = await mocks.loadUserPermissionsByPetitionId(sharedByMe.id);
      const petition = await mocks.loadPetition(sharedByMe.id);

      expect(permissions).toEqual([]);
      expect(petition).toBeUndefined();
    });

    it("removes only my permission when deleting a petition shared to me", async () => {
      const [sharedToMe] = await mocks.createRandomPetitions(
        organization.id,
        sameOrgUser.id,
        1,
        petitionsBuilder(organization.id)
      );

      //share the petition with the logged user
      await mocks.sharePetitions([sharedToMe.id], sessionUser.id, "WRITE");

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!, $force: Boolean) {
            deletePetitions(ids: $ids, force: $force)
          }
        `,
        variables: {
          ids: [toGlobalId("Petition", sharedToMe.id)],
          force: true,
        },
      });
      expect(errors).toBeUndefined();
      expect(data!.deletePetitions).toBe("SUCCESS");

      const userPermissions = await mocks.loadUserPermissionsByPetitionId(sharedToMe.id);
      expect(userPermissions).toEqual([
        {
          ...userPermissions[0],
          type: "OWNER",
          user_id: sameOrgUser.id,
        },
      ]);

      const petition = await mocks.loadPetition(sharedToMe.id);
      expect(petition).toBeDefined();
    });

    it("sends error when trying to delete a private petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!, $force: Boolean) {
            deletePetitions(ids: $ids, force: $force)
          }
        `,
        variables: {
          ids: [toGlobalId("Petition", otherPetition.id)],
          force: true,
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing an empty array of ids", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!, $force: Boolean) {
            deletePetitions(ids: $ids, force: $force)
          }
        `,
        variables: { ids: [] },
      });
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to delete an owned shared petition without force flag", async () => {
      const shared = petitionsToDelete[0];
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!, $force: Boolean) {
            deletePetitions(ids: $ids, force: $force)
          }
        `,
        variables: { ids: [toGlobalId("Petition", shared.id)] },
      });
      expect(errors).toContainGraphQLError("DELETE_SHARED_PETITION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("deletePetitions shared with groups", () => {
    let petition: Petition;
    let users: User[];
    let userGroup: UserGroup;

    beforeAll(async () => {
      [petition] = await mocks.createRandomPetitions(sessionUser.org_id, sessionUser.id, 1);
      users = await mocks.createRandomUsers(sessionUser.org_id, 2);
      [userGroup] = await mocks.createUserGroups(1, sessionUser.org_id);
      await mocks.insertUserGroupMembers(userGroup.id, [sessionUser.id, ...users.map((u) => u.id)]);
      await mocks.sharePetitionWithGroups(petition.id, [userGroup.id]);
      await mocks.knex<PetitionPermission>("petition_permission").insert({
        user_id: users[1].id,
        type: "READ",
        petition_id: petition.id,
      });
    });
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("R/W user with group permissions should not be able to delete", async () => {
      jest
        .spyOn(testClient.container.get<IAuth>(AUTH), "validateSession")
        .mockResolvedValueOnce(users[0]);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!) {
            deletePetitions(ids: $ids, force: true)
          }
        `,
        variables: { ids: [toGlobalId("Petition", petition.id)] },
      });

      expect(errors).toContainGraphQLError("DELETE_GROUP_PETITION_ERROR");
      expect(data).toBeNull();
    });

    it("R/W user with directly assigned and group permissions should not be able to delete", async () => {
      jest
        .spyOn(testClient.container.get<IAuth>(AUTH), "validateSession")
        .mockResolvedValueOnce(users[1]);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!) {
            deletePetitions(ids: $ids, force: true)
          }
        `,
        variables: { ids: [toGlobalId("Petition", petition.id)] },
      });
      expect(errors).toContainGraphQLError("DELETE_GROUP_PETITION_ERROR");
      expect(data).toBeNull();
    });

    it("petition owner with group access should be able to delete it", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!) {
            deletePetitions(ids: $ids, force: true)
          }
        `,
        variables: { ids: [toGlobalId("Petition", petition.id)] },
      });
      expect(errors).toBeUndefined();
      expect(data?.deletePetitions).toBe("SUCCESS");

      const petitionPermissions = await mocks.knex
        .from("petition_permission")
        .where("petition_id", petition.id)
        .whereNull("deleted_at")
        .returning("*");

      expect(petitionPermissions).toHaveLength(0);
    });
  });

  describe("updatePetition", () => {
    it("updates the petition with given values", async () => {
      const variables = {
        name: "Petition4 new name",
        locale: "en",
        deadline: "2019-12-03T10:15:30.000Z",
        emailSubject: "subject for the email",
        emailBody: [{ children: [{ text: "new email body" }] }],
      };

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionId: GID!
            $name: String
            $locale: PetitionLocale
            $deadline: DateTime
            $emailSubject: String
            $emailBody: JSON
          ) {
            updatePetition(
              petitionId: $petitionId
              data: {
                name: $name
                locale: $locale
                deadline: $deadline
                emailSubject: $emailSubject
                emailBody: $emailBody
              }
            ) {
              id
              name
              locale
              emailSubject
              emailBody
              ... on Petition {
                deadline
              }
              __typename
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petitions[4].id),
          ...variables,
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updatePetition).toEqual({
        id: toGlobalId("Petition", petitions[4].id),
        ...variables,
        __typename: "Petition",
      });
    });

    it("updates petition with valid remindersConfig", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $remindersConfig: RemindersConfigInput) {
            updatePetition(petitionId: $petitionId, data: { remindersConfig: $remindersConfig }) {
              id
              ... on Petition {
                remindersConfig {
                  offset
                  time
                  timezone
                  weekdaysOnly
                }
              }
              __typename
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petitions[4].id),
          remindersConfig: {
            offset: 1,
            time: "12:45",
            timezone: "Europe/Madrid",
            weekdaysOnly: false,
          },
          __typename: "Petition",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updatePetition).toEqual({
        id: toGlobalId("Petition", petitions[4].id),
        remindersConfig: {
          offset: 1,
          time: "12:45",
          timezone: "Europe/Madrid",
          weekdaysOnly: false,
        },
        __typename: "Petition",
      });
    });

    it("updates template description with given value", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $description: JSON) {
            updatePetition(petitionId: $petitionId, data: { description: $description }) {
              id
              ... on PetitionTemplate {
                descriptionExcerpt
              }
              __typename
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petitions[6].id),
          description: fromPlainText("this is the description"),
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updatePetition).toEqual({
        id: toGlobalId("Petition", petitions[6].id),
        descriptionExcerpt: "this is the description",
        __typename: "PetitionTemplate",
      });
    });

    it("trims name and emailSubject before updating petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $name: String, $emailSubject: String) {
            updatePetition(
              petitionId: $petitionId
              data: { name: $name, emailSubject: $emailSubject }
            ) {
              id
              name
              emailSubject
              __typename
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petitions[6].id),
          name: "   petition  name",
          emailSubject: "                  ",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updatePetition).toEqual({
        id: toGlobalId("Petition", petitions[6].id),
        name: "petition  name",
        emailSubject: null,
        __typename: "PetitionTemplate",
      });
    });

    it("sends error when trying to update petition with empty data", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!) {
            updatePetition(petitionId: $petitionId, data: {}) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petitions[6].id),
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to update a private petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!) {
            updatePetition(petitionId: $petitionId, data: { name: "foo" }) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", otherPetition.id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to update a not owned public template", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!) {
            updatePetition(petitionId: $petitionId, data: { name: "foo" }) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", publicTemplate.id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to update email body with invalid value", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $emailBody: JSON) {
            updatePetition(petitionId: $petitionId, data: { emailBody: $emailBody }) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petitions[5].id),
          emailBody: { text: "invalid structure" },
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("Read-only petitions", () => {
    let readonlyPetition: Petition;
    let fields: PetitionField[];
    beforeAll(async () => {
      [readonlyPetition] = await mocks.createRandomPetitions(
        organization.id,
        sessionUser.id,
        1,
        () => ({ is_readonly: true })
      );

      fields = await mocks.createRandomPetitionFields(readonlyPetition.id, 3, (i) => ({
        type: ["HEADING", "TEXT", "DYNAMIC_SELECT"][i] as PetitionFieldType,
      }));
    });

    it("should not allow to edit the petition title", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $data: UpdatePetitionInput!) {
            updatePetition(petitionId: $petitionId, data: $data) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          data: { name: "my new title" },
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should not allow to edit the petition language", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $data: UpdatePetitionInput!) {
            updatePetition(petitionId: $petitionId, data: $data) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          data: { locale: "en" },
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should not allow to turn on/off the comments", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $data: UpdatePetitionInput!) {
            updatePetition(petitionId: $petitionId, data: $data) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          data: { hasCommentsEnabled: true },
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should not allow to edit field title and description", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          fieldId: toGlobalId("PetitionField", fields[1].id),
          data: { title: "...", description: "..." },
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should not allow to add a new field to the petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $type: PetitionFieldType!) {
            createPetitionField(petitionId: $petitionId, type: $type) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          type: "CHECKBOX",
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should not allow to reorder fields", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldIds: [GID!]!) {
            updateFieldPositions(petitionId: $petitionId, fieldIds: $fieldIds) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          fieldIds: [
            toGlobalId("PetitionField", fields[0].id),
            toGlobalId("PetitionField", fields[2].id),
            toGlobalId("PetitionField", fields[1].id),
          ],
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should not allow to switch 'required' option on field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          fieldId: toGlobalId("PetitionField", fields[1].id),
          data: {
            optional: false,
          },
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should not allow to add visibility conditions on field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          fieldId: toGlobalId("PetitionField", fields[2].id),
          data: {
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: toGlobalId("PetitionField", fields[1].id),
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "EQUAL",
                  value: 1,
                },
              ],
            },
          },
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should not allow to clone a petition field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          fieldId: toGlobalId("PetitionField", fields[2].id),
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should not allow to delete a petition field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!) {
            deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: true) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          fieldId: toGlobalId("PetitionField", fields[2].id),
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should not allow to change the field type", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!) {
            changePetitionFieldType(
              petitionId: $petitionId
              fieldId: $fieldId
              type: $type
              force: true
            ) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          fieldId: toGlobalId("PetitionField", fields[2].id),
          type: "SHORT_TEXT",
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should not allow to add tags to the petition", async () => {
      const [tag] = await mocks.createRandomTags(organization.id, 1);
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $tagId: GID!) {
            tagPetition(petitionId: $petitionId, tagId: $tagId) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          tagId: toGlobalId("Tag", tag.id),
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should not allow to remove tags from the petition", async () => {
      const [tag] = await mocks.createRandomTags(organization.id, 1);
      await mocks.tagPetitions([readonlyPetition.id], tag.id);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $tagId: GID!) {
            untagPetition(petitionId: $petitionId, tagId: $tagId) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          tagId: toGlobalId("Tag", tag.id),
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should not allow to edit field options", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
            updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
              petition {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          fieldId: toGlobalId("PetitionField", fields[1].id),
          data: {
            multiple: false,
            options: {
              placeholder: "foo",
            },
          },
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("sendPetition", () => {
    let petition: Petition;
    let usageLimit: OrganizationUsageLimit;
    let contacts: Contact[];
    beforeAll(async () => {
      contacts = await mocks.createRandomContacts(organization.id, 2, (i) => ({
        email: i === 0 ? sessionUser.email : internet.email(),
      }));
      usageLimit = await mocks.createOrganizationUsageLimit(organization.id, "PETITION_SEND", 0);
    });
    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, sessionUser.id, 1);
      await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "TEXT",
        title: "Text reply",
      }));
    });

    it("updates the organization usage limit after sending a petition", async () => {
      await mocks.knex
        .from("organization_usage_limit")
        .where("id", usageLimit.id)
        .update({ used: 0, limit: 5 });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $contactIds: [GID!]!, $subject: String!, $body: JSON!) {
            sendPetition(
              petitionId: $petitionId
              contactIds: $contactIds
              subject: $subject
              body: $body
            ) {
              result
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          contactIds: [toGlobalId("Contact", contacts[1].id)],
          subject: "petition send subject",
          body: [],
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.sendPetition).toEqual({ result: "SUCCESS" });

      const [orgUsageLimit] = await mocks.knex
        .from("organization_usage_limit")
        .where({
          period_end_date: null,
          org_id: organization.id,
          limit_name: "PETITION_SEND",
        })
        .select("id", "used", "limit");

      expect(orgUsageLimit).toEqual({
        id: usageLimit.id,
        used: 1,
        limit: 5,
      });
    });

    it("should not be able to send a petition without send credits", async () => {
      await mocks.knex
        .from("organization_usage_limit")
        .where("id", usageLimit.id)
        .update({ used: 5, limit: 5 });
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $contactIds: [GID!]!, $subject: String!, $body: JSON!) {
            sendPetition(
              petitionId: $petitionId
              contactIds: $contactIds
              subject: $subject
              body: $body
            ) {
              result
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          contactIds: [toGlobalId("Contact", contacts[1].id)],
          subject: "petition send subject",
          body: [],
        },
      });

      expect(errors).toContainGraphQLError("PETITION_SEND_CREDITS_ERROR", {
        needed: 1,
        used: 5,
        limit: 5,
      });
      expect(data).toBeNull();
    });

    it("batch sends should be limited to the amount of remaining petition send credits", async () => {
      await mocks.knex
        .from("organization_usage_limit")
        .where("id", usageLimit.id)
        .update({ used: 0, limit: 2 });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionId: GID!
            $contactIdGroups: [[GID!]!]!
            $subject: String!
            $body: JSON!
          ) {
            batchSendPetition(
              petitionId: $petitionId
              contactIdGroups: $contactIdGroups
              subject: $subject
              body: $body
            ) {
              result
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          contactIdGroups: [
            [toGlobalId("Contact", contacts[1].id)],
            [toGlobalId("Contact", contacts[1].id)],
            [toGlobalId("Contact", contacts[1].id)],
          ],
          subject: "petition send subject",
          body: [],
        },
      });

      expect(errors).toContainGraphQLError("PETITION_SEND_CREDITS_ERROR", {
        needed: 3,
        limit: 2,
        used: 0,
      });
      expect(data).toBeNull();
    });

    it("sending a petition to myself should not consume credits", async () => {
      await mocks.knex.from("organization_usage_limit").where("id", usageLimit.id).update({
        used: 10,
        limit: 10,
      });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $contactIds: [GID!]!, $subject: String!, $body: JSON!) {
            sendPetition(
              petitionId: $petitionId
              contactIds: $contactIds
              subject: $subject
              body: $body
            ) {
              result
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          contactIds: [toGlobalId("Contact", contacts[0].id)],
          subject: "petition send subject",
          body: [],
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.sendPetition).toEqual({ result: "SUCCESS" });

      const organizationCurrentUsageLimit = await mocks.knex
        .from("organization_usage_limit")
        .where("id", usageLimit.id)
        .select("id", "used", "limit");

      expect(organizationCurrentUsageLimit).toEqual([{ id: usageLimit.id, used: 10, limit: 10 }]);
    });

    it("doing a batch send with only me in a group should reduce the amount of credits needed", async () => {
      await mocks.knex.from("organization_usage_limit").where("id", usageLimit.id).update({
        used: 9,
        limit: 10,
      });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionId: GID!
            $contactIdGroups: [[GID!]!]!
            $subject: String!
            $body: JSON!
          ) {
            batchSendPetition(
              petitionId: $petitionId
              contactIdGroups: $contactIdGroups
              subject: $subject
              body: $body
            ) {
              result
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          contactIdGroups: [
            [toGlobalId("Contact", contacts[0].id)],
            [toGlobalId("Contact", contacts[1].id)],
          ],
          subject: "petition send subject",
          body: [],
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.batchSendPetition).toEqual([{ result: "SUCCESS" }, { result: "SUCCESS" }]);

      const organizationCurrentUsageLimit = await mocks.knex
        .from("organization_usage_limit")
        .where("id", usageLimit.id)
        .select("id", "used", "limit");

      expect(organizationCurrentUsageLimit).toEqual([{ id: usageLimit.id, used: 10, limit: 10 }]);
    });
  });
});

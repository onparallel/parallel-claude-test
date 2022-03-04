import { gql } from "@apollo/client";
import faker from "@faker-js/faker";
import { Knex } from "knex";
import { sortBy } from "remeda";
import { PetitionEvent } from "../../db/events";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Contact,
  Organization,
  OrganizationUsageLimit,
  OrgIntegration,
  Petition,
  PetitionField,
  PetitionFieldType,
  PetitionPermission,
  PetitionSignatureRequest,
  Tag,
  User,
  UserGroup,
} from "../../db/__types";
import { AUTH, IAuth } from "../../services/auth";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { fromPlainText } from "../../util/slate";
import { initServer, TestClient } from "./server";

function petitionsBuilder(orgId: number, signatureIntegrationId: number) {
  return (index: number): Partial<Petition> => ({
    is_template: index > 5,
    status: index > 5 ? null : "DRAFT",
    template_public: index > 7,
    custom_properties:
      index > 6
        ? {
            "client id": "12345",
          }
        : {},
    public_metadata:
      index > 7
        ? {
            slug: faker.lorem.slug(5),
            categories: ["legal"],
            description: null,
            background_color: "#81E6D9",
            image_public_file_id: null,
          }
        : null,
    org_id: orgId,
    created_at: new Date(),
    created_by: "User:1",
    locale: "en",
    name: index > 5 ? `Template ${index}` : `Petition ${index}`,
    template_description: index > 5 ? `Template description ${index}` : null,
    signature_config:
      index === 5
        ? {
            signersInfo: [],
            orgIntegrationId: signatureIntegrationId,
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
  let collaboratorUser: User;
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

  let signatureIntegrations: OrgIntegration[];

  let collaboratorApiKey: string;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user: sessionUser } = await mocks.createSessionUserAndOrganization());

    // secondary org
    [otherOrg] = await mocks.createRandomOrganizations(1);

    [collaboratorUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
      organization_role: "COLLABORATOR",
    }));

    [{ apiKey: collaboratorApiKey }] = await Promise.all([
      mocks.createUserAuthToken("collaborator-token", collaboratorUser.id),
    ]);

    // user from the same organization as logged
    [sameOrgUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
      organization_role: "NORMAL",
    }));

    // user from other organization
    [otherUser] = await mocks.createRandomUsers(otherOrg.id, 1);

    signatureIntegrations = await mocks.createOrgIntegration([
      {
        type: "SIGNATURE",
        provider: "SIGNATURIT",
        org_id: organization.id,
        settings: { API_KEY: "<API_KEY>" },
        is_enabled: true,
        is_default: true,
      },
      {
        type: "SIGNATURE",
        provider: "DOCUSIGN",
        org_id: organization.id,
        settings: { API_KEY: "<API_KEY>" },
        is_enabled: true,
        is_default: false,
      },
    ]);
    // logged user petitions
    petitions = await mocks.createRandomPetitions(
      organization.id,
      sessionUser.id,
      10,
      petitionsBuilder(organization.id, signatureIntegrations[0].id)
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
      await mocks.knex.from("petition").update("from_template_id", null);

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
      const index = faker.datatype.number({ min: 1, max: items.length - 1 });
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
            templates(isPublic: true) {
              totalCount
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
      expect(data!.templates.totalCount).toBe(3);
    });

    it("orders public templates by use count", async () => {
      await mocks.knex.from("petition").update("from_template_id", null);
      const { data } = await testClient.query({
        query: gql`
          query {
            templates(limit: 100, isPublic: true) {
              items {
                id
              }
            }
          }
        `,
      });

      expect(data).not.toBeNull();
      const { items } = data!.templates;

      // pick a random templateId that is not on first position of items array
      const index = faker.datatype.number({ min: 1, max: items.length - 1 });
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

      // templateId should be in first position for templates query
      const { errors, data: data2 } = await testClient.query({
        query: gql`
          query {
            templates(limit: 100, isPublic: true) {
              items {
                id
              }
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
      expect(data2!.templates).toEqual({
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
            templates(search: $search, isPublic: true) {
              totalCount
            }
          }
        `,
        variables: { search: "Know your Client" },
      });
      expect(errors).toBeUndefined();
      expect(data!.templates.totalCount).toBe(1);
    });

    it("fetches all public templates with description matching search query", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($search: String) {
            templates(search: $search, isPublic: true) {
              totalCount
            }
          }
        `,
        variables: { search: "description for kyc" },
      });

      expect(errors).toBeUndefined();
      expect(data!.templates.totalCount).toBe(1);
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
            templates(limit: 100, isPublic: true) {
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

    it("copy reminders configuration when creating a petition from a template", async () => {
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
      expect(data?.createPetition).toEqual({
        remindersConfig: {
          time: "12:00",
          offset: 1,
          timezone: "Europe/Madrid",
          weekdaysOnly: true,
        },
      });
    });

    it("copy signature configuration when creating a petition from a public template of the same organization", async () => {
      const [publicTemplateWithSignature] = await mocks.createRandomPetitions(
        organization.id,
        sameOrgUser.id,
        1,
        () => ({
          template_public: true,
          is_template: true,
          status: null,
          name: "KYC",
          signature_config: {
            title: "aaaa",
            review: false,
            orgIntegrationId: signatureIntegrations[1].id,
            timezone: "Europe/Madrid",
            signersInfo: [
              {
                firstName: "Michael",
                lastName: "Scott",
                email: "michael@dundermifflin.com",
                contactId: 30,
              },
            ],
            allowAdditionalSigners: true,
          },
        })
      );

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $name: String
            $locale: PetitionLocale!
            $petitionId: GID
            $type: PetitionBaseType
          ) {
            createPetition(name: $name, locale: $locale, petitionId: $petitionId, type: $type) {
              signatureConfig {
                integration {
                  id
                }
                signers {
                  fullName
                  email
                }
                timezone
                title
                review
                allowAdditionalSigners
              }
            }
          }
        `,
        variables: {
          name: "Test signature",
          locale: "es",
          type: "PETITION",
          petitionId: toGlobalId("Petition", publicTemplateWithSignature.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createPetition).toEqual({
        signatureConfig: {
          integration: { id: toGlobalId("OrgIntegration", signatureIntegrations[1].id) },
          signers: [{ fullName: "Michael Scott", email: "michael@dundermifflin.com" }],
          timezone: "Europe/Madrid",
          title: "aaaa",
          review: false,
          allowAdditionalSigners: true,
        },
      });
    });

    it("copies signature configuration when using a public template of another organization, and changes it to fit the new organization", async () => {
      const [otherOrgSignatureIntegration] = await mocks.createOrgIntegration([
        {
          org_id: otherOrg.id,
          provider: "DOCUSIGN",
          type: "SIGNATURE",
          name: "Docusign Test",
          is_default: false,
          is_enabled: true,
          settings: { environment: "sandbox", API_KEY: "<APIKEY>" },
        },
      ]);

      const [publicTemplateWithSignature] = await mocks.createRandomPetitions(
        otherOrg.id,
        otherUser.id,
        1,
        () => ({
          template_public: true,
          is_template: true,
          status: null,
          name: "KYC",
          signature_config: {
            title: "aaaa",
            review: false,
            orgIntegrationId: otherOrgSignatureIntegration.id,
            timezone: "Europe/Madrid",
            signersInfo: [
              {
                firstName: "Michael",
                lastName: "Scott",
                email: "michael@dundermifflin.com",
                contactId: 30,
              },
            ],
            allowAdditionalSigners: false,
          },
        })
      );

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $name: String
            $locale: PetitionLocale!
            $petitionId: GID
            $type: PetitionBaseType
          ) {
            createPetition(name: $name, locale: $locale, petitionId: $petitionId, type: $type) {
              signatureConfig {
                integration {
                  id
                }
                signers {
                  fullName
                  email
                }
                timezone
                title
                review
                allowAdditionalSigners
              }
            }
          }
        `,
        variables: {
          name: "Test signature",
          locale: "es",
          type: "PETITION",
          petitionId: toGlobalId("Petition", publicTemplateWithSignature.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createPetition).toEqual({
        signatureConfig: {
          integration: {
            id: toGlobalId("OrgIntegration", signatureIntegrations.find((i) => i.is_default)!.id),
          },
          signers: [],
          timezone: "Europe/Madrid",
          title: "aaaa",
          review: false,
          allowAdditionalSigners: true,
        },
      });
    });

    it("empty public_metadata when creating a petition from a public template", async () => {
      expect(petitions[8].public_metadata).not.toBeNull();
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID, $locale: PetitionLocale!) {
            createPetition(petitionId: $petitionId, locale: $locale) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petitions[8].id),
          locale: "es",
        },
      });

      expect(errors).toBeUndefined();

      //check through knex as we dont expose public_metadata on the Petition
      const [clonedPetition] = await mocks.knex
        .from("petition")
        .where("id", fromGlobalId(data?.createPetition.id, "Petition").id)
        .select("*");

      expect(clonedPetition.public_metadata).toBeNull();
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
        deadline: deadline,
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

    it("copies custom properties when creating a petition from a template", async () => {
      expect(petitions[7]).toMatchObject({
        custom_properties: { "client id": "12345" },
        is_template: true,
        template_public: false,
      });
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $name: String
            $locale: PetitionLocale!
            $petitionId: GID
            $type: PetitionBaseType
          ) {
            createPetition(name: $name, locale: $locale, petitionId: $petitionId, type: $type) {
              customProperties
            }
          }
        `,
        variables: {
          locale: "en",
          petitionId: toGlobalId("Petition", petitions[7].id),
          type: "PETITION",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createPetition).toEqual({
        customProperties: {
          "client id": "12345",
        },
      });
    });

    it("don't copy custom properties when creating a petition from a public template of another organization", async () => {
      const [publicTemplate] = await mocks.createRandomPetitions(
        otherOrg.id,
        otherUser.id,
        1,
        () => ({
          is_template: true,
          template_public: true,
          status: null,
          custom_properties: {
            "private org prop": "abcd",
          },
        })
      );

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $name: String
            $locale: PetitionLocale!
            $petitionId: GID
            $type: PetitionBaseType
          ) {
            createPetition(name: $name, locale: $locale, petitionId: $petitionId, type: $type) {
              customProperties
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
      expect(data?.createPetition).toEqual({ customProperties: {} });
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

    it("collaborators should not be able to create a blank petition", async () => {
      const { errors, data } = await testClient.withApiKey(collaboratorApiKey).mutate({
        mutation: gql`
          mutation ($locale: PetitionLocale!) {
            createPetition(locale: $locale) {
              id
            }
          }
        `,
        variables: {
          locale: "en",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("collaborators should be able to create a petition from a template", async () => {
      const { errors, data } = await testClient.withApiKey(collaboratorApiKey).mutate({
        mutation: gql`
          mutation ($locale: PetitionLocale!, $petitionId: GID) {
            createPetition(locale: $locale, petitionId: $petitionId) {
              id
            }
          }
        `,
        variables: {
          locale: "es",
          petitionId: toGlobalId("Petition", publicTemplate.id),
        },
      });

      expect(errors).toBeUndefined();
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
                  signers {
                    email
                  }
                  integration {
                    provider
                  }
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
          signers: [],
          integration: { provider: "SIGNATURIT" },
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

    it("copies default permissions when cloning a template", async () => {
      const [templateWithDefaultPermissions] = await mocks.createRandomPetitions(
        organization.id,
        sessionUser.id,
        1,
        () => ({ is_template: true, status: null })
      );
      const [user] = await mocks.createRandomUsers(organization.id, 1);
      await mocks.knex.from("template_default_permission").insert({
        template_id: templateWithDefaultPermissions.id,
        type: "WRITE",
        user_id: user.id,
      });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              id
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", templateWithDefaultPermissions.id)],
        },
      });

      const { id } = fromGlobalId(data?.clonePetitions[0].id, "Petition");
      expect(errors).toBeUndefined();
      const newTemplateDefaultPermissions = await mocks.knex
        .from("template_default_permission")
        .where("template_id", id)
        .whereNull("deleted_at");

      expect(newTemplateDefaultPermissions).toHaveLength(1);
    });

    it("copies custom properties when cloning a template", async () => {
      expect(petitions[7]).toMatchObject({
        is_template: true,
        template_public: false,
        custom_properties: { "client id": "12345" },
      });
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              customProperties
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", petitions[7].id)],
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.clonePetitions).toEqual([
        {
          customProperties: {
            "client id": "12345",
          },
        },
      ]);
    });

    it("collaborators should not be able to clone petitions", async () => {
      expect(petitions[0]).toMatchObject({
        is_template: false,
      });

      const { errors, data } = await testClient.withApiKey(collaboratorApiKey).mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              id
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", petitions[0].id)],
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("collaborators should not be able to clone templates", async () => {
      expect(petitions[7]).toMatchObject({
        is_template: true,
      });

      const { errors, data } = await testClient.withApiKey(collaboratorApiKey).mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              id
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", petitions[7].id)],
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("petition replies should not be cloned", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, sessionUser.id, 1);
      const [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "TEXT",
      }));
      await mocks.createRandomTextReply(field.id, 0, 1, () => ({
        petition_access_id: null,
        user_id: sessionUser.id,
      }));

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              fields {
                replies {
                  id
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", petition.id)],
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.clonePetitions).toEqual([
        {
          fields: [{ replies: [] }],
        },
      ]);
    });
  });

  describe("deletePetitions", () => {
    let petitionsToDelete: Petition[];
    beforeEach(async () => {
      petitionsToDelete = await mocks.createRandomPetitions(
        organization.id,
        sessionUser.id,
        2,
        petitionsBuilder(organization.id, signatureIntegrations[0].id)
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
        petitionsBuilder(organization.id, signatureIntegrations[0].id)
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
        deadline: new Date("2019-12-03T10:15:30.000Z"),
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
        () => ({ restricted_by_user_id: sessionUser.id, restricted_at: new Date() })
      );

      fields = await mocks.createRandomPetitionFields(readonlyPetition.id, 3, (i) => ({
        type: ["HEADING", "TEXT", "DYNAMIC_SELECT"][i] as PetitionFieldType,
      }));
    });

    it("should allow to edit the petition title", async () => {
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
      expect(errors).toBeUndefined();
      expect(data!.updatePetition).toEqual({
        id: toGlobalId("Petition", readonlyPetition.id),
      });
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
          data: { options: { hasCommentsEnabled: false } },
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
              id
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

    it("should allow unrestrict petition without password", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $isRestricted: Boolean!, $password: String) {
            updatePetitionRestriction(
              petitionId: $petitionId
              isRestricted: $isRestricted
              password: $password
            ) {
              id
              isRestricted
              isRestrictedWithPassword
            }
          }
        `,

        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          isRestricted: false,
        },
      });
      expect(errors).toBeUndefined();
      expect(data!.updatePetitionRestriction).toEqual({
        id: toGlobalId("Petition", readonlyPetition.id),
        isRestricted: false,
        isRestrictedWithPassword: false,
      });
    });

    it("should allow restrict petition with password", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $isRestricted: Boolean!, $password: String) {
            updatePetitionRestriction(
              petitionId: $petitionId
              isRestricted: $isRestricted
              password: $password
            ) {
              id
              isRestricted
              isRestrictedWithPassword
            }
          }
        `,

        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          isRestricted: true,
          password: "password",
        },
      });
      expect(errors).toBeUndefined();
      expect(data!.updatePetitionRestriction).toEqual({
        id: toGlobalId("Petition", readonlyPetition.id),
        isRestricted: true,
        isRestrictedWithPassword: true,
      });
    });

    it("should not allow unrestrict with wrong password", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $isRestricted: Boolean!, $password: String) {
            updatePetitionRestriction(
              petitionId: $petitionId
              isRestricted: $isRestricted
              password: $password
            ) {
              id
              isRestricted
              isRestrictedWithPassword
            }
          }
        `,

        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          isRestricted: false,
          password: "wrongPassword",
        },
      });
      expect(errors).toContainGraphQLError("INVALID_PETITION_RESTRICTION_PASSWORD");
      expect(data).toBeNull();
    });

    it("should allow unrestrict with correct password", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $isRestricted: Boolean!, $password: String) {
            updatePetitionRestriction(
              petitionId: $petitionId
              isRestricted: $isRestricted
              password: $password
            ) {
              id
              isRestricted
              isRestrictedWithPassword
            }
          }
        `,

        variables: {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          isRestricted: false,
          password: "password",
        },
      });
      expect(errors).toBeUndefined();
      expect(data!.updatePetitionRestriction).toEqual({
        id: toGlobalId("Petition", readonlyPetition.id),
        isRestricted: false,
        isRestrictedWithPassword: false,
      });
    });
  });

  describe("sendPetition", () => {
    let petition: Petition;
    let field: PetitionField;
    let usageLimit: OrganizationUsageLimit;
    let contacts: Contact[];
    beforeAll(async () => {
      contacts = await mocks.createRandomContacts(organization.id, 3, (i) => ({
        email: i === 0 ? sessionUser.email : faker.internet.email(),
      }));
      usageLimit = await mocks.createOrganizationUsageLimit(organization.id, "PETITION_SEND", 0);
    });
    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, sessionUser.id, 1);
      [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "TEXT",
        title: "Text reply",
      }));
    });

    afterAll(async () => {
      await mocks.knex.from("organization_usage_limit").delete();
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
            bulkSendPetition(
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

    it("doing a normal send should consume 1 credit", async () => {
      await mocks.knex.from("organization_usage_limit").where("id", usageLimit.id).update({
        used: 9,
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

    it("sending a petition to myself and then to another contact should consume 1 credit in total", async () => {
      await mocks.knex.from("organization_usage_limit").where("id", usageLimit.id).update({
        used: 0,
        limit: 1,
      });

      const { errors: errors1, data: data1 } = await testClient.mutate({
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

      expect(errors1).toBeUndefined();
      expect(data1?.sendPetition).toEqual({ result: "SUCCESS" });

      const firstSendUsageLimits = await mocks.knex
        .from("organization_usage_limit")
        .where("id", usageLimit.id)
        .select("id", "used", "limit");

      expect(firstSendUsageLimits).toEqual([{ id: usageLimit.id, used: 1, limit: 1 }]);

      const { errors: errors2, data: data2 } = await testClient.mutate({
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

      expect(errors2).toBeUndefined();
      expect(data2?.sendPetition).toEqual({ result: "SUCCESS" });

      const secondSendUsageLimits = await mocks.knex
        .from("organization_usage_limit")
        .where("id", usageLimit.id)
        .select("id", "used", "limit");

      expect(secondSendUsageLimits).toEqual([{ id: usageLimit.id, used: 1, limit: 1 }]);
    });

    it("adding an access to an already sent petition (not to me) should not consume any credits", async () => {
      await mocks.knex.from("organization_usage_limit").where("id", usageLimit.id).update({
        used: 0,
        limit: 1,
      });

      const { errors: errors1, data: data1 } = await testClient.mutate({
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

      expect(errors1).toBeUndefined();
      expect(data1?.sendPetition).toEqual({ result: "SUCCESS" });

      const firstSendUsageLimits = await mocks.knex
        .from("organization_usage_limit")
        .where("id", usageLimit.id)
        .select("id", "used", "limit");

      expect(firstSendUsageLimits).toEqual([{ id: usageLimit.id, used: 1, limit: 1 }]);

      const { errors: errors2, data: data2 } = await testClient.mutate({
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
          contactIds: [toGlobalId("Contact", contacts[2].id)],
          subject: "petition send subject",
          body: [],
        },
      });

      expect(errors2).toBeUndefined();
      expect(data2?.sendPetition).toEqual({ result: "SUCCESS" });

      const secondSendUsageLimits = await mocks.knex
        .from("organization_usage_limit")
        .where("id", usageLimit.id)
        .select("id", "used", "limit");

      expect(secondSendUsageLimits).toEqual([{ id: usageLimit.id, used: 1, limit: 1 }]);
    });

    it("doing a batch send with 2 groups should consume 2 credits", async () => {
      await mocks.knex.from("organization_usage_limit").where("id", usageLimit.id).update({
        used: 8,
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
            bulkSendPetition(
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
      expect(data?.bulkSendPetition).toEqual([{ result: "SUCCESS" }, { result: "SUCCESS" }]);

      const organizationCurrentUsageLimit = await mocks.knex
        .from("organization_usage_limit")
        .where("id", usageLimit.id)
        .select("id", "used", "limit");

      expect(organizationCurrentUsageLimit).toEqual([{ id: usageLimit.id, used: 10, limit: 10 }]);
    });

    it("bulk sends should also copy the petition replies and events", async () => {
      await mocks.knex.from("organization_usage_limit").where("id", usageLimit.id).update({
        used: 8,
        limit: 10,
      });

      const [reply] = await mocks.createRandomTextReply(field.id, 0, 1, () => ({
        petition_access_id: null,
        user_id: sessionUser.id,
      }));

      await mocks.knex("petition_event").insert({
        type: "REPLY_CREATED",
        petition_id: petition.id,
        data: {
          user_id: sessionUser.id,
          petition_field_id: field.id,
          petition_field_reply_id: reply.id,
        },
      });

      const [comment] = await mocks.createRandomCommentsFromUser(
        sessionUser.id,
        field.id,
        petition.id,
        1
      );

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionId: GID!
            $contactIdGroups: [[GID!]!]!
            $subject: String!
            $body: JSON!
          ) {
            bulkSendPetition(
              petitionId: $petitionId
              contactIdGroups: $contactIdGroups
              subject: $subject
              body: $body
            ) {
              petition {
                events(limit: 10, offset: 0) {
                  totalCount
                  items {
                    type
                  }
                }
                fields {
                  comments {
                    content
                    isUnread
                    isEdited
                    isInternal
                    author {
                      ... on User {
                        id
                      }
                    }
                  }
                  replies {
                    content
                    updatedBy {
                      __typename
                      ... on User {
                        id
                      }
                    }
                  }
                }
              }
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
      expect(data?.bulkSendPetition).toEqual([
        {
          petition: {
            events: {
              totalCount: 3,
              items: [
                { type: "MESSAGE_SENT" },
                { type: "ACCESS_ACTIVATED" },
                { type: "REPLY_CREATED" },
              ],
            },
            fields: [
              {
                comments: [
                  {
                    content: comment.content,
                    isUnread: false,
                    isEdited: false,
                    isInternal: false,
                    author: { id: toGlobalId("User", sessionUser.id) },
                  },
                ],
                replies: [
                  {
                    content: reply.content,
                    updatedBy: { __typename: "User", id: toGlobalId("User", sessionUser.id) },
                  },
                ],
              },
            ],
          },
        },
        {
          petition: {
            events: {
              totalCount: 4,
              items: [
                { type: "MESSAGE_SENT" },
                { type: "ACCESS_ACTIVATED" },
                { type: "REPLY_CREATED" },
                { type: "PETITION_CREATED" },
              ],
            },
            fields: [
              {
                comments: [],
                replies: [
                  {
                    content: reply.content,
                    updatedBy: { __typename: "User", id: toGlobalId("User", sessionUser.id) },
                  },
                ],
              },
            ],
          },
        },
      ]);
    });
  });

  describe("modifyPetitionCustomProperty", () => {
    let petition: Petition;
    beforeAll(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, sessionUser.id, 1, () => ({
        custom_properties: {
          "my-property": "12345",
        },
      }));
    });

    it("queries the petition custom properties", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($petitionId: GID!) {
            petition(id: $petitionId) {
              customProperties
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.petition).toEqual({
        customProperties: {
          "my-property": "12345",
        },
      });
    });

    it("throws error if passing a key with more than 100 chars", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $key: String!, $value: String) {
            modifyPetitionCustomProperty(petitionId: $petitionId, key: $key, value: $value) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          key: "x".repeat(101),
          value: "abcd",
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("throws error if passing a value with more than 1000 chars", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $key: String!, $value: String) {
            modifyPetitionCustomProperty(petitionId: $petitionId, key: $key, value: $value) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          key: "x",
          value: "x".repeat(1001),
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("throws error if trying to add more than 20 distinct properties", async () => {
      const customProperties: any = {};
      for (let i = 0; i < 20; i++) {
        customProperties[i] = ".";
      }
      await mocks
        .knex("petition")
        .where("id", petition.id)
        .update("custom_properties", customProperties);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $key: String!, $value: String) {
            modifyPetitionCustomProperty(petitionId: $petitionId, key: $key, value: $value) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          key: "x",
          value: "x",
        },
      });

      expect(errors).toContainGraphQLError("CUSTOM_PROPERTIES_LIMIT_ERROR");
      expect(data).toBeNull();
    });

    it("edits an already setted property", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $key: String!, $value: String) {
            modifyPetitionCustomProperty(petitionId: $petitionId, key: $key, value: $value) {
              customProperties
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          key: "15",
          value: "abcd",
        },
      });

      const newProperties: any = {};
      for (let i = 0; i < 20; i++) {
        newProperties[i] = i === 15 ? "abcd" : ".";
      }

      expect(errors).toBeUndefined();
      expect(data?.modifyPetitionCustomProperty.customProperties).toEqual(newProperties);
    });

    it("deletes a property", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $key: String!, $value: String) {
            modifyPetitionCustomProperty(petitionId: $petitionId, key: $key, value: $value) {
              customProperties
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          key: "15",
          value: null,
        },
      });

      const newProperties: any = {};
      for (let i = 0; i < 20; i++) {
        if (i !== 15) {
          newProperties[i] = ".";
        }
      }
      expect(errors).toBeUndefined();
      expect(data?.modifyPetitionCustomProperty.customProperties).toEqual(newProperties);
    });

    it("throws error if trying to modify properties on a private petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $key: String!, $value: String) {
            modifyPetitionCustomProperty(petitionId: $petitionId, key: $key, value: $value) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", otherPetition.id),
          key: "15",
          value: "123",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("completePetition", () => {
    let petitions: Petition[];
    let signatureIntegration: OrgIntegration;
    let contacts: Contact[];
    let otherOrgContact: Contact;
    let limit: OrganizationUsageLimit;
    let signatureLimit: OrganizationUsageLimit;
    let sharedSignaturitIntegration: OrgIntegration;
    let signers: { email: string; firstName: string; lastName: string }[];

    beforeAll(async () => {
      limit = await mocks.createOrganizationUsageLimit(organization.id, "PETITION_SEND", 10);
      signatureLimit = await mocks.createOrganizationUsageLimit(
        organization.id,
        "SIGNATURIT_SHARED_APIKEY",
        10
      );

      signers = [
        {
          email: faker.internet.email(undefined, undefined, "onparallel.com"),
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
        },
        {
          email: faker.internet.email(undefined, undefined, "onparallel.com"),
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
        },
        {
          email: faker.internet.email(undefined, undefined, "onparallel.com"),
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
        },
      ];

      contacts = await mocks.createRandomContacts(organization.id, 2, () => ({
        email: faker.internet.email(undefined, undefined, "onparallel.com"),
      }));

      [otherOrgContact] = await mocks.createRandomContacts(otherOrg.id, 1);

      [signatureIntegration] = await mocks.createOrgIntegration({
        org_id: organization.id,
        provider: "SIGNATURIT",
        type: "SIGNATURE",
        is_enabled: true,
        settings: {
          API_KEY: "<APIKEY>",
          ENVIRONMENT: "sandbox",
        },
      });
      [sharedSignaturitIntegration] = await mocks.createOrgIntegration({
        org_id: organization.id,
        provider: "SIGNATURIT",
        type: "SIGNATURE",
        is_enabled: true,
        settings: {
          API_KEY: "SHARED_PRODUCTION_APIKEY",
        },
      });

      petitions = await mocks.createRandomPetitions(organization.id, sessionUser.id, 3, (i) => ({
        status: "DRAFT",
        signature_config:
          i === 1
            ? {
                orgIntegrationId: signatureIntegration.id,
                signersInfo: [],
                timezone: "Europe/Madrid",
                title: "Signature!",
                review: false,
                allowAdditionalSigners: false,
              }
            : i === 2
            ? {
                orgIntegrationId: sharedSignaturitIntegration.id,
                signersInfo: [],
                timezone: "Europe/Madrid",
                title: "Signature!",
                review: false,
                allowAdditionalSigners: false,
              }
            : null,
      }));
    });

    beforeEach(async () => {
      await mocks.knex
        .from("organization_usage_limit")
        .whereIn("id", [limit.id, signatureLimit.id])
        .update({
          limit: 10,
          used: 0,
        });
    });

    afterAll(async () => {
      await mocks.knex.from("organization_usage_limit").delete();
    });

    it("sends error if the user is out of send credits", async () => {
      await mocks.knex.from("organization_usage_limit").where("id", limit.id).update({
        limit: 10,
        used: 10,
      });
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!) {
            completePetition(petitionId: $petitionId) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petitions[0].id),
        },
      });

      expect(errors).toContainGraphQLError("PETITION_SEND_CREDITS_ERROR");
      expect(data).toBeNull();
    });

    it("completes the petition as a user if it doesn't have a signature configured", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!) {
            completePetition(petitionId: $petitionId) {
              id
              status
              events(limit: 100, offset: 0) {
                totalCount
                items {
                  type
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petitions[0].id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.completePetition).toEqual({
        id: toGlobalId("Petition", petitions[0].id),
        status: "COMPLETED",
        events: { totalCount: 1, items: [{ type: "PETITION_COMPLETED" }] },
      });

      const petitionEvents = await mocks.knex
        .from<PetitionEvent>("petition_event")
        .where("petition_id", petitions[0].id)
        .select("petition_id", "type", "data");
      expect(petitionEvents).toEqual([
        {
          petition_id: petitions[0].id,
          type: "PETITION_COMPLETED",
          data: { user_id: sessionUser.id },
        },
      ]);
    });

    it("sends error if trying to complete the petition with signature configured and no signers info", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!) {
            completePetition(petitionId: $petitionId) {
              id
              status
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petitions[1].id),
        },
      });

      expect(errors).toContainGraphQLError("REQUIRED_SIGNER_INFO_ERROR");
      expect(data).toBeNull();
    });

    it("completes the petition as a user and starts a signature request", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $additionalSigners: [PublicPetitionSignerDataInput!]) {
            completePetition(petitionId: $petitionId, additionalSigners: $additionalSigners) {
              id
              status
              currentSignatureRequest {
                id
                environment
                status
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
        variables: {
          petitionId: toGlobalId("Petition", petitions[1].id),
          additionalSigners: signers,
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.completePetition).toMatchObject({
        id: toGlobalId("Petition", petitions[1].id),
        status: "COMPLETED",
        currentSignatureRequest: {
          environment: "DEMO",
          status: "ENQUEUED",
        },
        events: {
          totalCount: 2,
          items: [{ type: "PETITION_COMPLETED" }, { type: "SIGNATURE_STARTED" }],
        },
      });

      // update enqueued signature request to have status "PROCESSED" (skip ENQUEUED, PROCESSING cancel check error)
      await mocks.knex
        .from<PetitionSignatureRequest>("petition_signature_request")
        .where(
          "id",
          fromGlobalId(
            data!.completePetition.currentSignatureRequest.id,
            "PetitionSignatureRequest"
          ).id
        )
        .update("status", "PROCESSED");
    });

    it("cancels the pending signature process when completing a second time", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionId: GID!
            $additionalSigners: [PublicPetitionSignerDataInput!]
            $message: String
          ) {
            completePetition(
              petitionId: $petitionId
              additionalSigners: $additionalSigners
              message: $message
            ) {
              id
              status
              signatureRequests {
                status
              }
              currentSignatureRequest {
                status
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
        variables: {
          petitionId: toGlobalId("Petition", petitions[1].id),
          additionalSigners: signers,
          message: "email body",
        },
      });

      expect(errors).toBeUndefined();

      expect(data?.completePetition).toEqual({
        id: toGlobalId("Petition", petitions[1].id),
        status: "COMPLETED",
        signatureRequests: [{ status: "ENQUEUED" }, { status: "CANCELLED" }],
        currentSignatureRequest: { status: "ENQUEUED" },
        events: {
          totalCount: 5,
          items: [
            { type: "PETITION_COMPLETED" },
            { type: "SIGNATURE_STARTED" },
            { type: "SIGNATURE_CANCELLED" },
            { type: "PETITION_COMPLETED" },
            { type: "SIGNATURE_STARTED" },
          ],
        },
      });
    });

    it("when using our shared apiKey and signature usage reached limit, complete anyways but don't start signature", async () => {
      await mocks.knex("petition_signature_request").delete();
      await mocks
        .knex("organization_usage_limit")
        .update({ limit: 10, used: 10 })
        .where("id", signatureLimit.id);
      const petition = petitions[2];

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $additionalSigners: [PublicPetitionSignerDataInput!]) {
            completePetition(petitionId: $petitionId, additionalSigners: $additionalSigners) {
              id
              status
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          additionalSigners: signers,
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.completePetition).toEqual({
        id: toGlobalId("Petition", petition.id),
        status: "COMPLETED",
      });
      // make sure signature didn't start
      const [signatureRequest] = await mocks
        .knex("petition_signature_request")
        .where("petition_id", petition.id)
        .select("*");
      expect(signatureRequest).toBeUndefined();

      const [event] = await mocks
        .knex("petition_event")
        .where("petition_id", petition.id)
        .where("type", "SIGNATURE_CANCELLED")
        .select("*");

      expect(event).toMatchObject({
        type: "SIGNATURE_CANCELLED",
        data: {
          cancel_reason: "REQUEST_ERROR",
          cancel_data: {
            error: "The signature request could not be started due to lack of signature credits",
            error_code: "INSUFFICIENT_SIGNATURE_CREDITS",
          },
        },
        petition_id: petition.id,
      });
    });

    it("don't use credits when sending a signature with a personal apiKey", async () => {
      await mocks.knex("petition_signature_request").delete();
      await mocks.knex.from("organization_usage_limit").where("id", signatureLimit.id).update({
        limit: 10,
        used: 10,
      });
      await mocks
        .knex("petition")
        .update({
          signature_config: {
            orgIntegrationId: signatureIntegration.id,
            signersInfo: [
              { firstName: "Mariano", lastName: "Rodriguez", email: "mariano@onparallel.com" },
            ],
            timezone: "Europe/Madrid",
            title: "Signature!",
            review: false,
            allowAdditionalSigners: false,
          },
        })
        .where("id", petitions[1].id);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!) {
            completePetition(petitionId: $petitionId) {
              id
              status
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petitions[1].id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.completePetition).toEqual({
        id: toGlobalId("Petition", petitions[1].id),
        status: "COMPLETED",
      });

      const [newLimit] = await mocks
        .knex("organization_usage_limit")
        .where("id", signatureLimit.id)
        .select("*");

      expect(newLimit).toMatchObject({
        used: 10,
        limit: 10,
      });
    });

    it("completing the petition more than once should not consume more than 1 PETITION_SEND credit", async () => {
      const [petition] = await mocks.createRandomPetitions(
        organization.id,
        sessionUser.id,
        1,
        () => ({ status: "DRAFT" })
      );
      await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "TEXT",
        optional: true,
      }));
      const { errors: errors1, data: data1 } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!) {
            completePetition(petitionId: $petitionId) {
              id
              status
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
        },
      });
      expect(errors1).toBeUndefined();
      expect(data1?.completePetition).toEqual({
        id: toGlobalId("Petition", petition.id),
        status: "COMPLETED",
      });

      await mocks.knex("petition").where("id", petition.id).update("status", "PENDING");

      const { errors: errors2, data: data2 } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!) {
            completePetition(petitionId: $petitionId) {
              id
              status
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
        },
      });

      expect(errors2).toBeUndefined();
      expect(data2?.completePetition).toEqual({
        id: toGlobalId("Petition", petition.id),
        status: "COMPLETED",
      });

      const [newLimits] = await mocks
        .knex("organization_usage_limit")
        .where("id", limit.id)
        .select("*");
      expect(newLimits).toMatchObject({
        limit_name: "PETITION_SEND",
        used: 1,
        limit: 10,
      });
    });
  });

  describe("reopenPetition", () => {
    let petitions: Petition[];

    beforeEach(async () => {
      const [contact] = await mocks.createRandomContacts(organization.id, 1);
      petitions = await mocks.createRandomPetitions(organization.id, sessionUser.id, 2, () => ({
        status: "COMPLETED",
      }));

      await mocks.createPetitionAccess(
        petitions[1].id,
        sessionUser.id,
        [contact.id],
        sessionUser.id
      );
    });

    it("reopening a petition without recipients should set it in DRAFT", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!) {
            reopenPetition(petitionId: $petitionId) {
              id
              status
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petitions[0].id),
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.reopenPetition).toEqual({
        id: toGlobalId("Petition", petitions[0].id),
        status: "DRAFT",
      });
    });

    it("reopening a petition with recipients should set it in PENDING", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!) {
            reopenPetition(petitionId: $petitionId) {
              id
              status
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petitions[1].id),
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.reopenPetition).toEqual({
        id: toGlobalId("Petition", petitions[1].id),
        status: "PENDING",
      });
    });
  });
});

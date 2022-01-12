import { gql } from "graphql-request";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Contact,
  Organization,
  OrganizationUsageLimit,
  Petition,
  PublicPetitionLink,
  User,
  UserGroup,
} from "../../db/__types";
import { EMAILS, IEmailsService } from "../../services/emails";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";
import faker from "faker";

describe("GraphQL/PublicPetitionLink", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let knex: Knex;

  let user: User;
  let organization: Organization;
  let contact: Contact;
  let templates: Petition[];
  let publicPetitionLink: PublicPetitionLink;

  beforeAll(async () => {
    testClient = await initServer();
    knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [contact] = await mocks.createRandomContacts(organization.id, 1);

    templates = await mocks.createRandomPetitions(organization.id, user.id, 2, () => ({
      is_template: true,
      status: null,
      reminders_active: true,
      reminders_config: {
        time: "17:30",
        offset: 5,
        timezone: "Europe/Madrid",
        weekdaysOnly: true,
      },
    }));

    await mocks.createRandomPetitionFields(templates[0].id, 1, () => ({ type: "TEXT" }));
    await mocks.createRandomPetitionFields(templates[1].id, 1, () => ({ type: "TEXT" }));

    publicPetitionLink = await mocks.createRandomPublicPetitionLink(
      templates[0].id,
      user.id,
      () => ({
        slug: "public-link-slug",
        is_active: true,
      })
    );
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("publicPetitionLinkBySlug", () => {
    it("should query a public link by slug", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($slug: ID!) {
            publicPetitionLinkBySlug(slug: $slug) {
              title
              description
              organization {
                logoUrl
                name
              }
            }
          }
        `,
        variables: {
          slug: "public-link-slug",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.publicPetitionLinkBySlug).toEqual({
        title: publicPetitionLink.title,
        description: publicPetitionLink.description,
        organization: {
          logoUrl: null,
          name: "Parallel",
        },
      });
    });

    it("should return null if the slug is not found", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($slug: ID!) {
            publicPetitionLinkBySlug(slug: $slug) {
              title
              description
              organization {
                logoUrl
                name
              }
            }
          }
        `,
        variables: {
          slug: "unknown",
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.publicPetitionLinkBySlug).toBeNull();
    });

    it("should return null if the link is inactive", async () => {
      await knex
        .from("public_petition_link")
        .where("id", publicPetitionLink.id)
        .update("is_active", false);

      const { errors, data } = await testClient.query({
        query: gql`
          query ($slug: ID!) {
            publicPetitionLinkBySlug(slug: $slug) {
              title
            }
          }
        `,
        variables: { slug: publicPetitionLink.slug },
      });

      expect(errors).toBeUndefined();
      expect(data?.publicPetitionLinkBySlug).toBeNull();

      await knex
        .from("public_petition_link")
        .where("id", publicPetitionLink.id)
        .update("is_active", true);
    });
  });

  describe("getSlugForPublicPetitionLink", () => {
    it("should return a random valid slug", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($petitionName: String) {
            getSlugForPublicPetitionLink(petitionName: $petitionName)
          }
        `,
        variables: {
          petitionName: "public-link-slug", // use a slug that is already taken
        },
      });

      expect(errors).toBeUndefined();
      const slug = data?.getSlugForPublicPetitionLink as string;
      expect(slug.length).toBeGreaterThanOrEqual(8);
      expect(slug.length).toBeLessThanOrEqual(30);
      expect(slug.startsWith("public-link-slug")).toEqual(true);
      expect(slug.match(/^[a-z0-9-]*$/)).toBeDefined();
    });

    it("should return the proposed slug", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($petitionName: String) {
            getSlugForPublicPetitionLink(petitionName: $petitionName)
          }
        `,
        variables: {
          petitionName: "this-slug-should-be-valid",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.getSlugForPublicPetitionLink).toEqual("this-slug-should-be-valid");
    });

    it("should convert the proposed slug to a valid set of chars", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($petitionName: String) {
            getSlugForPublicPetitionLink(petitionName: $petitionName)
          }
        `,
        variables: {
          petitionName: "Know Your Customer (KYC)👨🏻‍💻",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.getSlugForPublicPetitionLink).toEqual("know-your-customer-kyc");
    });
  });

  describe("isValidPublicPetitionLinkSlug", () => {
    it("should be a valid slug", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($slug: String!) {
            isValidPublicPetitionLinkSlug(slug: $slug)
          }
        `,
        variables: {
          slug: "x".repeat(10),
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.isValidPublicPetitionLinkSlug).toEqual(true);
    });

    it("should throw error if passing a slug of less than 8 chars", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($slug: String!) {
            isValidPublicPetitionLinkSlug(slug: $slug)
          }
        `,
        variables: {
          slug: "aaa",
        },
      });
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        extra: { code: "MIN_SLUG_LENGTH_VALIDATION_ERROR" },
      });
      expect(data).toBeNull();
    });

    it("should throw error if passing a slug of more than 30 chars", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($slug: String!) {
            isValidPublicPetitionLinkSlug(slug: $slug)
          }
        `,
        variables: {
          slug: "x".repeat(31),
        },
      });
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        extra: { code: "MAX_SLUG_LENGTH_VALIDATION_ERROR" },
      });
      expect(data).toBeNull();
    });

    it("should throw error if passing invalid characters", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($slug: String!) {
            isValidPublicPetitionLinkSlug(slug: $slug)
          }
        `,
        variables: {
          slug: "TEST@onparallel.com",
        },
      });
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        extra: { code: "INVALID_SLUG_CHARS_VALIDATION_ERROR" },
      });
      expect(data).toBeNull();
    });

    it("should throw error if the slug is already taken", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($slug: String!) {
            isValidPublicPetitionLinkSlug(slug: $slug)
          }
        `,
        variables: {
          slug: "public-link-slug",
        },
      });
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        extra: { code: "SLUG_ALREADY_TAKEN_VALIDATION_ERROR" },
      });
      expect(data).toBeNull();
    });
  });

  describe("publicCreateAndSendPetitionFromPublicLink", () => {
    let petitionSendLimit: OrganizationUsageLimit;
    beforeAll(async () => {
      petitionSendLimit = await mocks.createOrganizationUsageLimit(
        organization.id,
        "PETITION_SEND",
        100
      );
    });
    it("creates a petition via a public link and sends it to the provided email", async () => {
      const emailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPublicPetitionLinkAccessEmail"
      );

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $slug: ID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              slug: $slug
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          slug: publicPetitionLink.slug,
          contactFirstName: "Roger",
          contactLastName: "Waters",
          contactEmail: "rogerwaters@gmail.com",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.publicCreateAndSendPetitionFromPublicLink).toEqual("SUCCESS");

      // a new contact should be created on the organization
      const contacts = await knex
        .from("contact")
        .where({ email: "rogerwaters@gmail.com", org_id: organization.id, deleted_at: null })
        .select("*");
      expect(contacts.length).toEqual(1);

      // the contact should have an active access on the petition
      const accesses = await knex
        .from("petition_access")
        .where({ contact_id: contacts[0].id, status: "ACTIVE" })
        .select("*");
      expect(accesses).toMatchObject([
        {
          // generated access should have enabled reminders
          reminders_active: true,
          reminders_config: {
            time: "17:30",
            offset: 5,
            timezone: "Europe/Madrid",
            weekdaysOnly: true,
          },
        },
      ]);

      const petitionId = accesses[0].petition_id;

      // link owner should have permissions on the petition
      const petitionPermissions = await knex
        .from("petition_permission")
        .where({ petition_id: petitionId });
      expect(petitionPermissions).toMatchObject([
        {
          user_id: user.id,
          type: "OWNER",
          petition_id: petitionId,
        },
      ]);

      // petition should be created through the public link
      const [petition] = await knex.from("petition").where({ id: petitionId });
      expect(petition).toMatchObject({
        is_template: false,
        from_public_petition_link_id: publicPetitionLink.id,
        org_id: organization.id,
        reminders_active: true,
        reminders_config: {
          time: "17:30",
          offset: 5,
          timezone: "Europe/Madrid",
          weekdaysOnly: true,
        },
      });

      // email with access to the petition should be sent to contact
      expect(emailSpy).toHaveBeenCalledTimes(1);
    });

    it("uses existing contact if the email is already registered in the link owner organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $slug: ID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              slug: $slug
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          slug: publicPetitionLink.slug,
          contactFirstName: "Roger",
          contactLastName: "Waters",
          contactEmail: contact.email,
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.publicCreateAndSendPetitionFromPublicLink).toEqual("SUCCESS");

      const contacts = await knex
        .from("contact")
        .where({ email: contact.email, org_id: organization.id, deleted_at: null })
        .select("*");
      expect(contacts).toMatchObject([contact]);
    });

    it("sends error if the public link is inactive", async () => {
      await knex
        .from("public_petition_link")
        .where("id", publicPetitionLink.id)
        .update({ is_active: false });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $slug: ID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              slug: $slug
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          slug: publicPetitionLink.slug,
          contactFirstName: contact.first_name,
          contactLastName: contact.last_name,
          contactEmail: contact.email,
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();

      await knex
        .from("public_petition_link")
        .where("id", publicPetitionLink.id)
        .update({ is_active: true });
    });

    it("inserts user permissions based on the public link users", async () => {
      const [otherUser] = await mocks.createRandomUsers(organization.id, 1);
      await knex.from("template_default_permission").insert({
        template_id: publicPetitionLink.template_id,
        user_id: otherUser.id,
        type: "READ",
        is_subscribed: false,
        position: 0,
      });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $slug: ID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              slug: $slug
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          slug: publicPetitionLink.slug,
          contactFirstName: "Bojack",
          contactLastName: "Horseman",
          contactEmail: "bojack@test.com",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.publicCreateAndSendPetitionFromPublicLink).toEqual("SUCCESS");

      const [lastPetition] = await knex
        .from("petition")
        .where("from_public_petition_link_id", publicPetitionLink.id)
        .select("*")
        .orderBy("created_at", "desc");

      const permissions = await knex
        .from("petition_permission")
        .where({ petition_id: lastPetition.id, deleted_at: null })
        .select("*")
        .orderBy("type", "asc");

      expect(permissions).toMatchObject([
        { type: "OWNER", user_id: user.id, petition_id: lastPetition.id, is_subscribed: true },
        { type: "READ", user_id: otherUser.id, petition_id: lastPetition.id, is_subscribed: false },
      ]);
    });

    it("sends error if the contact already started a petition and force flag is not passed", async () => {
      // same request as previous test
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $slug: ID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              slug: $slug
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          slug: publicPetitionLink.slug,
          contactFirstName: "Bojack",
          contactLastName: "Horseman",
          contactEmail: "bojack@test.com",
        },
      });

      expect(errors).toContainGraphQLError("PUBLIC_LINK_ACCESS_ALREADY_CREATED_ERROR");
      expect(data).toBeNull();
    });

    it("creates a new petition if the contact already started one but passed force flag", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $slug: ID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              slug: $slug
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
              force: true
            )
          }
        `,
        variables: {
          slug: publicPetitionLink.slug,
          contactFirstName: "Bojack",
          contactLastName: "Horseman",
          contactEmail: "bojack@test.com",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.publicCreateAndSendPetitionFromPublicLink).toEqual("SUCCESS");
    });

    it("creates a new petition if the contact already completed the previous petition", async () => {
      await knex
        .from("petition")
        .where("from_public_petition_link_id", publicPetitionLink.id)
        .update("status", "COMPLETED");

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $slug: ID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              slug: $slug
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          slug: publicPetitionLink.slug,
          contactFirstName: "Bojack",
          contactLastName: "Horseman",
          contactEmail: "bojack@test.com",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.publicCreateAndSendPetitionFromPublicLink).toEqual("SUCCESS");
    });

    it("sends error if trying to start a public link without petition_send credits", async () => {
      await mocks
        .knex("organization_usage_limit")
        .where("id", petitionSendLimit.id)
        .update({ used: 10, limit: 10 });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $slug: ID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              slug: $slug
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          slug: publicPetitionLink.slug,
          contactFirstName: faker.name.firstName(),
          contactLastName: faker.name.lastName(),
          contactEmail: faker.internet.email(),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();

      await mocks
        .knex("organization_usage_limit")
        .where("id", petitionSendLimit.id)
        .update({ used: 0, limit: 100 });
    });
  });

  describe("publicSendReminder", () => {
    let newTemplate: Petition;
    let newPetitionLink: PublicPetitionLink;
    beforeAll(async () => {
      [newTemplate] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        status: null,
        is_template: true,
      }));
      await mocks.createRandomPetitionFields(newTemplate.id, 1, () => ({ type: "TEXT" }));
      newPetitionLink = await mocks.createRandomPublicPetitionLink(newTemplate.id, user.id, () => ({
        slug: "1234",
      }));
    });

    it("fails if the contact didn't previously start a petition through the public link", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($slug: ID!, $contactEmail: String!) {
            publicSendReminder(slug: $slug, contactEmail: $contactEmail)
          }
        `,
        variables: {
          slug: newPetitionLink.slug,
          contactEmail: "contact@gmail.com",
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.publicSendReminder).toEqual("FAILURE");
    });

    it("sends a reminder to the contact email if a petition is already created", async () => {
      const emailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionReminderEmail"
      );

      const { errors: createErrors } = await testClient.mutate({
        mutation: gql`
          mutation (
            $slug: ID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              slug: $slug
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          slug: newPetitionLink.slug,
          contactFirstName: "Roger",
          contactLastName: "Waters",
          contactEmail: "rogerwaters@gmail.com",
        },
      });
      expect(createErrors).toBeUndefined();
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($slug: ID!, $contactEmail: String!) {
            publicSendReminder(slug: $slug, contactEmail: $contactEmail)
          }
        `,
        variables: {
          slug: newPetitionLink.slug,
          contactEmail: "rogerwaters@gmail.com",
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.publicSendReminder).toEqual("SUCCESS");
      expect(emailSpy).toHaveBeenCalledTimes(1);
    });

    it("fails if the access already consumed every reminder left", async () => {
      const [latestAccess] = await knex
        .from("petition_access")
        .select("*")
        .orderBy("created_at", "desc");

      await knex.from("petition_access").where("id", latestAccess.id).update({ reminders_left: 0 });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($slug: ID!, $contactEmail: String!) {
            publicSendReminder(slug: $slug, contactEmail: $contactEmail)
          }
        `,
        variables: {
          slug: newPetitionLink.slug,
          contactEmail: "rogerwaters@gmail.com",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.publicSendReminder).toEqual("FAILURE");

      await knex.from("petition_access").where("id", latestAccess.id).update({ reminders_left: 9 });
    });

    it("sends error if the contact opted out of the reminder emails", async () => {
      const [latestAccess] = await knex
        .from("petition_access")
        .select("*")
        .orderBy("created_at", "desc");

      await knex
        .from("petition_access")
        .where("id", latestAccess.id)
        .update({ reminders_opt_out: true });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($slug: ID!, $contactEmail: String!) {
            publicSendReminder(slug: $slug, contactEmail: $contactEmail)
          }
        `,
        variables: {
          slug: newPetitionLink.slug,
          contactEmail: "rogerwaters@gmail.com",
        },
      });

      expect(errors).toContainGraphQLError("REMINDER_OPTED_OUT_ERROR");
      expect(data).toBeNull();

      await knex
        .from("petition_access")
        .where("id", latestAccess.id)
        .update({ reminders_opt_out: false });
    });

    it("sends error if the contact already asked for a reminder in the past 24 hs", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($slug: ID!, $contactEmail: String!) {
            publicSendReminder(slug: $slug, contactEmail: $contactEmail)
          }
        `,
        variables: {
          slug: newPetitionLink.slug,
          contactEmail: "rogerwaters@gmail.com",
        },
      });

      expect(errors).toContainGraphQLError("REMINDER_ALREADY_SENT_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("createPublicPetitionLink", () => {
    let otherUsers: User[];
    let privateTemplate: Petition;
    let petition: Petition;

    let userGroup: UserGroup;

    beforeAll(async () => {
      await mocks.knex
        .from("petition")
        .whereNotNull("from_public_petition_link_id")
        .update("from_public_petition_link_id", null);
      await mocks.knex.from("public_petition_link_user").delete();
      await mocks.knex.from("public_petition_link").delete();

      otherUsers = await mocks.createRandomUsers(organization.id, 2);
      [privateTemplate] = await mocks.createRandomPetitions(
        organization.id,
        otherUsers[0].id,
        1,
        () => ({
          is_template: true,
          status: null,
        })
      );
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      [userGroup] = await mocks.createUserGroups(1, organization.id);
      await mocks.insertUserGroupMembers(userGroup.id, [otherUsers[0].id, otherUsers[1].id]);
    });

    it("sends error if user does not have access to the template", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($templateId: GID!, $title: String!, $description: String!, $ownerId: GID!) {
            createPublicPetitionLink(
              templateId: $templateId
              title: $title
              description: $description
              ownerId: $ownerId
            ) {
              id
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", privateTemplate.id),
          title: "link title",
          description: "link description",
          ownerId: toGlobalId("User", otherUsers[0].id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if trying to pass a petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($templateId: GID!, $title: String!, $description: String!, $ownerId: GID!) {
            createPublicPetitionLink(
              templateId: $templateId
              title: $title
              description: $description
              ownerId: $ownerId
            ) {
              id
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", petition.id),
          title: "link title",
          description: "link description",
          ownerId: toGlobalId("User", user.id),
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("creates a public link with user as owner and other permissions", async () => {
      const { errors: errors1, data: data1 } = await testClient.mutate({
        mutation: gql`
          mutation ($templateId: GID!, $permissions: [UserOrUserGroupPermissionInput!]!) {
            updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
              id
              defaultPermissions {
                isSubscribed
                permissionType
                ... on TemplateDefaultUserPermission {
                  user {
                    id
                  }
                }
                ... on TemplateDefaultUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", templates[0].id),
          permissions: [
            {
              userId: toGlobalId("User", otherUsers[0].id),
              permissionType: "READ",
              isSubscribed: true,
            },
            {
              userGroupId: toGlobalId("UserGroup", userGroup.id),
              permissionType: "WRITE",
              isSubscribed: true,
            },
          ],
        },
      });
      expect(data1?.updateTemplateDefaultPermissions).toEqual({
        id: toGlobalId("Petition", templates[0].id),
        defaultPermissions: [
          {
            isSubscribed: true,
            permissionType: "READ",
            user: { id: toGlobalId("User", otherUsers[0].id) },
          },
          {
            isSubscribed: true,
            permissionType: "WRITE",
            group: { id: toGlobalId("UserGroup", userGroup.id) },
          },
        ],
      });
      expect(errors1).toBeUndefined();
      const { errors: errors2, data: data2 } = await testClient.mutate({
        mutation: gql`
          mutation (
            $templateId: GID!
            $title: String!
            $description: String!
            $ownerId: GID!
            $slug: String
          ) {
            createPublicPetitionLink(
              templateId: $templateId
              title: $title
              description: $description
              ownerId: $ownerId
              slug: $slug
            ) {
              isActive
              slug
              owner {
                id
              }
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", templates[0].id),
          title: "link title",
          description: "link description",
          ownerId: toGlobalId("User", user.id),
          slug: "this-is-my-valid-slug",
        },
      });
      expect(errors2).toBeUndefined();
      expect(data2?.createPublicPetitionLink).toEqual({
        isActive: true,
        slug: "this-is-my-valid-slug",
        owner: { id: toGlobalId("User", user.id) },
      });
    });

    it("sends error if trying to create a second public link on the same template", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($templateId: GID!, $title: String!, $description: String!, $ownerId: GID!) {
            createPublicPetitionLink(
              templateId: $templateId
              title: $title
              description: $description
              ownerId: $ownerId
            ) {
              id
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", templates[0].id),
          title: "link title",
          description: "link description",
          ownerId: toGlobalId("User", user.id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if passing an invalid slug", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $templateId: GID!
            $title: String!
            $description: String!
            $ownerId: GID!
            $slug: String
          ) {
            createPublicPetitionLink(
              templateId: $templateId
              title: $title
              description: $description
              ownerId: $ownerId
              slug: $slug
            ) {
              id
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", templates[1].id),
          title: "link title",
          description: "link description",
          ownerId: toGlobalId("User", user.id),
          slug: "you cant use this slug!!!",
        },
      });
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        extra: { code: "INVALID_SLUG_CHARS_VALIDATION_ERROR" },
      });
      expect(data).toBeNull();
    });
  });

  describe("updatePublicPetitionLink", () => {
    let privateTemplate: Petition;
    let otherUser: User;
    let privatePublicPetitionLink: PublicPetitionLink;
    let template: Petition;
    let publicPetitionLink: PublicPetitionLink;

    beforeAll(async () => {
      [otherUser] = await mocks.createRandomUsers(organization.id, 1);
      [privateTemplate] = await mocks.createRandomPetitions(
        organization.id,
        otherUser.id,
        1,
        () => ({ is_template: true, status: null })
      );
      privatePublicPetitionLink = await mocks.createRandomPublicPetitionLink(
        privateTemplate.id,
        otherUser.id,
        () => ({ slug: "aaaaa" })
      );

      [template] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        is_template: true,
        status: null,
      }));
      publicPetitionLink = await mocks.createRandomPublicPetitionLink(template.id, user.id, () => ({
        slug: "bbbb",
      }));
    });

    it("sends error if user does not have access to the template with the public link", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($publicPetitionLinkId: GID!, $isActive: Boolean) {
            updatePublicPetitionLink(
              publicPetitionLinkId: $publicPetitionLinkId
              isActive: $isActive
            ) {
              id
            }
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", privatePublicPetitionLink.id),
          isActive: false,
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("updates the owner of the public link", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($publicPetitionLinkId: GID!, $ownerId: GID) {
            updatePublicPetitionLink(
              publicPetitionLinkId: $publicPetitionLinkId
              ownerId: $ownerId
            ) {
              id
              owner {
                id
              }
            }
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", publicPetitionLink.id),
          ownerId: toGlobalId("User", otherUser.id),
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.updatePublicPetitionLink).toEqual({
        id: toGlobalId("PublicPetitionLink", publicPetitionLink.id),
        owner: { id: toGlobalId("User", otherUser.id) },
      });
    });

    it("sets the public link as inactive", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($publicPetitionLinkId: GID!, $isActive: Boolean) {
            updatePublicPetitionLink(
              publicPetitionLinkId: $publicPetitionLinkId
              isActive: $isActive
            ) {
              id
              isActive
            }
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", publicPetitionLink.id),
          isActive: false,
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.updatePublicPetitionLink).toEqual({
        id: toGlobalId("PublicPetitionLink", publicPetitionLink.id),
        isActive: false,
      });
    });

    it("should update the slug of an active link", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($publicPetitionLinkId: GID!, $slug: String) {
            updatePublicPetitionLink(publicPetitionLinkId: $publicPetitionLinkId, slug: $slug) {
              id
              slug
            }
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", publicPetitionLink.id),
          slug: "valid-slug",
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.updatePublicPetitionLink).toEqual({
        id: toGlobalId("PublicPetitionLink", publicPetitionLink.id),
        slug: "valid-slug",
      });
    });

    it("sends error if trying to set an invalid slug", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($publicPetitionLinkId: GID!, $slug: String) {
            updatePublicPetitionLink(publicPetitionLinkId: $publicPetitionLinkId, slug: $slug) {
              id
              slug
            }
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", publicPetitionLink.id),
          slug: "aaa",
        },
      });
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        extra: { code: "MIN_SLUG_LENGTH_VALIDATION_ERROR" },
      });
      expect(data).toBeNull();
    });
  });
});

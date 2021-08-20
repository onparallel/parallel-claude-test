import { gql } from "graphql-request";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Contact, Organization, Petition, PublicPetitionLink, User } from "../../db/__types";
import { EMAILS, IEmailsService } from "../../services/emails";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/PublicPetitionLink", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let knex: Knex;

  let user: User;
  let organization: Organization;
  let contact: Contact;
  let template: Petition;
  let publicPetitionLink: PublicPetitionLink;

  beforeAll(async () => {
    testClient = await initServer();
    knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1, () => ({ name: "Parallel" }));
    [contact] = await mocks.createRandomContacts(organization.id, 1);
    [user] = await mocks.createRandomUsers(organization.id, 1);
    [template] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
      is_template: true,
      status: null,
    }));

    await mocks.createRandomPetitionFields(template.id, 1, () => ({ type: "TEXT" }));

    publicPetitionLink = await mocks.createRandomPublicPetitionLink(template.id, user.id, () => ({
      slug: "public-link-slug",
      is_active: true,
    }));
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("publicPetitionLinkBySlug", () => {
    it("should query a public link by slug", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($slug: String!) {
            publicPetitionLinkBySlug(slug: $slug) {
              id
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
        id: toGlobalId("PublicPetitionLink", publicPetitionLink.id),
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
          query ($slug: String!) {
            publicPetitionLinkBySlug(slug: $slug) {
              id
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
  });

  describe("publicCreateAndSendPetitionFromPublicLink", () => {
    it("creates a petition via a public link and sends it to the provided email", async () => {
      const emailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPublicPetitionLinkAccessEmail"
      );

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $publicPetitionLinkId: GID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              publicPetitionLinkId: $publicPetitionLinkId
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", publicPetitionLink.id),
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
      expect(accesses.length).toEqual(1);

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
      });

      // email with access to the petition should be sent to contact
      expect(emailSpy).toHaveBeenCalledTimes(1);
    });

    it("uses existing contact if the email is already registered in the link owner organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $publicPetitionLinkId: GID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              publicPetitionLinkId: $publicPetitionLinkId
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", publicPetitionLink.id),
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
            $publicPetitionLinkId: GID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              publicPetitionLinkId: $publicPetitionLinkId
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", publicPetitionLink.id),
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

    it("sends error if the petition does not have fields", async () => {
      const [emptyPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1,
        () => ({ is_template: true, status: null })
      );
      const invalidPublicPetitionLink = await mocks.createRandomPublicPetitionLink(
        emptyPetition.id,
        user.id,
        () => ({ slug: "aaaa" })
      );

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $publicPetitionLinkId: GID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              publicPetitionLinkId: $publicPetitionLinkId
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", invalidPublicPetitionLink.id),
          contactFirstName: contact.first_name,
          contactLastName: contact.last_name,
          contactEmail: contact.email,
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if the petition does not have repliable fields", async () => {
      const [petitionWithHeading] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1,
        () => ({ is_template: true, status: null })
      );
      await mocks.createRandomPetitionFields(petitionWithHeading.id, 1, () => ({
        type: "HEADING",
      }));

      const invalidPublicPetitionLink = await mocks.createRandomPublicPetitionLink(
        petitionWithHeading.id,
        user.id,
        () => ({ slug: "bbbb" })
      );

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $publicPetitionLinkId: GID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              publicPetitionLinkId: $publicPetitionLinkId
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", invalidPublicPetitionLink.id),
          contactFirstName: contact.first_name,
          contactLastName: contact.last_name,
          contactEmail: contact.email,
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("inserts user permissions based on the public link users", async () => {
      const [otherUser] = await mocks.createRandomUsers(organization.id, 1);
      await knex.from("public_petition_link_user").insert({
        public_petition_link_id: publicPetitionLink.id,
        user_id: otherUser.id,
        type: "READ",
        is_subscribed: false,
      });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $publicPetitionLinkId: GID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              publicPetitionLinkId: $publicPetitionLinkId
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", publicPetitionLink.id),
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
            $publicPetitionLinkId: GID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              publicPetitionLinkId: $publicPetitionLinkId
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", publicPetitionLink.id),
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
            $publicPetitionLinkId: GID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              publicPetitionLinkId: $publicPetitionLinkId
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
              force: true
            )
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", publicPetitionLink.id),
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
            $publicPetitionLinkId: GID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              publicPetitionLinkId: $publicPetitionLinkId
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", publicPetitionLink.id),
          contactFirstName: "Bojack",
          contactLastName: "Horseman",
          contactEmail: "bojack@test.com",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.publicCreateAndSendPetitionFromPublicLink).toEqual("SUCCESS");
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
          mutation ($publicPetitionLinkId: GID!, $contactEmail: String!) {
            publicSendReminder(
              publicPetitionLinkId: $publicPetitionLinkId
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", newPetitionLink.id),
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
            $publicPetitionLinkId: GID!
            $contactFirstName: String!
            $contactLastName: String!
            $contactEmail: String!
          ) {
            publicCreateAndSendPetitionFromPublicLink(
              publicPetitionLinkId: $publicPetitionLinkId
              contactFirstName: $contactFirstName
              contactLastName: $contactLastName
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", newPetitionLink.id),
          contactFirstName: "Roger",
          contactLastName: "Waters",
          contactEmail: "rogerwaters@gmail.com",
        },
      });
      expect(createErrors).toBeUndefined();
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($publicPetitionLinkId: GID!, $contactEmail: String!) {
            publicSendReminder(
              publicPetitionLinkId: $publicPetitionLinkId
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", newPetitionLink.id),
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
          mutation ($publicPetitionLinkId: GID!, $contactEmail: String!) {
            publicSendReminder(
              publicPetitionLinkId: $publicPetitionLinkId
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", newPetitionLink.id),
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
          mutation ($publicPetitionLinkId: GID!, $contactEmail: String!) {
            publicSendReminder(
              publicPetitionLinkId: $publicPetitionLinkId
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", newPetitionLink.id),
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
          mutation ($publicPetitionLinkId: GID!, $contactEmail: String!) {
            publicSendReminder(
              publicPetitionLinkId: $publicPetitionLinkId
              contactEmail: $contactEmail
            )
          }
        `,
        variables: {
          publicPetitionLinkId: toGlobalId("PublicPetitionLink", newPetitionLink.id),
          contactEmail: "rogerwaters@gmail.com",
        },
      });

      expect(errors).toContainGraphQLError("REMINDER_ALREADY_SENT_ERROR");
      expect(data).toBeNull();
    });
  });
});

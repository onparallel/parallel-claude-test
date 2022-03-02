import { gql } from "@apollo/client";
import faker from "@faker-js/faker";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Contact, Organization, PetitionMessage, User } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/Contacts", () => {
  let testClient: TestClient;
  let user: User;
  let organization: Organization;
  let userContacts: Contact[];
  let mocks: Mocks;

  let otherOrg: Organization;
  let otherContact: Contact;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ user, organization } = await mocks.createSessionUserAndOrganization({
      organization_role: "ADMIN",
    }));

    userContacts = await mocks.createRandomContacts(organization.id, 5, (n) => ({
      email: n === 4 ? "email.search@onparallel.com" : faker.internet.email().toLowerCase(),
    }));

    [otherOrg] = await mocks.createRandomOrganizations(1);
    [otherContact] = await mocks.createRandomContacts(otherOrg.id, 1);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  it("fetches all user contacts", async () => {
    const { data, errors } = await testClient.execute(gql`
      query {
        contacts {
          totalCount
        }
      }
    `);

    expect(errors).toBeUndefined();
    expect(data!.contacts).toEqual({
      totalCount: 5,
    });
  });

  it("filters contacts by search value", async () => {
    const { data, errors } = await testClient.execute(
      gql`
        query ($search: String) {
          contacts(search: $search, limit: 100) {
            totalCount
            items {
              email
            }
          }
        }
      `,
      { search: "email.search@" }
    );

    expect(errors).toBeUndefined();
    expect(data!.contacts).toEqual({
      totalCount: 1,
      items: [{ email: "email.search@onparallel.com" }],
    });
  });

  it("excludes contacts from result", async () => {
    const { data, errors } = await testClient.execute(
      gql`
        query ($exclude: [GID!]) {
          contacts(exclude: $exclude) {
            totalCount
          }
        }
      `,
      { exclude: [toGlobalId("Contact", userContacts[0].id)] }
    );

    expect(errors).toBeUndefined();
    expect(data!.contacts).toEqual({
      totalCount: 4,
    });
  });

  it("sorts results by email in descending order", async () => {
    const { data, errors } = await testClient.execute(
      gql`
        query ($sortBy: [QueryContacts_OrderBy!]) {
          contacts(sortBy: $sortBy, limit: 100) {
            items {
              id
              email
            }
          }
        }
      `,
      { sortBy: "email_DESC" }
    );

    const orderedContacts = userContacts.sort((a, b) =>
      b.email.localeCompare(a.email, "en-us", { ignorePunctuation: true })
    );

    expect(errors).toBeUndefined();
    expect(data!.contacts).toEqual({
      items: orderedContacts.map((c) => ({
        id: toGlobalId("Contact", c.id),
        email: c.email,
      })),
    });
  });

  it("sorts results by first name ascending", async () => {
    const { data, errors } = await testClient.execute(gql`
      query {
        contacts(limit: 100, sortBy: firstName_ASC) {
          items {
            id
            email
            firstName
          }
        }
      }
    `);

    const orderedContacts = userContacts.sort(
      (a, b) =>
        a.first_name!.localeCompare(b.first_name!, "en-us", {
          ignorePunctuation: true,
        }) || a.id - b.id // sort by id ascending if names are the same
    );

    expect(errors).toBeUndefined();
    expect(data!.contacts).toEqual({
      items: orderedContacts.map((c) => ({
        id: toGlobalId("Contact", c.id),
        email: c.email,
        firstName: c.first_name,
      })),
    });
  });

  it("fetches a single contact by id", async () => {
    const contact = userContacts[2];
    const id = toGlobalId("Contact", contact.id);
    const { data, errors } = await testClient.execute(
      gql`
        query ($id: GID!) {
          contact(id: $id) {
            id
            email
            firstName
            lastName
          }
        }
      `,
      { id }
    );

    expect(errors).toBeUndefined();
    expect(data!.contact).toEqual({
      id,
      email: contact.email,
      firstName: contact.first_name,
      lastName: contact.last_name,
    });
  });

  it("sends error when user tries to fetch a contact from another organization", async () => {
    const { data, errors } = await testClient.execute(
      gql`
        query ($id: GID!) {
          contact(id: $id) {
            id
          }
        }
      `,
      { id: toGlobalId("Contact", otherContact.id) }
    );
    expect(errors).toContainGraphQLError("FORBIDDEN");
    expect(data!.contact).toBeNull();
  });

  it("creates a new contact with email and full name", async () => {
    const { data, errors } = await testClient.execute(
      gql`
        mutation ($email: String!, $firstName: String!, $lastName: String) {
          createContact(data: { email: $email, firstName: $firstName, lastName: $lastName }) {
            email
            firstName
            lastName
            fullName
          }
        }
      `,
      {
        email: "mark.hamill@onparallel.com",
        firstName: "Mark",
        lastName: "Hamill",
      }
    );

    expect(errors).toBeUndefined();
    expect(data!.createContact).toEqual({
      email: "mark.hamill@onparallel.com",
      firstName: "Mark",
      lastName: "Hamill",
      fullName: "Mark Hamill",
    });
  });

  it("sends error when trying to create a contact with an existing email", async () => {
    const { data, errors } = await testClient.execute(
      gql`
        mutation ($email: String!, $firstName: String!) {
          createContact(data: { email: $email, firstName: $firstName }) {
            id
            email
          }
        }
      `,
      {
        email: userContacts[3].email,
        firstName: "Mark",
      }
    );

    expect(errors).toContainGraphQLError("EXISTING_CONTACT");
    expect(data).toBeNull();
  });

  it("updates first name from contact", async () => {
    const contact = userContacts[1];
    const { data, errors } = await testClient.execute(
      gql`
        mutation ($id: GID!, $firstName: String!) {
          updateContact(id: $id, data: { firstName: $firstName }) {
            id
            fullName
          }
        }
      `,
      {
        id: toGlobalId("Contact", contact.id),
        firstName: "Harvey",
      }
    );

    expect(errors).toBeUndefined();
    expect(data!.updateContact).toEqual({
      id: toGlobalId("Contact", contact.id),
      fullName: "Harvey ".concat(contact.last_name || ""),
    });
  });

  it("sends error when trying to update a contact with empty data object", async () => {
    const contact = userContacts[1];
    const { data, errors } = await testClient.execute(
      gql`
        mutation ($id: GID!) {
          updateContact(id: $id, data: {}) {
            id
          }
        }
      `,
      {
        id: toGlobalId("Contact", contact.id),
      }
    );

    expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
    expect(data!).toBeNull();
  });

  it("sends error when trying to update a contact from another org", async () => {
    const { data, errors } = await testClient.execute(
      gql`
        mutation ($id: GID!, $firstName: String) {
          updateContact(id: $id, data: { firstName: $firstName }) {
            id
          }
        }
      `,
      {
        id: toGlobalId("Contact", otherContact.id),
        firstName: "Jon",
      }
    );
    expect(errors).toContainGraphQLError("FORBIDDEN");
    expect(data).toBeNull();
  });

  it("sends error when trying to delete a contact from another org", async () => {
    const { data, errors } = await testClient.execute(
      gql`
        mutation ($ids: [GID!]!) {
          deleteContacts(ids: $ids)
        }
      `,
      {
        ids: [toGlobalId("Contact", otherContact.id)],
      }
    );
    expect(errors).toContainGraphQLError("FORBIDDEN");
    expect(data).toBeNull();
  });

  it("deletes a recently created contact without force flag", async () => {
    const [contact] = await mocks.createRandomContacts(organization.id, 1);
    const { errors, data } = await testClient.execute(
      gql`
        mutation ($ids: [GID!]!) {
          deleteContacts(ids: $ids)
        }
      `,
      {
        ids: [toGlobalId("Contact", contact.id)],
      }
    );
    expect(errors).toBeUndefined();
    expect(data!.deleteContacts).toEqual("SUCCESS");
  });

  it("sends error when trying to delete a contact with an active access without passing force flag", async () => {
    const petitions = await mocks.createRandomPetitions(organization.id, user.id, 2, (i) => ({
      status: i === 0 ? "PENDING" : "CLOSED",
    }));
    const [contact] = await mocks.createRandomContacts(organization.id, 1);
    await mocks.createPetitionAccess(petitions[0].id, user.id, [contact.id], user.id);
    await mocks.createPetitionAccess(petitions[1].id, user.id, [contact.id], user.id);

    const { errors, data } = await testClient.execute(
      gql`
        mutation ($ids: [GID!]!) {
          deleteContacts(ids: $ids)
        }
      `,
      { ids: [toGlobalId("Contact", contact.id)] }
    );

    expect(errors).toContainGraphQLError("CONTACT_HAS_ACTIVE_ACCESSES_ERROR");
    expect(errors?.[0].extensions).toEqual({
      PENDING: 1,
      COMPLETED: 0,
      CLOSED: 1,
      code: "CONTACT_HAS_ACTIVE_ACCESSES_ERROR",
    });
    expect(data).toBeNull();
  });

  it("sends error when trying to delete a contact as normal user", async () => {
    const [normalUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
      organization_role: "NORMAL",
    }));
    const { apiKey: normalUserApiKey } = await mocks.createUserAuthToken(
      "normal-token",
      normalUser.id
    );
    const [contact] = await mocks.createRandomContacts(organization.id, 1);

    const { errors, data } = await testClient.withApiKey(normalUserApiKey).execute(
      gql`
        mutation ($ids: [GID!]!) {
          deleteContacts(ids: $ids)
        }
      `,
      {
        ids: [toGlobalId("Contact", contact.id)],
      }
    );
    expect(errors).toContainGraphQLError("FORBIDDEN");
    expect(data).toBeNull();
  });

  it("deletes a contact and disables its accesses", async () => {
    const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
    const [contact] = await mocks.createRandomContacts(organization.id, 1);
    const [access] = await mocks.createPetitionAccess(petition.id, user.id, [contact.id], user.id);
    const [scheduledMessage] = await mocks.createRandomPetitionMessage(
      petition.id,
      access.id,
      user.id,
      () => ({ status: "SCHEDULED" })
    );

    const { errors, data } = await testClient.execute(
      gql`
        mutation ($ids: [GID!]!) {
          deleteContacts(ids: $ids, force: true)
        }
      `,
      { ids: [toGlobalId("Contact", contact.id)] }
    );

    expect(errors).toBeUndefined();
    expect(data?.deleteContacts).toEqual("SUCCESS");

    const { errors: queryErrors, data: queryData } = await testClient.execute(
      gql`
        query ($id: GID!) {
          petition(id: $id) {
            id
            ... on Petition {
              accesses {
                id
                status
                contact {
                  id
                }
              }
            }
          }
        }
      `,
      { id: toGlobalId("Petition", petition.id) }
    );

    expect(queryErrors).toBeUndefined();
    expect(queryData?.petition).toEqual({
      id: toGlobalId("Petition", petition.id),
      accesses: [
        {
          id: toGlobalId("PetitionAccess", access.id),
          status: "INACTIVE",
          contact: null,
        },
      ],
    });

    const accessMessages = await mocks.knex
      .from<PetitionMessage>("petition_message")
      .where({ petition_access_id: access.id })
      .select("id", "status", "petition_id");

    expect(accessMessages).toEqual([
      { id: scheduledMessage.id, status: "CANCELLED", petition_id: petition.id },
    ]);
  });

  it("deletes multiple contacts at once and disables all their accesses", async () => {
    const petitions = await mocks.createRandomPetitions(organization.id, user.id, 2);
    const contacts = await mocks.createRandomContacts(organization.id, 5);
    const accesses = [
      await mocks.createPetitionAccess(
        petitions[0].id,
        user.id,
        [contacts[0].id, contacts[1].id, contacts[2].id, contacts[3].id],
        user.id
      ),
      await mocks.createPetitionAccess(
        petitions[1].id,
        user.id,
        [contacts[2].id, contacts[3].id, contacts[4].id],
        user.id
      ),
    ].flat();

    const { errors, data } = await testClient.execute(
      gql`
        mutation ($ids: [GID!]!) {
          deleteContacts(ids: $ids, force: true)
        }
      `,
      { ids: contacts.map((c) => toGlobalId("Contact", c.id)) }
    );

    expect(errors).toBeUndefined();
    expect(data?.deleteContacts).toEqual("SUCCESS");

    for (const petition of petitions) {
      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($id: GID!) {
            petition(id: $id) {
              id
              ... on Petition {
                accesses {
                  id
                  status
                  contact {
                    id
                  }
                }
              }
            }
          }
        `,
        { id: toGlobalId("Petition", petition.id) }
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.petition).toEqual({
        id: toGlobalId("Petition", petition.id),
        accesses: accesses
          .filter((a) => a.petition_id === petition.id)
          .map((a) => ({
            id: toGlobalId("PetitionAccess", a.id),
            status: "INACTIVE",
            contact: null,
          })),
      });
    }
  });
});

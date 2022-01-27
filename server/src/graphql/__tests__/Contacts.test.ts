import { gql } from "@apollo/client";
import faker from "@faker-js/faker";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Contact, Organization, User } from "../../db/__types";
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

    ({ user, organization } = await mocks.createSessionUserAndOrganization());

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
    const { data, errors } = await testClient.query({
      query: gql`
        query {
          contacts {
            totalCount
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data!.contacts).toEqual({
      totalCount: 5,
    });
  });

  it("filters contacts by search value", async () => {
    const { data, errors } = await testClient.query({
      query: gql`
        query ($search: String) {
          contacts(search: $search, limit: 100) {
            totalCount
            items {
              email
            }
          }
        }
      `,
      variables: { search: "email.search@" },
    });

    expect(errors).toBeUndefined();
    expect(data!.contacts).toEqual({
      totalCount: 1,
      items: [{ email: "email.search@onparallel.com" }],
    });
  });

  it("excludes contacts from result", async () => {
    const { data, errors } = await testClient.query({
      query: gql`
        query ($exclude: [GID!]) {
          contacts(exclude: $exclude) {
            totalCount
          }
        }
      `,
      variables: { exclude: [toGlobalId("Contact", userContacts[0].id)] },
    });

    expect(errors).toBeUndefined();
    expect(data!.contacts).toEqual({
      totalCount: 4,
    });
  });

  it("sorts results by email in descending order", async () => {
    const { data, errors } = await testClient.query({
      query: gql`
        query ($sortBy: [QueryContacts_OrderBy!]) {
          contacts(sortBy: $sortBy, limit: 100) {
            items {
              id
              email
            }
          }
        }
      `,
      variables: { sortBy: "email_DESC" },
    });

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
    const { data, errors } = await testClient.query({
      query: gql`
        query {
          contacts(limit: 100, sortBy: firstName_ASC) {
            items {
              id
              email
              firstName
            }
          }
        }
      `,
    });

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
    const { data, errors } = await testClient.query({
      query: gql`
        query ($id: GID!) {
          contact(id: $id) {
            id
            email
            firstName
            lastName
          }
        }
      `,
      variables: { id },
    });

    expect(errors).toBeUndefined();
    expect(data!.contact).toEqual({
      id,
      email: contact.email,
      firstName: contact.first_name,
      lastName: contact.last_name,
    });
  });

  it("sends error when user tries to fetch a contact from another organization", async () => {
    const { data, errors } = await testClient.query({
      query: gql`
        query ($id: GID!) {
          contact(id: $id) {
            id
          }
        }
      `,
      variables: { id: toGlobalId("Contact", otherContact.id) },
    });
    expect(errors).toContainGraphQLError("FORBIDDEN");
    expect(data!.contact).toBeNull();
  });

  it("creates a new contact with email and full name", async () => {
    const { data, errors } = await testClient.mutate({
      mutation: gql`
        mutation ($email: String!, $firstName: String!, $lastName: String) {
          createContact(data: { email: $email, firstName: $firstName, lastName: $lastName }) {
            email
            firstName
            lastName
            fullName
          }
        }
      `,
      variables: {
        email: "mark.hamill@onparallel.com",
        firstName: "Mark",
        lastName: "Hamill",
      },
    });

    expect(errors).toBeUndefined();
    expect(data!.createContact).toEqual({
      email: "mark.hamill@onparallel.com",
      firstName: "Mark",
      lastName: "Hamill",
      fullName: "Mark Hamill",
    });
  });

  it("sends error when trying to create a contact with an existing email", async () => {
    const { data, errors } = await testClient.mutate({
      mutation: gql`
        mutation ($email: String!, $firstName: String!) {
          createContact(data: { email: $email, firstName: $firstName }) {
            id
            email
          }
        }
      `,
      variables: {
        email: userContacts[3].email,
        firstName: "Mark",
      },
    });

    expect(errors).toContainGraphQLError("EXISTING_CONTACT");
    expect(data).toBeNull();
  });

  it("updates first name from contact", async () => {
    const contact = userContacts[1];
    const { data, errors } = await testClient.mutate({
      mutation: gql`
        mutation ($id: GID!, $firstName: String!) {
          updateContact(id: $id, data: { firstName: $firstName }) {
            id
            fullName
          }
        }
      `,
      variables: {
        id: toGlobalId("Contact", contact.id),
        firstName: "Harvey",
      },
    });

    expect(errors).toBeUndefined();
    expect(data!.updateContact).toEqual({
      id: toGlobalId("Contact", contact.id),
      fullName: "Harvey ".concat(contact.last_name || ""),
    });
  });

  it("sends error when trying to update a contact with empty data object", async () => {
    const contact = userContacts[1];
    const { data, errors } = await testClient.mutate({
      mutation: gql`
        mutation ($id: GID!) {
          updateContact(id: $id, data: {}) {
            id
          }
        }
      `,
      variables: {
        id: toGlobalId("Contact", contact.id),
      },
    });

    expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
    expect(data!).toBeNull();
  });

  it("sends error when trying to update a contact from another org", async () => {
    const { data, errors } = await testClient.mutate({
      mutation: gql`
        mutation ($id: GID!, $firstName: String) {
          updateContact(id: $id, data: { firstName: $firstName }) {
            id
          }
        }
      `,
      variables: {
        id: toGlobalId("Contact", otherContact.id),
        firstName: "Jon",
      },
    });
    expect(errors).toContainGraphQLError("FORBIDDEN");
    expect(data).toBeNull();
  });

  it("sends error when trying to delete a contact from another org", async () => {
    const { data, errors } = await testClient.mutate({
      mutation: gql`
        mutation ($ids: [GID!]!) {
          deleteContacts(ids: $ids)
        }
      `,
      variables: {
        ids: [toGlobalId("Contact", otherContact.id)],
      },
    });
    expect(errors).toContainGraphQLError("FORBIDDEN");
    expect(data).toBeNull();
  });

  it("sends whitelisted error when trying to delete a contact", async () => {
    const { data, errors } = await testClient.mutate({
      mutation: gql`
        mutation ($ids: [GID!]!) {
          deleteContacts(ids: $ids)
        }
      `,
      variables: {
        ids: [toGlobalId("Contact", userContacts[0].id)],
      },
    });
    expect(errors).toContainGraphQLError("DELETE_CONTACT_ERROR");
    expect(data).toBeNull();
  });
});

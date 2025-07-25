import { gql } from "graphql-request";
import { Knex } from "knex";
import { pick } from "remeda";
import {
  Contact,
  Organization,
  Petition,
  PetitionAccess,
  PetitionField,
  PetitionFieldType,
  User,
} from "../../../../db/__types";
import { KNEX } from "../../../../db/knex";
import { Mocks } from "../../../../db/repositories/__tests__/mocks";
import { initServer, TestClient } from "../../../../graphql/__tests__/server";
import {
  BACKGROUND_CHECK_SERVICE,
  IBackgroundCheckService,
} from "../../../../services/BackgroundCheckService";
import { fromGlobalId, toGlobalId } from "../../../../util/globalId";
import {
  AUTOMATIC_BACKGROUND_CHECK_LISTENER,
  AutomaticBackgroundCheckListener,
} from "../../../queues/event-listeners/AutomaticBackgroundCheckListener";

describe("Worker - Automatic Background Check Listener", () => {
  let knex: Knex;
  let mocks: Mocks;

  let testClient: TestClient;
  let organization: Organization;
  let sessionUser: User;

  let backgroundCheckListener: AutomaticBackgroundCheckListener;

  let petition: Petition;
  let fields: PetitionField[];
  let childFields: PetitionField[];

  let access: PetitionAccess;
  let contact: Contact;

  let backgroundCheckServiceSpy: jest.SpyInstance;

  beforeAll(async () => {
    testClient = await initServer();

    knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user: sessionUser } = await mocks.createSessionUserAndOrganization());

    await mocks.createFeatureFlags([
      {
        name: "BACKGROUND_CHECK",
        default_value: true,
      },
    ]);

    [contact] = await mocks.createRandomContacts(organization.id, 1);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  beforeEach(async () => {
    backgroundCheckListener = testClient.container.get<AutomaticBackgroundCheckListener>(
      AUTOMATIC_BACKGROUND_CHECK_LISTENER,
    );

    backgroundCheckServiceSpy = jest.spyOn(
      testClient.container.get<IBackgroundCheckService>(BACKGROUND_CHECK_SERVICE),
      "entitySearch",
    );

    [petition] = await mocks.createRandomPetitions(organization.id, sessionUser.id, 1);
    fields = await mocks.createRandomPetitionFields(petition.id, 3, (i) => ({
      type: ["SHORT_TEXT", "BACKGROUND_CHECK", "FIELD_GROUP"][i] as PetitionFieldType,
      is_internal: i === 1,
      optional: true,
    }));

    childFields = await mocks.createRandomPetitionFields(petition.id, 3, (i) => ({
      type: ["SHORT_TEXT", "DATE", "BACKGROUND_CHECK"][i] as PetitionFieldType,
      parent_petition_field_id: fields[2].id,
      is_internal: i === 2,
      optional: true,
    }));

    await mocks.knex
      .from("petition_field")
      .where("id", fields[1].id)
      .update({
        options: JSON.stringify({
          autoSearchConfig: { name: [fields[0].id], date: null, type: "PERSON" },
        }),
      });

    await mocks.knex
      .from("petition_field")
      .where("id", childFields[2].id)
      .update({
        options: JSON.stringify({
          autoSearchConfig: {
            name: [childFields[0].id, fields[0].id],
            date: childFields[1].id,
            type: "PERSON",
          },
        }),
      });

    [access] = await mocks.createPetitionAccess(
      petition.id,
      sessionUser.id,
      [contact.id],
      sessionUser.id,
    );
  });

  afterEach(() => {
    backgroundCheckServiceSpy.mockClear();
  });

  it("triggers background check search if field is automated and not replied when completing the petition", async () => {
    await mocks.createRandomTextReply(fields[0].id, access.id, 1, () => ({
      type: "SHORT_TEXT",
      content: { value: "Simpson" },
    }));

    await backgroundCheckListener.handle({
      id: 1,
      created_at: new Date(),
      petition_id: petition.id,
      type: "PETITION_COMPLETED",
      data: { petition_access_id: access.id },
      processed_at: null,
      processed_by: null,
    });

    const { errors, data } = await testClient.execute(
      gql`
        query ($id: GID!) {
          petition(id: $id) {
            id
            fields {
              id
              type
              replies {
                id
                content
              }
            }
          }
        }
      `,
      {
        id: toGlobalId("Petition", petition.id),
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.petition).toEqual({
      id: toGlobalId("Petition", petition.id),

      fields: [
        {
          id: toGlobalId("PetitionField", fields[0].id),
          type: "SHORT_TEXT",
          replies: [
            {
              id: expect.any(String),
              content: { value: "Simpson" },
            },
          ],
        },
        {
          id: toGlobalId("PetitionField", fields[1].id),
          type: "BACKGROUND_CHECK",
          replies: [
            {
              id: expect.any(String),
              content: {
                entity: null,
                query: {
                  birthCountry: null,
                  country: null,
                  date: null,
                  name: "Simpson",
                  type: "PERSON",
                },
                search: {
                  totalCount: 1,
                  falsePositivesCount: 0,
                },
              },
            },
          ],
        },
        {
          id: toGlobalId("PetitionField", fields[2].id),
          type: "FIELD_GROUP",
          replies: [],
        },
      ],
    });

    expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith({
      name: "Simpson",
      date: null,
      type: "PERSON",
      country: null,
      birthCountry: null,
    });

    const [dbReply] = await mocks.knex
      .from("petition_field_reply")
      .where("id", fromGlobalId(data?.petition.fields[1].replies[0].id).id)
      .whereNull("deleted_at")
      .select("*");

    expect(pick(dbReply, ["content", "petition_access_id"])).toEqual({
      content: {
        query: {
          name: "Simpson",
          date: null,
          type: "PERSON",
          country: null,
          birthCountry: null,
        },
        // this reply is mocked
        search: {
          totalCount: 1,
          items: [
            {
              id: "Q7747",
              type: "Person",
              name: "Vladimir Vladimirovich PUTIN",
              properties: {},
            },
          ],
          createdAt: expect.any(String),
        },
        entity: null,
      },
      petition_access_id: access.id,
    });
  });

  it("does not trigger background check search if none of its search fields are replied", async () => {
    await backgroundCheckListener.handle({
      id: 1,
      created_at: new Date(),
      petition_id: petition.id,
      type: "PETITION_COMPLETED",
      data: { petition_access_id: access.id },
      processed_at: null,
      processed_by: null,
    });

    const { errors, data } = await testClient.execute(
      gql`
        query ($id: GID!) {
          petition(id: $id) {
            id
            fields {
              id
              type
              replies {
                id
                content
              }
            }
          }
        }
      `,
      {
        id: toGlobalId("Petition", petition.id),
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.petition).toEqual({
      id: toGlobalId("Petition", petition.id),
      fields: [
        {
          id: toGlobalId("PetitionField", fields[0].id),
          type: "SHORT_TEXT",
          replies: [],
        },
        {
          id: toGlobalId("PetitionField", fields[1].id),
          type: "BACKGROUND_CHECK",
          replies: [],
        },
        {
          id: toGlobalId("PetitionField", fields[2].id),
          type: "FIELD_GROUP",
          replies: [],
        },
      ],
    });

    expect(backgroundCheckServiceSpy).not.toHaveBeenCalled();
  });

  it("does not trigger background check search if field already has an entity stored", async () => {
    await mocks.createRandomTextReply(fields[0].id, access.id, 1, () => ({
      type: "SHORT_TEXT",
      content: { value: "Simpson, Homer J" },
    }));

    await mocks.knex.from("petition_field_reply").insert({
      petition_field_id: fields[1].id,
      petition_access_id: access.id,
      content: {
        query: {
          name: "Simpson",
          date: null,
          type: "PERSON",
          country: null,
        },
        search: {
          totalCount: 1,
          items: [],
        },
        entity: {
          id: "Q7747",
          type: "Person",
          name: "Vladimir Vladimirovich PUTIN",
          properties: {},
        },
      },
      type: "BACKGROUND_CHECK",
    });

    await backgroundCheckListener.handle({
      id: 1,
      created_at: new Date(),
      petition_id: petition.id,
      type: "PETITION_COMPLETED",
      data: { petition_access_id: access.id },
      processed_at: null,
      processed_by: null,
    });

    const { errors, data } = await testClient.execute(
      gql`
        query ($id: GID!) {
          petition(id: $id) {
            id
            fields {
              id
              type
              replies {
                id
                content
              }
            }
          }
        }
      `,
      {
        id: toGlobalId("Petition", petition.id),
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.petition).toEqual({
      id: toGlobalId("Petition", petition.id),
      fields: [
        {
          id: toGlobalId("PetitionField", fields[0].id),
          type: "SHORT_TEXT",
          replies: [
            {
              id: expect.any(String),
              content: { value: "Simpson, Homer J" },
            },
          ],
        },
        {
          id: toGlobalId("PetitionField", fields[1].id),
          type: "BACKGROUND_CHECK",
          replies: [
            {
              id: expect.any(String),
              content: {
                entity: {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
                query: {
                  name: "Simpson",
                  date: null,
                  type: "PERSON",
                  country: null,
                },
                search: {
                  totalCount: 1,
                  falsePositivesCount: 0,
                },
              },
            },
          ],
        },
        {
          id: toGlobalId("PetitionField", fields[2].id),
          type: "FIELD_GROUP",
          replies: [],
        },
      ],
    });

    expect(backgroundCheckServiceSpy).not.toHaveBeenCalled();
  });

  it("does not trigger background check search if search query is the same as stored", async () => {
    await mocks.createRandomTextReply(fields[0].id, access.id, 1, () => ({
      type: "SHORT_TEXT",
      content: { value: "Simpson, Homer J" },
    }));

    await mocks.knex.from("petition_field_reply").insert({
      petition_field_id: fields[1].id,
      petition_access_id: access.id,
      content: {
        query: {
          name: "Simpson, Homer J",
          date: null,
          type: "PERSON",
          country: null,
          birthCountry: null,
        },
        search: {
          totalCount: 100,
          items: [],
        },
        entity: null,
      },
      type: "BACKGROUND_CHECK",
    });

    await backgroundCheckListener.handle({
      id: 1,
      created_at: new Date(),
      petition_id: petition.id,
      type: "PETITION_COMPLETED",
      data: { petition_access_id: access.id },
      processed_at: null,
      processed_by: null,
    });

    const { errors, data } = await testClient.execute(
      gql`
        query ($id: GID!) {
          petition(id: $id) {
            id
            fields {
              id
              type
              replies {
                id
                content
              }
            }
          }
        }
      `,
      {
        id: toGlobalId("Petition", petition.id),
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.petition).toEqual({
      id: toGlobalId("Petition", petition.id),
      fields: [
        {
          id: toGlobalId("PetitionField", fields[0].id),
          type: "SHORT_TEXT",
          replies: [
            {
              id: expect.any(String),
              content: { value: "Simpson, Homer J" },
            },
          ],
        },
        {
          id: toGlobalId("PetitionField", fields[1].id),
          type: "BACKGROUND_CHECK",
          replies: [
            {
              id: expect.any(String),
              content: {
                entity: null,
                query: {
                  name: "Simpson, Homer J",
                  date: null,
                  type: "PERSON",
                  country: null,
                  birthCountry: null,
                },
                search: {
                  totalCount: 100,
                  falsePositivesCount: 0,
                },
              },
            },
          ],
        },
        {
          id: toGlobalId("PetitionField", fields[2].id),
          type: "FIELD_GROUP",
          replies: [],
        },
      ],
    });

    expect(backgroundCheckServiceSpy).not.toHaveBeenCalled();
  });

  it("does not trigger background check search if reply is already approved", async () => {
    await mocks.createRandomTextReply(fields[0].id, access.id, 1, () => ({
      type: "SHORT_TEXT",
      content: { value: "Simpson, Homer J" },
    }));

    await mocks.knex.from("petition_field_reply").insert({
      petition_field_id: fields[1].id,
      petition_access_id: access.id,
      content: {
        query: {
          name: "Simpson",
          date: null,
          type: null,
          country: null,
        },
        search: {
          totalCount: 100,
          items: [],
        },
        entity: null,
      },
      type: "BACKGROUND_CHECK",
      status: "APPROVED",
    });

    await backgroundCheckListener.handle({
      id: 1,
      created_at: new Date(),
      petition_id: petition.id,
      type: "PETITION_COMPLETED",
      data: { petition_access_id: access.id },
      processed_at: null,
      processed_by: null,
    });

    const { errors, data } = await testClient.execute(
      gql`
        query ($id: GID!) {
          petition(id: $id) {
            id
            fields {
              id
              type
              replies {
                id
                content
              }
            }
          }
        }
      `,
      {
        id: toGlobalId("Petition", petition.id),
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.petition).toEqual({
      id: toGlobalId("Petition", petition.id),
      fields: [
        {
          id: toGlobalId("PetitionField", fields[0].id),
          type: "SHORT_TEXT",
          replies: [
            {
              id: expect.any(String),
              content: { value: "Simpson, Homer J" },
            },
          ],
        },
        {
          id: toGlobalId("PetitionField", fields[1].id),
          type: "BACKGROUND_CHECK",
          replies: [
            {
              id: expect.any(String),
              content: {
                entity: null,
                query: {
                  name: "Simpson",
                  date: null,
                  type: null,
                  country: null,
                },
                search: {
                  totalCount: 100,
                  falsePositivesCount: 0,
                },
              },
            },
          ],
        },
        {
          id: toGlobalId("PetitionField", fields[2].id),
          type: "FIELD_GROUP",
          replies: [],
        },
      ],
    });

    expect(backgroundCheckServiceSpy).not.toHaveBeenCalled();
  });

  it("triggers a background check search where name field is composed of multiple replies inside and outside the field group", async () => {
    await mocks.createRandomTextReply(fields[0].id, access.id, 1, () => ({
      type: "SHORT_TEXT",
      content: { value: "Simpson" },
    }));

    const groupReplies = await mocks.createFieldGroupReply(fields[2].id, access.id, 3);

    await mocks.createRandomTextReply(childFields[0].id, access.id, 1, () => ({
      parent_petition_field_reply_id: groupReplies[0].id,
      type: "SHORT_TEXT",
      petition_access_id: access.id,
      content: { value: "Homer" },
    }));

    await mocks.createRandomTextReply(childFields[0].id, access.id, 1, () => ({
      parent_petition_field_reply_id: groupReplies[1].id,
      type: "SHORT_TEXT",
      petition_access_id: access.id,
      content: { value: "Bart" },
    }));

    await mocks.createRandomTextReply(childFields[0].id, access.id, 1, () => ({
      parent_petition_field_reply_id: groupReplies[2].id,
      type: "SHORT_TEXT",
      petition_access_id: access.id,
      content: { value: "Lisa" },
    }));

    await mocks.createRandomDateReply(childFields[1].id, access.id, 1, () => ({
      parent_petition_field_reply_id: groupReplies[0].id,
      content: { value: "1980-01-01" },
    }));

    await mocks.createRandomDateReply(childFields[1].id, access.id, 1, () => ({
      parent_petition_field_reply_id: groupReplies[1].id,
      content: { value: "1985-01-01" },
    }));

    await mocks.createRandomDateReply(childFields[1].id, access.id, 1, () => ({
      parent_petition_field_reply_id: groupReplies[2].id,
      content: { value: "1990-01-01" },
    }));

    await backgroundCheckListener.handle({
      id: 1,
      created_at: new Date(),
      petition_id: petition.id,
      type: "PETITION_COMPLETED",
      data: { petition_access_id: access.id },
      processed_at: null,
      processed_by: null,
    });

    const { errors, data } = await testClient.execute(
      gql`
        query ($id: GID!) {
          petition(id: $id) {
            id
            fields {
              id
              type
              replies {
                id
                content
                children {
                  field {
                    id
                    type
                  }
                  replies {
                    id
                    content
                  }
                }
              }
            }
          }
        }
      `,
      {
        id: toGlobalId("Petition", petition.id),
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.petition).toEqual({
      id: toGlobalId("Petition", petition.id),
      fields: [
        {
          id: toGlobalId("PetitionField", fields[0].id),
          type: "SHORT_TEXT",
          replies: [{ id: expect.any(String), content: { value: "Simpson" }, children: null }],
        },
        {
          id: toGlobalId("PetitionField", fields[1].id),
          type: "BACKGROUND_CHECK",
          replies: [
            {
              id: expect.any(String),
              content: {
                entity: null,
                query: {
                  name: "Simpson",
                  date: null,
                  type: "PERSON",
                  country: null,
                  birthCountry: null,
                },
                search: {
                  totalCount: 1,
                  falsePositivesCount: 0,
                },
              },
              children: null,
            },
          ],
        },
        {
          id: toGlobalId("PetitionField", fields[2].id),
          type: "FIELD_GROUP",
          replies: [
            {
              id: expect.any(String),
              content: {},
              children: [
                {
                  field: { id: toGlobalId("PetitionField", childFields[0].id), type: "SHORT_TEXT" },
                  replies: [{ id: expect.any(String), content: { value: "Homer" } }],
                },
                {
                  field: { id: toGlobalId("PetitionField", childFields[1].id), type: "DATE" },
                  replies: [{ id: expect.any(String), content: { value: "1980-01-01" } }],
                },
                {
                  field: {
                    id: toGlobalId("PetitionField", childFields[2].id),
                    type: "BACKGROUND_CHECK",
                  },
                  replies: [
                    {
                      id: expect.any(String),
                      content: {
                        entity: null,
                        query: {
                          name: "Homer Simpson",
                          date: "1980-01-01",
                          type: "PERSON",
                          country: null,
                          birthCountry: null,
                        },
                        search: {
                          totalCount: 1,
                          falsePositivesCount: 0,
                        },
                      },
                    },
                  ],
                },
              ],
            },
            {
              id: expect.any(String),
              content: {},
              children: [
                {
                  field: { id: toGlobalId("PetitionField", childFields[0].id), type: "SHORT_TEXT" },
                  replies: [{ id: expect.any(String), content: { value: "Bart" } }],
                },
                {
                  field: { id: toGlobalId("PetitionField", childFields[1].id), type: "DATE" },
                  replies: [{ id: expect.any(String), content: { value: "1985-01-01" } }],
                },
                {
                  field: {
                    id: toGlobalId("PetitionField", childFields[2].id),
                    type: "BACKGROUND_CHECK",
                  },
                  replies: [
                    {
                      id: expect.any(String),
                      content: {
                        entity: null,
                        query: {
                          name: "Bart Simpson",
                          date: "1985-01-01",
                          type: "PERSON",
                          country: null,
                          birthCountry: null,
                        },
                        search: {
                          totalCount: 1,
                          falsePositivesCount: 0,
                        },
                      },
                    },
                  ],
                },
              ],
            },
            {
              id: expect.any(String),
              content: {},
              children: [
                {
                  field: { id: toGlobalId("PetitionField", childFields[0].id), type: "SHORT_TEXT" },
                  replies: [{ id: expect.any(String), content: { value: "Lisa" } }],
                },
                {
                  field: { id: toGlobalId("PetitionField", childFields[1].id), type: "DATE" },
                  replies: [{ id: expect.any(String), content: { value: "1990-01-01" } }],
                },
                {
                  field: {
                    id: toGlobalId("PetitionField", childFields[2].id),
                    type: "BACKGROUND_CHECK",
                  },
                  replies: [
                    {
                      id: expect.any(String),
                      content: {
                        entity: null,
                        query: {
                          name: "Lisa Simpson",
                          date: "1990-01-01",
                          type: "PERSON",
                          country: null,
                          birthCountry: null,
                        },
                        search: {
                          totalCount: 1,
                          falsePositivesCount: 0,
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(backgroundCheckServiceSpy.mock.calls).toIncludeSameMembers([
      [
        {
          name: "Simpson",
          date: null,
          type: "PERSON",
          country: null,
          birthCountry: null,
        },
      ],
      [
        {
          name: "Homer Simpson",
          date: "1980-01-01",
          type: "PERSON",
          country: null,
          birthCountry: null,
        },
      ],
      [
        {
          name: "Bart Simpson",
          date: "1985-01-01",
          type: "PERSON",
          country: null,
          birthCountry: null,
        },
      ],
      [
        {
          name: "Lisa Simpson",
          date: "1990-01-01",
          type: "PERSON",
          country: null,
          birthCountry: null,
        },
      ],
    ]);
  });

  it("updates background check search if petition is completed again with different query", async () => {
    await mocks.createRandomTextReply(fields[0].id, access.id, 1, () => ({
      type: "SHORT_TEXT",
      content: { value: "Simpson, Homer J" },
    }));

    await mocks.knex.from("petition_field_reply").insert({
      petition_field_id: fields[1].id,
      petition_access_id: access.id,
      content: {
        query: {
          name: "Simpson",
          date: null,
          type: "PERSON",
          country: null,
          birthCountry: null,
        },
        search: {
          totalCount: 100,
          items: [],
        },
        entity: null,
      },
      type: "BACKGROUND_CHECK",
    });

    await backgroundCheckListener.handle({
      id: 1,
      created_at: new Date(),
      petition_id: petition.id,
      type: "PETITION_COMPLETED",
      data: { petition_access_id: access.id },
      processed_at: null,
      processed_by: null,
    });

    const { errors, data } = await testClient.execute(
      gql`
        query ($id: GID!) {
          petition(id: $id) {
            id
            fields {
              id
              type
              replies {
                id
                content
              }
            }
          }
        }
      `,
      {
        id: toGlobalId("Petition", petition.id),
      },
    );

    expect(errors).toBeUndefined();
    expect(data?.petition).toEqual({
      id: toGlobalId("Petition", petition.id),
      fields: [
        {
          id: toGlobalId("PetitionField", fields[0].id),
          type: "SHORT_TEXT",
          replies: [
            {
              id: expect.any(String),
              content: { value: "Simpson, Homer J" },
            },
          ],
        },
        {
          id: toGlobalId("PetitionField", fields[1].id),
          type: "BACKGROUND_CHECK",
          replies: [
            {
              id: expect.any(String),
              content: {
                entity: null,
                query: {
                  name: "Simpson, Homer J",
                  date: null,
                  type: "PERSON",
                  country: null,
                  birthCountry: null,
                },
                search: {
                  totalCount: 1,
                  falsePositivesCount: 0,
                },
              },
            },
          ],
        },
        {
          id: toGlobalId("PetitionField", fields[2].id),
          type: "FIELD_GROUP",
          replies: [],
        },
      ],
    });

    expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith({
      name: "Simpson, Homer J",
      date: null,
      type: "PERSON",
      country: null,
      birthCountry: null,
    });

    const [dbReply] = await mocks.knex
      .from("petition_field_reply")
      .where("id", fromGlobalId(data?.petition.fields[1].replies[0].id).id)
      .whereNull("deleted_at")
      .select("*");

    expect(pick(dbReply, ["content", "petition_access_id"])).toEqual({
      content: {
        query: {
          name: "Simpson, Homer J",
          date: null,
          type: "PERSON",
          country: null,
          birthCountry: null,
        },
        search: {
          totalCount: 1,
          items: [
            {
              // mocked
              id: "Q7747",
              type: "Person",
              name: "Vladimir Vladimirovich PUTIN",
              properties: {},
            },
          ],
          createdAt: expect.any(String),
        },
        entity: null,
      },
      petition_access_id: access.id,
    });
  });
});

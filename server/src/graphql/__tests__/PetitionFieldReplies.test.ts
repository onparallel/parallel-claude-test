import gql from "graphql-tag";
import { Knex } from "knex";
import { extension } from "mime-types";
import {
  Contact,
  FileUpload,
  Organization,
  Petition,
  PetitionAccess,
  PetitionField,
  PetitionFieldReply,
  PetitionFieldType,
  User,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { toBytes } from "../../util/fileSize";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

describe("GraphQL/Petition Field Replies", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let user: User;
  let organization: Organization;
  let petition: Petition;
  let readPetition: Petition;
  let contact: Contact;
  let petitionAccess: PetitionAccess;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [petition, readPetition] = await mocks.createRandomPetitions(
      organization.id,
      user.id,
      2,
      undefined,
      (i) => ({
        type: i === 0 ? "OWNER" : "READ",
      }),
    );

    [contact] = await mocks.createRandomContacts(organization.id, 1);
    [petitionAccess] = await mocks.createPetitionAccess(
      petition.id,
      user.id,
      [contact.id],
      user.id,
    );

    await mocks.createOrganizationUsageLimit(organization.id, "PETITION_SEND", 1000);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  afterEach(async () => {
    await mocks.knex("petition_signature_request").delete();
    await mocks.knex("petition_approval_request_step").delete();
  });

  describe("createPetitionFieldReplies", () => {
    afterEach(async () => {
      await mocks.knex("petition_field_reply").delete();
      await mocks.knex("petition_event").delete();
    });

    describe("TEXT, SHORT_TEXT", () => {
      let textField: PetitionField;
      let shortTextField: PetitionField;
      let readPetitionField: PetitionField;

      beforeAll(async () => {
        [textField, shortTextField] = await mocks.createRandomPetitionFields(
          petition.id,
          2,
          (i) => ({
            type: i === 0 ? "TEXT" : "SHORT_TEXT",
            options: i === 1 ? { maxLength: 15 } : {},
          }),
        );
        [readPetitionField] = await mocks.createRandomPetitionFields(readPetition.id, 1, () => ({
          type: "TEXT",
        }));
      });

      it("doesn't consume a petition_send credit if petition already consumed", async () => {
        const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
          is_template: false,
          status: "PENDING",
          credits_used: 1,
        }));

        const [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "TEXT",
        }));

        const [before] = await mocks.knex
          .from("organization_usage_limit")
          .where({ org_id: organization.id, limit_name: "PETITION_SEND" })
          .select("*");

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", field.id),
                content: { value: "my reply" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data).toBeDefined();

        const [after] = await mocks.knex
          .from("organization_usage_limit")
          .where({ org_id: organization.id, limit_name: "PETITION_SEND" })
          .select("*");

        expect(before.used).toEqual(after.used);
      });

      it("should send error when trying to submit a reply with READ access", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", readPetition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", readPetitionField.id),
                content: { value: "my reply" },
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });

      it("petition status should change to PENDING when creating a reply on a already completed petition without recipients", async () => {
        const [completedPetition] = await mocks.createRandomPetitions(
          organization.id,
          user.id,
          1,
          () => ({
            is_template: false,
            status: "COMPLETED",
          }),
        );
        const [field] = await mocks.createRandomPetitionFields(completedPetition.id, 1, () => ({
          type: "TEXT",
        }));

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                id
                content
                field {
                  id
                  replies {
                    id
                  }
                  petition {
                    id
                    ... on Petition {
                      status
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", completedPetition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", field.id),
                content: { value: "my reply" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReplies).toEqual([
          {
            id: expect.any(String),
            content: { value: "my reply" },
            field: {
              id: toGlobalId("PetitionField", field.id),
              replies: [{ id: expect.any(String) }],
              petition: {
                id: toGlobalId("Petition", completedPetition.id),
                status: "PENDING",
              },
            },
          },
        ]);
      });

      it("completed petition status should not change when creating a reply on an internal field", async () => {
        const [completedPetition] = await mocks.createRandomPetitions(
          organization.id,
          user.id,
          1,
          () => ({
            is_template: false,
            status: "COMPLETED",
          }),
        );
        const [internalField] = await mocks.createRandomPetitionFields(
          completedPetition.id,
          1,
          () => ({
            type: "TEXT",
            is_internal: true,
          }),
        );

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                id
                content
                field {
                  id
                  replies {
                    id
                  }
                  petition {
                    id
                    ... on Petition {
                      status
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", completedPetition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", internalField.id),
                content: { value: "my reply" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReplies).toEqual([
          {
            id: expect.any(String),
            content: { value: "my reply" },
            field: {
              id: toGlobalId("PetitionField", internalField.id),
              replies: [{ id: expect.any(String) }],
              petition: {
                id: toGlobalId("Petition", completedPetition.id),
                status: "COMPLETED",
              },
            },
          },
        ]);
      });

      it("draft petition status should not change when creating a reply on an internal field", async () => {
        const [draftPetition] = await mocks.createRandomPetitions(
          organization.id,
          user.id,
          1,
          () => ({
            is_template: false,
            status: "DRAFT",
          }),
        );
        const [internalField] = await mocks.createRandomPetitionFields(draftPetition.id, 1, () => ({
          type: "TEXT",
          is_internal: true,
        }));

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                id
                content
                field {
                  id
                  replies {
                    id
                  }
                  petition {
                    id
                    ... on Petition {
                      status
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", draftPetition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", internalField.id),
                content: { value: "my reply" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReplies).toEqual([
          {
            id: expect.any(String),
            content: { value: "my reply" },
            field: {
              id: toGlobalId("PetitionField", internalField.id),
              replies: [{ id: expect.any(String) }],
              petition: {
                id: toGlobalId("Petition", draftPetition.id),
                status: "DRAFT",
              },
            },
          },
        ]);
      });

      it("should not be able to create a second reply on a single-reply field", async () => {
        const [singleReplyField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          multiple: false,
          type: "TEXT",
        }));
        await mocks.createRandomTextReply(singleReplyField.id, petitionAccess.id, 1);

        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                id
                status
                content
                field {
                  id
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", singleReplyField.id),
                content: { value: "this is my text reply" },
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("FIELD_ALREADY_REPLIED_ERROR");
        expect(data).toBeNull();
      });

      it("sends error if trying to create a reply on an already approved field", async () => {
        const [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "TEXT",
          multiple: false,
        }));
        await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", field.id),
                content: { value: "abcd" },
              },
            ],
          },
        );
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", field.id),
                content: { value: "efgh" },
              },
            ],
          },
        );
        expect(errors).toContainGraphQLError("FIELD_ALREADY_REPLIED_ERROR");
        expect(data).toBeNull();
      });

      it("sends error when creating a reply that exceeds field's maxLength", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", shortTextField.id),
                content: { value: "A".repeat(16) },
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });

      it("sends error when trying to create a TEXT reply with invalid values", async () => {
        for (const value of [10, ["Hello!"], true, { reply: "this is the reply" }]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
                createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              fields: [
                {
                  id: toGlobalId("PetitionField", textField.id),
                  content: { value },
                },
              ],
            },
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        }
      });
    });

    describe("SELECT", () => {
      let selectField: PetitionField;
      beforeAll(async () => {
        [selectField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "SELECT",
          options: { values: ["option 1", "option 2"] },
        }));
      });

      it("creates REPLY_CREATED event with user_id on payload", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", selectField.id),
                content: { value: "option 1" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();

        const replyId = fromGlobalId(
          data!.createPetitionFieldReplies[0].id,
          "PetitionFieldReply",
        ).id;

        const events = await mocks.knex
          .from("petition_event")
          .where("petition_id", petition.id)
          .select(["type", "data"]);

        expect(events).toEqual([
          {
            type: "REPLY_CREATED",
            data: {
              petition_field_id: selectField.id,
              petition_field_reply_id: replyId,
              user_id: user.id,
            },
          },
        ]);
      });

      it("sends error when creating a SELECT reply with invalid values", async () => {
        for (const value of [
          10,
          ["Hello!"],
          true,
          { reply: "this is the reply" },
          "unknown option",
        ]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
                createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              fields: [
                {
                  id: toGlobalId("PetitionField", selectField.id),
                  content: { value },
                },
              ],
            },
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        }
      });
    });

    describe("DATE", () => {
      let dateField: PetitionField;
      beforeAll(async () => {
        [dateField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "DATE",
        }));
      });

      it("sends error when creating a DATE reply with invalid values", async () => {
        for (const value of [
          "2022.02.24",
          "2022/01/01",
          "2022-02-45",
          "1900-13-01",
          "hello",
          true,
        ]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
                createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                  id
                  status
                  content
                  field {
                    id
                  }
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              fields: [
                {
                  id: toGlobalId("PetitionField", dateField.id),
                  content: { value },
                },
              ],
            },
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        }
      });
    });

    describe("NUMBER", () => {
      let numberField: PetitionField;

      beforeAll(async () => {
        [numberField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "NUMBER",
          options: {
            range: {
              min: 0,
            },
          },
          multiple: true,
          optional: true,
        }));
      });

      it("creates a reply of type NUMBER with float value", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", numberField.id),
                content: { value: Math.PI },
              },
            ],
          },
        );
        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReplies).toEqual([
          {
            status: "PENDING",
            content: { value: Math.PI },
          },
        ]);
      });

      it("sends error when creating a NUMBER reply with invalid values", async () => {
        for (const value of ["hello", true, { a: 1 }, -1]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
                createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                  id
                  status
                  content
                  field {
                    id
                  }
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              fields: [
                {
                  id: toGlobalId("PetitionField", numberField.id),
                  content: { value },
                },
              ],
            },
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        }
      });
    });

    describe("CHECKBOX", () => {
      let unlimitedCheckboxField: PetitionField;
      let radioButtonField: PetitionField;
      let exactCheckboxField: PetitionField;
      let rangeCheckboxField: PetitionField;
      beforeAll(async () => {
        [unlimitedCheckboxField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "CHECKBOX",
          multiple: true,
          options: {
            values: ["1", "2", "3"],
            limit: {
              type: "UNLIMITED",
              min: 1,
              max: 1,
            },
          },
        }));
        [radioButtonField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "CHECKBOX",
          multiple: true,
          options: {
            values: ["1", "2", "3"],
            limit: {
              type: "RADIO",
              min: 1,
              max: 1,
            },
          },
        }));
        [exactCheckboxField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "CHECKBOX",
          multiple: true,
          options: {
            values: ["1", "2", "3"],
            limit: {
              type: "EXACT",
              min: 2,
              max: 2,
            },
          },
        }));
        [rangeCheckboxField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "CHECKBOX",
          multiple: true,
          options: {
            values: ["1", "2", "3", "4"],
            limit: {
              type: "RANGE",
              min: 2,
              max: 4,
            },
          },
        }));
      });

      it("creates a checkbox reply of RADIO subtype", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", radioButtonField.id),
                content: { value: ["1"] },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReplies).toEqual([
          {
            status: "PENDING",
            content: { value: ["1"] },
          },
        ]);
      });

      it("sends error if creating a reply of RADIO subtype with more than 1 choice", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", radioButtonField.id),
                content: { value: ["1", "2"] },
              },
            ],
          },
        );
        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });

      it("creates a checkbox reply of EXACT subtype", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", exactCheckboxField.id),
                content: { value: ["2", "3"] },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReplies).toEqual([
          {
            status: "PENDING",
            content: { value: ["2", "3"] },
          },
        ]);
      });

      it("sends error if creating a reply of EXACT subtype with invalid number of choices", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", exactCheckboxField.id),
                content: { value: ["2", "3", "4"] },
              },
            ],
          },
        );
        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });

      it("creates a checkbox reply of RANGE subtype", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", rangeCheckboxField.id),
                content: { value: ["1", "2", "3", "4"] },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReplies).toEqual([
          {
            status: "PENDING",
            content: { value: ["1", "2", "3", "4"] },
          },
        ]);
      });

      it("sends error when creating a CHECKBOX reply with invalid values", async () => {
        for (const value of ["hello", true, { a: 1 }, 10, []]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
                createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                  id
                  status
                  content
                  field {
                    id
                  }
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              fields: [
                {
                  id: toGlobalId("PetitionField", unlimitedCheckboxField.id),
                  content: { value },
                },
              ],
            },
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        }
      });
    });

    describe("DYNAMIC_SELECT", () => {
      let dynamicSelectField: PetitionField;
      beforeAll(async () => {
        [dynamicSelectField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "DYNAMIC_SELECT",
          multiple: true,
          options: {
            labels: ["Comunidad autónoma", "Provincia"],
            values: [
              ["Andalucía", ["Almeria", "Cadiz", "Cordoba", "Sevilla"]],
              ["Aragón", ["Huesca", "Teruel", "Zaragoza"]],
              ["Canarias", ["Fuerteventura", "Gran Canaria", "Lanzarote", "Tenerife"]],
              ["Cataluña", ["Barcelona", "Gerona", "Lérida", "Tarragona"]],
              ["Galicia", ["La Coruña", "Lugo", "Orense", "Pontevedra"]],
            ],
          },
        }));
      });

      it("creates a partial reply of type DYNAMIC_SELECT", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", dynamicSelectField.id),
                content: {
                  value: [
                    ["Comunidad autónoma", "Andalucía"],
                    ["Provincia", null],
                  ],
                },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReplies).toEqual([
          {
            content: {
              value: [
                ["Comunidad autónoma", "Andalucía"],
                ["Provincia", null],
              ],
            },
          },
        ]);
      });

      it("sends error if passing an incomplete list of values", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", dynamicSelectField.id),
                content: { value: [["Comunidad autónoma", "Andalucía"]] },
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });

      it("sends error if passing an unknown value", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", dynamicSelectField.id),
                content: {
                  value: [
                    ["Comunidad autónoma", "Andalucía"],
                    ["Provincia", "Buenos Aires"],
                  ],
                },
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });

      it("sends error when creating a DYNAMIC_SELECT reply with invalid values", async () => {
        for (const value of ["hello", true, { a: 1 }, 10, [[], []], [["Comunidad autónoma"]]]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
                createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                  id
                  status
                  content
                  field {
                    id
                  }
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              fields: [
                {
                  id: toGlobalId("PetitionField", dynamicSelectField.id),
                  content: { value },
                },
              ],
            },
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        }
      });
    });

    describe("PHONE", () => {
      let phoneField: PetitionField;
      beforeAll(async () => {
        [phoneField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "PHONE",
          options: {},
          multiple: true,
          optional: true,
        }));
      });

      it("creates a new reply type PHONE with spanish number", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                id
                status
                content
                field {
                  id
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", phoneField.id),
                content: { value: "+34 672 62 55 77" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReplies).toEqual([
          {
            id: expect.any(String),
            status: "PENDING",
            content: { value: "+34 672 62 55 77" },
            field: {
              id: toGlobalId("PetitionField", phoneField.id),
            },
          },
        ]);
      });

      it("creates a new reply type PHONE with russian number", async () => {
        const { data, errors } = await testClient.mutate({
          mutation: gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                id
                status
                content
                field {
                  id
                }
              }
            }
          `,
          variables: {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", phoneField.id),
                content: { value: "+7 (958) 822 25 34" },
              },
            ],
          },
        });

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReplies).toEqual([
          {
            id: expect.any(String),
            status: "PENDING",
            content: { value: "+7 (958) 822 25 34" },
            field: {
              id: toGlobalId("PetitionField", phoneField.id),
            },
          },
        ]);
      });

      it("sends error when creating a reply with invalid phone in PHONE field", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
              createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
                id
                status
                content
                field {
                  id
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fields: [
              {
                id: toGlobalId("PetitionField", phoneField.id),
                content: { value: "+34 672 622 553 774" },
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });
    });
  });

  describe("updatePetitionFieldReplies", () => {
    afterEach(async () => {
      await mocks.knex("petition_event").delete();
    });

    describe("TEXT, SHORT_TEXT", () => {
      let textField: PetitionField;
      let rejectedReply: PetitionFieldReply;
      let approvedReply: PetitionFieldReply;
      let readPetitionReply: PetitionFieldReply;

      let recipientTextReply: PetitionFieldReply;

      beforeAll(async () => {
        [textField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "TEXT",
          multiple: true,
          options: { maxLength: 20 },
        }));

        [rejectedReply] = await mocks.createRandomTextReply(textField.id, 0, 1, () => ({
          user_id: user.id,
          petition_access_id: null,
          type: "TEXT",
          content: { value: "text reply" },
          status: "REJECTED",
          created_by: `User:${user.id}`,
        }));

        [approvedReply] = await mocks.createRandomTextReply(textField.id, 0, 1, () => ({
          user_id: user.id,
          petition_access_id: null,
          type: "TEXT",
          content: { value: "first reply" },
          status: "APPROVED",
        }));

        const [readPetitionField] = await mocks.createRandomPetitionFields(
          readPetition.id,
          1,
          () => ({
            type: "TEXT",
          }),
        );
        [readPetitionReply] = await mocks.createRandomTextReply(
          readPetitionField.id,
          undefined,
          1,
          () => ({ user_id: user.id }),
        );

        [recipientTextReply] = await mocks.createRandomTextReply(
          textField.id,
          petitionAccess.id,
          1,
          () => ({ created_by: `Contact:${contact.id}` }),
        );
      });

      it("should send error when trying to update a reply with READ access", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", readPetition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", readPetitionReply.id),
                content: { value: "my new reply" },
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });

      it("petition status should change to PENDING when updating a reply on a already completed petition with active accesses", async () => {
        const [completedPetition] = await mocks.createRandomPetitions(
          organization.id,
          user.id,
          1,
          () => ({
            is_template: false,
            status: "COMPLETED",
          }),
        );
        const [access] = await mocks.createPetitionAccess(
          completedPetition.id,
          user.id,
          [contact.id],
          user.id,
        );
        const [field] = await mocks.createRandomPetitionFields(completedPetition.id, 1, () => ({
          type: "TEXT",
        }));
        const [reply] = await mocks.createRandomTextReply(field.id, access.id, 1);

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                field {
                  id
                  petition {
                    id
                    ... on Petition {
                      status
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", completedPetition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", reply.id),
                content: { value: "my new reply" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReplies).toEqual([
          {
            id: toGlobalId("PetitionFieldReply", reply.id),
            field: {
              id: toGlobalId("PetitionField", field.id),
              petition: {
                id: toGlobalId("Petition", completedPetition.id),
                status: "PENDING",
              },
            },
          },
        ]);
      });

      it("petition status should not change when updating a reply on a already completed petition with active accesses", async () => {
        const [completedPetition] = await mocks.createRandomPetitions(
          organization.id,
          user.id,
          1,
          () => ({
            is_template: false,
            status: "COMPLETED",
          }),
        );
        const [access] = await mocks.createPetitionAccess(
          completedPetition.id,
          user.id,
          [contact.id],
          user.id,
        );
        const [internalField] = await mocks.createRandomPetitionFields(
          completedPetition.id,
          1,
          () => ({
            type: "TEXT",
            is_internal: true,
          }),
        );
        const [reply] = await mocks.createRandomTextReply(internalField.id, access.id, 1);

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                field {
                  id
                  petition {
                    id
                    ... on Petition {
                      status
                    }
                  }
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", completedPetition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", reply.id),
                content: { value: "my new reply" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReplies).toEqual([
          {
            id: toGlobalId("PetitionFieldReply", reply.id),
            field: {
              id: toGlobalId("PetitionField", internalField.id),
              petition: {
                id: toGlobalId("Petition", completedPetition.id),
                status: "COMPLETED",
              },
            },
          },
        ]);
      });

      it("should be able to update a rejected reply", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", rejectedReply.id),
                content: { value: "new reply" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data!.updatePetitionFieldReplies).toEqual([
          {
            id: toGlobalId("PetitionFieldReply", rejectedReply.id),
            status: "PENDING",
            content: { value: "new reply" },
          },
        ]);
      });

      it("sends error if trying to update an already approved reply", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", approvedReply.id),
                content: { value: "new reply" },
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("REPLY_ALREADY_APPROVED_ERROR");
        expect(data).toBeNull();
      });

      it("sends error if trying to update a reply with more chars than allowed on the field", async () => {
        const [reply] = await mocks.createRandomTextReply(textField.id, 0, 1, () => ({
          content: { value: "x" },
          user_id: user.id,
          petition_access_id: null,
        }));

        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", reply.id),
                content: { value: "x".repeat(21) },
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });

      it("updates a simple reply as a User, previously created by a Contact", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", recipientTextReply.id),
                content: { value: "my new reply" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReplies).toEqual([
          {
            id: expect.any(String),
            status: "PENDING",
            content: { value: "my new reply" },
          },
        ]);

        const replyId = fromGlobalId(
          data!.updatePetitionFieldReplies[0].id,
          "PetitionFieldReply",
        ).id;

        const [row] = await mocks.knex
          .from("petition_field_reply")
          .where("id", replyId)
          .select(["id", "type", "created_by", "updated_by", "user_id", "petition_access_id"]);

        expect(row).toEqual({
          id: replyId,
          type: "TEXT",
          created_by: `Contact:${contact.id}`,
          updated_by: `User:${user.id}`,
          user_id: user.id,
          petition_access_id: null,
        });
      });

      it("updates a simple reply as a User, previously created by a User", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", rejectedReply.id),
                content: { value: "my new reply" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();

        const replyId = fromGlobalId(
          data!.updatePetitionFieldReplies[0].id,
          "PetitionFieldReply",
        ).id;

        const [row] = await mocks.knex
          .from("petition_field_reply")
          .where("id", replyId)
          .select(["id", "type", "created_by", "updated_by", "user_id", "petition_access_id"]);

        expect(row).toEqual({
          id: replyId,
          type: "TEXT",
          created_by: `User:${user.id}`,
          updated_by: `User:${user.id}`,
          user_id: user.id,
          petition_access_id: null,
        });
      });

      it("creates REPLY_UPDATED event with user_id on payload", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", rejectedReply.id),
                content: { value: "my new reply" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();

        const replyId = fromGlobalId(
          data!.updatePetitionFieldReplies[0].id,
          "PetitionFieldReply",
        ).id;

        const events = await mocks.knex
          .from("petition_event")
          .where("petition_id", petition.id)
          .select(["type", "data"]);

        expect(events).toEqual([
          {
            type: "REPLY_UPDATED",
            data: {
              petition_field_id: textField.id,
              petition_field_reply_id: replyId,
              user_id: user.id,
            },
          },
        ]);
      });

      it("updates the created_at data of last event if updating a reply created less than a minute ago", async () => {
        await mocks.knex.from("petition_event").insert({
          petition_id: petition.id,
          type: "REPLY_CREATED",
          data: {
            petition_field_id: textField.id,
            user_id: user.id,
            petition_field_reply_id: rejectedReply.id,
          },
        });

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", rejectedReply.id),
                content: { value: "my new reply" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();

        const replyId = fromGlobalId(
          data!.updatePetitionFieldReplies[0].id,
          "PetitionFieldReply",
        ).id;

        const events = await mocks.knex
          .from("petition_event")
          .where("petition_id", petition.id)
          .select(["type", "data"]);

        // there should be just one event
        expect(events).toEqual([
          {
            type: "REPLY_CREATED",
            data: {
              petition_field_id: textField.id,
              petition_field_reply_id: replyId,
              user_id: user.id,
            },
          },
        ]);
      });

      it("creates a new event if updating a reply created more than a minute ago", async () => {
        await mocks.knex.from("petition_event").insert({
          petition_id: petition.id,
          type: "REPLY_CREATED",
          data: {
            petition_field_id: textField.id,
            user_id: user.id,
            petition_field_reply_id: rejectedReply.id,
          },
          created_at: new Date("2010-01-01"),
        });

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", rejectedReply.id),
                content: { value: "my new reply" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();

        const replyId = fromGlobalId(
          data!.updatePetitionFieldReplies[0].id,
          "PetitionFieldReply",
        ).id;

        const events = await mocks.knex
          .from("petition_event")
          .where("petition_id", petition.id)
          .select(["type", "data"]);

        expect(events).toEqual([
          {
            type: "REPLY_CREATED",
            data: {
              petition_field_id: textField.id,
              petition_field_reply_id: replyId,
              user_id: user.id,
            },
          },
          {
            type: "REPLY_UPDATED",
            data: {
              petition_field_id: textField.id,
              petition_field_reply_id: replyId,
              user_id: user.id,
            },
          },
        ]);
      });

      it("sends error when trying to update a reply with a pending signature request", async () => {
        await mocks.knex
          .from("petition_signature_request")
          .insert({ petition_id: petition.id, signature_config: {}, status: "PROCESSED" });

        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", rejectedReply.id),
                content: { value: "new reply" },
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("ONGOING_SIGNATURE_REQUEST_ERROR");
        expect(data).toBeNull();
      });

      it("sends error when trying to update a reply with a current approval request", async () => {
        await mocks.knex.from("petition_approval_request_step").insert({
          petition_id: petition.id,
          step_number: 0,
          step_name: "Step 1",
          status: "PENDING",
          approval_type: "ANY",
        });

        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", rejectedReply.id),
                content: { value: "new reply" },
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("ONGOING_APPROVAL_REQUEST_ERROR");
        expect(data).toBeNull();
      });
    });

    describe("SELECT", () => {
      let selectField: PetitionField;
      let selectFieldReply: PetitionFieldReply;
      beforeAll(async () => {
        [selectField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "SELECT",
          multiple: true,
          options: { values: ["A", "B", "C", "D"] },
        }));

        [selectFieldReply] = await mocks.createRandomTextReply(selectField.id, 0, 1, () => ({
          user_id: user.id,
          petition_access_id: null,
          content: { value: ["A"] },
        }));
      });

      it("updates a reply of type SELECT", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", selectFieldReply.id),
                content: { value: "D" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReplies).toEqual([
          {
            status: "PENDING",
            content: { value: "D" },
          },
        ]);
      });

      it("sends error when updating a SELECT reply with invalid values", async () => {
        for (const value of [10, ["Hello!"], true, { reply: "this is the reply" }, "E"]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
                updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              replies: [
                {
                  id: toGlobalId("PetitionFieldReply", selectFieldReply.id),
                  content: { value },
                },
              ],
            },
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        }
      });
    });

    describe("DATE", () => {
      let dateField: PetitionField;
      let dateReply: PetitionFieldReply;

      beforeAll(async () => {
        [dateField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "DATE",
          multiple: true,
        }));
        [dateReply] = await mocks.createRandomDateReply(dateField.id, 0, 1, () => ({
          user_id: user.id,
          petition_access_id: null,
          type: "DATE",
          content: { value: "2022-01-01" },
        }));
      });

      it("updates a reply type DATE", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", dateReply.id),
                content: { value: "2012-02-21" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data!.updatePetitionFieldReplies).toEqual([
          {
            id: toGlobalId("PetitionFieldReply", dateReply.id),
            status: "PENDING",
            content: { value: "2012-02-21" },
          },
        ]);
      });

      it("sends error when updating a DATE reply with invalid values", async () => {
        for (const value of [10, ["Hello!"], true, "2012-22-24", "2012.01.24", "random text"]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
                updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              replies: [
                {
                  id: toGlobalId("PetitionFieldReply", dateReply.id),
                  content: { value },
                },
              ],
            },
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        }
      });
    });

    describe("DATE_TIME", () => {
      let dateTimeField: PetitionField;
      let dateTimeReply: PetitionFieldReply;

      beforeAll(async () => {
        [dateTimeField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "DATE_TIME",
          multiple: true,
        }));
        [dateTimeReply] = await mocks.createRandomDateReply(dateTimeField.id, 0, 1, () => ({
          user_id: user.id,
          petition_access_id: null,
          type: "DATE_TIME",
        }));
      });

      it("updates a reply type DATE_TIME", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", dateTimeReply.id),
                content: {
                  datetime: "2023-03-03T03:00",
                  timezone: "Europe/Madrid",
                },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data!.updatePetitionFieldReplies).toEqual([
          {
            id: toGlobalId("PetitionFieldReply", dateTimeReply.id),
            status: "PENDING",
            content: {
              value: "2023-03-03T02:00:00.000Z",
              datetime: "2023-03-03T03:00",
              timezone: "Europe/Madrid",
            },
          },
        ]);
      });

      it("sends error when updating a DATE_TIME reply with invalid values", async () => {
        for (const value of [
          10,
          { datetime: "2023-03-03", timezone: "Europe/Madrid" },
          { datetime: "2023-03-03T00:10", timezone: "Madrid" },
          { datetime: "2023.03.03 10:30", timezone: "UTC" },
          ["Hello!"],
          true,
          "2012-22-24",
          "2012.01.24",
          "random text",
        ]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
                updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              replies: [
                {
                  id: toGlobalId("PetitionFieldReply", dateTimeReply.id),
                  content: { value },
                },
              ],
            },
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        }
      });

      it("sends error when updating a DATE_TIME reply with invalid timezone or datetime", async () => {
        for (const value of [
          { datetime: "2023.03.03 02:00", timezone: "Europe/Madrid" },
          { datetime: "2023-03-03T00:10", timezone: "Madrid" },
        ]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
                updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              replies: [
                {
                  id: toGlobalId("PetitionFieldReply", dateTimeReply.id),
                  content: { value },
                },
              ],
            },
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        }
      });
    });

    describe("NUMBER", () => {
      let numberReply: PetitionFieldReply;
      let limitedNumberReply: PetitionFieldReply;

      beforeAll(async () => {
        const [numberField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "NUMBER",
          options: {
            range: {
              min: 0,
            },
          },
          multiple: true,
          optional: true,
        }));

        const [limitedNumberField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "NUMBER",
          options: {
            range: {
              min: -10,
              max: 200,
            },
          },
          multiple: true,
          optional: true,
        }));

        [numberReply] = await mocks.createRandomNumberReply(numberField.id, 0, 1, () => ({
          petition_access_id: null,
          user_id: user.id,
        }));

        [limitedNumberReply] = await mocks.createRandomNumberReply(
          limitedNumberField.id,
          0,
          1,
          () => ({ petition_access_id: null, user_id: user.id }),
          -10,
          200,
        );
      });

      it("updates a NUMBER reply", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", numberReply.id),
                content: { value: 30 },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReplies).toEqual([
          {
            id: toGlobalId("PetitionFieldReply", numberReply.id),
            status: "PENDING",
            content: { value: 30 },
          },
        ]);
      });

      it("sends error when updating a NUMBER reply with invalid values", async () => {
        for (const value of [201, ["Hello!"], true, -11]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
                updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              replies: [
                {
                  id: toGlobalId("PetitionFieldReply", limitedNumberReply.id),
                  content: { value },
                },
              ],
            },
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        }
      });
    });

    describe("CHECKBOX", () => {
      let checkboxReply: PetitionFieldReply;

      beforeAll(async () => {
        const [checkboxField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "CHECKBOX",
          multiple: true,
          options: {
            values: ["1", "2", "3"],
            limit: {
              type: "RADIO",
              min: 1,
              max: 1,
            },
          },
        }));

        checkboxReply = await mocks.createCheckboxReply(checkboxField.id, { userId: user.id }, [
          "1",
        ]);
      });

      it("updates a checkbox reply", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", checkboxReply.id),
                content: { value: ["2"] },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReplies).toEqual([
          {
            id: toGlobalId("PetitionFieldReply", checkboxReply.id),
            status: "PENDING",
            content: { value: ["2"] },
          },
        ]);
      });

      it("sends error when updating a CHECKBOX reply with invalid values", async () => {
        for (const value of [["1", "2"], ["Hello!"], "1", true, -11]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
                updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              replies: [
                {
                  id: toGlobalId("PetitionFieldReply", checkboxReply.id),
                  content: { value },
                },
              ],
            },
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        }
      });
    });

    describe("DYNAMIC_SELECT", () => {
      let dynamicSelectReply: PetitionFieldReply;
      beforeAll(async () => {
        const [dynamicSelectField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "DYNAMIC_SELECT",
          multiple: true,
          options: {
            labels: ["Comunidad autónoma", "Provincia"],
            values: [
              ["Andalucía", ["Almeria", "Cadiz", "Cordoba", "Sevilla"]],
              ["Aragón", ["Huesca", "Teruel", "Zaragoza"]],
              ["Canarias", ["Fuerteventura", "Gran Canaria", "Lanzarote", "Tenerife"]],
              ["Cataluña", ["Barcelona", "Gerona", "Lérida", "Tarragona"]],
              ["Galicia", ["La Coruña", "Lugo", "Orense", "Pontevedra"]],
            ],
          },
        }));

        [dynamicSelectReply] = await mocks.knex
          .from<PetitionFieldReply>("petition_field_reply")
          .insert({
            type: "DYNAMIC_SELECT",
            content: {
              value: [
                ["Comunidad autónoma", "Andalucía"],
                ["Provincia", "Cadiz"],
              ],
            },
            petition_field_id: dynamicSelectField.id,
            user_id: user.id,
          })
          .returning("*");
      });

      it("updates a DYNAMIC_SELECT reply", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
                content: {
                  value: [
                    ["Comunidad autónoma", "Canarias"],
                    ["Provincia", "Lanzarote"],
                  ],
                },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReplies).toEqual([
          {
            id: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
            content: {
              value: [
                ["Comunidad autónoma", "Canarias"],
                ["Provincia", "Lanzarote"],
              ],
            },
          },
        ]);
      });

      it("updates a DYNAMIC_SELECT reply with a partial value", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
                content: {
                  value: [
                    ["Comunidad autónoma", "Canarias"],
                    ["Provincia", null],
                  ],
                },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReplies).toEqual([
          {
            id: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
            content: {
              value: [
                ["Comunidad autónoma", "Canarias"],
                ["Provincia", null],
              ],
            },
          },
        ]);
      });

      it("sends error when updating a DYNAMIC_SELECT reply with invalid values", async () => {
        for (const value of [
          [
            ["Comunidad autónoma", "Canarias"],
            ["Provincia", "Unknown"],
          ],
          ["Hello!"],
          "1",
          true,
          -11,
        ]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
                updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              replies: [
                {
                  id: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
                  content: { value },
                },
              ],
            },
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        }
      });
    });

    describe("PHONE", () => {
      let phoneReply: PetitionFieldReply;

      beforeAll(async () => {
        const [phoneField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "PHONE",
          options: {},
          multiple: true,
          optional: true,
        }));

        [phoneReply] = await mocks.createRandomPhoneReply(phoneField.id, 0, 1, () => ({
          user_id: user.id,
          petition_access_id: null,
          created_by: `User:${user.id}`,
        }));
      });

      it("updates a reply type PHONE", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", phoneReply.id),
                content: { value: "+34 674 15 15 36" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data!.updatePetitionFieldReplies).toEqual([
          {
            id: toGlobalId("PetitionFieldReply", phoneReply.id),
            status: "PENDING",
            content: { value: "+34 674 15 15 36" },
          },
        ]);
      });

      it("sends error trying to update a PHONE reply with a invalid phone", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", phoneReply.id),
                content: { value: "tel: +34 674 15 15 36" },
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });
    });

    describe("FIELD_GROUP", () => {
      let fieldGroupReply: PetitionFieldReply;
      let childReply: PetitionFieldReply;
      beforeAll(async () => {
        const [fieldGroupField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "FIELD_GROUP",
        }));
        const children = await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
          type: "TEXT",
          parent_petition_field_id: fieldGroupField.id,
          position: i,
        }));

        [fieldGroupReply] = await mocks.createFieldGroupReply(
          fieldGroupField.id,
          undefined,
          1,
          () => ({
            user_id: user.id,
          }),
        );

        [childReply] = await mocks.createRandomTextReply(children[0].id, undefined, 1, () => ({
          user_id: user.id,
          parent_petition_field_reply_id: fieldGroupReply.id,
        }));
      });

      it("sends error if trying to update a FIELD_GROUP reply", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", fieldGroupReply.id),
                content: {},
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("INVALID_FIELD_TYPE_ERROR");
        expect(data).toBeNull();
      });

      it("updates a subreply on a FIELD_GROUP reply", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                content
                field {
                  id
                }
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", childReply.id),
                content: { value: "Hello there" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReplies).toEqual([
          {
            id: toGlobalId("PetitionFieldReply", childReply.id),
            content: { value: "Hello there" },
            field: { id: toGlobalId("PetitionField", childReply.petition_field_id) },
          },
        ]);
      });
    });

    describe("multiple replies at once", () => {
      let petition: Petition;

      let textReply: PetitionFieldReply;
      let numberReply: PetitionFieldReply;
      let dateTimeReply: PetitionFieldReply;
      let checkboxReply: PetitionFieldReply;

      beforeAll(async () => {
        [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);

        const [textField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "TEXT",
        }));
        [textReply] = await mocks.createRandomTextReply(textField.id, undefined, 1, () => ({
          user_id: user.id,
        }));

        const [numberField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "NUMBER",
          multiple: true,
        }));
        [numberReply] = await mocks.createRandomNumberReply(numberField.id, undefined, 1, () => ({
          user_id: user.id,
        }));

        const [dateTimeField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "DATE_TIME",
        }));
        [dateTimeReply] = await mocks.createRandomDatetimeReply(
          dateTimeField.id,
          undefined,
          1,
          () => ({
            user_id: user.id,
          }),
        );

        const [checkboxField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "CHECKBOX",
          options: { values: ["A", "B", "C"], limit: { type: "UNLIMITED" } },
        }));
        [checkboxReply] = await mocks.createRandomTextReply(checkboxField.id, undefined, 1, () => ({
          user_id: user.id,
          type: "CHECKBOX",
          content: { value: ["A", "B"] },
        }));
      });

      it("updates multiple replies at once", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                field {
                  id
                  type
                }
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", textReply.id),
                content: { value: "new text reply" },
              },
              {
                id: toGlobalId("PetitionFieldReply", numberReply.id),
                content: { value: 128 },
              },
              {
                id: toGlobalId("PetitionFieldReply", dateTimeReply.id),
                content: { datetime: "2024-10-10T05:45", timezone: "Europe/Madrid" },
              },
              {
                id: toGlobalId("PetitionFieldReply", checkboxReply.id),
                content: { value: ["A", "C"] },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReplies).toEqual([
          {
            id: toGlobalId("PetitionFieldReply", textReply.id),
            field: { id: toGlobalId("PetitionField", textReply.petition_field_id), type: "TEXT" },
            content: { value: "new text reply" },
          },
          {
            id: toGlobalId("PetitionFieldReply", numberReply.id),
            field: {
              id: toGlobalId("PetitionField", numberReply.petition_field_id),
              type: "NUMBER",
            },
            content: { value: 128 },
          },
          {
            id: toGlobalId("PetitionFieldReply", dateTimeReply.id),
            field: {
              id: toGlobalId("PetitionField", dateTimeReply.petition_field_id),
              type: "DATE_TIME",
            },
            content: {
              datetime: "2024-10-10T05:45",
              timezone: "Europe/Madrid",
              value: "2024-10-10T03:45:00.000Z",
            },
          },
          {
            id: toGlobalId("PetitionFieldReply", checkboxReply.id),
            field: {
              id: toGlobalId("PetitionField", checkboxReply.petition_field_id),
              type: "CHECKBOX",
            },
            content: { value: ["A", "C"] },
          },
        ]);
      });
      it("sends error if one of the reply is invalid", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                field {
                  id
                  type
                }
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", textReply.id),
                content: { value: "new text reply" },
              },

              {
                id: toGlobalId("PetitionFieldReply", checkboxReply.id),
                content: { value: ["Z"] },
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });

      it("sends error if passing multiple values for a single-reply field", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replies: [UpdatePetitionFieldReplyInput!]!) {
              updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
                id
                field {
                  id
                  type
                }
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", textReply.id),
                content: { value: "new text reply" },
              },
              {
                id: toGlobalId("PetitionFieldReply", textReply.id),
                content: { value: ["second reply"] },
              },
            ],
          },
        );

        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });
    });
  });

  describe("createFileUploadReply", () => {
    let fileUploadField: PetitionField;
    let readPetitionField: PetitionField;
    let fileUploadReplyGID: string;

    let fieldGroupField: PetitionField;
    let child: PetitionField;
    let fieldGroupReply: PetitionFieldReply;

    beforeAll(async () => {
      [fileUploadField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FILE_UPLOAD",
      }));

      [readPetitionField] = await mocks.createRandomPetitionFields(readPetition.id, 1, () => ({
        type: "FILE_UPLOAD",
      }));

      [fieldGroupField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
      }));

      [child] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FILE_UPLOAD",
        position: 0,
        parent_petition_field_id: fieldGroupField.id,
      }));

      [fieldGroupReply] = await mocks.createFieldGroupReply(
        fieldGroupField.id,
        undefined,
        1,
        () => ({
          user_id: user.id,
        }),
      );
    });

    it("should send error when trying to create a file reply with read access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $file: FileUploadInput!) {
            createFileUploadReply(petitionId: $petitionId, fieldId: $fieldId, file: $file) {
              reply {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          fieldId: toGlobalId("PetitionField", readPetitionField.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 50,
          },
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to create a file reply of more than 50MB", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $file: FileUploadInput!) {
            createFileUploadReply(petitionId: $petitionId, fieldId: $fieldId, file: $file) {
              presignedPostData {
                url
                fields
              }
              reply {
                id
                content
                status
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", fileUploadField.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 300 * 1024 * 1024 + 1,
          },
        },
      );
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        extra: { error_code: "FILE_SIZE_EXCEEDED_ERROR" },
      });
      expect(data).toBeNull();
    });

    it("returns a file reply with incomplete upload and an AWS signed upload endpoint", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $file: FileUploadInput!) {
            createFileUploadReply(petitionId: $petitionId, fieldId: $fieldId, file: $file) {
              presignedPostData {
                url
                fields
              }
              reply {
                id
                content
                status
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", fileUploadField.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 500,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createFileUploadReply).toMatchObject({
        presignedPostData: { url: "", fields: {} },
        reply: {
          content: {
            filename: "my_file.txt",
            size: "500",
            contentType: "text/plain",
            extension: "txt",
            uploadComplete: false,
          },
          status: "PENDING",
        },
      });
      fileUploadReplyGID = data?.createFileUploadReply.reply.id;
    });

    it("notifies the backend that the upload was completed", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            createFileUploadReplyComplete(petitionId: $petitionId, replyId: $replyId) {
              id
              content
              status
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: fileUploadReplyGID,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createFileUploadReplyComplete).toEqual({
        id: fileUploadReplyGID,
        content: {
          id: expect.any(String),
          filename: "my_file.txt",
          size: "500",
          contentType: "text/plain",
          extension: "txt",
          uploadComplete: true,
        },
        status: "PENDING",
      });
    });

    it("petition status should not change when uploading a file reply on an internal field", async () => {
      const [completedPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1,
        () => ({
          is_template: false,
          status: "COMPLETED",
        }),
      );
      const [internalField] = await mocks.createRandomPetitionFields(
        completedPetition.id,
        1,
        () => ({
          type: "FILE_UPLOAD",
          is_internal: true,
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $file: FileUploadInput!) {
            createFileUploadReply(petitionId: $petitionId, fieldId: $fieldId, file: $file) {
              reply {
                id
                content
                field {
                  id
                  replies {
                    id
                  }
                  petition {
                    id
                    ... on Petition {
                      status
                    }
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", completedPetition.id),
          fieldId: toGlobalId("PetitionField", internalField.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 50,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createFileUploadReply).toEqual({
        reply: {
          id: data!.createFileUploadReply.reply.id,
          content: {
            id: expect.any(String),
            filename: "my_file.txt",
            size: "50",
            contentType: "text/plain",
            extension: "txt",
            uploadComplete: false,
          },
          field: {
            id: toGlobalId("PetitionField", internalField.id),
            replies: [{ id: data!.createFileUploadReply.reply.id }],
            petition: {
              id: toGlobalId("Petition", completedPetition.id),
              status: "COMPLETED",
            },
          },
        },
      });
    });

    it("sends error if submitting a file upload reply without enough credits", async () => {
      await mocks.knex
        .from("organization_usage_limit")
        .where({ org_id: organization.id, limit_name: "PETITION_SEND" })
        .update({
          limit: 1000,
          used: 1000,
        });
      await mocks.knex.from("petition").where("id", petition.id).update({ credits_used: 0 });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $file: FileUploadInput!) {
            createFileUploadReply(petitionId: $petitionId, fieldId: $fieldId, file: $file) {
              reply {
                id
                content
                field {
                  id
                  replies {
                    id
                  }
                  petition {
                    id
                    ... on Petition {
                      status
                    }
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", fileUploadField.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 50,
          },
        },
      );

      expect(errors).toContainGraphQLError("PETITION_SEND_LIMIT_REACHED");
      expect(data).toBeNull();

      await mocks.knex
        .from("organization_usage_limit")
        .where({ org_id: organization.id, limit_name: "PETITION_SEND" })
        .update({
          limit: 1000,
          used: 0,
        });
    });

    it("creates a file reply on a FIELD_GROUP field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $fieldId: GID!
            $file: FileUploadInput!
            $parentReplyId: GID
          ) {
            createFileUploadReply(
              petitionId: $petitionId
              fieldId: $fieldId
              file: $file
              parentReplyId: $parentReplyId
            ) {
              reply {
                parent {
                  children {
                    field {
                      id
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
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", child.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 500,
          },
          parentReplyId: toGlobalId("PetitionFieldReply", fieldGroupReply.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createFileUploadReply).toEqual({
        reply: {
          parent: {
            children: [
              {
                field: { id: toGlobalId("PetitionField", child.id) },
                replies: [
                  {
                    id: expect.any(String),
                    content: {
                      id: expect.any(String),
                      filename: "my_file.txt",
                      size: "500",
                      contentType: "text/plain",
                      extension: "txt",
                      uploadComplete: false,
                    },
                  },
                ],
              },
            ],
          },
        },
      });
    });

    it("sends error if passing a child field without parentReplyId", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $fieldId: GID!
            $file: FileUploadInput!
            $parentReplyId: GID
          ) {
            createFileUploadReply(
              petitionId: $petitionId
              fieldId: $fieldId
              file: $file
              parentReplyId: $parentReplyId
            ) {
              reply {
                parent {
                  children {
                    field {
                      id
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
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", child.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 500,
          },
        },
      );

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if field does not accept file content type set in field", async () => {
      const [pdfUploadField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FILE_UPLOAD",
        optional: true,
        options: { accepts: ["PDF"] },
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $fieldId: GID!
            $file: FileUploadInput!
            $parentReplyId: GID
          ) {
            createFileUploadReply(
              petitionId: $petitionId
              fieldId: $fieldId
              file: $file
              parentReplyId: $parentReplyId
            ) {
              reply {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", pdfUploadField.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 500,
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        extra: { error_code: "FILE_FORMAT_NOT_ACCEPTED_ERROR" },
      });
      expect(data).toBeNull();
    });

    it("sends error if file exceeds maxFileSize set in field", async () => {
      const [maxSizeUploadField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FILE_UPLOAD",
        optional: true,
        options: { accepts: null, maxFileSize: 10 * 1024 },
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $fieldId: GID!
            $file: FileUploadInput!
            $parentReplyId: GID
          ) {
            createFileUploadReply(
              petitionId: $petitionId
              fieldId: $fieldId
              file: $file
              parentReplyId: $parentReplyId
            ) {
              reply {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", maxSizeUploadField.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 10 * 1024 + 1,
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        extra: { error_code: "FILE_SIZE_EXCEEDED_ERROR" },
      });
      expect(data).toBeNull();
    });

    it("has a hard limit of 300MB no matter what is set in field options", async () => {
      const [maxSizeUploadField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FILE_UPLOAD",
        optional: true,
        options: { accepts: null, maxFileSize: toBytes(300, "MB") + 1 },
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $fieldId: GID!
            $file: FileUploadInput!
            $parentReplyId: GID
          ) {
            createFileUploadReply(
              petitionId: $petitionId
              fieldId: $fieldId
              file: $file
              parentReplyId: $parentReplyId
            ) {
              reply {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", maxSizeUploadField.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: toBytes(300, "MB") + 1,
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR", {
        extra: { error_code: "FILE_SIZE_EXCEEDED_ERROR" },
      });
      expect(data).toBeNull();
    });

    it("sends error when trying to create a file reply with a pending signature request", async () => {
      await mocks.knex
        .from("petition_signature_request")
        .insert({ petition_id: petition.id, signature_config: {}, status: "PROCESSED" });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $file: FileUploadInput!) {
            createFileUploadReply(petitionId: $petitionId, fieldId: $fieldId, file: $file) {
              presignedPostData {
                url
                fields
              }
              reply {
                id
                content
                status
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", fileUploadField.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 500,
          },
        },
      );

      expect(errors).toContainGraphQLError("ONGOING_SIGNATURE_REQUEST_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to create a file reply with a pending approval request", async () => {
      await mocks.knex.from("petition_approval_request_step").insert({
        petition_id: petition.id,
        step_number: 0,
        step_name: "Step 1",
        status: "PENDING",
        approval_type: "ANY",
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $file: FileUploadInput!) {
            createFileUploadReply(petitionId: $petitionId, fieldId: $fieldId, file: $file) {
              presignedPostData {
                url
                fields
              }
              reply {
                id
                content
                status
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", fileUploadField.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 500,
          },
        },
      );

      expect(errors).toContainGraphQLError("ONGOING_APPROVAL_REQUEST_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("createFileUploadReplyComplete", () => {
    it("sends error when trying to mark a file reply upload as completed with read access", async () => {
      const [field] = await mocks.createRandomPetitionFields(readPetition.id, 1, () => ({
        type: "FILE_UPLOAD",
      }));
      const [reply] = await mocks.createRandomFileReply(field.id, 1, () => ({ user_id: user.id }));
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            createFileUploadReplyComplete(petitionId: $petitionId, replyId: $replyId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          replyId: toGlobalId("PetitionFieldReply", reply.id),
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("updateFileUploadReplyComplete", () => {
    it("sends error when trying to mark an updated file reply upload as completed with read access", async () => {
      const [field] = await mocks.createRandomPetitionFields(readPetition.id, 1, () => ({
        type: "FILE_UPLOAD",
      }));
      const [reply] = await mocks.createRandomFileReply(field.id, 1, () => ({ user_id: user.id }));
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            updateFileUploadReplyComplete(petitionId: $petitionId, replyId: $replyId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          replyId: toGlobalId("PetitionFieldReply", reply.id),
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("updateFileUploadReply", () => {
    let fileUploadReply: PetitionFieldReply;
    let readPetitionReply: PetitionFieldReply;

    beforeAll(async () => {
      const [fileUploadField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FILE_UPLOAD",
      }));
      [fileUploadReply] = await mocks.createRandomFileReply(fileUploadField.id, 1, () => ({
        user_id: user.id,
      }));

      const [readPetitionField] = await mocks.createRandomPetitionFields(
        readPetition.id,
        1,
        () => ({ type: "FILE_UPLOAD" }),
      );

      [readPetitionReply] = await mocks.createRandomFileReply(readPetitionField.id, 1, () => ({
        user_id: user.id,
      }));
    });

    it("should send error when trying to update a file reply with read access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!, $file: FileUploadInput!) {
            updateFileUploadReply(petitionId: $petitionId, replyId: $replyId, file: $file) {
              reply {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          replyId: toGlobalId("PetitionFieldReply", readPetitionReply.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 500,
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("updates the reply of a file_upload to an incomplete file and returns an upload endpoint for the new file", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!, $file: FileUploadInput!) {
            updateFileUploadReply(petitionId: $petitionId, replyId: $replyId, file: $file) {
              presignedPostData {
                url
                fields
              }
              reply {
                id
                content
                status
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", fileUploadReply.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 500,
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateFileUploadReply).toEqual({
        presignedPostData: { url: "", fields: {} },
        reply: {
          id: toGlobalId("PetitionFieldReply", fileUploadReply.id),
          content: {
            id: expect.any(String),
            filename: "my_file.txt",
            size: "500",
            contentType: "text/plain",
            extension: "txt",
            uploadComplete: false,
          },
          status: "PENDING",
        },
      });

      const [dbReply] = await mocks.knex
        .from<PetitionFieldReply>("petition_field_reply")
        .where("id", fileUploadReply.id)
        .select("*");

      expect(dbReply.content.old_file_upload_id).not.toBeNull();
    });

    it("notifies backend the file was successfully uploaded", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            updateFileUploadReplyComplete(petitionId: $petitionId, replyId: $replyId) {
              id
              content
              status
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", fileUploadReply.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateFileUploadReplyComplete).toEqual({
        id: toGlobalId("PetitionFieldReply", fileUploadReply.id),
        content: {
          id: expect.any(String),
          filename: "my_file.txt",
          size: "500",
          contentType: "text/plain",
          extension: "txt",
          uploadComplete: true,
        },
        status: "PENDING",
      });
      const [dbReply] = await mocks.knex
        .from<PetitionFieldReply>("petition_field_reply")
        .where("id", fileUploadReply.id)
        .select("*");

      expect(dbReply.content.old_file_upload_id).toBeUndefined();
    });

    it("sends error when trying to update a file reply with a pending signature request", async () => {
      await mocks.knex
        .from("petition_signature_request")
        .insert({ petition_id: petition.id, signature_config: {}, status: "PROCESSED" });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!, $file: FileUploadInput!) {
            updateFileUploadReply(petitionId: $petitionId, replyId: $replyId, file: $file) {
              presignedPostData {
                url
                fields
              }
              reply {
                id
                content
                status
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", fileUploadReply.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 500,
          },
        },
      );

      expect(errors).toContainGraphQLError("ONGOING_SIGNATURE_REQUEST_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to update a file reply with a pending approval request", async () => {
      await mocks.knex.from("petition_approval_request_step").insert({
        petition_id: petition.id,
        step_number: 0,
        step_name: "Step 1",
        status: "PENDING",
        approval_type: "ANY",
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!, $file: FileUploadInput!) {
            updateFileUploadReply(petitionId: $petitionId, replyId: $replyId, file: $file) {
              presignedPostData {
                url
                fields
              }
              reply {
                id
                content
                status
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", fileUploadReply.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 500,
          },
        },
      );

      expect(errors).toContainGraphQLError("ONGOING_APPROVAL_REQUEST_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("deletePetitionReply", () => {
    let textField: PetitionField;
    let uploadedFile: FileUpload;
    let userFileReply: PetitionFieldReply;
    let approvedReply: PetitionFieldReply;
    let rejectedReply: PetitionFieldReply;
    let readPetitionReply: PetitionFieldReply;
    beforeAll(async () => {
      [textField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "TEXT",
        multiple: true,
      }));

      const [fileUploadField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FILE_UPLOAD",
        multiple: true,
      }));

      [uploadedFile] = await mocks.createRandomFileUpload();

      [userFileReply] = await mocks.createRandomFileReply(fileUploadField.id, 1, () => ({
        content: { file_upload_id: uploadedFile.id },
        user_id: user.id,
        petition_access_id: null,
      }));

      [approvedReply] = await mocks.createRandomTextReply(textField.id, 0, 1, () => ({
        petition_access_id: null,
        user_id: user.id,
        status: "APPROVED",
      }));

      [rejectedReply] = await mocks.createRandomTextReply(textField.id, 0, 1, () => ({
        petition_access_id: null,
        user_id: user.id,
        status: "REJECTED",
      }));

      const [readPetitionField] = await mocks.createRandomPetitionFields(
        readPetition.id,
        1,
        () => ({ type: "TEXT" }),
      );

      [readPetitionReply] = await mocks.createRandomTextReply(
        readPetitionField.id,
        undefined,
        1,
        () => ({
          user_id: user.id,
        }),
      );
    });

    it("should send error when trying to delete a reply with read access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
              petition {
                id
                ... on Petition {
                  status
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          replyId: toGlobalId("PetitionFieldReply", readPetitionReply.id),
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("petition status should change to PENDING when deleting a reply on a already completed petition with accesses", async () => {
      const [completedPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1,
        () => ({
          is_template: false,
          status: "COMPLETED",
        }),
      );
      await mocks.createPetitionAccess(completedPetition.id, user.id, [contact.id], user.id);
      const [field] = await mocks.createRandomPetitionFields(completedPetition.id, 1, () => ({
        type: "TEXT",
      }));
      const [reply] = await mocks.createRandomTextReply(field.id, 0, 1, () => ({
        petition_access_id: null,
        user_id: user.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
              petition {
                id
                ... on Petition {
                  status
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", completedPetition.id),
          replyId: toGlobalId("PetitionFieldReply", reply.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionReply).toEqual({
        id: toGlobalId("PetitionField", field.id),
        petition: {
          id: toGlobalId("Petition", completedPetition.id),
          status: "PENDING",
        },
      });
    });

    it("petition status should not change to when deleting a reply on an internal field", async () => {
      const [completedPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1,
        () => ({
          is_template: false,
          status: "COMPLETED",
        }),
      );

      const [field] = await mocks.createRandomPetitionFields(completedPetition.id, 1, () => ({
        type: "TEXT",
        is_internal: true,
      }));
      const [reply] = await mocks.createRandomTextReply(field.id, 0, 1, () => ({
        petition_access_id: null,
        user_id: user.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
              petition {
                id
                ... on Petition {
                  status
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", completedPetition.id),
          replyId: toGlobalId("PetitionFieldReply", reply.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionReply).toEqual({
        id: toGlobalId("PetitionField", field.id),
        petition: {
          id: toGlobalId("Petition", completedPetition.id),
          status: "COMPLETED",
        },
      });
    });

    it("petition status should change to PENDING when deleting a reply on a already completed petition without accesses", async () => {
      const [completedPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1,
        () => ({
          is_template: false,
          status: "COMPLETED",
        }),
      );
      const [field] = await mocks.createRandomPetitionFields(completedPetition.id, 1, () => ({
        type: "TEXT",
      }));
      const [reply] = await mocks.createRandomTextReply(field.id, 0, 1, () => ({
        user_id: user.id,
        petition_access_id: null,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
              petition {
                id
                ... on Petition {
                  status
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", completedPetition.id),
          replyId: toGlobalId("PetitionFieldReply", reply.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionReply).toEqual({
        id: toGlobalId("PetitionField", field.id),
        petition: {
          id: toGlobalId("Petition", completedPetition.id),
          status: "PENDING",
        },
      });
    });

    it("deletes a TEXT reply as a User", async () => {
      const [userSimpleReply] = await mocks.createRandomTextReply(
        textField.id,
        petitionAccess.id,
        1,
      );
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", userSimpleReply.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data!.deletePetitionReply).toEqual({ id: toGlobalId("PetitionField", textField.id) });
    });

    it("deletes a file reply and its entry on file_upload table", async () => {
      const { errors } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", userFileReply.id),
        },
      );

      expect(errors).toBeUndefined();

      const reply = await mocks.knex.raw(
        /* sql */ `
        SELECT id from petition_field_reply where id = ? and deleted_at is null
      `,
        [userFileReply.id],
      );

      expect(reply.rowCount).toEqual(0);

      const file = await mocks.knex.raw(
        /* sql */ `
        SELECT id from file_upload where id = ? and deleted_at is null
      `,
        [uploadedFile.id],
      );
      expect(file.rowCount).toEqual(0);
    });

    it("sends error if trying to delete an already approved reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", approvedReply.id),
        },
      );

      expect(errors).toContainGraphQLError("REPLY_ALREADY_APPROVED_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if trying to delete an already deleted reply", async () => {
      const [textReply] = await mocks.createRandomTextReply(textField.id, undefined, 1, () => ({
        user_id: user.id,
      }));

      const { errors: errors1 } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", textReply.id),
        },
      );
      expect(errors1).toBeUndefined();

      const { errors: errors2 } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", textReply.id),
        },
      );
      expect(errors2).toContainGraphQLError("REPLY_ALREADY_DELETED_ERROR");
    });

    it("should be able to delete a rejected reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", rejectedReply.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionReply).toEqual({
        id: toGlobalId("PetitionField", textField.id),
      });
    });

    it("deletes a FIELD_GROUP reply with all its subreplies", async () => {
      const [fieldGroupField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
      }));
      const children = await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
        type: "SHORT_TEXT",
        parent_petition_field_id: fieldGroupField.id,
        position: i,
      }));

      const [fieldGroupReply1, fieldGroupReply2] = await mocks.createFieldGroupReply(
        fieldGroupField.id,
        undefined,
        2,
        () => ({
          user_id: user.id,
        }),
      );

      await mocks.createRandomTextReply(children[0].id, undefined, 2, () => ({
        user_id: user.id,
        parent_petition_field_reply_id: fieldGroupReply2.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
              children {
                id
              }
              replies {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", fieldGroupReply2.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionReply).toEqual({
        id: toGlobalId("PetitionField", fieldGroupField.id),
        children: [
          { id: toGlobalId("PetitionField", children[0].id) },
          { id: toGlobalId("PetitionField", children[1].id) },
        ],
        replies: [{ id: toGlobalId("PetitionFieldReply", fieldGroupReply1.id) }],
      });

      const dbReplies = await mocks.knex
        .from("petition_field_reply")
        .where("id", fieldGroupReply2.id)
        .orWhere("parent_petition_field_reply_id", fieldGroupReply2.id)
        .select("deleted_at");

      expect(dbReplies).toHaveLength(3);
      expect(dbReplies[0].deleted_at).not.toBeNull();
      expect(dbReplies[1].deleted_at).not.toBeNull();
      expect(dbReplies[2].deleted_at).not.toBeNull();
    });

    it("deletes a single subreply on a FIELD_GROUP reply", async () => {
      const [fieldGroupField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
      }));
      const children = await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
        type: "SHORT_TEXT",
        parent_petition_field_id: fieldGroupField.id,
        position: i,
      }));

      const [fieldGroupReply] = await mocks.createFieldGroupReply(
        fieldGroupField.id,
        undefined,
        1,
        () => ({
          user_id: user.id,
        }),
      );

      const childReplies = await mocks.createRandomTextReply(children[0].id, undefined, 2, () => ({
        user_id: user.id,
        parent_petition_field_reply_id: fieldGroupReply.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
              children {
                id
              }
              replies {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", childReplies[0].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionReply).toEqual({
        id: toGlobalId("PetitionField", children[0].id),
        children: null,
        replies: [{ id: toGlobalId("PetitionFieldReply", childReplies[1].id) }],
      });
    });

    it("deletes all file uploads when deleting a FIELD_GROUP reply", async () => {
      const [fieldGroupField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
        optional: true, // don't want to trigger DELETE_FIELD_GROUP_REPLY_ERROR
      }));
      const children = await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
        type: "FILE_UPLOAD",
        parent_petition_field_id: fieldGroupField.id,
        position: i,
      }));

      const [fieldGroupReply] = await mocks.createFieldGroupReply(
        fieldGroupField.id,
        undefined,
        1,
        () => ({
          user_id: user.id,
        }),
      );

      const children0Replies = await mocks.createRandomFileUploadReply(
        children[0].id,
        undefined,
        2,
        () => ({
          user_id: user.id,
          parent_petition_field_reply_id: fieldGroupReply.id,
        }),
      );
      const children1Replies = await mocks.createRandomFileUploadReply(
        children[1].id,
        undefined,
        3,
        () => ({
          user_id: user.id,
          parent_petition_field_reply_id: fieldGroupReply.id,
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
              children {
                id
              }
              replies {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", fieldGroupReply.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionReply).toEqual({
        id: toGlobalId("PetitionField", fieldGroupField.id),
        children: [
          { id: toGlobalId("PetitionField", children[0].id) },
          { id: toGlobalId("PetitionField", children[1].id) },
        ],
        replies: [],
      });

      const fileUploadIds = [
        ...children0Replies.map((r) => r.content.file_upload_id),
        ...children1Replies.map((r) => r.content.file_upload_id),
      ] as number[];

      const dbReplies = await mocks.knex
        .from("file_upload")
        .whereIn("id", fileUploadIds)
        .select("deleted_at");

      expect(dbReplies).toHaveLength(5);
      expect(dbReplies[0].deleted_at).not.toBeNull();
      expect(dbReplies[1].deleted_at).not.toBeNull();
      expect(dbReplies[2].deleted_at).not.toBeNull();
      expect(dbReplies[3].deleted_at).not.toBeNull();
      expect(dbReplies[4].deleted_at).not.toBeNull();
    });

    it("sends error if deleting a FIELD_GROUP reply but the field is required and has no other replies", async () => {
      const [fieldGroupField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
        optional: false,
      }));

      const [fieldGroupReply] = await mocks.createFieldGroupReply(
        fieldGroupField.id,
        undefined,
        1,
        () => ({
          user_id: user.id,
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
              children {
                id
              }
              replies {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", fieldGroupReply.id),
        },
      );

      expect(errors).toContainGraphQLError("DELETE_FIELD_GROUP_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("allows to delete last reply of an optional FIELD_GROUP", async () => {
      const [fieldGroupField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
        optional: true,
      }));

      const [fieldGroupReply] = await mocks.createFieldGroupReply(
        fieldGroupField.id,
        undefined,
        1,
        () => ({
          user_id: user.id,
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
              children {
                id
              }
              replies {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", fieldGroupReply.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionReply).toEqual({
        id: toGlobalId("PetitionField", fieldGroupField.id),
        children: [],
        replies: [],
      });
    });

    it("sends error if trying to delete a FIELD_GROUP reply with approved subreplies", async () => {
      const [fieldGroupField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
      }));
      const children = await mocks.createRandomPetitionFields(petition.id, 3, (i) => ({
        type: "TEXT",
        parent_petition_field_id: fieldGroupField.id,
        position: i,
      }));

      const [fieldGroupReply] = await mocks.createFieldGroupReply(
        fieldGroupField.id,
        undefined,
        2,
        () => ({ user_id: user.id }),
      );

      await mocks.createRandomTextReply(children[0].id, undefined, 1, () => ({
        parent_petition_field_reply_id: fieldGroupReply.id,
        status: "APPROVED",
        user_id: user.id,
      }));
      await mocks.createRandomTextReply(children[1].id, undefined, 1, () => ({
        parent_petition_field_reply_id: fieldGroupReply.id,
        status: "PENDING",
        user_id: user.id,
      }));
      await mocks.createRandomTextReply(children[2].id, undefined, 1, () => ({
        parent_petition_field_reply_id: fieldGroupReply.id,
        status: "REJECTED",
        user_id: user.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", fieldGroupReply.id),
        },
      );

      expect(errors).toContainGraphQLError("REPLY_ALREADY_APPROVED_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to delete a reply with a pending signature request", async () => {
      await mocks.knex
        .from("petition_signature_request")
        .insert({ petition_id: petition.id, signature_config: {}, status: "PROCESSED" });

      const [userSimpleReply] = await mocks.createRandomTextReply(
        textField.id,
        petitionAccess.id,
        1,
      );
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", userSimpleReply.id),
        },
      );

      expect(errors).toContainGraphQLError("ONGOING_SIGNATURE_REQUEST_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to delete a reply with a pending approval request", async () => {
      await mocks.knex.from("petition_approval_request_step").insert({
        petition_id: petition.id,
        step_number: 0,
        step_name: "Step 1",
        status: "APPROVED",
        approval_type: "ANY",
      });
      const [userSimpleReply] = await mocks.createRandomTextReply(
        textField.id,
        petitionAccess.id,
        1,
      );
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", userSimpleReply.id),
        },
      );

      expect(errors).toContainGraphQLError("ONGOING_APPROVAL_REQUEST_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("bulkCreatePetitionReplies", () => {
    it("sends error when trying to bulk create replies with read access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replies: JSONObject!) {
            bulkCreatePetitionReplies(petitionId: $petitionId, replies: $replies) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          replies: {},
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("replaces current FIELD_GROUP reply if the field is non-multiple", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        multiple: false,
        type: "FIELD_GROUP",
        alias: "field_group",
      }));
      const children = await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
        parent_petition_field_id: fieldGroup.id,
        type: "TEXT",
        alias: `child_${i}`,
      }));

      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      const [child0Reply] = await mocks.createRandomTextReply(children[0].id, undefined, 1, () => ({
        parent_petition_field_reply_id: groupReply.id,
        user_id: user.id,
      }));
      const [child1Reply] = await mocks.createRandomTextReply(children[1].id, undefined, 1, () => ({
        parent_petition_field_reply_id: groupReply.id,
        user_id: user.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replies: JSONObject!) {
            bulkCreatePetitionReplies(petitionId: $petitionId, replies: $replies) {
              id
              fields {
                alias
                replies {
                  id
                  children {
                    field {
                      alias
                    }
                    replies {
                      content
                    }
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replies: {
            field_group: {
              child_0: "Hello",
              child_1: "World",
            },
          },
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.bulkCreatePetitionReplies).toEqual({
        id: toGlobalId("Petition", petition.id),
        fields: [
          {
            alias: "field_group",
            replies: [
              {
                id: expect.not.toEqualCaseInsensitive(
                  toGlobalId("PetitionFieldReply", groupReply.id),
                ),
                children: [
                  {
                    field: { alias: "child_0" },
                    replies: [{ content: { value: "Hello" } }],
                  },
                  {
                    field: { alias: "child_1" },
                    replies: [{ content: { value: "World" } }],
                  },
                ],
              },
            ],
          },
        ],
      });

      // make sure replies are deleted in DB
      const dbReplies = await mocks.knex
        .from("petition_field_reply")
        .whereIn("id", [groupReply.id, child0Reply.id, child1Reply.id])
        .select("deleted_at");

      expect(dbReplies).toEqual([
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
      ]);
    });

    it("sends error when trying to bulk create replies with a pending signature request", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        multiple: false,
        type: "FIELD_GROUP",
        alias: "field_group",
      }));
      await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
        parent_petition_field_id: fieldGroup.id,
        type: "TEXT",
        alias: `child_${i}`,
      }));

      await mocks.knex
        .from("petition_signature_request")
        .insert({ petition_id: petition.id, signature_config: {}, status: "PROCESSED" });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replies: JSONObject!) {
            bulkCreatePetitionReplies(petitionId: $petitionId, replies: $replies) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replies: {
            field_group: {
              child_0: "Hello",
              child_1: "World",
            },
          },
        },
      );
      expect(errors).toContainGraphQLError("ONGOING_SIGNATURE_REQUEST_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to bulk create replies with a pending approval request", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        multiple: false,
        type: "FIELD_GROUP",
        alias: "field_group",
      }));
      await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
        parent_petition_field_id: fieldGroup.id,
        type: "TEXT",
        alias: `child_${i}`,
      }));

      await mocks.knex.from("petition_approval_request_step").insert({
        petition_id: petition.id,
        step_number: 0,
        step_name: "Step 1",
        status: "PENDING",
        approval_type: "ANY",
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replies: JSONObject!) {
            bulkCreatePetitionReplies(petitionId: $petitionId, replies: $replies) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replies: {
            field_group: {
              child_0: "Hello",
              child_1: "World",
            },
          },
        },
      );
      expect(errors).toContainGraphQLError("ONGOING_APPROVAL_REQUEST_ERROR");
      expect(data).toBeNull();
    });

    it("omits replies for fields with replyOnlyFromProfile enabled", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        multiple: true,
        type: "FIELD_GROUP",
        alias: "field_group",
      }));
      await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
        parent_petition_field_id: fieldGroup.id,
        type: "SHORT_TEXT",
        alias: `child_${i}`,
        options: { replyOnlyFromProfile: i === 1 },
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $replies: JSONObject!) {
            bulkCreatePetitionReplies(petitionId: $petitionId, replies: $replies) {
              id
              fields {
                alias
                replies {
                  id
                  children {
                    field {
                      alias
                    }
                    replies {
                      content
                    }
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          replies: {
            field_group: [
              {
                child_0: "Hello",
                child_1: "World",
              },
              {
                child_0: "Goodbye",
                child_1: "World",
              },
            ],
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.bulkCreatePetitionReplies).toEqual({
        id: toGlobalId("Petition", petition.id),
        fields: [
          {
            alias: "field_group",
            replies: [
              {
                id: expect.any(String),
                children: [
                  { field: { alias: "child_0" }, replies: [{ content: { value: "Hello" } }] },
                  { field: { alias: "child_1" }, replies: [] },
                ],
              },
              {
                id: expect.any(String),
                children: [
                  { field: { alias: "child_0" }, replies: [{ content: { value: "Goodbye" } }] },
                  { field: { alias: "child_1" }, replies: [] },
                ],
              },
            ],
          },
        ],
      });
    });
  });

  describe("createPetitionFieldReplies", () => {
    let shortText: PetitionField;
    let text: PetitionField;
    let select: PetitionField;
    let dynamicSelect: PetitionField;
    let checkbox: PetitionField;
    let number: PetitionField;
    let phone: PetitionField;
    let date: PetitionField;
    let dateTime: PetitionField;
    let fileUpload: PetitionField;
    let esTaxDocuments: PetitionField;
    let dowJonesKyc: PetitionField;
    let fieldGroup: PetitionField;
    let fieldGroup2: PetitionField;
    let fieldGroupChildren: PetitionField[];

    let fileUploadReply: PetitionFieldReply;
    let esTaxDocsReply: PetitionFieldReply;
    let dowJonesKycReply: PetitionFieldReply;
    let file: FileUpload;

    beforeAll(async () => {
      [
        shortText,
        text,
        select,
        dynamicSelect,
        checkbox,
        number,
        phone,
        date,
        dateTime,
        fileUpload,
        esTaxDocuments,
        dowJonesKyc,
        fieldGroup,
        fieldGroup2,
      ] = await mocks.createRandomPetitionFields(petition.id, 14, (i) => ({
        type: [
          "SHORT_TEXT",
          "TEXT",
          "SELECT",
          "DYNAMIC_SELECT",
          "CHECKBOX",
          "NUMBER",
          "PHONE",
          "DATE",
          "DATE_TIME",
          "FILE_UPLOAD",
          "ES_TAX_DOCUMENTS",
          "DOW_JONES_KYC",
          "FIELD_GROUP",
          "FIELD_GROUP",
        ][i] as PetitionFieldType,
        multiple: i === 0 ? false : true,
      }));

      fieldGroupChildren = await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
        type: "SHORT_TEXT",
        parent_petition_field_id: fieldGroup.id,
        position: i,
        multiple: i === 0,
      }));

      [file] = await mocks.createRandomFileUpload(1);

      const [petitionWithFiles] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [fileUploadField, esTaxDocsField, dowJonesField] =
        await mocks.createRandomPetitionFields(petitionWithFiles.id, 3, (i) => ({
          type: i === 0 ? "FILE_UPLOAD" : i === 1 ? "ES_TAX_DOCUMENTS" : "DOW_JONES_KYC",
          multiple: true,
        }));
      [fileUploadReply] = await mocks.createRandomFileReply(fileUploadField.id, 1, () => ({
        content: { file_upload_id: file.id },
        type: "FILE_UPLOAD",
        user_id: user.id,
      }));
      [esTaxDocsReply] = await mocks.createRandomFileReply(esTaxDocsField.id, 1, () => ({
        content: { file_upload_id: file.id },
        type: "ES_TAX_DOCUMENTS",
        user_id: user.id,
      }));
      [dowJonesKycReply] = await mocks.createRandomFileReply(dowJonesField.id, 1, () => ({
        content: { file_upload_id: file.id },
        type: "DOW_JONES_KYC",
        user_id: user.id,
      }));
    });

    afterEach(async () => {
      await mocks.knex
        .from("petition_field_reply")
        .whereNotIn("id", [fileUploadReply.id, esTaxDocsReply.id, dowJonesKycReply.id])
        .delete();
    });

    it("creates a simple SHORT_TEXT reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", shortText.id),
              content: { value: "My SHORT_TEXT reply" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          field: {
            id: toGlobalId("PetitionField", shortText.id),
            type: "SHORT_TEXT",
          },
          content: { value: "My SHORT_TEXT reply" },
        },
      ]);
    });

    it("creates a simple TEXT reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", text.id),
              content: { value: "My TEXT reply" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          field: {
            id: toGlobalId("PetitionField", text.id),
            type: "TEXT",
          },
          content: { value: "My TEXT reply" },
        },
      ]);
    });

    it("creates a simple SELECT reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", select.id),
              content: { value: "Option 2" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          field: {
            id: toGlobalId("PetitionField", select.id),
            type: "SELECT",
          },
          content: { value: "Option 2" },
        },
      ]);
    });

    it("creates a simple DYNAMIC_SELECT reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", dynamicSelect.id),
              content: {
                value: [
                  ["Country", "Spain"],
                  ["City", "Barcelona"],
                ],
              },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          field: {
            id: toGlobalId("PetitionField", dynamicSelect.id),
            type: "DYNAMIC_SELECT",
          },
          content: {
            value: [
              ["Country", "Spain"],
              ["City", "Barcelona"],
            ],
          },
        },
      ]);
    });

    it("creates a simple CHECKBOX reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", checkbox.id),
              content: { value: ["A", "C"] },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          field: {
            id: toGlobalId("PetitionField", checkbox.id),
            type: "CHECKBOX",
          },
          content: {
            value: ["A", "C"],
          },
        },
      ]);
    });

    it("creates a simple NUMBER reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", number.id),
              content: { value: 1001 },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          field: {
            id: toGlobalId("PetitionField", number.id),
            type: "NUMBER",
          },
          content: {
            value: 1001,
          },
        },
      ]);
    });

    it("creates a simple PHONE reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", phone.id),
              content: { value: "+34611677677" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          field: {
            id: toGlobalId("PetitionField", phone.id),
            type: "PHONE",
          },
          content: {
            value: "+34611677677",
          },
        },
      ]);
    });

    it("creates a simple DATE reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", date.id),
              content: { value: "2022-10-19" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          field: {
            id: toGlobalId("PetitionField", date.id),
            type: "DATE",
          },
          content: {
            value: "2022-10-19",
          },
        },
      ]);
    });

    it("creates a simple DATE_TIME reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", dateTime.id),
              content: { datetime: "2022-02-28T10:00", timezone: "Europe/Madrid" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          field: {
            id: toGlobalId("PetitionField", dateTime.id),
            type: "DATE_TIME",
          },
          content: {
            datetime: "2022-02-28T10:00",
            timezone: "Europe/Madrid",
            value: "2022-02-28T09:00:00.000Z",
          },
        },
      ]);
    });

    it("creates a simple FILE_UPLOAD reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", fileUpload.id),
              content: {
                petitionFieldReplyId: toGlobalId("PetitionFieldReply", fileUploadReply.id),
              },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          field: {
            id: toGlobalId("PetitionField", fileUpload.id),
            type: "FILE_UPLOAD",
          },
          content: {
            id: expect.any(String),
            filename: file.filename,
            size: file.size,
            contentType: file.content_type,
            extension: extension(file.content_type) || null,
            uploadComplete: file.upload_complete,
          },
        },
      ]);
    });

    it("sends error when passing invalid replyId to create a FILE_UPLOAD reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", fileUpload.id),
              content: {
                petitionFieldReplyId: toGlobalId("PetitionFieldReply", dowJonesKycReply.id),
              },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("creates a simple ES_TAX_DOCUMENTS reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", esTaxDocuments.id),
              content: {
                petitionFieldReplyId: toGlobalId("PetitionFieldReply", esTaxDocsReply.id),
              },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          field: {
            id: toGlobalId("PetitionField", esTaxDocuments.id),
            type: "ES_TAX_DOCUMENTS",
          },
          content: {
            id: expect.any(String),
            filename: file.filename,
            size: file.size,
            contentType: file.content_type,
            extension: extension(file.content_type) || null,
            uploadComplete: file.upload_complete,
          },
        },
      ]);
    });

    it("creates a simple DOW_JONES_KYC reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", dowJonesKyc.id),
              content: {
                petitionFieldReplyId: toGlobalId("PetitionFieldReply", dowJonesKycReply.id),
              },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          field: {
            id: toGlobalId("PetitionField", dowJonesKyc.id),
            type: "DOW_JONES_KYC",
          },
          content: {
            id: expect.any(String),
            filename: file.filename,
            size: file.size,
            contentType: file.content_type,
            extension: extension(file.content_type) || null,
            uploadComplete: file.upload_complete,
          },
        },
      ]);
    });

    it("sends error when passing replyId of a petition not shared to me", async () => {
      const [otherUser] = await mocks.createRandomUsers(organization.id, 1);
      const [otherPetition] = await mocks.createRandomPetitions(organization.id, otherUser.id, 1);
      const [field] = await mocks.createRandomPetitionFields(otherPetition.id, 1, () => ({
        type: "FILE_UPLOAD",
      }));
      const [reply] = await mocks.createRandomFileReply(field.id, 1, () => ({
        user_id: otherUser.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", fileUpload.id),
              content: { petitionFieldReplyId: toGlobalId("PetitionFieldReply", reply.id) },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when passing invalid NUMBER with min-max options", async () => {
      const [limitedNumber] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "NUMBER",
        options: {
          range: {
            min: 100,
            max: 1000,
          },
        },
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", limitedNumber.id),
              content: { value: 10 },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when passing unknown option on SELECT", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", select.id),
              content: { value: "Option unknown" },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when passing unknown option on CHECKBOX", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", checkbox.id),
              content: { value: ["unknown option"] },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when passing invalid amount of values on CHECKBOX", async () => {
      const [limitedCheckbox] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "CHECKBOX",
        options: {
          limit: { type: "RANGE", min: 2, max: 3 },
          values: ["A", "B", "C"],
        },
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", limitedCheckbox.id),
              content: { value: ["C"] },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when passing multiple replies on a single-reply field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", shortText.id),
              content: { value: "first reply" },
            },
            {
              id: toGlobalId("PetitionField", shortText.id),
              content: { value: "second reply" },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when passing empty fields array", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [],
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("creates replies on multiple fields at once", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              field {
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
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", shortText.id),
              content: { value: "short reply" },
            },
            {
              id: toGlobalId("PetitionField", select.id),
              content: { value: "Option 2" },
            },
            {
              id: toGlobalId("PetitionField", number.id),
              content: { value: 101 },
            },
            {
              id: toGlobalId("PetitionField", fileUpload.id),
              content: {
                petitionFieldReplyId: toGlobalId("PetitionFieldReply", fileUploadReply.id),
              },
            },
            {
              id: toGlobalId("PetitionField", number.id),
              content: { value: 109 },
            },
            {
              id: toGlobalId("PetitionField", checkbox.id),
              content: { value: ["B", "C"] },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          field: {
            id: toGlobalId("PetitionField", shortText.id),
            type: "SHORT_TEXT",
            replies: [{ id: expect.any(String), content: { value: "short reply" } }],
          },
        },
        {
          field: {
            id: toGlobalId("PetitionField", select.id),
            type: "SELECT",
            replies: [{ id: expect.any(String), content: { value: "Option 2" } }],
          },
        },
        {
          field: {
            id: toGlobalId("PetitionField", number.id),
            type: "NUMBER",
            replies: [
              { id: expect.any(String), content: { value: 101 } },
              { id: expect.any(String), content: { value: 109 } },
            ],
          },
        },
        {
          field: {
            id: toGlobalId("PetitionField", fileUpload.id),
            type: "FILE_UPLOAD",
            replies: [
              {
                id: expect.any(String),
                content: {
                  id: expect.any(String),
                  filename: file.filename,
                  size: file.size,
                  contentType: file.content_type,
                  extension: extension(file.content_type) || null,
                  uploadComplete: file.upload_complete,
                },
              },
            ],
          },
        },
        {
          field: {
            id: toGlobalId("PetitionField", number.id),
            type: "NUMBER",
            replies: [
              { id: expect.any(String), content: { value: 101 } },
              { id: expect.any(String), content: { value: 109 } },
            ],
          },
        },
        {
          field: {
            id: toGlobalId("PetitionField", checkbox.id),
            type: "CHECKBOX",
            replies: [{ id: expect.any(String), content: { value: ["B", "C"] } }],
          },
        },
      ]);
    });

    it("overwrites previously created replies with new ones", async () => {
      const { errors: errors1, data: data1 } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              field {
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
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", shortText.id),
              content: { value: "my first reply" },
            },
          ],
        },
      );

      expect(errors1).toBeUndefined();
      expect(data1?.createPetitionFieldReplies).toEqual([
        {
          field: {
            id: toGlobalId("PetitionField", shortText.id),
            type: "SHORT_TEXT",
            replies: [{ id: expect.any(String), content: { value: "my first reply" } }],
          },
        },
      ]);

      const { errors: errors2, data: data2 } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $fields: [CreatePetitionFieldReplyInput!]!
            $overwriteExisting: Boolean
          ) {
            createPetitionFieldReplies(
              petitionId: $petitionId
              fields: $fields
              overwriteExisting: $overwriteExisting
            ) {
              field {
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
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", shortText.id),
              content: { value: "my second reply" },
            },
          ],
          overwriteExisting: true,
        },
      );

      expect(errors2).toBeUndefined();
      expect(data2?.createPetitionFieldReplies).toEqual([
        {
          field: {
            id: toGlobalId("PetitionField", shortText.id),
            type: "SHORT_TEXT",
            replies: [{ id: expect.any(String), content: { value: "my second reply" } }],
          },
        },
      ]);
    });

    it("creates a new FIELD_GROUP reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              content
              children {
                field {
                  id
                }
                replies {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", fieldGroup.id),
              content: {},
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          content: {},
          children: [
            { field: { id: toGlobalId("PetitionField", fieldGroupChildren[0].id) }, replies: [] },
            { field: { id: toGlobalId("PetitionField", fieldGroupChildren[1].id) }, replies: [] },
          ],
        },
      ]);
    });

    it("creates a subreply inside a FIELD_GROUP reply", async () => {
      const [fieldGroupReply] = await mocks.createFieldGroupReply(
        fieldGroup.id,
        undefined,
        1,
        () => ({
          user_id: user.id,
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              parent {
                id
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
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", fieldGroupChildren[0].id),
              parentReplyId: toGlobalId("PetitionFieldReply", fieldGroupReply.id),
              content: { value: "My SHORT_TEXT reply" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          parent: {
            id: toGlobalId("PetitionFieldReply", fieldGroupReply.id),
            children: [
              {
                field: {
                  id: toGlobalId("PetitionField", fieldGroupChildren[0].id),
                  type: "SHORT_TEXT",
                },
                replies: [
                  {
                    id: expect.any(String),
                    content: { value: "My SHORT_TEXT reply" },
                  },
                ],
              },
              {
                field: {
                  id: toGlobalId("PetitionField", fieldGroupChildren[1].id),
                  type: "SHORT_TEXT",
                },
                replies: [],
              },
            ],
          },
          content: { value: "My SHORT_TEXT reply" },
        },
      ]);
    });

    it("sends error if trying to create a second subreply inside the same non-multiple field", async () => {
      const [parentReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createRandomTextReply(fieldGroupChildren[1].id, undefined, 1, () => ({
        user_id: user.id,
        parent_petition_field_reply_id: parentReply.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", fieldGroupChildren[1].id),
              parentReplyId: toGlobalId("PetitionFieldReply", parentReply.id),
              content: { value: "My SHORT_TEXT reply" },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FIELD_ALREADY_REPLIED_ERROR");
      expect(data).toBeNull();
    });

    it("creates a field reply on a second reply group", async () => {
      const parentReplies = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 2, () => ({
        user_id: user.id,
      }));
      await mocks.createRandomTextReply(fieldGroupChildren[1].id, undefined, 1, () => ({
        user_id: user.id,
        parent_petition_field_reply_id: parentReplies[0].id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              parent {
                id
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
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", fieldGroupChildren[1].id),
              parentReplyId: toGlobalId("PetitionFieldReply", parentReplies[1].id),
              content: { value: "My SHORT_TEXT second reply" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          parent: {
            id: toGlobalId("PetitionFieldReply", parentReplies[1].id),
            children: [
              {
                field: {
                  id: toGlobalId("PetitionField", fieldGroupChildren[0].id),
                  type: "SHORT_TEXT",
                },
                replies: [],
              },
              {
                field: {
                  id: toGlobalId("PetitionField", fieldGroupChildren[1].id),
                  type: "SHORT_TEXT",
                },
                replies: [
                  {
                    id: expect.any(String),
                    content: { value: "My SHORT_TEXT second reply" },
                  },
                ],
              },
            ],
          },
          content: { value: "My SHORT_TEXT second reply" },
        },
      ]);
    });

    it("sends error if field is not a child of the parent reply group", async () => {
      const [parentReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $fields: [CreatePetitionFieldReplyInput!]!
            $overwriteExisting: Boolean
          ) {
            createPetitionFieldReplies(
              petitionId: $petitionId
              fields: $fields
              overwriteExisting: $overwriteExisting
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", phone.id),
              parentReplyId: toGlobalId("PetitionFieldReply", parentReply.id),
              content: { value: "My SHORT_TEXT reply" },
            },
          ],
          overwriteExisting: true,
        },
      );

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if passing child field id with no parentReplyId", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $fields: [CreatePetitionFieldReplyInput!]!
            $overwriteExisting: Boolean
          ) {
            createPetitionFieldReplies(
              petitionId: $petitionId
              fields: $fields
              overwriteExisting: $overwriteExisting
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", fieldGroupChildren[0].id),
              content: { value: "My SHORT_TEXT reply" },
            },
          ],
          overwriteExisting: true,
        },
      );

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if passing child field id with invalid parentReplyId", async () => {
      const [invalidParentReply] = await mocks.createFieldGroupReply(
        fieldGroup2.id,
        undefined,
        1,
        () => ({
          user_id: user.id,
        }),
      );
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $fields: [CreatePetitionFieldReplyInput!]!
            $overwriteExisting: Boolean
          ) {
            createPetitionFieldReplies(
              petitionId: $petitionId
              fields: $fields
              overwriteExisting: $overwriteExisting
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", fieldGroupChildren[0].id),
              parentReplyId: toGlobalId("PetitionFieldReply", invalidParentReply.id),
              content: { value: "My SHORT_TEXT reply" },
            },
          ],
          overwriteExisting: true,
        },
      );

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("deletes entire FIELD_GROUP reply and subreplies when overwriting FIELD_GROUP reply", async () => {
      const parentReplies = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 2, () => ({
        user_id: user.id,
      }));
      const replies00 = await mocks.createRandomTextReply(
        fieldGroupChildren[0].id,
        undefined,
        2,
        () => ({
          user_id: user.id,
          parent_petition_field_reply_id: parentReplies[0].id,
        }),
      );
      const replies01 = await mocks.createRandomTextReply(
        fieldGroupChildren[1].id,
        undefined,
        1,
        () => ({
          user_id: user.id,
          parent_petition_field_reply_id: parentReplies[0].id,
        }),
      );

      const replies10 = await mocks.createRandomTextReply(
        fieldGroupChildren[0].id,
        undefined,
        2,
        () => ({
          user_id: user.id,
          parent_petition_field_reply_id: parentReplies[1].id,
        }),
      );
      const replies11 = await mocks.createRandomTextReply(
        fieldGroupChildren[1].id,
        undefined,
        1,
        () => ({
          user_id: user.id,
          parent_petition_field_reply_id: parentReplies[1].id,
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(
              petitionId: $petitionId
              fields: $fields
              overwriteExisting: true
            ) {
              id
              parent {
                id
              }
              children {
                field {
                  id
                }
                replies {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", fieldGroup.id),
              content: {},
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          parent: null,
          children: [
            {
              field: { id: toGlobalId("PetitionField", fieldGroupChildren[0].id) },
              replies: [],
            },
            {
              field: { id: toGlobalId("PetitionField", fieldGroupChildren[1].id) },
              replies: [],
            },
          ],
        },
      ]);

      const dbReplies = await mocks.knex
        .from("petition_field_reply")
        .whereIn(
          "id",
          [...parentReplies, ...replies00, ...replies01, ...replies10, ...replies11].map(
            (r) => r.id,
          ),
        )
        .select("deleted_at");

      expect(dbReplies).toEqual([
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
      ]);
    });

    it("deletes only selected reply when overwriting a child reply", async () => {
      const parentReplies = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 2, () => ({
        user_id: user.id,
      }));
      const replies00 = await mocks.createRandomTextReply(
        fieldGroupChildren[0].id,
        undefined,
        2,
        () => ({
          user_id: user.id,
          parent_petition_field_reply_id: parentReplies[0].id,
        }),
      );
      const replies01 = await mocks.createRandomTextReply(
        fieldGroupChildren[1].id,
        undefined,
        1,
        () => ({
          user_id: user.id,
          parent_petition_field_reply_id: parentReplies[0].id,
        }),
      );

      const replies10 = await mocks.createRandomTextReply(
        fieldGroupChildren[0].id,
        undefined,
        2,
        () => ({
          user_id: user.id,
          parent_petition_field_reply_id: parentReplies[1].id,
        }),
      );
      const replies11 = await mocks.createRandomTextReply(
        fieldGroupChildren[1].id,
        undefined,
        1,
        () => ({
          user_id: user.id,
          parent_petition_field_reply_id: parentReplies[1].id,
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(
              petitionId: $petitionId
              fields: $fields
              overwriteExisting: true
            ) {
              id
              parent {
                id
                children {
                  field {
                    id
                  }
                  replies {
                    id
                    content
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", fieldGroupChildren[0].id),
              parentReplyId: toGlobalId("PetitionFieldReply", parentReplies[0].id),
              content: { value: "My SHORT_TEXT reply" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          id: expect.any(String),
          parent: {
            id: toGlobalId("PetitionFieldReply", parentReplies[0].id),
            children: [
              {
                field: { id: toGlobalId("PetitionField", fieldGroupChildren[0].id) },
                replies: [
                  {
                    id: expect.any(String),
                    content: { value: "My SHORT_TEXT reply" },
                  },
                ],
              },
              {
                field: { id: toGlobalId("PetitionField", fieldGroupChildren[1].id) },
                replies: [
                  {
                    id: toGlobalId("PetitionFieldReply", replies01[0].id),
                    content: replies01[0].content,
                  },
                ],
              },
            ],
          },
        },
      ]);

      const dbDeletedReplies = await mocks.knex
        .from("petition_field_reply")
        .whereIn(
          "id",
          replies00.map((r) => r.id),
        )
        .select("deleted_at");

      expect(dbDeletedReplies).toEqual([
        { deleted_at: expect.any(Date) },
        { deleted_at: expect.any(Date) },
      ]);

      const dbNotDeletedReplies = await mocks.knex
        .from("petition_field_reply")
        .whereIn(
          "id",
          [...replies01, ...replies10, ...replies11].map((r) => r.id),
        )
        .select("deleted_at");

      expect(dbNotDeletedReplies).toEqual([
        { deleted_at: null },
        { deleted_at: null },
        { deleted_at: null },
        { deleted_at: null },
      ]);
    });

    it("sends error if submitting replies without enough credits", async () => {
      await mocks.knex.from("petition").where("id", petition.id).update({ credits_used: 0 });
      await mocks.knex
        .from("organization_usage_limit")
        .where("org_id", organization.id)
        .where("limit_name", "PETITION_SEND")
        .update({
          used: 1000,
          limit: 1000,
        });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", fieldGroup.id),
              content: {},
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("PETITION_SEND_LIMIT_REACHED");
      expect(data).toBeNull();

      await mocks.knex
        .from("organization_usage_limit")
        .where("org_id", organization.id)
        .where("limit_name", "PETITION_SEND")
        .update({
          used: 0,
          limit: 1000,
        });
    });

    it("creates replies on multiple FIELD_GROUP groups on a single request", async () => {
      const groups = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 3, () => ({
        user_id: user.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              parent {
                id
                children {
                  field {
                    id
                  }
                  replies {
                    content
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              parentReplyId: toGlobalId("PetitionFieldReply", groups[0].id),
              id: toGlobalId("PetitionField", fieldGroupChildren[0].id),
              content: { value: "Group 0 Field 0 - 1st reply" },
            },
            {
              parentReplyId: toGlobalId("PetitionFieldReply", groups[0].id),
              id: toGlobalId("PetitionField", fieldGroupChildren[0].id),
              content: { value: "Group 0 Field 0 - 2nd reply" },
            },
            {
              parentReplyId: toGlobalId("PetitionFieldReply", groups[0].id),
              id: toGlobalId("PetitionField", fieldGroupChildren[1].id),
              content: { value: "Group 0 Field 1" },
            },
            {
              parentReplyId: toGlobalId("PetitionFieldReply", groups[1].id),
              id: toGlobalId("PetitionField", fieldGroupChildren[1].id),
              content: { value: "Group 1 Field 1" },
            },
            {
              parentReplyId: toGlobalId("PetitionFieldReply", groups[2].id),
              id: toGlobalId("PetitionField", fieldGroupChildren[0].id),
              content: { value: "Group 2 Field 0" },
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldReplies).toEqual([
        {
          parent: {
            id: toGlobalId("PetitionFieldReply", groups[0].id),
            children: [
              {
                field: { id: toGlobalId("PetitionField", fieldGroupChildren[0].id) },
                replies: [
                  { content: { value: "Group 0 Field 0 - 1st reply" } },
                  { content: { value: "Group 0 Field 0 - 2nd reply" } },
                ],
              },
              {
                field: { id: toGlobalId("PetitionField", fieldGroupChildren[1].id) },
                replies: [{ content: { value: "Group 0 Field 1" } }],
              },
            ],
          },
        },
        {
          parent: {
            id: toGlobalId("PetitionFieldReply", groups[0].id),
            children: [
              {
                field: { id: toGlobalId("PetitionField", fieldGroupChildren[0].id) },
                replies: [
                  { content: { value: "Group 0 Field 0 - 1st reply" } },
                  { content: { value: "Group 0 Field 0 - 2nd reply" } },
                ],
              },
              {
                field: { id: toGlobalId("PetitionField", fieldGroupChildren[1].id) },
                replies: [{ content: { value: "Group 0 Field 1" } }],
              },
            ],
          },
        },
        {
          parent: {
            id: toGlobalId("PetitionFieldReply", groups[0].id),
            children: [
              {
                field: { id: toGlobalId("PetitionField", fieldGroupChildren[0].id) },
                replies: [
                  { content: { value: "Group 0 Field 0 - 1st reply" } },
                  { content: { value: "Group 0 Field 0 - 2nd reply" } },
                ],
              },
              {
                field: { id: toGlobalId("PetitionField", fieldGroupChildren[1].id) },
                replies: [{ content: { value: "Group 0 Field 1" } }],
              },
            ],
          },
        },
        {
          parent: {
            id: toGlobalId("PetitionFieldReply", groups[1].id),
            children: [
              {
                field: { id: toGlobalId("PetitionField", fieldGroupChildren[0].id) },
                replies: [],
              },
              {
                field: { id: toGlobalId("PetitionField", fieldGroupChildren[1].id) },
                replies: [{ content: { value: "Group 1 Field 1" } }],
              },
            ],
          },
        },
        {
          parent: {
            id: toGlobalId("PetitionFieldReply", groups[2].id),
            children: [
              {
                field: { id: toGlobalId("PetitionField", fieldGroupChildren[0].id) },
                replies: [{ content: { value: "Group 2 Field 0" } }],
              },
              {
                field: { id: toGlobalId("PetitionField", fieldGroupChildren[1].id) },
                replies: [],
              },
            ],
          },
        },
      ]);
    });

    it("sends error when trying to create a reply with a pending signature request", async () => {
      await mocks.knex
        .from("petition_signature_request")
        .insert({ petition_id: petition.id, signature_config: {}, status: "PROCESSED" });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", shortText.id),
              content: { value: "My SHORT_TEXT reply" },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("ONGOING_SIGNATURE_REQUEST_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to create a reply with a pending approval request", async () => {
      await mocks.knex.from("petition_approval_request_step").insert({
        petition_id: petition.id,
        step_number: 0,
        step_name: "Step 1",
        status: "PENDING",
        approval_type: "ANY",
      });
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
              field {
                id
                type
              }
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", shortText.id),
              content: { value: "My SHORT_TEXT reply" },
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("ONGOING_APPROVAL_REQUEST_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to submit a reply on a field with replyOnlyFromProfile enabled", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", fieldGroupChildren[0].id)
        .update({
          options: { replyOnlyFromProfile: true },
        });

      const [groupReply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fields: [CreatePetitionFieldReplyInput!]!) {
            createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fields: [
            {
              id: toGlobalId("PetitionField", fieldGroupChildren[0].id),
              parentReplyId: toGlobalId("PetitionFieldReply", groupReply.id),
              content: { value: "My reply" },
            },
          ],
        },
      );

      await mocks.knex
        .from("petition_field")
        .where("id", fieldGroupChildren[0].id)
        .update({
          options: { replyOnlyFromProfile: false },
        });

      expect(errors).toContainGraphQLError("REPLY_ONLY_FROM_PROFILE_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("createDowJonesKycReply", () => {
    let fieldGroup: PetitionField;
    let dowJones: PetitionField;
    let petition: Petition;
    let reply: PetitionFieldReply;
    beforeAll(async () => {
      await mocks.createFeatureFlags([{ name: "DOW_JONES_KYC", default_value: true }]);
      await mocks.createOrgIntegration({
        org_id: organization.id,
        type: "DOW_JONES_KYC",
        provider: "DOW_JONES",
        name: "Dow Jones",
        is_enabled: true,
      });

      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      [fieldGroup] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
      }));

      [dowJones] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "DOW_JONES_KYC",
        parent_petition_field_id: fieldGroup.id,
        position: 0,
      }));

      [reply] = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 1, () => ({
        user_id: user.id,
      }));
    });

    it("creates a dow_jones reply inside a child field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $profileId: ID!, $parentReplyId: GID) {
            createDowJonesKycReply(
              petitionId: $petitionId
              fieldId: $fieldId
              profileId: $profileId
              parentReplyId: $parentReplyId
            ) {
              parent {
                field {
                  id
                }
                children {
                  field {
                    id
                  }
                  replies {
                    id
                    content
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", dowJones.id),
          profileId: "123",
          parentReplyId: toGlobalId("PetitionFieldReply", reply.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createDowJonesKycReply).toEqual({
        parent: {
          field: {
            id: toGlobalId("PetitionField", fieldGroup.id),
          },
          children: [
            {
              field: { id: toGlobalId("PetitionField", dowJones.id) },
              replies: [
                {
                  id: expect.any(String),
                  content: {
                    id: expect.any(String),
                    filename: expect.any(String),
                    size: "0",
                    contentType: "application/pdf",
                    extension: "pdf",
                    uploadComplete: true,
                    entity: {
                      profileId: "123",
                      type: "Person",
                      name: "Mocked FullName",
                      iconHints: [],
                    },
                  },
                },
              ],
            },
          ],
        },
      });
    });

    it("sends error when trying to create a reply with a pending signature request", async () => {
      await mocks.knex
        .from("petition_signature_request")
        .insert({ petition_id: petition.id, signature_config: {}, status: "PROCESSED" });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $profileId: ID!, $parentReplyId: GID) {
            createDowJonesKycReply(
              petitionId: $petitionId
              fieldId: $fieldId
              profileId: $profileId
              parentReplyId: $parentReplyId
            ) {
              parent {
                field {
                  id
                }
                children {
                  field {
                    id
                  }
                  replies {
                    id
                    content
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", dowJones.id),
          profileId: "123",
          parentReplyId: toGlobalId("PetitionFieldReply", reply.id),
        },
      );

      expect(errors).toContainGraphQLError("ONGOING_SIGNATURE_REQUEST_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to create a reply with a pending approval request", async () => {
      await mocks.knex.from("petition_approval_request_step").insert({
        petition_id: petition.id,
        step_number: 0,
        step_name: "Step 1",
        status: "PENDING",
        approval_type: "ANY",
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $profileId: ID!, $parentReplyId: GID) {
            createDowJonesKycReply(
              petitionId: $petitionId
              fieldId: $fieldId
              profileId: $profileId
              parentReplyId: $parentReplyId
            ) {
              parent {
                field {
                  id
                }
                children {
                  field {
                    id
                  }
                  replies {
                    id
                    content
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", dowJones.id),
          profileId: "123",
          parentReplyId: toGlobalId("PetitionFieldReply", reply.id),
        },
      );

      expect(errors).toContainGraphQLError("ONGOING_APPROVAL_REQUEST_ERROR");
      expect(data).toBeNull();
    });
  });
});

import { gql } from "@apollo/client";
import { Knex } from "knex";
import { omit } from "remeda";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Contact,
  FileUpload,
  Organization,
  Petition,
  PetitionAccess,
  PetitionField,
  PetitionFieldReply,
  User,
} from "../../db/__types";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/Petition Field Replies", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let user: User;
  let organization: Organization;
  let petition: Petition;
  let contact: Contact;
  let petitionAccess: PetitionAccess;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);

    [contact] = await mocks.createRandomContacts(organization.id, 1);
    [petitionAccess] = await mocks.createPetitionAccess(
      petition.id,
      user.id,
      [contact.id],
      user.id
    );
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("createPetitionFieldReply", () => {
    afterEach(async () => {
      await mocks.knex("petition_field_reply").delete();
      await mocks.knex("petition_event").delete();
    });

    describe("TEXT, SHORT_TEXT", () => {
      let textField: PetitionField;
      let shortTextField: PetitionField;
      beforeAll(async () => {
        [textField, shortTextField] = await mocks.createRandomPetitionFields(
          petition.id,
          2,
          (i) => ({
            type: i === 0 ? "TEXT" : "SHORT_TEXT",
            options: i === 1 ? { maxLength: 15 } : {},
          })
        );
      });

      it("petition status should change to DRAFT when creating a reply on a already completed petition without recipients", async () => {
        const [completedPetition] = await mocks.createRandomPetitions(
          organization.id,
          user.id,
          1,
          () => ({
            is_template: false,
            status: "COMPLETED",
          })
        );
        const [field] = await mocks.createRandomPetitionFields(completedPetition.id, 1, () => ({
          type: "TEXT",
        }));

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
            fieldId: toGlobalId("PetitionField", field.id),
            reply: "my reply",
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReply).toEqual({
          id: data!.createPetitionFieldReply.id,
          content: { value: "my reply" },
          field: {
            id: toGlobalId("PetitionField", field.id),
            replies: [{ id: data!.createPetitionFieldReply.id }],
            petition: {
              id: toGlobalId("Petition", completedPetition.id),
              status: "DRAFT",
            },
          },
        });
      });

      it("should not be able to create a second reply on a single-reply field", async () => {
        const [singleReplyField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          multiple: false,
          type: "TEXT",
        }));
        await mocks.createRandomTextReply(singleReplyField.id, petitionAccess.id, 1);

        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
            fieldId: toGlobalId("PetitionField", singleReplyField.id),
            reply: "this is my text reply",
          }
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
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", field.id),
            reply: "abcd",
          }
        );
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", field.id),
            reply: "efgh",
          }
        );
        expect(errors).toContainGraphQLError("FIELD_ALREADY_REPLIED_ERROR");
        expect(data).toBeNull();
      });

      it("creates a TEXT reply as an User", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
            fieldId: toGlobalId("PetitionField", textField.id),
            reply: "this is my text reply",
          }
        );

        expect(errors).toBeUndefined();
        expect(omit(data!.createPetitionFieldReply, ["id"])).toEqual({
          status: "PENDING",
          content: { value: "this is my text reply" },
          field: {
            id: toGlobalId("PetitionField", textField.id),
          },
        });

        const { id: replyId } = fromGlobalId(
          data!.createPetitionFieldReply.id,
          "PetitionFieldReply"
        );

        const [row] = await mocks.knex
          .from("petition_field_reply")
          .where("id", replyId)
          .select(["id", "type", "created_by", "user_id", "petition_access_id"]);

        expect(row).toEqual({
          id: replyId,
          type: "TEXT",
          created_by: `User:${user.id}`,
          user_id: user.id,
          petition_access_id: null,
        });
      });

      it("creates a SHORT_TEXT reply as an User", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
            fieldId: toGlobalId("PetitionField", shortTextField.id),
            reply: "short reply",
          }
        );

        expect(errors).toBeUndefined();
        expect(omit(data!.createPetitionFieldReply, ["id"])).toEqual({
          status: "PENDING",
          content: { value: "short reply" },
          field: {
            id: toGlobalId("PetitionField", shortTextField.id),
          },
        });

        const { id: replyId } = fromGlobalId(
          data!.createPetitionFieldReply.id,
          "PetitionFieldReply"
        );

        const [row] = await mocks.knex
          .from("petition_field_reply")
          .where("id", replyId)
          .select(["id", "type", "created_by", "user_id", "petition_access_id"]);

        expect(row).toEqual({
          id: replyId,
          type: "SHORT_TEXT",
          created_by: `User:${user.id}`,
          user_id: user.id,
          petition_access_id: null,
        });
      });

      it("sends error when creating a reply that exceeds field's maxLength", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", shortTextField.id),
            reply: "A".repeat(16),
          }
        );

        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });

      it("sends error when trying to create a TEXT reply with invalid values", async () => {
        for (const reply of [10, ["Hello!"], true, { reply: "this is the reply" }]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
                createPetitionFieldReply(
                  petitionId: $petitionId
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              fieldId: toGlobalId("PetitionField", textField.id),
              reply,
            }
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

      it("creates a SELECT reply as an User", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
            fieldId: toGlobalId("PetitionField", selectField.id),
            reply: "option 1",
          }
        );

        expect(errors).toBeUndefined();
        expect(omit(data!.createPetitionFieldReply, ["id"])).toEqual({
          status: "PENDING",
          content: { value: "option 1" },
          field: {
            id: toGlobalId("PetitionField", selectField.id),
          },
        });

        const { id: replyId } = fromGlobalId(
          data!.createPetitionFieldReply.id,
          "PetitionFieldReply"
        );

        const [row] = await mocks.knex
          .from("petition_field_reply")
          .where("id", replyId)
          .select(["id", "type", "created_by", "user_id", "petition_access_id"]);

        expect(row).toEqual({
          id: replyId,
          type: "SELECT",
          created_by: `User:${user.id}`,
          user_id: user.id,
          petition_access_id: null,
        });
      });

      it("creates REPLY_CREATED event with user_id on payload", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", selectField.id),
            reply: "option 1",
          }
        );

        expect(errors).toBeUndefined();

        const replyId = fromGlobalId(data!.createPetitionFieldReply.id, "PetitionFieldReply").id;

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
        for (const reply of [
          10,
          ["Hello!"],
          true,
          { reply: "this is the reply" },
          "unknown option",
        ]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
                createPetitionFieldReply(
                  petitionId: $petitionId
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              fieldId: toGlobalId("PetitionField", selectField.id),
              reply,
            }
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

      it("creates a new reply type DATE", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
            fieldId: toGlobalId("PetitionField", dateField.id),
            reply: "2012-02-24",
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReply).toEqual({
          id: data!.createPetitionFieldReply.id,
          status: "PENDING",
          content: { value: "2012-02-24" },
          field: {
            id: toGlobalId("PetitionField", dateField.id),
          },
        });
      });

      it("sends error when creating a DATE reply with invalid values", async () => {
        for (const reply of [
          "2022.02.24",
          "2022/01/01",
          "2022-02-45",
          "1900-13-01",
          "hello",
          true,
        ]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
                createPetitionFieldReply(
                  petitionId: $petitionId
                  fieldId: $fieldId
                  reply: $reply
                ) {
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
              fieldId: toGlobalId("PetitionField", dateField.id),
              reply,
            }
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

      it("creates a reply of type NUMBER", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", numberField.id),
            reply: 288,
          }
        );
        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReply).toEqual({
          status: "PENDING",
          content: { value: 288 },
        });
      });

      it("creates a reply of type NUMBER with float value", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", numberField.id),
            reply: Math.PI,
          }
        );
        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReply).toEqual({
          status: "PENDING",
          content: { value: Math.PI },
        });
      });

      it("sends error when creating a NUMBER reply with invalid values", async () => {
        for (const reply of ["hello", true, { a: 1 }, -1]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
                createPetitionFieldReply(
                  petitionId: $petitionId
                  fieldId: $fieldId
                  reply: $reply
                ) {
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
              fieldId: toGlobalId("PetitionField", numberField.id),
              reply,
            }
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        }
      });

      it("sends error when creating a NUMBER reply with value out of range", async () => {
        [numberField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
          type: "NUMBER",
          options: {
            range: {
              min: 0,
              max: 100,
            },
          },
        }));

        for (const reply of [-1, 101]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
                createPetitionFieldReply(
                  petitionId: $petitionId
                  fieldId: $fieldId
                  reply: $reply
                ) {
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
              fieldId: toGlobalId("PetitionField", numberField.id),
              reply,
            }
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

      it("creates a checkbox reply of UNLIMITED subtype", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", unlimitedCheckboxField.id),
            reply: ["1", "2"],
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReply).toEqual({
          status: "PENDING",
          content: { value: ["1", "2"] },
        });
      });

      it("creates a checkbox reply of RADIO subtype", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", radioButtonField.id),
            reply: ["1"],
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReply).toEqual({
          status: "PENDING",
          content: { value: ["1"] },
        });
      });

      it("sends error if creating a reply of RADIO subtype with more than 1 choice", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", radioButtonField.id),
            reply: ["1", "2"],
          }
        );
        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });

      it("creates a checkbox reply of EXACT subtype", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", exactCheckboxField.id),
            reply: ["2", "3"],
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReply).toEqual({
          status: "PENDING",
          content: { value: ["2", "3"] },
        });
      });

      it("sends error if creating a reply of EXACT subtype with invalid number of choices", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", exactCheckboxField.id),
            reply: ["2", "3", "4"],
          }
        );
        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });

      it("creates a checkbox reply of RANGE subtype", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", rangeCheckboxField.id),
            reply: ["1", "2", "3", "4"],
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReply).toEqual({
          status: "PENDING",
          content: { value: ["1", "2", "3", "4"] },
        });
      });

      it("sends error if creating a reply of RANGE subtype with invalid number of choices", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", rangeCheckboxField.id),
            reply: ["1"],
          }
        );
        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });

      it("sends error when creating a CHECKBOX reply with invalid values", async () => {
        for (const reply of ["hello", true, { a: 1 }, 10, []]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
                createPetitionFieldReply(
                  petitionId: $petitionId
                  fieldId: $fieldId
                  reply: $reply
                ) {
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
              fieldId: toGlobalId("PetitionField", unlimitedCheckboxField.id),
              reply,
            }
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

      it("creates a reply of type DYNAMIC_SELECT", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
            reply: [
              ["Comunidad autónoma", "Andalucía"],
              ["Provincia", "Cadiz"],
            ],
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReply).toEqual({
          content: {
            value: [
              ["Comunidad autónoma", "Andalucía"],
              ["Provincia", "Cadiz"],
            ],
          },
        });
      });

      it("creates a partial reply of type DYNAMIC_SELECT", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
            reply: [
              ["Comunidad autónoma", "Andalucía"],
              ["Provincia", null],
            ],
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReply).toEqual({
          content: {
            value: [
              ["Comunidad autónoma", "Andalucía"],
              ["Provincia", null],
            ],
          },
        });
      });

      it("sends error if passing an incomplete list of values", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
            reply: [["Comunidad autónoma", "Andalucía"]],
          }
        );

        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });

      it("sends error if passing an unknown value", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
            reply: [
              ["Comunidad autónoma", "Andalucía"],
              ["Provincia", "Buenos Aires"],
            ],
          }
        );

        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });

      it("sends error when creating a DYNAMIC_SELECT reply with invalid values", async () => {
        for (const reply of ["hello", true, { a: 1 }, 10, [[], []], [["Comunidad autónoma"]]]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
                createPetitionFieldReply(
                  petitionId: $petitionId
                  fieldId: $fieldId
                  reply: $reply
                ) {
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
              fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
              reply,
            }
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
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
            fieldId: toGlobalId("PetitionField", phoneField.id),
            reply: "+34 672 62 55 77",
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReply).toEqual({
          id: data!.createPetitionFieldReply.id,
          status: "PENDING",
          content: { value: "+34 672 62 55 77" },
          field: {
            id: toGlobalId("PetitionField", phoneField.id),
          },
        });
      });

      it("creates a new reply type PHONE with russian number", async () => {
        const { data, errors } = await testClient.mutate({
          mutation: gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
            fieldId: toGlobalId("PetitionField", phoneField.id),
            reply: "+7 (958) 822 25 34",
          },
        });

        expect(errors).toBeUndefined();
        expect(data?.createPetitionFieldReply).toEqual({
          id: data!.createPetitionFieldReply.id,
          status: "PENDING",
          content: { value: "+7 (958) 822 25 34" },
          field: {
            id: toGlobalId("PetitionField", phoneField.id),
          },
        });
      });

      it("sends error when creating a reply with invalid phone in PHONE field", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
              createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
            fieldId: toGlobalId("PetitionField", phoneField.id),
            reply: "+34 672 622 553 774",
          }
        );

        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });
    });
  });

  describe("updatePetitionFieldReply", () => {
    afterEach(async () => {
      await mocks.knex("petition_event").delete();
    });

    describe("TEXT, SHORT_TEXT", () => {
      let textField: PetitionField;
      let rejectedReply: PetitionFieldReply;
      let approvedReply: PetitionFieldReply;

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

        [recipientTextReply] = await mocks.createRandomTextReply(
          textField.id,
          petitionAccess.id,
          1,
          () => ({ created_by: `Contact:${contact.id}` })
        );
      });

      it("petition status should change to PENDING when updating a reply on a already completed petition with active accesses", async () => {
        const [completedPetition] = await mocks.createRandomPetitions(
          organization.id,
          user.id,
          1,
          () => ({
            is_template: false,
            status: "COMPLETED",
          })
        );
        const [access] = await mocks.createPetitionAccess(
          completedPetition.id,
          user.id,
          [contact.id],
          user.id
        );
        const [field] = await mocks.createRandomPetitionFields(completedPetition.id, 1, () => ({
          type: "TEXT",
        }));
        const [reply] = await mocks.createRandomTextReply(field.id, access.id, 1);

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
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
            replyId: toGlobalId("PetitionFieldReply", reply.id),
            reply: "my new reply",
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReply).toEqual({
          id: toGlobalId("PetitionFieldReply", reply.id),
          field: {
            id: toGlobalId("PetitionField", field.id),
            petition: {
              id: toGlobalId("Petition", completedPetition.id),
              status: "PENDING",
            },
          },
        });
      });

      it("should be able to update a rejected reply", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", rejectedReply.id),
            reply: "new reply",
          }
        );

        expect(errors).toBeUndefined();
        expect(data!.updatePetitionFieldReply).toEqual({
          id: toGlobalId("PetitionFieldReply", rejectedReply.id),
          status: "PENDING",
          content: { value: "new reply" },
        });
      });

      it("sends error if trying to update an already approved reply", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", approvedReply.id),
            reply: "new reply",
          }
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
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", reply.id),
            reply: "x".repeat(21),
          }
        );

        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });

      it("updates a simple reply as an User, previously created by a Contact", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", recipientTextReply.id),
            reply: "my new reply",
          }
        );

        expect(errors).toBeUndefined();
        expect(omit(data!.updatePetitionFieldReply, ["id"])).toEqual({
          status: "PENDING",
          content: { value: "my new reply" },
        });

        const replyId = fromGlobalId(data!.updatePetitionFieldReply.id, "PetitionFieldReply").id;

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

      it("updates a simple reply as an User, previously created by an User", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", rejectedReply.id),
            reply: "my new reply",
          }
        );

        expect(errors).toBeUndefined();

        const replyId = fromGlobalId(data!.updatePetitionFieldReply.id, "PetitionFieldReply").id;

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
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", rejectedReply.id),
            reply: "my new reply",
          }
        );

        expect(errors).toBeUndefined();

        const replyId = fromGlobalId(data!.updatePetitionFieldReply.id, "PetitionFieldReply").id;

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
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", rejectedReply.id),
            reply: "my new reply",
          }
        );

        expect(errors).toBeUndefined();

        const replyId = fromGlobalId(data!.updatePetitionFieldReply.id, "PetitionFieldReply").id;

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
          created_at: "2010-01-01",
        });

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                id
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", rejectedReply.id),
            reply: "my new reply",
          }
        );

        expect(errors).toBeUndefined();

        const replyId = fromGlobalId(data!.updatePetitionFieldReply.id, "PetitionFieldReply").id;

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
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", selectFieldReply.id),
            reply: "D",
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReply).toEqual({
          status: "PENDING",
          content: { value: "D" },
        });
      });

      it("sends error when updating a SELECT reply with invalid values", async () => {
        for (const reply of [10, ["Hello!"], true, { reply: "this is the reply" }, "E"]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
                updatePetitionFieldReply(
                  petitionId: $petitionId
                  replyId: $replyId
                  reply: $reply
                ) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              replyId: toGlobalId("PetitionFieldReply", selectFieldReply.id),
              reply,
            }
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
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", dateReply.id),
            reply: "2012-02-21",
          }
        );

        expect(errors).toBeUndefined();
        expect(data!.updatePetitionFieldReply).toEqual({
          id: toGlobalId("PetitionFieldReply", dateReply.id),
          status: "PENDING",
          content: { value: "2012-02-21" },
        });
      });

      it("sends error when updating a DATE reply with invalid values", async () => {
        for (const reply of [10, ["Hello!"], true, "2012-22-24", "2012.01.24", "random text"]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
                updatePetitionFieldReply(
                  petitionId: $petitionId
                  replyId: $replyId
                  reply: $reply
                ) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              replyId: toGlobalId("PetitionFieldReply", dateReply.id),
              reply,
            }
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
          200
        );
      });

      it("updates a NUMBER reply", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", numberReply.id),
            reply: 30,
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReply).toEqual({
          id: toGlobalId("PetitionFieldReply", numberReply.id),
          status: "PENDING",
          content: { value: 30 },
        });
      });

      it("sends error when updating a NUMBER reply with invalid values", async () => {
        for (const reply of [201, ["Hello!"], true, -11]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
                updatePetitionFieldReply(
                  petitionId: $petitionId
                  replyId: $replyId
                  reply: $reply
                ) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              replyId: toGlobalId("PetitionFieldReply", limitedNumberReply.id),
              reply,
            }
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
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", checkboxReply.id),
            reply: ["2"],
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReply).toEqual({
          id: toGlobalId("PetitionFieldReply", checkboxReply.id),
          status: "PENDING",
          content: { value: ["2"] },
        });
      });

      it("sends error when updating a CHECKBOX reply with invalid values", async () => {
        for (const reply of [["1", "2"], ["Hello!"], "1", true, -11]) {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
                updatePetitionFieldReply(
                  petitionId: $petitionId
                  replyId: $replyId
                  reply: $reply
                ) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              replyId: toGlobalId("PetitionFieldReply", checkboxReply.id),
              reply,
            }
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
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                id
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
            reply: [
              ["Comunidad autónoma", "Canarias"],
              ["Provincia", "Lanzarote"],
            ],
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReply).toEqual({
          id: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
          content: {
            value: [
              ["Comunidad autónoma", "Canarias"],
              ["Provincia", "Lanzarote"],
            ],
          },
        });
      });

      it("updates a DYNAMIC_SELECT reply with a partial value", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                id
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
            reply: [
              ["Comunidad autónoma", "Canarias"],
              ["Provincia", null],
            ],
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.updatePetitionFieldReply).toEqual({
          id: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
          content: {
            value: [
              ["Comunidad autónoma", "Canarias"],
              ["Provincia", null],
            ],
          },
        });
      });

      it("sends error when updating a DYNAMIC_SELECT reply with invalid values", async () => {
        for (const reply of [
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
              mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
                updatePetitionFieldReply(
                  petitionId: $petitionId
                  replyId: $replyId
                  reply: $reply
                ) {
                  id
                }
              }
            `,
            {
              petitionId: toGlobalId("Petition", petition.id),
              replyId: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
              reply,
            }
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
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", phoneReply.id),
            reply: "+34 674 15 15 36",
          }
        );

        expect(errors).toBeUndefined();
        expect(data!.updatePetitionFieldReply).toEqual({
          id: toGlobalId("PetitionFieldReply", phoneReply.id),
          status: "PENDING",
          content: { value: "+34 674 15 15 36" },
        });
      });

      it("sends error trying to update a PHONE reply with a invalid phone", async () => {
        const { data, errors } = await testClient.execute(
          gql`
            mutation ($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
              updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
                id
                status
                content
              }
            }
          `,
          {
            petitionId: toGlobalId("Petition", petition.id),
            replyId: toGlobalId("PetitionFieldReply", phoneReply.id),
            reply: "tel: +34 674 15 15 36",
          }
        );

        expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
        expect(data).toBeNull();
      });
    });
  });

  describe("createFileUploadReply", () => {
    let fileUploadField: PetitionField;
    let fileUploadReplyGID: string;

    beforeAll(async () => {
      [fileUploadField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FILE_UPLOAD",
      }));
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
            size: 50 * 1024 * 1024 + 1,
          },
        }
      );
      expect(errors).toContainGraphQLError("MAX_FILE_SIZE_EXCEEDED_ERROR");
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
        }
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
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.createFileUploadReplyComplete).toEqual({
        id: fileUploadReplyGID,
        content: {
          filename: "my_file.txt",
          size: "500",
          contentType: "text/plain",
          extension: "txt",
          uploadComplete: true,
        },
        status: "PENDING",
      });
    });
  });

  describe("updateFileUploadReply", () => {
    let fileUploadReply: PetitionFieldReply;

    beforeAll(async () => {
      const [fileUploadField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FILE_UPLOAD",
      }));
      [fileUploadReply] = await mocks.createRandomFileReply(fileUploadField.id, 1, () => ({
        user_id: user.id,
      }));
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
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.updateFileUploadReply).toEqual({
        presignedPostData: { url: "", fields: {} },
        reply: {
          id: toGlobalId("PetitionFieldReply", fileUploadReply.id),
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
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.updateFileUploadReplyComplete).toEqual({
        id: toGlobalId("PetitionFieldReply", fileUploadReply.id),
        content: {
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
  });

  describe("deletePetitionReply", () => {
    let textField: PetitionField;
    let uploadedFile: FileUpload;
    let userFileReply: PetitionFieldReply;
    let approvedReply: PetitionFieldReply;
    let rejectedReply: PetitionFieldReply;
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
    });

    it("petition status should change to PENDING when deleting a reply on a already completed petition with accesses", async () => {
      const [completedPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1,
        () => ({
          is_template: false,
          status: "COMPLETED",
        })
      );
      const [access] = await mocks.createPetitionAccess(
        completedPetition.id,
        user.id,
        [contact.id],
        user.id
      );
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
        }
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

    it("petition status should change to DRAFT when deleting a reply on a already completed petition without accesses", async () => {
      const [completedPetition] = await mocks.createRandomPetitions(
        organization.id,
        user.id,
        1,
        () => ({
          is_template: false,
          status: "COMPLETED",
        })
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
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionReply).toEqual({
        id: toGlobalId("PetitionField", field.id),
        petition: {
          id: toGlobalId("Petition", completedPetition.id),
          status: "DRAFT",
        },
      });
    });

    it("deletes a TEXT reply as an User", async () => {
      const [userSimpleReply] = await mocks.createRandomTextReply(
        textField.id,
        petitionAccess.id,
        1
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
        }
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
        }
      );

      expect(errors).toBeUndefined();

      const reply = await mocks.knex.raw(
        /* sql */ `
        SELECT id from petition_field_reply where id = ? and deleted_at is null
      `,
        [userFileReply.id]
      );

      expect(reply.rowCount).toEqual(0);

      const file = await mocks.knex.raw(
        /* sql */ `
        SELECT id from file_upload where id = ? and deleted_at is null
      `,
        [uploadedFile.id]
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
        }
      );

      expect(errors).toContainGraphQLError("REPLY_ALREADY_APPROVED_ERROR");
      expect(data).toBeNull();
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
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionReply).toEqual({
        id: toGlobalId("PetitionField", textField.id),
      });
    });
  });
});

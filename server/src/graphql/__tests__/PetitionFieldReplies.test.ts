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
  let fields: PetitionField[];

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
    fields = await mocks.createRandomPetitionFields(petition.id, 3, (i) => ({
      is_fixed: false,
      validated: false,
      type: i === 0 ? "TEXT" : i === 1 ? "SELECT" : "FILE_UPLOAD",
      options: i === 1 ? { values: ["option 1", "option 2"] } : {},
      multiple: i > 0,
    }));

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

  describe("createSimpleReply", () => {
    afterEach(async () => {
      await mocks.knex("petition_field_reply").delete();
      await mocks.knex("petition_event").delete();
    });

    it("should not be able to create a second reply on a single-reply field", async () => {
      await mocks.createRandomTextReply(fields[0].id, petitionAccess.id, 1);

      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $reply: String!) {
            createSimpleReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
          fieldId: toGlobalId("PetitionField", fields[0].id),
          reply: "this is my text reply",
        },
      });

      expect(errors).toContainGraphQLError("FIELD_ALREADY_REPLIED_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to create a simple reply on an already validated field", async () => {
      const [validatedField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        validated: true,
        type: "TEXT",
        multiple: true,
      }));
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $reply: String!) {
            createSimpleReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", validatedField.id),
          reply: ".",
        },
      });

      expect(errors).toContainGraphQLError("FIELD_ALREADY_VALIDATED_ERROR");
      expect(data).toBeNull();
    });

    it("creates a simple reply as an User", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $reply: String!) {
            createSimpleReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
          fieldId: toGlobalId("PetitionField", fields[0].id),
          reply: "this is my text reply",
        },
      });

      expect(errors).toBeUndefined();
      expect(omit(data!.createSimpleReply, ["id"])).toEqual({
        status: "PENDING",
        content: { text: "this is my text reply" },
        field: {
          id: toGlobalId("PetitionField", fields[0].id),
        },
      });

      const replyId = fromGlobalId(data!.createSimpleReply.id, "PetitionFieldReply").id;

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

    it("creates REPLY_CREATED event with user_id on payload", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $reply: String!) {
            createSimpleReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", fields[1].id),
          reply: "option 1",
        },
      });

      expect(errors).toBeUndefined();

      const replyId = fromGlobalId(data!.createSimpleReply.id, "PetitionFieldReply").id;

      const events = await mocks.knex
        .from("petition_event")
        .where("petition_id", petition.id)
        .select(["type", "data"]);

      expect(events).toEqual([
        {
          type: "REPLY_CREATED",
          data: {
            petition_field_id: fields[1].id,
            petition_field_reply_id: replyId,
            user_id: user.id,
          },
        },
      ]);
    });

    it("sends error when creating a reply on a FILE_UPLOAD field", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $reply: String!) {
            createSimpleReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
          fieldId: toGlobalId("PetitionField", fields[2].id),
          reply: "this is my text reply",
        },
      });

      expect(errors).toContainGraphQLError("INVALID_FIELD_TYPE_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when creating a reply from a SELECT field with unknown option", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $reply: String!) {
            createSimpleReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
          fieldId: toGlobalId("PetitionField", fields[1].id),
          reply: "unknown option",
        },
      });

      expect(errors).toContainGraphQLError("INVALID_OPTION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("updateSimpleReply", () => {
    let recipientTextReply: PetitionFieldReply;
    let userTextReply: PetitionFieldReply;
    let userFileReply: PetitionFieldReply;
    let userSelectReply: PetitionFieldReply;
    let approvedReply: PetitionFieldReply;
    let rejectedReply: PetitionFieldReply;
    beforeAll(async () => {
      [recipientTextReply] = await mocks.createRandomTextReply(
        fields[0].id,
        petitionAccess.id,
        1,
        () => ({ created_by: `Contact:${contact.id}` })
      );
      [userTextReply] = await mocks.createRandomTextReply(fields[0].id, 0, 1, () => ({
        user_id: user.id,
        petition_access_id: null,
        created_by: `User:${user.id}`,
      }));

      [userFileReply] = await mocks.createRandomFileReply(fields[2].id, 1, () => ({
        user_id: user.id,
        petition_access_id: null,
      }));

      [userSelectReply] = await mocks.createRandomTextReply(fields[1].id, 0, 1, () => ({
        user_id: user.id,
        petition_access_id: null,
        type: "SELECT",
        content: { text: "option 1" },
      }));
      [approvedReply] = await mocks.createRandomTextReply(fields[1].id, 0, 1, () => ({
        user_id: user.id,
        petition_access_id: null,
        type: "SELECT",
        content: { text: "option 1" },
        status: "APPROVED",
      }));
      [rejectedReply] = await mocks.createRandomTextReply(fields[1].id, 0, 1, () => ({
        user_id: user.id,
        petition_access_id: null,
        type: "SELECT",
        content: { text: "option 2" },
        status: "REJECTED",
      }));
    });

    afterEach(async () => {
      await mocks.knex("petition_event").delete();
    });

    it("should be able to update a rejected reply", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $reply: String!) {
            updateSimpleReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
              id
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", rejectedReply.id),
          reply: "option 1",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updateSimpleReply).toEqual({
        id: toGlobalId("PetitionFieldReply", rejectedReply.id),
        status: "PENDING",
        content: { text: "option 1" },
      });
    });

    it("updates a simple reply as an User, previously created by a Contact", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $reply: String!) {
            updateSimpleReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
              id
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", recipientTextReply.id),
          reply: "my new reply",
        },
      });

      expect(errors).toBeUndefined();
      expect(omit(data!.updateSimpleReply, ["id"])).toEqual({
        status: "PENDING",
        content: { text: "my new reply" },
      });

      const replyId = fromGlobalId(data!.updateSimpleReply.id, "PetitionFieldReply").id;

      const [row] = await mocks.knex
        .from("petition_field_reply")
        .where("id", replyId)
        .select(["id", "type", "created_by", "updated_by", "user_id", "petition_access_id"]);

      expect(row).toEqual({
        id: replyId,
        type: "TEXT",
        created_by: `Contact:${contact.id}`,
        updated_by: `User:${user.id}`,
        user_id: null,
        petition_access_id: petitionAccess.id,
      });
    });

    it("updates a simple reply as an User, previously created by an User", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $reply: String!) {
            updateSimpleReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
              id
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", userTextReply.id),
          reply: "my new reply",
        },
      });

      expect(errors).toBeUndefined();

      const replyId = fromGlobalId(data!.updateSimpleReply.id, "PetitionFieldReply").id;

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
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $reply: String!) {
            updateSimpleReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", userTextReply.id),
          reply: "my new reply",
        },
      });

      expect(errors).toBeUndefined();

      const replyId = fromGlobalId(data!.updateSimpleReply.id, "PetitionFieldReply").id;

      const events = await mocks.knex
        .from("petition_event")
        .where("petition_id", petition.id)
        .select(["type", "data"]);

      expect(events).toEqual([
        {
          type: "REPLY_UPDATED",
          data: {
            petition_field_id: fields[0].id,
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
          petition_field_id: fields[0].id,
          user_id: user.id,
          petition_field_reply_id: userTextReply.id,
        },
      });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $reply: String!) {
            updateSimpleReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", userTextReply.id),
          reply: "my new reply",
        },
      });

      expect(errors).toBeUndefined();

      const replyId = fromGlobalId(data!.updateSimpleReply.id, "PetitionFieldReply").id;

      const events = await mocks.knex
        .from("petition_event")
        .where("petition_id", petition.id)
        .select(["type", "data"]);

      // there should be just one event
      expect(events).toEqual([
        {
          type: "REPLY_CREATED",
          data: {
            petition_field_id: fields[0].id,
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
          petition_field_id: fields[0].id,
          user_id: user.id,
          petition_field_reply_id: userTextReply.id,
        },
        created_at: "2010-01-01",
      });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $reply: String!) {
            updateSimpleReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", userTextReply.id),
          reply: "my new reply",
        },
      });

      expect(errors).toBeUndefined();

      const replyId = fromGlobalId(data!.updateSimpleReply.id, "PetitionFieldReply").id;

      const events = await mocks.knex
        .from("petition_event")
        .where("petition_id", petition.id)
        .select(["type", "data"]);

      expect(events).toEqual([
        {
          type: "REPLY_CREATED",
          data: {
            petition_field_id: fields[0].id,
            petition_field_reply_id: replyId,
            user_id: user.id,
          },
        },
        {
          type: "REPLY_UPDATED",
          data: {
            petition_field_id: fields[0].id,
            petition_field_reply_id: replyId,
            user_id: user.id,
          },
        },
      ]);
    });

    it("sends error when updating a reply on a FILE_UPLOAD field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $reply: String!) {
            updateSimpleReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", userFileReply.id),
          reply: "my new reply",
        },
      });

      expect(errors).toContainGraphQLError("INVALID_FIELD_TYPE_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when updating a reply from a SELECT field with unknown option", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $reply: String!) {
            updateSimpleReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", userSelectReply.id),
          reply: "unknown option",
        },
      });

      expect(errors).toContainGraphQLError("INVALID_OPTION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if trying to update an already approved reply", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $reply: String!) {
            updateSimpleReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", approvedReply.id),
          reply: "option 2",
        },
      });

      expect(errors).toContainGraphQLError("REPLY_ALREADY_APPROVED_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("createCheckboxReply", () => {
    let checkboxField: PetitionField;
    beforeAll(async () => {
      [checkboxField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "CHECKBOX",
        multiple: true,
        validated: false,
        options: {
          values: ["1", "2", "3"],
          limit: {
            type: "UNLIMITED",
            min: 1,
            max: 1,
          },
        },
      }));
    });

    it("creates a checkbox reply", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $values: [String!]!) {
            createCheckboxReply(petitionId: $petitionId, fieldId: $fieldId, values: $values) {
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", checkboxField.id),
          values: ["1", "2"],
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createCheckboxReply).toEqual({
        status: "PENDING",
        content: { choices: ["1", "2"] },
      });
    });

    it("sends error if trying to submit wrong option", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $values: [String!]!) {
            createCheckboxReply(petitionId: $petitionId, fieldId: $fieldId, values: $values) {
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", checkboxField.id),
          values: ["1", "unknown"],
        },
      });

      expect(errors).toContainGraphQLError("INVALID_OPTION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if trying to create a checkbox reply on an already validated field", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", checkboxField.id)
        .update("validated", true);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $values: [String!]!) {
            createCheckboxReply(petitionId: $petitionId, fieldId: $fieldId, values: $values) {
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", checkboxField.id),
          values: ["1"],
        },
      });

      expect(errors).toContainGraphQLError("FIELD_ALREADY_VALIDATED_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("updateCheckboxReply", () => {
    let checkboxField: PetitionField;
    let fieldReply: PetitionFieldReply;

    beforeAll(async () => {
      [checkboxField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "CHECKBOX",
        multiple: true,
        validated: false,
        options: {
          values: ["1", "2", "3"],
          limit: {
            type: "RADIO",
            min: 1,
            max: 1,
          },
        },
      }));
    });

    beforeEach(async () => {
      await mocks.knex.from("petition_field_reply").delete();
      [fieldReply] = await mocks.knex
        .from<PetitionFieldReply>("petition_field_reply")
        .insert({
          content: { choices: ["1"] },
          petition_field_id: checkboxField.id,
          user_id: user.id,
          status: "PENDING",
          type: "CHECKBOX",
        })
        .returning("*");
    });

    it("updates a checkbox reply", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $values: [String!]!) {
            updateCheckboxReply(petitionId: $petitionId, replyId: $replyId, values: $values) {
              id
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", fieldReply.id),
          values: ["2"],
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.updateCheckboxReply).toEqual({
        id: toGlobalId("PetitionFieldReply", fieldReply.id),
        status: "PENDING",
        content: { choices: ["2"] },
      });
    });

    it("sends error if trying to update wrong option on reply", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $values: [String!]!) {
            updateCheckboxReply(petitionId: $petitionId, replyId: $replyId, values: $values) {
              id
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", fieldReply.id),
          values: ["invalid"],
        },
      });

      expect(errors).toContainGraphQLError("INVALID_OPTION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if trying to update with more than one choice on a CHECKBOX reply of subtype RADIO", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $values: [String!]!) {
            updateCheckboxReply(petitionId: $petitionId, replyId: $replyId, values: $values) {
              id
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", fieldReply.id),
          values: ["1", "2"],
        },
      });

      expect(errors).toContainGraphQLError("INVALID_OPTION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if trying to update an already approved checkbox reply", async () => {
      await mocks.knex
        .from("petition_field_reply")
        .where("id", fieldReply.id)
        .update("status", "APPROVED");

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $values: [String!]!) {
            updateCheckboxReply(petitionId: $petitionId, replyId: $replyId, values: $values) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", fieldReply.id),
          values: ["1"],
        },
      });

      expect(errors).toContainGraphQLError("REPLY_ALREADY_APPROVED_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("createDynamicSelectReply", () => {
    let dynamicSelectField: PetitionField;
    beforeAll(async () => {
      [dynamicSelectField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "DYNAMIC_SELECT",
        multiple: false,
        validated: false,

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

    beforeEach(async () => {
      await mocks.knex.from("petition_field_reply").delete();
    });

    it("creates a reply of type DYNAMIC_SELECT", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $value: [[String]!]!) {
            createDynamicSelectReply(petitionId: $petitionId, fieldId: $fieldId, value: $value) {
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
          value: [
            ["Comunidad autónoma", "Andalucía"],
            ["Provincia", "Cadiz"],
          ],
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createDynamicSelectReply).toEqual({
        content: {
          columns: [
            ["Comunidad autónoma", "Andalucía"],
            ["Provincia", "Cadiz"],
          ],
        },
      });
    });

    it("sends error if passing an incomplete list of values", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $value: [[String]!]!) {
            createDynamicSelectReply(petitionId: $petitionId, fieldId: $fieldId, value: $value) {
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
          value: [["Comunidad autónoma", "Andalucía"]],
        },
      });

      expect(errors).toContainGraphQLError("INVALID_OPTION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if passing an unknown value", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $value: [[String]!]!) {
            createDynamicSelectReply(petitionId: $petitionId, fieldId: $fieldId, value: $value) {
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
          value: [
            ["Comunidad autónoma", "Andalucía"],
            ["Provincia", "Buenos Aires"],
          ],
        },
      });

      expect(errors).toContainGraphQLError("INVALID_OPTION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if trying to create a reply on an already validated field", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", dynamicSelectField.id)
        .update("validated", true);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $value: [[String]!]!) {
            createDynamicSelectReply(petitionId: $petitionId, fieldId: $fieldId, value: $value) {
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
          value: [
            ["Comunidad autónoma", "Andalucía"],
            ["Provincia", "Cadiz"],
          ],
        },
      });

      expect(errors).toContainGraphQLError("FIELD_ALREADY_VALIDATED_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if trying to create a reply on a single-reply field with a previously submitted reply", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", dynamicSelectField.id)
        .update({ validated: false, multiple: false });

      await mocks.knex.from<PetitionFieldReply>("petition_field_reply").insert({
        content: {
          columns: [
            ["Comunidad autónoma", "Andalucía"],
            ["Provincia", "Cadiz"],
          ],
        },
        type: "DYNAMIC_SELECT",
        status: "PENDING",
        petition_field_id: dynamicSelectField.id,
        user_id: user.id,
      });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $value: [[String]!]!) {
            createDynamicSelectReply(petitionId: $petitionId, fieldId: $fieldId, value: $value) {
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
          value: [
            ["Comunidad autónoma", "Andalucía"],
            ["Provincia", "Cadiz"],
          ],
        },
      });

      expect(errors).toContainGraphQLError("FIELD_ALREADY_REPLIED_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("updateDynamicSelectReply", () => {
    let dynamicSelectField: PetitionField;
    let dynamicSelectReply: PetitionFieldReply;
    beforeAll(async () => {
      [dynamicSelectField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "DYNAMIC_SELECT",
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
            columns: [
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
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $value: [[String]!]!) {
            updateDynamicSelectReply(petitionId: $petitionId, replyId: $replyId, value: $value) {
              id
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
          value: [
            ["Comunidad autónoma", "Canarias"],
            ["Provincia", "Lanzarote"],
          ],
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.updateDynamicSelectReply).toEqual({
        id: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
        content: {
          columns: [
            ["Comunidad autónoma", "Canarias"],
            ["Provincia", "Lanzarote"],
          ],
        },
      });
    });

    it("updates a DYNAMIC_SELECT reply with a partial value", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $value: [[String]!]!) {
            updateDynamicSelectReply(petitionId: $petitionId, replyId: $replyId, value: $value) {
              id
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
          value: [
            ["Comunidad autónoma", "Canarias"],
            ["Provincia", null],
          ],
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.updateDynamicSelectReply).toEqual({
        id: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
        content: {
          columns: [
            ["Comunidad autónoma", "Canarias"],
            ["Provincia", null],
          ],
        },
      });
    });

    it("sends error when trying to update the reply of a DYNAMIC_SELECT field with an invalid option", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $value: [[String]!]!) {
            updateDynamicSelectReply(petitionId: $petitionId, replyId: $replyId, value: $value) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
          value: [
            ["Comunidad autónoma", "Canarias"],
            ["Provincia", "Unknown"],
          ],
        },
      });

      expect(errors).toContainGraphQLError("INVALID_OPTION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to update a reply on an already validated field", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", dynamicSelectField.id)
        .update("validated", true);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $value: [[String]!]!) {
            updateDynamicSelectReply(petitionId: $petitionId, replyId: $replyId, value: $value) {
              id
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
          value: [
            ["Comunidad autónoma", "Canarias"],
            ["Provincia", "Lanzarote"],
          ],
        },
      });

      expect(errors).toContainGraphQLError("FIELD_ALREADY_VALIDATED_ERROR");
      expect(data).toBeNull();
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
      const { errors, data } = await testClient.mutate({
        mutation: gql`
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
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", fileUploadField.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 50 * 1024 * 1024 + 1,
          },
        },
      });
      expect(errors).toContainGraphQLError("MAX_FILE_SIZE_EXCEEDED_ERROR");
      expect(data).toBeNull();
    });

    it("returns a file reply with incomplete upload and an AWS signed upload endpoint", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
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
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", fileUploadField.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 500,
          },
        },
      });

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
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            fileUploadReplyComplete(petitionId: $petitionId, replyId: $replyId) {
              id
              content
              status
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: fileUploadReplyGID,
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.fileUploadReplyComplete).toEqual({
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

  describe("deletePetitionReply", () => {
    let userSimpleReply: PetitionFieldReply;
    let uploadedFile: FileUpload;
    let userFileReply: PetitionFieldReply;
    let approvedReply: PetitionFieldReply;
    let rejectedReply: PetitionFieldReply;
    beforeAll(async () => {
      [userSimpleReply] = await mocks.createRandomTextReply(fields[0].id, 0, 1, () => ({
        petition_access_id: null,
        user_id: user.id,
      }));

      [uploadedFile] = await mocks.createRandomFileUpload();
      [userFileReply] = await mocks.createRandomFileReply(fields[2].id, 1, () => ({
        content: { file_upload_id: uploadedFile.id },
        user_id: user.id,
        petition_access_id: null,
      }));
      [approvedReply] = await mocks.createRandomTextReply(fields[0].id, 0, 1, () => ({
        petition_access_id: null,
        user_id: user.id,
        status: "APPROVED",
      }));
      [rejectedReply] = await mocks.createRandomTextReply(fields[0].id, 0, 1, () => ({
        petition_access_id: null,
        user_id: user.id,
        status: "REJECTED",
      }));
    });

    it("deletes a simple reply as an User", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId)
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", userSimpleReply.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.deletePetitionReply).toBe("SUCCESS");
    });

    it("deletes a file reply and its entry on file_upload table", async () => {
      const { errors } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId)
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", userFileReply.id),
        },
      });

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
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId)
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", approvedReply.id),
        },
      });

      expect(errors).toContainGraphQLError("REPLY_ALREADY_APPROVED_ERROR");
      expect(data).toBeNull();
    });

    it("should be able to delete a rejected reply", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId)
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", rejectedReply.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionReply).toEqual("SUCCESS");
    });
  });
});

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

      expect(errors).toContainGraphQLError("FORBIDDEN");
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

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("updateSimpleReply", () => {
    let recipientTextReply: PetitionFieldReply;
    let userTextReply: PetitionFieldReply;
    let userFileReply: PetitionFieldReply;
    let userSelectReply: PetitionFieldReply;
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
    });

    afterEach(async () => {
      await mocks.knex("petition_event").delete();
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

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
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

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("deletePetitionReply", () => {
    let userSimpleReply: PetitionFieldReply;
    let uploadedFile: FileUpload;
    let userFileReply: PetitionFieldReply;

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
  });
});

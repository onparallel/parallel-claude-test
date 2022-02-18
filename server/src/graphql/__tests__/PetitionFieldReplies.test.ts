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
    let dateField: PetitionField;
    let phoneField: PetitionField;

    beforeAll(async () => {
      [dateField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "DATE",
        options: {},
        multiple: true,
        optional: true,
      }));

      [phoneField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "PHONE",
        options: {},
        multiple: true,
        optional: true,
      }));
    });

    afterEach(async () => {
      await mocks.knex("petition_field_reply").delete();
      await mocks.knex("petition_event").delete();
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

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $reply: String!) {
            createSimpleReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
        variables: {
          petitionId: toGlobalId("Petition", completedPetition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          reply: "my reply",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createSimpleReply).toEqual({
        id: data!.createSimpleReply.id,
        content: { text: "my reply" },
        field: {
          id: toGlobalId("PetitionField", field.id),
          replies: [{ id: data!.createSimpleReply.id }],
          petition: {
            id: toGlobalId("Petition", completedPetition.id),
            status: "DRAFT",
          },
        },
      });
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

    it("creates a new reply type DATE", async () => {
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
          fieldId: toGlobalId("PetitionField", dateField.id),
          reply: "2012-02-24",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createSimpleReply).toEqual({
        id: data!.createSimpleReply.id,
        status: "PENDING",
        content: { value: "2012-02-24" },
        field: {
          id: toGlobalId("PetitionField", dateField.id),
        },
      });
    });

    it("creates a new reply type PHONE with spanish number", async () => {
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
          fieldId: toGlobalId("PetitionField", phoneField.id),
          reply: "+34 672 62 55 77",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createSimpleReply).toEqual({
        id: data!.createSimpleReply.id,
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
          fieldId: toGlobalId("PetitionField", phoneField.id),
          reply: "+7 (958) 822 25 34",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createSimpleReply).toEqual({
        id: data!.createSimpleReply.id,
        status: "PENDING",
        content: { value: "+7 (958) 822 25 34" },
        field: {
          id: toGlobalId("PetitionField", phoneField.id),
        },
      });
    });

    it("sends error when creating a reply with wrong format date in DATE field", async () => {
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
          fieldId: toGlobalId("PetitionField", dateField.id),
          reply: "2012.02.24",
        },
      });

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when creating a reply with wrong date in DATE field", async () => {
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
          fieldId: toGlobalId("PetitionField", dateField.id),
          reply: "2012-22-24",
        },
      });

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when creating a reply with invalid phone in PHONE field", async () => {
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
          fieldId: toGlobalId("PetitionField", phoneField.id),
          reply: "+34 672 622 553 774",
        },
      });

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
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

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when creating a reply that exceeds field's maxLength", async () => {
      const [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "TEXT",
        options: {
          maxLength: 10,
        },
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
          fieldId: toGlobalId("PetitionField", field.id),
          reply: "A".repeat(11),
        },
      });

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("updateSimpleReply", () => {
    let recipientTextReply: PetitionFieldReply;
    let userTextReply: PetitionFieldReply;
    let userFileReply: PetitionFieldReply;
    let userSelectReply: PetitionFieldReply;
    let dateReply: PetitionFieldReply;
    let approvedReply: PetitionFieldReply;
    let rejectedReply: PetitionFieldReply;
    let phoneReply: PetitionFieldReply;

    beforeAll(async () => {
      const [dateField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "DATE",
        options: {},
        multiple: true,
        optional: true,
      }));

      const [phoneField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "PHONE",
        options: {},
        multiple: true,
        optional: true,
      }));

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
      [dateReply] = await mocks.createRandomDateReply(dateField.id, 0, 1, () => ({
        user_id: user.id,
        petition_access_id: null,
        created_by: `User:${user.id}`,
      }));
      [phoneReply] = await mocks.createRandomPhoneReply(phoneField.id, 0, 1, () => ({
        user_id: user.id,
        petition_access_id: null,
        created_by: `User:${user.id}`,
      }));
    });

    afterEach(async () => {
      await mocks.knex("petition_event").delete();
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
      const [reply] = await mocks.createRandomTextReply(field.id, 0, 1, () => ({
        petition_access_id: null,
        user_id: user.id,
      }));

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $reply: String!) {
            updateSimpleReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
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
        variables: {
          petitionId: toGlobalId("Petition", completedPetition.id),
          replyId: toGlobalId("PetitionFieldReply", reply.id),
          reply: "my new reply",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.updateSimpleReply).toEqual({
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

    it("updates a reply type DATE", async () => {
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
          replyId: toGlobalId("PetitionFieldReply", dateReply.id),
          reply: "2012-02-21",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updateSimpleReply).toEqual({
        id: toGlobalId("PetitionFieldReply", dateReply.id),
        status: "PENDING",
        content: { value: "2012-02-21" },
      });
    });

    it("updates a reply type PHONE", async () => {
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
          replyId: toGlobalId("PetitionFieldReply", phoneReply.id),
          reply: "+34 674 15 15 36",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updateSimpleReply).toEqual({
        id: toGlobalId("PetitionFieldReply", phoneReply.id),
        status: "PENDING",
        content: { value: "+34 674 15 15 36" },
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
        user_id: user.id,
        petition_access_id: null,
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

    it("sends error trying to update a DATE field with invalid date", async () => {
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
          replyId: toGlobalId("PetitionFieldReply", dateReply.id),
          reply: "2012-22-24",
        },
      });

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error trying to update a DATE field with invalid format", async () => {
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
          replyId: toGlobalId("PetitionFieldReply", dateReply.id),
          reply: "2012.01.24",
        },
      });

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error trying to update a PHONE reply with a invalid phone", async () => {
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
          replyId: toGlobalId("PetitionFieldReply", phoneReply.id),
          reply: "tel: +34 674 15 15 36",
        },
      });

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
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

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
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

    it("sends error if trying to update a reply with more chars than allowed on the field", async () => {
      const [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "TEXT",
        options: {
          maxLength: 10,
        },
      }));
      const [reply] = await mocks.createRandomTextReply(field.id, 0, 1, () => ({
        content: { text: "valid" },
        user_id: user.id,
        petition_access_id: null,
      }));

      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $reply: String!) {
            updateSimpleReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", reply.id),
          reply: "AAA".repeat(11),
        },
      });

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("createCheckboxReply", () => {
    let checkboxField: PetitionField;
    beforeAll(async () => {
      [checkboxField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
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

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if trying to create a checkbox reply on an already approved field", async () => {
      const [singleReplyCheckboxField] = await mocks.createRandomPetitionFields(
        petition.id,
        1,
        () => ({
          type: "CHECKBOX",
          multiple: false,
          options: {
            values: ["1", "2", "3"],
            limit: {
              type: "RADIO",
              min: 1,
              max: 1,
            },
          },
        })
      );
      await testClient.mutate({
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
          fieldId: toGlobalId("PetitionField", singleReplyCheckboxField.id),
          values: ["1"],
        },
      });
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
          fieldId: toGlobalId("PetitionField", singleReplyCheckboxField.id),
          values: ["2"],
        },
      });
      expect(errors).toContainGraphQLError("FIELD_ALREADY_REPLIED_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("createNumericReply", () => {
    let numberField: PetitionField;

    beforeAll(async () => {
      [numberField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "NUMBER",
        options: {
          range: {
            isActive: false,
            min: 0,
          },
        },
        multiple: false,
        optional: true,
      }));
    });

    it("creates a reply of type NUMBER", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $reply: Float!) {
            createNumericReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", numberField.id),
          reply: 288,
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.createNumericReply).toEqual({
        status: "PENDING",
        content: { value: 288 },
      });
    });

    it("sends error if passing invalid reply on a NUMBER field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $reply: Float!) {
            createNumericReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", numberField.id),
          reply: "invalid value",
        },
      });
      expect(errors).toContainGraphQLError("BAD_USER_INPUT");
      expect(data).toBeUndefined();
    });

    it("sends error if trying to create a reply on a single-reply field with a previously submitted reply", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $reply: Float!) {
            createNumericReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", numberField.id),
          reply: 123,
        },
      });
      expect(errors).toContainGraphQLError("FIELD_ALREADY_REPLIED_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("updateNumericReply", () => {
    let numberReply: PetitionFieldReply;
    let limitedNumberReply: PetitionFieldReply;
    let approvedReply: PetitionFieldReply;

    beforeAll(async () => {
      const [numberField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "NUMBER",
        options: {
          range: {
            isActive: false,
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
            isActive: true,
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

      [approvedReply] = await mocks.createRandomNumberReply(numberField.id, 0, 1, () => ({
        petition_access_id: null,
        user_id: user.id,
        status: "APPROVED",
        type: "NUMBER",
      }));
    });

    it("updates a NUMBER reply", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $reply: Float!) {
            updateNumericReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
              id
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", numberReply.id),
          reply: 30,
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.updateNumericReply).toEqual({
        id: toGlobalId("PetitionFieldReply", numberReply.id),
        status: "PENDING",
        content: { value: 30 },
      });
    });

    it("sends error when trying to update the reply of a NUMBER field with an invalid reply", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $reply: Float!) {
            updateNumericReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
              id
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", limitedNumberReply.id),
          reply: 300000,
        },
      });

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to update an approved reply", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $reply: Float!) {
            updateNumericReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
              id
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", approvedReply.id),
          reply: 30,
        },
      });
      expect(errors).toContainGraphQLError("REPLY_ALREADY_APPROVED_ERROR");
      expect(data).toBeNull();
    });

    it("changes reply status to pending when updating a rejected reply", async () => {
      await mocks
        .knex("petition_field_reply")
        .where("id", numberReply.id)
        .update("status", "REJECTED");

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!, $reply: Float!) {
            updateNumericReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
              id
              status
              content
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", numberReply.id),
          reply: 32,
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.updateNumericReply).toEqual({
        id: toGlobalId("PetitionFieldReply", numberReply.id),
        status: "PENDING",
        content: { value: 32 },
      });
    });
  });

  describe("updateCheckboxReply", () => {
    let checkboxField: PetitionField;
    let fieldReply: PetitionFieldReply;

    beforeAll(async () => {
      [checkboxField] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
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

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
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

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
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

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
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

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if trying to create a reply on a single-reply field with a previously submitted reply", async () => {
      await mocks.knex
        .from("petition_field")
        .where("id", dynamicSelectField.id)
        .update({ multiple: false });

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

      expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to update a reply thats already approved", async () => {
      const [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "DYNAMIC_SELECT",
        multiple: false,
        optional: true,
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

      const [reply] = await mocks.knex.from<PetitionFieldReply>("petition_field_reply").insert(
        {
          content: {
            columns: [
              ["Comunidad autónoma", "Andalucía"],
              ["Provincia", "Cadiz"],
            ],
          },
          type: "DYNAMIC_SELECT",
          status: "APPROVED",
          petition_field_id: field.id,
          user_id: user.id,
        },
        "*"
      );

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
          replyId: toGlobalId("PetitionFieldReply", reply.id),
          value: [
            ["Comunidad autónoma", "Canarias"],
            ["Provincia", "Lanzarote"],
          ],
        },
      });
      expect(errors).toContainGraphQLError("REPLY_ALREADY_APPROVED_ERROR");
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
            createFileUploadReplyComplete(petitionId: $petitionId, replyId: $replyId) {
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
      const { errors, data } = await testClient.mutate({
        mutation: gql`
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
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", fileUploadReply.id),
          file: {
            contentType: "text/plain",
            filename: "my_file.txt",
            size: 500,
          },
        },
      });

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
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            updateFileUploadReplyComplete(petitionId: $petitionId, replyId: $replyId) {
              id
              content
              status
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", fileUploadReply.id),
        },
      });

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

      const { errors, data } = await testClient.mutate({
        mutation: gql`
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
        variables: {
          petitionId: toGlobalId("Petition", completedPetition.id),
          replyId: toGlobalId("PetitionFieldReply", reply.id),
        },
      });

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

      const { errors, data } = await testClient.mutate({
        mutation: gql`
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
        variables: {
          petitionId: toGlobalId("Petition", completedPetition.id),
          replyId: toGlobalId("PetitionFieldReply", reply.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionReply).toEqual({
        id: toGlobalId("PetitionField", field.id),
        petition: {
          id: toGlobalId("Petition", completedPetition.id),
          status: "DRAFT",
        },
      });
    });

    it("deletes a simple reply as an User", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", userSimpleReply.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.deletePetitionReply).toEqual({ id: toGlobalId("PetitionField", fields[0].id) });
    });

    it("deletes a file reply and its entry on file_upload table", async () => {
      const { errors } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $replyId: GID!) {
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
            }
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
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
            }
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
            deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          replyId: toGlobalId("PetitionFieldReply", rejectedReply.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionReply).toEqual({
        id: toGlobalId("PetitionField", fields[0].id),
      });
    });
  });
});

import gql from "graphql-tag";
import { Knex } from "knex";
import {
  Organization,
  Petition,
  PetitionField,
  PetitionFieldComment,
  User,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { toGlobalId } from "../../util/globalId";
import { renderSlateWithMentionsToHtml } from "../../util/slate/mentions";
import { TestClient, initServer } from "./server";

describe("GraphQL/Petition Fields Comments", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let user: User;
  let otherUser: User;

  let organization: Organization;

  let petition: Petition;
  let readPetition: Petition;
  let headingField: PetitionField;
  let textFieldWithCommentsDisabled: PetitionField;
  let textFieldInternal: PetitionField;

  let readField: PetitionField;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());
    otherUser = (await mocks.createRandomUsers(organization.id, 1))[0];

    [petition, readPetition] = await mocks.createRandomPetitions(
      organization.id,
      user.id,
      2,
      () => ({
        status: "PENDING",
      }),
      (i) => ({
        type: i === 0 ? "OWNER" : "READ",
      }),
    );

    await mocks.sharePetitions([petition.id], otherUser.id, "READ");

    [headingField, textFieldWithCommentsDisabled] = await mocks.createRandomPetitionFields(
      petition.id,
      2,
      (i) => ({
        type: i === 0 ? "HEADING" : "TEXT",
        has_comments_enabled: i === 0,
      }),
    );

    [readField] = await mocks.createRandomPetitionFields(readPetition.id, 1, () => ({
      type: "TEXT",
      has_comments_enabled: true,
    }));

    [textFieldInternal] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
      type: "TEXT",
      is_internal: true,
      has_comments_enabled: true,
    }));
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("createPetitionComment", () => {
    it("should send error when trying to create an external comment with READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID
            $isInternal: Boolean!
            $content: JSON!
          ) {
            createPetitionComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              isInternal: $isInternal
              content: $content
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          petitionFieldId: toGlobalId("PetitionField", readField.id),
          isInternal: false,
          content: mocks.createRandomCommentContent(),
        },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should allow to create an internal comment with READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID
            $isInternal: Boolean!
            $content: JSON!
          ) {
            createPetitionComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              isInternal: $isInternal
              content: $content
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          petitionFieldId: toGlobalId("PetitionField", readField.id),
          isInternal: true,
          content: mocks.createRandomCommentContent(),
        },
      );

      expect(errors).toBeUndefined();
      expect(data!.createPetitionComment).toBeDefined();
    });

    it("creates a comment on a petition field", async () => {
      const content = mocks.createRandomCommentContent();
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID
            $content: JSON!
            $isInternal: Boolean!
          ) {
            createPetitionComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              content: $content
              isInternal: $isInternal
            ) {
              id
              contentHtml
              isInternal
              field {
                id
                comments {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", headingField.id),
          content,
          isInternal: false,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionComment).toEqual({
        id: data!.createPetitionComment.id,
        contentHtml: renderSlateWithMentionsToHtml(content),
        isInternal: false,
        field: {
          id: toGlobalId("PetitionField", headingField.id),
          comments: [{ id: data!.createPetitionComment.id }],
        },
      });
    });

    it("creates an internal comment on a petition field with comments disabled", async () => {
      const content = mocks.createRandomCommentContent();
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID
            $content: JSON!
            $isInternal: Boolean!
          ) {
            createPetitionComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              content: $content
              isInternal: $isInternal
            ) {
              id
              contentHtml
              isInternal
              field {
                id
                comments {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", textFieldWithCommentsDisabled.id),
          content,
          isInternal: true,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionComment).toEqual({
        id: data!.createPetitionComment.id,
        contentHtml: renderSlateWithMentionsToHtml(content),
        isInternal: true,
        field: {
          id: toGlobalId("PetitionField", textFieldWithCommentsDisabled.id),
          comments: [{ id: data!.createPetitionComment.id }],
        },
      });
    });

    it("throws error if user wants to submit a comment on a field with comments disabled", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID
            $content: JSON!
            $isInternal: Boolean!
          ) {
            createPetitionComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              content: $content
              isInternal: $isInternal
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", textFieldWithCommentsDisabled.id),
          content: mocks.createRandomCommentContent(),
          isInternal: false,
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("throws error if user wants to submit an external comment on a internal field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID
            $content: JSON!
            $isInternal: Boolean!
          ) {
            createPetitionComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              content: $content
              isInternal: $isInternal
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", textFieldInternal.id),
          content: mocks.createRandomCommentContent(),
          isInternal: false,
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("mentions a user with access to the petition", async () => {
      const [mentioned] = await mocks.createRandomUsers(organization.id, 1, undefined, () => ({
        first_name: "Ross",
        last_name: "Geller",
      }));
      await mocks.sharePetitions([petition.id], mentioned.id, "READ");

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID
            $content: JSON!
            $isInternal: Boolean!
          ) {
            createPetitionComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              content: $content
              isInternal: $isInternal
            ) {
              mentions {
                ... on PetitionFieldCommentUserMention {
                  user {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", headingField.id),
          content: [
            {
              type: "paragraph",
              children: [
                { text: "Hello" },
                {
                  type: "mention",
                  mention: toGlobalId("User", mentioned.id),
                  children: [{ text: "Ross Geller" }],
                },
                { text: "!" },
              ],
            },
          ],
          isInternal: true,
        },
      );

      expect(errors).toBeUndefined();
      expect(data!.createPetitionComment).toEqual({
        mentions: [{ user: { id: toGlobalId("User", mentioned.id) } }],
      });
    });

    it("sends error when trying to mention a user of another org", async () => {
      const [privateOrg] = await mocks.createRandomOrganizations(1);
      const [privateUser] = await mocks.createRandomUsers(privateOrg.id, 1, undefined, () => ({
        first_name: "Chandler",
        last_name: "Bing",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID
            $content: JSON!
            $isInternal: Boolean!
          ) {
            createPetitionComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              content: $content
              isInternal: $isInternal
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", headingField.id),
          content: [
            {
              type: "paragraph",
              children: [
                { text: "Hello" },
                {
                  type: "mention",
                  mention: toGlobalId("User", privateUser.id),
                  children: [{ text: "Chandler Bing" }],
                },
                { text: "!" },
              ],
            },
          ],
          isInternal: true,
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when mentioning a user with no access to the petition", async () => {
      const [joey] = await mocks.createRandomUsers(organization.id, 1, undefined, () => ({
        first_name: "Joey",
        last_name: "Tribbiani",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID
            $content: JSON!
            $isInternal: Boolean!
          ) {
            createPetitionComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              content: $content
              isInternal: $isInternal
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", headingField.id),
          content: [
            {
              type: "paragraph",
              children: [
                { text: "Hello" },
                {
                  type: "mention",
                  mention: toGlobalId("User", joey.id),
                  children: [{ text: "Joey Tribbiani" }],
                },
                { text: "!" },
              ],
            },
          ],
          isInternal: true,
        },
      );

      expect(errors).toContainGraphQLError("NO_PERMISSIONS_MENTION_ERROR", {
        ids: [toGlobalId("User", joey.id)],
      });
      expect(data).toBeNull();
    });

    it("automatically shares the petition when mentioning a user with no access and passing flags", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "TEXT",
      }));
      const [joey] = await mocks.createRandomUsers(organization.id, 1, undefined, () => ({
        first_name: "Joey",
        last_name: "Tribbiani",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID
            $content: JSON!
            $isInternal: Boolean!
            $throwOnNoPermission: Boolean
            $sharePetition: Boolean
          ) {
            createPetitionComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              content: $content
              isInternal: $isInternal
              throwOnNoPermission: $throwOnNoPermission
              sharePetition: $sharePetition
            ) {
              mentions {
                ... on PetitionFieldCommentUserMention {
                  user {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", field.id),
          content: [
            {
              type: "paragraph",
              children: [
                { text: "Hello" },
                {
                  type: "mention",
                  mention: toGlobalId("User", joey.id),
                  children: [{ text: "Joey Tribbiani" }],
                },
                { text: "!" },
              ],
            },
          ],
          isInternal: true,
          throwOnNoPermission: false,
          sharePetition: true,
        },
      );

      expect(errors).toBeUndefined();
      expect(data!.createPetitionComment).toEqual({
        mentions: [{ user: { id: toGlobalId("User", joey.id) } }],
      });

      const permissions = await mocks.knex
        .from("petition_permission")
        .where("petition_id", petition.id)
        .select("*");

      expect(permissions).toMatchObject([
        { user_id: user.id, type: "OWNER" },
        { user_id: joey.id, type: "READ" },
      ]);
    });

    it("sends error if trying to submit comment on a child field", async () => {
      const [parent] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "FIELD_GROUP",
      }));
      const [child] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "TEXT",
        parent_petition_field_id: parent.id,
        position: 0,
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID
            $content: JSON!
            $isInternal: Boolean!
          ) {
            createPetitionComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              content: $content
              isInternal: $isInternal
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", child.id),
          content: mocks.createRandomCommentContent(),
          isInternal: false,
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("updatePetitionComment", () => {
    let comment: PetitionFieldComment;
    let internalComment: PetitionFieldComment;
    let otherUserComment: PetitionFieldComment;
    let otherUserInternalComment: PetitionFieldComment;
    beforeAll(async () => {
      [comment, internalComment] = await mocks.createRandomCommentsFromUser(
        user.id,
        readField.id,
        readPetition.id,
        2,
        (i) => ({ is_internal: i === 1 }),
      );
      [otherUserComment, otherUserInternalComment] = await mocks.createRandomCommentsFromUser(
        otherUser.id,
        readField.id,
        readPetition.id,
        2,
        (i) => ({ is_internal: i === 1 }),
      );
    });

    it("should send error when trying to update others user comment", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $petitionFieldCommentId: GID!, $content: JSON!) {
            updatePetitionComment(
              petitionId: $petitionId
              petitionFieldCommentId: $petitionFieldCommentId
              content: $content
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          petitionFieldId: toGlobalId("PetitionField", readField.id),
          petitionFieldCommentId: toGlobalId("PetitionFieldComment", otherUserComment.id),
          content: mocks.createRandomCommentContent(),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();

      const dataInternal = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $petitionFieldCommentId: GID!, $content: JSON!) {
            updatePetitionComment(
              petitionId: $petitionId
              petitionFieldCommentId: $petitionFieldCommentId
              content: $content
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          petitionFieldCommentId: toGlobalId("PetitionFieldComment", otherUserInternalComment.id),
          content: mocks.createRandomCommentContent(),
        },
      );

      expect(dataInternal.errors).toContainGraphQLError("FORBIDDEN");
      expect(dataInternal.data).toBeNull();
    });

    it("should allow to update an internal comment with READ access and owner of that comment", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $petitionFieldCommentId: GID!, $content: JSON!) {
            updatePetitionComment(
              petitionId: $petitionId
              petitionFieldCommentId: $petitionFieldCommentId
              content: $content
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          petitionFieldCommentId: toGlobalId("PetitionFieldComment", internalComment.id),
          content: mocks.createRandomCommentContent(),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updatePetitionComment).toBeDefined();
    });

    it("should allow to update an external comment with READ access and owner of that comment", async () => {
      const content = mocks.createRandomCommentContent();
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $petitionFieldCommentId: GID!, $content: JSON!) {
            updatePetitionComment(
              petitionId: $petitionId
              petitionFieldCommentId: $petitionFieldCommentId
              content: $content
            ) {
              id
              content
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          petitionFieldCommentId: toGlobalId("PetitionFieldComment", comment.id),
          content,
        },
      );

      expect(errors).toBeUndefined();
      expect(data!.updatePetitionComment).toEqual({
        id: toGlobalId("PetitionFieldComment", comment.id),
        content,
      });
    });
  });

  describe("deletePetitionComment", () => {
    let comment: PetitionFieldComment;
    let internalComment: PetitionFieldComment;
    let otherUserComment: PetitionFieldComment;
    let otherUserInternalComment: PetitionFieldComment;

    beforeAll(async () => {
      [comment, internalComment] = await mocks.createRandomCommentsFromUser(
        user.id,
        readField.id,
        readPetition.id,
        2,
        (i) => ({ is_internal: i === 1 }),
      );
      [otherUserComment, otherUserInternalComment] = await mocks.createRandomCommentsFromUser(
        otherUser.id,
        readField.id,
        readPetition.id,
        2,
        (i) => ({ is_internal: i === 1 }),
      );
    });

    it("should send error when trying to delete others user comment", async () => {
      const dataExternal = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $petitionFieldCommentId: GID!) {
            deletePetitionComment(
              petitionId: $petitionId
              petitionFieldCommentId: $petitionFieldCommentId
            ) {
              ... on PetitionField {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          petitionFieldCommentId: toGlobalId("PetitionFieldComment", otherUserComment.id),
        },
      );
      expect(dataExternal.errors).toContainGraphQLError("FORBIDDEN");
      expect(dataExternal.data).toBeNull();

      const dataInternal = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $petitionFieldCommentId: GID!) {
            deletePetitionComment(
              petitionId: $petitionId
              petitionFieldCommentId: $petitionFieldCommentId
            ) {
              ... on PetitionField {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          petitionFieldCommentId: toGlobalId("PetitionFieldComment", otherUserInternalComment.id),
        },
      );
      expect(dataInternal.errors).toContainGraphQLError("FORBIDDEN");
      expect(dataInternal.data).toBeNull();
    });

    it("should allow to delete an internal comment with READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $petitionFieldCommentId: GID!) {
            deletePetitionComment(
              petitionId: $petitionId
              petitionFieldCommentId: $petitionFieldCommentId
            ) {
              ... on PetitionField {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          petitionFieldCommentId: toGlobalId("PetitionFieldComment", internalComment.id),
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.deletePetitionComment).toEqual({
        id: toGlobalId("PetitionField", comment.petition_field_id!),
      });
    });

    it("should allow to delete an external comment with READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $petitionFieldCommentId: GID!) {
            deletePetitionComment(
              petitionId: $petitionId
              petitionFieldCommentId: $petitionFieldCommentId
            ) {
              ... on PetitionField {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          petitionFieldCommentId: toGlobalId("PetitionFieldComment", comment.id),
        },
      );
      expect(errors).toBeUndefined();
      expect(data?.deletePetitionComment).toEqual({
        id: toGlobalId("PetitionField", comment.petition_field_id!),
      });
    });
  });
});

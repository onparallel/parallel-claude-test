import { gql } from "graphql-request";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Organization,
  Petition,
  PetitionField,
  PetitionFieldComment,
  User,
} from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

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
      })
    );

    await mocks.sharePetitions([petition.id], otherUser.id, "READ");

    [headingField, textFieldWithCommentsDisabled] = await mocks.createRandomPetitionFields(
      petition.id,
      2,
      (i) => ({
        type: i === 0 ? "HEADING" : "TEXT",
        has_comments_enabled: i === 0,
      })
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

  describe("createPetitionFieldComment", () => {
    it("should send error when trying to create an external comment with READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $isInternal: Boolean
            $content: String!
          ) {
            createPetitionFieldComment(
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
          content: "hello",
        }
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should allow to create an internal comment with READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $isInternal: Boolean
            $content: String!
          ) {
            createPetitionFieldComment(
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
          content: "hello",
        }
      );

      expect(errors).toBeUndefined();
      expect(data!.createPetitionFieldComment).toBeDefined();
    });

    it("creates a comment on a petition field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $petitionFieldId: GID!, $content: String!) {
            createPetitionFieldComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              content: $content
            ) {
              id
              content
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
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", headingField.id),
          content: "Hello this is my comment",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldComment).toEqual({
        id: data!.createPetitionFieldComment.id,
        content: "Hello this is my comment",
        isInternal: false,
        field: {
          id: toGlobalId("PetitionField", headingField.id),
          comments: [{ id: data!.createPetitionFieldComment.id }],
        },
      });
    });

    it("creates an internal comment on a petition field with comments disabled", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $content: String!
            $isInternal: Boolean
          ) {
            createPetitionFieldComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              content: $content
              isInternal: $isInternal
            ) {
              id
              content
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
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", textFieldWithCommentsDisabled.id),
          content: "Hello this is my comment",
          isInternal: true,
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldComment).toEqual({
        id: data!.createPetitionFieldComment.id,
        content: "Hello this is my comment",
        isInternal: true,
        field: {
          id: toGlobalId("PetitionField", textFieldWithCommentsDisabled.id),
          comments: [{ id: data!.createPetitionFieldComment.id }],
        },
      });
    });

    it("throws error if user wants to submit a comment on a field with comments disabled", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $content: String!
            $isInternal: Boolean
          ) {
            createPetitionFieldComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              content: $content
              isInternal: $isInternal
            ) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", textFieldWithCommentsDisabled.id),
          content: "Hello this is my comment",
          isInternal: false,
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("throws error if user wants to submit an external comment on a internal field", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $content: String!
            $isInternal: Boolean
          ) {
            createPetitionFieldComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              content: $content
              isInternal: $isInternal
            ) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          petitionFieldId: toGlobalId("PetitionField", textFieldInternal.id),
          content: "Hello this is my comment",
          isInternal: false,
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("updatePetitionFieldComment", () => {
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
        (i) => ({ is_internal: i === 1 })
      );
      [otherUserComment, otherUserInternalComment] = await mocks.createRandomCommentsFromUser(
        otherUser.id,
        readField.id,
        readPetition.id,
        2,
        (i) => ({ is_internal: i === 1 })
      );
    });

    it("should send error when trying to update others user comment", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $petitionFieldCommentId: GID!
            $content: String!
          ) {
            updatePetitionFieldComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
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
          content: "aaaa",
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();

      const dataInternal = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $petitionFieldCommentId: GID!
            $content: String!
          ) {
            updatePetitionFieldComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
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
          petitionFieldCommentId: toGlobalId("PetitionFieldComment", otherUserInternalComment.id),
          content: "aaaa",
        }
      );

      expect(dataInternal.errors).toContainGraphQLError("FORBIDDEN");
      expect(dataInternal.data).toBeNull();
    });

    it("should allow to update an internal and external comment with READ access are owner of that comment", async () => {
      const dataExternal = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $petitionFieldCommentId: GID!
            $content: String!
          ) {
            updatePetitionFieldComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
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
          petitionFieldCommentId: toGlobalId("PetitionFieldComment", comment.id),
          content: "aaaa",
        }
      );

      expect(dataExternal.errors).toBeUndefined();
      expect(dataExternal.data?.updatePetitionFieldComment).toBeDefined();

      const dataInternal = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $petitionFieldId: GID!
            $petitionFieldCommentId: GID!
            $content: String!
          ) {
            updatePetitionFieldComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
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
          petitionFieldCommentId: toGlobalId("PetitionFieldComment", internalComment.id),
          content: "aaaa",
        }
      );

      expect(dataInternal.errors).toBeUndefined();
      expect(dataInternal.data?.updatePetitionFieldComment).toBeDefined();
    });
  });

  describe("deletePetitionFieldComment", () => {
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
        (i) => ({ is_internal: i === 1 })
      );
      [otherUserComment, otherUserInternalComment] = await mocks.createRandomCommentsFromUser(
        otherUser.id,
        readField.id,
        readPetition.id,
        2,
        (i) => ({ is_internal: i === 1 })
      );
    });
    it("should send error when trying to delete others user comment", async () => {
      const dataExternal = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $petitionFieldId: GID!, $petitionFieldCommentId: GID!) {
            deletePetitionFieldComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              petitionFieldCommentId: $petitionFieldCommentId
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          petitionFieldId: toGlobalId("PetitionField", readField.id),
          petitionFieldCommentId: toGlobalId("PetitionFieldComment", otherUserComment.id),
          content: "aaaa",
        }
      );
      expect(dataExternal.errors).toContainGraphQLError("FORBIDDEN");
      expect(dataExternal.data).toBeNull();

      const dataInternal = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $petitionFieldId: GID!, $petitionFieldCommentId: GID!) {
            deletePetitionFieldComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              petitionFieldCommentId: $petitionFieldCommentId
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          petitionFieldId: toGlobalId("PetitionField", readField.id),
          petitionFieldCommentId: toGlobalId("PetitionFieldComment", otherUserInternalComment.id),
          content: "aaaa",
        }
      );
      expect(dataInternal.errors).toContainGraphQLError("FORBIDDEN");
      expect(dataInternal.data).toBeNull();
    });

    it("should allow to delete an internal comment with READ access", async () => {
      const dataExternal = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $petitionFieldId: GID!, $petitionFieldCommentId: GID!) {
            deletePetitionFieldComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              petitionFieldCommentId: $petitionFieldCommentId
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          petitionFieldId: toGlobalId("PetitionField", readField.id),
          petitionFieldCommentId: toGlobalId("PetitionFieldComment", comment.id),
          content: "aaaa",
        }
      );
      expect(dataExternal.errors).toBeUndefined();
      expect(dataExternal.data?.deletePetitionFieldComment).toBeDefined();

      const dataInternal = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $petitionFieldId: GID!, $petitionFieldCommentId: GID!) {
            deletePetitionFieldComment(
              petitionId: $petitionId
              petitionFieldId: $petitionFieldId
              petitionFieldCommentId: $petitionFieldCommentId
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readPetition.id),
          petitionFieldId: toGlobalId("PetitionField", readField.id),
          petitionFieldCommentId: toGlobalId("PetitionFieldComment", internalComment.id),
          content: "aaaa",
        }
      );
      expect(dataInternal.errors).toBeUndefined();
      expect(dataInternal.data?.deletePetitionFieldComment).toBeDefined();
    });
  });
});

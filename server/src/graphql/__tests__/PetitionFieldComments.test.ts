import { gql } from "graphql-request";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, PetitionField, User } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/Petition Fields Comments", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let user: User;
  let organization: Organization;

  let petition: Petition;
  let headingField: PetitionField;
  let textFieldWithCommentsDisabled: PetitionField;
  let textFieldInternal: PetitionField;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
      status: "PENDING",
    }));

    [headingField, textFieldWithCommentsDisabled] = await mocks.createRandomPetitionFields(
      petition.id,
      2,
      (i) => ({
        type: i === 0 ? "HEADING" : "TEXT",
        options: { hasCommentsEnabled: i === 0 },
      })
    );

    [textFieldInternal] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
      type: "TEXT",
      is_internal: true,
      options: { hasCommentsEnabled: true },
    }));

    await mocks.createFeatureFlags([{ name: "INTERNAL_COMMENTS", default_value: true }]);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("createPetitionFieldComment", () => {
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

    it("throws error if user wants to submit an internal comment without feature flag", async () => {
      await mocks.knex.from("feature_flag").delete();

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
          petitionFieldId: toGlobalId("PetitionField", headingField.id),
          content: "Hello this is my comment",
          isInternal: true,
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
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

    it("throws error if user wants to submit a comment on a internal field", async () => {
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
});

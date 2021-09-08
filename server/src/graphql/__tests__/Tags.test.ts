import { gql } from "graphql-request";
import { Knex } from "knex";
import { sortBy } from "remeda";
import { USER_COGNITO_ID } from "../../../test/mocks";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, Tag } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { deleteAllData } from "../../util/knexUtils";
import { initServer, TestClient } from "./server";

describe("GraphQL/Tags", () => {
  let mocks: Mocks;
  let testClient: TestClient;
  let organization: Organization;
  let otherOrg: Organization;

  let petition: Petition;
  let privatePetition: Petition;

  let tags: Tag[];
  let privateTag: Tag;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    await deleteAllData(knex);

    [organization] = await mocks.createRandomOrganizations(1, () => ({
      name: "Parallel",
      status: "DEV",
    }));

    [otherOrg] = await mocks.createRandomOrganizations(1);

    const [user] = await mocks.createRandomUsers(organization.id, 1, () => ({
      cognito_id: USER_COGNITO_ID,
      first_name: "Harvey",
      last_name: "Specter",
      org_id: organization.id,
      organization_role: "ADMIN",
    }));

    const [otherUser] = await mocks.createRandomUsers(otherOrg.id, 2);

    tags = await mocks.createRandomTags(organization.id, 5, (i) => ({
      name: ["important", "to do", "todo", "outdated", "missing info"][i],
    }));
    tags = sortBy(tags, (t) => t.name);

    [privateTag] = await mocks.createRandomTags(otherOrg.id, 1);

    [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
    [privatePetition] = await mocks.createRandomPetitions(otherOrg.id, otherUser.id, 1);
    await mocks.tagPetitions([petition.id], tags[4].id);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("tags query", () => {
    it("returns every available tag when passing no arguments", async () => {
      const { data, errors } = await testClient.query({
        query: gql`
          query {
            tags {
              totalCount
              items {
                id
              }
            }
          }
        `,
      });
      expect(errors).toBeUndefined();
      expect(data?.tags).toEqual({
        totalCount: tags.length,
        items: tags.map((t) => ({
          id: toGlobalId("Tag", t.id),
        })),
      });
    });

    it("should paginate the result when passing limit and offset arguments", async () => {
      const { data, errors } = await testClient.query({
        query: gql`
          query ($limit: Int, $offset: Int) {
            tags(limit: $limit, offset: $offset) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        variables: {
          limit: 2,
          offset: 1,
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.tags).toEqual({
        totalCount: tags.length,
        items: tags.slice(1, 3).map((t) => ({
          id: toGlobalId("Tag", t.id),
        })),
      });
    });

    it("should do a fuzzy search of the organization tags", async () => {
      const { data, errors } = await testClient.query({
        query: gql`
          query ($search: String) {
            tags(search: $search) {
              totalCount
              items {
                id
                name
              }
            }
          }
        `,
        variables: {
          search: "todo",
        },
      });

      const expectedTags = tags.filter((t) => t.name === "todo" || t.name === "to do");
      expect(errors).toBeUndefined();
      expect(data?.tags).toEqual({
        totalCount: expectedTags.length,
        items: expectedTags.map((t) => ({
          id: toGlobalId("Tag", t.id),
          name: t.name,
        })),
      });
    });

    it("should match with a slight search typo", async () => {
      const { data, errors } = await testClient.query({
        query: gql`
          query ($search: String) {
            tags(search: $search) {
              totalCount
              items {
                id
                name
              }
            }
          }
        `,
        variables: {
          search: "improntnat",
        },
      });
      const expectedTags = tags.filter((t) => t.name === "important");
      expect(errors).toBeUndefined();
      expect(data?.tags).toEqual({
        totalCount: 1,
        items: expectedTags.map((t) => ({
          id: toGlobalId("Tag", t.id),
          name: t.name,
        })),
      });
    });
  });

  describe("createTag", () => {
    it("creates a new tag available on the organization", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($name: String!, $color: String!) {
            createTag(name: $name, color: $color) {
              name
              color
            }
          }
        `,
        variables: {
          name: "my new tag",
          color: "#a59dfa",
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.createTag).toEqual({
        name: "my new tag",
        color: "#a59dfa",
      });
    });

    it("sends error when passing an invalid color value", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($name: String!, $color: String!) {
            createTag(name: $name, color: $color) {
              name
              color
            }
          }
        `,
        variables: {
          name: "my new tag",
          color: "#errorr",
        },
      });
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when passing a tag name longer than 100 chars", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($name: String!, $color: String!) {
            createTag(name: $name, color: $color) {
              name
              color
            }
          }
        `,
        variables: {
          name: "x".repeat(101),
          color: "#aaaaaa",
        },
      });
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to duplicate tag name", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($name: String!, $color: String!) {
            createTag(name: $name, color: $color) {
              name
              color
            }
          }
        `,
        variables: {
          name: tags[1].name,
          color: "#abcdef",
        },
      });
      expect(errors).toContainGraphQLError("TAG_ALREADY_EXISTS");
      expect(data).toBeNull();
    });
  });

  describe("updateTag", () => {
    it("updates the organization tag", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $name: String) {
            updateTag(id: $id, data: { name: $name }) {
              id
              name
              color
            }
          }
        `,
        variables: {
          id: toGlobalId("Tag", tags[0].id),
          name: "new tag name",
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.updateTag).toEqual({
        id: toGlobalId("Tag", tags[0].id),
        name: "new tag name",
        color: tags[0].color,
      });
    });

    it("sends error when trying to update a tag on another organization", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $name: String) {
            updateTag(id: $id, data: { name: $name }) {
              id
              name
              color
            }
          }
        `,
        variables: {
          id: toGlobalId("Tag", privateTag.id),
          name: "new tag name",
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("deleteTag", () => {
    it("removes the tag from every petition when deleting it", async () => {
      const { errors: deleteError, data: deleteData } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!) {
            deleteTag(id: $id)
          }
        `,
        variables: {
          id: toGlobalId("Tag", tags[4].id),
        },
      });

      expect(deleteError).toBeUndefined();
      expect(deleteData?.deleteTag).toEqual("SUCCESS");

      const { errors: petitionError, data: petitionData } = await testClient.query({
        query: gql`
          query ($id: GID!) {
            petition(id: $id) {
              id
              tags {
                id
              }
            }
          }
        `,
        variables: {
          id: toGlobalId("Petition", petition.id),
        },
      });

      expect(petitionError).toBeUndefined();
      expect(petitionData?.petition).toEqual({
        id: toGlobalId("Petition", petition.id),
        tags: [],
      });
    });

    it("sends error when trying to delete a private tag", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!) {
            deleteTag(id: $id)
          }
        `,
        variables: {
          id: toGlobalId("Tag", privateTag.id),
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("tagPetition", () => {
    beforeEach(async () => {
      await mocks.knex.from("petition_tag").delete();
      await mocks.tagPetitions([petition.id], tags[3].id);
    });

    it("tags a petition with the given tag", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($tagId: GID!, $petitionId: GID!) {
            tagPetition(tagId: $tagId, petitionId: $petitionId) {
              id
              tags {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          tagId: toGlobalId("Tag", tags[2].id),
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.tagPetition).toEqual({
        id: toGlobalId("Petition", petition.id),
        tags: [{ id: toGlobalId("Tag", tags[3].id) }, { id: toGlobalId("Tag", tags[2].id) }],
      });
    });

    it("sends error when trying to tag a petition with the same tag more than once", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($tagId: GID!, $petitionId: GID!) {
            tagPetition(tagId: $tagId, petitionId: $petitionId) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          tagId: toGlobalId("Tag", tags[3].id),
        },
      });

      expect(errors).toContainGraphQLError("PETITION_ALREADY_TAGGED");
      expect(data).toBeNull();
    });

    it("sends error when trying to apply a private tag to a petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($tagId: GID!, $petitionId: GID!) {
            tagPetition(tagId: $tagId, petitionId: $petitionId) {
              id
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          tagId: toGlobalId("Tag", privateTag.id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("untagPetition", () => {
    beforeEach(async () => {
      await mocks.knex.from("petition_tag").delete();
      await mocks.tagPetitions([petition.id], tags[3].id);
    });

    it("removes the tag from a petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($tagId: GID!, $petitionId: GID!) {
            untagPetition(tagId: $tagId, petitionId: $petitionId) {
              id
              tags {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          tagId: toGlobalId("Tag", tags[3].id),
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.untagPetition).toEqual({
        id: toGlobalId("Petition", petition.id),
        tags: [],
      });
    });

    it("sends error when trying to untag a private petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($tagId: GID!, $petitionId: GID!) {
            untagPetition(tagId: $tagId, petitionId: $petitionId) {
              id
              tags {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", privatePetition.id),
          tagId: toGlobalId("Tag", tags[4].id),
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});

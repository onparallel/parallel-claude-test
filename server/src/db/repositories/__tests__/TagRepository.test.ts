import { Container } from "inversify";
import { Knex } from "knex";
import { createTestContainer } from "../../../../test/testContainer";
import { deleteAllData } from "../../../util/knexUtils";
import { KNEX } from "../../knex";
import { Organization, Petition, Tag, User } from "../../__types";
import { TagRepository } from "../TagRepository";
import { Mocks } from "./mocks";

describe("repositories/TagRepository", () => {
  let container: Container;
  let knex: Knex;
  let mocks: Mocks;
  let repo: TagRepository;

  let tags: Tag[];
  let orgs: Organization[];
  let user: User;
  let petition: Petition;

  beforeAll(async () => {
    container = createTestContainer();
    knex = container.get<Knex>(KNEX);
    repo = container.get(TagRepository);
    mocks = new Mocks(knex);

    await deleteAllData(knex);

    orgs = await mocks.createRandomOrganizations(2);
    [user] = await mocks.createRandomUsers(orgs[0].id, 1);
    [petition] = await mocks.createRandomPetitions(orgs[0].id, user.id, 1);
    tags = await mocks.createRandomTags(orgs[0].id, 5);
    await mocks.createRandomTags(orgs[1].id, 2);

    await mocks
      .knex("petition_tag")
      .insert(
        tags
          .slice(0, 3)
          .map((tag) => ({ petition_id: petition.id, tag_id: tag.id }))
      );
  });

  afterAll(async () => {
    await knex.destroy();
  });

  it("should load tags linked to organization", async () => {
    expect(await repo.loadTagsByOrganizationId(orgs[0].id)).toHaveLength(5);
  });

  it("should load tags linked to petition", async () => {
    expect(await repo.loadTagsByPetitionId(petition.id)).toHaveLength(3);
  });

  it("should allow to create tags with same name in different organizations", async () => {
    await expect(
      repo.createTag({ color: "#FF00FF", name: tags[1].name }, orgs[1].id)
    ).resolves.not.toThrowError();
  });

  it("should not allow to create a tag with a taken name in the same organization", async () => {
    await expect(
      repo.createTag({ color: "#FFFFFF", name: tags[3].name }, orgs[0].id)
    ).rejects.toThrowError();
  });

  it("should not allow to use a taken name to update the tag", async () => {
    await expect(
      repo.updateTag(tags[2].id, { name: tags[3].name })
    ).rejects.toThrowError();
  });

  it("should not allow to tag a petition twice with the same tag", async () => {
    await expect(
      repo.tagPetition(tags[0].id, petition.id)
    ).rejects.toThrowError();
  });
});

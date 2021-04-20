import { Container } from "inversify";
import { Knex } from "knex";
import { sortBy } from "remeda";
import { createTestContainer } from "../../../../test/testContainer";
import { deleteAllData } from "../../../util/knexUtils";
import { KNEX } from "../../knex";
import { Organization, Petition, PetitionTag, Tag, User } from "../../__types";
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
  let otherUser: User;
  let petition: Petition;

  beforeAll(async () => {
    container = createTestContainer();
    knex = container.get<Knex>(KNEX);
    repo = container.get(TagRepository);
    mocks = new Mocks(knex);

    await deleteAllData(knex);

    orgs = await mocks.createRandomOrganizations(2);
    [user] = await mocks.createRandomUsers(orgs[0].id, 1);
    [otherUser] = await mocks.createRandomUsers(orgs[1].id, 1);
    [petition] = await mocks.createRandomPetitions(orgs[0].id, user.id, 1);
    tags = await mocks.createRandomTags(orgs[0].id, 5, (i) => ({
      name: ["B", "A", "E", "C", "D"][i],
    }));
    await mocks.createRandomTags(orgs[1].id, 2);

    await mocks.knex<PetitionTag>("petition_tag").insert(
      tags.slice(0, 3).map((tag, index) => ({
        petition_id: petition.id,
        tag_id: tag.id,
        created_at: new Date(index * 10), // to make sure the creation dates are not the same
      }))
    );
  });

  afterAll(async () => {
    await knex.destroy();
  });

  it("should load tags linked to organization ordered by name", async () => {
    expect(await repo.loadTagsByOrganizationId(orgs[0].id)).toEqual(
      sortBy(tags, (tag) => tag.name)
    );
  });

  it("should load tags linked to petition ordered by creation date", async () => {
    expect(await repo.loadTagsByPetitionId(petition.id)).toEqual(
      tags.slice(0, 3)
    );
  });

  it("should allow to create tags with same name in different organizations", async () => {
    await expect(
      repo.createTag({ color: "#FF00FF", name: tags[1].name }, otherUser)
    ).resolves.not.toThrowError();
  });

  it("should not allow to create a tag with a taken name in the same organization", async () => {
    await expect(
      repo.createTag({ color: "#FFFFFF", name: tags[3].name }, user)
    ).rejects.toThrowError();
  });

  it("should not allow to use a taken name to update the tag", async () => {
    await expect(
      repo.updateTag(tags[2].id, { name: tags[3].name }, user)
    ).rejects.toThrowError();
  });

  it("should not allow to tag a petition twice with the same tag", async () => {
    await expect(
      repo.tagPetition(tags[0].id, petition.id, user)
    ).rejects.toThrowError();
  });
});

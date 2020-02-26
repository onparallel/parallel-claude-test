import { Container } from "inversify";
import Knex from "knex";
import { createContainer } from "../../../container";
import { deleteAllData } from "../../../util/knexUtils";
import { KNEX } from "../../knex";
import { Organization, User, Petition, PetitionField } from "../../__types";
import { Mocks } from "./mocks";
import { PetitionRepository } from "../PetitionRepository";
import { pick, range } from "remeda";

describe("repositories/PetitionRepository", () => {
  let container: Container;
  let knex: Knex;
  let mocks: Mocks;
  let petitions: PetitionRepository;

  beforeAll(() => {
    container = createContainer();
    knex = container.get(KNEX);
    mocks = new Mocks(knex);
    petitions = container.get(PetitionRepository);
  });

  afterAll(async () => {
    await knex.destroy();
  });

  describe("loadPetitionsForUser", () => {
    let org: Organization;
    let user: User;
    let _petitions: Petition[];

    beforeAll(async () => {
      await deleteAllData(knex);
      [org] = await mocks.createRandomOrganizations(1);
      [user] = await mocks.createRandomUsers(org.id, 2);
      _petitions = await mocks.createRandomPetitions(
        org.id,
        user.id,
        15,
        i => ({ name: i % 3 === 0 ? "good petition" : "bad petition" })
      );
    });

    test("returns an empty page without options", async () => {
      const result = await petitions.loadPetitionsForUser(user.id, {});
      expect(result.totalCount).toBe(15);
      expect(result.items).toHaveLength(0);
    });

    test("returns a slice of petitions", async () => {
      const result = await petitions.loadPetitionsForUser(user.id, {
        offset: 5,
        limit: 5
      });
      expect(result.totalCount).toBe(15);
      expect(result.items).toMatchObject(
        _petitions.slice(5, 10).map(pick(["id"]))
      );
    });

    test("returns a slice of filtered petitions", async () => {
      const result = await petitions.loadPetitionsForUser(user.id, {
        offset: 2,
        limit: 5,
        search: "good" // there's only 5 good petitions
      });
      expect(result.totalCount).toBe(5);
      expect(result.items).toMatchObject(
        _petitions
          .filter(p => p.name.toLowerCase().includes("good"))
          .slice(2, 2 + 5)
      );
    });
  });

  describe("loadFieldsForPetition & loadFieldCountForPetition", () => {
    let org: Organization;
    let user: User;
    let petition1: Petition, petition2: Petition;
    let fields: PetitionField[];

    beforeAll(async () => {
      await deleteAllData(knex);
      [org] = await mocks.createRandomOrganizations(1);
      [user] = await mocks.createRandomUsers(org.id, 2);
      [petition1, petition2] = await mocks.createRandomPetitions(
        org.id,
        user.id,
        2
      );
      fields = await mocks.createRandomPetitionFields(petition1.id, 6, i => ({
        deleted_at: i === 5 ? new Date() : null
      }));
    });

    test("returns the fields in each petition", async () => {
      const [fields1, fields2] = await Promise.all([
        petitions.loadFieldsForPetition(petition1.id),
        petitions.loadFieldsForPetition(petition2.id)
      ]);
      expect(fields1).toHaveLength(5);
      expect(fields2).toHaveLength(0);
      expect(fields1).toMatchObject(range(0, 5).map(i => ({ position: i })));
    });

    test("returns the right amount of fields in each petition", async () => {
      const [fieldCount1, fieldCount2] = await Promise.all([
        petitions.loadFieldCountForPetition(petition1.id),
        petitions.loadFieldCountForPetition(petition2.id)
      ]);
      expect(fieldCount1).toBe(5);
      expect(fieldCount2).toBe(0);
    });
  });
});

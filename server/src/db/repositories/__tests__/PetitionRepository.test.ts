import { Container } from "inversify";
import Knex from "knex";
import { createContainer } from "../../../container";
import { deleteAllData } from "../../../util/knexUtils";
import { KNEX } from "../../knex";
import {
  Organization,
  User,
  Petition,
  PetitionField,
  PetitionAccess,
  Contact,
} from "../../__types";
import { Mocks } from "./mocks";
import { PetitionRepository } from "../PetitionRepository";
import { pick, range, sortBy } from "remeda";
import faker from "faker";

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
        (i) => ({ name: i % 3 === 0 ? "good petition" : "bad petition" })
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
        limit: 5,
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
        search: "good", // there's only 5 good petitions
      });
      expect(result.totalCount).toBe(5);
      expect(result.items).toMatchObject(
        _petitions
          .filter((p) => (p.name ?? "").toLowerCase().includes("good"))
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
      fields = await mocks.createRandomPetitionFields(petition1.id, 6, (i) => ({
        deleted_at: i === 5 ? new Date() : null,
      }));
    });

    test("returns the fields in each petition", async () => {
      const [fields1, fields2] = await Promise.all([
        petitions.loadFieldsForPetition(petition1.id),
        petitions.loadFieldsForPetition(petition2.id),
      ]);
      expect(fields1).toHaveLength(5);
      expect(fields2).toHaveLength(0);
      expect(fields1).toMatchObject(range(0, 5).map((i) => ({ position: i })));
    });

    test("returns the right amount of fields in each petition", async () => {
      const [fieldCount1, fieldCount2] = await Promise.all([
        petitions.loadFieldCountForPetition(petition1.id),
        petitions.loadFieldCountForPetition(petition2.id),
      ]);
      expect(fieldCount1).toBe(5);
      expect(fieldCount2).toBe(0);
    });
  });

  describe("updateFieldPositions", () => {
    let org: Organization;
    let user: User;
    let petition1: Petition, petition2: Petition;
    let fields: PetitionField[],
      deleted: PetitionField[],
      foreignField: PetitionField;

    beforeAll(async () => {
      await deleteAllData(knex);
      [org] = await mocks.createRandomOrganizations(1);
      [user] = await mocks.createRandomUsers(org.id, 2);
      [petition1, petition2] = await mocks.createRandomPetitions(
        org.id,
        user.id,
        2
      );
      fields = await mocks.createRandomPetitionFields(petition1.id, 6);
      // add some random deleted fields
      deleted = await mocks.createRandomPetitionFields(
        petition1.id,
        10,
        (index) => ({
          position: faker.random.number(10),
          deleted_at: new Date(),
        })
      );
      [foreignField] = await mocks.createRandomPetitionFields(petition2.id, 1);
    });

    test("fails if the ids passed do not match with the petition field ids", async () => {
      const [
        { id: id1 },
        { id: id2 },
        { id: id3 },
        { id: id4 },
        { id: id5 },
        { id: id6 },
      ] = fields;
      await expect(
        petitions.updateFieldPositions(petition1.id, [id2, id5, id6], user)
      ).rejects.toThrow("Invalid petition field ids");
      await expect(
        petitions.updateFieldPositions(
          petition1.id,
          [id1, id2, id3, id4, id5, id6, id6],
          user
        )
      ).rejects.toThrow("Invalid petition field ids");
    });

    test("fails if passed deleted field ids", async () => {
      const [
        { id: id1 },
        { id: id2 },
        { id: id3 },
        { id: id4 },
        { id: id5 },
        { id: id6 },
      ] = fields;
      await expect(
        petitions.updateFieldPositions(
          petition1.id,
          [id1, id2, id3, deleted[2].id, id5, id6, id6],
          user
        )
      ).rejects.toThrow("Invalid petition field ids");
    });

    test("fails if passed fields ids from another petition", async () => {
      const [
        { id: id1 },
        { id: id2 },
        { id: id3 },
        { id: id4 },
        { id: id5 },
        { id: id6 },
      ] = fields;
      await expect(
        petitions.updateFieldPositions(
          petition1.id,
          [id1, id2, id3, foreignField.id, id5, id6, id6],
          user
        )
      ).rejects.toThrow("Invalid petition field ids");
    });

    test("updates the positions", async () => {
      const [
        { id: id1 },
        { id: id2 },
        { id: id3 },
        { id: id4 },
        { id: id5 },
        { id: id6 },
      ] = fields;
      await petitions.updateFieldPositions(
        petition1.id,
        [id2, id5, id6, id3, id1, id4],
        user
      );
      const result1 = await petitions.loadFieldsForPetition(petition1.id, {
        refresh: true,
      });
      expect(sortBy(result1, (f) => f.position)).toMatchObject(
        [id2, id5, id6, id3, id1, id4].map((id, index) => ({
          id,
          position: index,
          deleted_at: null,
        }))
      );
      await petitions.updateFieldPositions(
        petition1.id,
        [id6, id5, id4, id3, id2, id1],
        user
      );
      const result2 = await petitions.loadFieldsForPetition(petition1.id, {
        refresh: true,
      });
      expect(sortBy(result2, (f) => f.position)).toMatchObject(
        [id6, id5, id4, id3, id2, id1].map((id, index) => ({
          id,
          position: index,
          deleted_at: null,
        }))
      );
    });
  });

  describe("deletePetitionField", () => {
    let org: Organization;
    let user: User;
    let petition1: Petition, petition2: Petition;
    let fields: PetitionField[],
      deleted: PetitionField[],
      foreignField: PetitionField;

    beforeAll(async () => {
      await deleteAllData(knex);
      [org] = await mocks.createRandomOrganizations(1);
      [user] = await mocks.createRandomUsers(org.id, 2);
      [petition1, petition2] = await mocks.createRandomPetitions(
        org.id,
        user.id,
        2
      );
      fields = await mocks.createRandomPetitionFields(petition1.id, 6);
      // add some random deleted fields
      deleted = await mocks.createRandomPetitionFields(
        petition1.id,
        10,
        (index) => ({
          position: faker.random.number(10),
          deleted_at: new Date(),
        })
      );
      [foreignField] = await mocks.createRandomPetitionFields(petition2.id, 1);
    });

    test("fails if passed a deleted field id", async () => {
      await expect(
        petitions.deletePetitionField(petition1.id, deleted[3].id, user)
      ).rejects.toThrow("Invalid petition field id");
    });

    test("fails if passed a fields id from another petition", async () => {
      await expect(
        petitions.deletePetitionField(petition1.id, foreignField.id, user)
      ).rejects.toThrow("Invalid petition field id");
    });

    test("deletes the specified fields", async () => {
      let current = [...fields];
      await petitions.deletePetitionField(petition1.id, fields[3].id, user);
      const result1 = await petitions.loadFieldsForPetition(petition1.id, {
        refresh: true,
      });
      current = current.filter((f) => f.id !== fields[3].id);
      expect(result1).toMatchObject(
        current.map(({ id }, index) => ({
          id,
          position: index,
          deleted_at: null,
        }))
      );
      await petitions.deletePetitionField(petition1.id, fields[5].id, user);
      const result2 = await petitions.loadFieldsForPetition(petition1.id, {
        refresh: true,
      });
      current = current.filter((f) => f.id !== fields[5].id);
      expect(result2).toMatchObject(
        current.map(({ id }, index) => ({
          id,
          position: index,
          deleted_at: null,
        }))
      );
      await petitions.deletePetitionField(petition1.id, fields[0].id, user);
      const result3 = await petitions.loadFieldsForPetition(petition1.id, {
        refresh: true,
      });
      current = current.filter((f) => f.id !== fields[0].id);
      expect(result3).toMatchObject(
        current.map(({ id }, index) => ({
          id,
          position: index,
          deleted_at: null,
        }))
      );
    });
  });

  describe("PetitionAccess Reminders", () => {
    let org: Organization;
    let user: User;
    let contact: Contact;
    let petition: Petition;
    let fields: PetitionField;
    let petitionAccess: PetitionAccess;

    beforeAll(async () => {
      await deleteAllData(knex);
      [org] = await mocks.createRandomOrganizations(1);
      [user] = await mocks.createRandomUsers(org.id, 1);
      [contact] = await mocks.createRandomContacts(org.id, user.id, 1);
      [petition] = await mocks.createRandomPetitions(org.id, user.id, 1);
      [fields] = await mocks.createRandomPetitionFields(petition.id, 1);
      [petitionAccess] = await mocks.createPetitionAccess(
        petition.id,
        user.id,
        [contact.id]
      );
    });

    test("petition starts without reminders", () => {
      expect(petitionAccess.reminders_active).toBe(false);
      expect(petitionAccess.reminders_config).toBeNull();
    });

    test("sets automatic reminders", async () => {
      const [startedPetitionAccess] = await petitions.startAccessReminders(
        [petitionAccess.id],
        {
          offset: 1,
          time: new Date().toString(),
          timezone: "Europe/Madrid",
          weekdaysOnly: true,
        }
      );

      expect(startedPetitionAccess.reminders_active).toBe(true);
      expect(startedPetitionAccess.reminders_config).not.toBeNull();
      expect(startedPetitionAccess.reminders_config).toHaveProperty("time");
      expect(startedPetitionAccess.reminders_config).toHaveProperty("offset");
      expect(startedPetitionAccess.reminders_config).toHaveProperty("timezone");
      expect(startedPetitionAccess.reminders_config).toHaveProperty(
        "weekdaysOnly"
      );
    });

    test("starts and stops a reminder", async () => {
      await petitions.startAccessReminders([petitionAccess.id], {
        offset: 1,
        time: new Date().toString(),
        timezone: "Europe/Madrid",
        weekdaysOnly: true,
      });

      const [stoppedPetitionAccess] = await petitions.stopAccessReminders([
        petitionAccess.id,
      ]);

      expect(stoppedPetitionAccess.reminders_active).toBe(false);
      expect(stoppedPetitionAccess.reminders_config).not.toBeNull();
    });
  });
});

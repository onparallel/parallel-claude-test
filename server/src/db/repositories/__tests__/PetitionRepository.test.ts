import { Container } from "inversify";
import { Knex } from "knex";
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
import { createTestContainer } from "../../../../test/testContainer";

describe("repositories/PetitionRepository", () => {
  let container: Container;
  let knex: Knex;
  let mocks: Mocks;
  let petitions: PetitionRepository;

  beforeAll(() => {
    container = createTestContainer();
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
      ).rejects.toThrow("INVALID_PETITION_FIELD_IDS");
      await expect(
        petitions.updateFieldPositions(
          petition1.id,
          [id1, id2, id3, id4, id5, id6, id6],
          user
        )
      ).rejects.toThrow("INVALID_PETITION_FIELD_IDS");
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
      ).rejects.toThrow("INVALID_PETITION_FIELD_IDS");
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
      ).rejects.toThrow("INVALID_PETITION_FIELD_IDS");
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
      [contact] = await mocks.createRandomContacts(org.id, 1);
      [petition] = await mocks.createRandomPetitions(org.id, user.id, 1);
      [fields] = await mocks.createRandomPetitionFields(petition.id, 1);
      [petitionAccess] = await mocks.createPetitionAccess(
        petition.id,
        user.id,
        [contact.id],
        user.id
      );
    });

    test("petition starts without reminders", () => {
      expect(petitionAccess).toMatchObject({
        reminders_active: false,
        reminders_config: null,
      });
    });

    test("sets automatic reminders", async () => {
      const [startedPetitionAccess] = await petitions.startAccessReminders(
        [petitionAccess.id],
        {
          offset: 1,
          time: "12:00",
          timezone: "Europe/Madrid",
          weekdaysOnly: true,
        }
      );

      expect(startedPetitionAccess).toMatchObject({
        reminders_active: true,
        reminders_config: {
          time: "12:00",
          offset: 1,
          timezone: "Europe/Madrid",
          weekdaysOnly: true,
        },
      });
    });

    test("starts and stops a reminder", async () => {
      await petitions.startAccessReminders([petitionAccess.id], {
        offset: 1,
        time: "10:00",
        timezone: "Europe/Madrid",
        weekdaysOnly: true,
      });

      const [stoppedPetitionAccess] = await petitions.stopAccessReminders([
        petitionAccess.id,
      ]);

      expect(stoppedPetitionAccess).toMatchObject({
        reminders_active: false,
        reminders_config: {
          offset: 1,
          time: "10:00",
          timezone: "Europe/Madrid",
          weekdaysOnly: true,
        },
      });
    });
  });

  describe("clonePetitionField", () => {
    let org: Organization;
    let user: User;
    let petition: Petition;
    let fields: PetitionField[];

    beforeAll(async () => {
      await deleteAllData(knex);
      [org] = await mocks.createRandomOrganizations(1);
      [user] = await mocks.createRandomUsers(org.id, 1);
      [petition] = await mocks.createRandomPetitions(org.id, user.id, 1);
      fields = await mocks.createRandomPetitionFields(petition.id, 5);
    });

    test("should throw an error on invalid fieldId", async () => {
      const invalidFieldId = 823098123;
      await expect(
        petitions.clonePetitionField(petition.id, invalidFieldId, user)
      ).rejects.toThrow("invalid fieldId: " + invalidFieldId);
    });

    test("should clone second field", async () => {
      const toCloneId = fields[1].id;
      const { field: newField } = await petitions.clonePetitionField(
        petition.id,
        toCloneId,
        user
      );

      const newFields = await petitions.loadFieldsForPetition(petition.id, {
        refresh: true,
      });

      expect(newFields.map((f) => f.id)).toContain(newField.id);
      expect(newFields[2].id).toBe(newField.id);
    });

    test("cloned field should have the same contents", async () => {
      const toClone = fields[3];
      const { field: newField } = await petitions.clonePetitionField(
        petition.id,
        toClone.id,
        user
      );

      expect(toClone).toMatchObject({
        petition_id: newField.petition_id,
        description: newField.description,
        multiple: newField.multiple,
        optional: newField.optional,
        options: newField.options,
        title: newField.title,
        type: newField.type,
      });
    });

    test("validated field should be cloned invalidated", async () => {
      const toClone = fields[3];
      await petitions.validatePetitionFields(
        petition.id,
        [toClone.id],
        true,
        user
      );
      const { field: cloned } = await petitions.clonePetitionField(
        petition.id,
        toClone.id,
        user
      );

      expect(cloned).toMatchObject({
        validated: false,
      });
    });
  });

  describe("Petition Sharing", () => {
    let org: Organization;
    let users: User[];
    let user0Petitions: Petition[];

    beforeAll(async () => {
      await deleteAllData(knex);
      [org] = await mocks.createRandomOrganizations(1);
      users = await mocks.createRandomUsers(org.id, 5);
    });

    beforeEach(async () => {
      user0Petitions = await mocks.createRandomPetitions(
        org.id,
        users[0].id,
        3
      );
    });

    describe("loadUserPermissions", () => {
      test("should load current user permissions", async () => {
        expect(
          await petitions.loadUserPermissions(user0Petitions[0].id)
        ).toMatchObject([
          {
            petition_id: user0Petitions[0].id,
            user_id: users[0].id,
            permission_type: "OWNER",
          },
        ]);
      });

      test("loading for multiple petitions should return permissions grouped by petition_id", async () => {
        const petitionIds = user0Petitions.map((p) => p.id);
        const groupedPermissions = await petitions.loadUserPermissions(
          petitionIds
        );
        expect(groupedPermissions).toHaveLength(3);
        for (let i = 0; i < 3; i++) {
          expect(
            groupedPermissions[i].every((p) => p.petition_id === petitionIds[i])
          ).toBe(true);
        }
      });
    });

    describe("addPetitionUserPermissions", () => {
      beforeEach(async () => {
        await mocks.clearSharedPetitions();
      });

      test("should insert new permission for user without access to the petitions", async () => {
        const { newPermissions } = await petitions.addPetitionUserPermissions(
          [user0Petitions[0].id],
          [users[1].id],
          "READ",
          users[0]
        );

        const permissions = await petitions.loadUserPermissions(
          user0Petitions[0].id
        );
        permissions.sort((a, b) => a.id - b.id);

        expect(newPermissions).toHaveLength(1);
        expect(permissions).toHaveLength(2);
        expect(permissions).toMatchObject([
          {
            petition_id: user0Petitions[0].id,
            user_id: users[0].id,
            permission_type: "OWNER",
          },
          {
            petition_id: user0Petitions[0].id,
            user_id: users[1].id,
            permission_type: "READ",
          },
        ]);
      });

      test("should not set new permission for user with access to the petitions", async () => {
        const {
          newPermissions: firstPermissions,
        } = await petitions.addPetitionUserPermissions(
          [user0Petitions[0].id],
          [users[2].id],
          "WRITE",
          users[0]
        );

        const { newPermissions } = await petitions.addPetitionUserPermissions(
          [user0Petitions[0].id],
          [users[2].id],
          "READ",
          users[0]
        );
        expect(firstPermissions).toHaveLength(1);
        expect(newPermissions).toHaveLength(0);
      });

      test("should share multiple petitions with a single user", async () => {
        const petitionIds = user0Petitions.map((u) => u.id);
        const { newPermissions } = await petitions.addPetitionUserPermissions(
          petitionIds,
          [users[3].id],
          "WRITE",
          users[0]
        );

        expect(newPermissions).toHaveLength(3);
        let groupedPermissions = await petitions.loadUserPermissions(
          petitionIds
        );

        expect(groupedPermissions).toHaveLength(3);
        for (let i = 0; i < 3; i++) {
          expect(groupedPermissions[i]).toHaveLength(2);
          groupedPermissions[i].sort((a, b) => a.id - b.id);
          expect(groupedPermissions[i]).toMatchObject([
            {
              permission_type: "OWNER",
              user_id: users[0].id,
            },
            {
              permission_type: "WRITE",
              user_id: users[3].id,
            },
          ]);
        }
      });

      test("should share a single petition with multiple users", async () => {
        const userIds = users.slice(1).map((u) => u.id);
        const petitionId = user0Petitions[1].id;
        const { newPermissions } = await petitions.addPetitionUserPermissions(
          [petitionId],
          userIds,
          "READ",
          users[0]
        );

        expect(newPermissions).toHaveLength(userIds.length);
        const permissions = await petitions.loadUserPermissions(petitionId);
        expect(permissions).toHaveLength(userIds.length + 1);
      });

      test("should share multiple petitions with multiple users", async () => {
        const userIds = users.slice(1).map((u) => u.id);
        const petitionIds = user0Petitions.map((p) => p.id);
        const { newPermissions } = await petitions.addPetitionUserPermissions(
          petitionIds,
          userIds,
          "WRITE",
          users[0]
        );

        // userIds.length * petitionIds.length === 12
        expect(newPermissions).toHaveLength(12);
      });
    });

    describe("editPetitionUserPermissions", () => {
      let petitionId: number, userId: number;
      beforeEach(async () => {
        await mocks.clearSharedPetitions();
        petitionId = user0Petitions[0].id;
        userId = users[1].id;
        await petitions.addPetitionUserPermissions(
          [petitionId],
          [userId],
          "READ",
          users[0]
        );
      });

      test("should update permissions for users with shared petitions", async () => {
        const permissions = await petitions.loadUserPermissions(petitionId);
        await petitions.editPetitionUserPermissions(
          [petitionId],
          [userId],
          "WRITE",
          users[0]
        );
        const newPermissions = await petitions.loadUserPermissions(petitionId);
        expect(permissions.length).toEqual(newPermissions.length);
        permissions.sort((a, b) => a.id - b.id);
        expect(newPermissions).toMatchObject([
          {
            permission_type: "OWNER",
            user_id: users[0].id,
            petition_id: petitionId,
          },
          {
            permission_type: "WRITE",
            user_id: userId,
            petition_id: petitionId,
          },
        ]);
      });

      test("should not allow double ownership on a single petition", async () => {
        // this test should assert 1 time on the catch block
        expect.assertions(1);
        try {
          await petitions.editPetitionUserPermissions(
            [petitionId],
            [userId],
            "OWNER",
            users[0]
          );
        } catch (e) {
          expect(e.constraint).toBe("petition_user__owner");
        }
      });

      test("should not edit for user without permissions", async () => {
        const permissions = await petitions.loadUserPermissions(petitionId);
        await petitions.editPetitionUserPermissions(
          [petitionId],
          [users[3].id],
          "READ",
          users[0]
        );
        const newPermissions = await petitions.loadUserPermissions(petitionId, {
          cache: false,
        });
        expect(permissions).toMatchObject(newPermissions);
      });
    });

    describe("removePetitionUserPermissions", () => {
      let petitionId: number, userId: number;
      beforeEach(async () => {
        await mocks.clearSharedPetitions();
        petitionId = user0Petitions[0].id;
        userId = users[1].id;
        await petitions.addPetitionUserPermissions(
          [petitionId],
          [userId],
          "READ",
          users[0]
        );
      });

      test("should remove access to a single petition for a single user", async () => {
        await petitions.removePetitionUserPermissions(
          [petitionId],
          [userId],
          false,
          users[0]
        );
        const permissions = await petitions.loadUserPermissions(petitionId);
        expect(permissions).toHaveLength(1);
        expect(permissions).toMatchObject([
          {
            permission_type: "OWNER",
            user_id: users[0].id,
            petition_id: petitionId,
          },
        ]);
      });

      test("should remove access to a single petition for multiple users", async () => {
        await petitions.addPetitionUserPermissions(
          [petitionId],
          [users[2].id, users[3].id],
          "READ",
          users[0]
        );

        await petitions.removePetitionUserPermissions(
          [petitionId],
          [users[1].id, users[2].id],
          false,
          users[0]
        );
        const permissions = await petitions.loadUserPermissions(petitionId);
        expect(permissions).toHaveLength(2);
        permissions.sort((a, b) => a.id - b.id);
        expect(permissions).toMatchObject([
          {
            petition_id: petitionId,
            user_id: users[0].id,
            permission_type: "OWNER",
          },
          {
            petition_id: petitionId,
            user_id: users[3].id,
            permission_type: "READ",
          },
        ]);
      });

      test("should remove access to multiple petitions for a single user", async () => {
        await petitions.addPetitionUserPermissions(
          [user0Petitions[0].id, user0Petitions[1].id, user0Petitions[2].id],
          [users[1].id],
          "WRITE",
          users[0]
        );

        await petitions.removePetitionUserPermissions(
          [user0Petitions[0].id, user0Petitions[1].id, user0Petitions[2].id],
          [users[1].id],
          false,
          users[0]
        );

        const permissions = await petitions.loadUserPermissions(petitionId);
        expect(permissions).toHaveLength(1);
        expect(permissions).toMatchObject([
          {
            petition_id: petitionId,
            user_id: users[0].id,
            permission_type: "OWNER",
          },
        ]);
      });

      test("ignores the userIds array when passing removeAll = true arg", async () => {
        await petitions.addPetitionUserPermissions(
          [user0Petitions[0].id, user0Petitions[1].id, user0Petitions[2].id],
          [users[1].id],
          "WRITE",
          users[0]
        );

        await petitions.removePetitionUserPermissions(
          [user0Petitions[0].id, user0Petitions[1].id, user0Petitions[2].id],
          [100, 123, 234234234, 2],
          true,
          users[0]
        );

        const permissions = await petitions.loadUserPermissions(petitionId);
        expect(permissions).toMatchObject([
          {
            petition_id: petitionId,
            user_id: users[0].id,
            permission_type: "OWNER",
          },
        ]);
      });

      test("should remove access to multiple petitions for multiple user", async () => {
        await petitions.addPetitionUserPermissions(
          [user0Petitions[0].id, user0Petitions[1].id],
          [users[1].id, users[2].id, users[3].id],
          "WRITE",
          users[0]
        );

        await petitions.removePetitionUserPermissions(
          [user0Petitions[0].id, user0Petitions[1].id],
          [users[1].id, users[2].id, users[3].id],
          false,
          users[0]
        );

        const permissions = (
          await petitions.loadUserPermissions([
            user0Petitions[0].id,
            user0Petitions[1].id,
          ])
        ).flat();
        expect(permissions).toHaveLength(2);
      });
    });

    describe("transferOwnership", () => {
      beforeEach(async () => {
        await mocks.clearSharedPetitions();
      });

      it("should transfer ownership to a user without access to the petition", async () => {
        const petitionId = user0Petitions[1].id;

        await petitions.transferOwnership(
          [petitionId],
          users[2].id,
          true,
          users[0]
        );

        const newPermissions = await petitions.loadUserPermissions(petitionId);
        expect(newPermissions).toMatchObject([
          {
            petition_id: petitionId,
            permission_type: "OWNER",
            user_id: users[2].id,
          },
          {
            petition_id: petitionId,
            permission_type: "WRITE",
            user_id: users[0].id,
          },
        ]);
      });

      it("should transfer ownership to a user without access to the petition and remove original permissions", async () => {
        const petitionId = user0Petitions[1].id;

        await petitions.transferOwnership(
          [petitionId],
          users[2].id,
          false,
          users[0]
        );

        const newPermissions = await petitions.loadUserPermissions(petitionId);
        expect(newPermissions).toMatchObject([
          {
            petition_id: petitionId,
            permission_type: "OWNER",
            user_id: users[2].id,
          },
        ]);
      });

      it("should transfer ownership to a user with READ or WRITE access", async () => {
        const petitionId = user0Petitions[2].id;
        const userId = users[2].id;
        await petitions.addPetitionUserPermissions(
          [petitionId],
          [userId],
          "READ",
          users[0]
        );

        await petitions.transferOwnership([petitionId], userId, true, users[0]);
        const newPermissions = await petitions.loadUserPermissions(petitionId);
        expect(newPermissions).toMatchObject([
          {
            petition_id: petitionId,
            permission_type: "OWNER",
            user_id: userId,
          },
          {
            petition_id: petitionId,
            permission_type: "WRITE",
            user_id: users[0].id,
          },
        ]);
      });

      it("should transfer ownership to a user with READ or WRITE access and remove original permissions", async () => {
        const petitionId = user0Petitions[2].id;
        const userId = users[2].id;
        await petitions.addPetitionUserPermissions(
          [petitionId],
          [userId],
          "READ",
          users[0]
        );

        await petitions.transferOwnership(
          [petitionId],
          userId,
          false,
          users[0]
        );

        const newPermissions = await petitions.loadUserPermissions(petitionId);
        expect(newPermissions).toMatchObject([
          {
            petition_id: petitionId,
            permission_type: "OWNER",
            user_id: userId,
          },
        ]);
      });
    });
  });
});

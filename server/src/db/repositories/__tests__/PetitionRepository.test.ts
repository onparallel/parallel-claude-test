import faker from "@faker-js/faker";
import { Container } from "inversify";
import { Knex } from "knex";
import { isDefined, pick, range, sortBy } from "remeda";
import { createTestContainer } from "../../../../test/testContainer";
import { deleteAllData } from "../../../util/knexUtils";
import { KNEX } from "../../knex";
import {
  Contact,
  Organization,
  Petition,
  PetitionAccess,
  PetitionContactNotification,
  PetitionField,
  PetitionUserNotification,
  User,
} from "../../__types";
import { EmailLogRepository } from "../EmailLogRepository";
import { FileRepository } from "../FileRepository";
import { PetitionRepository } from "../PetitionRepository";
import { Mocks } from "./mocks";

describe("repositories/PetitionRepository", () => {
  let container: Container;
  let knex: Knex;
  let mocks: Mocks;
  let petitions: PetitionRepository;
  let filesRepo: FileRepository;
  let emailLogsRepo: EmailLogRepository;

  let organization: Organization;
  let user: User;
  let contact: Contact;

  beforeAll(async () => {
    container = createTestContainer();
    knex = container.get(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [contact] = await mocks.createRandomContacts(organization.id, 1, () => ({
      email: "jesse.pinkman@test.com",
      first_name: "Jesse",
      last_name: "Pinkman",
    }));

    petitions = container.get(PetitionRepository);
    filesRepo = container.get(FileRepository);
    emailLogsRepo = container.get(EmailLogRepository);
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  describe("loadPetitionsForUser", () => {
    let _petitions: Petition[];

    beforeAll(async () => {
      _petitions = await mocks.createRandomPetitions(organization.id, user.id, 15, (i) => ({
        name: i % 3 === 0 ? "good petition" : "bad petition",
      }));
      await mocks.createPetitionAccess(_petitions[0].id, user.id, [contact.id], user.id);
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
      expect(result.items).toMatchObject(_petitions.slice(5, 10).map(pick(["id"])));
    });

    test("returns a slice of filtered petitions", async () => {
      const result = await petitions.loadPetitionsForUser(user.id, {
        offset: 2,
        limit: 5,
        search: "good", // there's only 5 good petitions
      });
      expect(result.totalCount).toBe(5);
      expect(result.items).toMatchObject(
        _petitions.filter((p) => (p.name ?? "").toLowerCase().includes("good")).slice(2, 2 + 5)
      );
    });

    test("searches petition by recipient name", async () => {
      const result = await petitions.loadPetitionsForUser(user.id, {
        offset: 0,
        limit: 10,
        search: "jesse pinkm",
      });
      expect(result.totalCount).toBe(1);
      expect(result.items).toMatchObject([_petitions[0]]);
    });

    test("searches petition by recipient email", async () => {
      const result = await petitions.loadPetitionsForUser(user.id, {
        offset: 0,
        limit: 10,
        search: "jesse.pinkman@test.com",
      });
      expect(result.totalCount).toBe(1);
      expect(result.items).toMatchObject([_petitions[0]]);
    });
  });

  describe("loadFieldsForPetition & loadFieldCountForPetition", () => {
    let petition1: Petition, petition2: Petition;
    let fields: PetitionField[];

    beforeAll(async () => {
      [petition1, petition2] = await mocks.createRandomPetitions(organization.id, user.id, 2);
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
    let petition1: Petition, petition2: Petition;
    let fields: PetitionField[], deleted: PetitionField[], foreignField: PetitionField;

    beforeAll(async () => {
      [petition1, petition2] = await mocks.createRandomPetitions(organization.id, user.id, 2);
      fields = await mocks.createRandomPetitionFields(petition1.id, 6);
      // add some random deleted fields
      deleted = await mocks.createRandomPetitionFields(petition1.id, 10, (index) => ({
        position: faker.datatype.number(10),
        deleted_at: new Date(),
      }));
      [foreignField] = await mocks.createRandomPetitionFields(petition2.id, 1);
    });

    test("fails if the ids passed do not match with the petition field ids", async () => {
      const [{ id: id1 }, { id: id2 }, { id: id3 }, { id: id4 }, { id: id5 }, { id: id6 }] = fields;
      await expect(
        petitions.updateFieldPositions(petition1.id, [id2, id5, id6], user)
      ).rejects.toThrow("INVALID_PETITION_FIELD_IDS");
      await expect(
        petitions.updateFieldPositions(petition1.id, [id1, id2, id3, id4, id5, id6, id6], user)
      ).rejects.toThrow("INVALID_PETITION_FIELD_IDS");
    });

    test("fails if passed deleted field ids", async () => {
      const [{ id: id1 }, { id: id2 }, { id: id3 }, { id: id4 }, { id: id5 }, { id: id6 }] = fields;
      await expect(
        petitions.updateFieldPositions(
          petition1.id,
          [id1, id2, id3, deleted[2].id, id5, id6, id6],
          user
        )
      ).rejects.toThrow("INVALID_PETITION_FIELD_IDS");
    });

    test("fails if passed fields ids from another petition", async () => {
      const [{ id: id1 }, { id: id2 }, { id: id3 }, { id: id4 }, { id: id5 }, { id: id6 }] = fields;
      await expect(
        petitions.updateFieldPositions(
          petition1.id,
          [id1, id2, id3, foreignField.id, id5, id6, id6],
          user
        )
      ).rejects.toThrow("INVALID_PETITION_FIELD_IDS");
    });

    test("updates the positions", async () => {
      const [{ id: id1 }, { id: id2 }, { id: id3 }, { id: id4 }, { id: id5 }, { id: id6 }] = fields;
      await petitions.updateFieldPositions(petition1.id, [id2, id5, id6, id3, id1, id4], user);
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
      await petitions.updateFieldPositions(petition1.id, [id6, id5, id4, id3, id2, id1], user);
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
    let petition1: Petition, petition2: Petition;
    let fields: PetitionField[], deleted: PetitionField[], foreignField: PetitionField;

    beforeAll(async () => {
      [petition1, petition2] = await mocks.createRandomPetitions(organization.id, user.id, 2);
      fields = await mocks.createRandomPetitionFields(petition1.id, 6);
      // add some random deleted fields
      deleted = await mocks.createRandomPetitionFields(petition1.id, 10, (index) => ({
        position: faker.datatype.number(10),
        deleted_at: new Date(),
      }));
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

    it("deleting a field with linked notifications should also delete the notifications", async () => {
      const [access] = await mocks.createPetitionAccess(
        petition1.id,
        user.id,
        [contact.id],
        user.id
      );
      const [fieldToDelete] = await mocks.createRandomPetitionFields(petition1.id, 1);
      await mocks.knex.from<PetitionUserNotification>("petition_user_notification").insert({
        type: "COMMENT_CREATED",
        data: { petition_field_comment_id: 1, petition_field_id: fieldToDelete.id },
        petition_id: petition1.id,
        user_id: user.id,
      });
      await mocks.knex.from<PetitionContactNotification>("petition_contact_notification").insert({
        type: "COMMENT_CREATED",
        data: { petition_field_comment_id: 1, petition_field_id: fieldToDelete.id },
        petition_id: petition1.id,
        petition_access_id: access.id,
      });

      await petitions.deletePetitionField(petition1.id, fieldToDelete.id, user);

      const [userNotifications, contactNotifications] = await Promise.all([
        mocks.knex
          .from("petition_user_notification")
          .where({ petition_id: petition1.id, type: "COMMENT_CREATED" })
          .select("*"),
        mocks.knex
          .from("petition_contact_notification")
          .where({ petition_id: petition1.id, type: "COMMENT_CREATED" })
          .select("*"),
      ]);

      expect(userNotifications).toHaveLength(0);
      expect(contactNotifications).toHaveLength(0);
    });
  });

  describe("PetitionAccess Reminders", () => {
    let petition: Petition;
    let fields: PetitionField;
    let petitionAccess: PetitionAccess;
    beforeAll(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
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
      const [startedPetitionAccess] = await petitions.startAccessReminders([petitionAccess.id], {
        offset: 1,
        time: "12:00",
        timezone: "Europe/Madrid",
        weekdaysOnly: true,
      });

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

      const [stoppedPetitionAccess] = await petitions.stopAccessReminders([petitionAccess.id]);

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
    let petition: Petition;
    let fields: PetitionField[];

    beforeAll(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      fields = await mocks.createRandomPetitionFields(petition.id, 5);
    });

    test("should throw an error on invalid fieldId", async () => {
      const invalidFieldId = 823098123;
      await expect(petitions.clonePetitionField(petition.id, invalidFieldId, user)).rejects.toThrow(
        "invalid fieldId: " + invalidFieldId
      );
    });

    test("should clone second field", async () => {
      const toCloneId = fields[1].id;
      const newField = await petitions.clonePetitionField(petition.id, toCloneId, user);

      const newFields = await petitions.loadFieldsForPetition(petition.id, {
        refresh: true,
      });

      expect(newFields.map((f) => f.id)).toContain(newField.id);
      expect(newFields[2].id).toBe(newField.id);
    });

    test("cloned field should have the same contents", async () => {
      const toClone = fields[3];
      const newField = await petitions.clonePetitionField(petition.id, toClone.id, user);

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

    test("should not copy alias when cloning the field", async () => {
      const [fieldWithAlias] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        alias: "field-alias",
      }));

      const clonedField = await petitions.clonePetitionField(petition.id, fieldWithAlias.id, user);

      expect(clonedField.alias).toBeNull();
    });
  });

  describe("Petition Sharing", () => {
    let org: Organization;
    let users: User[];
    let user0Petitions: Petition[];

    beforeAll(async () => {
      [org] = await mocks.createRandomOrganizations(1);
      users = await mocks.createRandomUsers(org.id, 5);
    });

    beforeEach(async () => {
      user0Petitions = await mocks.createRandomPetitions(org.id, users[0].id, 3);
    });

    describe("loadUserPermissions", () => {
      test("should load current user permissions", async () => {
        expect(await petitions.loadUserPermissionsByPetitionId(user0Petitions[0].id)).toMatchObject(
          [
            {
              petition_id: user0Petitions[0].id,
              user_id: users[0].id,
              type: "OWNER",
            },
          ]
        );
      });

      test("loading for multiple petitions should return permissions grouped by petition_id", async () => {
        const petitionIds = user0Petitions.map((p) => p.id);
        const groupedPermissions = await petitions.loadUserPermissionsByPetitionId(petitionIds);
        expect(groupedPermissions).toHaveLength(3);
        for (let i = 0; i < 3; i++) {
          expect(groupedPermissions[i].every((p) => p.petition_id === petitionIds[i])).toBe(true);
        }
      });
    });

    describe("addPetitionPermissions", () => {
      beforeEach(async () => {
        await mocks.clearSharedPetitions();
      });

      test("should insert new permission for user without access to the petitions", async () => {
        const { newPermissions } = await petitions.addPetitionPermissions(
          [user0Petitions[0].id],
          [{ type: "User", id: users[1].id, isSubscribed: true, permissionType: "READ" }],
          `User:${users[0].id}`
        );

        const permissions = await petitions.loadUserPermissionsByPetitionId(user0Petitions[0].id);
        permissions.sort((a, b) => a.id - b.id);

        expect(newPermissions).toHaveLength(1);
        expect(permissions).toHaveLength(2);
        expect(permissions).toMatchObject([
          {
            petition_id: user0Petitions[0].id,
            user_id: users[0].id,
            type: "OWNER",
          },
          {
            petition_id: user0Petitions[0].id,
            user_id: users[1].id,
            type: "READ",
          },
        ]);
      });

      test("should not set new permission for user with access to the petitions", async () => {
        const { newPermissions: firstPermissions } = await petitions.addPetitionPermissions(
          [user0Petitions[0].id],
          [{ type: "User", id: users[2].id, isSubscribed: true, permissionType: "READ" }],
          `User:${users[0].id}`
        );

        const { newPermissions } = await petitions.addPetitionPermissions(
          [user0Petitions[0].id],
          [{ type: "User", id: users[2].id, isSubscribed: true, permissionType: "READ" }],
          `User:${users[0].id}`
        );
        expect(firstPermissions).toHaveLength(1);
        expect(newPermissions).toHaveLength(0);
      });

      test("should share multiple petitions with a single user", async () => {
        const petitionIds = user0Petitions.map((u) => u.id);
        const { newPermissions } = await petitions.addPetitionPermissions(
          petitionIds,
          [{ type: "User", id: users[3].id, isSubscribed: true, permissionType: "WRITE" }],
          `User:${users[0].id}`
        );

        expect(newPermissions).toHaveLength(3);
        const groupedPermissions = await petitions.loadUserPermissionsByPetitionId(petitionIds);

        expect(groupedPermissions).toHaveLength(3);
        for (let i = 0; i < 3; i++) {
          expect(groupedPermissions[i]).toHaveLength(2);
          groupedPermissions[i].sort((a, b) => a.id - b.id);
          expect(groupedPermissions[i]).toMatchObject([
            {
              type: "OWNER",
              user_id: users[0].id,
            },
            {
              type: "WRITE",
              user_id: users[3].id,
            },
          ]);
        }
      });

      test("should share a single petition with multiple users", async () => {
        const userIds = users.slice(1).map((u) => u.id);
        const petitionId = user0Petitions[1].id;
        const { newPermissions } = await petitions.addPetitionPermissions(
          [petitionId],
          userIds.map((id) => ({ type: "User", id, isSubscribed: true, permissionType: "READ" })),
          `User:${users[0].id}`
        );

        expect(newPermissions).toHaveLength(userIds.length);
        const permissions = await petitions.loadUserPermissionsByPetitionId(petitionId);
        expect(permissions).toHaveLength(userIds.length + 1);
      });

      test("should share multiple petitions with multiple users", async () => {
        const userIds = users.slice(1).map((u) => u.id);
        const petitionIds = user0Petitions.map((p) => p.id);
        const { newPermissions } = await petitions.addPetitionPermissions(
          petitionIds,
          userIds.map((id) => ({ type: "User", id, isSubscribed: true, permissionType: "WRITE" })),
          `User:${users[0].id}`
        );

        // userIds.length * petitionIds.length === 12
        expect(newPermissions).toHaveLength(12);
      });
    });

    describe("editPetitionPermissions", () => {
      let petitionId: number, userId: number;
      beforeEach(async () => {
        await mocks.clearSharedPetitions();
        petitionId = user0Petitions[0].id;
        userId = users[1].id;
        await petitions.addPetitionPermissions(
          [petitionId],
          [{ type: "User", id: userId, permissionType: "READ", isSubscribed: true }],
          `User:${users[0].id}`
        );
      });

      test("should update permissions for users with shared petitions", async () => {
        const permissions = await petitions.loadUserPermissionsByPetitionId(petitionId);
        await petitions.editPetitionPermissions([petitionId], [userId], [], "WRITE", users[0]);
        const newPermissions = await petitions.loadUserPermissionsByPetitionId(petitionId);
        expect(permissions.length).toEqual(newPermissions.length);
        permissions.sort((a, b) => a.id - b.id);
        expect(newPermissions).toMatchObject([
          {
            type: "OWNER",
            user_id: users[0].id,
            petition_id: petitionId,
          },
          {
            type: "WRITE",
            user_id: userId,
            petition_id: petitionId,
          },
        ]);
      });

      test("should not allow double ownership on a single petition", async () => {
        // this test should assert 1 time on the catch block
        expect.assertions(1);
        try {
          await petitions.editPetitionPermissions([petitionId], [userId], [], "OWNER", users[0]);
        } catch (e: any) {
          expect(e.constraint).toBe("petition_permission__owner");
        }
      });

      test("should not edit for user without permissions", async () => {
        const permissions = await petitions.loadUserPermissionsByPetitionId(petitionId);
        await petitions.editPetitionPermissions([petitionId], [users[3].id], [], "READ", users[0]);
        const newPermissions = await petitions.loadUserPermissionsByPetitionId(petitionId, {
          cache: false,
        });
        expect(permissions).toMatchObject(newPermissions);
      });
    });

    describe("removePetitionPermissions", () => {
      let petitionId: number, userId: number;
      beforeEach(async () => {
        await mocks.clearSharedPetitions();
        petitionId = user0Petitions[0].id;
        userId = users[1].id;
        await petitions.addPetitionPermissions(
          [petitionId],
          [{ type: "User", id: userId, permissionType: "READ", isSubscribed: true }],
          `User:${users[0].id}`
        );
      });

      test("should remove access to a single petition for a single user", async () => {
        await petitions.removePetitionPermissions([petitionId], [userId], [], false, users[0]);
        const permissions = await petitions.loadUserPermissionsByPetitionId(petitionId);
        expect(permissions).toHaveLength(1);
        expect(permissions).toMatchObject([
          {
            type: "OWNER",
            user_id: users[0].id,
            petition_id: petitionId,
          },
        ]);
      });

      test("should remove access to a single petition for multiple users", async () => {
        await petitions.addPetitionPermissions(
          [petitionId],
          [users[2].id, users[3].id].map((userId) => ({
            type: "User",
            id: userId,
            isSubscribed: true,
            permissionType: "READ",
          })),
          `User:${users[0].id}`
        );

        await petitions.removePetitionPermissions(
          [petitionId],
          [users[1].id, users[2].id],
          [],
          false,
          users[0]
        );
        const permissions = await petitions.loadUserPermissionsByPetitionId(petitionId);
        expect(permissions).toHaveLength(2);
        permissions.sort((a, b) => a.id - b.id);
        expect(permissions).toMatchObject([
          {
            petition_id: petitionId,
            user_id: users[0].id,
            type: "OWNER",
          },
          {
            petition_id: petitionId,
            user_id: users[3].id,
            type: "READ",
          },
        ]);
      });

      test("should remove access to multiple petitions for a single user", async () => {
        await petitions.addPetitionPermissions(
          [user0Petitions[0].id, user0Petitions[1].id, user0Petitions[2].id],
          [{ type: "User", id: users[1].id, isSubscribed: true, permissionType: "WRITE" }],
          `User:${users[0].id}`
        );

        await petitions.removePetitionPermissions(
          [user0Petitions[0].id, user0Petitions[1].id, user0Petitions[2].id],
          [users[1].id],
          [],
          false,
          users[0]
        );

        const permissions = await petitions.loadUserPermissionsByPetitionId(petitionId);
        expect(permissions).toHaveLength(1);
        expect(permissions).toMatchObject([
          {
            petition_id: petitionId,
            user_id: users[0].id,
            type: "OWNER",
          },
        ]);
      });

      test("ignores the userIds array when passing removeAll = true arg", async () => {
        await petitions.addPetitionPermissions(
          [user0Petitions[0].id, user0Petitions[1].id, user0Petitions[2].id],
          [{ type: "User", id: users[1].id, isSubscribed: true, permissionType: "WRITE" }],
          `User:${users[0].id}`
        );

        await petitions.removePetitionPermissions(
          [user0Petitions[0].id, user0Petitions[1].id, user0Petitions[2].id],
          [100, 123, 234234234, 2],
          [],
          true,
          users[0]
        );

        const permissions = await petitions.loadUserPermissionsByPetitionId(petitionId);
        expect(permissions).toMatchObject([
          {
            petition_id: petitionId,
            user_id: users[0].id,
            type: "OWNER",
          },
        ]);
      });

      test("should remove access to multiple petitions for multiple user", async () => {
        await petitions.addPetitionPermissions(
          [user0Petitions[0].id, user0Petitions[1].id],
          [users[1].id, users[2].id, users[3].id].map((userId) => ({
            type: "User",
            id: userId,
            isSubscribed: true,
            permissionType: "WRITE",
          })),
          `User:${users[0].id}`
        );

        await petitions.removePetitionPermissions(
          [user0Petitions[0].id, user0Petitions[1].id],
          [users[1].id, users[2].id, users[3].id],
          [],
          false,
          users[0]
        );

        const permissions = (
          await petitions.loadUserPermissionsByPetitionId([
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

        await petitions.transferOwnership([petitionId], users[2].id, true, users[0]);

        const newPermissions = await petitions.loadUserPermissionsByPetitionId(petitionId);
        expect(newPermissions).toMatchObject([
          {
            petition_id: petitionId,
            type: "OWNER",
            user_id: users[2].id,
          },
          {
            petition_id: petitionId,
            type: "WRITE",
            user_id: users[0].id,
          },
        ]);
      });

      it("should transfer ownership to a user without access to the petition and remove original permissions", async () => {
        const petitionId = user0Petitions[1].id;

        await petitions.transferOwnership([petitionId], users[2].id, false, users[0]);

        const newPermissions = await petitions.loadUserPermissionsByPetitionId(petitionId);
        expect(newPermissions).toMatchObject([
          {
            petition_id: petitionId,
            type: "OWNER",
            user_id: users[2].id,
          },
        ]);
      });

      it("should transfer ownership to a user with READ or WRITE access", async () => {
        const petitionId = user0Petitions[2].id;
        const userId = users[2].id;
        await petitions.addPetitionPermissions(
          [petitionId],
          [{ type: "User", id: userId, isSubscribed: true, permissionType: "READ" }],
          `User:${users[0].id}`
        );

        await petitions.transferOwnership([petitionId], userId, true, users[0]);
        const newPermissions = await petitions.loadUserPermissionsByPetitionId(petitionId);
        expect(newPermissions).toMatchObject([
          {
            petition_id: petitionId,
            type: "OWNER",
            user_id: userId,
          },
          {
            petition_id: petitionId,
            type: "WRITE",
            user_id: users[0].id,
          },
        ]);
      });

      it("should transfer ownership to a user with READ or WRITE access and remove original permissions", async () => {
        const petitionId = user0Petitions[2].id;
        const userId = users[2].id;
        await petitions.addPetitionPermissions(
          [petitionId],
          [{ type: "User", id: userId, permissionType: "READ", isSubscribed: true }],
          `User:${users[0].id}`
        );

        await petitions.transferOwnership([petitionId], userId, false, users[0]);

        const newPermissions = await petitions.loadUserPermissionsByPetitionId(petitionId);
        expect(newPermissions).toMatchObject([
          {
            petition_id: petitionId,
            type: "OWNER",
            user_id: userId,
          },
        ]);
      });
    });
  });

  describe("Petition Anonymizer", () => {
    describe("anonymizePetition", () => {
      let petition: Petition;
      let fields: PetitionField[] = [];
      let accesses: PetitionAccess[] = [];

      beforeEach(async () => {
        [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
          is_template: false,
          signature_config: {},
        }));

        fields = await mocks.createRandomPetitionFields(petition.id, 20, (i) => ({
          type: i < 5 ? "FILE_UPLOAD" : i === 10 ? "CHECKBOX" : undefined,
        }));

        const contacts = await mocks.createRandomContacts(organization.id, 4);
        accesses = await mocks.createPetitionAccess(
          petition.id,
          user.id,
          contacts.map((c) => c.id),
          user.id
        );
      });

      it("marks petition as anonymized", async () => {
        await petitions.anonymizePetition(petition.id);

        const after = (await petitions.loadPetition(petition.id))!;
        expect(petition.signature_config).not.toBeNull();
        expect(after.signature_config).toBeNull();
        expect(after.anonymized_at).not.toBeNull();
      });

      it("erases the content of every reply", async () => {
        const fileUploadIds: number[] = [];

        expect(fields.length).toBeGreaterThan(0);
        for (let i = 0; i < fields.length; i++) {
          if (i < 5) {
            const fileReplies = await mocks.createRandomFileReply(fields[i].id, 2, () => ({
              user_id: user.id,
            }));
            fileUploadIds.push(...fileReplies.map((r) => r.content.file_upload_id));
          } else {
            const { type } = fields[i];
            await mocks.createRandomTextReply(fields[i].id, undefined, 3, () => ({
              user_id: user.id,
              type,
              content: { value: type === "CHECKBOX" ? ["1", "2"] : faker.lorem.words(10) },
            }));
          }
        }

        await petitions.anonymizePetition(petition.id);

        const repliesAfter = (
          await petitions.loadRepliesForField(
            fields.map((f) => f.id),
            { cache: false }
          )
        ).flat();
        expect(repliesAfter.length).toBeGreaterThan(0);

        for (const reply of repliesAfter) {
          expect(reply.anonymized_at).not.toBeNull();
          if (reply.type === "FILE_UPLOAD") {
            expect(reply.content.file_upload_id).toBeNull();
          } else {
            expect(reply.content.value).toBeNull();
          }
        }
        // deletes every file_upload on replies
        const currentFiles = await filesRepo.loadFileUpload(fileUploadIds, { cache: false });
        expect(currentFiles.filter(isDefined)).toHaveLength(0);
      });

      it("erases the content of every comment", async () => {
        await Promise.all([
          mocks.createRandomCommentsFromUser(user.id, fields[3].id, petition.id, 2),
          mocks.createRandomCommentsFromUser(user.id, fields[1].id, petition.id, 3),
          mocks.createRandomCommentsFromAccess(accesses[0].id, fields[3].id, petition.id, 2),
        ]);

        await petitions.anonymizePetition(petition.id);

        const commentsAfter = (
          await petitions.loadPetitionFieldCommentsForField(
            fields.map((f) => ({
              petitionFieldId: f.id,
              petitionId: petition.id,
              loadInternalComments: true,
            })),
            { cache: false }
          )
        ).flat();

        expect(commentsAfter.every((c) => c.anonymized_at !== null && c.content === "")).toEqual(
          true
        );
      });

      it("deactivates every access on the petition", async () => {
        await petitions.anonymizePetition(petition.id);

        const accesses = await petitions.loadAccessesForPetition(petition.id, { cache: false });
        expect(accesses.length).toBeGreaterThan(0);
        expect(accesses.every((a) => a.status === "INACTIVE")).toEqual(true);
      });

      it("erases the content of every message and reminder", async () => {
        await Promise.all([
          await mocks.createRandomPetitionMessage(petition.id, accesses[0].id, user.id),
          await mocks.createRandomPetitionReminder(accesses[3].id, user.id),
        ]);

        await petitions.anonymizePetition(petition.id);

        const messages = (
          await petitions.loadMessagesByPetitionAccessId(accesses.map((a) => a.id))
        ).flat();
        const reminders = (
          await petitions.loadRemindersByAccessId(accesses.map((a) => a.id))
        ).flat();

        expect(messages.length).toBeGreaterThan(0);
        expect(reminders.length).toBeGreaterThan(0);

        expect(
          messages.every(
            (m) => m.email_body === null && m.email_subject === null && m.anonymized_at !== null
          )
        ).toEqual(true);

        expect(reminders.every((r) => r.email_body === null && r.anonymized_at !== null)).toEqual(
          true
        );
      });

      it("erases the content of every email log", async () => {
        const [messageEmailLog, reminderEmailLog] = await mocks.createRandomEmailLog(2);
        await mocks.createRandomPetitionMessage(petition.id, accesses[0].id, user.id, () => ({
          email_log_id: messageEmailLog.id,
        }));
        await mocks.createRandomPetitionReminder(accesses[3].id, user.id, () => ({
          email_log_id: reminderEmailLog.id,
        }));

        await petitions.anonymizePetition(petition.id);

        const emailLogs = (
          await emailLogsRepo.loadEmailLog([messageEmailLog.id, reminderEmailLog.id])
        ).filter(isDefined);

        expect(emailLogs.length).toBeGreaterThan(0);
        expect(
          emailLogs.every(
            (e) =>
              e &&
              e.text === "" &&
              e.html === "" &&
              e.to === "" &&
              e.subject === "" &&
              e.anonymized_at !== null
          )
        ).toEqual(true);
      });

      it("nulls singers in signature request configs and deletes the signed documents", async () => {
        const [signedDocument] = await mocks.createRandomFileUpload(1);
        await Promise.all([
          mocks.createRandomPetitionSignatureRequest(petition.id, () => ({
            status: "COMPLETED",
            file_upload_id: signedDocument.id,
          })),
          mocks.createRandomPetitionSignatureRequest(petition.id, () => ({
            status: "PROCESSING",
          })),
          mocks.createRandomPetitionSignatureRequest(petition.id, () => ({
            status: "CANCELLED",
            cancel_data: { reason: "this is my reason" },
            cancel_reason: "DECLINED_BY_SIGNER",
          })),
        ]);

        await petitions.anonymizePetition(petition.id);

        const signatures = await petitions.loadPetitionSignaturesByPetitionId(petition.id);

        expect(signatures.length).toBeGreaterThan(0);
        expect(
          signatures.every(
            (s) =>
              s.signature_config.signersInfo.every((s) => s === null) &&
              ((s.cancel_reason === "DECLINED_BY_SIGNER" &&
                JSON.stringify(s.cancel_data) === "{}") ||
                s.cancel_reason !== "DECLINED_BY_SIGNER") &&
              s.data === null &&
              s.event_logs === null &&
              s.anonymized_at !== null
          )
        ).toEqual(true);

        const signedFileIds = signatures
          .filter((s) => isDefined(s.file_upload_id))
          .map((s) => s.id);
        expect(signedFileIds.length).toBeGreaterThan(0);
        const fileUploads = (await filesRepo.loadFileUpload(signedFileIds)).filter(isDefined);
        expect(fileUploads).toHaveLength(0);
      });
    });
  });
});

import { faker } from "@faker-js/faker";
import { toDate } from "date-fns-tz";
import { Container } from "inversify";
import { Knex } from "knex";
import { isNonNullish, pick, range, sortBy } from "remeda";
import { createTestContainer } from "../../../../test/testContainer";
import {
  IProfilesSetupService,
  PROFILES_SETUP_SERVICE,
} from "../../../services/ProfilesSetupService";
import { deleteAllData } from "../../../util/knexUtils";
import { random } from "../../../util/token";
import {
  Contact,
  Organization,
  Petition,
  PetitionAccess,
  PetitionContactNotification,
  PetitionField,
  PetitionFieldReply,
  PetitionFieldType,
  PetitionFieldTypeValues,
  PetitionUserNotification,
  ProfileRelationshipType,
  ProfileType,
  ProfileTypeField,
  User,
} from "../../__types";
import { KNEX } from "../../knex";
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
  let profilesSetup: IProfilesSetupService;

  let organization: Organization;
  let user: User;
  let contact: Contact;

  beforeAll(async () => {
    container = await createTestContainer();
    knex = container.get(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [contact] = await mocks.createRandomContacts(organization.id, 1, () => ({
      email: "jesse.pinkman@test.com",
      first_name: "Jesse",
      last_name: "Pinkman",
    }));

    await mocks.createOrganizationUsageLimit(organization.id, "PETITION_SEND", 1000);

    petitions = container.get(PetitionRepository);
    filesRepo = container.get(FileRepository);
    emailLogsRepo = container.get(EmailLogRepository);
    profilesSetup = container.get<IProfilesSetupService>(PROFILES_SETUP_SERVICE);
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
      const result = petitions.getPaginatedPetitionsForUser({
        orgId: user.org_id,
        userId: user.id,
        opts: {},
      });
      expect(await result.totalCount).toBe(15);
      expect(await result.items).toHaveLength(0);
    });

    test("returns a slice of petitions", async () => {
      const result = petitions.getPaginatedPetitionsForUser({
        orgId: user.org_id,
        userId: user.id,
        opts: {
          offset: 5,
          limit: 5,
        },
      });
      expect(await result.totalCount).toBe(15);
      expect(await result.items).toMatchObject(_petitions.slice(5, 10).map(pick(["id"])));
    });

    test("returns a slice of filtered petitions", async () => {
      const result = petitions.getPaginatedPetitionsForUser({
        orgId: user.org_id,
        userId: user.id,
        opts: {
          offset: 2,
          limit: 5,
          search: "good", // there's only 5 good petitions
        },
      });
      expect(await result.totalCount).toBe(5);
      expect(await result.items).toMatchObject(
        _petitions.filter((p) => (p.name ?? "").toLowerCase().includes("good")).slice(2, 2 + 5),
      );
    });

    test("searches petition by recipient name", async () => {
      const result = petitions.getPaginatedPetitionsForUser({
        orgId: user.org_id,
        userId: user.id,
        opts: {
          offset: 0,
          limit: 10,
          search: "jesse pinkm",
        },
      });
      expect(await result.totalCount).toBe(1);
      expect(await result.items).toMatchObject([_petitions[0]]);
    });

    test("searches petition by recipient email", async () => {
      const result = petitions.getPaginatedPetitionsForUser({
        orgId: user.org_id,
        userId: user.id,
        opts: {
          offset: 0,
          limit: 10,
          search: "jesse.pinkman@test.com",
        },
      });
      expect(await result.totalCount).toBe(1);
      expect(await result.items).toMatchObject([_petitions[0]]);
    });
  });

  describe("loadFieldsForPetition & loadFieldCountForPetition", () => {
    let petition1: Petition, petition2: Petition;

    beforeAll(async () => {
      [petition1, petition2] = await mocks.createRandomPetitions(organization.id, user.id, 2);
      await mocks.createRandomPetitionFields(petition1.id, 6, (i) => ({
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

    beforeEach(async () => {
      [petition1, petition2] = await mocks.createRandomPetitions(organization.id, user.id, 2);
      fields = await mocks.createRandomPetitionFields(petition1.id, 6);
      // add some random deleted fields
      deleted = await mocks.createRandomPetitionFields(petition1.id, 10, () => ({
        deleted_at: new Date(),
      }));
      [foreignField] = await mocks.createRandomPetitionFields(petition2.id, 1);
    });

    test("fails if the ids passed do not match with the petition field ids", async () => {
      const [{ id: id1 }, { id: id2 }, { id: id3 }, { id: id4 }, { id: id5 }, { id: id6 }] = fields;
      await expect(
        petitions.updateFieldPositions(petition1.id, [id2, id5, id6], null, `User:${user.id}`),
      ).rejects.toThrow("INVALID_PETITION_FIELD_IDS");
      await expect(
        petitions.updateFieldPositions(
          petition1.id,
          [id1, id2, id3, id4, id5, id6, id6],
          null,
          `User:${user.id}`,
        ),
      ).rejects.toThrow("INVALID_PETITION_FIELD_IDS");
    });

    test("fails if passed deleted field ids", async () => {
      const [{ id: id1 }, { id: id2 }, { id: id3 }, { id: _id4 }, { id: id5 }, { id: id6 }] =
        fields;
      await expect(
        petitions.updateFieldPositions(
          petition1.id,
          [id1, id2, id3, deleted[2].id, id5, id6, id6],
          null,
          `User:${user.id}`,
        ),
      ).rejects.toThrow("INVALID_PETITION_FIELD_IDS");
    });

    test("fails if passed fields ids from another petition", async () => {
      const [{ id: id1 }, { id: id2 }, { id: id3 }, { id: _id4 }, { id: id5 }, { id: id6 }] =
        fields;
      await expect(
        petitions.updateFieldPositions(
          petition1.id,
          [id1, id2, id3, foreignField.id, id5, id6, id6],
          null,
          `User:${user.id}`,
        ),
      ).rejects.toThrow("INVALID_PETITION_FIELD_IDS");
    });

    test("updates the positions", async () => {
      const [{ id: id1 }, { id: id2 }, { id: id3 }, { id: id4 }, { id: id5 }, { id: id6 }] = fields;
      await petitions.updateFieldPositions(
        petition1.id,
        [id2, id5, id6, id3, id1, id4],
        null,
        `User:${user.id}`,
      );
      const result1 = await petitions.loadFieldsForPetition(petition1.id, {
        refresh: true,
      });
      expect(sortBy(result1, (f) => f.position)).toMatchObject(
        [id2, id5, id6, id3, id1, id4].map((id, index) => ({
          id,
          position: index,
          deleted_at: null,
        })),
      );
      await petitions.updateFieldPositions(
        petition1.id,
        [id6, id5, id4, id3, id2, id1],
        null,
        `User:${user.id}`,
      );
      const result2 = await petitions.loadFieldsForPetition(petition1.id, {
        refresh: true,
      });
      expect(sortBy(result2, (f) => f.position)).toMatchObject(
        [id6, id5, id4, id3, id2, id1].map((id, index) => ({
          id,
          position: index,
          deleted_at: null,
        })),
      );
    });

    it("only updates fields that changed positions", async () => {
      const [{ id: id1 }, { id: id2 }, { id: id3 }, { id: id4 }, { id: id5 }, { id: id6 }] = fields;
      await petitions.updateFieldPositions(
        petition1.id,
        [id1, id2, id5, id4, id3, id6],
        null,
        `User:${user.id}`,
      );
      const result = await petitions.loadFieldsForPetition(petition1.id, {
        refresh: true,
      });

      expect(sortBy(result, (f) => f.position)).toMatchObject([
        { id: id1, position: 0, updated_by: null },
        { id: id2, position: 1, updated_by: null },
        { id: id5, position: 2, updated_by: expect.any(String) },
        { id: id4, position: 3, updated_by: null },
        { id: id3, position: 4, updated_by: expect.any(String) },
        { id: id6, position: 5, updated_by: null },
      ]);
    });
  });

  describe("deletePetitionField", () => {
    let petition1: Petition, petition2: Petition;
    let fields: PetitionField[], deleted: PetitionField[], foreignField: PetitionField;

    beforeAll(async () => {
      [petition1, petition2] = await mocks.createRandomPetitions(organization.id, user.id, 2);
      fields = await mocks.createRandomPetitionFields(petition1.id, 6);
      // add some random deleted fields
      deleted = await mocks.createRandomPetitionFields(petition1.id, 10, () => ({
        deleted_at: new Date(),
      }));
      [foreignField] = await mocks.createRandomPetitionFields(petition2.id, 1);
    });

    test("fails if passed a deleted field id", async () => {
      await expect(
        petitions.deletePetitionField(petition1.id, deleted[3].id, user),
      ).rejects.toThrow("Invalid petition field id");
    });

    test("fails if passed a fields id from another petition", async () => {
      await expect(
        petitions.deletePetitionField(petition1.id, foreignField.id, user),
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
        })),
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
        })),
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
        })),
      );
    });

    it("deleting a field with linked notifications should also delete the notifications", async () => {
      const [access] = await mocks.createPetitionAccess(
        petition1.id,
        user.id,
        [contact.id],
        user.id,
      );
      const [fieldToDelete] = await mocks.createRandomPetitionFields(petition1.id, 1);
      const [userComment] = await mocks.createRandomCommentsFromUser(
        user.id,
        fieldToDelete.id,
        petition1.id,
        1,
      );
      await mocks.knex.from<PetitionUserNotification>("petition_user_notification").insert({
        type: "COMMENT_CREATED",
        data: { petition_field_comment_id: userComment.id, petition_field_id: fieldToDelete.id },
        petition_id: petition1.id,
        user_id: user.id,
      });

      const [accessComment] = await mocks.createRandomCommentsFromAccess(
        access.id,
        fieldToDelete.id,
        petition1.id,
        1,
      );
      await mocks.knex.from<PetitionContactNotification>("petition_contact_notification").insert({
        type: "COMMENT_CREATED",
        data: { petition_field_comment_id: accessComment.id, petition_field_id: fieldToDelete.id },
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

    let petitionAccess: PetitionAccess;
    beforeAll(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      await mocks.createRandomPetitionFields(petition.id, 1);
      [petitionAccess] = await mocks.createPetitionAccess(
        petition.id,
        user.id,
        [contact.id],
        user.id,
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

  describe("createReminders", () => {
    test("manual reminders limit should always be greater than or equal to automatic reminders limit", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [contact] = await mocks.createRandomContacts(organization.id, 1);
      const [access] = await mocks.createPetitionAccess(
        petition.id,
        user.id,
        [contact.id],
        user.id,
        () => ({
          reminders_left: 6,
          automatic_reminders_left: 4,
          next_reminder_at: new Date(),
          reminders_active: true,
        }),
      );

      async function sendManualReminder() {
        await petitions.createReminders("MANUAL", [
          { petition_access_id: access.id, sender_id: user.id },
        ]);
      }

      async function sendAutomaticReminder() {
        await petitions.createReminders("AUTOMATIC", [
          { petition_access_id: access.id, sender_id: user.id },
        ]);
      }

      async function loadAccess() {
        const [dbAccess] = await mocks.knex.from("petition_access").where("id", access.id);
        return dbAccess;
      }

      await sendManualReminder();
      const dbAccess1 = await loadAccess();
      expect(dbAccess1).toMatchObject({
        reminders_left: 5,
        automatic_reminders_left: 4,
        next_reminder_at: expect.any(Date),
        reminders_active: true,
      });

      await sendAutomaticReminder();
      const dbAccess2 = await loadAccess();
      expect(dbAccess2).toMatchObject({
        reminders_left: 4,
        automatic_reminders_left: 3,
        next_reminder_at: expect.any(Date),
        reminders_active: true,
      });

      await sendAutomaticReminder();
      const dbAccess3 = await loadAccess();
      expect(dbAccess3).toMatchObject({
        reminders_left: 3,
        automatic_reminders_left: 2,
        next_reminder_at: expect.any(Date),
        reminders_active: true,
      });

      await sendManualReminder();
      const dbAccess4 = await loadAccess();
      expect(dbAccess4).toMatchObject({
        reminders_left: 2,
        automatic_reminders_left: 2,
        next_reminder_at: expect.any(Date),
        reminders_active: true,
      });

      await sendAutomaticReminder();
      const dbAccess5 = await loadAccess();
      expect(dbAccess5).toMatchObject({
        reminders_left: 1,
        automatic_reminders_left: 1,
        next_reminder_at: expect.any(Date),
        reminders_active: true,
      });

      await sendAutomaticReminder();
      const dbAccess6 = await loadAccess();
      expect(dbAccess6).toMatchObject({
        reminders_left: 0,
        automatic_reminders_left: 0,
        next_reminder_at: null,
        reminders_active: false,
      });
    });

    test("should not create and send reminders if provided access has no reminders left", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [contact] = await mocks.createRandomContacts(organization.id, 1);
      const [access] = await mocks.createPetitionAccess(
        petition.id,
        user.id,
        [contact.id],
        user.id,
        () => ({
          reminders_left: 0,
          automatic_reminders_left: 0,
          next_reminder_at: null,
          reminders_active: false,
        }),
      );

      const reminders = await petitions.createReminders("MANUAL", [
        { petition_access_id: access.id, sender_id: user.id },
      ]);

      expect(reminders).toHaveLength(0);
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
        "invalid fieldId: " + invalidFieldId,
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
          ],
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
        const newPermissions = await petitions.addPetitionPermissions(
          [user0Petitions[0].id],
          [{ type: "User", id: users[1].id, isSubscribed: true, permissionType: "READ" }],
          "User",
          users[0].id,
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
        const firstPermissions = await petitions.addPetitionPermissions(
          [user0Petitions[0].id],
          [{ type: "User", id: users[2].id, isSubscribed: true, permissionType: "READ" }],
          "User",
          users[0].id,
        );

        const newPermissions = await petitions.addPetitionPermissions(
          [user0Petitions[0].id],
          [{ type: "User", id: users[2].id, isSubscribed: true, permissionType: "READ" }],
          "User",
          users[0].id,
        );
        expect(firstPermissions).toHaveLength(1);
        expect(newPermissions).toHaveLength(0);
      });

      test("should share multiple petitions with a single user", async () => {
        const petitionIds = user0Petitions.map((u) => u.id);
        const newPermissions = await petitions.addPetitionPermissions(
          petitionIds,
          [{ type: "User", id: users[3].id, isSubscribed: true, permissionType: "WRITE" }],
          "User",
          users[0].id,
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
        const newPermissions = await petitions.addPetitionPermissions(
          [petitionId],
          userIds.map((id) => ({ type: "User", id, isSubscribed: true, permissionType: "READ" })),
          "User",
          users[0].id,
        );

        expect(newPermissions).toHaveLength(userIds.length);
        const permissions = await petitions.loadUserPermissionsByPetitionId(petitionId);
        expect(permissions).toHaveLength(userIds.length + 1);
      });

      test("should share multiple petitions with multiple users", async () => {
        const userIds = users.slice(1).map((u) => u.id);
        const petitionIds = user0Petitions.map((p) => p.id);
        const newPermissions = await petitions.addPetitionPermissions(
          petitionIds,
          userIds.map((id) => ({ type: "User", id, isSubscribed: true, permissionType: "WRITE" })),
          "User",
          users[0].id,
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
          "User",
          users[0].id,
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
        const newPermissions = await petitions.loadUserPermissionsByPetitionId.raw(petitionId);
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
          "User",
          users[0].id,
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
          "User",
          users[0].id,
        );

        await petitions.removePetitionPermissions(
          [petitionId],
          [users[1].id, users[2].id],
          [],
          false,
          users[0],
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
          "User",
          users[0].id,
        );

        await petitions.removePetitionPermissions(
          [user0Petitions[0].id, user0Petitions[1].id, user0Petitions[2].id],
          [users[1].id],
          [],
          false,
          users[0],
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
          "User",
          users[0].id,
        );

        await petitions.removePetitionPermissions(
          [user0Petitions[0].id, user0Petitions[1].id, user0Petitions[2].id],
          [100, 123, 234234234, 2],
          [],
          true,
          users[0],
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
          "User",
          users[0].id,
        );

        await petitions.removePetitionPermissions(
          [user0Petitions[0].id, user0Petitions[1].id],
          [users[1].id, users[2].id, users[3].id],
          [],
          false,
          users[0],
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
          "User",
          users[0].id,
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
          "User",
          users[0].id,
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

      afterAll(async () => {
        await mocks.knex.from("petition_field_comment").delete();
        await mocks.knex.from("petition_reminder").delete();
      });

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
          user.id,
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
          await petitions.loadRepliesForField.raw(fields.map((f) => f.id))
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
        const currentFiles = await filesRepo.loadFileUpload.raw(fileUploadIds);
        expect(currentFiles.filter(isNonNullish)).toHaveLength(0);
      });

      it("erases the content of every comment", async () => {
        await Promise.all([
          mocks.createRandomCommentsFromUser(user.id, fields[3].id, petition.id, 2),
          mocks.createRandomCommentsFromUser(user.id, fields[1].id, petition.id, 3),
          mocks.createRandomCommentsFromAccess(accesses[0].id, fields[3].id, petition.id, 2),
        ]);

        await petitions.anonymizePetition(petition.id);

        const commentsAfter = (
          await petitions.loadPetitionFieldCommentsForField.raw(
            fields.map((f) => ({
              petitionFieldId: f.id,
              petitionId: petition.id,
              loadInternalComments: true,
            })),
          )
        ).flat();

        expect(
          commentsAfter.every((c) => c.anonymized_at !== null && c.content_json === null),
        ).toEqual(true);
      });

      it("deactivates every access on the petition", async () => {
        await petitions.anonymizePetition(petition.id);

        const accesses = await petitions.loadAccessesForPetition.raw(petition.id);
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

        expect(messages.every((m) => m.email_body === null && m.anonymized_at !== null)).toEqual(
          true,
        );

        expect(reminders.every((r) => r.email_body === null && r.anonymized_at !== null)).toEqual(
          true,
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
        ).filter(isNonNullish);

        expect(emailLogs.length).toBeGreaterThan(0);
        expect(
          emailLogs.every(
            (e) =>
              e &&
              e.text === "" &&
              e.html === "" &&
              e.to === "" &&
              e.subject === "" &&
              e.anonymized_at !== null,
          ),
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
              s.anonymized_at !== null,
          ),
        ).toEqual(true);

        const signedFileIds = signatures
          .filter((s) => isNonNullish(s.file_upload_id))
          .map((s) => s.id);
        expect(signedFileIds.length).toBeGreaterThan(0);
        const fileUploads = (await filesRepo.loadFileUpload(signedFileIds)).filter(isNonNullish);
        expect(fileUploads).toHaveLength(0);
      });
    });
  });

  describe("getUserPetitionsInsideFolders", () => {
    let orgUser: User;
    let otherOrgUser: User;
    let userPetitions: Petition[];

    beforeAll(async () => {
      [orgUser] = await mocks.createRandomUsers(user.org_id, 1);
      const [otherOrg] = await mocks.createRandomOrganizations(1);
      [otherOrgUser] = await mocks.createRandomUsers(otherOrg.id, 1);
    });

    beforeEach(async () => {
      await mocks.knex.from("petition").update("deleted_at", new Date());

      userPetitions = await mocks.createRandomPetitions(user.org_id, user.id, 5, (i) => ({
        path: ["/", "/common/", "/A/B/C/", "/A/B/C/D/E/", "/templates/"][i],
        is_template: i === 4,
      }));
      await mocks.createRandomPetitions(orgUser.org_id, orgUser.id, 1, () => ({
        path: "/commmon/",
      }));
      await mocks.createRandomPetitions(otherOrgUser.org_id, otherOrgUser.id, 1, () => ({
        path: "/common/",
      }));
    });

    it("gets only the user's petitions on the passed folders", async () => {
      const _petitions = await petitions.getUserPetitionsInsideFolders(
        ["/common/", "/A/B/C/"],
        false,
        user,
      );

      expect(_petitions.map((p) => pick(p, ["id", "path", "is_template"]))).toEqual([
        {
          id: userPetitions[2].id,
          path: "/A/B/C/",
          is_template: false,
        },
        {
          id: userPetitions[3].id,
          path: "/A/B/C/D/E/",
          is_template: false,
        },
        {
          id: userPetitions[1].id,
          path: "/common/",
          is_template: false,
        },
      ]);
    });

    it("gets only PETITION type", async () => {
      const _petitions = await petitions.getUserPetitionsInsideFolders(
        ["/templates/"],
        false,
        user,
      );
      expect(_petitions).toHaveLength(0);
    });

    it("returns only 1 petition if having multiple permissions", async () => {
      const [group] = await mocks.createUserGroups(1, user.org_id);
      await mocks.insertUserGroupMembers(group.id, [user.id]);
      const [petition] = await mocks.createRandomPetitions(user.org_id, user.id, 1, () => ({
        path: "/shared-with-group/",
      }));
      await mocks.sharePetitionWithGroups(petition.id, [group.id]);

      const result = await petitions.getUserPetitionsInsideFolders(
        ["/shared-with-group/"],
        false,
        user,
      );

      expect(result.map((r) => pick(r, ["id", "path"]))).toEqual([
        { id: petition.id, path: "/shared-with-group/" },
      ]);
    });
  });

  describe("createAccessesAndMessages", () => {
    let userPetitions: Petition[];
    let contacts: Contact[];
    let contactIds: number[];

    beforeAll(async () => {
      contacts = await mocks.createRandomContacts(organization.id, 21);
      contactIds = contacts.map((c) => c.id);

      userPetitions = await mocks.createRandomPetitions(organization.id, user.id, 21, () => ({
        name: "Test petition",
      }));
    });

    beforeEach(async () => {
      // truncate tables to reuse petitions and avoid insert conflicts
      await knex.from("petition_message").delete();
      await knex.from("petition_access").delete();
    });

    it("creates accesses and messages for a simple petition send with a few contacts", async () => {
      const petition = userPetitions[0];
      const { error, result, messages, accesses } = await petitions.createAccessesAndMessages(
        petition,
        [contactIds[0], contactIds[1]],
        { body: [], subject: "test" },
        user,
        null,
        false,
      );

      expect(error).toBeUndefined();
      expect(result).toEqual("SUCCESS");
      expect(messages).toHaveLength(2);
      expect(accesses).toHaveLength(2);
      expect(accesses).toMatchObject([
        {
          contact_id: contactIds[0],
          granter_id: user.id,
          next_reminder_at: null,
          petition_id: petition.id,
          reminders_active: false,
          reminders_config: null,
        },
        {
          contact_id: contactIds[1],
          granter_id: user.id,
          next_reminder_at: null,
          petition_id: petition.id,
          reminders_active: false,
          reminders_config: null,
        },
      ]);

      expect(messages).toMatchObject([
        {
          petition_access_id: accesses?.[0].id,
          scheduled_at: null,
          sender_id: user.id,
          status: "PROCESSING",
          petition_id: petition.id,
          email_subject: "test",
          email_body: "[]",
        },
        {
          petition_access_id: accesses?.[1].id,
          scheduled_at: null,
          sender_id: user.id,
          status: "PROCESSING",
          petition_id: petition.id,
          email_subject: "test",
          email_body: "[]",
        },
      ]);
    });

    it("schedule a simple petition send with configured reminders", async () => {
      const petition = userPetitions[0];
      const { error, result, messages, accesses } = await petitions.createAccessesAndMessages(
        petition,
        [contactIds[0]],
        {
          scheduledAt: new Date(Date.UTC(2021, 8, 3)), // 03/09/2021 (month starts at 0)
          remindersConfig: {
            offset: 2,
            time: "11:45",
            weekdaysOnly: false,
            timezone: "Europe/Madrid",
          },
          body: [],
          subject: "test",
        },
        user,
        null,
        true,
      );

      expect(error).toBeUndefined();
      expect(result).toEqual("SUCCESS");
      expect(accesses).toHaveLength(1);
      expect(messages).toHaveLength(1);
      expect(accesses).toMatchObject([
        {
          petition_id: petition.id,
          contact_id: contactIds[0],
          next_reminder_at: toDate("2021-09-05T11:45:00", {
            timeZone: "Europe/Madrid",
          }),

          reminders_active: true,
          reminders_left: 10,
          reminders_config: {
            offset: 2,
            time: "11:45",
            weekdaysOnly: false,
            timezone: "Europe/Madrid",
          },
        },
      ]);

      expect(messages).toMatchObject([
        {
          petition_access_id: accesses?.[0].id,
          sender_id: user.id,
          status: "SCHEDULED",
          scheduled_at: new Date(Date.UTC(2021, 8, 3)),
        },
      ]);
    });
  });

  describe("prefillPetition", () => {
    let petition: Petition;
    let fields: PetitionField[];
    let children: PetitionField[];

    function fieldId(fields: PetitionField[], alias: string) {
      return fields.find((f) => f.alias === alias)!.id;
    }

    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id);

      fields = await mocks.createRandomPetitionFields(
        petition.id,
        PetitionFieldTypeValues.length,
        (i) => ({
          type: PetitionFieldTypeValues[i],
          alias: PetitionFieldTypeValues[i],
        }),
      );

      const childTypes = ["TEXT", "NUMBER", "SHORT_TEXT", "FILE_UPLOAD"] as PetitionFieldType[];

      children = await mocks.createRandomPetitionFields(petition.id, 4, (i) => ({
        multiple: true,
        parent_petition_field_id: fieldId(fields, "FIELD_GROUP"),
        type: childTypes[i],
        alias: `CHILD_${childTypes[i]}`,
        position: i,
      }));

      const selectField = fields.find((f) => f.type === "SELECT")!;
      const checkboxField = fields.find((f) => f.type === "CHECKBOX")!;
      const numberField = fields.find((f) => f.type === "NUMBER")!;
      const shortTextField = fields.find((f) => f.type === "SHORT_TEXT")!;
      const dynamicSelectField = fields.find((f) => f.type === "DYNAMIC_SELECT")!;
      await knex
        .from("petition_field")
        .where("id", selectField.id)
        .update({ options: { values: ["A", "B", "C"] } });
      await knex
        .from("petition_field")
        .where("id", checkboxField.id)
        .update({ options: { values: ["A", "B", "C"], limit: { type: "RADIO", min: 1, max: 1 } } });
      await knex
        .from("petition_field")
        .where("id", numberField.id)
        .update({ options: { range: { min: 10 } } });
      await knex
        .from("petition_field")
        .where("id", shortTextField.id)
        .update({ options: { maxLength: 10 } });
      await knex
        .from("petition_field")
        .where("id", dynamicSelectField.id)
        .update({
          options: {
            file: null,
            labels: ["Comunidad autónoma", "Provincia"],
            values: [
              ["Andalucía", ["Almeria", "Cadiz", "Cordoba", "Sevilla"]],
              ["Aragón", ["Huesca", "Teruel", "Zaragoza"]],
              ["Canarias", ["Fuerteventura", "Gran Canaria", "Lanzarote", "Tenerife"]],
              ["Cataluña", ["Barcelona", "Gerona", "Lérida", "Tarragona"]],
              ["Galicia", ["La Coruña", "Lugo", "Orense", "Pontevedra"]],
            ],
          },
        });
    });

    it("ignores unknown alias", async () => {
      await petitions.prefillPetition(petition.id, { unknown: 123 }, user);
      const replies = (await petitions.loadRepliesForField.raw(fields.map((f) => f.id))).flat();

      expect(replies).toHaveLength(0);
    });

    it("creates single replies for each type of alias-able field", async () => {
      // please, add the new field type to this test if this check fails
      expect(PetitionFieldTypeValues).toHaveLength(18);

      await petitions.prefillPetition(
        petition.id,
        {
          TEXT: "first text reply",
          FILE_UPLOAD: "this should be ignored",
          HEADING: "this should be ignored",
          SELECT: "B",
          DYNAMIC_SELECT: ["Cataluña", "Barcelona"],
          SHORT_TEXT: "12345",
          CHECKBOX: ["A"],
          NUMBER: 200,
          PHONE: "+34000000000",
          DATE: ["2024-05-21"],
          ES_TAX_DOCUMENTS: "this should be ignored",
          DOW_JONES_KYC: "this should be ignored",
          ID_VERIFICATION: "this should be ignored",
          DATE_TIME: {
            datetime: "2023-03-03T03:00",
            timezone: "Europe/Madrid",
          },
          BACKGROUND_CHECK: "this should be ignored",
          PROFILE_SEARCH: "ignore",
          ADVERSE_MEDIA_SEARCH: "ignore",
        },
        user,
      );

      const replies = (await petitions.loadRepliesForField.raw(fields.map((f) => f.id))).flat();

      expect(replies).toHaveLength(9);
      expect(replies.map((r) => pick(r, ["type", "content", "petition_field_id"]))).toEqual([
        {
          type: "TEXT",
          content: { value: "first text reply" },
          petition_field_id: fieldId(fields, "TEXT"),
        },
        { type: "SELECT", content: { value: "B" }, petition_field_id: fieldId(fields, "SELECT") },
        {
          type: "DYNAMIC_SELECT",
          content: {
            value: [
              ["Comunidad autónoma", "Cataluña"],
              ["Provincia", "Barcelona"],
            ],
          },
          petition_field_id: fieldId(fields, "DYNAMIC_SELECT"),
        },
        {
          type: "SHORT_TEXT",
          content: { value: "12345" },
          petition_field_id: fieldId(fields, "SHORT_TEXT"),
        },
        {
          type: "CHECKBOX",
          content: { value: ["A"] },
          petition_field_id: fieldId(fields, "CHECKBOX"),
        },
        { type: "NUMBER", content: { value: 200 }, petition_field_id: fieldId(fields, "NUMBER") },
        {
          type: "PHONE",
          content: { value: "+34000000000" },
          petition_field_id: fieldId(fields, "PHONE"),
        },
        {
          type: "DATE",
          content: { value: "2024-05-21" },
          petition_field_id: fieldId(fields, "DATE"),
        },
        {
          type: "DATE_TIME",
          content: {
            value: "2023-03-03T02:00:00.000Z",
            datetime: "2023-03-03T03:00",
            timezone: "Europe/Madrid",
          },
          petition_field_id: fieldId(fields, "DATE_TIME"),
        },
      ]);
    });

    it("creates multiple replies for each type of alias-able field", async () => {
      // please, add the new field type to this test if this check fails
      expect(PetitionFieldTypeValues).toHaveLength(18);

      await petitions.prefillPetition(
        petition.id,
        {
          TEXT: ["first text reply", "second text reply"],
          FILE_UPLOAD: "this should be ignored",
          HEADING: "this should be ignored",
          SELECT: ["A", "C"],
          DYNAMIC_SELECT: [
            ["Cataluña", "Barcelona"],
            ["Canarias", "Lanzarote"],
          ],
          SHORT_TEXT: ["abcd", "efgh"],
          CHECKBOX: [["A"], ["B"]],
          NUMBER: [100, 200, 300],
          PHONE: ["+34000000000", "+34111111111"],
          DATE: ["2024-05-21", "2011-08-29"],
          ES_TAX_DOCUMENTS: "this should be ignored",
          DOW_JONES_KYC: "this should be ignored",
          ID_VERIFICATION: "this should be ignored",
          DATE_TIME: [
            {
              datetime: "2023-03-03T03:00",
              timezone: "Europe/Madrid",
            },
            {
              datetime: "2023-01-03T02:00",
              timezone: "Europe/Madrid",
            },
          ],
          BACKGROUND_CHECK: "this should be ignored",
          PROFILE_SEARCH: "ignore",
          ADVERSE_MEDIA_SEARCH: "ignore",
        },
        user,
      );

      const replies = (await petitions.loadRepliesForField.raw(fields.map((f) => f.id))).flat();

      expect(replies.map((r) => pick(r, ["type", "content", "petition_field_id"]))).toEqual([
        {
          type: "TEXT",
          content: { value: "first text reply" },
          petition_field_id: fieldId(fields, "TEXT"),
        },
        {
          type: "TEXT",
          content: { value: "second text reply" },
          petition_field_id: fieldId(fields, "TEXT"),
        },
        { type: "SELECT", content: { value: "A" }, petition_field_id: fieldId(fields, "SELECT") },
        { type: "SELECT", content: { value: "C" }, petition_field_id: fieldId(fields, "SELECT") },
        {
          type: "DYNAMIC_SELECT",
          content: {
            value: [
              ["Comunidad autónoma", "Cataluña"],
              ["Provincia", "Barcelona"],
            ],
          },
          petition_field_id: fieldId(fields, "DYNAMIC_SELECT"),
        },
        {
          type: "DYNAMIC_SELECT",
          content: {
            value: [
              ["Comunidad autónoma", "Canarias"],
              ["Provincia", "Lanzarote"],
            ],
          },
          petition_field_id: fieldId(fields, "DYNAMIC_SELECT"),
        },
        {
          type: "SHORT_TEXT",
          content: { value: "abcd" },
          petition_field_id: fieldId(fields, "SHORT_TEXT"),
        },
        {
          type: "SHORT_TEXT",
          content: { value: "efgh" },
          petition_field_id: fieldId(fields, "SHORT_TEXT"),
        },
        {
          type: "CHECKBOX",
          content: { value: ["A"] },
          petition_field_id: fieldId(fields, "CHECKBOX"),
        },
        {
          type: "CHECKBOX",
          content: { value: ["B"] },
          petition_field_id: fieldId(fields, "CHECKBOX"),
        },
        { type: "NUMBER", content: { value: 100 }, petition_field_id: fieldId(fields, "NUMBER") },
        { type: "NUMBER", content: { value: 200 }, petition_field_id: fieldId(fields, "NUMBER") },
        { type: "NUMBER", content: { value: 300 }, petition_field_id: fieldId(fields, "NUMBER") },
        {
          type: "PHONE",
          content: { value: "+34000000000" },
          petition_field_id: fieldId(fields, "PHONE"),
        },
        {
          type: "PHONE",
          content: { value: "+34111111111" },
          petition_field_id: fieldId(fields, "PHONE"),
        },
        {
          type: "DATE",
          content: { value: "2024-05-21" },
          petition_field_id: fieldId(fields, "DATE"),
        },
        {
          type: "DATE",
          content: { value: "2011-08-29" },
          petition_field_id: fieldId(fields, "DATE"),
        },
        {
          type: "DATE_TIME",
          content: {
            value: "2023-03-03T02:00:00.000Z",
            datetime: "2023-03-03T03:00",
            timezone: "Europe/Madrid",
          },
          petition_field_id: fieldId(fields, "DATE_TIME"),
        },
        {
          type: "DATE_TIME",
          content: {
            value: "2023-01-03T01:00:00.000Z",
            datetime: "2023-01-03T02:00",
            timezone: "Europe/Madrid",
          },
          petition_field_id: fieldId(fields, "DATE_TIME"),
        },
      ]);
    });

    it("ignores a reply if it does not match with field options", async () => {
      // please, add the new field type to this test if this check fails
      expect(PetitionFieldTypeValues).toHaveLength(18);

      await petitions.prefillPetition(
        petition.id,
        {
          SELECT: ["unknown option", "C"],
          DYNAMIC_SELECT: ["Buenos Aires", "AMBA"],
          SHORT_TEXT: "this reply exceeds the max length of 10 chars",
          CHECKBOX: ["A", "B", "C"], // options are right, but field has subtype RADIO
          NUMBER: [1, 10],
          DOW_JONES_KYC: "this should be ignored",
          DATE_TIME: {
            datetime: "2023-03-03T03:00",
            timezone: "Europe/Madrid",
          },
          BACKGROUND_CHECK: "this should be ignored",
          ID_VERIFICATION: "this should be ignored",
          PROFILE_SEARCH: "ignore",
          ADVERSE_MEDIA_SEARCH: "ignore",
        },
        user,
      );

      const replies = (await petitions.loadRepliesForField.raw(fields.map((f) => f.id))).flat();

      expect(replies).toHaveLength(3);
      expect(replies.map((r) => pick(r, ["type", "content", "petition_field_id"]))).toEqual([
        { type: "SELECT", content: { value: "C" }, petition_field_id: fieldId(fields, "SELECT") },
        { type: "NUMBER", content: { value: 10 }, petition_field_id: fieldId(fields, "NUMBER") },
        {
          type: "DATE_TIME",
          content: {
            value: "2023-03-03T02:00:00.000Z",
            datetime: "2023-03-03T03:00",
            timezone: "Europe/Madrid",
          },
          petition_field_id: fieldId(fields, "DATE_TIME"),
        },
      ]);
    });

    it("creates empty FIELD_GROUP replies", async () => {
      await petitions.prefillPetition(petition.id, { FIELD_GROUP: [{}, {}] }, user);

      const replies = (await petitions.loadRepliesForField(fieldId(fields, "FIELD_GROUP"))).flat();

      const childReplies = await mocks.knex
        .from("petition_field_reply")
        .where({ deleted_at: null })
        .whereIn(
          "parent_petition_field_reply_id",
          replies.map((r) => r.id),
        );

      expect(replies).toMatchObject([
        {
          type: "FIELD_GROUP",
          content: {},
          petition_field_id: fieldId(fields, "FIELD_GROUP"),
          deleted_at: null,
        },
        {
          type: "FIELD_GROUP",
          content: {},
          petition_field_id: fieldId(fields, "FIELD_GROUP"),
          deleted_at: null,
        },
      ]);
      expect(childReplies).toHaveLength(0);
    });

    it("creates FIELD_GROUP replies with children", async () => {
      await petitions.prefillPetition(
        petition.id,
        {
          FIELD_GROUP: [
            {
              CHILD_TEXT: ["first text reply", "second text reply"],
              CHILD_NUMBER: 100,
            },
            {
              CHILD_TEXT: "reply on second reply group",
              UNKNOWN: "hello!",
            },
            {
              CHILD_TEXT: "text reply",
              CHILD_SHORT_TEXT: "short text reply",
              CHILD_FILE_UPLOAD: "should be ignored",
              CHILD_NUMBER: [1, 2, 3],
            },
          ],
        },
        user,
      );

      const fieldGroupReplies = (
        await petitions.loadRepliesForField(fieldId(fields, "FIELD_GROUP"))
      ).flat();
      expect(fieldGroupReplies).toMatchObject([
        { type: "FIELD_GROUP", content: {} },
        { type: "FIELD_GROUP", content: {} },
        { type: "FIELD_GROUP", content: {} },
      ]);

      const firstGroupReplies = (
        await petitions.loadPetitionFieldGroupChildReplies(
          children.map((child) => ({
            parentPetitionFieldReplyId: fieldGroupReplies[0].id,
            petitionFieldId: child.id,
          })),
        )
      ).flat();

      expect(
        firstGroupReplies.map((r) =>
          pick(r, ["type", "content", "petition_field_id", "parent_petition_field_reply_id"]),
        ),
      ).toIncludeSameMembers([
        {
          type: "TEXT",
          content: { value: "first text reply" },
          petition_field_id: fieldId(children, "CHILD_TEXT"),
          parent_petition_field_reply_id: fieldGroupReplies[0].id,
        },
        {
          type: "TEXT",
          content: { value: "second text reply" },
          petition_field_id: fieldId(children, "CHILD_TEXT"),
          parent_petition_field_reply_id: fieldGroupReplies[0].id,
        },
        {
          type: "NUMBER",
          content: { value: 100 },
          petition_field_id: fieldId(children, "CHILD_NUMBER"),
          parent_petition_field_reply_id: fieldGroupReplies[0].id,
        },
      ]);

      const secondGroupReplies = (
        await petitions.loadPetitionFieldGroupChildReplies(
          children.map((child) => ({
            parentPetitionFieldReplyId: fieldGroupReplies[1].id,
            petitionFieldId: child.id,
          })),
        )
      ).flat();

      expect(
        secondGroupReplies.map((r) =>
          pick(r, ["type", "content", "petition_field_id", "parent_petition_field_reply_id"]),
        ),
      ).toIncludeSameMembers([
        {
          type: "TEXT",
          content: { value: "reply on second reply group" },
          petition_field_id: fieldId(children, "CHILD_TEXT"),
          parent_petition_field_reply_id: fieldGroupReplies[1].id,
        },
      ]);

      const thirdGroupReplies = (
        await petitions.loadPetitionFieldGroupChildReplies(
          children.map((child) => ({
            parentPetitionFieldReplyId: fieldGroupReplies[2].id,
            petitionFieldId: child.id,
          })),
        )
      ).flat();

      expect(
        thirdGroupReplies.map((r) =>
          pick(r, ["type", "content", "petition_field_id", "parent_petition_field_reply_id"]),
        ),
      ).toIncludeSameMembers([
        {
          type: "TEXT",
          content: { value: "text reply" },
          petition_field_id: fieldId(children, "CHILD_TEXT"),
          parent_petition_field_reply_id: fieldGroupReplies[2].id,
        },
        {
          type: "SHORT_TEXT",
          content: { value: "short text reply" },
          petition_field_id: fieldId(children, "CHILD_SHORT_TEXT"),
          parent_petition_field_reply_id: fieldGroupReplies[2].id,
        },
        {
          type: "NUMBER",
          content: { value: 1 },
          petition_field_id: fieldId(children, "CHILD_NUMBER"),
          parent_petition_field_reply_id: fieldGroupReplies[2].id,
        },
        {
          type: "NUMBER",
          content: { value: 2 },
          petition_field_id: fieldId(children, "CHILD_NUMBER"),
          parent_petition_field_reply_id: fieldGroupReplies[2].id,
        },
        {
          type: "NUMBER",
          content: { value: 3 },
          petition_field_id: fieldId(children, "CHILD_NUMBER"),
          parent_petition_field_reply_id: fieldGroupReplies[2].id,
        },
      ]);
    });

    it("uses empty FIELD_GROUP replies instead of creating new ones", async () => {
      const emptyFieldGroupReplies = await mocks.createFieldGroupReply(
        fieldId(fields, "FIELD_GROUP"),
        undefined,
        2,
        () => ({
          user_id: user.id,
        }),
      );

      await petitions.prefillPetition(
        petition.id,
        {
          FIELD_GROUP: [
            { CHILD_TEXT: "hello!", CHILD_NUMBER: 123 },
            { CHILD_NUMBER: 1000 },
            { CHILD_SHORT_TEXT: "short text reply" },
          ],
        },
        user,
      );

      const replies = await petitions.loadRepliesForField(fieldId(fields, "FIELD_GROUP"));

      expect(replies).toMatchObject([
        { id: emptyFieldGroupReplies[0].id }, // previously created empty reply
        { id: emptyFieldGroupReplies[1].id }, // previously created empty reply
        { id: expect.any(Number) }, // new empty reply created on prefill
      ]);

      const childReplies = await mocks.knex
        .from("petition_field_reply")
        .where({ deleted_at: null })
        .whereIn(
          "parent_petition_field_reply_id",
          replies.map((r) => r.id),
        );

      expect(
        childReplies.map((r) =>
          pick(r, ["type", "content", "petition_field_id", "parent_petition_field_reply_id"]),
        ),
      ).toIncludeSameMembers([
        {
          type: "TEXT",
          content: { value: "hello!" },
          petition_field_id: fieldId(children, "CHILD_TEXT"),
          parent_petition_field_reply_id: emptyFieldGroupReplies[0].id,
        },
        {
          type: "NUMBER",
          content: { value: 123 },
          petition_field_id: fieldId(children, "CHILD_NUMBER"),
          parent_petition_field_reply_id: emptyFieldGroupReplies[0].id,
        },
        {
          type: "NUMBER",
          content: { value: 1000 },
          petition_field_id: fieldId(children, "CHILD_NUMBER"),
          parent_petition_field_reply_id: emptyFieldGroupReplies[1].id,
        },
        {
          type: "SHORT_TEXT",
          content: { value: "short text reply" },
          petition_field_id: fieldId(children, "CHILD_SHORT_TEXT"),
          parent_petition_field_reply_id: expect.any(Number),
        },
      ]);
    });
  });

  describe("loadPetitionProgress", () => {
    it("loads the progress of the petition", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const [textField] = await mocks.createRandomPetitionFields(petition.id, 4, (i) => ({
        type: "TEXT",
        is_internal: i === 0,
        optional: i === 3,
      }));

      await mocks.createRandomTextReply(textField.id, undefined, 1, () => ({ user_id: user.id }));

      const progress = await petitions.loadPetitionProgress(petition.id);
      expect(progress).toMatchObject({
        external: {
          approved: 0,
          replied: 0,
          optional: 1,
          total: 3,
        },
        internal: {
          approved: 0,
          replied: 1,
          optional: 0,
          total: 1,
        },
      });
    });

    it("ignores incomplete uploads", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const fields = await mocks.createRandomPetitionFields(petition.id, 4, (i) => ({
        type: "FILE_UPLOAD",
        is_internal: i === 0,
        optional: i === 3,
      }));

      await mocks.createRandomFileUploadReply(
        fields[0].id,
        undefined,
        1,
        () => ({ user_id: user.id }),
        () => ({ upload_complete: false }),
      );

      await mocks.createRandomFileUploadReply(
        fields[1].id,
        undefined,
        1,
        () => ({ user_id: user.id }),
        () => ({ upload_complete: false }),
      );

      await mocks.createRandomFileUploadReply(
        fields[2].id,
        undefined,
        1,
        () => ({ user_id: user.id }),
        () => ({ upload_complete: true }),
      );

      const progress = await petitions.loadPetitionProgress(petition.id);
      expect(progress).toMatchObject({
        external: {
          approved: 0,
          replied: 1,
          optional: 1,
          total: 3,
        },
        internal: {
          approved: 0,
          replied: 0,
          optional: 0,
          total: 1,
        },
      });
    });
  });

  describe("getPetitionFieldsWithReplies", () => {
    let petition: Petition;

    let heading: PetitionField;
    let shortText: PetitionField;
    let number: PetitionField;
    let phone: PetitionField;
    let date: PetitionField;
    let fileUpload: PetitionField;
    let bankflip: PetitionField;
    let bankflipWithError: PetitionField;
    let fieldGroup: PetitionField;
    let fieldGroupChildren: PetitionField[];

    let fieldGroupReplies: PetitionFieldReply[];
    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);

      [
        heading,
        shortText,
        number,
        phone,
        date,
        fileUpload,
        bankflip,
        bankflipWithError,
        fieldGroup,
      ] = await mocks.createRandomPetitionFields(petition.id, 9, (i) => ({
        type: [
          "HEADING",
          "SHORT_TEXT",
          "NUMBER",
          "PHONE",
          "DATE",
          "FILE_UPLOAD",
          "ES_TAX_DOCUMENTS",
          "ES_TAX_DOCUMENTS",
          "FIELD_GROUP",
        ][i] as PetitionFieldType,
      }));

      fieldGroupChildren = await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
        type: ["TEXT", "PHONE"][i] as PetitionFieldType,
        position: i,
        parent_petition_field_id: fieldGroup.id,
      }));

      await mocks.createRandomTextReply(shortText.id, undefined, 2, () => ({
        user_id: user.id,
        type: "SHORT_TEXT",
      }));
      await mocks.createRandomNumberReply(number.id, undefined, 1, () => ({ user_id: user.id }));
      await mocks.createRandomPhoneReply(phone.id, undefined, 1, () => ({ user_id: user.id }));
      await mocks.createRandomDateReply(date.id, undefined, 1, () => ({ user_id: user.id }));
      await mocks.createRandomFileUploadReply(fileUpload.id, undefined, 2, () => ({
        user_id: user.id,
      }));
      await mocks.createRandomEsTaxDocumentsReply(bankflip.id, undefined, 1, () => ({
        user_id: user.id,
      }));
      await mocks.createRandomEsTaxDocumentsReply(bankflipWithError.id, undefined, 2, (i) => ({
        user_id: user.id,
        ...(i === 0
          ? {
              content: {
                file_upload_id: null,
                request: { model: { type: "AEAT_IRPF_DATOS_FISCALES" } },
                error: [{ reason: "test" }],
                bankflip_session_id: random(16),
              },
            }
          : {}),
      }));

      fieldGroupReplies = await mocks.createFieldGroupReply(fieldGroup.id, undefined, 2, () => ({
        user_id: user.id,
      }));

      await mocks.createRandomTextReply(fieldGroupChildren[0].id, undefined, 1, () => ({
        parent_petition_field_reply_id: fieldGroupReplies[0].id,
        user_id: user.id,
      }));

      await mocks.createRandomPhoneReply(fieldGroupChildren[1].id, undefined, 1, () => ({
        parent_petition_field_reply_id: fieldGroupReplies[0].id,
        user_id: user.id,
      }));
    });

    it("returns a list of fields with replies", async () => {
      const [fields] = await petitions.getPetitionFieldsWithReplies([petition.id]);

      expect(
        fields.map((f) => ({
          ...pick(f, [
            "id",
            "petition_id",
            "position",
            "type",
            "title",
            "description",
            "options",
            "from_petition_field_id",
            "is_internal",
            "visibility",
            "math",
            "optional",
            "parent_petition_field_id",
            "alias",
            "multiple",
          ]),
          replies: f.replies.map(
            pick([
              "id",
              "type",
              "petition_field_id",
              "content",
              "status",
              "anonymized_at",
              "parent_petition_field_reply_id",
            ]),
          ),
        })),
      ).toIncludeSameMembers([
        {
          id: heading.id,
          petition_id: petition.id,
          position: 0,
          type: "HEADING",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [],
        },
        {
          id: shortText.id,
          petition_id: petition.id,
          position: 1,
          type: "SHORT_TEXT",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "SHORT_TEXT",
              petition_field_id: shortText.id,
              content: { value: expect.any(String) },
              status: "PENDING",
              anonymized_at: null,
              parent_petition_field_reply_id: null,
            },
            {
              id: expect.any(Number),
              type: "SHORT_TEXT",
              petition_field_id: shortText.id,
              content: { value: expect.any(String) },
              status: "PENDING",
              anonymized_at: null,
              parent_petition_field_reply_id: null,
            },
          ],
        },
        {
          id: number.id,
          petition_id: petition.id,
          position: 2,
          type: "NUMBER",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "NUMBER",
              petition_field_id: number.id,
              content: { value: expect.any(Number) },
              status: "PENDING",
              anonymized_at: null,
              parent_petition_field_reply_id: null,
            },
          ],
        },
        {
          id: phone.id,
          petition_id: petition.id,
          position: 3,
          type: "PHONE",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "PHONE",
              petition_field_id: phone.id,
              content: { value: expect.any(String) },
              status: "PENDING",
              anonymized_at: null,
              parent_petition_field_reply_id: null,
            },
          ],
        },
        {
          id: date.id,
          petition_id: petition.id,
          position: 4,
          type: "DATE",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "DATE",
              petition_field_id: date.id,
              content: { value: expect.any(String) },
              status: "PENDING",
              anonymized_at: null,
              parent_petition_field_reply_id: null,
            },
          ],
        },
        {
          id: fileUpload.id,
          petition_id: petition.id,
          position: 5,
          type: "FILE_UPLOAD",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "FILE_UPLOAD",
              petition_field_id: fileUpload.id,
              content: {
                file_upload_id: expect.any(Number),
              },
              status: "PENDING",
              anonymized_at: null,
              parent_petition_field_reply_id: null,
            },
            {
              id: expect.any(Number),
              type: "FILE_UPLOAD",
              petition_field_id: fileUpload.id,
              content: {
                file_upload_id: expect.any(Number),
              },
              status: "PENDING",
              anonymized_at: null,
              parent_petition_field_reply_id: null,
            },
          ],
        },
        {
          id: bankflip.id,
          petition_id: petition.id,
          position: 6,
          type: "ES_TAX_DOCUMENTS",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "ES_TAX_DOCUMENTS",
              petition_field_id: bankflip.id,
              content: {
                file_upload_id: expect.any(Number),
                bankflip_session_id: expect.any(String),
                request: { model: { type: "AEAT_IRPF_DATOS_FISCALES" } },
                json_contents: {},
              },
              status: "PENDING",
              anonymized_at: null,
              parent_petition_field_reply_id: null,
            },
          ],
        },
        {
          id: bankflipWithError.id,
          petition_id: petition.id,
          position: 7,
          type: "ES_TAX_DOCUMENTS",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "ES_TAX_DOCUMENTS",
              petition_field_id: bankflipWithError.id,
              content: {
                file_upload_id: expect.any(Number),
                bankflip_session_id: expect.any(String),
                request: { model: { type: "AEAT_IRPF_DATOS_FISCALES" } },
                json_contents: {},
              },
              status: "PENDING",
              anonymized_at: null,
              parent_petition_field_reply_id: null,
            },
          ],
        },
        {
          id: fieldGroup.id,
          petition_id: petition.id,
          position: 8,
          type: "FIELD_GROUP",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "FIELD_GROUP",
              petition_field_id: fieldGroup.id,
              content: {},
              status: "PENDING",
              anonymized_at: null,
              parent_petition_field_reply_id: null,
            },
            {
              id: expect.any(Number),
              type: "FIELD_GROUP",
              petition_field_id: fieldGroup.id,
              content: {},
              status: "PENDING",
              anonymized_at: null,
              parent_petition_field_reply_id: null,
            },
          ],
        },
        {
          id: fieldGroupChildren[0].id,
          petition_id: petition.id,
          position: 0,
          type: "TEXT",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: fieldGroup.id,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "TEXT",
              petition_field_id: fieldGroupChildren[0].id,
              content: { value: expect.any(String) },
              status: "PENDING",
              anonymized_at: null,
              parent_petition_field_reply_id: fieldGroupReplies[0].id,
            },
          ],
        },
        {
          id: fieldGroupChildren[1].id,
          petition_id: petition.id,
          position: 1,
          type: "PHONE",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: fieldGroup.id,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "PHONE",
              petition_field_id: fieldGroupChildren[1].id,
              content: { value: expect.any(String) },
              status: "PENDING",
              anonymized_at: null,
              parent_petition_field_reply_id: fieldGroupReplies[0].id,
            },
          ],
        },
      ]);
    });

    it("returns a list of fields with replies on anonymized petition", async () => {
      await petitions.anonymizePetition(petition.id);

      const [fields] = await petitions.getPetitionFieldsWithReplies([petition.id]);

      expect(
        fields.map((f) => ({
          ...pick(f, [
            "id",
            "petition_id",
            "position",
            "type",
            "title",
            "description",
            "options",
            "from_petition_field_id",
            "is_internal",
            "visibility",
            "math",
            "optional",
            "parent_petition_field_id",
            "alias",
            "multiple",
          ]),
          replies: f.replies.map(
            pick([
              "id",
              "type",
              "petition_field_id",
              "content",
              "status",
              "anonymized_at",
              "parent_petition_field_reply_id",
            ]),
          ),
        })),
      ).toIncludeSameMembers([
        {
          id: heading.id,
          petition_id: petition.id,
          position: 0,
          type: "HEADING",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [],
        },
        {
          id: shortText.id,
          petition_id: petition.id,
          position: 1,
          type: "SHORT_TEXT",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "SHORT_TEXT",
              petition_field_id: shortText.id,
              content: { value: null },
              status: "PENDING",
              anonymized_at: expect.any(String),
              parent_petition_field_reply_id: null,
            },
            {
              id: expect.any(Number),
              type: "SHORT_TEXT",
              petition_field_id: shortText.id,
              content: { value: null },
              status: "PENDING",
              anonymized_at: expect.any(String),
              parent_petition_field_reply_id: null,
            },
          ],
        },
        {
          id: number.id,
          petition_id: petition.id,
          position: 2,
          type: "NUMBER",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "NUMBER",
              petition_field_id: number.id,
              content: { value: null },
              status: "PENDING",
              anonymized_at: expect.any(String),
              parent_petition_field_reply_id: null,
            },
          ],
        },
        {
          id: phone.id,
          petition_id: petition.id,
          position: 3,
          type: "PHONE",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "PHONE",
              petition_field_id: phone.id,
              content: { value: null },
              status: "PENDING",
              anonymized_at: expect.any(String),
              parent_petition_field_reply_id: null,
            },
          ],
        },
        {
          id: date.id,
          petition_id: petition.id,
          position: 4,
          type: "DATE",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "DATE",
              petition_field_id: date.id,
              content: { value: null },
              status: "PENDING",
              anonymized_at: expect.any(String),
              parent_petition_field_reply_id: null,
            },
          ],
        },
        {
          id: fileUpload.id,
          petition_id: petition.id,
          position: 5,
          type: "FILE_UPLOAD",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [],
        },
        {
          id: bankflip.id,
          petition_id: petition.id,
          position: 6,
          type: "ES_TAX_DOCUMENTS",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [],
        },
        {
          id: bankflipWithError.id,
          petition_id: petition.id,
          position: 7,
          type: "ES_TAX_DOCUMENTS",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [],
        },
        {
          id: fieldGroup.id,
          petition_id: petition.id,
          position: 8,
          type: "FIELD_GROUP",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: null,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "FIELD_GROUP",
              petition_field_id: fieldGroup.id,
              content: {},
              status: "PENDING",
              anonymized_at: expect.any(String),
              parent_petition_field_reply_id: null,
            },
            {
              id: expect.any(Number),
              type: "FIELD_GROUP",
              petition_field_id: fieldGroup.id,
              content: {},
              status: "PENDING",
              anonymized_at: expect.any(String),
              parent_petition_field_reply_id: null,
            },
          ],
        },
        {
          id: fieldGroupChildren[0].id,
          petition_id: petition.id,
          position: 0,
          type: "TEXT",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: fieldGroup.id,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "TEXT",
              petition_field_id: fieldGroupChildren[0].id,
              content: { value: null },
              status: "PENDING",
              anonymized_at: expect.any(String),
              parent_petition_field_reply_id: fieldGroupReplies[0].id,
            },
          ],
        },
        {
          id: fieldGroupChildren[1].id,
          petition_id: petition.id,
          position: 1,
          type: "PHONE",
          title: expect.any(String),
          description: null,
          options: expect.any(Object),
          from_petition_field_id: null,
          is_internal: false,
          visibility: null,
          math: null,
          optional: false,
          parent_petition_field_id: fieldGroup.id,
          alias: null,
          multiple: true,
          replies: [
            {
              id: expect.any(Number),
              type: "PHONE",
              petition_field_id: fieldGroupChildren[1].id,
              content: { value: null },
              status: "PENDING",
              anonymized_at: expect.any(String),
              parent_petition_field_reply_id: fieldGroupReplies[0].id,
            },
          ],
        },
      ]);
    });
  });

  describe("clonePetition", () => {
    let profileTypes: ProfileType[];
    let individualPtfs: ProfileTypeField[];
    let profileRelationshipTypes: ProfileRelationshipType[];

    beforeAll(async () => {
      await profilesSetup.createDefaultProfileTypes(organization.id, `User:${user.id}`);
      await profilesSetup.createDefaultProfileRelationshipTypes(organization.id, `User:${user.id}`);

      profileTypes = await mocks.knex
        .from("profile_type")
        .where({ org_id: organization.id, deleted_at: null })
        .select("*");
      profileRelationshipTypes = await mocks.knex
        .from("profile_relationship_type")
        .where({ org_id: organization.id, deleted_at: null })
        .select("*");

      const individualPt = profileTypes.find((pt) => pt.standard_type === "INDIVIDUAL")!;

      individualPtfs = await mocks.knex
        .from("profile_type_field")
        .where({ profile_type_id: individualPt.id, deleted_at: null })
        .select("*");
    });

    it("copies petition field group relationships when cloning a petition or template", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const fields = await mocks.createRandomPetitionFields(petition.id, 3, () => ({
        type: "FIELD_GROUP",
      }));
      const relationships = await mocks.knex
        .from("profile_relationship_type")
        .where({ org_id: organization.id, deleted_at: null })
        .select("*");

      const parentChildRelationship = relationships.find((r) => r.alias === "p_parent__child")!;
      const contractCounterpartyRelationship = relationships.find(
        (r) => r.alias === "p_contract__counterparty",
      )!;

      await mocks.knex.from("petition_field_group_relationship").insert([
        {
          petition_id: petition.id,
          left_side_petition_field_id: fields[0].id,
          right_side_petition_field_id: fields[1].id,
          profile_relationship_type_id: parentChildRelationship.id,
          direction: "LEFT_RIGHT",
        },
        {
          petition_id: petition.id,
          left_side_petition_field_id: fields[2].id,
          right_side_petition_field_id: fields[1].id,
          profile_relationship_type_id: contractCounterpartyRelationship.id,
          direction: "LEFT_RIGHT",
        },
      ]);

      const clonedPetition = await petitions.clonePetition(petition.id, user);
      const clonedFields = await mocks.knex
        .from("petition_field")
        .where({ petition_id: clonedPetition.id, deleted_at: null })
        .select("*");

      const fieldIdsMap = fields.reduce(
        (acc, field) => {
          acc[field.id] = clonedFields.find((f) => f.position === field.position)!.id;
          return acc;
        },
        {} as Record<string, number>,
      );

      const clonedFieldGroupRelationships = await mocks.knex
        .from("petition_field_group_relationship")
        .where({ petition_id: clonedPetition.id, deleted_at: null })
        .select("*");

      expect(
        clonedFieldGroupRelationships.map(
          pick([
            "petition_id",
            "left_side_petition_field_id",
            "right_side_petition_field_id",
            "profile_relationship_type_id",
          ]),
        ),
      ).toIncludeSameMembers([
        {
          petition_id: clonedPetition.id,
          left_side_petition_field_id: fieldIdsMap[fields[0].id],
          right_side_petition_field_id: fieldIdsMap[fields[1].id],
          profile_relationship_type_id: parentChildRelationship.id,
        },
        {
          petition_id: clonedPetition.id,
          left_side_petition_field_id: fieldIdsMap[fields[2].id],
          right_side_petition_field_id: fieldIdsMap[fields[1].id],
          profile_relationship_type_id: contractCounterpartyRelationship.id,
        },
      ]);
    });

    it("creates a petition from a template using custom lists in visibility conditions", async () => {
      const [template] = await mocks.createRandomTemplates(organization.id, user.id, 1, () => ({
        custom_lists: JSON.stringify([
          {
            name: "Países de la UE",
            values: ["AT", "BE", "BG"],
          },
        ]),
      }));

      const [selectField] = await mocks.createRandomPetitionFields(template.id, 1, () => ({
        type: "SELECT",
        options: JSON.stringify({ values: ["AR", "BE", "BG", "FR", "DE", "IT", "ES", "SE"] }),
      }));

      await mocks.createRandomPetitionFields(template.id, 1, () => ({
        type: "HEADING",
        visibility: JSON.stringify({
          type: "SHOW",
          operator: "OR",
          conditions: [
            {
              value: "Países de la UE",
              fieldId: selectField.id,
              modifier: "ANY",
              operator: "IS_IN_LIST",
            },
          ],
        }),
      }));

      await expect(
        petitions.clonePetition(template.id, user, { is_template: false, status: "DRAFT" }),
      ).resolves.not.toThrow();
    });

    it("correctly updates referenced profile types and field ids on a PROFILE_SEARCH field when cloning a public template from another org", async () => {
      const [otherOrg] = await mocks.createRandomOrganizations(1);
      const [otherUser] = await mocks.createRandomUsers(otherOrg.id, 1);

      await profilesSetup.createDefaultProfileTypes(otherOrg.id, `User:${otherUser.id}`);

      const [individualPt] = await mocks.knex
        .from("profile_type")
        .where({
          org_id: otherOrg.id,
          standard_type: "INDIVIDUAL",
        })
        .select("*");

      const [individualPtField] = await mocks.knex
        .from("profile_type_field")
        .where({
          profile_type_id: individualPt.id,
          alias: "p_last_name",
        })
        .select("*");

      const [template] = await mocks.createRandomTemplates(otherOrg.id, otherUser.id, 1, () => ({
        template_public: true,
      }));

      await mocks.createRandomPetitionFields(template.id, 1, () => ({
        type: "PROFILE_SEARCH",
        options: JSON.stringify({
          searchIn: [
            {
              profileTypeId: individualPt.id,
              profileTypeFieldIds: [individualPtField.id],
            },
          ],
        }),
      }));

      const cloned = await petitions.clonePetition(template.id, user, {
        is_template: false,
        status: "DRAFT",
      });

      const clonedFields = await mocks.knex
        .from("petition_field")
        .where({ petition_id: cloned.id, deleted_at: null })
        .select("id", "type", "options");

      expect(clonedFields).toIncludeSameMembers([
        {
          id: expect.any(Number),
          type: "PROFILE_SEARCH",
          options: {
            searchIn: [
              {
                profileTypeId: profileTypes.find((pt) => pt.standard_type === "INDIVIDUAL")!.id,
                profileTypeFieldIds: [
                  individualPtfs.find((ptf) => ptf.alias === "p_last_name")!.id,
                ],
              },
            ],
          },
        },
      ]);
    });

    it("correctly updates referenced field ids on a BACKGROUND_CHECK field with autoSearchConfig", async () => {
      const [template] = await mocks.createRandomTemplates(organization.id, user.id, 1, () => ({
        template_public: true,
      }));

      const [shortText, date, select] = await mocks.createRandomPetitionFields(
        template.id,
        3,
        (i) => ({
          type: ["SHORT_TEXT", "DATE", "SELECT"][i] as PetitionFieldType,
          options: i === 2 ? { standardList: "COUNTRIES" } : {},
        }),
      );

      await mocks.createRandomPetitionFields(template.id, 1, () => ({
        type: "BACKGROUND_CHECK",
        options: JSON.stringify({
          autoSearchConfig: {
            type: "PERSON",
            name: [shortText.id],
            date: date.id,
            country: select.id,
          },
        }),
      }));

      const cloned = await petitions.clonePetition(template.id, user, {
        is_template: false,
        status: "DRAFT",
      });
      const clonedFields = await mocks.knex
        .from("petition_field")
        .where({ petition_id: cloned.id, deleted_at: null })
        .select("id", "type", "options");

      expect(clonedFields).toIncludeSameMembers([
        {
          id: expect.any(Number),
          type: "SHORT_TEXT",
          options: {},
        },
        {
          id: expect.any(Number),
          type: "DATE",
          options: {},
        },
        {
          id: expect.any(Number),
          type: "SELECT",
          options: {
            standardList: "COUNTRIES",
          },
        },
        {
          id: expect.any(Number),
          type: "BACKGROUND_CHECK",
          options: {
            autoSearchConfig: {
              type: "PERSON",
              name: [clonedFields.find((f) => f.type === "SHORT_TEXT")!.id],
              date: clonedFields.find((f) => f.type === "DATE")!.id,
              country: clonedFields.find((f) => f.type === "SELECT")!.id,
            },
          },
        },
      ]);
    });

    it("correctly updates field groups linked to standard profile types when cloning a public template from another org", async () => {
      const [otherOrg] = await mocks.createRandomOrganizations(1);
      const [otherUser] = await mocks.createRandomUsers(otherOrg.id, 1);

      await profilesSetup.createDefaultProfileTypes(otherOrg.id, `User:${otherUser.id}`);
      await profilesSetup.createDefaultProfileRelationshipTypes(
        otherOrg.id,
        `User:${otherUser.id}`,
      );

      const otherOrgPts = await mocks.knex
        .from("profile_type")
        .where({ org_id: otherOrg.id, deleted_at: null })
        .select("*");

      const otherOrgPrts = await mocks.knex
        .from("profile_relationship_type")
        .where({ org_id: otherOrg.id, deleted_at: null })
        .select("*");

      const [publicTemplate] = await mocks.createRandomTemplates(
        otherOrg.id,
        otherUser.id,
        1,
        () => ({ template_public: true }),
      );

      const ptIndividual = otherOrgPts.find((pt) => pt.standard_type === "INDIVIDUAL")!;
      const ptCompany = otherOrgPts.find((pt) => pt.standard_type === "LEGAL_ENTITY")!;
      const ptContract = otherOrgPts.find((pt) => pt.standard_type === "CONTRACT")!;

      const [individuals, companies, contracts] = await mocks.createRandomPetitionFields(
        publicTemplate.id,
        3,
        (i) => ({
          type: "FIELD_GROUP",
          multiple: true,
          profile_type_id: [ptIndividual.id, ptCompany.id, ptContract.id][i],
        }),
      );

      const otherOrgFamilyMember = otherOrgPrts.find((prt) => prt.alias === "p_family_member")!;
      const otherOrgDirector = otherOrgPrts.find((prt) => prt.alias === "p_director__managed_by")!;
      const otherOrgMainContract = otherOrgPrts.find(
        (prt) => prt.alias === "p_main_contract__annex",
      )!;

      await mocks.knex.from("petition_field_group_relationship").insert([
        {
          petition_id: publicTemplate.id,
          left_side_petition_field_id: individuals.id,
          right_side_petition_field_id: individuals.id,
          profile_relationship_type_id: otherOrgFamilyMember.id,
          direction: "LEFT_RIGHT",
        },
        {
          petition_id: publicTemplate.id,
          left_side_petition_field_id: individuals.id,
          right_side_petition_field_id: companies.id,
          profile_relationship_type_id: otherOrgDirector.id,
          direction: "LEFT_RIGHT",
        },
        {
          petition_id: publicTemplate.id,
          left_side_petition_field_id: contracts.id,
          right_side_petition_field_id: contracts.id,
          profile_relationship_type_id: otherOrgMainContract.id,
          direction: "LEFT_RIGHT",
        },
      ]);

      const cloned = await petitions.clonePetition(publicTemplate.id, user, {
        is_template: false,
        status: "DRAFT",
      });

      const clonedFields: Pick<PetitionField, "id" | "type" | "profile_type_id">[] =
        await mocks.knex
          .from("petition_field")
          .where({ petition_id: cloned.id, deleted_at: null })
          .select("id", "type", "profile_type_id");

      expect(clonedFields).toIncludeSameMembers([
        {
          id: expect.any(Number),
          type: "FIELD_GROUP",
          profile_type_id: profileTypes.find((pt) => pt.standard_type === "INDIVIDUAL")!.id,
        },
        {
          id: expect.any(Number),
          type: "FIELD_GROUP",
          profile_type_id: profileTypes.find((pt) => pt.standard_type === "LEGAL_ENTITY")!.id,
        },
        {
          id: expect.any(Number),
          type: "FIELD_GROUP",
          profile_type_id: profileTypes.find((pt) => pt.standard_type === "CONTRACT")!.id,
        },
      ]);

      const clonedIndividuals = clonedFields.find(
        (f) =>
          f.profile_type_id === profileTypes.find((pt) => pt.standard_type === "INDIVIDUAL")!.id,
      )!;

      const clonedCompanies = clonedFields.find(
        (f) =>
          f.profile_type_id === profileTypes.find((pt) => pt.standard_type === "LEGAL_ENTITY")!.id,
      )!;

      const clonedContracts = clonedFields.find(
        (f) => f.profile_type_id === profileTypes.find((pt) => pt.standard_type === "CONTRACT")!.id,
      )!;

      const familyMember = profileRelationshipTypes.find((prt) => prt.alias === "p_family_member")!;
      const director = profileRelationshipTypes.find(
        (prt) => prt.alias === "p_director__managed_by",
      )!;
      const mainContract = profileRelationshipTypes.find(
        (prt) => prt.alias === "p_main_contract__annex",
      )!;

      const clonedFieldGroupRelationships = await mocks.knex
        .from("petition_field_group_relationship")
        .where({ petition_id: cloned.id, deleted_at: null })
        .select(
          "petition_id",
          "left_side_petition_field_id",
          "right_side_petition_field_id",
          "profile_relationship_type_id",
        );

      expect(clonedFieldGroupRelationships).toIncludeSameMembers([
        {
          petition_id: cloned.id,
          left_side_petition_field_id: clonedIndividuals.id,
          right_side_petition_field_id: clonedIndividuals.id,
          profile_relationship_type_id: familyMember.id,
        },
        {
          petition_id: cloned.id,
          left_side_petition_field_id: clonedIndividuals.id,
          right_side_petition_field_id: clonedCompanies.id,
          profile_relationship_type_id: director.id,
        },
        {
          petition_id: cloned.id,
          left_side_petition_field_id: clonedContracts.id,
          right_side_petition_field_id: clonedContracts.id,
          profile_relationship_type_id: mainContract.id,
        },
      ]);
    });

    it("unlinks field groups linked to non-standard profile types when cloning a public template from another org", async () => {
      const [otherOrg] = await mocks.createRandomOrganizations(1);
      const [otherUser] = await mocks.createRandomUsers(otherOrg.id, 1);

      const [nonStandardPt] = await mocks.createRandomProfileTypes(otherOrg.id, 1);

      const [publicTemplate] = await mocks.createRandomTemplates(
        otherOrg.id,
        otherUser.id,
        1,
        () => ({ template_public: true }),
      );

      await mocks.createRandomPetitionFields(publicTemplate.id, 1, (i) => ({
        type: "FIELD_GROUP",
        multiple: true,
        profile_type_id: nonStandardPt.id,
      }));

      const cloned = await petitions.clonePetition(publicTemplate.id, user, {
        is_template: false,
        status: "DRAFT",
      });

      const clonedFields: Pick<PetitionField, "id" | "type" | "profile_type_id">[] =
        await mocks.knex
          .from("petition_field")
          .where({ petition_id: cloned.id, deleted_at: null })
          .select("id", "type", "profile_type_id");

      expect(clonedFields).toIncludeSameMembers([
        {
          id: expect.any(Number),
          type: "FIELD_GROUP",
          profile_type_id: null,
        },
      ]);
    });
  });
});

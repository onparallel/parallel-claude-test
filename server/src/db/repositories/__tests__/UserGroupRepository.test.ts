import { Container } from "inversify";
import { Knex } from "knex";
import { pick } from "remeda";
import { createTestContainer } from "../../../../test/testContainer";
import { deleteAllData } from "../../../util/knexUtils";
import { Organization, Petition, User, UserGroup } from "../../__types";
import { KNEX } from "../../knex";
import { PetitionRepository } from "../PetitionRepository";
import { UserGroupRepository } from "../UserGroupRepository";
import { Mocks } from "./mocks";

describe("repositories/UserGroupRepository", () => {
  let container: Container;
  let knex: Knex;
  let mocks: Mocks;
  let userGroupsRepo: UserGroupRepository;
  let petitionsRepo: PetitionRepository;

  let organization: Organization;
  let users: User[];
  let userGroups: UserGroup[];
  let petition: Petition;

  beforeAll(async () => {
    container = createTestContainer();
    knex = container.get<Knex>(KNEX);
    userGroupsRepo = container.get(UserGroupRepository);
    petitionsRepo = container.get(PetitionRepository);
    mocks = new Mocks(knex);
    [organization] = await mocks.createRandomOrganizations(1);

    users = await mocks.createRandomUsers(organization.id, 6);
    userGroups = await mocks.createUserGroups(2, organization.id);
    [petition] = await mocks.createRandomPetitions(organization.id, users[0].id, 1);
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  beforeEach(async () => {
    await mocks.insertUserGroupMembers(userGroups[0].id, [
      users[0].id,
      users[1].id,
      users[2].id,
      users[3].id,
    ]);
    await mocks.insertUserGroupMembers(userGroups[1].id, [
      users[2].id,
      users[3].id,
      users[4].id,
      users[5].id,
    ]);
  });

  afterEach(async () => {
    await mocks.knex.from("user_group_member").delete();
    await mocks.knex
      .from("petition_permission")
      .where("petition_id", petition.id)
      .whereNot("type", "OWNER")
      .delete();
    userGroupsRepo.loadUserGroupMembers.dataloader.clearAll();
  });

  describe("addUserGroupMemberPermissions", () => {
    it("should create petition_permission when adding a member to a group that has a petition_permission", async () => {
      await petitionsRepo.addPetitionPermissions(
        [petition.id],
        [
          {
            type: "UserGroup",
            id: userGroups[1].id,
            permissionType: "READ",
            isSubscribed: true,
          },
        ],
        "User",
        users[0].id,
      );
      expect(
        (await petitionsRepo.loadUserPermissionsByPetitionId.raw(petition.id)).map(
          pick(["user_id", "type", "user_group_id", "from_user_group_id", "is_subscribed"]),
        ),
      ).toIncludeSameMembers([
        {
          user_id: users[0].id,
          type: "OWNER",
          user_group_id: null,
          from_user_group_id: null,
          is_subscribed: true,
        },
        ...[users[2].id, users[3].id, users[4].id, users[5].id].map((id) => ({
          user_id: id,
          type: "READ",
          from_user_group_id: userGroups[1].id,
          user_group_id: null,
          is_subscribed: true,
        })),
      ]);
      await userGroupsRepo.addUsersToGroups(userGroups[1].id, [users[1].id], `User:${users[0].id}`);
      expect(
        (await petitionsRepo.loadUserPermissionsByPetitionId.raw(petition.id)).map(
          pick(["user_id", "type", "user_group_id", "from_user_group_id", "is_subscribed"]),
        ),
      ).toIncludeSameMembers([
        {
          user_id: users[0].id,
          type: "OWNER",
          user_group_id: null,
          from_user_group_id: null,
          is_subscribed: true,
        },
        ...[users[1].id, users[2].id, users[3].id, users[4].id, users[5].id].map((id) => ({
          user_id: id,
          type: "READ",
          from_user_group_id: userGroups[1].id,
          user_group_id: null,
          is_subscribed: true,
        })),
      ]);
    });

    it("should respect group subscription when adding a new member permission", async () => {
      expect(
        (await petitionsRepo.loadUserPermissionsByPetitionId.raw(petition.id)).map(
          pick(["user_id", "type", "user_group_id", "from_user_group_id", "is_subscribed"]),
        ),
      ).toIncludeSameMembers([
        {
          user_id: users[0].id,
          type: "OWNER",
          user_group_id: null,
          from_user_group_id: null,
          is_subscribed: true,
        },
      ]);
      await petitionsRepo.addPetitionPermissions(
        [petition.id],
        [
          {
            type: "UserGroup",
            id: userGroups[1].id,
            permissionType: "READ",
            isSubscribed: false,
          },
        ],
        "User",
        users[0].id,
      );
      await userGroupsRepo.addUsersToGroups(userGroups[1].id, [users[1].id], `User:${users[0].id}`);
      expect(
        (await petitionsRepo.loadUserPermissionsByPetitionId.raw(petition.id)).map(
          pick(["user_id", "type", "user_group_id", "from_user_group_id", "is_subscribed"]),
        ),
      ).toIncludeSameMembers([
        {
          user_id: users[0].id,
          type: "OWNER",
          user_group_id: null,
          from_user_group_id: null,
          is_subscribed: true,
        },
        ...[users[1].id, users[2].id, users[3].id, users[4].id, users[5].id].map((id) => ({
          user_id: id,
          type: "READ",
          from_user_group_id: userGroups[1].id,
          user_group_id: null,
          is_subscribed: false,
        })),
      ]);
    });
  });

  describe("removeUsersFromGroups", () => {
    it("should remove a user from a given group", async () => {
      await userGroupsRepo.removeUsersFromGroups([users[0].id], [userGroups[0].id], "test");
      expect(await userGroupsRepo.loadUserGroupMembers(userGroups[0].id)).toMatchObject([
        { user_id: users[1].id, user_group_id: userGroups[0].id },
        { user_id: users[2].id, user_group_id: userGroups[0].id },
        { user_id: users[3].id, user_group_id: userGroups[0].id },
      ]);
    });

    it("should remove a user from multiple groups", async () => {
      await userGroupsRepo.removeUsersFromGroups(
        [users[2].id],
        [userGroups[0].id, userGroups[1].id],
        "test",
      );
      expect(
        await userGroupsRepo.loadUserGroupMembers([userGroups[0].id, userGroups[1].id]),
      ).toMatchObject([
        [
          { user_id: users[0].id, user_group_id: userGroups[0].id },
          { user_id: users[1].id, user_group_id: userGroups[0].id },
          { user_id: users[3].id, user_group_id: userGroups[0].id },
        ],
        [
          { user_id: users[3].id, user_group_id: userGroups[1].id },
          { user_id: users[4].id, user_group_id: userGroups[1].id },
          { user_id: users[5].id, user_group_id: userGroups[1].id },
        ],
      ]);
    });

    it("should remove multiple users from multiple groups", async () => {
      await userGroupsRepo.removeUsersFromGroups(
        [users[2].id, users[3].id],
        [userGroups[0].id, userGroups[1].id],
        "test",
      );
      expect(
        await userGroupsRepo.loadUserGroupMembers([userGroups[0].id, userGroups[1].id]),
      ).toMatchObject([
        [
          { user_id: users[0].id, user_group_id: userGroups[0].id },
          { user_id: users[1].id, user_group_id: userGroups[0].id },
        ],
        [
          { user_id: users[4].id, user_group_id: userGroups[1].id },
          { user_id: users[5].id, user_group_id: userGroups[1].id },
        ],
      ]);
    });

    it("removing a user from a group should also remove all petition permissions of the user through that group", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, users[0].id, 1);
      await mocks.sharePetitionWithGroups(petition.id, [userGroups[0].id]);
      await userGroupsRepo.removeUsersFromGroups([users[3].id], [userGroups[0].id], "test");

      const permissions = await petitionsRepo.loadPetitionPermissionsByUserId.raw(users[3].id);

      expect(permissions).toHaveLength(0);
    });
  });

  describe("removeUsersFromAllGroups", () => {
    it("should remove a user from all their groups", async () => {
      await userGroupsRepo.removeUsersFromAllGroups([users[2].id], "test");
      expect(
        await userGroupsRepo.loadUserGroupMembers([userGroups[0].id, userGroups[1].id]),
      ).toMatchObject([
        [
          { user_id: users[0].id, user_group_id: userGroups[0].id },
          { user_id: users[1].id, user_group_id: userGroups[0].id },
          { user_id: users[3].id, user_group_id: userGroups[0].id },
        ],
        [
          { user_id: users[3].id, user_group_id: userGroups[1].id },
          { user_id: users[4].id, user_group_id: userGroups[1].id },
          { user_id: users[5].id, user_group_id: userGroups[1].id },
        ],
      ]);
    });

    it("should remove multiple users from all their groups", async () => {
      await userGroupsRepo.removeUsersFromAllGroups(
        [users[1].id, users[3].id, users[4].id, users[5].id],
        "test",
      );
      expect(
        await userGroupsRepo.loadUserGroupMembers([userGroups[0].id, userGroups[1].id]),
      ).toMatchObject([
        [
          { user_id: users[0].id, user_group_id: userGroups[0].id },
          { user_id: users[2].id, user_group_id: userGroups[0].id },
        ],
        [{ user_id: users[2].id, user_group_id: userGroups[1].id }],
      ]);
    });

    it("should remove petition permissions of the users that are being removed from the group", async () => {
      const petitions = await mocks.createRandomPetitions(organization.id, users[5].id, 2);
      await mocks.sharePetitionWithGroups(petitions[0].id, [userGroups[0].id, userGroups[1].id]);
      await mocks.sharePetitionWithGroups(petitions[1].id, [userGroups[1].id]);

      await userGroupsRepo.removeUsersFromAllGroups(
        [users[0].id, users[3].id, users[4].id],
        "test",
      );

      const permissionsByPetition = await petitionsRepo.loadUserPermissionsByPetitionId.raw([
        petitions[0].id,
        petitions[1].id,
      ]);

      expect(permissionsByPetition).toMatchObject([
        [
          {
            user_id: users[5].id,
            petition_id: petitions[0].id,
            type: "OWNER",
            from_user_group_id: null,
          },
          {
            user_id: users[1].id,
            petition_id: petitions[0].id,
            type: "WRITE",
            from_user_group_id: userGroups[0].id,
          },
          {
            user_id: users[2].id,
            petition_id: petitions[0].id,
            type: "WRITE",
            from_user_group_id: userGroups[0].id,
          },
          {
            user_id: users[2].id,
            petition_id: petitions[0].id,
            type: "WRITE",
            from_user_group_id: userGroups[1].id,
          },
          {
            user_id: users[5].id,
            petition_id: petitions[0].id,
            type: "WRITE",
            from_user_group_id: userGroups[1].id,
          },
        ],
        [
          {
            user_id: users[5].id,
            petition_id: petitions[1].id,
            type: "OWNER",
            from_user_group_id: null,
          },
          {
            user_id: users[2].id,
            petition_id: petitions[1].id,
            type: "WRITE",
            from_user_group_id: userGroups[1].id,
          },
          {
            user_id: users[5].id,
            petition_id: petitions[1].id,
            type: "WRITE",
            from_user_group_id: userGroups[1].id,
          },
        ],
      ]);
    });

    it("removing a petition owner from a group should keep their ownership on the petition", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, users[0].id, 1);
      await mocks.sharePetitionWithGroups(petition.id, [userGroups[0].id]);

      await userGroupsRepo.removeUsersFromAllGroups([users[0].id], "test");

      const permissions = await petitionsRepo.loadUserPermissionsByPetitionId.raw(petition.id);

      expect(permissions).toMatchObject([
        {
          user_id: users[0].id,
          petition_id: petition.id,
          type: "OWNER",
          from_user_group_id: null,
        },
        {
          user_id: users[1].id,
          petition_id: petition.id,
          type: "WRITE",
          from_user_group_id: userGroups[0].id,
        },
        {
          user_id: users[2].id,
          petition_id: petition.id,
          type: "WRITE",
          from_user_group_id: userGroups[0].id,
        },
        {
          user_id: users[3].id,
          petition_id: petition.id,
          type: "WRITE",
          from_user_group_id: userGroups[0].id,
        },
      ]);
    });
  });
});

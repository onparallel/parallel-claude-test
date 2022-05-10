import { Container } from "inversify";
import { Knex } from "knex";
import { createTestContainer } from "../../../../test/testContainer";
import { deleteAllData } from "../../../util/knexUtils";
import { KNEX } from "../../knex";
import { Organization, User, UserGroup } from "../../__types";
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

  beforeAll(async () => {
    container = createTestContainer();
    knex = container.get<Knex>(KNEX);
    userGroupsRepo = container.get(UserGroupRepository);
    petitionsRepo = container.get(PetitionRepository);
    mocks = new Mocks(knex);
    [organization] = await mocks.createRandomOrganizations(1);

    users = await mocks.createRandomUsers(organization.id, 6);
    userGroups = await mocks.createUserGroups(2, organization.id);
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
    userGroupsRepo.loadUserGroupMembers.dataloader.clearAll();
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
        "test"
      );
      expect(
        await userGroupsRepo.loadUserGroupMembers([userGroups[0].id, userGroups[1].id])
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
        "test"
      );
      expect(
        await userGroupsRepo.loadUserGroupMembers([userGroups[0].id, userGroups[1].id])
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
        await userGroupsRepo.loadUserGroupMembers([userGroups[0].id, userGroups[1].id])
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
        "test"
      );
      expect(
        await userGroupsRepo.loadUserGroupMembers([userGroups[0].id, userGroups[1].id])
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
        "test"
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

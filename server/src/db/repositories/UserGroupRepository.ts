import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { groupBy, omit } from "remeda";
import { unMaybeArray } from "../../util/arrays";
import { fromDataLoader } from "../../util/fromDataLoader";
import { MaybeArray } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { escapeLike, SortBy } from "../helpers/utils";
import { KNEX } from "../knex";
import { CreateUserGroup, User, UserGroup } from "../__types";

@injectable()
export class UserGroupRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  async loadUserGroupsForOrg(
    orgId: number,
    opts: {
      search?: string | null;
      sortBy?: SortBy<keyof Pick<UserGroup, "name" | "created_at">>[];
    } & PageOpts
  ) {
    return await this.loadPageAndCount(
      this.from("user_group")
        .where({ org_id: orgId, deleted_at: null })
        .mmodify((q) => {
          if (opts.search) {
            q.whereEscapedILike("name", `%${escapeLike(opts.search, "\\")}%`, "\\");
          }
          if (opts.sortBy) {
            q.orderByRaw(opts.sortBy.map((s) => `"${s.column}" ${s.order}`).join(", "));
          }
        })
        .orderBy("id")
        .select("*"),
      opts
    );
  }

  readonly loadUserGroup = this.buildLoadBy("user_group", "id", (q) => q.whereNull("deleted_at"));

  readonly loadUserGroupMembers = this.buildLoadMultipleBy(
    "user_group_member",
    "user_group_id",
    (q) => q.whereNull("deleted_at").orderBy("created_at")
  );

  readonly loadUserGroupsByUserId = fromDataLoader(
    new DataLoader<number, UserGroup[]>(async (userIds) => {
      const userGroups = await this.raw<UserGroup & { user_id: number }>(
        /* sql */ `
        select ug.*, ugm.user_id from "user_group" ug join "user_group_member" ugm on ugm.user_group_id = ug.id 
        where ug.deleted_at is null and ugm.deleted_at is null and ugm.user_id in (${userIds
          .map(() => "?")
          .join(",")})
      `,
        userIds
      );

      const byUserId = groupBy(userGroups, (ug) => ug.user_id);
      return userIds.map((id) => byUserId[id]?.map((g) => omit(g, ["user_id"])) ?? []);
    })
  );

  async updateUserGroupById(
    id: MaybeArray<number>,
    data: Partial<CreateUserGroup>,
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    const ids = unMaybeArray(id);
    return await this.from("user_group", t)
      .update({
        ...data,
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .whereIn("id", ids)
      .returning("*");
  }

  async createUserGroup(data: CreateUserGroup, createdBy: string, t?: Knex.Transaction) {
    const [row] = await this.insert(
      "user_group",
      {
        ...data,
        created_by: createdBy,
        updated_by: createdBy,
      },
      t
    );
    return row;
  }

  async cloneUserGroup(userGroupId: number, name: string, user: User) {
    return await this.withTransaction(async (t) => {
      const newGroup = await this.createUserGroup(
        {
          name,
          org_id: user.org_id,
        },
        `User:${user.id}`,
        t
      );

      await t.raw(
        /* sql */ `
        with group_member as (select user_id from user_group_member where user_group_id = ? and deleted_at is null)
        insert into user_group_member(user_group_id, user_id, created_by)
        select ?::int, user_id, ? from group_member;
      `,
        [userGroupId, newGroup.id, `User:${user.id}`]
      );

      return newGroup;
    });
  }

  async deleteUserGroups(userGroupIds: number[], deletedBy: string) {
    await this.withTransaction(async (t) => {
      await Promise.all([
        // remove members
        this.from("user_group_member", t)
          .where({
            deleted_at: null,
          })
          .whereIn("user_group_id", userGroupIds)
          .update({ deleted_at: this.now(), deleted_by: deletedBy }),
        // stop sharing petitions with this group
        this.from("petition_permission", t)
          .whereNull("deleted_at")
          .andWhere((q) =>
            q.whereIn("user_group_id", userGroupIds).orWhereIn("from_user_group_id", userGroupIds)
          )
          .update({ deleted_at: this.now(), deleted_by: deletedBy }),
        // stop automatically sharing petitions with this group
        this.from("template_default_permission", t)
          .whereNull("deleted_at")
          .whereIn("user_group_id", userGroupIds)
          .update({ deleted_at: this.now(), deleted_by: deletedBy }),
      ]);
      await this.from("user_group", t)
        .where({
          deleted_at: null,
        })
        .whereIn("id", userGroupIds)
        .update({ deleted_at: this.now(), deleted_by: deletedBy });
    });
  }

  async removeUsersFromGroups(
    userIds: MaybeArray<number>,
    userGroupIds: MaybeArray<number>,
    deletedBy: string,
    t?: Knex.Transaction
  ) {
    if (
      (Array.isArray(userGroupIds) && userGroupIds.length === 0) ||
      (Array.isArray(userIds) && userIds.length === 0)
    ) {
      return;
    }
    await this.withTransaction(async (t) => {
      // remove group memberships
      await this.from("user_group_member", t)
        .whereIn("user_group_id", unMaybeArray(userGroupIds))
        .whereIn("user_id", unMaybeArray(userIds))
        .whereNull("deleted_at")
        .update({ deleted_at: this.now(), deleted_by: deletedBy });

      // remove permissions coming from the group memberships
      await this.from("petition_permission", t)
        .whereIn("from_user_group_id", unMaybeArray(userGroupIds))
        .whereIn("user_id", unMaybeArray(userIds))
        .whereNull("deleted_at")
        .update({ deleted_at: this.now(), deleted_by: deletedBy });
    }, t);
  }

  async removeUsersFromAllGroups(
    userIds: MaybeArray<number>,
    deletedBy: string,
    t?: Knex.Transaction
  ) {
    if (Array.isArray(userIds) && userIds.length === 0) {
      return;
    }
    await this.withTransaction(async (t) => {
      // remove group memberships
      await this.from("user_group_member", t)
        .whereIn("user_id", unMaybeArray(userIds))
        .whereNull("deleted_at")
        .update({ deleted_at: this.now(), deleted_by: deletedBy });

      // remove permissions coming from the group memberships
      await this.from("petition_permission", t)
        .whereIn("user_id", unMaybeArray(userIds))
        .whereNotNull("from_user_group_id")
        .whereNull("deleted_at")
        .update({ deleted_at: this.now(), deleted_by: deletedBy });
    }, t);
  }

  async addUsersToGroup(
    userGroupId: number,
    userIds: MaybeArray<number>,
    createdBy: string,
    t?: Knex.Transaction
  ) {
    const ids = unMaybeArray(userIds);
    if (ids.length > 0) {
      await this.withTransaction(async (t) => {
        await t.raw(
          /* sql */ `
        ? on conflict do nothing;
        `,
          [
            this.from("user_group_member", t).insert(
              ids.map((userId) => ({
                user_group_id: userGroupId,
                user_id: userId,
                created_by: createdBy,
              }))
            ),
          ]
        );

        /** add group permissions on the new group members */
        await this.addUserGroupMemberPermissions(userGroupId, ids, createdBy, t);
      }, t);
    }
  }

  async searchUserGroups(
    orgId: number,
    search: string,
    opts: {
      excludeUserGroups: number[];
    }
  ) {
    const userGroups = await this.from("user_group")
      .where({
        org_id: orgId,
        deleted_at: null,
      })
      .mmodify((q) => {
        if (opts.excludeUserGroups.length > 0) {
          q.whereNotIn("id", opts.excludeUserGroups);
        }
      })
      .whereEscapedILike("name", `%${escapeLike(search, "\\")}%`, "\\")
      .select<({ __type: "UserGroup" } & UserGroup)[]>("*", this.knex.raw(`'UserGroup' as __type`));
    return userGroups;
  }

  private async addUserGroupMemberPermissions(
    userGroupId: number,
    memberIds: number[],
    createdBy: string,
    t?: Knex.Transaction
  ) {
    return await this.withTransaction(
      (t) =>
        t.raw(
          /* sql */ `
          with 
            pp as (select * from petition_permission where user_group_id = ? and deleted_at is null),
            u as (select * from (values ${memberIds
              .map(() => "(?::int)")
              .join(", ")}) as t(user_id))
          insert into petition_permission(type, user_id, petition_id, from_user_group_id, created_by, updated_by)
            select pp.type, u.user_id, pp.petition_id, pp.user_group_id, ?, ?
            from pp cross join u
          on conflict do nothing;
        `,
          [userGroupId, ...memberIds, createdBy, createdBy]
        ),
      t
    );
  }
}

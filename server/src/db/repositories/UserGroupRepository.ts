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
            q.whereIlike("name", `%${escapeLike(opts.search, "\\")}%`, "\\");
          }
          if (opts.sortBy) {
            q.orderByRaw(
              opts.sortBy.map((s) => `"${s.column}" ${s.order}`).join(", ")
            );
          }
        })
        .orderBy("id")
        .select("*"),
      opts
    );
  }

  readonly loadUserGroup = this.buildLoadById("user_group", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadMembersForUserGroup = fromDataLoader(
    new DataLoader<number, User[]>(async (ids) => {
      const rows = await this.raw<User & { user_group_id: number }>(
        /* sql */ `
        select u.*, ugm.user_group_id
        from user_group_member ugm
          join "user" u on u.id = ugm.user_id
        where ugm.user_group_id in (${ids.map(() => "?").join(", ")})
          and ugm.deleted_at is null
        order by ugm.user_group_id asc, ugm.created_at asc
      `,
        [...ids]
      );
      const byUserGroupId = groupBy(rows, (r) => r.user_group_id);
      return ids.map(
        (id) =>
          byUserGroupId[id]?.map((r) => omit(r, ["user_group_id"]) ?? []) ?? []
      );
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

  async createUserGroup(
    data: CreateUserGroup,
    createdBy: string,
    t?: Knex.Transaction
  ) {
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
        insert into user_group_member(user_group_id,user_id, createdBy)
        select (?, group_member.user_id, ?) from group_member;
      `,
        [userGroupId, newGroup.id, `User:${user.id}`]
      );

      return newGroup;
    });
  }

  async deleteUserGroups(userGroupIds: number[], deletedBy: string) {
    await this.withTransaction(async (t) => {
      await this.from("user_group_member", t)
        .where({
          deleted_at: null,
        })
        .whereIn("user_group_id", userGroupIds)
        .update({ deleted_at: this.now(), deleted_by: deletedBy });

      await this.from("user_group", t)
        .where({
          deleted_at: null,
        })
        .whereIn("id", userGroupIds)
        .update({ deleted_at: this.now(), deleted_by: deletedBy });

      /** remove all permissions for the deleted group */
      await this.from("petition_user", t)
        .whereNull("deleted_at")
        .andWhere((q) =>
          q
            .whereIn("user_group_id", userGroupIds)
            .orWhereIn("from_user_group_id", userGroupIds)
        )
        .update({ deleted_at: this.now(), deleted_by: deletedBy });
    });
  }

  async removeUsersFromGroup(
    userGroupId: number,
    userIds: MaybeArray<number>,
    deletedBy: string
  ) {
    const ids = unMaybeArray(userIds);
    await this.withTransaction(async (t) => {
      await this.from("user_group_member", t)
        .where({ user_group_id: userGroupId, deleted_at: null })
        .whereIn("user_id", ids)
        .update(
          {
            deleted_by: deletedBy,
            deleted_at: this.now(),
          },
          "*"
        );

      /** remove group permissions on the deleted group members */
      await this.removeUserGroupMemberPermissions(
        userGroupId,
        ids,
        deletedBy,
        t
      );
    });
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
        await this.addUserGroupMemberPermissions(
          userGroupId,
          ids,
          createdBy,
          t
        );
      }, t);
    }
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
            pu as (select * from petition_user where user_group_id = ? and deleted_at is null),
            u as (select * from (values ${memberIds
              .map(() => "(?::int)")
              .join(", ")}) as t(user_id))
          insert into petition_user(permission_type, user_id, petition_id, from_user_group_id, created_by)
            select pu.permission_type, u.user_id, pu.petition_id, pu.user_group_id, ?
            from pu cross join u
          on conflict do nothing;
        `,
          [userGroupId, ...memberIds, createdBy]
        ),
      t
    );
  }

  private async removeUserGroupMemberPermissions(
    userGroupId: number,
    memberIds: number[],
    deletedBy: string,
    t?: Knex.Transaction
  ) {
    await this.from("petition_user", t)
      .where({ deleted_at: null, from_user_group_id: userGroupId })
      .whereIn("user_id", memberIds)
      .update({ deleted_at: this.now(), deleted_by: deletedBy });
  }
}

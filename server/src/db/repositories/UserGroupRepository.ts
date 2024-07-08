import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { groupBy, omit, partition, uniq } from "remeda";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import {
  CreateUserGroup,
  User,
  UserGroup,
  UserGroupPermissionEffect,
  UserGroupPermissionName,
  UserGroupType,
} from "../__types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { SortBy } from "../helpers/utils";
import { KNEX } from "../knex";

@injectable()
export class UserGroupRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  getPaginatedUserGroupsForOrg(
    orgId: number,
    opts: {
      search?: string | null;
      excludeIds?: number[] | null;
      type?: UserGroupType[] | null;
      sortBy?: SortBy<keyof Pick<UserGroup, "name" | "created_at">>[];
    } & PageOpts,
  ) {
    return this.getPagination<UserGroup>(
      this.from("user_group")
        .where({ org_id: orgId, deleted_at: null })
        .mmodify((q) => {
          if (opts.search) {
            q.where((q2) => {
              q2.whereSearch("name", opts.search!).or.whereExists((q3) =>
                q3
                  .select(this.knex.raw("1"))
                  .fromRaw(`jsonb_each_text(localizable_name) AS t(key, value)`)
                  .whereSearch("value", opts.search!),
              );
            });
          }
          if (opts.excludeIds && opts.excludeIds.length > 0) {
            q.whereNotIn("id", opts.excludeIds);
          }
          if (opts.type && opts.type.length > 0) {
            q.whereIn("type", opts.type);
          }
          if (opts.sortBy) {
            q.orderByRaw(opts.sortBy.map((s) => `"${s.field}" ${s.order}`).join(", "));
          }
        })
        .orderBy("id")
        .select("*"),
      opts,
    );
  }

  readonly loadUserGroup = this.buildLoadBy("user_group", "id", (q) => q.whereNull("deleted_at"));

  readonly loadUserGroupMembers = this.buildLoadMultipleBy(
    "user_group_member",
    "user_group_id",
    (q) => q.whereNull("deleted_at").orderBy("created_at"),
  );

  readonly loadUserGroupMemberCount = this.buildLoadCountBy(
    "user_group_member",
    "user_group_id",
    (q) => q.whereNull("deleted_at"),
  );

  readonly loadUserGroupsByUserId = this.buildLoader<number, UserGroup[]>(async (userIds, t) => {
    const userGroups = await this.raw<UserGroup & { user_id: number }>(
      /* sql */ `
        select ug.*, ugm.user_id from "user_group" ug join "user_group_member" ugm on ugm.user_group_id = ug.id 
        where ug.deleted_at is null and ugm.deleted_at is null and ugm.user_id in ? 
      `,
      [this.sqlIn(userIds)],
      t,
    );

    const byUserId = groupBy(userGroups, (ug) => ug.user_id);
    return userIds.map((id) => byUserId[id]?.map((g) => omit(g, ["user_id"])) ?? []);
  });

  loadUsersBelongsToGroup = this.buildLoader<{ userGroupId: number; userIds: number[] }, boolean>(
    async (keys, t) => {
      const rows = await this.from("user_group_member")
        .whereNull("deleted_at")
        .whereIn("user_group_id", uniq(keys.map((k) => k.userGroupId)))
        .whereIn("user_id", uniq(keys.flatMap((k) => k.userIds)))
        .distinct("user_id", "user_group_id");
      const members = new Map<number, Set<number>>();
      for (const row of rows) {
        if (!members.has(row.user_group_id)) {
          members.set(row.user_group_id, new Set([row.user_id]));
        } else {
          members.get(row.user_group_id)!.add(row.user_id);
        }
      }
      return keys.map((k) => {
        if (!members.has(k.userGroupId)) {
          return false;
        }
        const group = members.get(k.userGroupId)!;
        return k.userIds.every((userId) => group.has(userId));
      });
    },
  );

  async updateUserGroupById(
    id: MaybeArray<number>,
    data: Partial<CreateUserGroup>,
    updatedBy: string,
    t?: Knex.Transaction,
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
      t,
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
        t,
      );

      // copy group members
      await t.raw(
        /* sql */ `
            insert into user_group_member(user_group_id, user_id, created_by)
            select ?::int, user_id, ? from user_group_member where user_group_id = ? and deleted_at is null;
          `,
        [newGroup.id, `User:${user.id}`, userGroupId],
      );

      // copy group permissions
      await t.raw(
        /* sql */ `
            insert into user_group_permission (user_group_id, name, effect, created_by)
            select ?::int, name, effect, ? from user_group_permission where user_group_id = ? and deleted_at is null;
          `,
        [newGroup.id, `User:${user.id}`, userGroupId],
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
            q.whereIn("user_group_id", userGroupIds).orWhereIn("from_user_group_id", userGroupIds),
          )
          .update({ deleted_at: this.now(), deleted_by: deletedBy }),
        // stop automatically sharing petitions with this group
        this.from("template_default_permission", t)
          .whereNull("deleted_at")
          .whereIn("user_group_id", userGroupIds)
          .update({ deleted_at: this.now(), deleted_by: deletedBy }),
        // delete PETITION_SHARED notifications relating this user_groups
        this.from("petition_user_notification", t)
          .where("type", "PETITION_SHARED")
          .whereRaw(`("data"->>'user_group_id')::int in ?`, [this.sqlIn(userGroupIds)])
          .delete(),
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
    t?: Knex.Transaction,
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
    t?: Knex.Transaction,
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

  async addUsersToGroups(
    userGroupId: MaybeArray<number>,
    userId: MaybeArray<number>,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    const groupIds = unMaybeArray(userGroupId);
    const userIds = unMaybeArray(userId);

    if (userIds.length === 0 || groupIds.length === 0) {
      return;
    }

    const data = groupIds.flatMap((groupId) =>
      userIds.map((userId) => ({ user_group_id: groupId, user_id: userId })),
    );

    await this.withTransaction(async (t) => {
      await t.raw(
        /* sql */ `
        ? on conflict do nothing;
        `,
        [
          this.from("user_group_member", t).insert(
            data.map((d) => ({
              user_group_id: d.user_group_id,
              user_id: d.user_id,
              created_by: createdBy,
            })),
          ),
        ],
      );

      /** add group permissions on the new group members */
      await this.addUserGroupMemberPermissions(groupIds, userIds, createdBy, t);
    }, t);
  }

  /** @deprecated use getPaginatedUserGroupsForOrg */
  async searchUserGroups(
    orgId: number,
    search: string,
    opts: {
      excludeUserGroups: number[];
      type?: UserGroupType[] | null;
    },
  ) {
    return await this.from("user_group")
      .where({
        org_id: orgId,
        deleted_at: null,
      })
      .mmodify((q) => {
        if (opts.excludeUserGroups.length > 0) {
          q.whereNotIn("id", opts.excludeUserGroups);
        }
        if (opts.type) {
          q.whereIn("type", opts.type);
        }
      })
      .where((q) => {
        q.whereSearch("name", search).or.whereExists((q2) =>
          q2
            .select(this.knex.raw("1"))
            .fromRaw(`jsonb_each_text(localizable_name) AS t(key, value)`)
            .whereSearch("value", search),
        );
      })
      .select("*");
  }

  private async addUserGroupMemberPermissions(
    userGroupIds: number[],
    memberIds: number[],
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    return await this.withTransaction(
      (t) =>
        t.raw(
          /* sql */ `
          with 
            ug as (select * from (?) as t(user_group_id)),
            u as (select * from (?) as t(user_id))
          insert into petition_permission(type, user_id, petition_id, from_user_group_id, is_subscribed, created_by, updated_by)
            select pp.type, u.user_id, pp.petition_id, pp.user_group_id, pp.is_subscribed, ?, ?
            from u cross join ug
            join petition_permission pp on pp.user_group_id = ug.user_group_id and pp.deleted_at is null
          on conflict do nothing;
        `,
          [
            this.sqlValues(
              userGroupIds.map((id) => [id]),
              ["int"],
            ),
            this.sqlValues(
              memberIds.map((id) => [id]),
              ["int"],
            ),
            createdBy,
            createdBy,
          ],
        ),
      t,
    );
  }

  readonly loadAllUsersGroupsByOrgId = this.buildLoadMultipleBy("user_group", "org_id", (q) =>
    q.where("type", "ALL_USERS").whereNull("deleted_at"),
  );

  readonly loadUserGroupPermissionsByUserGroupId = this.buildLoadMultipleBy(
    "user_group_permission",
    "user_group_id",
    (q) => q.whereNull("deleted_at"),
  );

  readonly loadHasUserGroupPermissionsByUserGroupId = this.buildLoadExistsBy(
    "user_group_permission",
    "user_group_id",
    (q) => q.whereNull("deleted_at"),
  );

  async upsertUserGroupPermissions(
    userGroupId: number,
    permissions: { name: UserGroupPermissionName; effect: UserGroupPermissionEffect | "NONE" }[],
    createdBy: string,
  ) {
    if (permissions.length === 0) {
      return;
    }

    const [remove, upsert] = partition(permissions, (p) => p.effect === "NONE");

    if (remove.length > 0) {
      await this.from("user_group_permission")
        .where("user_group_id", userGroupId)
        .whereNull("deleted_at")
        .whereIn(
          "name",
          remove.map((p) => p.name),
        )
        .update({
          deleted_at: this.now(),
          deleted_by: createdBy,
        });
    }

    if (upsert.length > 0) {
      await this.raw(
        /* sql */ `
          insert into user_group_permission ("user_group_id", "name", "effect", "created_by") ? 
            on conflict ("user_group_id", "name") where deleted_at is null do update
          set
            effect = EXCLUDED.effect,
            updated_by = ?,
            updated_at = now()
          returning *;
        `,
        [
          this.sqlValues(upsert.map(({ effect, name }) => [userGroupId, name, effect, createdBy])),
          createdBy,
        ],
      );
    }
  }
}

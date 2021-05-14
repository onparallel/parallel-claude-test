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
          join user u on u.id = ugm.user_id
        where ugm.user_group_id in (${ids.map(() => "?").join(", ")})
          and ugm.deleted_at is null
        order by ugm.user_group_id asc ugm.created_at asc
      `,
        [...ids]
      );
      const byUserGroupId = groupBy(rows, (r) => r.user_group_id);
      return ids.map((id) =>
        byUserGroupId[id]?.map((r) => omit(r, ["user_group_id"]) ?? [])
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

  async createUserGroup(data: CreateUserGroup, createdBy: string) {
    const [row] = await this.insert("user_group", {
      ...data,
      created_by: createdBy,
      updated_by: createdBy,
    });
    return row;
  }

  async removeUsersFromGroup(
    userGroupId: number,
    userIds: MaybeArray<number>,
    deletedBy: string
  ) {
    await this.from("user_group_member")
      .where({ user_group_id: userGroupId, deleted_at: null })
      .whereIn("user_id", unMaybeArray(userIds))
      .update({
        deleted_by: deletedBy,
        deleted_at: this.now(),
      });
    //TODO manage petition permissions
  }

  async addUsersToGroup(
    userGroupId: number,
    userIds: MaybeArray<number>,
    createdBy: string
  ) {
    await this.from("user_group_member")
      .insert(
        unMaybeArray(userIds).map((userId) => ({
          user_group_id: userGroupId,
          user_id: userId,
          created_by: createdBy,
        }))
      )
      .onConflict()
      .ignore();
    //TODO manage petition permissions
  }
}

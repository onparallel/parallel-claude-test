import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { DatabaseError } from "pg";
import { groupBy, indexBy, isNonNullish, omit, unique } from "remeda";
import { keyBuilder } from "../../util/keyBuilder";
import { pMapChunk } from "../../util/promises/pMapChunk";
import { Maybe, MaybeArray, unMaybeArray } from "../../util/types";
import { CreateUser, CreateUserData, User, UserData, UserGroupPermissionName } from "../__types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX, KNEX_READ_ONLY } from "../knex";
import { ReadOnlySystemRepository, SystemRepository } from "./SystemRepository";

@injectable()
export class UserRepository extends BaseRepository {
  constructor(
    @inject(KNEX) knex: Knex,
    @inject(SystemRepository) private system: SystemRepository,
  ) {
    super(knex);
  }

  readonly loadUsersByCognitoId = this.buildLoader<string, User[]>(async (cognitoIds, t) => {
    const users = await this.raw<User & { ud_cognito_id: string }>(
      /* sql */ `
        update "user" u set last_active_at = NOW()
        from user_data ud 
        where ud.id = u.user_data_id
        and u.status = 'ACTIVE' and u.deleted_at is null and ud.deleted_at is null and ud.cognito_id in ?
        returning u.*, ud.cognito_id as ud_cognito_id
      `,
      [this.sqlIn(cognitoIds)],
      t,
    );
    const byCognitoId = groupBy(users, (u) => u.ud_cognito_id);
    return cognitoIds.map((id) => byCognitoId[id]?.map((u) => omit(u, ["ud_cognito_id"])) ?? []);
  });

  readonly loadInactiveUsersByCognitoId = this.buildLoader<string, User[]>(
    async (cognitoIds, t) => {
      const users = await this.raw<User & { ud_cognito_id: string }>(
        /* sql */ `
        select u.*, ud.cognito_id as ud_cognito_id from "user" u
        join user_data ud on ud.id = u.user_data_id
        where u.status != 'ACTIVE' and u.deleted_at is null and ud.deleted_at is null and ud.cognito_id in ?
      `,
        [this.sqlIn(cognitoIds)],
        t,
      );
      const byCognitoId = groupBy(users, (u) => u.ud_cognito_id);
      return cognitoIds.map((id) => byCognitoId[id]?.map((u) => omit(u, ["ud_cognito_id"])) ?? []);
    },
  );

  readonly loadUser = this.buildLoadBy("user", "id", (q) => q.whereNull("deleted_at"));

  readonly loadUserData = this.buildLoadBy("user_data", "id", (q) => q.whereNull("deleted_at"));

  async getUsersWithPermission(
    orgId: number,
    permission: UserGroupPermissionName,
  ): Promise<User[]> {
    return await this.raw<User>(
      /* sql */ `
      with "owner" as (
        select u.* from "user" u
        join organization o on u.org_id = o.id
        where u.is_org_owner and org_id = ? and (case when ? = 'SUPERADMIN' then o.status = 'ROOT' else true end)
      ),
      user_with_permission as (
        select distinct u.*
          from user_group ug 
          join user_group_permission ugp on ugp.user_group_id = ug.id
          join user_group_member ugm on ug.id = ugm.user_group_id
          join "user" u on u.id = ugm.user_id
        where ug.org_id = ? and ug.deleted_at is null
          and ugp.name = ? and ugp.deleted_at is null
          and ugm.deleted_at is null 
        group by u.id, ugp.name
        having every(ugp.effect = 'GRANT')  
      )
      select * from "owner"
      union distinct
      select * from user_with_permission;
    `,
      [orgId, permission, orgId, permission],
    );
  }

  readonly loadUserPermissions = this.buildLoader<number, UserGroupPermissionName[]>(
    async (userIds, t) => {
      const results = await this.raw<{ user_id: number; permissions: UserGroupPermissionName[] }>(
        /* sql */ `
          with user_group_permission_name as (
            select unnest(enum_range(NULL::user_group_permission_name)) as name
          ),
          superadmin_permission as (
            select
              u.id as user_id,
              ugpn.name
            from "user" u
            join organization o on u.org_id = o.id
            cross join user_group_permission_name ugpn
            where u.id in ?
              and u.is_org_owner = true
              -- SUPERADMIN only in ROOT organizations
              and (case when ugpn.name = 'SUPERADMIN' then o.status = 'ROOT' else true end)
          ),
          db_permission as (
            select ugm.user_id, ugp.name
              from user_group_member ugm
              join user_group ug on ug.id = ugm.user_group_id
              join user_group_permission ugp on ugp.user_group_id = ugm.user_group_id
            where ugm.user_id in ?
            and ug.deleted_at is null and ugm.deleted_at is null and ugp.deleted_at is null
            group by ugm.user_id, ugp.name
            having every(ugp.effect = 'GRANT')
          ),
          all_permission as (
            select * from superadmin_permission
            union distinct
            select * from db_permission
            order by user_id, name
          )
          select user_id, json_agg(name) as permissions
          from all_permission
          group by user_id
        `,
        [this.sqlIn(userIds), this.sqlIn(userIds)],
        t,
      );
      const byUserId = indexBy(results, (r) => r.user_id);
      return userIds.map((userId) => byUserId[userId]?.permissions ?? []);
    },
  );

  readonly loadUserDelegatesByUserId = this.buildLoader<number, User[]>(async (userIds, t) => {
    const users = await this.raw<User & { user_id: number }>(
      /* sql */ `
        select ud.user_id as user_id, u.* from "user" u
        join user_delegate ud on ud.delegate_user_id = u.id
        where ud.user_id in ? and u.deleted_at is null and ud.deleted_at is null
      `,
      [this.sqlIn(userIds)],
      t,
    );
    const byUserId = groupBy(users, (u) => u.user_id);
    return userIds.map((id) => byUserId[id]?.map((u) => omit(u, ["user_id"])) ?? []);
  });

  readonly loadReverseUserDelegatesByUserId = this.buildLoader<number, User[]>(
    async (userIds, t) => {
      const users = await this.raw<User & { delegate_user_id: number }>(
        /* sql */ `
          select ud.delegate_user_id as delegate_user_id, u.* from "user" u
          join user_delegate ud on ud.user_id = u.id
          where ud.delegate_user_id in ? and u.deleted_at is null and ud.deleted_at is null
        `,
        [this.sqlIn(userIds)],
        t,
      );
      const byUserId = groupBy(users, (u) => u.delegate_user_id);
      return userIds.map((id) => byUserId[id]?.map((u) => omit(u, ["delegate_user_id"])) ?? []);
    },
  );

  async syncDelegates(userId: number, delegateUserIds: MaybeArray<number>, user: User) {
    const _delegateUserIds = unMaybeArray(delegateUserIds);
    await this.withTransaction(async (t) => {
      await Promise.all([
        this.from("user_delegate", t)
          .where("user_id", userId)
          .whereNotIn("delegate_user_id", _delegateUserIds)
          .update({ deleted_at: this.now(), deleted_by: `User:${user.id}` }),
        _delegateUserIds.length > 0
          ? this.raw(
              /* sql */ `? on conflict do nothing returning *`,
              [
                this.from("user_delegate").insert(
                  _delegateUserIds.map((id) => ({
                    user_id: userId,
                    delegate_user_id: id,
                    created_by: `User:${user.id}`,
                  })),
                ),
              ],
              t,
            )
          : null,
      ]);
    });
    this.loadUserDelegatesByUserId.dataloader.clear(userId);
    for (const delegateuserId of _delegateUserIds) {
      this.loadReverseUserDelegatesByUserId.dataloader.clear(delegateuserId);
    }
  }

  readonly loadUserDataByUserId = this.buildLoader<number, Maybe<UserData>>(async (userIds, t) => {
    const users = await this.raw<UserData & { user_id: number }>(
      /* sql */ `
        select u.id as user_id, ud.* from "user" u
        join "user_data" ud on u.user_data_id = ud.id
        where u.id in ?
        and u.deleted_at is null and ud.deleted_at is null
      `,
      [this.sqlIn(userIds)],
      t,
    );

    const byUserId = indexBy(users, (u) => u.user_id);
    return userIds.map((id) => (byUserId[id] ? omit(byUserId[id], ["user_id"]) : null));
  });

  async getUserEmailsByOrgId(orgId: number) {
    return await this.raw<{ user_id: number; email: string }>(
      /* sql */ `
        select 
          u.id as user_id, 
          ud.email as email 
        from "user" u 
        join "user_data" ud on u.user_data_id = ud.id
        where u.org_id = ? 
          and u.deleted_at is null 
          and ud.deleted_at is null;
      `,
      [orgId],
    );
  }

  readonly loadUserByExternalId = this.buildLoader<
    { orgId: number; externalId: string },
    Maybe<User>,
    string
  >(
    async (externalIds, t) => {
      const users = await this.from("user", t)
        .whereIn("org_id", unique(externalIds.map((x) => x.orgId)))
        .whereIn("external_id", unique(externalIds.map((x) => x.externalId)))
        .whereNull("deleted_at");

      const byId = indexBy(users, keyBuilder(["org_id", "external_id"]));

      return externalIds.map(keyBuilder(["orgId", "externalId"])).map((key) => byId[key] ?? null);
    },
    { cacheKeyFn: keyBuilder(["orgId", "externalId"]) },
  );

  readonly loadUsersByEmail = this.buildLoader<string, User[]>(async (emails, t) => {
    const users = await this.raw<User & { ud_email: string }>(
      /* sql */ `
        select u.*, ud.email as ud_email from "user" u
        join "user_data" ud on u.user_data_id = ud.id
        where u.deleted_at is null and ud.deleted_at is null and ud.email in ?
      `,
      [this.sqlIn(emails)],
      t,
    );
    const byEmail = groupBy(users, (u) => u.ud_email.trim().toLowerCase());
    return emails.map((email) => byEmail[email]?.map((u) => omit(u, ["ud_email"])) ?? []);
  });

  readonly loadUsersByUserDataId = this.buildLoadMultipleBy("user", "user_data_id", (q) =>
    q.whereNull("deleted_at"),
  );

  async updateUserData(
    id: MaybeArray<number>,
    data: Partial<CreateUserData>,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    const ids = unMaybeArray(id);
    if (ids.length === 0) return [];

    for (const userId of ids) {
      // make sure user data is up to date when calling it from User and PublicUser gql objects
      this.loadUserData.dataloader.clear(userId);
    }

    return await this.from("user_data", t)
      .update({
        ...data,
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .whereIn("id", ids)
      .returning("*");
  }

  async updateUserById(
    id: MaybeArray<number>,
    data: Partial<CreateUser>,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    const ids = unMaybeArray(id);
    if (ids.length === 0) {
      return [];
    }

    return await pMapChunk(
      ids,
      async (idsChunk) =>
        await this.from("user", t)
          .update({
            ...data,
            updated_at: this.now(),
            updated_by: updatedBy,
          })
          .whereIn("id", idsChunk)
          .returning("*"),
      { concurrency: 1, chunkSize: 1000 },
    );
  }

  async updateUserByExternalId(
    externalId: string,
    orgId: number,
    data: Partial<CreateUser>,
    updatedBy: string,
    t?: Knex.Transaction,
  ): Promise<User | null> {
    const [user] = await this.from("user", t)
      .update({
        ...data,
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .where({
        external_id: externalId,
        org_id: orgId,
        deleted_at: null,
      })
      .returning("*");
    return user;
  }

  async updateUserDataByExternalId(
    externalId: string,
    orgId: number,
    data: Pick<CreateUserData, "first_name" | "last_name">,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    const [user] = await this.from("user", t)
      .where({
        org_id: orgId,
        external_id: externalId,
        deleted_at: null,
      })
      .select("user_data_id");

    const [userData] = await this.from("user_data", t)
      .where({
        id: user.user_data_id,
        deleted_at: null,
      })
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*",
      );

    if (isNonNullish(userData)) {
      this.loadUserData.dataloader.clear(userData.id);
    }

    this.loadUserByExternalId.dataloader.clear({ externalId, orgId });
    return userData;
  }

  async getOrCreateUserData(data: CreateUserData, createdBy: string, t?: Knex.Transaction) {
    try {
      const [userData] = await this.raw<UserData>(
        /* sql */ `
      ? 
      ON CONFLICT (email) WHERE deleted_at is NULL
      DO UPDATE SET
        -- need to do an update for the RETURNING to return the row
        email=EXCLUDED.email
      RETURNING *;`,
        [
          this.from("user_data").insert({
            ...data,
            created_by: createdBy,
            updated_by: createdBy,
          }),
        ],
        t,
      );
      return userData;
    } catch (error) {
      if (error instanceof DatabaseError && error.constraint === "user_data__cognito_id__unique") {
        // email isn't found, but there is a user_data with the same cognito_id
        // so we get that user data and update the email
        const [userData] = await this.from("user_data", t)
          .where("cognito_id", data.cognito_id)
          .update(
            {
              email: data.email,
              updated_at: this.now(),
              updated_by: createdBy,
            },
            "*",
          );

        return userData;
      }
      throw error;
    }
  }

  async createUser(
    data: Omit<CreateUser, "user_data_id">,
    userData: CreateUserData,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    const _userData = await this.getOrCreateUserData(userData, createdBy, t);
    const [user] = await this.insert(
      "user",
      {
        ...data,
        user_data_id: _userData.id,
        created_by: createdBy,
        updated_by: createdBy,
      },
      t,
    );

    await this.system.createEvent(
      {
        type: "USER_CREATED",
        data: {
          user_id: user.id,
          from: createdBy ? "invitation" : "sign-up",
        },
      },
      t,
    );

    return user;
  }

  readonly loadAvatarPathByUserDataId = this.buildLoader<number, Maybe<string>>(
    async (userDataIds, t) => {
      const results = await this.raw<{ id: number; path: string }>(
        /* sql */ `
          select ud.id, pfu.path from "user_data" ud
          join public_file_upload pfu on ud.avatar_public_file_id = pfu.id
          where ud.id in ?
        `,
        [this.sqlIn(userDataIds)],
        t,
      );
      const resultsById = indexBy(results, (x) => x.id);
      return userDataIds.map((id) => resultsById[id]?.path ?? null);
    },
  );

  readonly loadUserDataByEmail = this.buildLoader<string, UserData | null>(async (emails, t) => {
    if (emails.length === 0) {
      return [];
    }
    const userData = await this.from("user_data", t)
      .whereIn("email", emails)
      .whereNull("deleted_at")
      .select("*");

    const byEmail = indexBy(userData, (x) => x.email);
    return emails.map((email) => byEmail[email] ?? null);
  });
}

@injectable()
export class ReadOnlyUserRepository extends UserRepository {
  constructor(
    @inject(KNEX_READ_ONLY) knex: Knex,
    @inject(ReadOnlySystemRepository) system: ReadOnlySystemRepository,
  ) {
    super(knex, system);
  }
}

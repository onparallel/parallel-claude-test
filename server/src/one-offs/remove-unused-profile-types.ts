import { Knex, knex } from "knex";
import { ProfileType } from "../db/__types";
import { loadEnv } from "../util/loadEnv";
import { waitFor } from "../util/promises/waitFor";

async function initKnex() {
  await loadEnv();
  return knex({
    client: "pg",
    connection: {
      host: process.env.DB_HOST!,
      database: process.env.DB_DATABASE!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      port: parseInt(process.env.DB_PORT!),
    },
  });
}

function sqlIn(knex: Knex, array: readonly Knex.RawBinding[]) {
  return knex.raw(/* sql */ `(${array.map(() => "?").join(", ")})`, [...array]);
}

async function main() {
  const knex = await initKnex();

  const orgOwners = await knex
    .from("user")
    .whereNull("deleted_at")
    .where("is_org_owner", true)
    .select("*")
    .orderBy("org_id");

  console.log(`About to run on ${orgOwners.length} organizations`);
  await waitFor(3_000);

  let i = 0;
  for (const { id: ownerId, org_id: orgId } of orgOwners) {
    console.log(`Processing Org:${orgId} (${++i}/${orgOwners.length})`);
    const { rows: unusedProfileTypes } = await knex.raw<{ rows: Pick<ProfileType, "id">[] }>(
      /* sql */ `
        select pt.id from profile_type pt
        where pt.id not in (
          select distinct (p.profile_type_id) from "profile" p
          where p.org_id = :orgId and p.deleted_at is null
        )
        and pt.org_id = :orgId
        and pt.standard_type is null
        and pt.deleted_at is null;
      `,
      { orgId },
    );

    console.log(
      `${unusedProfileTypes.length} unused profile types: [${unusedProfileTypes.map((pt) => pt.id).join(", ")}]`,
    );
    if (unusedProfileTypes.length > 0) {
      await knex.raw(
        /* sql */ `
        update profile_type_field_permission
        set
          deleted_at = now(),
          deleted_by = ?
        where profile_type_field_id in (
          select ptf.id from profile_type_field ptf where ptf.profile_type_id in ?
        );
      `,
        [
          `User:${ownerId}`,
          sqlIn(
            knex,
            unusedProfileTypes.map((pt) => pt.id),
          ),
        ],
      );

      await knex.raw(
        /* sql */ `
        update profile_type_field
        set
          deleted_at = now(),
          deleted_by = ?
        where profile_type_id in ?;
      `,
        [
          `User:${ownerId}`,
          sqlIn(
            knex,
            unusedProfileTypes.map((pt) => pt.id),
          ),
        ],
      );

      await knex.raw(
        /* sql */ `
        update profile_type
        set 
          deleted_at = now(),
          archived_at = now(),
          deleted_by = ?
        where id in ?;
      `,
        [
          `User:${ownerId}`,
          sqlIn(
            knex,
            unusedProfileTypes.map((pt) => pt.id),
          ),
        ],
      );
    }
  }
}

main().then(() => {
  console.log("done");
  process.exit(0);
});

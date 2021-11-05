import { Knex } from "knex";
import pMap from "p-map";
import { omit, uniq } from "remeda";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  /**
   *move the OWNER of each public_petition_link from public_petition_link_user to new column public_petition_link.owner_id
   */
  await knex.schema.alterTable("public_petition_link", (t) => {
    t.integer("owner_id").nullable().references("user.id");
  });

  const publicPetitionLinkUserRows = await knex.from("public_petition_link_user").select("*");
  const publicPetitionLinkRows = await knex.from("public_petition_link").select("*");

  await pMap(publicPetitionLinkRows, async (ppl) => {
    const userId = publicPetitionLinkUserRows.find(
      (r) => r.public_petition_link_id === ppl.id
    )?.user_id;

    if (!userId) {
      throw Error();
    }
    await knex.from("public_petition_link").where("id", ppl.id).update("owner_id", userId);
  });

  await knex.schema.alterTable("public_petition_link", (t) => {
    t.integer("owner_id").notNullable().alter();
  });

  await knex.schema.createTable("petition_default_permission", (t) => {
    t.increments("id");
    t.integer("template_id").notNullable().references("petition.id");
    t.integer("user_id").nullable().references("user.id");
    t.specificType("type", "petition_permission_type").notNullable();
    t.integer("user_group_id").nullable().references("user_group.id");
    t.boolean("is_subscribed").notNullable().defaultTo(true);
    timestamps(t);
  }).raw(/* sql */ `
    -- useful to fetch all the default permissions given a template_id
    create index "petition_default_permission__template_id"
    on "petition_default_permission" (template_id) where deleted_at is null;

    -- unique directly assigned users per template
    create unique index "petition_default_permission__template_id__user_id" 
    on "petition_default_permission" (template_id, user_id) where deleted_at is null and user_group_id is null;
    
    -- unique groups per template
    create unique index "petition_default_permission__template_id__user_group_id" 
    on "petition_default_permission" (template_id, user_group_id) where deleted_at is null and user_group_id is not null;

    -- can't add OWNERS to this table
    alter table "petition_default_permission" add constraint "petition_default_permission__no_owners" check (type != 'OWNER');
  `);

  /** move every row in public_petition_link_user to petition_default_permission */
  const rwLinkPermissions = publicPetitionLinkUserRows.filter((r) => r.type !== "OWNER");
  const publicPetitionLinkIds = uniq(rwLinkPermissions.map((r) => r.public_petition_link_id));
  const publicPetitionLinks = await knex
    .from("public_petition_link")
    .whereIn("id", publicPetitionLinkIds);

  if (rwLinkPermissions.length > 0) {
    await knex.from("petition_default_permission").insert(
      rwLinkPermissions.map((pplu) => {
        const templateId = publicPetitionLinks.find(
          (ppl) => ppl.id === pplu.public_petition_link_id
        )?.template_id;

        if (!templateId) {
          throw new Error();
        }
        return {
          ...omit(pplu, ["public_petition_link_id", "from_user_group_id"]),
          template_id: templateId,
        };
      })
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .dropTable("petition_default_permission")
    .alterTable("public_petition_link", (t) => {
      t.dropColumn("owner_id");
    });
}

import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("is_readonly");
  });

  await removeFeatureFlag(knex, "AUTO_SEND_TEMPLATE");

  await knex.schema.dropTable("public_petition_link_user");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.boolean("is_readonly").notNullable().defaultTo(false);
  });
  await addFeatureFlag(knex, "AUTO_SEND_TEMPLATE", false);

  await knex.raw(/* sql */ `
    create table public_petition_link_user (
        id serial not null constraint public_petition_link_user_pkey primary key,
        public_petition_link_id integer not null constraint public_petition_link_user_public_petition_link_id_foreign references public_petition_link,
        user_id integer constraint public_petition_link_user_user_id_foreign references "user",
        type petition_permission_type not null,
        is_subscribed boolean default true not null,
        user_group_id integer constraint public_petition_link_user_user_group_id_foreign references user_group,
        from_user_group_id integer constraint public_petition_link_user_from_user_group_id_foreign references user_group,
        created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
        created_by varchar(255),
        updated_at timestamp with time zone default CURRENT_TIMESTAMP not null,
        updated_by varchar(255),
        deleted_at timestamp with time zone,
        deleted_by varchar(255),
        constraint public_petition_link_user__user_type_owner check (
            (
                (type = 'OWNER'::petition_permission_type)
                AND (user_group_id IS NULL)
                AND (from_user_group_id IS NULL)
                AND (user_id IS NOT NULL)
            )
            OR (type <> 'OWNER'::petition_permission_type)
        )
    );

    create index public_petition_link_user__user_id__public_petition_link_id on public_petition_link_user (user_id, public_petition_link_id)
    where
        (
            (deleted_at IS NULL)
            AND (user_group_id IS NULL)
        );

    create unique index public_petition_link_user__petition_id__user_id on public_petition_link_user (public_petition_link_id, user_id)
    where
        (
            (deleted_at IS NULL)
            AND (from_user_group_id IS NULL)
            AND (user_group_id IS NULL)
        );

    create unique index public_petition_link_user__from_user_group_id__public_petition_ on public_petition_link_user (
        from_user_group_id,
        public_petition_link_id,
        user_id
    )
    where
        (
            (deleted_at IS NULL)
            AND (from_user_group_id IS NOT NULL)
        );

    create unique index public_petition_link_user__user_group_id__public_petition_link_ on public_petition_link_user (user_group_id, public_petition_link_id)
    where
        (
            (deleted_at IS NULL)
            AND (user_group_id IS NOT NULL)
        );

    create index public_petition_link_user__public_petition_link_id on public_petition_link_user (public_petition_link_id)
    where
        (deleted_at IS NULL);
  `);
}

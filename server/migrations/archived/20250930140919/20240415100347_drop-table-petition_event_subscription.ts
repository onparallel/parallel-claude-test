import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTable("petition_event_subscription");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    CREATE TABLE petition_event_subscription (
        id serial4 NOT NULL,
        user_id int4 NOT NULL,
        endpoint varchar(255) NOT NULL,
        created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_by varchar(255) NULL,
        updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_by varchar(255) NULL,
        deleted_at timestamptz NULL,
        deleted_by varchar(255) NULL,
        is_enabled bool DEFAULT true NOT NULL,
        event_types jsonb NULL,
        "name" varchar(255) NULL,
        from_template_id int4 NULL,
        is_failing bool DEFAULT false NOT NULL,
        from_template_field_ids _int4 NULL,
        error_log jsonb DEFAULT '[]'::jsonb NOT NULL,
        CONSTRAINT petition_event_subscription_pkey PRIMARY KEY (id),
        CONSTRAINT petition_event_subscription_from_template_id_foreign FOREIGN KEY (from_template_id) REFERENCES public.petition(id),
        CONSTRAINT petition_event_subscription_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id)
    );
  `);
}

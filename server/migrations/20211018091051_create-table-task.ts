import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("task", (t) => {
    t.increments("id");
    t.integer("user_id").notNullable().references("user.id");
    t.enum("name", ["PRINT_PDF", "EXPORT_REPLIES"], {
      useNative: true,
      enumName: "task_name",
    }).notNullable();
    t.enum("status", ["ENQUEUED", "PROCESSING", "COMPLETED", "FAILED"], {
      useNative: true,
      enumName: "task_status",
    })
      .notNullable()
      .defaultTo("ENQUEUED");
    t.integer("progress").nullable(); // null progress means "unknown"
    t.jsonb("input").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
    t.jsonb("output").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
    t.jsonb("error_data").nullable();
    timestamps(t, { deleted: false });
  }).raw(/* sql */ `
     alter table "task" add constraint "task_progress_bounds" check ((progress is not null and progress >= 0 and progress <= 100) or (progress is null));
     alter table "task" add constraint "task_failed_error_data" check ((status = 'FAILED' and error_data is not null) or (status <> 'FAILED' and error_data is null))
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("task").raw(/* sql */ `
      DROP type task_name;
      DROP type task_status;
    `);
}

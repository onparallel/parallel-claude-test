import type { Knex } from "knex";
import { addAiCompletionLogType, removeAiCompletionLogType } from "./helpers/aiCompletionTypes";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import { addTaskName, removeTaskName } from "./helpers/taskNames";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "DOCUMENT_PROCESSING");
  await addTaskName(knex, "DOCUMENT_PROCESSING");
  await addAiCompletionLogType(knex, "DOCUMENT_PROCESSING");
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "DOCUMENT_PROCESSING");
  await removeTaskName(knex, "DOCUMENT_PROCESSING");
  await removeAiCompletionLogType(knex, "DOCUMENT_PROCESSING");

  await knex.raw(/* sql */ `
    update petition_field
    set options = options - 'processDocument'
    where type = 'FILE_UPLOAD'
    and deleted_at is null;  
  `);

  const anthropicIntegrations = await knex
    .from("org_integration")
    .where({
      type: "AI_COMPLETION",
      provider: "ANTHROPIC",
    })
    .select("*");

  if (anthropicIntegrations.length > 0) {
    await knex
      .from("ai_completion_log")
      .whereIn(
        "integration_id",
        anthropicIntegrations.map((i) => i.id),
      )
      .delete();

    await knex
      .from("org_integration")
      .whereIn(
        "id",
        anthropicIntegrations.map((i) => i.id),
      )
      .delete();
  }
}

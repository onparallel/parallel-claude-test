import { Knex } from "knex";
import pMap from "p-map";
import { Petition } from "../src/db/__types";
import { fromPlainText, toPlainText } from "../src/util/slate";

export async function up(knex: Knex): Promise<void> {
  const templates = await knex
    .from<Petition>("petition")
    .where("is_template", true)
    .select("id", "template_description");

  await pMap(
    templates,
    async (template) => {
      await knex
        .from<Petition>("petition")
        .where("id", template.id)
        .update({
          template_description:
            template.template_description === null
              ? null
              : JSON.stringify(fromPlainText(template.template_description)),
        });
    },
    { concurrency: 5 }
  );
}

export async function down(knex: Knex): Promise<void> {
  const templates = await knex
    .from<Petition>("petition")
    .where("is_template", true)
    .select("id", "template_description");

  await pMap(
    templates,
    async (template) => {
      try {
        if (template.template_description) {
          const description = JSON.parse(template.template_description);
          await knex
            .from<Petition>("petition")
            .where("id", template.id)
            .update({
              template_description: toPlainText(description),
            });
        }
      } catch {}
    },
    { concurrency: 5 }
  );
}

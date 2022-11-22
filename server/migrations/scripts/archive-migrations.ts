import { execSync } from "child_process";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { outdent } from "outdent";
import { resolve } from "path";

async function main() {
  console.log("generating dump of local database...");
  execSync(
    `docker exec dev-db-1 pg_dump -h localhost -d parallel_dev -U parallel --schema-only > dump.sql`
  );

  const dumpContents = await readFile("./dump.sql", "utf8");
  await rm("./dump.sql");

  const timestamp = new Date()
    .toISOString()
    .replace(/[\:T-]/g, "")
    .split(".")[0];

  console.log("archiving old migrations...");
  const archivePath = resolve(__dirname, `../archived/${timestamp}`);
  await mkdir(archivePath);

  execSync(`mv ./migrations/*.ts ${archivePath}`);

  console.log("creating new initial migration...");
  const fileContents = outdent`
  import { Knex } from "knex";

  export async function up(knex: Knex): Promise<void> {
    await knex.raw(/* sql */ \`
    ${dumpContents}
    \`);
  }
  
  export async function down(knex: Knex): Promise<void> {}

  `;

  await writeFile(`./migrations/${timestamp}_initial.ts`, fileContents);
}

main().then();

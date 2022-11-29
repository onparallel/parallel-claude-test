import { execSync } from "child_process";
import { knex } from "knex";

async function main() {
  const db = knex({
    client: "pg",
    connection: {
      host: "localhost",
      database: "parallel_dev",
      user: "parallel",
      password: "lellarap",
      port: 5432,
    },
  });

  // find every file on migrations folder ending with .ts and store it on an array
  const dirs = execSync(`find migrations -type f -maxdepth 1 -path '*.ts' | sort`, {
    encoding: "utf8",
  })
    .split("\n")
    .filter((v) => v !== "");

  await db.transaction(async (t) => {
    const migrationTime = new Date();
    await t.from("migrations").truncate();
    await t.from("migrations").insert(
      dirs.map((d) => ({
        name: d.split("/")[1],
        batch: 1,
        migration_time: migrationTime,
      }))
    );
  });
  await db.destroy();
  console.log("DONE!");
}

main().then();

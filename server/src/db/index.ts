import { ContainerModule } from "inversify";
import Knex from "knex";
import { CONFIG, Config } from "../config";
import { KNEX } from "./knex";
import { OrganizationReposistory } from "./repositories/organizations";
import { UserReposistory } from "./repositories/users";

export const dbModule = new ContainerModule(bind => {
  bind<Knex>(KNEX)
    .toDynamicValue(({ container }) => {
      const config = container.get<Config>(CONFIG);
      const knex = Knex({
        client: "pg",
        connection: config.db,
        asyncStackTraces: process.env.NODE_ENV !== "production",
        pool: {
          min: 5,
          max: config.db.maxConnections
        }
      });
      if (process.env.NODE_ENV === "development") {
        knex.on("query", ({ sql, bindings }) => {
          console.dir({ sql, bindings });
        });
      }
      return knex;
    })
    .inSingletonScope();
  bind<UserReposistory>(UserReposistory).toSelf();
  bind<OrganizationReposistory>(OrganizationReposistory).toSelf();
});

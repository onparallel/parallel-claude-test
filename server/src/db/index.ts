import { ContainerModule } from "inversify";
import Knex from "knex";
import { CONFIG, Config } from "../config";
import { KNEX } from "./knex";
import { ContactReposistory } from "./repositories/ContactRepository";
import { EmailLogRepository } from "./repositories/EmailLogRepository";
import { FileUploadRepository } from "./repositories/FileUploadRepository";
import { OrganizationRepository } from "./repositories/OrganizationRepository";
import { PetitionRepository } from "./repositories/PetitionRepository";
import { ReminderRepository } from "./repositories/ReminderRepository";
import { UserReposistory } from "./repositories/UserRepository";

export const dbModule = new ContainerModule((bind) => {
  bind<Knex>(KNEX)
    .toDynamicValue(({ container }) => {
      const config = container.get<Config>(CONFIG);
      const knex = Knex({
        client: "pg",
        connection: config.db,
        asyncStackTraces: process.env.NODE_ENV !== "production",
        pool: {
          min: 5,
          max: config.db.maxConnections,
        },
      });
      if (process.env.NODE_ENV === "development") {
        knex.on("query", ({ sql, bindings }) => {
          console.dir({ sql, bindings });
        });
      }
      return knex;
    })
    .inSingletonScope();

  // Repositories
  bind<ContactReposistory>(ContactReposistory).toSelf();
  bind<EmailLogRepository>(EmailLogRepository).toSelf();
  bind<FileUploadRepository>(FileUploadRepository).toSelf();
  bind<OrganizationRepository>(OrganizationRepository).toSelf();
  bind<PetitionRepository>(PetitionRepository).toSelf();
  bind<ReminderRepository>(ReminderRepository).toSelf();
  bind<UserReposistory>(UserReposistory).toSelf();
});

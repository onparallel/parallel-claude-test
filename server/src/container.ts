import { Container } from "inversify";
import { CONFIG, Config, buildConfig } from "./config";
import { ApiContext, WorkerContext } from "./context";
import { dbModule } from "./db/module";
import { integrationsModule } from "./integrations/module";
import { servicesModule } from "./services/module";
import { backgroundCheckClientsModule } from "./services/background-check-clients/module";

export function createContainer() {
  const container = new Container();
  container.bind<Config>(CONFIG).toDynamicValue(buildConfig).inSingletonScope();
  container.bind<ApiContext>(ApiContext).toSelf();
  container.bind<WorkerContext>(WorkerContext).toSelf();
  container.load(dbModule);
  container.load(servicesModule);
  container.load(backgroundCheckClientsModule);
  container.load(integrationsModule);
  container.bind<Container>(Container).toConstantValue(container);
  return container;
}

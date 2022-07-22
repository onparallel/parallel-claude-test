import { Container } from "inversify";
import { buildConfig, Config, CONFIG } from "./config";
import { ApiContext, WorkerContext } from "./context";
import { dbModule } from "./db/module";
import { servicesModule } from "./services/module";
import { signatureClientsModule } from "./services/signature-clients/module";

export function createContainer() {
  const container = new Container();
  container.bind<Config>(CONFIG).toDynamicValue(buildConfig).inSingletonScope();
  container.bind<ApiContext>(ApiContext).toSelf();
  container.bind<WorkerContext>(WorkerContext).toSelf();
  container.load(dbModule);
  container.load(servicesModule);
  container.load(signatureClientsModule);
  container.bind<Container>(Container).toConstantValue(container);
  return container;
}

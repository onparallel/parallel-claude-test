import { Container } from "inversify";
import { CONFIG, Config, buildConfig } from "./config";
import { ApiContext, WorkerContext } from "./context";
import { dbModule } from "./db/module";
import { integrationsModule } from "./integrations/module";
import { aiCompletionClientsModule } from "./services/ai-clients/module";
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
  container.load(integrationsModule);
  container.load(aiCompletionClientsModule);
  container.bind<Container>(Container).toConstantValue(container);
  return container;
}

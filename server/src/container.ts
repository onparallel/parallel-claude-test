import { Container } from "inversify";
import { CONFIG, Config, buildConfig } from "./config";
import { ApiContext } from "./context";
import { dbModule } from "./db/module";
import { integrationsModule } from "./integrations/module";
import { adverseMediaSearchClientsModule } from "./services/adverse-media-search-clients/module";
import { backgroundCheckClientsModule } from "./services/background-check-clients/module";
import { servicesModule } from "./services/module";

export function createContainer() {
  const container = new Container({ defaultScope: "Request" });
  container.bind<Config>(CONFIG).toDynamicValue(buildConfig).inSingletonScope();
  container.bind<ApiContext>(ApiContext).toSelf();
  container.load(dbModule);
  container.load(servicesModule);
  container.load(backgroundCheckClientsModule);
  container.load(adverseMediaSearchClientsModule);
  container.load(integrationsModule);
  container.bind<Container>(Container).toConstantValue(container);
  return container;
}

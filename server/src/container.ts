import { Container } from "inversify";
import { Config, CONFIG, buildConfig } from "./config";
import { ApiContext, WorkerContext } from "./context";
import { dbModule } from "./db";
import { servicesModule } from "./services";

export function createContainer() {
  const container = new Container();
  container.bind<Config>(CONFIG).toDynamicValue(buildConfig).inSingletonScope();
  container.bind<ApiContext>(ApiContext).toSelf();
  container.bind<WorkerContext>(WorkerContext).toSelf();
  container.load(dbModule);
  container.load(servicesModule);
  return container;
}

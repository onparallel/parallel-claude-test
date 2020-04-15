import { Container } from "inversify";
import { Config, CONFIG, config } from "./config";
import { ApiContext, WorkerContext } from "./context";
import { dbModule } from "./db";
import { servicesModule } from "./services";

export function createContainer() {
  const container = new Container();
  container.bind<Config>(CONFIG).toConstantValue(config);
  container.bind<ApiContext>(ApiContext).toSelf();
  container.bind<WorkerContext>(WorkerContext).toSelf();
  container.load(dbModule);
  container.load(servicesModule);
  return container;
}

import { Container } from "inversify";
import { Config, CONFIG, config } from "./config";
import { Context } from "./context";
import { dbModule } from "./db";
import { servicesModule } from "./services";

export function createContainer() {
  const container = new Container();
  container.bind<Config>(CONFIG).toConstantValue(config);
  container.bind<Context>(Context).toSelf();
  container.load(dbModule);
  container.load(servicesModule);
  return container;
}

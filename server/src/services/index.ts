import { ContainerModule } from "inversify";
import { Cognito } from "./cognito";
import { Redis } from "./redis";
import { Auth } from "./auth";

export const servicesModule = new ContainerModule(bind => {
  bind<Auth>(Auth).toSelf();
  bind<Cognito>(Cognito).toSelf();
  bind<Redis>(Redis)
    .toSelf()
    .inSingletonScope();
});

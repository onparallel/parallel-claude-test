import { ContainerModule } from "inversify";
import { Cognito } from "./cognito";
import { Redis } from "./redis";
import { Auth } from "./auth";
import { Aws } from "./aws";

export const servicesModule = new ContainerModule((bind) => {
  bind<Auth>(Auth).toSelf();
  bind<Cognito>(Cognito).toSelf();
  bind<Aws>(Aws).toSelf().inSingletonScope();
  bind<Redis>(Redis).toSelf().inSingletonScope();
});

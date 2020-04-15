import { ContainerModule } from "inversify";
import { Auth } from "./auth";
import { Aws } from "./aws";
import { Cognito } from "./cognito";
import { Redis } from "./redis";
import { Smtp } from "./smtp";

export const servicesModule = new ContainerModule((bind) => {
  bind<Auth>(Auth).toSelf();
  bind<Aws>(Aws).toSelf().inSingletonScope();
  bind<Cognito>(Cognito).toSelf();
  bind<Redis>(Redis).toSelf().inSingletonScope();
  bind<Smtp>(Smtp).toSelf().inSingletonScope();
});

import { ContainerModule } from "inversify";
import { DocusignOauthIntegration } from "../api/oauth/DocusignOauthIntegration";

export const oauthClientsModule = new ContainerModule((bind) => {
  bind<DocusignOauthIntegration>(DocusignOauthIntegration).toSelf().inSingletonScope();
});

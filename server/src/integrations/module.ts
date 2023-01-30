import { ContainerModule } from "inversify";
import { DocusignOauthIntegration } from "./DocusignOauthIntegration";

export const integrationsModule = new ContainerModule((bind) => {
  bind<DocusignOauthIntegration>(DocusignOauthIntegration).toSelf();
});

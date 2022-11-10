import { ContainerModule } from "inversify";
import { DocusignOauthIntegration } from "../api/oauth/DocusignOauthIntegration";
import { OAuthIntegration } from "../api/oauth/OAuthIntegration";

export const oauthClientsModule = new ContainerModule((bind) => {
  bind<OAuthIntegration>(DocusignOauthIntegration).toSelf().inSingletonScope();
});

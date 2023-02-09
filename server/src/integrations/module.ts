import { ContainerModule } from "inversify";
import { DocusignIntegration } from "./DocusignIntegration";
import { SignaturitIntegration } from "./SignaturitIntegration";

export const integrationsModule = new ContainerModule((bind) => {
  bind<DocusignIntegration>(DocusignIntegration).toSelf();
  bind<SignaturitIntegration>(SignaturitIntegration).toSelf();
});

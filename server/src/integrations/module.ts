import { ContainerModule } from "inversify";
import { AzureOpenAiIntegration } from "./AzureOpenAiIntegration";
import { DocusignIntegration } from "./DocusignIntegration";
import { DowJonesIntegration } from "./DowJonesIntegration";
import { SignaturitIntegration } from "./SignaturitIntegration";

export const integrationsModule = new ContainerModule((bind) => {
  bind<DocusignIntegration>(DocusignIntegration).toSelf();
  bind<SignaturitIntegration>(SignaturitIntegration).toSelf();
  bind<DowJonesIntegration>(DowJonesIntegration).toSelf();
  bind<AzureOpenAiIntegration>(AzureOpenAiIntegration).toSelf();
});

import { ContainerModule } from "inversify";
import { AI_COMPLETION_CLIENT, IAiCompletionClient } from "./ai-completion/AiCompletionClient";
import { AzureOpenAiClient } from "./ai-completion/AzureOpenAIClient";
import { AzureOpenAiIntegration } from "./ai-completion/AzureOpenAiIntegration";
import { DOW_JONES_CLIENT, DowJonesClient, IDowJonesClient } from "./dow-jones/DowJonesClient";
import { DowJonesIntegration } from "./dow-jones/DowJonesIntegration";
import { IIdVerificationIntegration } from "./id-verification/IdVerificationIntegration";
import {
  BANKFLIP_ID_VERIFICATION_INTEGRATION,
  BankflipIdVerificationIntegration,
} from "./id-verification/bankflip/BankflipIdVerificationIntegration";
import { DocusignClient } from "./signature/DocusignClient";
import { DocusignIntegration } from "./signature/DocusignIntegration";
import { ISignatureClient, SIGNATURE_CLIENT } from "./signature/SignatureClient";
import { SignaturitClient } from "./signature/SignaturitClient";
import { SignaturitIntegration } from "./signature/SignaturitIntegration";

export const integrationsModule = new ContainerModule((bind) => {
  bind<IAiCompletionClient<any>>(AI_COMPLETION_CLIENT)
    .to(AzureOpenAiClient)
    .whenTargetNamed("AZURE_OPEN_AI");
  bind<AzureOpenAiIntegration>(AzureOpenAiIntegration).toSelf();

  bind<SignaturitIntegration>(SignaturitIntegration).toSelf();
  bind<ISignatureClient>(SIGNATURE_CLIENT).to(SignaturitClient).whenTargetNamed("SIGNATURIT");
  bind<DocusignIntegration>(DocusignIntegration).toSelf();
  bind<ISignatureClient>(SIGNATURE_CLIENT).to(DocusignClient).whenTargetNamed("DOCUSIGN");

  bind<IDowJonesClient>(DOW_JONES_CLIENT).to(DowJonesClient);
  bind<DowJonesIntegration>(DowJonesIntegration).toSelf();

  bind<IIdVerificationIntegration>(BANKFLIP_ID_VERIFICATION_INTEGRATION).to(
    BankflipIdVerificationIntegration,
  );
});

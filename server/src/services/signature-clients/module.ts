import { ContainerModule } from "inversify";
import { ISignatureClient, SIGNATURE_CLIENT } from "./client";
import { DocuSignClient } from "./docusign";
import { SignaturitClient } from "./signaturit";

export const signatureClientsModule = new ContainerModule((bind) => {
  bind<ISignatureClient>(SIGNATURE_CLIENT).to(SignaturitClient).whenTargetNamed("SIGNATURIT");

  bind<ISignatureClient>(SIGNATURE_CLIENT).to(DocuSignClient).whenTargetNamed("DOCUSIGN");
});

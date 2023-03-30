import { ContainerModule } from "inversify";
import { ISignatureClient, SIGNATURE_CLIENT } from "./SignatureClient";
import { DocuSignClient } from "./DocuSignClient";
import { SignaturitClient } from "./SignaturitClient";

export const signatureClientsModule = new ContainerModule((bind) => {
  bind<ISignatureClient>(SIGNATURE_CLIENT).to(SignaturitClient).whenTargetNamed("SIGNATURIT");

  bind<ISignatureClient>(SIGNATURE_CLIENT).to(DocuSignClient).whenTargetNamed("DOCUSIGN");
});

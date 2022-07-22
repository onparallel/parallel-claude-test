import { ContainerModule } from "inversify";
import { ISignatureClient, SIGNATURE_CLIENT } from "./client";
import { SignaturitClient } from "./signaturit";

export const signatureClientsModule = new ContainerModule((bind) => {
  bind<ISignatureClient<"SIGNATURIT">>(SIGNATURE_CLIENT)
    .to(SignaturitClient)
    .inSingletonScope()
    .whenTargetNamed("SIGNATURIT");
});

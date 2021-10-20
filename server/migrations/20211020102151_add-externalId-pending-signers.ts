import { Knex } from "knex";
import pMap from "p-map";
import { PetitionSignatureConfigSigner } from "../src/db/repositories/PetitionRepository";
import { PetitionSignatureRequest } from "../src/db/__types";

export async function up(knex: Knex): Promise<void> {
  const signatures = await knex
    .from<PetitionSignatureRequest>("petition_signature_request")
    .where("status", "PROCESSING")
    .select("*");

  await pMap(
    signatures,
    async (signature) => {
      const updatedSignersInfo = (
        signature.signature_config.signersInfo as PetitionSignatureConfigSigner[]
      ).map((signer, signerIndex) => ({
        ...signer,
        externalId: findSignerExternalId(signature.data.documents, signer, signerIndex),
      }));
      await knex
        .from("petition_signature_request")
        .where("id", signature.id)
        .update({
          signature_config: {
            ...signature.signature_config,
            signersInfo: updatedSignersInfo,
          },
        });
    },
    { concurrency: 10 }
  );
}

export async function down(knex: Knex): Promise<void> {}

function findSignerExternalId(
  documents: { email: string; id: string }[],
  signer: PetitionSignatureConfigSigner,
  signerIndex: number
) {
  const signerByEmail = documents.filter((d) => d.email === signer.email);

  if (signerByEmail.length === 1) {
    // first search by email, if only 1 result found it's a match
    return signerByEmail[0].id;
  } else if (signerByEmail.length > 1) {
    // if more than 1 signer found with the same email, match by position in the array
    const externalId = documents[signerIndex]?.id;
    if (!externalId) {
      throw new Error(
        `Index out of bounds on signature document. document:${JSON.stringify(
          documents
        )}, index: ${signerIndex} `
      );
    }
    return externalId;
  } else if (signerByEmail.length === 0) {
    // if no signers were found with that email, there's an error
    throw new Error(
      `Can't find signer by email on document. signer:${JSON.stringify(
        signer
      )}. documents: ${JSON.stringify(documents)}`
    );
  }
}

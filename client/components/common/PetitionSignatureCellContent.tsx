import { gql } from "@apollo/client";
import { PetitionSignatureCellContent_PetitionFragment } from "@parallel/graphql/__types";
import { getPetitionSignatureEnvironment } from "@parallel/utils/getPetitionSignatureEnvironment";
import { getPetitionSignatureStatus } from "@parallel/utils/getPetitionSignatureStatus";
import { PetitionSignatureStatusIcon } from "./PetitionSignatureStatusIcon";

interface PetitionSignatureCellContentProps {
  petition: PetitionSignatureCellContent_PetitionFragment;
}
export function PetitionSignatureCellContent({ petition }: PetitionSignatureCellContentProps) {
  const status = getPetitionSignatureStatus(petition);
  const environment = getPetitionSignatureEnvironment(petition);

  // do not show signature status on drafts
  if (petition.status === "DRAFT" || !status) return null;

  return <PetitionSignatureStatusIcon status={status} environment={environment} />;
}

PetitionSignatureCellContent.fragments = {
  Petition: gql`
    fragment PetitionSignatureCellContent_Petition on Petition {
      ...getPetitionSignatureStatus_Petition
      ...getPetitionSignatureEnvironment_Petition
    }
    ${getPetitionSignatureStatus.fragments.Petition}
    ${getPetitionSignatureEnvironment.fragments.Petition}
  `,
};

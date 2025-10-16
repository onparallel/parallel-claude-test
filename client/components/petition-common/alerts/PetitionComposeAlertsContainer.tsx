import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  PetitionCompose_cancelSignatureRequestDocument,
  PetitionComposeAlertsContainer_petitionDocument,
  PetitionComposeAlertsContainer_PetitionFragment,
} from "@parallel/graphql/__types";
import { getPetitionSignatureStatus } from "@parallel/utils/getPetitionSignatureStatus";
import { useCancelApprovalRequestFlow } from "@parallel/utils/hooks/useCancelApprovalRequestFlow";
import { useClosePetition } from "@parallel/utils/hooks/useClosePetition";
import { useStartApprovalRequestStep } from "@parallel/utils/hooks/useStartApprovalRequestStep";
import { useStartSignatureRequest } from "@parallel/utils/useStartSignatureRequest";
import { useCallback } from "react";
import { PetitionComposeAndPreviewAlerts } from "./PetitionComposeAndPreviewAlerts";

interface PetitionComposeAlertsContainerProps {
  petitionId: string;
  onRefetch: () => void;
}

export function PetitionComposeAlertsContainer({
  petitionId,
  onRefetch,
}: PetitionComposeAlertsContainerProps) {
  const { data, loading } = useQuery(PetitionComposeAlertsContainer_petitionDocument, {
    variables: { id: petitionId },
    fetchPolicy: "cache-and-network",
  });

  const petition = data?.petition;

  if (loading || !petition) {
    return null;
  }

  return (
    <Alerts
      petition={petition as PetitionComposeAlertsContainer_PetitionFragment}
      onRefetch={onRefetch}
    />
  );
}

function Alerts({
  petition,
  onRefetch,
}: {
  petition: PetitionComposeAlertsContainer_PetitionFragment;
  onRefetch: () => void;
}) {
  const signatureStatus = getPetitionSignatureStatus(petition);

  const { handleStartSignature } = useStartSignatureRequest({
    petition: petition,
  });

  const { handleCancelApprovals } = useCancelApprovalRequestFlow(petition.id);

  const { handleStartApprovalFlow, hasNotStartedApprovals } = useStartApprovalRequestStep({
    petition,
  });

  const { handleClosePetition } = useClosePetition({
    onRefetch,
  });

  const [cancelSignatureRequest] = useMutation(PetitionCompose_cancelSignatureRequestDocument);

  const handleCancelSignature = useCallback(async () => {
    if (petition.currentSignatureRequest) {
      await cancelSignatureRequest({
        variables: {
          petitionSignatureRequestId: petition.currentSignatureRequest.id,
        },
      });
    }
  }, [petition]);

  return (
    <PetitionComposeAndPreviewAlerts
      onCancelApprovals={handleCancelApprovals}
      onStartApprovals={() => handleStartApprovalFlow()}
      onStartSignature={handleStartSignature}
      onClosePetition={() => {
        handleClosePetition(petition);
      }}
      onCancelSignature={handleCancelSignature}
      petitionStatus={petition.status}
      signatureStatus={signatureStatus}
      approvalsStatus={petition.currentApprovalRequestStatus}
      signatureAfterApprovals={petition.signatureConfig?.reviewAfterApproval}
      hasNotStartedApprovals={hasNotStartedApprovals}
    />
  );
}

const _fragments = {
  Petition: gql`
    fragment PetitionComposeAlertsContainer_Petition on Petition {
      id
      status
      currentApprovalRequestStatus
      signatureConfig {
        reviewAfterApproval
      }
      currentSignatureRequest {
        id
      }
      ...getPetitionSignatureStatus_Petition
      ...useStartSignatureRequest_Petition
      ...useStartApprovalRequestStep_PetitionBase
      ...useClosePetition_PetitionBase
    }
    ${getPetitionSignatureStatus.fragments.Petition}
    ${useStartSignatureRequest.fragments.Petition}
    ${useStartApprovalRequestStep.fragments.PetitionBase}
    ${useClosePetition.fragments.PetitionBase}
  `,
};

const _queries = [
  gql`
    query PetitionComposeAlertsContainer_petition($id: GID!) {
      petition(id: $id) {
        ...PetitionComposeAlertsContainer_Petition
      }
    }
    ${_fragments.Petition}
  `,
];

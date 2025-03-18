import { gql, useMutation } from "@apollo/client";
import { useCancelApprovalRequestFlow_cancelPetitionApprovalRequestFlowDocument } from "@parallel/graphql/__types";
import { useCallback } from "react";

export function useCancelApprovalRequestFlow(petitionId: string) {
  const [cancelPetitionApprovalRequestFlow, { loading, error }] = useMutation(
    useCancelApprovalRequestFlow_cancelPetitionApprovalRequestFlowDocument,
  );

  const handleCancelApprovals = useCallback(async () => {
    try {
      const result = await cancelPetitionApprovalRequestFlow({
        variables: {
          petitionId,
        },
      });
      return result.data?.cancelPetitionApprovalRequestFlow;
    } catch (err) {
      throw err;
    }
  }, [cancelPetitionApprovalRequestFlow, petitionId]);

  return {
    handleCancelApprovals,
    loading,
    error,
  };
}

const _mutations = [
  gql`
    mutation useCancelApprovalRequestFlow_cancelPetitionApprovalRequestFlow($petitionId: GID!) {
      cancelPetitionApprovalRequestFlow(petitionId: $petitionId) {
        id
        petition {
          id
          currentApprovalRequestSteps {
            id
            status
          }
          currentApprovalRequestStatus
        }
      }
    }
  `,
];

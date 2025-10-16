import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useToast } from "@chakra-ui/react";
import { isDialogError } from "@parallel/components/common/dialogs/DialogProvider";

import { useStartPetitionApprovalFlowDialog } from "@parallel/components/petition-replies/dialogs/StartPetitionApprovalFlowDialog";
import {
  PetitionApprovalsCard_PetitionApprovalRequestStepFragment,
  useStartApprovalRequestStep_PetitionBaseFragment,
  useStartApprovalRequestStep_startPetitionApprovalRequestStepDocument,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { useGenericErrorToast } from "../useGenericErrorToast";

export function useStartApprovalRequestStep({
  petition,
}: {
  petition: useStartApprovalRequestStep_PetitionBaseFragment;
}) {
  const intl = useIntl();
  const toast = useToast();
  const showGenericErrorToast = useGenericErrorToast();

  const showStartApprovalToast = (stepName: string) => {
    toast({
      description: intl.formatMessage(
        {
          id: "component.petition-approvals-card.start-approval-toast-description",
          defaultMessage: "The approval step <b>{stepName}</b> has been started",
        },
        {
          stepName,
        },
      ),
      status: "success",
      isClosable: true,
    });
  };

  const showStartPetitionApprovalFlowDialog = useStartPetitionApprovalFlowDialog();

  const [startPetitionApprovalRequestStep] = useMutation(
    useStartApprovalRequestStep_startPetitionApprovalRequestStepDocument,
  );

  const hasNotStartedApprovals =
    petition.__typename === "Petition" &&
    isNonNullish(petition.currentApprovalRequestSteps) &&
    petition.currentApprovalRequestSteps.some((s) => s.status === "NOT_STARTED") &&
    !petition.currentApprovalRequestSteps.some((s) => s.status === "PENDING");

  const handleStartApprovalFlow = useCallback(
    async (step?: PetitionApprovalsCard_PetitionApprovalRequestStepFragment) => {
      try {
        const nextStep =
          step ??
          (petition.__typename === "Petition"
            ? petition.currentApprovalRequestSteps?.find((s) => s.status === "NOT_STARTED")
            : undefined);

        assert(nextStep, "No step to start");

        const { message, attachments } = await showStartPetitionApprovalFlowDialog({
          step: nextStep,
        });

        if (
          petition.__typename === "Petition" &&
          isNonNullish(petition.currentApprovalRequestSteps) &&
          petition.currentApprovalRequestSteps.length > 0
        ) {
          await startPetitionApprovalRequestStep({
            variables: {
              petitionId: petition.id,
              attachments,
              message,
              approvalRequestStepId: nextStep.id,
            },
          });
          showStartApprovalToast(nextStep.stepName);
        }
      } catch (error) {
        if (!isDialogError(error)) {
          showGenericErrorToast(error);
        }
      }
    },
    [
      showStartPetitionApprovalFlowDialog,
      startPetitionApprovalRequestStep,
      showStartApprovalToast,
      petition,
    ],
  );

  return { handleStartApprovalFlow, hasNotStartedApprovals };
}

useStartApprovalRequestStep.fragments = {
  PetitionApprovalRequestStep: gql`
    fragment useStartApprovalRequestStep_PetitionApprovalRequestStep on PetitionApprovalRequestStep {
      id
      stepName
      status
      ...useStartPetitionApprovalFlowDialog_PetitionApprovalRequestStep
    }
    ${useStartPetitionApprovalFlowDialog.fragments.PetitionApprovalRequestStep}
  `,
  PetitionBase: gql`
    fragment useStartApprovalRequestStep_PetitionBase on PetitionBase {
      id
      ... on Petition {
        hasStartedProcess
        currentApprovalRequestStatus
        currentApprovalRequestSteps {
          ...useStartApprovalRequestStep_PetitionApprovalRequestStep
        }
      }
    }
  `,
};

const _mutations = [
  gql`
    mutation useStartApprovalRequestStep_startPetitionApprovalRequestStep(
      $petitionId: GID!
      $approvalRequestStepId: GID!
      $message: String
      $attachments: [Upload!]
    ) {
      startPetitionApprovalRequestStep(
        petitionId: $petitionId
        approvalRequestStepId: $approvalRequestStepId
        message: $message
        attachments: $attachments
      ) {
        id
        ...useStartApprovalRequestStep_PetitionApprovalRequestStep
        petition {
          ...useStartApprovalRequestStep_PetitionBase
        }
      }
    }
    ${useStartApprovalRequestStep.fragments.PetitionApprovalRequestStep}
    ${useStartApprovalRequestStep.fragments.PetitionBase}
  `,
];

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useToast } from "@chakra-ui/react";
import { isDialogError } from "@parallel/components/common/dialogs/DialogProvider";
import { useArchiveRepliesIntoProfileDialog } from "@parallel/components/petition-replies/dialogs/ArchiveRepliesIntoProfileDialog";
import { useClosePetitionDialog } from "@parallel/components/petition-replies/dialogs/ClosePetitionDialog";
import { useConfirmCancelOngoingApprovalsDialog } from "@parallel/components/petition-replies/dialogs/ConfirmCancelOngoingApprovalsDialog";
import { useConfirmCancelOngoingSignatureDialog } from "@parallel/components/petition-replies/dialogs/ConfirmCancelOngoingSignatureDialog";
import { useConfirmResendCompletedNotificationDialog } from "@parallel/components/petition-replies/dialogs/ConfirmResendCompletedNotificationDialog";
import { useSolveUnreviewedRepliesDialog } from "@parallel/components/petition-replies/dialogs/SolveUnreviewedRepliesDialog";
import {
  useClosePetition_approveOrRejectPetitionFieldRepliesDocument,
  useClosePetition_cancelPetitionApprovalRequestFlowDocument,
  useClosePetition_cancelSignatureRequestDocument,
  useClosePetition_closePetitionDocument,
  useClosePetition_PetitionBaseFragment,
  useClosePetition_sendPetitionClosedNotificationDocument,
  useClosePetition_updatePetitionDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { Maybe } from "@parallel/utils/types";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { assertTypename } from "../apollo/typename";

export interface useClosePetitionProps {
  onRefetch?: () => void;
}

export function useClosePetition({ onRefetch }: useClosePetitionProps) {
  const intl = useIntl();
  const toast = useToast();

  const [sendPetitionClosedNotification] = useMutation(
    useClosePetition_sendPetitionClosedNotificationDocument,
  );
  const [closePetition] = useMutation(useClosePetition_closePetitionDocument);
  const [approveOrRejectReplies] = useMutation(
    useClosePetition_approveOrRejectPetitionFieldRepliesDocument,
  );
  const [cancelPetitionApprovalRequestFlow] = useMutation(
    useClosePetition_cancelPetitionApprovalRequestFlowDocument,
  );
  const [cancelSignatureRequest] = useMutation(useClosePetition_cancelSignatureRequestDocument);
  const [updatePetition] = useMutation(useClosePetition_updatePetitionDocument);

  const showClosePetitionDialog = useClosePetitionDialog();
  const petitionAlreadyNotifiedDialog = useConfirmResendCompletedNotificationDialog();
  const showSolveUnreviewedRepliesDialog = useSolveUnreviewedRepliesDialog();
  const showConfirmCancelOngoingSignature = useConfirmCancelOngoingSignatureDialog();
  const showConfirmCancelOngoingApprovals = useConfirmCancelOngoingApprovalsDialog();
  const showArchiveRepliesIntoProfileDialog = useArchiveRepliesIntoProfileDialog();

  const handleFinishPetition = useCallback(
    async ({
      petition,
      hasLinkedToProfileTypeFields,
      requiredMessage,
    }: {
      petition: useClosePetition_PetitionBaseFragment;
      hasLinkedToProfileTypeFields: boolean;
      requiredMessage: boolean;
    }) => {
      assertTypename(petition, "Petition");
      const showToast = (includeDescription?: boolean) => {
        toast({
          title: intl.formatMessage({
            id: "page.replies.parallel-closed-toast-header",
            defaultMessage: "Parallel closed",
          }),
          description: includeDescription
            ? intl.formatMessage({
                id: "page.replies.parallel-closed-toast-description",
                defaultMessage: "The recipient has been notified.",
              })
            : undefined,
          status: "success" as const,
          duration: 3000,
          isClosable: true,
        });
      };

      let message: Maybe<RichTextEditorValue> = null;
      let pdfExportTitle: Maybe<string> = null;
      let attachPdfExport = false;

      try {
        const data = await showClosePetitionDialog({
          petition,
          hasLinkedToProfileTypeFields,
          requiredMessage,
        });

        message = data.message;
        pdfExportTitle = data.pdfExportTitle;
        attachPdfExport = data.attachPdfExport;

        if (message) {
          await sendPetitionClosedNotification({
            variables: {
              petitionId: petition.id,
              emailBody: message,
              attachPdfExport,
              pdfExportTitle,
            },
          });
        }
        showToast(!!message);
      } catch (error) {
        // rethrow error to avoid continuing the flow when a dialog error occurs
        if (isDialogError(error)) {
          throw error;
        }
        if (isApolloError(error, "ALREADY_NOTIFIED_PETITION_CLOSED_ERROR")) {
          await petitionAlreadyNotifiedDialog();
          await sendPetitionClosedNotification({
            variables: {
              petitionId: petition.id,
              emailBody: message,
              attachPdfExport,
              pdfExportTitle,
              force: true,
            },
          });
          showToast(!!message);
        }
      }
    },
    [
      intl,
      showClosePetitionDialog,
      sendPetitionClosedNotification,
      petitionAlreadyNotifiedDialog,
      toast,
    ],
  );

  /**
   * Main function that implements the complete petition closing process
   */
  const handleClosePetition = useCallback(
    async (petition: useClosePetition_PetitionBaseFragment) => {
      assertTypename(petition, "Petition");
      try {
        // Check pending signature
        const hasPendingSignature =
          (petition.currentSignatureRequest &&
            ["ENQUEUED", "PROCESSING", "PROCESSED"].includes(
              petition.currentSignatureRequest.status,
            )) ??
          false;

        const allFields = petition.fields.flatMap((f) => [f, ...(f.children ?? [])]);

        const hasLinkedToProfileTypeFields = allFields.some((f) => f.isLinkedToProfileTypeField);

        // Handle pending approvals
        if (petition.currentApprovalRequestStatus === "PENDING") {
          await showConfirmCancelOngoingApprovals();
          await cancelPetitionApprovalRequestFlow({
            variables: {
              petitionId: petition.id,
            },
          });
          onRefetch?.();
        }
        // Handle pending signature
        else if (hasPendingSignature) {
          await showConfirmCancelOngoingSignature();
          if (hasPendingSignature) {
            await cancelSignatureRequest({
              variables: {
                petitionSignatureRequestId: petition.currentSignatureRequest!.id,
              },
            });
          }
          await updatePetition({
            variables: {
              petitionId: petition.id,
              data: { signatureConfig: null },
            },
          });
          onRefetch?.();
        }

        // Check unreviewed replies
        const hasUnreviewedReplies = petition.fields.some((f: any) =>
          f.replies.some((r: any) => r.status === "PENDING" && f.requireApproval),
        );

        // Show dialog to solve unreviewed replies
        const option =
          petition.isReviewFlowEnabled && hasUnreviewedReplies
            ? await showSolveUnreviewedRepliesDialog()
            : "NOTHING";

        // Send closing notification
        await handleFinishPetition({
          petition,
          hasLinkedToProfileTypeFields,
          requiredMessage: false,
        });

        // Approve or reject pending replies
        if (hasUnreviewedReplies && option !== "NOTHING") {
          await approveOrRejectReplies({
            variables: {
              petitionId: petition.id,
              status: option === "APPROVE" ? "APPROVED" : "REJECTED",
            },
          });
        }

        // Close the petition
        await closePetition({
          variables: {
            petitionId: petition.id,
          },
        });

        // Handle associated profiles if needed
        if (hasLinkedToProfileTypeFields) {
          await showArchiveRepliesIntoProfileDialog({
            petitionId: petition.id,
            onRefetch: () => onRefetch?.(),
          });
        }

        onRefetch?.();
      } catch (error) {
        if (!isDialogError(error)) {
          throw error;
        }
      }
    },
    [
      approveOrRejectReplies,
      closePetition,
      handleFinishPetition,
      cancelSignatureRequest,
      cancelPetitionApprovalRequestFlow,
      updatePetition,
      showConfirmCancelOngoingApprovals,
      showConfirmCancelOngoingSignature,
      showSolveUnreviewedRepliesDialog,
      showArchiveRepliesIntoProfileDialog,
      onRefetch,
    ],
  );

  return {
    handleClosePetition,
  };
}

// GraphQL fragments to ensure all necessary data is available
const _fragments = {
  PetitionBase: gql`
    fragment useClosePetition_PetitionBase on PetitionBase {
      id
      ... on Petition {
        status
        isReviewFlowEnabled
        signatureConfig {
          review
        }
        fields {
          id
          isLinkedToProfileType
          isLinkedToProfileTypeField
          requireApproval
          replies {
            id
            status
          }
          children {
            id
            isLinkedToProfileTypeField
          }
        }
        currentSignatureRequest {
          id
          status
        }
        currentApprovalRequestStatus
        ...useClosePetitionDialog_Petition
      }
    }
  `,
};

// GraphQL Mutations
const _mutations = [
  gql`
    mutation useClosePetition_sendPetitionClosedNotification(
      $petitionId: GID!
      $emailBody: JSON!
      $attachPdfExport: Boolean!
      $pdfExportTitle: String
      $force: Boolean
    ) {
      sendPetitionClosedNotification(
        petitionId: $petitionId
        emailBody: $emailBody
        attachPdfExport: $attachPdfExport
        pdfExportTitle: $pdfExportTitle
        force: $force
      ) {
        id
      }
    }
  `,
  gql`
    mutation useClosePetition_closePetition($petitionId: GID!) {
      closePetition(petitionId: $petitionId) {
        id
        status
      }
    }
  `,
  gql`
    mutation useClosePetition_approveOrRejectPetitionFieldReplies(
      $petitionId: GID!
      $status: PetitionFieldReplyStatus!
    ) {
      approveOrRejectPetitionFieldReplies(petitionId: $petitionId, status: $status) {
        id
        status
      }
    }
  `,
  gql`
    mutation useClosePetition_cancelPetitionApprovalRequestFlow($petitionId: GID!) {
      cancelPetitionApprovalRequestFlow(petitionId: $petitionId) {
        id
        petition {
          id
          currentApprovalRequestStatus
        }
      }
    }
  `,
  gql`
    mutation useClosePetition_cancelSignatureRequest($petitionSignatureRequestId: GID!) {
      cancelSignatureRequest(petitionSignatureRequestId: $petitionSignatureRequestId) {
        id
        status
        petition {
          id
          hasStartedProcess
        }
      }
    }
  `,
  gql`
    mutation useClosePetition_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
      updatePetition(petitionId: $petitionId, data: $data) {
        id
      }
    }
  `,
];

import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Grid,
  GridItem,
  Heading,
  HStack,
  ListItem,
  MenuItem,
  MenuList,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  UnorderedList,
  useToast,
} from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import {
  AddIcon,
  AlertCircleIcon,
  BellIcon,
  ForbiddenIcon,
  SignatureIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionApprovalRequestStep,
  PetitionApprovalRequestStepStatus,
  PetitionApprovalsCard_approvePetitionApprovalRequestStepDocument,
  PetitionApprovalsCard_cancelPetitionApprovalRequestStepDocument,
  PetitionApprovalsCard_PetitionApprovalRequestStepApproverFragment,
  PetitionApprovalsCard_PetitionApprovalRequestStepFragment,
  PetitionApprovalsCard_petitionDocument,
  PetitionApprovalsCard_PetitionFragment,
  PetitionApprovalsCard_rejectPetitionApprovalRequestStepDocument,
  PetitionApprovalsCard_sendPetitionApprovalRequestStepReminderDocument,
  PetitionApprovalsCard_skipPetitionApprovalRequestStepDocument,
  PetitionApprovalsCard_UserFragment,
  PetitionStatus,
} from "@parallel/graphql/__types";
import { Fragments } from "@parallel/utils/apollo/fragments";
import { FORMATS } from "@parallel/utils/dates";
import { getPetitionSignatureEnvironment } from "@parallel/utils/getPetitionSignatureEnvironment";
import { getPetitionSignatureStatus } from "@parallel/utils/getPetitionSignatureStatus";
import { useStartApprovalRequestStep } from "@parallel/utils/hooks/useStartApprovalRequestStep";
import { Maybe, UnwrapArray } from "@parallel/utils/types";
import { useAddNewSignature } from "@parallel/utils/useAddNewSignature";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { usePageVisibility } from "@parallel/utils/usePageVisibility";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import { Fragment, useEffect, useRef, useState } from "react";
import { FormattedList, FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { Card } from "../common/Card";
import { Divider } from "../common/Divider";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { MoreOptionsMenuButton } from "../common/MoreOptionsMenuButton";
import { OverflownText } from "../common/OverflownText";
import { PetitionSignatureStatusIcon } from "../common/PetitionSignatureStatusIcon";
import { RestrictedFeaturePopover } from "../common/RestrictedFeaturePopover";
import { SmallPopover } from "../common/SmallPopover";
import { UserReference } from "../common/UserReference";
import { isDialogError } from "../common/dialogs/DialogProvider";
import { PetitionApprovalsAboutToStartAlert } from "./PetitionApprovalsAboutToStartAlert";
import { CommentsButton } from "./PetitionRepliesField";
import { PetitionSignaturesCard, PetitionSignaturesCardBody } from "./PetitionSignaturesCard";
import {
  ApproveOrRejectAction,
  useApproveOrRejectPetitionApprovalFlowDialog,
} from "./dialogs/ApproveOrRejectPetitionApprovalFlowDialog";
import { useConfirmCancelPetitionApprovalFlowDialog } from "./dialogs/ConfirmCancelPetitionApprovalFlowDialog";
import { useConfirmSendReminderPetitionApprovalFlowDialog } from "./dialogs/ConfirmSendReminderPetitionApprovalFlowDialog";
import { useConfirmSkipPetitionApprovalFlowDialog } from "./dialogs/ConfirmSkipPetitionApprovalFlowDialog";
import { useStartPetitionApprovalFlowDialog } from "./dialogs/StartPetitionApprovalFlowDialog";

interface PetitionApprovalsCardProps {
  petition: PetitionApprovalsCard_PetitionFragment;
  user: PetitionApprovalsCard_UserFragment;
  onToggleGeneralComments: () => void;
  onRefetchPetition: () => void;
  isShowingGeneralComments: boolean;
  isDisabled: boolean;
}

export const PetitionApprovalsCard = Object.assign(
  chakraForwardRef<"section", PetitionApprovalsCardProps>(function PetitionApprovalsCard(
    {
      petition,
      user,
      onToggleGeneralComments,
      onRefetchPetition,
      isShowingGeneralComments,
      isDisabled,
    },
    ref,
  ) {
    usePetitionApprovalsCardPolling(petition);
    const intl = useIntl();
    const toast = useToast();
    const tabsRefs = useMultipleRefs<HTMLButtonElement>();
    const approvalSteps =
      isNonNullish(petition.currentApprovalRequestSteps) &&
      petition.currentApprovalRequestSteps.length > 0
        ? petition.currentApprovalRequestSteps
        : (petition.approvalFlowConfig?.map((step, index) => {
            return {
              id: index.toString(),
              stepName: step.name,
              status: "NOT_STARTED",
              approvalType: step.type,
              approvers: step.approvers.map((approver, index) => ({
                id: index.toString(),
                user: approver,
              })),
              isMock: true,
            };
          }) ?? []);

    const [isParallelJustCompleted, setIsParallelJustCompleted] = useState(false);
    useTempQueryParam("completed", () => {
      setIsParallelJustCompleted(true);
    });

    const reviewAfterApproval =
      petition.signatureConfig?.reviewAfterApproval ??
      petition.currentSignatureRequest?.signatureConfig?.reviewAfterApproval ??
      false;

    const signatureStatus = isNonNullish(petition.currentSignatureRequest)
      ? petition.currentSignatureRequest.status === "COMPLETED"
        ? "APPROVED"
        : "PENDING"
      : "NOT_STARTED";

    const approvalStepsWithSignature = [
      ...(reviewAfterApproval ? approvalSteps : []),
      {
        id: "signature",
        stepName: "eSignature",
        status: !!petition.signatureConfig?.isEnabled
          ? reviewAfterApproval && petition.currentApprovalRequestStatus !== "APPROVED"
            ? "NOT_APPLICABLE"
            : signatureStatus
          : "APPROVED",
        approvalType: "ANY",
        approvers: [],
      },
      ...(!reviewAfterApproval ? approvalSteps : []),
    ] as PetitionApprovalRequestStep[];

    const pendingOrNotStartedStepIndex = approvalStepsWithSignature.findIndex(
      (s) => s.status === "PENDING" || s.status === "NOT_STARTED",
    );
    const [tabIndex, setTabIndex] = useState(
      pendingOrNotStartedStepIndex === -1
        ? approvalStepsWithSignature.findIndex((s) => s.id === "signature")
        : pendingOrNotStartedStepIndex,
    );
    const showGenericErrorToast = useGenericErrorToast();

    const signatureIndex = approvalStepsWithSignature.findIndex((step) => step.id === "signature");

    let currentSignatureRequest: Maybe<
      UnwrapArray<PetitionApprovalsCard_PetitionFragment["signatureRequests"]>
    > = petition.signatureRequests[0];
    if (
      petition.signatureConfig?.isEnabled &&
      isNonNullish(currentSignatureRequest) &&
      ["COMPLETED", "CANCELLING", "CANCELLED"].includes(currentSignatureRequest.status)
    ) {
      currentSignatureRequest = null;
    }

    const addNewSignature = useAddNewSignature({ petition });
    const handleAddNewSignature = async () => {
      await addNewSignature();
    };

    const showApprovedToast = (stepName: string) => {
      toast({
        description: intl.formatMessage(
          {
            id: "component.petition-approvals-card.approved-toast-title",
            defaultMessage: "<b>{stepName}</b> was approved successfully",
          },
          {
            stepName,
          },
        ),
        status: "success",
      });
    };

    const showRejectedToast = (stepName: string) => {
      toast({
        description: intl.formatMessage(
          {
            id: "component.petition-approvals-card.rejected-toast-description",
            defaultMessage: "<b>{stepName}</b> was rejected successfully",
          },
          {
            stepName,
          },
        ),
        status: "success",
      });
    };

    const showCanceledToast = (stepName: string) => {
      toast({
        description: intl.formatMessage(
          {
            id: "component.petition-approvals-card.canceled-toast-description",
            defaultMessage: "<b>{stepName}</b> was canceled successfully",
          },
          {
            stepName,
          },
        ),
        status: "success",
      });
    };

    const showReminderToast = (stepName: string) => {
      toast({
        description: intl.formatMessage(
          {
            id: "component.petition-approvals-card.reminder-toast-description",
            defaultMessage: "The reminder for <b>{stepName}</b> has been sent successfully",
          },
          {
            stepName,
          },
        ),
        status: "success",
        isClosable: true,
      });
    };

    const { handleStartApprovalFlow } = useStartApprovalRequestStep({ petition });

    const showConfirmCancelPetitionApprovalFlowDialog =
      useConfirmCancelPetitionApprovalFlowDialog();
    const [cancelPetitionApprovalRequestStep] = useMutation(
      PetitionApprovalsCard_cancelPetitionApprovalRequestStepDocument,
    );
    const handleCancelApprovalFlow = async (
      step: PetitionApprovalsCard_PetitionApprovalRequestStepFragment,
    ) => {
      try {
        await showConfirmCancelPetitionApprovalFlowDialog();
        await cancelPetitionApprovalRequestStep({
          variables: {
            petitionId: petition.id,
            approvalRequestStepId: step.id,
          },
        });
        showCanceledToast(step.stepName);
      } catch (error) {
        if (!isDialogError(error)) {
          showGenericErrorToast(error);
        }
      }
    };

    const showApproveOrRejectPetitionApprovalFlow = useApproveOrRejectPetitionApprovalFlowDialog();
    const [approvePetitionApprovalRequestStep] = useMutation(
      PetitionApprovalsCard_approvePetitionApprovalRequestStepDocument,
    );

    const [rejectPetitionApprovalRequestStep] = useMutation(
      PetitionApprovalsCard_rejectPetitionApprovalRequestStepDocument,
    );

    const handleApproveOrRejectApprovalFlow = async ({
      step,
      action,
    }: {
      step: PetitionApprovalsCard_PetitionApprovalRequestStepFragment;
      action: ApproveOrRejectAction;
    }) => {
      try {
        const res = await showApproveOrRejectPetitionApprovalFlow({
          action,
          stepName: step.stepName,
        });
        if (res.action === "APPROVE") {
          await approvePetitionApprovalRequestStep({
            variables: {
              petitionId: petition.id,
              message: res.message,
              attachments: res.attachments,
              approvalRequestStepId: step.id,
            },
          });
          showApprovedToast(step.stepName);
        } else {
          await rejectPetitionApprovalRequestStep({
            variables: {
              petitionId: petition.id,
              message: res.message,
              rejectionType: res.rejectionType,
              attachments: res.attachments,
              approvalRequestStepId: step.id,
            },
          });
          showRejectedToast(step.stepName);
        }
      } catch (error) {
        if (!isDialogError(error)) {
          showGenericErrorToast(error);
        }
      }
    };

    const showConfirmSkipPetitionApprovalFlowDialog = useConfirmSkipPetitionApprovalFlowDialog();
    const [skipPetitionApprovalRequestStep] = useMutation(
      PetitionApprovalsCard_skipPetitionApprovalRequestStepDocument,
    );
    const handleSkipApprovalFlow = async (
      step: PetitionApprovalsCard_PetitionApprovalRequestStepFragment,
    ) => {
      try {
        const message = await showConfirmSkipPetitionApprovalFlowDialog({
          modalProps: {
            finalFocusRef: tabsRefs[tabIndex],
          },
        });

        if (
          isNonNullish(petition.currentApprovalRequestSteps) &&
          petition.currentApprovalRequestSteps.length > 0
        ) {
          await skipPetitionApprovalRequestStep({
            variables: {
              petitionId: petition.id,
              message,
              approvalRequestStepId: step.id,
            },
          });
          showApprovedToast(step.stepName);
        }
      } catch (error) {
        if (!isDialogError(error)) {
          showGenericErrorToast(error);
        }
      }
    };

    const showConfirmSendReminderPetitionApprovalFlowDialog =
      useConfirmSendReminderPetitionApprovalFlowDialog();
    const [sendPetitionApprovalRequestStepReminder] = useMutation(
      PetitionApprovalsCard_sendPetitionApprovalRequestStepReminderDocument,
    );
    const handleSendReminder = async (
      step: PetitionApprovalsCard_PetitionApprovalRequestStepFragment,
    ) => {
      try {
        await showConfirmSendReminderPetitionApprovalFlowDialog();
        await sendPetitionApprovalRequestStepReminder({
          variables: {
            petitionId: petition.id,
            approvalRequestStepId: step.id,
          },
        });
        showReminderToast(step.stepName);
      } catch (error) {
        if (!isDialogError(error)) {
          showGenericErrorToast(error);
        }
      }
    };

    const checkIfNextOrCurrentStep = (
      steps: PetitionApprovalRequestStep[],
      currentStepId: string,
    ): boolean => {
      const stepIndex = steps.findIndex((step) => step.id === currentStepId);

      const step = steps[stepIndex];
      const prevStep =
        steps[stepIndex - 1]?.id === "signature" && steps[stepIndex - 1]?.status === "APPROVED"
          ? steps[stepIndex - 2]
          : steps[stepIndex - 1];

      return isNonNullish(prevStep)
        ? step?.status !== "NOT_STARTED" ||
            (step?.status === "NOT_STARTED" &&
              prevStep?.status !== "NOT_STARTED" &&
              prevStep?.status !== "PENDING" &&
              prevStep?.status !== "REJECTED")
        : true;
    };

    const petitionSignatureStatus = getPetitionSignatureStatus(petition);
    const petitionSignatureEnvironment = getPetitionSignatureEnvironment(petition);

    return (
      <>
        {isParallelJustCompleted && approvalSteps.some((s) => (s as any).isMock) ? (
          <PetitionApprovalsAboutToStartAlert marginBottom={2} borderRadius="md" />
        ) : null}
        <Card ref={ref} padding={0} marginBottom={4} data-section="signature-card">
          <Tabs index={tabIndex} onChange={(index) => setTabIndex(index)} variant="enclosed">
            <HStack spacing={0} overflowX="auto" overflowY="hidden">
              <TabList marginX="-1px" marginTop="-1px" height="52px" flex="1">
                {approvalStepsWithSignature.map((step, index) => {
                  const stepNotApplicable = step.status === "NOT_APPLICABLE";
                  const isNotCurrentOrNextStep =
                    checkIfNextOrCurrentStep(
                      approvalStepsWithSignature.filter((s) => s.status !== "NOT_APPLICABLE"),
                      step.id,
                    ) === false;

                  const tabColor =
                    stepNotApplicable || isNotCurrentOrNextStep ? "gray.400" : undefined;

                  return step.id === "signature" ? (
                    <Tab key={index} color={tabColor} ref={tabsRefs[index]}>
                      <HStack maxWidth="240px" minWidth={0}>
                        {petitionSignatureStatus === "NO_SIGNATURE" ? (
                          <SignatureIcon />
                        ) : (
                          <PetitionSignatureStatusIcon
                            status={petitionSignatureStatus}
                            environment={petitionSignatureEnvironment}
                            color={tabColor}
                          />
                        )}
                        <OverflownText whiteSpace="nowrap" fontWeight={500}>
                          <FormattedMessage id="generic.e-signature" defaultMessage="eSignature" />
                        </OverflownText>
                      </HStack>
                    </Tab>
                  ) : (
                    <Tab key={index} color={tabColor} ref={tabsRefs[index]}>
                      <HStack maxWidth="240px" minWidth={0}>
                        {stepNotApplicable ? (
                          <SmallPopover
                            content={
                              <Text fontSize="sm">
                                <FormattedMessage
                                  id="component.petition-approvals-card.conditioned-approval-poppover"
                                  defaultMessage="This approval step is conditioned by the replies."
                                />
                              </Text>
                            }
                          >
                            <ForbiddenIcon />
                          </SmallPopover>
                        ) : (
                          <PetitionApprovalStepStatusIconWithTooltip
                            status={step.status}
                            color={tabColor}
                          />
                        )}
                        <OverflownText whiteSpace="nowrap" fontWeight={500}>
                          {step.stepName}
                        </OverflownText>
                      </HStack>
                    </Tab>
                  );
                })}
              </TabList>
              <HStack
                paddingY={2}
                paddingX={4}
                borderBottom="1px solid"
                borderBottomColor="gray.200"
                height="52px"
              >
                <CommentsButton
                  data-action="see-general-comments"
                  isActive={isShowingGeneralComments}
                  commentCount={petition.generalCommentCount}
                  hasUnreadComments={petition.unreadGeneralCommentCount > 0}
                  onClick={onToggleGeneralComments}
                />
                {signatureIndex === tabIndex &&
                (!petition.signatureConfig?.isEnabled ||
                  currentSignatureRequest?.status === "COMPLETED" ||
                  currentSignatureRequest?.status === "CANCELLED") ? (
                  <IconButtonWithTooltip
                    isDisabled={isDisabled}
                    label={intl.formatMessage({
                      id: "component.petition-signatures-card.add-signature-label",
                      defaultMessage: "Add signature",
                    })}
                    size="sm"
                    icon={<AddIcon />}
                    onClick={handleAddNewSignature}
                  />
                ) : null}
              </HStack>
            </HStack>
            <TabPanels>
              {approvalStepsWithSignature.map((step, index) => {
                const stepNotApplicable = step.status === "NOT_APPLICABLE";
                const isNotCurrentOrNextStep =
                  checkIfNextOrCurrentStep(
                    approvalStepsWithSignature.filter((s) => s.status !== "NOT_APPLICABLE"),
                    step.id,
                  ) === false;

                return step.id === "signature" ? (
                  <TabPanel padding={0} key={index}>
                    <PetitionSignaturesCardBody
                      petition={petition}
                      user={user}
                      isDisabled={isDisabled || isNotCurrentOrNextStep || stepNotApplicable}
                      onRefetchPetition={onRefetchPetition}
                    />
                  </TabPanel>
                ) : (
                  <TabPanel padding={0} key={index}>
                    <Grid templateColumns="auto 1fr auto" alignItems="center">
                      <PetitionApprovalStepRow
                        step={step}
                        onStart={() => handleStartApprovalFlow(step)}
                        onApprove={() =>
                          handleApproveOrRejectApprovalFlow({ step, action: "APPROVE" })
                        }
                        onReject={() =>
                          handleApproveOrRejectApprovalFlow({ step, action: "REJECT" })
                        }
                        onCancel={() => handleCancelApprovalFlow(step)}
                        onSkip={() => handleSkipApprovalFlow(step)}
                        onSendReminder={() => handleSendReminder(step)}
                        isDisabled={
                          isDisabled ||
                          petition.status !== "COMPLETED" ||
                          isNotCurrentOrNextStep ||
                          stepNotApplicable ||
                          (step as any).isMock
                        }
                        petitionStatus={petition.status}
                      />
                    </Grid>
                    {petition.oldApprovalRequestSteps.length ? (
                      <Grid templateColumns="auto 1fr auto" alignItems="center">
                        <OlderPetitionApprovalStepRows steps={petition.oldApprovalRequestSteps} />
                      </Grid>
                    ) : null}
                  </TabPanel>
                );
              })}
            </TabPanels>
          </Tabs>
        </Card>
      </>
    );
  }),
  {
    fragments: {
      get PetitionApprovalRequestStepApprover() {
        return gql`
          fragment PetitionApprovalsCard_PetitionApprovalRequestStepApprover on PetitionApprovalRequestStepApprover {
            id
            approvedAt
            canceledAt
            rejectedAt
            sentAt
            skippedAt
            user {
              id
              isMe
              ...UserReference_User
            }
          }
          ${UserReference.fragments.User}
        `;
      },
      get PetitionApprovalRequestStep() {
        return gql`
          fragment PetitionApprovalsCard_PetitionApprovalRequestStep on PetitionApprovalRequestStep {
            id
            status
            stepName
            approvalType
            approvers {
              ...PetitionApprovalsCard_PetitionApprovalRequestStepApprover
            }
            ...useStartPetitionApprovalFlowDialog_PetitionApprovalRequestStep
          }
          ${this.PetitionApprovalRequestStepApprover}
          ${useStartPetitionApprovalFlowDialog.fragments.PetitionApprovalRequestStep}
        `;
      },
      get Petition() {
        return gql`
          fragment PetitionApprovalsCard_Petition on Petition {
            id
            status
            currentApprovalRequestStatus
            generalCommentCount
            unreadGeneralCommentCount
            currentSignatureRequest {
              id
              status
              signatureConfig {
                review
                reviewAfterApproval
              }
            }
            signatureConfig {
              isEnabled
              review
              reviewAfterApproval
            }
            signatureRequests {
              id
              status
            }
            currentApprovalRequestSteps {
              id
              ...PetitionApprovalsCard_PetitionApprovalRequestStep
            }
            oldApprovalRequestSteps {
              id
              ...PetitionApprovalsCard_PetitionApprovalRequestStep
            }
            approvalFlowConfig {
              ...Fragments_FullApprovalFlowConfig
              approvers {
                id
                isMe
                ...useStartPetitionApprovalFlowDialog_User
                ...UserReference_User
              }
            }
            ...PetitionSignaturesCard_Petition
            ...getPetitionSignatureStatus_Petition
            ...getPetitionSignatureEnvironment_Petition
            ...useStartApprovalRequestStep_PetitionBase
          }
          ${UserReference.fragments.User}
          ${Fragments.FullApprovalFlowConfig}
          ${PetitionSignaturesCard.fragments.Petition}
          ${useAddNewSignature.fragments.Petition}
          ${useStartPetitionApprovalFlowDialog.fragments.User}
          ${this.PetitionApprovalRequestStep}
          ${getPetitionSignatureStatus.fragments.Petition}
          ${getPetitionSignatureEnvironment.fragments.Petition}
          ${useStartApprovalRequestStep.fragments.PetitionBase}
        `;
      },
      get PetitionPolling() {
        return gql`
          fragment PetitionApprovalsCard_PetitionPolling on Petition {
            id
            status
            currentApprovalRequestStatus
            generalCommentCount
            unreadGeneralCommentCount
            currentSignatureRequest {
              id
              status
              signatureConfig {
                review
                reviewAfterApproval
              }
            }
            signatureConfig {
              isEnabled
              review
              reviewAfterApproval
            }
            signatureRequests {
              id
              status
            }
            approvalFlowConfig {
              ...Fragments_FullApprovalFlowConfig
              approvers {
                id
                isMe
                ...useStartPetitionApprovalFlowDialog_User
                ...UserReference_User
              }
            }
            currentApprovalRequestSteps {
              id
              ...PetitionApprovalsCard_PetitionApprovalRequestStep
            }
            ...PetitionSignaturesCard_PetitionPolling
            ...getPetitionSignatureStatus_Petition
            ...getPetitionSignatureEnvironment_Petition
            ...useStartApprovalRequestStep_PetitionBase
          }
          ${UserReference.fragments.User}
          ${Fragments.FullApprovalFlowConfig}
          ${PetitionSignaturesCard.fragments.PetitionPolling}
          ${useAddNewSignature.fragments.Petition}
          ${useStartPetitionApprovalFlowDialog.fragments.User}
          ${this.PetitionApprovalRequestStep}
          ${getPetitionSignatureStatus.fragments.Petition}
          ${getPetitionSignatureEnvironment.fragments.Petition}
          ${useStartApprovalRequestStep.fragments.PetitionBase}
        `;
      },
      get User() {
        return gql`
          fragment PetitionApprovalsCard_User on User {
            id
            ...PetitionSignaturesCard_User
            ...UserReference_User
          }
          ${PetitionSignaturesCard.fragments.User}
          ${UserReference.fragments.User}
        `;
      },
    },
  },
);

const _mutations = [
  gql`
    mutation PetitionApprovalsCard_cancelPetitionApprovalRequestStep(
      $petitionId: GID!
      $approvalRequestStepId: GID!
    ) {
      cancelPetitionApprovalRequestStep(
        petitionId: $petitionId
        approvalRequestStepId: $approvalRequestStepId
      ) {
        id
        ...PetitionApprovalsCard_PetitionApprovalRequestStep
        petition {
          id
          ...PetitionApprovalsCard_Petition
        }
      }
    }
    ${PetitionApprovalsCard.fragments.PetitionApprovalRequestStep}
    ${PetitionApprovalsCard.fragments.Petition}
  `,
  gql`
    mutation PetitionApprovalsCard_skipPetitionApprovalRequestStep(
      $petitionId: GID!
      $approvalRequestStepId: GID!
      $message: String!
    ) {
      skipPetitionApprovalRequestStep(
        petitionId: $petitionId
        approvalRequestStepId: $approvalRequestStepId
        message: $message
      ) {
        id
        ...PetitionApprovalsCard_PetitionApprovalRequestStep
        petition {
          id
          ...PetitionApprovalsCard_Petition
        }
      }
    }
    ${PetitionApprovalsCard.fragments.PetitionApprovalRequestStep}
    ${PetitionApprovalsCard.fragments.Petition}
  `,
  gql`
    mutation PetitionApprovalsCard_rejectPetitionApprovalRequestStep(
      $petitionId: GID!
      $approvalRequestStepId: GID!
      $message: String!
      $rejectionType: PetitionApprovalRequestStepRejectionType!
      $attachments: [Upload!]
    ) {
      rejectPetitionApprovalRequestStep(
        petitionId: $petitionId
        approvalRequestStepId: $approvalRequestStepId
        message: $message
        rejectionType: $rejectionType
        attachments: $attachments
      ) {
        id
        ...PetitionApprovalsCard_PetitionApprovalRequestStep
        petition {
          id
          ...PetitionApprovalsCard_Petition
        }
      }
    }
    ${PetitionApprovalsCard.fragments.PetitionApprovalRequestStep}
    ${PetitionApprovalsCard.fragments.Petition}
  `,
  gql`
    mutation PetitionApprovalsCard_approvePetitionApprovalRequestStep(
      $petitionId: GID!
      $approvalRequestStepId: GID!
      $message: String!
      $attachments: [Upload!]
    ) {
      approvePetitionApprovalRequestStep(
        petitionId: $petitionId
        approvalRequestStepId: $approvalRequestStepId
        message: $message
        attachments: $attachments
      ) {
        id
        ...PetitionApprovalsCard_PetitionApprovalRequestStep
        petition {
          id
          ...PetitionApprovalsCard_Petition
        }
      }
    }
    ${PetitionApprovalsCard.fragments.PetitionApprovalRequestStep}
    ${PetitionApprovalsCard.fragments.Petition}
  `,
  gql`
    mutation PetitionApprovalsCard_startPetitionApprovalRequestStep(
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
        ...PetitionApprovalsCard_PetitionApprovalRequestStep
        petition {
          id
          ...PetitionApprovalsCard_Petition
        }
      }
    }
    ${PetitionApprovalsCard.fragments.PetitionApprovalRequestStep}
    ${PetitionApprovalsCard.fragments.Petition}
  `,
  gql`
    mutation PetitionApprovalsCard_sendPetitionApprovalRequestStepReminder(
      $petitionId: GID!
      $approvalRequestStepId: GID!
    ) {
      sendPetitionApprovalRequestStepReminder(
        petitionId: $petitionId
        approvalRequestStepId: $approvalRequestStepId
      ) {
        id
        ...PetitionApprovalsCard_PetitionApprovalRequestStep
      }
    }
    ${PetitionApprovalsCard.fragments.PetitionApprovalRequestStep}
  `,
];

const _queries = [
  gql`
    query PetitionApprovalsCard_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        ...PetitionApprovalsCard_PetitionPolling
      }
    }
    ${PetitionApprovalsCard.fragments.PetitionPolling}
  `,
];

export function getApprovalStatusIcon(status: PetitionApprovalRequestStepStatus, color?: string) {
  switch (status) {
    case "APPROVED":
      return <ThumbsUpIcon color={color ?? "green.600"} />;
    case "PENDING":
      return <TimeIcon color={color ?? "yellow.600"} />;
    case "REJECTED":
    case "CANCELED":
      return <ThumbsDownIcon color={color ?? "red.600"} />;
    case "SKIPPED":
      return <AlertCircleIcon color={color ?? "green.600"} />;
    case "NOT_STARTED":
      return <TimeIcon color={color ?? "gray.600"} />;
    case "NOT_APPLICABLE":
      return <ForbiddenIcon color={color ?? "gray.600"} />;
    default:
      return null;
  }
}

function getApprovalStatusLabel(status: PetitionApprovalRequestStepStatus, intl: any) {
  switch (status) {
    case "APPROVED":
      return intl.formatMessage({
        id: "component.petition-approvals-step-status.approved",
        defaultMessage: "Approved",
      });
    case "PENDING":
      return intl.formatMessage({
        id: "component.petition-approvals-step-status.pending",
        defaultMessage: "Pending",
      });
    case "CANCELED":
      return intl.formatMessage({
        id: "component.petition-approvals-step-status.canceled",
        defaultMessage: "Canceled",
      });
    case "REJECTED":
      return intl.formatMessage({
        id: "component.petition-approvals-step-status.rejected",
        defaultMessage: "Rejected",
      });
    case "SKIPPED":
      return intl.formatMessage({
        id: "component.petition-approvals-step-status.approved-forced",
        defaultMessage: "Approved (forced)",
      });
    case "NOT_STARTED":
      return intl.formatMessage({
        id: "generic.not-started",
        defaultMessage: "Not started",
      });
    case "NOT_APPLICABLE":
      return intl.formatMessage({
        id: "component.petition-approvals-step-status.no-applicable",
        defaultMessage: "Not applicable",
      });
    default:
      return null;
  }
}

function getApprovalStatusColor(status: PetitionApprovalRequestStepStatus) {
  switch (status) {
    case "APPROVED":
      return "green.600";
    case "PENDING":
      return "yellow.600";
    case "CANCELED":
    case "REJECTED":
      return "red.600";
    case "SKIPPED":
      return "green.600";
    case "NOT_STARTED":
    case "NOT_APPLICABLE":
      return "gray.600";
    default:
      return undefined;
  }
}

function PetitionApprovalStepStatusIconWithTooltip({
  status,
  color,
}: {
  status: PetitionApprovalRequestStepStatus;
  color?: string;
}) {
  const intl = useIntl();
  const label = getApprovalStatusLabel(status, intl);

  return <Tooltip label={label}>{getApprovalStatusIcon(status, color)}</Tooltip>;
}

function PetitionApprovalStepStatus({
  status,
  omitHeading,
}: {
  status?: PetitionApprovalRequestStepStatus;
  omitHeading?: boolean;
}) {
  const intl = useIntl();
  const icon = getApprovalStatusIcon(status ?? "NOT_STARTED");
  const label = getApprovalStatusLabel(status ?? "NOT_STARTED", intl);
  const color = getApprovalStatusColor(status ?? "NOT_STARTED");
  return (
    <GridItem padding={2} paddingStart={4} height="100%">
      {omitHeading ? null : (
        <Heading size="xs" as="h4" paddingBottom={1}>
          <FormattedMessage id="component.petition-approvals-card.status" defaultMessage="Status" />
        </Heading>
      )}
      <Stack direction="row" display="inline-flex" alignItems="center" color={color}>
        {icon}
        <Text as="span" fontWeight={400}>
          {label}
        </Text>
      </Stack>
    </GridItem>
  );
}

function PetitionApprovalStepApprovers({
  step,
  omitHeading,
}: {
  step: PetitionApprovalsCard_PetitionApprovalRequestStepFragment;
  omitHeading?: boolean;
}) {
  const stepApprovers = omitHeading
    ? step.approvers.filter((approver) => {
        return step.status === "CANCELED" && isNonNullish(approver.canceledAt)
          ? true
          : step.status === "REJECTED" && isNonNullish(approver.rejectedAt)
            ? true
            : step.status === "APPROVED" && isNonNullish(approver.approvedAt)
              ? true
              : step.status === "SKIPPED" && isNonNullish(approver.skippedAt)
                ? true
                : false;
      })
    : step.approvers;

  return (
    <GridItem padding={2} height="100%">
      {omitHeading ? null : (
        <Heading size="xs" as="h4" paddingBottom={1}>
          <FormattedMessage
            id="component.petition-approvals-card.approvers"
            defaultMessage="Approvers ({approvalType, select, ANY{Any} other{All}})"
            values={{
              approvalType: step.approvalType,
            }}
          />
        </Heading>
      )}
      <Box flex="1">
        {stepApprovers.length ? (
          <FormattedList
            value={stepApprovers.map((approver, index) => {
              const hideIcon =
                step.approvalType === "ANY" &&
                ((step.status === "APPROVED" && isNullish(approver.approvedAt)) ||
                  (step.status === "SKIPPED" && isNullish(approver.skippedAt)));

              return (
                <Fragment key={index}>
                  <UserReference
                    user={approver.user}
                    as="span"
                    color="primary.600"
                    fontWeight={400}
                  />
                  {hideIcon ? null : <PetitionApprovalSignerStatusIcon approver={approver} />}
                </Fragment>
              );
            })}
          />
        ) : (
          <Text as="span" textStyle="hint">
            <FormattedMessage
              id="component.petition-approvals-card.no-approvers"
              defaultMessage="No approvers"
            />
          </Text>
        )}
      </Box>
    </GridItem>
  );
}

function PetitionApprovalSignerStatusIcon({
  approver: { approvedAt, canceledAt, rejectedAt, sentAt, skippedAt },
}: {
  approver: PetitionApprovalsCard_PetitionApprovalRequestStepApproverFragment;
}) {
  const intl = useIntl();
  return approvedAt || canceledAt || rejectedAt || sentAt || skippedAt ? (
    <SmallPopover
      width="auto"
      content={
        <UnorderedList>
          {approvedAt ? (
            <ListItem>
              <FormattedMessage
                id="component.petition-approvals-card.approved-at"
                defaultMessage="Approved: {date}"
                values={{
                  date: intl.formatDate(approvedAt, FORMATS["L+LT"]),
                }}
              />
            </ListItem>
          ) : null}
          {canceledAt ? (
            <ListItem>
              <FormattedMessage
                id="component.petition-approvals-card.canceled-at"
                defaultMessage="Canceled: {date}"
                values={{
                  date: intl.formatDate(canceledAt, FORMATS["L+LT"]),
                }}
              />
            </ListItem>
          ) : null}
          {rejectedAt ? (
            <ListItem>
              <FormattedMessage
                id="component.petition-approvals-card.rejected-at"
                defaultMessage="Rejected: {date}"
                values={{
                  date: intl.formatDate(rejectedAt, FORMATS["L+LT"]),
                }}
              />
            </ListItem>
          ) : null}
          {skippedAt ? (
            <ListItem>
              <FormattedMessage
                id="component.petition-approvals-card.skipped-at"
                defaultMessage="Forced aproval: {date}"
                values={{
                  date: intl.formatDate(skippedAt, FORMATS["L+LT"]),
                }}
              />
            </ListItem>
          ) : null}
          {sentAt ? (
            <ListItem>
              <FormattedMessage
                id="component.petition-approvals-card.sent-at"
                defaultMessage="Request sent: {date}"
                values={{
                  date: intl.formatDate(sentAt, FORMATS["L+LT"]),
                }}
              />
            </ListItem>
          ) : null}
        </UnorderedList>
      }
    >
      {approvedAt ? (
        <ThumbsUpIcon position="relative" marginStart={1} top="-1px" color="green.600" />
      ) : skippedAt ? (
        <AlertCircleIcon position="relative" marginStart={1} top="-1px" color="green.600" />
      ) : canceledAt || rejectedAt ? (
        <ThumbsDownIcon position="relative" marginStart={1} top="-1px" color="red.600" />
      ) : sentAt ? (
        <TimeIcon position="relative" marginStart={1} top="-1px" color="yellow.600" />
      ) : null}
    </SmallPopover>
  ) : null;
}

function PetitionApprovalStepRow({
  step,
  onStart,
  onCancel,
  onSkip,
  onSendReminder,
  onApprove,
  onReject,
  petitionStatus,
  isDisabled,
}: {
  step: PetitionApprovalsCard_PetitionApprovalRequestStepFragment;
  onStart: () => void;
  onCancel: () => void;
  onSkip: () => void;
  onSendReminder: () => void;
  onApprove: () => void;
  onReject: () => void;
  petitionStatus: PetitionStatus;
  isDisabled?: boolean;
}) {
  const intl = useIntl();
  const moreOptionsButtonRef = useRef<HTMLButtonElement>(null);
  const approver = step.approvers.find((a) => a.user?.isMe);
  const isApprover = isNonNullish(approver?.user) && approver.user.isMe;

  const isRejected = step.status === "REJECTED";
  const isApproved =
    step.status === "APPROVED" || (isApprover && isNonNullish(approver?.approvedAt));
  const isSkipped = step.status === "SKIPPED";

  return (
    <>
      <PetitionApprovalStepStatus status={step.status} />
      <PetitionApprovalStepApprovers step={step} />
      <GridItem padding={2} paddingEnd={4} marginStart="auto">
        {step.status === "NOT_APPLICABLE" ? null : step.status === "NOT_STARTED" ? (
          <HStack>
            <RestrictedFeaturePopover
              isRestricted={petitionStatus !== "COMPLETED"}
              popoverWidth="auto"
              content={
                <FormattedMessage
                  id="component.petition-approvals-card.petition-status-not-completed"
                  defaultMessage="Complete the parallel to activate this action"
                />
              }
            >
              <Button colorScheme="primary" onClick={onStart} isDisabled={isDisabled}>
                <FormattedMessage
                  id="component.petition-approvals-card.request-approval"
                  defaultMessage="Request approval"
                />
              </Button>
            </RestrictedFeaturePopover>

            <MoreOptionsMenuButton
              ref={moreOptionsButtonRef}
              isDisabled={isDisabled}
              variant="outline"
              options={
                <MenuList minWidth="160px">
                  <MenuItem onClick={onSkip}>
                    <FormattedMessage
                      id="component.petition-approvals-card.force-approval"
                      defaultMessage="Force approval"
                    />
                  </MenuItem>
                </MenuList>
              }
            />
          </HStack>
        ) : isApprover ? (
          <HStack>
            <Button
              leftIcon={<ThumbsUpIcon />}
              onClick={onApprove}
              isDisabled={isApproved || isSkipped || isRejected || isDisabled}
              colorScheme={isApproved || isSkipped ? "green" : undefined}
            >
              <FormattedMessage id="generic.approve" defaultMessage="Approve" />
            </Button>
            <Button
              leftIcon={<ThumbsDownIcon />}
              onClick={onReject}
              isDisabled={isApproved || isSkipped || isRejected || isDisabled}
              colorScheme={isRejected ? "red" : undefined}
            >
              <FormattedMessage id="generic.reject" defaultMessage="Reject" />
            </Button>
          </HStack>
        ) : (
          <HStack>
            <IconButtonWithTooltip
              icon={<BellIcon boxSize={5} />}
              label={intl.formatMessage({
                id: "component.petition-approvals-card.send-reminder",
                defaultMessage: "Send reminder",
              })}
              onClick={onSendReminder}
              isDisabled={isDisabled}
            />
            <MoreOptionsMenuButton
              isDisabled={isDisabled}
              variant="outline"
              options={
                <MenuList minWidth="160px">
                  <MenuItem onClick={onSkip}>
                    <FormattedMessage
                      id="component.petition-approvals-card.force-approval"
                      defaultMessage="Force approval"
                    />
                  </MenuItem>
                  <MenuItem onClick={onCancel} color="red.600">
                    <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
                  </MenuItem>
                </MenuList>
              }
            />
          </HStack>
        )}
      </GridItem>
    </>
  );
}

function OlderPetitionApprovalStepRows({
  steps,
}: {
  steps: PetitionApprovalsCard_PetitionApprovalRequestStepFragment[];
}) {
  return (
    <>
      <GridItem colSpan={3}>
        <Divider />
        <Box paddingY={2} paddingX={4}>
          <Heading size="xs">
            <FormattedMessage
              id="component.petition-approvals-card.previous-approvals"
              defaultMessage="Previous approvals"
            />
          </Heading>
        </Box>
        <Divider />
      </GridItem>
      {steps.map((step, i) => (
        <Fragment key={i}>
          <PetitionApprovalStepStatus status={step.status} omitHeading />
          <PetitionApprovalStepApprovers step={step} omitHeading />
          <Box paddingX={4}>
            <Text as="span" fontWeight={500}>
              {step.stepName}
            </Text>
          </Box>
        </Fragment>
      ))}
    </>
  );
}

const POLL_INTERVAL = 30_000;

function usePetitionApprovalsCardPolling(petition: PetitionApprovalsCard_PetitionFragment) {
  const current = petition.signatureRequests.at(0);
  const isPageVisible = usePageVisibility();
  const { startPolling, stopPolling } = useQuery(PetitionApprovalsCard_petitionDocument, {
    pollInterval: POLL_INTERVAL,
    variables: { petitionId: petition.id },
    skip: !isPageVisible || (isNullish(petition?.signatureConfig) && isNullish(current)),
  });

  useEffect(() => {
    if (current && current.status !== "CANCELLED" && isNullish(current.auditTrailFilename)) {
      startPolling(POLL_INTERVAL);
    } else if (
      (current?.status === "COMPLETED" && isNonNullish(current.auditTrailFilename)) ||
      current?.status === "CANCELLED"
    ) {
      stopPolling();
    }

    return stopPolling;
  }, [current?.status, current?.auditTrailFilename]);
}

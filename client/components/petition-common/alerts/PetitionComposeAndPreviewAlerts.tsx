import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertProps,
  Box,
  Button,
  Flex,
  HStack,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { TimeIcon } from "@parallel/chakra/icons";
import { ButtonWithMoreOptions } from "@parallel/components/common/ButtonWithMoreOptions";
import {
  PetitionApprovalRequestStatus,
  PetitionSignatureStatusFilter,
  PetitionStatus,
} from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

export interface PetitionComposeAlertsProps {
  petitionStatus: PetitionStatus;
  signatureStatus: PetitionSignatureStatusFilter;
  approvalsStatus: PetitionApprovalRequestStatus;
  hasNotStartedApprovals?: boolean;
  signatureAfterApprovals?: boolean | null;
  onStartSignature: () => void;
  onStartApprovals: () => void;
  onCancelApprovals: () => void;
  onClosePetition: () => void;
  onCancelSignature: () => void;
}

export function PetitionComposeAndPreviewAlerts({
  petitionStatus,
  signatureStatus,
  approvalsStatus,
  hasNotStartedApprovals = false,
  signatureAfterApprovals = false,
  onStartSignature,
  onStartApprovals,
  onCancelApprovals,
  onClosePetition,
  onCancelSignature,
}: PetitionComposeAlertsProps) {
  const showSignatureAlert = petitionStatus === "COMPLETED" && signatureStatus === "PROCESSING";

  const showApprovalsAlert = approvalsStatus === "PENDING";

  const showApprovalsRejectedAlert = approvalsStatus === "REJECTED";

  return (
    <>
      {petitionStatus === "CLOSED" ? (
        <PetitionClosedAlert />
      ) : showSignatureAlert ? (
        <PetitionSignatureSentAlert onCancelSignature={onCancelSignature} />
      ) : showApprovalsAlert ? (
        <PetitionApprovalsAlert
          onStartApprovals={onStartApprovals}
          onCancelApprovals={onCancelApprovals}
          hasNotStartedApprovals={hasNotStartedApprovals}
        />
      ) : showApprovalsRejectedAlert ? (
        <PetitionApprovalsDefinitiveRejectedAlert
          onClosePetition={onClosePetition}
          onCancelApprovals={onCancelApprovals}
        />
      ) : petitionStatus === "COMPLETED" ? (
        <PetitionCompletedAlert
          onStartSignature={onStartSignature}
          onStartApprovals={onStartApprovals}
          onClosePetition={onClosePetition}
          onCancelApprovals={onCancelApprovals}
          signatureStatus={signatureStatus}
          approvalsStatus={approvalsStatus}
          signatureAfterApprovals={signatureAfterApprovals ?? false}
        />
      ) : null}
    </>
  );
}

interface PetitionApprovalsAlertProps extends AlertProps {
  onStartApprovals: () => void;
  onCancelApprovals: () => void;
  hasNotStartedApprovals: boolean;
}

function PetitionApprovalsAlert({
  onStartApprovals,
  onCancelApprovals,
  hasNotStartedApprovals,
  ...props
}: PetitionApprovalsAlertProps) {
  return (
    <Alert status="warning" {...props}>
      <AlertIcon as={TimeIcon} color="orange.600" />
      <Flex flexDirection={{ base: "column", md: "row" }} gap={2} flex={1} justify="space-between">
        <AlertDescription>
          <Text>
            <FormattedMessage
              id="component.petition-approvals-alert.approvals-in-progress"
              defaultMessage="<b>There is an ongoing approval process.</b>"
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.petition-approvals-alert.cancel-approvals-instructions"
              defaultMessage="If you need to change something, cancel the approvals first."
            />
          </Text>
        </AlertDescription>
        <Box alignSelf={{ base: "flex-start", md: "center" }}>
          {hasNotStartedApprovals ? (
            <ButtonWithMoreOptions
              backgroundColor="white"
              moreOptionsButtonProps={{
                backgroundColor: "white",
              }}
              onClick={onStartApprovals}
              options={
                <MenuList minWidth="fit-content">
                  <MenuItem onClick={onCancelApprovals}>
                    <FormattedMessage
                      id="component.petition-approvals-alert.cancel-approvals"
                      defaultMessage="Cancel approvals"
                    />
                  </MenuItem>
                </MenuList>
              }
            >
              <FormattedMessage
                id="component.petition-approvals-alert.start-approval"
                defaultMessage="Start approval"
              />
            </ButtonWithMoreOptions>
          ) : (
            <Button colorScheme="red" onClick={onCancelApprovals}>
              <FormattedMessage
                id="component.petition-approvals-alert.cancel-approvals"
                defaultMessage="Cancel approvals"
              />
            </Button>
          )}
        </Box>
      </Flex>
    </Alert>
  );
}

interface PetitionSignatureSentAlertProps extends AlertProps {
  onCancelSignature: () => void;
}

function PetitionSignatureSentAlert({
  onCancelSignature,
  ...props
}: PetitionSignatureSentAlertProps) {
  return (
    <Alert status="warning" {...props}>
      <AlertIcon as={TimeIcon} color="orange.600" />
      <Flex flexDirection={{ base: "column", md: "row" }} gap={2} flex={1} justify="space-between">
        <AlertDescription>
          <Text>
            <FormattedMessage
              id="component.petition-signature-sent-alert.signature-sent"
              defaultMessage="<b>Parallel sent to sign</b>"
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.petition-signature-sent-alert.signature-sent-description"
              defaultMessage="If you need to change anything, cancel the signature first."
            />
          </Text>
        </AlertDescription>
        <Box alignSelf={{ base: "flex-start", md: "center" }}>
          <Button colorScheme="red" onClick={onCancelSignature}>
            <FormattedMessage
              id="component.petition-signature-sent-alert.cancel-signature"
              defaultMessage="Cancel signature"
            />
          </Button>
        </Box>
      </Flex>
    </Alert>
  );
}

interface PetitionCompletedAlertProps extends AlertProps {
  onStartApprovals: () => void;
  onStartSignature: () => void;
  onClosePetition: () => void;
  onCancelApprovals: () => void;
  signatureStatus: PetitionSignatureStatusFilter;
  approvalsStatus: PetitionApprovalRequestStatus;
  signatureAfterApprovals?: boolean;
}

function PetitionCompletedAlert({
  onStartApprovals,
  onStartSignature,
  onClosePetition,
  onCancelApprovals,
  signatureStatus,
  approvalsStatus,
  signatureAfterApprovals,
  ...props
}: PetitionCompletedAlertProps) {
  const showStartSignatureButton = signatureAfterApprovals
    ? approvalsStatus === "APPROVED" &&
      (signatureStatus === "NOT_STARTED" || signatureStatus === "PENDING_START")
    : signatureStatus === "NOT_STARTED" || signatureStatus === "PENDING_START";

  const showStartApprovalsButton = !showStartSignatureButton && approvalsStatus === "NOT_STARTED";

  const showClosePetitionButton = !showStartSignatureButton && !showStartApprovalsButton;
  return (
    <Alert status="success" {...props}>
      <AlertIcon />
      <HStack justifyContent="space-between" flex="1">
        <AlertDescription>
          {approvalsStatus === "APPROVED" && signatureStatus === "COMPLETED" ? (
            <FormattedMessage
              id="component.petition-completed-alert.description-signed-and-approved"
              defaultMessage="<b>Parallel completed, signed and approved</b>, if you want to make any changes, you must cancel the approval process."
            />
          ) : approvalsStatus === "APPROVED" ? (
            <FormattedMessage
              id="component.petition-completed-alert.description-approved"
              defaultMessage="<b>Parallel completed and approved</b>, if you want to make any changes, you must cancel the approval process."
            />
          ) : signatureStatus === "COMPLETED" ? (
            <FormattedMessage
              id="component.petition-completed-alert.description-signed"
              defaultMessage="<b>Parallel completed and signed</b>, if you make any changes, the parallel must be <b>finalized and signed again</b>."
            />
          ) : (
            <FormattedMessage
              id="component.petition-completed-alert.description"
              defaultMessage="<b>Parallel completed</b>, if you make any changes, the parallel must be <b>finalized again</b>."
            />
          )}
        </AlertDescription>
        <Box>
          {showStartApprovalsButton ? (
            <Button onClick={onStartApprovals} colorScheme="primary">
              <FormattedMessage
                id="component.petition-completed-alert.start-approvals"
                defaultMessage="Start approvals"
              />
            </Button>
          ) : null}

          {showStartSignatureButton && approvalsStatus === "APPROVED" ? (
            <ButtonWithMoreOptions
              colorScheme="primary"
              onClick={onStartSignature}
              options={
                <MenuList minWidth="fit-content">
                  <MenuItem onClick={onCancelApprovals}>
                    <FormattedMessage
                      id="component.petition-approvals-alert.cancel-approvals"
                      defaultMessage="Cancel approvals"
                    />
                  </MenuItem>
                </MenuList>
              }
            >
              <FormattedMessage id="generic.start-signature" defaultMessage="Start signature" />
            </ButtonWithMoreOptions>
          ) : showStartSignatureButton ? (
            <Button onClick={onStartSignature} colorScheme="primary">
              <FormattedMessage id="generic.start-signature" defaultMessage="Start signature" />
            </Button>
          ) : null}

          {showClosePetitionButton && approvalsStatus === "APPROVED" ? (
            <ButtonWithMoreOptions
              colorScheme="primary"
              onClick={onClosePetition}
              options={
                <MenuList minWidth="fit-content">
                  <MenuItem onClick={onCancelApprovals}>
                    <FormattedMessage
                      id="component.petition-approvals-alert.cancel-approvals"
                      defaultMessage="Cancel approvals"
                    />
                  </MenuItem>
                </MenuList>
              }
            >
              <FormattedMessage id="generic.close-petition" defaultMessage="Close parallel" />
            </ButtonWithMoreOptions>
          ) : showClosePetitionButton ? (
            <Button onClick={onClosePetition} colorScheme="primary">
              <FormattedMessage id="generic.close-petition" defaultMessage="Close parallel" />
            </Button>
          ) : null}
        </Box>
      </HStack>
    </Alert>
  );
}

interface PetitionApprovalsDefinitiveRejectedAlertProps extends AlertProps {
  onClosePetition: () => void;
  onCancelApprovals: () => void;
}

function PetitionApprovalsDefinitiveRejectedAlert({
  onClosePetition,
  onCancelApprovals,
  ...props
}: PetitionApprovalsDefinitiveRejectedAlertProps) {
  return (
    <Alert status="warning" {...props}>
      <AlertIcon />
      <HStack justifyContent="space-between" flex="1">
        <AlertDescription>
          <FormattedMessage
            id="component.petition-approvals-definitive-rejected-alert.description"
            defaultMessage="This parallel has a <b>final rejected approval</b> process and cannot be edited."
          />
        </AlertDescription>
        <Box>
          <ButtonWithMoreOptions
            backgroundColor="white"
            moreOptionsButtonProps={{
              backgroundColor: "white",
            }}
            onClick={onClosePetition}
            options={
              <MenuList minWidth="fit-content">
                <MenuItem onClick={onCancelApprovals}>
                  <FormattedMessage
                    id="component.petition-compose-and-preview-alerts.restart-approvals"
                    defaultMessage="Restart approvals"
                  />
                </MenuItem>
              </MenuList>
            }
          >
            <FormattedMessage id="generic.close-petition" defaultMessage="Close parallel" />
          </ButtonWithMoreOptions>
        </Box>
      </HStack>
    </Alert>
  );
}

function PetitionClosedAlert(props: AlertProps) {
  return (
    <Alert status="success" {...props}>
      <AlertIcon />
      <AlertDescription>
        <FormattedMessage
          id="component.petition-closed-alert.description"
          defaultMessage="<b>Parallel closed</b>, if you want to make any changes, reopen the parallel."
        />
      </AlertDescription>
    </Alert>
  );
}

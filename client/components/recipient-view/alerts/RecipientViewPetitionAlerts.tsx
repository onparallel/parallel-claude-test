import { gql } from "@apollo/client";
import { Alert, AlertDescription, AlertIcon, Box, Flex } from "@chakra-ui/react";
import { TimeIcon } from "@parallel/chakra/icons";
import { CloseableAlert } from "@parallel/components/common/CloseableAlert";
import { ContactListPopover } from "@parallel/components/common/ContactListPopover";
import {
  PetitionApprovalRequestStatus,
  PetitionSignatureStatusFilter,
  PetitionStatus,
  RecipientViewPetitionAlerts_PublicSignatureConfigFragment,
  RecipientViewSignatureSentAlert_PublicSignatureConfigFragment,
  Tone,
} from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { Button, Text } from "@parallel/components/ui";

interface RecipientViewPetitionAlertsProps {
  tone: Tone;
  currentApprovalRequestStatus: PetitionApprovalRequestStatus;
  petitionStatus: PetitionStatus;
  signatureStatus: PetitionSignatureStatusFilter;
  signatureConfig?: Maybe<RecipientViewPetitionAlerts_PublicSignatureConfigFragment>;
  granterFullName?: string;
  onCheckSignatureStatus: () => void;
  onContact: () => void;
}

export function RecipientViewPetitionAlerts({
  tone,
  currentApprovalRequestStatus,
  petitionStatus,
  signatureStatus,
  granterFullName,
  signatureConfig,
  onContact,
  onCheckSignatureStatus,
}: RecipientViewPetitionAlertsProps) {
  return (
    <>
      {petitionStatus !== "CLOSED" &&
      (currentApprovalRequestStatus === "PENDING" ||
        currentApprovalRequestStatus === "APPROVED" ||
        currentApprovalRequestStatus === "REJECTED") ? (
        <RecipientViewPetitionApprovalsAlert
          tone={tone}
          currentApprovalRequestStatus={currentApprovalRequestStatus}
        />
      ) : ["COMPLETED", "CLOSED"].includes(petitionStatus) && signatureStatus !== "PROCESSING" ? (
        <RecipientViewPetitionStatusAlert
          petitionStatus={petitionStatus}
          signatureStatus={signatureStatus}
          granterFullName={granterFullName}
          tone={tone}
          onContact={onContact}
        />
      ) : signatureStatus === "PROCESSING" ? (
        <RecipientViewSignatureSentAlert
          signatureConfig={signatureConfig}
          signatureStatus={signatureStatus}
          tone={tone}
          onCheckSignatureStatus={onCheckSignatureStatus}
        />
      ) : null}
    </>
  );
}

const _fragmentsRecipientViewPetitionAlerts = {
  PublicSignatureConfig: gql`
    fragment RecipientViewPetitionAlerts_PublicSignatureConfig on PublicSignatureConfig {
      ...RecipientViewSignatureSentAlert_PublicSignatureConfig
    }
  `,
};

interface RecipientViewPetitionApprovalsAlertProps {
  tone: Tone;
  currentApprovalRequestStatus: PetitionApprovalRequestStatus;
}

function RecipientViewPetitionApprovalsAlert({
  tone,
  currentApprovalRequestStatus,
}: RecipientViewPetitionApprovalsAlertProps) {
  return currentApprovalRequestStatus === "PENDING" ? (
    <Alert status="warning" zIndex={2} paddingX={6}>
      <AlertIcon as={TimeIcon} color="orange.600" />
      <AlertDescription flex="1">
        <Text>
          <FormattedMessage
            id="component.recipient-view-petition-approvals-alert.alert-description-1"
            defaultMessage="<b>Your information is being reviewed.</b> During this process, you will not be able to make changes."
            values={{
              tone,
            }}
          />
        </Text>
        <Text>
          <FormattedMessage
            id="component.recipient-view-petition-approvals-alert.alert-description-2"
            defaultMessage="If you need to correct anything, you can write to us through the enabled comments."
            values={{ tone }}
          />
        </Text>
      </AlertDescription>
    </Alert>
  ) : currentApprovalRequestStatus === "APPROVED" || currentApprovalRequestStatus === "REJECTED" ? (
    <Alert status="success" zIndex={2} paddingX={6}>
      <AlertIcon />
      <AlertDescription flex="1">
        <Text>
          <FormattedMessage
            id="component.recipient-view-petition-approvals-alert.alert-description-3"
            defaultMessage="Your process has been <b>reviewed and finalised.</b>"
            values={{ tone }}
          />
        </Text>
        <Text>
          <FormattedMessage
            id="component.recipient-view-petition-approvals-alert.alert-description-4"
            defaultMessage="If you need more information or have any questions, please write to us in the comments."
            values={{ tone }}
          />
        </Text>
      </AlertDescription>
    </Alert>
  ) : null;
}

interface RecipientViewPetitionStatusAlertProps {
  petitionStatus: PetitionStatus;
  signatureStatus: PetitionSignatureStatusFilter;
  granterFullName?: string;
  tone: Tone;
  onContact: () => void;
}

export function RecipientViewPetitionStatusAlert({
  petitionStatus,
  signatureStatus,
  granterFullName,
  tone,
  onContact,
}: RecipientViewPetitionStatusAlertProps) {
  const intl = useIntl();

  const name = isNonNullish(granterFullName) ? (
    <b>{granterFullName}</b>
  ) : (
    <i>
      {intl.formatMessage({
        id: "generic.deleted-user",
        defaultMessage: "Deleted user",
      })}
    </i>
  );

  return petitionStatus === "COMPLETED" ? (
    <CloseableAlert status="success" zIndex={2} paddingX={6}>
      <AlertIcon />
      <AlertDescription flex="1">
        <Text>
          {signatureStatus === "COMPLETED" ? (
            <FormattedMessage
              id="component.recipient-view-petition-status-alert.petition-and-signature-completed-alert-1"
              defaultMessage="<b>Information and signature completed!</b>"
            />
          ) : (
            <FormattedMessage
              id="component.recipient-view-petition-status-alert.petition-completed-alert-1"
              defaultMessage="<b>Information completed!</b>"
            />
          )}
        </Text>
        <Text>
          <FormattedMessage
            id="component.recipient-view-petition-status-alert.petition-completed-alert-2"
            defaultMessage="If you make any changes, don't forget to hit the <b>Finalize</b> button again."
            values={{ tone }}
          />
        </Text>
      </AlertDescription>
    </CloseableAlert>
  ) : (
    <Alert status="success" zIndex={2} paddingX={6}>
      <AlertIcon />
      <Flex
        flexDirection={{ base: "column", sm: "row" }}
        justifyContent="space-between"
        flex="1"
        gap={{ base: 4, sm: 2 }}
        alignItems="center"
      >
        <AlertDescription>
          <FormattedMessage
            id="component.recipient-view-petition-status-alert.petition-closed-alert"
            defaultMessage="This process has been completed. If you need to make any changes, please reach out to {name}."
            values={{
              name,
            }}
          />
        </AlertDescription>
        <Box alignSelf={{ base: "flex-start", sm: "center" }}>
          <Button backgroundColor="white" onClick={onContact}>
            <FormattedMessage id="generic.contact" defaultMessage="Contact" />
          </Button>
        </Box>
      </Flex>
    </Alert>
  );
}

interface RecipientViewSignatureSentAlertProps {
  signatureConfig?: Maybe<RecipientViewSignatureSentAlert_PublicSignatureConfigFragment>;
  signatureStatus: PetitionSignatureStatusFilter;
  tone: Tone;
  onCheckSignatureStatus: () => void;
}

function RecipientViewSignatureSentAlert({
  signatureConfig,
  signatureStatus,
  tone,
  onCheckSignatureStatus,
}: RecipientViewSignatureSentAlertProps) {
  const signers = signatureConfig?.signers ?? [];
  const totalSigners = (signatureConfig?.additionalSigners ?? []).concat(signers);
  const isPendingStart = signatureStatus === "PENDING_START";
  return (
    <Alert status={isPendingStart ? "warning" : "success"} zIndex={2} paddingX={6}>
      <Flex
        alignItems={{ base: "end", md: "center" }}
        justifyContent="flex-start"
        marginX="auto"
        width="100%"
        flexDirection={{ base: "column", md: "row" }}
        gap={{ base: 2, md: 6 }}
      >
        <Flex alignItems={{ base: "start", md: "center" }} flex="1">
          <AlertIcon />
          <AlertDescription>
            {isPendingStart ? (
              <Text>
                <FormattedMessage
                  id="component.signature-sent-alert.petition-requires-signature-alert-1"
                  defaultMessage="<b>eSignature pending</b>, we will send the document to sign after the information is reviewed."
                  values={{ tone }}
                />
              </Text>
            ) : (
              <>
                <Text as="span">
                  {signatureConfig?.signingMode === "SEQUENTIAL" ? (
                    <FormattedMessage
                      id="component.signature-sent-alert.petition-signature-request-sent-alert-sequential"
                      defaultMessage="<b>Document sent for signature</b> to {name} ({email}){count, plural, =0{} other{, <a># more</a> will receive the document after the one before has signed}}."
                      values={{
                        a: (chunks: any) => (
                          <ContactListPopover contacts={totalSigners.slice(1)}>
                            <Text
                              display="initial"
                              textDecoration="underline"
                              color="primary.600"
                              cursor="pointer"
                              as="span"
                            >
                              {chunks}
                            </Text>
                          </ContactListPopover>
                        ),

                        name: totalSigners[0]!.fullName,
                        email: totalSigners[0]!.email,
                        count: totalSigners.length - 1,
                      }}
                    />
                  ) : (
                    <FormattedMessage
                      id="component.signature-sent-alert.petition-signature-request-sent-alert"
                      defaultMessage="<b>Document sent for signature</b> to {name} ({email}){count, plural, =0{} other{ and <a># more</a>}}."
                      values={{
                        a: (chunks: any) => (
                          <ContactListPopover contacts={totalSigners.slice(1)}>
                            <Text
                              display="initial"
                              textDecoration="underline"
                              color="primary.600"
                              cursor="pointer"
                              as="span"
                            >
                              {chunks}
                            </Text>
                          </ContactListPopover>
                        ),

                        name: totalSigners[0]!.fullName,
                        email: totalSigners[0]!.email,
                        count: totalSigners.length - 1,
                      }}
                    />
                  )}
                </Text>
                <Text>
                  <FormattedMessage
                    id="component.signature-sent-alert.petition-signature-request-sent-alert-2"
                    defaultMessage="If you need to make any changes, you can write us through the comments."
                    values={{ tone }}
                  />
                </Text>
              </>
            )}
          </AlertDescription>
        </Flex>
        {!isPendingStart && (
          <Box>
            <Button marginStart="auto" onClick={onCheckSignatureStatus} background="white">
              <FormattedMessage
                id="component.recipient-view-signature-sent-alert.check-status-button"
                defaultMessage="Check status"
              />
            </Button>
          </Box>
        )}
      </Flex>
    </Alert>
  );
}

const _fragmentsRecipientViewSignatureSentAlert = {
  PublicSignatureConfig: gql`
    fragment RecipientViewSignatureSentAlert_PublicSignatureConfig on PublicSignatureConfig {
      signingMode
      signers {
        ...Fragments_FullPetitionSigner
        ...ContactListPopover_PetitionSigner
      }
      additionalSigners {
        ...Fragments_FullPetitionSigner
        ...ContactListPopover_PetitionSigner
      }
    }
  `,
};

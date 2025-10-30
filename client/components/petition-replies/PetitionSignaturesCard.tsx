import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { Box, Center, Grid, HStack, Text, useToast } from "@chakra-ui/react";
import { AddIcon, SignatureIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionSignaturesCard_PetitionFragment,
  PetitionSignaturesCard_UserFragment,
  PetitionSignaturesCard_cancelSignatureRequestDocument,
  PetitionSignaturesCard_petitionDocument,
  PetitionSignaturesCard_sendSignatureRequestRemindersDocument,
  PetitionSignaturesCard_signedPetitionDownloadLinkDocument,
} from "@parallel/graphql/__types";
import { getPetitionSignatureEnvironment } from "@parallel/utils/getPetitionSignatureEnvironment";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { Maybe, UnwrapArray } from "@parallel/utils/types";
import { useAddNewSignature } from "@parallel/utils/useAddNewSignature";
import { useHasRemovePreviewFiles } from "@parallel/utils/useHasRemovePreviewFiles";
import { usePageVisibility } from "@parallel/utils/usePageVisibility";
import { useCallback, useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { Card, CardHeader } from "../common/Card";
import { HelpPopover } from "../common/HelpPopover";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { TestModeSignatureBadge } from "../petition-common/TestModeSignatureBadge";
import { CurrentSignatureRequestRow } from "./CurrentSignatureRequestRow";
import { NewSignatureRequestRow } from "./NewSignatureRequestRow";
import { OlderSignatureRequestRows } from "./OlderSignatureRequestRows";
import { CommentsButton } from "./PetitionRepliesField";

export interface PetitionSignaturesCardProps {
  petition: PetitionSignaturesCard_PetitionFragment;
  user: PetitionSignaturesCard_UserFragment;
  onRefetchPetition: () => void;
  onToggleGeneralComments: () => void;
  isShowingGeneralComments: boolean;
  isDisabled: boolean;
}

const fragments = {
  User: gql`
    fragment PetitionSignaturesCard_User on User {
      ...TestModeSignatureBadge_User
    }
    ${TestModeSignatureBadge.fragments.User}
  `,
  Petition: gql`
    fragment PetitionSignaturesCard_Petition on Petition {
      id
      status
      signatureConfig {
        isEnabled
      }
      generalCommentCount
      unreadGeneralCommentCount
      signatureRequests {
        id
        ...CurrentSignatureRequestRow_PetitionSignatureRequest
        ...OlderSignatureRequestRows_PetitionSignatureRequest
      }
      ...NewSignatureRequestRow_Petition
      ...getPetitionSignatureEnvironment_Petition
      ...useAddNewSignature_Petition
    }
    ${CurrentSignatureRequestRow.fragments.PetitionSignatureRequest}
    ${OlderSignatureRequestRows.fragments.PetitionSignatureRequest}
    ${NewSignatureRequestRow.fragments.Petition}
    ${getPetitionSignatureEnvironment.fragments.Petition}
    ${useAddNewSignature.fragments.Petition}
  `,
  PetitionPolling: gql`
    fragment PetitionSignaturesCard_PetitionPolling on Petition {
      id
      status
      signatureConfig {
        isEnabled
      }
      generalCommentCount
      unreadGeneralCommentCount
      signatureRequests {
        id
        ...CurrentSignatureRequestRow_PetitionSignatureRequest
      }
      ...useAddNewSignature_Petition
      ...getPetitionSignatureEnvironment_Petition
    }
    ${useAddNewSignature.fragments.Petition}
    ${getPetitionSignatureEnvironment.fragments.Petition}
    ${CurrentSignatureRequestRow.fragments.PetitionSignatureRequest}
  `,
};

const _mutations = [
  gql`
    mutation PetitionSignaturesCard_cancelSignatureRequest($petitionSignatureRequestId: GID!) {
      cancelSignatureRequest(petitionSignatureRequestId: $petitionSignatureRequestId) {
        id
        status
        cancelReason
        petition {
          id
          hasStartedProcess
        }
      }
    }
  `,
  gql`
    mutation PetitionSignaturesCard_signedPetitionDownloadLink(
      $petitionSignatureRequestId: GID!
      $preview: Boolean
      $downloadAuditTrail: Boolean
    ) {
      signedPetitionDownloadLink(
        petitionSignatureRequestId: $petitionSignatureRequestId
        preview: $preview
        downloadAuditTrail: $downloadAuditTrail
      ) {
        result
        url
      }
    }
  `,
  gql`
    mutation PetitionSignaturesCard_sendSignatureRequestReminders(
      $petitionSignatureRequestId: GID!
    ) {
      sendSignatureRequestReminders(petitionSignatureRequestId: $petitionSignatureRequestId)
    }
  `,
  gql`
    mutation PetitionSignaturesCard_completePetition($petitionId: GID!, $message: String) {
      completePetition(petitionId: $petitionId, message: $message) {
        ...PetitionSignaturesCard_Petition
      }
    }
    ${fragments.Petition}
  `,
];

const _queries = [
  gql`
    query PetitionSignaturesCard_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        ...PetitionSignaturesCard_PetitionPolling
      }
    }
    ${fragments.PetitionPolling}
  `,
];

export const PetitionSignaturesCard = Object.assign(
  chakraForwardRef<"section", PetitionSignaturesCardProps>(function PetitionSignaturesCard(
    {
      petition,
      user,
      isDisabled,
      onRefetchPetition,
      onToggleGeneralComments,
      isShowingGeneralComments,
      ...props
    },
    ref,
  ) {
    usePetitionSignaturesCardPolling(petition);

    let current: Maybe<UnwrapArray<PetitionSignaturesCard_PetitionFragment["signatureRequests"]>> =
      petition.signatureRequests[0];

    if (
      petition.signatureConfig?.isEnabled &&
      isNonNullish(current) &&
      ["COMPLETED", "CANCELLING", "CANCELLED"].includes(current.status)
    ) {
      current = null;
    }

    const intl = useIntl();

    const signatureEnvironment = getPetitionSignatureEnvironment(petition);

    const addNewSignature = useAddNewSignature({ petition });
    const handleAddNewSignature = async () => {
      await addNewSignature();
    };

    return (
      <Card ref={ref} data-section="approvals-card" {...props}>
        <CardHeader
          leftIcon={<SignatureIcon fontSize="20px" />}
          rightAction={
            <HStack>
              <CommentsButton
                data-action="see-general-comments"
                isActive={isShowingGeneralComments}
                commentCount={petition.generalCommentCount}
                hasUnreadComments={petition.unreadGeneralCommentCount > 0}
                onClick={onToggleGeneralComments}
              />
              {!petition.signatureConfig?.isEnabled ||
              current?.status === "COMPLETED" ||
              current?.status === "CANCELLED" ? (
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
          }
        >
          <FormattedMessage id="generic.e-signature" defaultMessage="eSignature" />
          <HelpPopover popoverWidth="2xs">
            <FormattedMessage
              id="component.petition-signatures-card.signature-description"
              defaultMessage="Generates a document and initiates an eSignature process, through one of our integrated providers."
            />
          </HelpPopover>
          {signatureEnvironment === "DEMO" ? (
            <Box display="inline-block" marginStart={2}>
              <TestModeSignatureBadge hasPetitionSignature={user.hasPetitionSignature} />
            </Box>
          ) : null}
        </CardHeader>
        <PetitionSignaturesCardBody
          petition={petition}
          user={user}
          isDisabled={isDisabled}
          onRefetchPetition={onRefetchPetition}
        />
      </Card>
    );
  }),
  { fragments },
);

interface PetitionSignaturesCardBodyProps {
  petition: PetitionSignaturesCard_PetitionFragment;
  user: PetitionSignaturesCard_UserFragment;
  isDisabled: boolean;
  onRefetchPetition: () => void;
}

export function PetitionSignaturesCardBody({
  petition,
  user,
  isDisabled,
  onRefetchPetition,
}: PetitionSignaturesCardBodyProps) {
  const intl = useIntl();
  const toast = useToast();

  let current: Maybe<UnwrapArray<PetitionSignaturesCard_PetitionFragment["signatureRequests"]>> =
    petition.signatureRequests[0];
  const older = petition.signatureRequests.slice(1);

  /**
   * If the signature config is defined on the petition and the last request is finished,
   * we consider that a new signature will be needed.
   * So we move the current to the older requests to give space in the Card for a new request
   */
  if (
    petition.signatureConfig?.isEnabled &&
    isNonNullish(current) &&
    ["COMPLETED", "CANCELLED"].includes(current.status)
  ) {
    older.unshift(current);
    current = null;
  }

  const [cancelSignatureRequest] = useMutation(
    PetitionSignaturesCard_cancelSignatureRequestDocument,
  );
  const [downloadSignedDoc] = useMutation(
    PetitionSignaturesCard_signedPetitionDownloadLinkDocument,
  );

  const [sendSignatureRequestReminders] = useMutation(
    PetitionSignaturesCard_sendSignatureRequestRemindersDocument,
  );
  const handleCancelSignatureProcess = useCallback(
    async (petitionSignatureRequestId: string) => {
      try {
        await cancelSignatureRequest({
          variables: { petitionSignatureRequestId },
        });
      } catch {}
    },
    [cancelSignatureRequest],
  );

  const userHasRemovePreviewFiles = useHasRemovePreviewFiles();
  const handleDownloadSignedDoc = useCallback(
    async (petitionSignatureRequestId: string, downloadAuditTrail: boolean) => {
      await withError(
        openNewWindow(async () => {
          const { data } = await downloadSignedDoc({
            variables: {
              petitionSignatureRequestId,
              downloadAuditTrail,
              preview: userHasRemovePreviewFiles ? false : true,
            },
          });
          const { url, result } = data!.signedPetitionDownloadLink;
          if (result !== "SUCCESS") {
            throw new Error();
          }
          return url!;
        }),
      );
    },
    [downloadSignedDoc],
  );

  const handleSendSignatureReminder = useCallback(
    async (petitionSignatureRequestId: string) => {
      try {
        const { data } = await sendSignatureRequestReminders({
          variables: { petitionSignatureRequestId },
        });
        if (data?.sendSignatureRequestReminders === "SUCCESS") {
          toast({
            title: intl.formatMessage({
              id: "component.petition-signatures-card.reminder-sent-toast-title",
              defaultMessage: "Reminder sent",
            }),
            description: intl.formatMessage({
              id: "component.petition-signatures-card.reminder-sent-toast-description",
              defaultMessage: "We have sent a reminder to the pending signers",
            }),
            duration: 5000,
            isClosable: true,
            status: "success",
          });
        }
      } catch {}
    },
    [sendSignatureRequestReminders],
  );

  return current || older.length > 0 || petition.signatureConfig?.isEnabled ? (
    <Grid templateColumns="auto 1fr auto" alignItems="center">
      {petition.signatureConfig?.isEnabled && !current ? (
        <NewSignatureRequestRow
          petition={petition}
          onRefetch={onRefetchPetition}
          isDisabled={isDisabled}
        />
      ) : current ? (
        <CurrentSignatureRequestRow
          signatureRequest={current}
          onCancel={handleCancelSignatureProcess}
          onDownload={handleDownloadSignedDoc}
          onSendReminder={handleSendSignatureReminder}
          isDisabled={isDisabled}
          onRefetch={onRefetchPetition}
        />
      ) : null}
      {older.length ? (
        <OlderSignatureRequestRows signatures={older} onDownload={handleDownloadSignedDoc} />
      ) : null}
    </Grid>
  ) : (
    <Center flexDirection="column" padding={4} textStyle="hint" textAlign="center">
      <Text>
        <FormattedMessage
          id="component.petition-signatures-card.no-signature-configured"
          defaultMessage="No signature has been configured for this parallel."
        />
      </Text>
    </Center>
  );
}

const POLL_INTERVAL = 30_000;

function usePetitionSignaturesCardPolling(petition: PetitionSignaturesCard_PetitionFragment) {
  const current = petition.signatureRequests.at(0);
  const isPageVisible = usePageVisibility();
  const shouldSkip = !isPageVisible || (isNullish(petition?.signatureConfig) && isNullish(current));
  const { startPolling, stopPolling } = useQuery(PetitionSignaturesCard_petitionDocument, {
    pollInterval: POLL_INTERVAL,
    variables: { petitionId: petition.id },
    skip: shouldSkip,
    skipPollAttempt: () => shouldSkip,
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

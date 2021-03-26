import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  AlertCircleIcon,
  CheckIcon,
  PaperPlaneIcon,
  SignatureIcon,
  SignaturePlusIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import {
  PetitionSignatureRequestStatus,
  PetitionSignaturesCard_PetitionFragment,
  PetitionSignaturesCard_PetitionSignatureRequestFragment,
  PetitionSignaturesCard_UserFragment,
  SignatureConfigInput,
  usePetitionSignaturesCard_cancelSignatureRequestMutation,
  usePetitionSignaturesCard_signedPetitionDownloadLinkMutation,
  usePetitionSignaturesCard_startSignatureRequestMutation,
  usePetitionSignaturesCard_updatePetitionSignatureConfigMutation,
} from "@parallel/graphql/__types";
import { Maybe, UnwrapArray } from "@parallel/utils/types";
import { useCallback } from "react";
import { FormattedList, FormattedMessage, useIntl } from "react-intl";
import { omit } from "remeda";
import { Card, CardProps, GenericCardHeader } from "../common/Card";
import { ContactLink } from "../common/ContactLink";
import { Divider } from "../common/Divider";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Link } from "../common/Link";
import { Spacer } from "../common/Spacer";
import {
  SignatureConfigDialog,
  useSignatureConfigDialog,
} from "../petition-common/SignatureConfigDialog";
import { useConfirmRestartSignatureRequestDialog } from "./ConfirmRestartSignatureRequestDialog";
import { useSignerSelectDialog } from "./SignerSelectDialog";

export interface PetitionSignaturesCardProps extends CardProps {
  petition: PetitionSignaturesCard_PetitionFragment;
  user: PetitionSignaturesCard_UserFragment;
  onRefetchPetition: () => void;
}

export function PetitionSignaturesCard({
  petition,
  user,
  onRefetchPetition,
  ...props
}: PetitionSignaturesCardProps) {
  let current: Maybe<
    UnwrapArray<PetitionSignaturesCard_PetitionFragment["signatureRequests"]>
  > = petition.signatureRequests![0];
  const older = petition.signatureRequests!.slice(1);
  /**
   * If the signature config is defined on the petition and the last request is finished,
   * we consider that a new signature will be needed.
   * So we move the current to the older requests to give space in the Card for a new request
   */
  if (
    petition.signatureConfig &&
    (current?.status === "COMPLETED" || current?.status === "CANCELLED")
  ) {
    older.unshift(current);
    current = null;
  }

  const [
    cancelSignatureRequest,
  ] = usePetitionSignaturesCard_cancelSignatureRequestMutation();
  const [
    startSignatureRequest,
  ] = usePetitionSignaturesCard_startSignatureRequestMutation();

  const [
    updateSignatureConfig,
  ] = usePetitionSignaturesCard_updatePetitionSignatureConfigMutation();

  const [
    downloadSignedDoc,
  ] = usePetitionSignaturesCard_signedPetitionDownloadLinkMutation();

  const handleCancelSignatureProcess = useCallback(
    async (petitionSignatureRequestId: string) => {
      await updateSignatureConfig({
        variables: { petitionId: petition.id, signatureConfig: null },
      });
      await cancelSignatureRequest({
        variables: { petitionSignatureRequestId },
      });
    },
    [updateSignatureConfig, cancelSignatureRequest]
  );

  const handleStartSignatureProcess = useCallback(async () => {
    await startSignatureRequest({
      variables: { petitionId: petition.id },
    });
    await onRefetchPetition();
  }, [startSignatureRequest, petition]);

  const handleDownloadSignedDoc = useCallback(
    async (petitionSignatureRequestId: string) => {
      try {
        const _window = window.open(undefined, "_blank")!;

        const { data } = await downloadSignedDoc({
          variables: { petitionSignatureRequestId, preview: true },
        });
        const { url, result } = data!.signedPetitionDownloadLink;
        if (result === "SUCCESS") {
          _window.location.href = url!;
        } else {
          _window.close();
        }
      } catch {}
    },
    [downloadSignedDoc]
  );
  const showSignatureConfigDialog = useSignatureConfigDialog();

  const showConfirmRestartSignature = useConfirmRestartSignatureRequestDialog();
  async function handleAddNewSignature() {
    try {
      if (current?.status === "COMPLETED") {
        await showConfirmRestartSignature({});
      }
      const signatureConfig = await showSignatureConfigDialog({
        petition,
        providers: user.organization.signatureIntegrations,
      });
      await updateSignatureConfig({
        variables: { petitionId: petition.id, signatureConfig },
      });

      if (["COMPLETED", "CLOSED"].includes(petition.status)) {
        await handleStartSignatureProcess();
      }
    } catch {}
  }

  async function handleUpdateSignatureConfig(
    signatureConfig: SignatureConfigInput | null
  ) {
    await updateSignatureConfig({
      variables: { petitionId: petition.id, signatureConfig },
    });
  }

  const intl = useIntl();

  return (
    <Card {...props}>
      <GenericCardHeader
        rightAction={
          !petition.signatureConfig ||
          current?.status === "COMPLETED" ||
          current?.status === "CANCELLED" ? (
            <IconButtonWithTooltip
              label={intl.formatMessage({
                id: "component.petition-signatures-card.add-signature.label",
                defaultMessage: "Add signature",
              })}
              size="sm"
              icon={<SignaturePlusIcon />}
              onClick={handleAddNewSignature}
              borderColor="gray.300"
              borderWidth="1px"
              backgroundColor="white"
            />
          ) : null
        }
      >
        <Box as="span" display="flex">
          <SignatureIcon fontSize="20px" marginRight={2} lineHeight={5} />
          <FormattedMessage
            id="component.petition-signatures-card.header"
            defaultMessage="Petition eSignature"
          />
        </Box>
      </GenericCardHeader>

      {current || older.length > 0 || petition.signatureConfig ? (
        <>
          {petition.signatureConfig && !current ? (
            <NewSignatureRequestRow
              petition={petition}
              onStart={handleStartSignatureProcess}
              onUpdateConfig={handleUpdateSignatureConfig}
            />
          ) : current ? (
            <CurrentSignatureRequestRow
              signatureRequest={current}
              onCancel={handleCancelSignatureProcess}
              onDownload={handleDownloadSignedDoc}
            />
          ) : null}
          {older.length ? (
            <OlderSignatureRequests
              signatures={older}
              onDownload={handleDownloadSignedDoc}
            />
          ) : null}
        </>
      ) : (
        <Center
          flexDirection="column"
          minHeight={24}
          textStyle="hint"
          textAlign="center"
        >
          <Text>
            <FormattedMessage
              id="component.petition-signatures-card.no-signature-configured"
              defaultMessage="No signature has been configured for this petition."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.petition-signatures-card.no-signature-configured-2"
              defaultMessage="If you need it, you can configure it from the petition settings in the <a>Compose</a> tab."
              values={{
                a: (chunks: any[]) => (
                  <Link href={`/app/petitions/${petition.id}/compose`}>
                    {chunks}
                  </Link>
                ),
              }}
            />
          </Text>
        </Center>
      )}
    </Card>
  );
}

type NewSignatureRequestRowProps = {
  petition: PetitionSignaturesCard_PetitionFragment;
  onUpdateConfig: (data: SignatureConfigInput | null) => Promise<void>;
  onStart: () => void;
};

function NewSignatureRequestRow({
  petition,
  onUpdateConfig,
  onStart,
}: NewSignatureRequestRowProps) {
  const signers = petition.signatureConfig?.contacts ?? [];
  const showSignerSelectDialog = useSignerSelectDialog();
  const handleStartSignature = async () => {
    try {
      if (signers.length === 0) {
        const contactIds = (await showSignerSelectDialog({})).contactIds;
        await onUpdateConfig({
          ...omit(petition.signatureConfig!, ["contacts", "__typename"]),
          contactIds,
        });
      }
      onStart();
    } catch {}
  };

  return (
    <>
      <Stack
        paddingX={4}
        paddingY={2}
        direction={{ base: "column", md: "row" }}
        alignItems="center"
        spacing={4}
      >
        <Box>
          <Heading size="xs" as="h4">
            <FormattedMessage
              id="component.petition-signatures-card.status"
              defaultMessage="Status"
            />
          </Heading>
          <Stack
            direction="row"
            display="inline-flex"
            alignItems="center"
            color="gray.600"
          >
            <TimeIcon />
            <Text>
              <FormattedMessage
                id="component.petition-sigatures-card.not-started"
                defaultMessage="Not started"
              />
            </Text>
          </Stack>
        </Box>
        <Box>
          <Heading size="xs" as="h4">
            <FormattedMessage
              id="component.petition-signatures-card.signers"
              defaultMessage="Signers"
            />
          </Heading>
          {signers.length > 0 ? (
            <FormattedList
              value={signers.map((contact, i) => [
                <ContactLink contact={contact} key={i} />,
              ])}
            />
          ) : (
            <FormattedMessage
              id="generic.not-specified"
              defaultMessage="Not specified"
            />
          )}
        </Box>
        <Stack flex="1" direction="row" justifyContent="flex-end">
          {petition.status === "PENDING" ? (
            <Button
              width="24"
              colorScheme="red"
              onClick={() => onUpdateConfig(null)}
            >
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
          ) : (
            <Flex alignItems="center">
              <Button width="24" onClick={() => onUpdateConfig(null)}>
                <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
              </Button>
              <Button
                width="24"
                colorScheme="purple"
                marginLeft={2}
                onClick={handleStartSignature}
              >
                {signers.length === 0 ? (
                  <FormattedMessage
                    id="component.petition-signatures-card.start"
                    defaultMessage="Start..."
                  />
                ) : (
                  <FormattedMessage id="generic.start" defaultMessage="Start" />
                )}
              </Button>
            </Flex>
          )}
        </Stack>
      </Stack>
      <Divider />
    </>
  );
}

type CurrentSignatureRequestRowProps = {
  signatureRequest: PetitionSignaturesCard_PetitionSignatureRequestFragment;
  onCancel: (petitionSignatureRequestId: string) => void;
  onDownload: (petitionSignatureRequestId: string) => void;
};

function CurrentSignatureRequestRow({
  signatureRequest,
  onCancel,
  onDownload,
}: CurrentSignatureRequestRowProps) {
  const status = signatureRequest.status;
  const signers = signatureRequest.signatureConfig.contacts;
  const isAwaitingSignature = ["ENQUEUED", "PROCESSING"].includes(status);
  const isSigned = status === "COMPLETED";

  return (
    <>
      <Stack
        paddingX={4}
        paddingY={2}
        direction={{ base: "column", md: "row" }}
        alignItems="center"
        spacing={4}
      >
        <Box>
          <Heading size="xs" as="h4">
            <FormattedMessage
              id="component.petition-signatures-card.status"
              defaultMessage="Status"
            />
          </Heading>
          <PetitionSignatureRequestStatusText status={status} />
        </Box>
        <Box>
          <Heading size="xs" as="h4">
            <FormattedMessage
              id="component.petition-signatures-card.signers"
              defaultMessage="Signers"
            />
          </Heading>
          <FormattedList
            value={signers.map((contact, i) => [
              <ContactLink contact={contact} key={i} />,
            ])}
          />
        </Box>
        <Stack flex="1" direction="row" justifyContent="flex-end">
          {isAwaitingSignature ? (
            <Button
              width="24"
              colorScheme="red"
              onClick={() => onCancel(signatureRequest.id)}
            >
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
          ) : isSigned ? (
            <Button
              width="24"
              colorScheme="purple"
              onClick={() => onDownload(signatureRequest.id)}
            >
              <FormattedMessage
                id="generic.download"
                defaultMessage="Download"
              />
            </Button>
          ) : null}
        </Stack>
      </Stack>
      <Divider />
    </>
  );
}

function OlderSignatureRequests({
  signatures,
  onDownload,
}: {
  signatures: PetitionSignaturesCard_PetitionSignatureRequestFragment[];
  onDownload: (petitionSignatureRequestId: string) => void;
}) {
  return (
    <>
      <Box paddingX={4} paddingY={1.5}>
        <Heading size="xs">
          <FormattedMessage
            id="component.petition-signatures-card.previous-signatures"
            defaultMessage="Previous signatures"
          />
        </Heading>
      </Box>
      <Divider />
      <Stack as="ul" paddingX={4} paddingY={2}>
        {signatures.map((signature) => (
          <Flex
            as="li"
            key={signature.id}
            listStyleType="none"
            alignItems="center"
          >
            <PetitionSignatureRequestStatusText status={signature.status} />
            <Text as="span" marginX={2}>
              -
            </Text>
            <Text as="span">
              <FormattedList
                value={signature.signatureConfig.contacts.map((contact, i) => [
                  <ContactLink contact={contact} key={i} />,
                ])}
              />
            </Text>
            <Spacer />
            {signature.status === "COMPLETED" ? (
              <Button
                width="24"
                fontSize="sm"
                height={8}
                onClick={() => onDownload(signature.id)}
              >
                <FormattedMessage
                  id="generic.download"
                  defaultMessage="Download"
                />
              </Button>
            ) : null}
          </Flex>
        ))}
      </Stack>
    </>
  );
}

function PetitionSignatureRequestStatusText({
  status,
}: {
  status: PetitionSignatureRequestStatus;
}) {
  switch (status) {
    case "ENQUEUED":
      return (
        <Stack
          direction="row"
          display="inline-flex"
          alignItems="center"
          color="gray.600"
        >
          <PaperPlaneIcon />
          <Text>
            <FormattedMessage
              id="component.petition-sigatures-card.sending"
              defaultMessage="Sending"
            />
          </Text>
        </Stack>
      );
    case "PROCESSING":
      return (
        <Stack
          direction="row"
          display="inline-flex"
          alignItems="center"
          color="yellow.600"
        >
          <TimeIcon />
          <Text>
            <FormattedMessage
              id="component.petition-sigatures-card.awaiting"
              defaultMessage="Awaiting"
            />
          </Text>
        </Stack>
      );
    case "CANCELLED":
      return (
        <Stack
          direction="row"
          display="inline-flex"
          alignItems="center"
          color="red.500"
        >
          <AlertCircleIcon />
          <Text>
            <FormattedMessage
              id="component.petition-sigatures-card.cancelled"
              defaultMessage="Cancelled"
            />
          </Text>
        </Stack>
      );
    case "COMPLETED":
      return (
        <Stack
          direction="row"
          display="inline-flex"
          alignItems="center"
          color="green.500"
        >
          <CheckIcon />
          <Text>
            <FormattedMessage
              id="component.petition-sigatures-card.completed"
              defaultMessage="Completed"
            />
          </Text>
        </Stack>
      );
  }
}

PetitionSignaturesCard.fragments = {
  User: gql`
    fragment PetitionSignaturesCard_User on User {
      organization {
        signatureIntegrations: integrations(type: SIGNATURE) {
          ...SignatureConfigDialog_OrgIntegration
        }
      }
    }
    ${SignatureConfigDialog.fragments.OrgIntegration}
  `,
  Petition: gql`
    fragment PetitionSignaturesCard_Petition on Petition {
      id
      status
      signatureConfig {
        timezone
        contacts {
          ...ContactLink_Contact
        }
      }
      signatureRequests {
        ...PetitionSignaturesCard_PetitionSignatureRequest
      }
      ...SignatureConfigDialog_Petition
    }

    fragment PetitionSignaturesCard_PetitionSignatureRequest on PetitionSignatureRequest {
      id
      status
      signatureConfig {
        contacts {
          ...ContactLink_Contact
        }
      }
    }
    ${SignatureConfigDialog.fragments.Petition}
    ${ContactLink.fragments.Contact}
  `,
};

PetitionSignaturesCard.mutations = [
  gql`
    mutation PetitionSignaturesCard_updatePetitionSignatureConfig(
      $petitionId: GID!
      $signatureConfig: SignatureConfigInput
    ) {
      updatePetition(
        petitionId: $petitionId
        data: { signatureConfig: $signatureConfig }
      ) {
        ... on Petition {
          ...PetitionSignaturesCard_Petition
        }
      }
    }
    ${PetitionSignaturesCard.fragments.Petition}
  `,
  gql`
    mutation PetitionSignaturesCard_cancelSignatureRequest(
      $petitionSignatureRequestId: GID!
    ) {
      cancelSignatureRequest(
        petitionSignatureRequestId: $petitionSignatureRequestId
      ) {
        id
        status
      }
    }
  `,
  gql`
    mutation PetitionSignaturesCard_startSignatureRequest($petitionId: GID!) {
      startSignatureRequest(petitionId: $petitionId) {
        id
        status
      }
    }
  `,
  gql`
    mutation PetitionSignaturesCard_signedPetitionDownloadLink(
      $petitionSignatureRequestId: GID!
      $preview: Boolean
    ) {
      signedPetitionDownloadLink(
        petitionSignatureRequestId: $petitionSignatureRequestId
        preview: $preview
      ) {
        result
        url
      }
    }
  `,
];

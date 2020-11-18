import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/core";
import {
  AlertCircleIcon,
  CheckIcon,
  PaperPlaneIcon,
  SignatureIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import {
  PetitionSignatureRequestStatus,
  PetitionSignaturesCard_PetitionFragment,
  usePetitionSignaturesCard_cancelSignatureRequestMutation,
  usePetitionSignaturesCard_signedPetitionDownloadLinkMutation,
  usePetitionSignaturesCard_startSignatureRequestMutation,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { FormattedList, FormattedMessage } from "react-intl";
import { Card, CardHeader } from "../common/Card";
import { ContactLink } from "../common/ContactLink";
import { DeletedContact } from "../common/DeletedContact";
import { Divider } from "../common/Divider";
import { Link } from "../common/Link";
import { Spacer } from "../common/Spacer";

export function PetitionSignaturesCard({
  petition,
  onRefetchPetition,
  ...props
}: ExtendChakra<{
  petition: PetitionSignaturesCard_PetitionFragment;
  onRefetchPetition: () => void;
}>) {
  const [current, ...older] = petition.signatureRequests!;

  const [
    cancelSignatureRequest,
  ] = usePetitionSignaturesCard_cancelSignatureRequestMutation();
  const [
    startSignatureRequest,
  ] = usePetitionSignaturesCard_startSignatureRequestMutation();

  const [
    downloadSignedDoc,
  ] = usePetitionSignaturesCard_signedPetitionDownloadLinkMutation();

  const handleCancelSignatureProcess = useCallback(
    async (petitionSignatureRequestId: string) => {
      await cancelSignatureRequest({
        variables: { petitionSignatureRequestId },
      });
    },
    [cancelSignatureRequest]
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

  return (
    <Card {...props}>
      <CardHeader>
        <Box as="span" display="flex">
          <SignatureIcon fontSize="20px" marginRight={2} lineHeight={5} />
          <FormattedMessage
            id="component.petition-signatures-card.header"
            defaultMessage="Petition eSignature"
          />
        </Box>
      </CardHeader>
      {current ? (
        <>
          <Stack
            paddingX={4}
            paddingY={2}
            direction={{ base: "column", md: "row" }}
            spacing={4}
          >
            <Box>
              <Heading size="xs" as="h4">
                <FormattedMessage
                  id="component.petition-signatures-card.status"
                  defaultMessage="Status"
                />
              </Heading>
              <PetitionSignatureRequestStatusText status={current.status} />
            </Box>
            <Box>
              <Heading size="xs" as="h4">
                <FormattedMessage
                  id="component.petition-signatures-card.signers"
                  defaultMessage="Signers"
                />
              </Heading>
              <FormattedList
                value={current.signatureConfig.contacts.map((contact, i) => [
                  contact ? (
                    <ContactLink contact={contact} key={i} />
                  ) : (
                    <DeletedContact key={i} />
                  ),
                ])}
              />
            </Box>
            <Stack flex="1" direction="row" justifyContent="flex-end">
              {current.status === "PROCESSING" ? (
                <Button
                  colorScheme="red"
                  onClick={() => handleCancelSignatureProcess(current.id)}
                >
                  <FormattedMessage
                    id="generic.cancel"
                    defaultMessage="Cancel"
                  />
                </Button>
              ) : null}
              {["CANCELLED", "COMPLETED"].includes(current.status) &&
              petition.signatureConfig ? (
                <Button onClick={() => handleStartSignatureProcess()}>
                  <FormattedMessage
                    id="generic.restart"
                    defaultMessage="Restart"
                  />
                </Button>
              ) : null}
              {current.status === "COMPLETED" ? (
                <Button
                  colorScheme="purple"
                  onClick={() => handleDownloadSignedDoc(current.id)}
                >
                  <FormattedMessage
                    id="generic.download"
                    defaultMessage="Download"
                  />
                </Button>
              ) : null}
            </Stack>
          </Stack>
          {older.length ? (
            <>
              <Divider />
              <Box paddingX={4} paddingY={1}>
                <Heading size="xs">
                  <FormattedMessage
                    id="component.petition-signatures-card.previous-signatures"
                    defaultMessage="Previous signatures"
                  />
                </Heading>
              </Box>
              <Divider />
              <Stack as="ul" paddingX={4} paddingY={2}>
                {older.map((signature) => (
                  <Flex
                    as="li"
                    key={signature.id}
                    listStyleType="none"
                    alignItems="center"
                  >
                    <PetitionSignatureRequestStatusText
                      status={signature.status}
                    />
                    <Text as="span" marginX={2}>
                      -
                    </Text>
                    <Text as="span">
                      <FormattedList
                        value={signature.signatureConfig.contacts.map(
                          (contact, i) => [
                            contact ? (
                              <ContactLink contact={contact} key={i} />
                            ) : (
                              <DeletedContact key={i} />
                            ),
                          ]
                        )}
                      />
                    </Text>
                    <Spacer />
                    {signature.status === "COMPLETED" ? (
                      <Button
                        size="xs"
                        onClick={() => handleDownloadSignedDoc(signature.id)}
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
          ) : null}
        </>
      ) : (
        <Center
          flexDirection="column"
          minHeight={24}
          textStyle="hint"
          textAlign="center"
        >
          {petition.signatureConfig ? (
            <FormattedMessage
              id="component.petition-signatures-card.signature-not-started"
              defaultMessage="The signature process will start when the recipients complete the petition."
            />
          ) : (
            <>
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
            </>
          )}
        </Center>
      )}
    </Card>
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
          color="gray.600"
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
          <Text>Completed</Text>
        </Stack>
      );
  }
}

PetitionSignaturesCard.fragments = {
  Petition: gql`
    fragment PetitionSignaturesCard_Petition on Petition {
      id
      signatureConfig {
        provider
      }
      signatureRequests {
        id
        status
        signatureConfig {
          contacts {
            ...ContactLink_Contact
          }
        }
      }
    }
    ${ContactLink.fragments.Contact}
  `,
};

PetitionSignaturesCard.mutations = [
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

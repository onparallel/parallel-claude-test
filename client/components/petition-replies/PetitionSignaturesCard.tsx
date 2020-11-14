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
} from "@parallel/graphql/__types";
import { FormattedList, FormattedMessage } from "react-intl";
import { Card, CardHeader } from "../common/Card";
import { ContactLink } from "../common/ContactLink";
import { DeletedContact } from "../common/DeletedContact";
import { Divider } from "../common/Divider";
import { HelpPopover } from "../common/HelpPopover";
import { Link } from "../common/Link";
import { Spacer } from "../common/Spacer";

export function PetitionSignaturesCard({
  petition,
  ...props
}: ExtendChakra<{
  petition: PetitionSignaturesCard_PetitionFragment;
}>) {
  const [current, ...older] = petition.signatureRequests!;
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
                value={current.signatureConfig.contacts.map((contact) => [
                  contact ? (
                    <ContactLink contact={contact} />
                  ) : (
                    <DeletedContact />
                  ),
                ])}
              />
            </Box>
            <Stack flex="1" direction="row" justifyContent="flex-end">
              {current.status === "PROCESSING" ? (
                <Button colorScheme="red">
                  <FormattedMessage
                    id="generic.cancel"
                    defaultMessage="Cancel"
                  />
                </Button>
              ) : null}
              {["CANCELLED", "COMPLETED"].includes(current.status) ? (
                <Button>
                  <FormattedMessage
                    id="generic.restart"
                    defaultMessage="Restart"
                  />
                </Button>
              ) : null}
              {current.status === "COMPLETED" ? (
                <Button colorScheme="purple">
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
                    <FormattedList
                      value={signature.signatureConfig.contacts.map(
                        (contact) => [
                          contact ? (
                            <ContactLink contact={contact} />
                          ) : (
                            <DeletedContact />
                          ),
                        ]
                      )}
                    />
                    <Spacer />
                    {signature.status === "COMPLETED" ? (
                      <Button size="xs">
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

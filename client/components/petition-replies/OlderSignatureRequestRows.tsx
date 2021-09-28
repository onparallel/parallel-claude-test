import { gql } from "@apollo/client";
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { OlderSignatureRequestRows_PetitionSignatureRequestFragment } from "@parallel/graphql/__types";
import { FormattedList, FormattedMessage } from "react-intl";
import { ContactLink } from "../common/ContactLink";
import { Divider } from "../common/Divider";
import { Spacer } from "../common/Spacer";
import { PetitionSignatureRequestStatusText } from "./PetitionSignatureRequestStatusText";

export function OlderSignatureRequestRows({
  signatures,
  onDownload,
}: {
  signatures: OlderSignatureRequestRows_PetitionSignatureRequestFragment[];
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
          <Flex as="li" key={signature.id} listStyleType="none" alignItems="center">
            <PetitionSignatureRequestStatusText status={signature.status} />
            <Text as="span" marginX={2}>
              -
            </Text>
            <Text as="span">
              <FormattedList
                value={signature.signerStatus.map(({ contact }) => [
                  <ContactLink contact={contact} key={contact.id} />,
                ])}
              />
            </Text>
            <Spacer />
            {signature.status === "COMPLETED" ? (
              <Button width="24" fontSize="sm" height={8} onClick={() => onDownload(signature.id)}>
                <FormattedMessage id="generic.download" defaultMessage="Download" />
              </Button>
            ) : null}
          </Flex>
        ))}
      </Stack>
    </>
  );
}

OlderSignatureRequestRows.fragments = {
  PetitionSignatureRequest: gql`
    fragment OlderSignatureRequestRows_PetitionSignatureRequest on PetitionSignatureRequest {
      id
      status
      signerStatus {
        contact {
          ...ContactLink_Contact
        }
        status
      }
    }
    ${ContactLink.fragments.Contact}
  `,
};

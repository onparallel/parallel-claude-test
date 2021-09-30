import { gql } from "@apollo/client";
import { Box, Button, Flex, GridItem, Heading } from "@chakra-ui/react";
import { OlderSignatureRequestRows_PetitionSignatureRequestFragment } from "@parallel/graphql/__types";
import { FormattedList, FormattedMessage } from "react-intl";
import { ContactReference } from "../common/ContactReference";
import { Divider } from "../common/Divider";
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
      <GridItem colSpan={3}>
        <Divider />
      </GridItem>
      <GridItem colSpan={3}>
        <Heading size="xs">
          <FormattedMessage
            id="component.petition-signatures-card.previous-signatures"
            defaultMessage="Previous signatures"
          />
        </Heading>
      </GridItem>
      <GridItem colSpan={3}>
        <Divider />
      </GridItem>
      {signatures.map((signature) => (
        <>
          <PetitionSignatureRequestStatusText status={signature.status} />
          <Box>
            <FormattedList
              value={signature.signerStatus.map(({ contact }) => [
                <ContactReference contact={contact} key={contact.id} />,
              ])}
            />
          </Box>
          <Flex justifyContent="flex-end">
            {signature.status === "COMPLETED" ? (
              <Button width="24" fontSize="sm" height={8} onClick={() => onDownload(signature.id)}>
                <FormattedMessage id="generic.download" defaultMessage="Download" />
              </Button>
            ) : null}
          </Flex>
        </>
      ))}
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
          ...ContactReference_Contact
        }
        status
      }
    }
    ${ContactReference.fragments.Contact}
  `,
};

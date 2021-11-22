import { gql } from "@apollo/client";
import { Box, Button, Flex, GridItem, Heading } from "@chakra-ui/react";
import { OlderSignatureRequestRows_PetitionSignatureRequestFragment } from "@parallel/graphql/__types";
import { Fragment } from "react";
import { FormattedList, FormattedMessage } from "react-intl";
import { Divider } from "../common/Divider";
import { SignerReference } from "../common/SignerReference";
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
        <Box paddingY={2} paddingX={4}>
          <Heading size="xs">
            <FormattedMessage
              id="component.petition-signatures-card.previous-signatures"
              defaultMessage="Previous signatures"
            />
          </Heading>
        </Box>
        <Divider />
      </GridItem>
      {signatures.map((signature, i) => (
        <Fragment key={i}>
          <Box padding={2} paddingLeft={4}>
            <PetitionSignatureRequestStatusText status={signature.status} />
          </Box>
          <GridItem padding={2} colSpan={signature.status === "COMPLETED" ? 1 : 2}>
            <FormattedList
              value={signature.signatureConfig.signers.map((signer, index) => (
                <SignerReference signer={signer} key={index} />
              ))}
            />
          </GridItem>
          {signature.status === "COMPLETED" ? (
            <Flex justifyContent="flex-end" padding={2} paddingRight={4}>
              <Button width="24" fontSize="sm" height={8} onClick={() => onDownload(signature.id)}>
                <FormattedMessage id="generic.download" defaultMessage="Download" />
              </Button>
            </Flex>
          ) : null}
        </Fragment>
      ))}
    </>
  );
}

OlderSignatureRequestRows.fragments = {
  PetitionSignatureRequest: gql`
    fragment OlderSignatureRequestRows_PetitionSignatureRequest on PetitionSignatureRequest {
      id
      status
      signatureConfig {
        signers {
          ...SignerReference_PetitionSigner
        }
      }
    }
    ${SignerReference.fragments.PetitionSigner}
  `,
};

import { gql } from "@apollo/client";
import { Box, Button, Flex, GridItem, Heading, HStack } from "@chakra-ui/react";
import { NetDocumentsIcon } from "@parallel/chakra/icons";
import { OlderSignatureRequestRows_PetitionSignatureRequestFragment } from "@parallel/graphql/__types";
import { Fragment } from "react";
import { FormattedList, FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../common/Divider";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SignerReference } from "../common/SignerReference";
import { PetitionSignatureRequestStatusText } from "./PetitionSignatureRequestStatusText";

export function OlderSignatureRequestRows({
  signatures,
  onDownload,
}: {
  signatures: OlderSignatureRequestRows_PetitionSignatureRequestFragment[];
  onDownload: (petitionSignatureRequestId: string) => void;
}) {
  const intl = useIntl();
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
              <HStack>
                {signature.metadata.SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS ? (
                  <IconButtonWithTooltip
                    size="sm"
                    as="a"
                    href={`https://eu.netdocuments.com/neWeb2/goid.aspx?id=${signature.metadata.SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS}`}
                    target="_href"
                    icon={<NetDocumentsIcon fontSize="md" />}
                    label={intl.formatMessage({
                      id: "component.petition-signatures-card.access-file-nd",
                      defaultMessage: "Access file in NetDocuments",
                    })}
                  />
                ) : null}
                <Button
                  width="24"
                  fontSize="sm"
                  height={8}
                  onClick={() => onDownload(signature.id)}
                >
                  <FormattedMessage id="generic.download" defaultMessage="Download" />
                </Button>
              </HStack>
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
      metadata
    }
    ${SignerReference.fragments.PetitionSigner}
  `,
};

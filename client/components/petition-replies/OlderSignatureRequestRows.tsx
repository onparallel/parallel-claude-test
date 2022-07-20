import { gql } from "@apollo/client";
import { Box, GridItem, Heading, HStack, MenuItem, MenuList, Text } from "@chakra-ui/react";
import { DocumentIcon, DownloadIcon } from "@parallel/chakra/icons";
import { OlderSignatureRequestRows_PetitionSignatureRequestFragment } from "@parallel/graphql/__types";
import { Fragment } from "react";
import { FormattedList, FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { ButtonWithMoreOptions } from "../common/ButtonWithMoreOptions";
import { Divider } from "../common/Divider";
import { NetDocumentsIconButton } from "../common/NetDocumentsLink";
import { ResponsiveButtonIcon } from "../common/ResponsiveButtonIcon";
import { SignerReference } from "../common/SignerReference";
import { PetitionSignatureRequestStatusText } from "./PetitionSignatureRequestStatusText";

export function OlderSignatureRequestRows({
  signatures,
  onDownload,
}: {
  signatures: OlderSignatureRequestRows_PetitionSignatureRequestFragment[];
  onDownload: (petitionSignatureRequestId: string, downloadAuditTrail: boolean) => void;
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
            {signature.isAnonymized ? (
              <Text textStyle="hint">
                <FormattedMessage id="generic.not-available" defaultMessage="Not available" />
              </Text>
            ) : (
              <FormattedList
                value={signature.signatureConfig.signers.map((signer, index) => (
                  <SignerReference signer={signer} key={index} />
                ))}
              />
            )}
          </GridItem>
          {signature.status === "COMPLETED" ? (
            <Box padding={2} paddingRight={4} marginLeft="auto">
              <HStack>
                {signature.metadata.SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS ? (
                  <NetDocumentsIconButton
                    externalId={signature.metadata.SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS}
                    size="sm"
                  />
                ) : null}
                <ButtonWithMoreOptions
                  colorScheme="primary"
                  as={ResponsiveButtonIcon}
                  icon={<DownloadIcon fontSize="lg" display="block" />}
                  breakpoint="lg"
                  label={intl.formatMessage({
                    id: "component.petition-signatures-card.signed-document",
                    defaultMessage: "Signed document",
                  })}
                  onClick={() => onDownload(signature.id, false)}
                  options={
                    <MenuList minWidth="fit-content">
                      <MenuItem
                        icon={<DocumentIcon boxSize={5} />}
                        onClick={() => onDownload(signature.id, true)}
                        isDisabled={!isDefined(signature.auditTrailFilename)}
                      >
                        <FormattedMessage
                          id="component.petition-signatures-card.audit-trail"
                          defaultMessage="Audit trail"
                        />
                      </MenuItem>
                    </MenuList>
                  }
                />
              </HStack>
            </Box>
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
      isAnonymized
      auditTrailFilename
    }
    ${SignerReference.fragments.PetitionSigner}
  `,
};

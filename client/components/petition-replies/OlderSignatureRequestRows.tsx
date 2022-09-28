import { gql } from "@apollo/client";
import { Box, Button, GridItem, Heading, HStack, MenuItem, MenuList, Text } from "@chakra-ui/react";
import { DocumentIcon, DownloadIcon } from "@parallel/chakra/icons";
import { OlderSignatureRequestRows_PetitionSignatureRequestFragment } from "@parallel/graphql/__types";
import { Fragment } from "react";
import { FormattedList, FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { ButtonWithMoreOptions } from "../common/ButtonWithMoreOptions";
import { Divider } from "../common/Divider";
import { NakedLink } from "../common/Link";
import { NetDocumentsIconButton } from "../common/NetDocumentsLink";
import { ResponsiveButtonIcon } from "../common/ResponsiveButtonIcon";
import { SignerReference } from "../common/SignerReference";
import { PetitionSignatureRequestSignerStatusIcon } from "./PetitionSignatureRequestSignerStatusIcon";
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
          <GridItem padding={2} paddingLeft={4}>
            <PetitionSignatureRequestStatusText signature={signature} />
          </GridItem>
          <GridItem padding={2}>
            {signature.isAnonymized ? (
              <Text textStyle="hint">
                <FormattedMessage id="generic.not-available" defaultMessage="Not available" />
              </Text>
            ) : (
              <FormattedList
                value={signature.signerStatus.map((sStatus, index) => (
                  <Fragment key={index}>
                    <SignerReference signer={sStatus.signer} />
                    <PetitionSignatureRequestSignerStatusIcon
                      signerStatus={{
                        ...sStatus,
                        // don't show any icon when signer is pending
                        status: sStatus.status === "PENDING" ? "" : sStatus.status,
                      }}
                      position="relative"
                      marginX={1}
                    />
                  </Fragment>
                ))}
              />
            )}
          </GridItem>
          <GridItem padding={2} paddingRight={4} marginLeft="auto">
            {signature.status === "COMPLETED" ? (
              <HStack justifyContent="flex-end">
                {signature.metadata.SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS ? (
                  <NetDocumentsIconButton
                    externalId={signature.metadata.SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS}
                    size="sm"
                  />
                ) : null}
                <ButtonWithMoreOptions
                  size="sm"
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
            ) : signature.status === "CANCELLED" ? (
              <NakedLink href={`/app/petitions/${signature.petition.id}/activity`}>
                <Button size="xs">
                  <FormattedMessage
                    id="component.petition-signatures-card.more-info-button"
                    defaultMessage="More information"
                  />
                </Button>
              </NakedLink>
            ) : null}
          </GridItem>
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
      ...PetitionSignatureRequestStatusText_PetitionSignatureRequest
      signerStatus {
        signer {
          ...SignerReference_PetitionSigner
        }
        ...PetitionSignatureRequestSignerStatusIcon_SignerStatus
      }
      petition {
        id
      }
      metadata
      isAnonymized
      auditTrailFilename
    }
    ${PetitionSignatureRequestStatusText.fragments.PetitionSignatureRequest}
    ${SignerReference.fragments.PetitionSigner}
    ${PetitionSignatureRequestSignerStatusIcon.fragments.SignerStatus}
  `,
};

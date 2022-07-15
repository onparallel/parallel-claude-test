import { gql } from "@apollo/client";
import {
  Box,
  ButtonGroup,
  Flex,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { ChevronDownIcon, DocumentIcon, DownloadIcon } from "@parallel/chakra/icons";
import { OlderSignatureRequestRows_PetitionSignatureRequestFragment } from "@parallel/graphql/__types";
import { Fragment } from "react";
import { FormattedList, FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
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
            <Flex justifyContent="flex-end" padding={2} paddingRight={4}>
              <HStack>
                {signature.metadata.SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS ? (
                  <NetDocumentsIconButton
                    externalId={signature.metadata.SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS}
                    size="sm"
                  />
                ) : null}
                <ButtonGroup isAttached colorScheme="primary" isDisabled={signature.isAnonymized}>
                  <ResponsiveButtonIcon
                    breakpoint="lg"
                    colorScheme="primary"
                    icon={<DownloadIcon fontSize="lg" display="block" />}
                    label={intl.formatMessage({
                      id: "component.petition-signatures-card.signed-document",
                      defaultMessage: "Signed document",
                    })}
                    onClick={() => onDownload(signature.id, false)}
                  />
                  <Divider
                    isVertical
                    color="primary.600"
                    opacity={signature.isAnonymized ? 0.43 : undefined}
                  />
                  <Menu placement="bottom-end">
                    <Tooltip
                      label={intl.formatMessage({
                        id: "generic.more-options",
                        defaultMessage: "More options...",
                      })}
                    >
                      <MenuButton
                        as={IconButton}
                        icon={<ChevronDownIcon fontSize="lg" />}
                        aria-label={intl.formatMessage({
                          id: "generic.more-options",
                          defaultMessage: "More options...",
                        })}
                        minWidth={8}
                      />
                    </Tooltip>
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
                  </Menu>
                </ButtonGroup>
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
      isAnonymized
      auditTrailFilename
    }
    ${SignerReference.fragments.PetitionSigner}
  `,
};

import { gql } from "@apollo/client";
import { Box, Button, Divider, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { TimeIcon } from "@parallel/chakra/icons";
import {
  NewSignatureRequestRow_PetitionFragment,
  SignatureConfigInput,
} from "@parallel/graphql/__types";
import { FormattedList, FormattedMessage } from "react-intl";
import { omit } from "remeda";
import { ContactLink } from "../common/ContactLink";
import { useSignerSelectDialog } from "./SignerSelectDialog";

interface NewSignatureRequestRowProps {
  petition: NewSignatureRequestRow_PetitionFragment;
  onUpdateConfig: (data: SignatureConfigInput | null) => Promise<void>;
  onStart: () => void;
}

export function NewSignatureRequestRow({
  petition,
  onUpdateConfig,
  onStart,
}: NewSignatureRequestRowProps) {
  const signers = petition.signatureConfig?.contacts ?? [];
  const showSignerSelectDialog = useSignerSelectDialog();
  const handleStartSignature = async () => {
    try {
      if (signers.length === 0) {
        const { contactIds } = await showSignerSelectDialog({});
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
          <Stack direction="row" display="inline-flex" alignItems="center" color="gray.600">
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
              value={signers.map((contact, i) => [<ContactLink contact={contact} key={i} />])}
            />
          ) : (
            <FormattedMessage id="generic.not-specified" defaultMessage="Not specified" />
          )}
        </Box>
        <Stack flex="1" direction="row" justifyContent="flex-end">
          {petition.status === "PENDING" ? (
            <Button width="24" colorScheme="red" onClick={() => onUpdateConfig(null)}>
              <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
            </Button>
          ) : (
            <Flex alignItems="center">
              <Button width="24" onClick={() => onUpdateConfig(null)}>
                <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
              </Button>
              <Button width="24" colorScheme="purple" marginLeft={2} onClick={handleStartSignature}>
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

NewSignatureRequestRow.fragments = {
  Petition: gql`
    fragment NewSignatureRequestRow_Petition on Petition {
      status
      signatureConfig {
        contacts {
          ...ContactLink_Contact
        }
        provider
        review
        timezone
        title
      }
    }
    ${ContactLink.fragments.Contact}
  `,
};

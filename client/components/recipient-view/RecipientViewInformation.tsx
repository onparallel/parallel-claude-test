import { gql } from "@apollo/client";
import { Heading } from "@chakra-ui/react";
import { InfoCircleIcon, UserArrowIcon } from "@parallel/chakra/icons";
import { Box, Button, Flex, HStack, Stack, Text } from "@parallel/components/ui";
import {
  RecipientViewInformation_PublicContactFragment,
  RecipientViewInformation_PublicPetitionAccessFragment,
  RecipientViewInformation_PublicUserFragment,
} from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { CloseButton } from "../common/CloseButton";
import { useDelegateAccess } from "./hooks/useDelegateAccess";

interface RecipientViewInformationProps {
  keycode: string;
  access: RecipientViewInformation_PublicPetitionAccessFragment;
  onClose: () => void;
}

export function RecipientViewInformation({
  keycode,
  access,
  onClose,
}: RecipientViewInformationProps) {
  const sender = access.granter;
  const contact = access.contact;
  const recipients = access.petition.recipients;
  const message = access.message;
  const showDelegateAccess = access.petition.isDelegateAccessEnabled;

  const delegateAccess = useDelegateAccess();

  const handleDelegateAccess = () => {
    delegateAccess({
      keycode,
      contactName: contact?.fullName ?? "",
      organizationName: sender?.organization?.name ?? "",
    });
  };

  return (
    <Flex flexDirection="column" minWidth={0} height="100%" width="100%">
      <HStack
        paddingX={4}
        paddingY={3}
        borderBottom="1px solid"
        borderBottomColor="gray.200"
        justify="space-between"
        height="56px"
      >
        <Heading as="h3" size="sm" display="flex" alignItems="center">
          <InfoCircleIcon boxSize={6} marginEnd={2.5} />
          <FormattedMessage
            id="component.recipient-view-information.heading"
            defaultMessage="Information"
          />
        </Heading>
        <CloseButton size="sm" onClick={onClose} />
      </HStack>
      <Stack padding={4} gap={4} overflow="auto" height="100%">
        {sender ? (
          <Box>
            <Text fontSize="sm">
              <FormattedMessage id="recipient-view.requested-by" defaultMessage="Requested by" />:
            </Text>
            <Contact contact={sender} />
          </Box>
        ) : null}

        {message ? (
          <Box>
            <Text fontSize="sm">
              <FormattedMessage id="recipient-view.petition-subject" defaultMessage="Subject" />:
            </Text>
            {message.subject}
          </Box>
        ) : null}
        <Box flexWrap="wrap">
          <Text fontSize="sm">
            <FormattedMessage id="recipient-view.in-order-to" defaultMessage="To" />:
          </Text>
          <Stack gap={0}>
            {recipients.map((recipient, index) => {
              return <Contact key={index} contact={recipient} />;
            })}
          </Stack>
        </Box>
        {showDelegateAccess ? (
          <Flex alignItems="center">
            <Button
              leftIcon={<UserArrowIcon />}
              colorPalette="primary"
              variant="outline"
              onClick={handleDelegateAccess}
            >
              <FormattedMessage id="generic.share" defaultMessage="Share" />
            </Button>
          </Flex>
        ) : null}
      </Stack>
    </Flex>
  );
}

const _fragments = {
  PublicPetitionMessage: gql`
    fragment RecipientViewInformation_PublicPetitionMessage on PublicPetitionMessage {
      id
      subject
    }
  `,
  PublicContact: gql`
    fragment RecipientViewInformation_PublicContact on PublicContact {
      id
      fullName
      firstName
      email
    }
  `,
  PublicUser: gql`
    fragment RecipientViewInformation_PublicUser on PublicUser {
      id
      firstName
      fullName
      email
      organization {
        name
      }
    }
  `,
  PublicPetitionAccess: gql`
    fragment RecipientViewInformation_PublicPetitionAccess on PublicPetitionAccess {
      petition {
        id
        isDelegateAccessEnabled
        recipients {
          id
          ...RecipientViewInformation_PublicContact
        }
      }
      granter {
        id
        ...RecipientViewInformation_PublicUser
      }
      contact {
        id
        ...RecipientViewInformation_PublicContact
      }
      message {
        ...RecipientViewInformation_PublicPetitionMessage
      }
    }
  `,
};

function Contact({
  contact,
}: {
  contact:
    | RecipientViewInformation_PublicContactFragment
    | RecipientViewInformation_PublicUserFragment;
}) {
  return (
    <Flex align="baseline" flexWrap="wrap" gap={0.5}>
      <Text marginEnd={1}>{`${contact.fullName || contact.email}`}</Text>
      {contact.fullName ? <Text fontSize="sm">({contact.email})</Text> : null}
    </Flex>
  );
}

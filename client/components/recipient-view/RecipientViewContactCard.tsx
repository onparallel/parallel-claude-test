import { gql } from "@apollo/client";
import { Box, Button, Flex, Grid, Text, useToast } from "@chakra-ui/react";
import { EmailIcon, UserIcon } from "@parallel/chakra/icons";
import { Card, CardProps } from "@parallel/components/common/Card";
import {
  RecipientViewContactCard_PublicContactFragment,
  useRecipientViewContactCard_publicDelegateAccessToContactMutation,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { HelpPopover } from "../common/HelpPopover";
import { useDelegateAccessDialog } from "./DelegateAccessDialog";

interface RecipientViewContactCardProps extends CardProps {
  contact: RecipientViewContactCard_PublicContactFragment;
  organizationName: string;
  keycode: string;
}

export function RecipientViewContactCard({
  contact,
  keycode,
  organizationName,
  ...props
}: RecipientViewContactCardProps) {
  const intl = useIntl();
  const toast = useToast();

  const [
    publicDelegateAccessToContact,
  ] = useRecipientViewContactCard_publicDelegateAccessToContactMutation();
  const showDelegateAccessDialog = useDelegateAccessDialog();
  const handleDelegateAccess = async () => {
    try {
      const data = await showDelegateAccessDialog({
        keycode,
        contactName: contact.firstName ?? "",
        organizationName,
      });
      await publicDelegateAccessToContact({
        variables: {
          ...data,
          keycode,
        },
      });
      toast({
        title: intl.formatMessage({
          id: "recipient-view.petition-delegated.toast-header",
          defaultMessage: "Access delegated",
        }),
        description: intl.formatMessage(
          {
            id: "recipient-view.petition-delegated.toast-body",
            defaultMessage:
              "We have sent an email to {email} with instructions to access this petition.",
          },
          { email: data.email }
        ),
        duration: 5000,
        isClosable: true,
        status: "success",
      });
    } catch {}
  };

  return (
    <Card padding={6} {...props}>
      <Text fontWeight="bold">
        <FormattedMessage id="recipient-view.contact.to" defaultMessage="To:" />
      </Text>
      <Box marginTop={2}>
        <Grid
          as="dl"
          templateColumns="16px 1fr"
          templateRows="repeat(2, 1fr)"
          columnGap={2}
          rowGap={2}
        >
          <Flex as="dt" alignItems="center">
            <UserIcon
              boxSize="16px"
              aria-label={intl.formatMessage({
                id: "recipient-view.contact",
                defaultMessage: "Contact",
              })}
            />
          </Flex>
          <Box as="dd">
            <Text as="span">{contact.fullName}</Text>
          </Box>
          <Flex as="dt" alignItems="center">
            <EmailIcon
              boxSize="16px"
              aria-label={intl.formatMessage({
                id: "recipient-view.contact-email",
                defaultMessage: "Contact email",
              })}
            />
          </Flex>
          <Box as="dd">
            <Text as="span">{contact.email}</Text>
          </Box>
        </Grid>
      </Box>

      <Flex alignItems="center" marginTop={2}>
        <Button variant="link" onClick={handleDelegateAccess}>
          <FormattedMessage
            id="recipient-view.delegate-access"
            defaultMessage="Delegate access"
          />
        </Button>
        <HelpPopover marginLeft={2}>
          <FormattedMessage
            id="recipient-view.delegate-access.help"
            defaultMessage="Use this option to request someone else to complete the information for you."
          />
        </HelpPopover>
      </Flex>
    </Card>
  );
}

RecipientViewContactCard.fragments = {
  PublicContact: gql`
    fragment RecipientViewContactCard_PublicContact on PublicContact {
      id
      fullName
      firstName
      email
    }
  `,
};

RecipientViewContactCard.mutations = [
  gql`
    mutation RecipientViewContactCard_publicDelegateAccessToContact(
      $keycode: ID!
      $email: String!
      $firstName: String!
      $lastName: String!
      $messageBody: JSON!
    ) {
      publicDelegateAccessToContact(
        keycode: $keycode
        email: $email
        firstName: $firstName
        lastName: $lastName
        messageBody: $messageBody
      ) {
        petition {
          id
        }
      }
    }
  `,
];

import { gql } from "@apollo/client";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Flex,
  Heading,
  Img,
  SimpleGrid,
  Text,
  Tooltip,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import { CardProps } from "@parallel/components/common/Card";
import { Logo } from "@parallel/components/common/Logo";
import {
  RecipientView_PublicPetitionMessageFragment,
  RecipientViewHeader_PublicContactFragment,
  RecipientViewHeader_PublicUserFragment,
  useRecipientViewHeader_publicDelegateAccessToContactMutation,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { HelpPopover } from "../common/HelpPopover";
import { useDelegateAccessDialog } from "./DelegateAccessDialog";

function Contact({
  contact,
  isFull,
  semicolon,
  ...props
}: {
  contact:
    | RecipientViewHeader_PublicContactFragment
    | RecipientViewHeader_PublicUserFragment;
  isFull?: boolean;
  semicolon?: boolean;
}) {
  return (
    <Tooltip label={contact.email}>
      <Text
        as="span"
        whiteSpace="nowrap"
        marginRight={1}
        color="purple.600"
        _hover={{ color: "purple.800" }}
        {...props}
      >
        {`${contact.fullName || contact.email}${semicolon ? ";" : ""}`}
        {isFull && contact.fullName ? `<${contact.email}>` : null}
      </Text>
    </Tooltip>
  );
}

interface RecipientViewHeaderProps extends CardProps {
  sender: RecipientViewHeader_PublicUserFragment;
  contact: RecipientViewHeader_PublicContactFragment;
  recipients: RecipientViewHeader_PublicContactFragment[];
  message: RecipientView_PublicPetitionMessageFragment;
  keycode: string;
  isClosed: boolean;
}

export function RecipientViewHeader({
  sender,
  contact,
  message,
  recipients,
  keycode,
  isClosed,
  ...props
}: RecipientViewHeaderProps) {
  const intl = useIntl();
  const toast = useToast();
  const showDelegateAccessDialog = useDelegateAccessDialog();
  const [
    publicDelegateAccessToContact,
  ] = useRecipientViewHeader_publicDelegateAccessToContactMutation();

  const dividerOrientation = useBreakpointValue({
    base: {
      borderTop: "1px solid",
      borderColor: "gray.200",
      paddingTop: 4,
      marginTop: 4,
    },
    md: {
      borderLeft: "1px solid",
      borderColor: "gray.200",
      paddingLeft: 6,
      marginLeft: 6,
    },
  });

  const getRecipients = () => {
    return recipients.map((c, i) => {
      if (contact.email === c.email)
        return (
          <Text key={i} as="span" whiteSpace="nowrap" marginRight={1}>
            {`${c.fullName || c.email}${recipients.length > 1 ? ";" : ""}`}
          </Text>
        );
      else return <Contact key={i} contact={c} semicolon={true} />;
    });
  };

  const handleDelegateAccess = async () => {
    try {
      const data = await showDelegateAccessDialog({
        keycode,
        contactName: contact.firstName ?? "",
        organizationName: sender?.organization.name ?? "",
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
    <Box
      position="relative"
      width="100%"
      zIndex={3}
      backgroundColor="white"
      {...props}
    >
      <Flex flexDirection="column" alignItems="center">
        <Flex
          maxWidth="container.lg"
          width="100%"
          paddingY={{ base: 2, md: 3 }}
          paddingX={2.5}
          justifyContent="left"
        >
          {sender.organization.logoUrl ? (
            <Img
              src={sender.organization.logoUrl}
              aria-label={sender.organization.name}
              width="auto"
              height="40px"
            />
          ) : (
            <Logo width="152px" height="40px" />
          )}
        </Flex>
        <Accordion width="100%" allowMultiple defaultIndex={[isClosed ? 1 : 0]}>
          <AccordionItem justifyContent="center">
            <AccordionButton
              maxWidth="container.lg"
              marginX={"auto"}
              marginY={0}
              borderRadius={"md"}
              _hover={{ backgroundColor: "gray.75" }}
            >
              <Flex
                paddingX={{ base: 0, md: 0 }}
                width="100%"
                alignItems="center"
              >
                <Heading as="h2" flex="1" size="sm" textAlign="left">
                  <FormattedMessage
                    id="recipient-view.request-information"
                    defaultMessage="Request information"
                  />
                </Heading>
                <AccordionIcon boxSize={6} />
              </Flex>
            </AccordionButton>

            <AccordionPanel
              maxWidth="container.lg"
              width="100%"
              marginX={"auto"}
              marginY={0}
              paddingBottom={4}
            >
              <Flex
                flex="1"
                flexDirection={{ base: "column", md: "row" }}
                width="100%"
              >
                <Box flex="1">
                  <SimpleGrid columns={1} spacing={2}>
                    <Box>
                      <Text as="span" marginRight={2}>
                        <FormattedMessage
                          id="recipient-view.requested-by"
                          defaultMessage="Requested by"
                        />
                        :
                      </Text>
                      <Contact contact={sender} />
                    </Box>
                    <Box>
                      <Text as="span" marginRight={2}>
                        <FormattedMessage
                          id="recipient-view.petition-subject"
                          defaultMessage="Subject"
                        />
                        :
                      </Text>
                      {message.subject}
                    </Box>
                  </SimpleGrid>
                </Box>
                <Box flex="2" {...dividerOrientation}>
                  <SimpleGrid columns={1} spacing={2}>
                    <Flex flexWrap="wrap">
                      <Text as="span" whiteSpace="nowrap" marginRight={2}>
                        <FormattedMessage
                          id="recipient-view.in-order-to"
                          defaultMessage="To"
                        />
                        :
                      </Text>
                      {getRecipients()}
                    </Flex>
                    <Flex alignItems="center">
                      <Button variant="link" onClick={handleDelegateAccess}>
                        <Text fontWeight="bold">
                          <FormattedMessage
                            id="recipient-view.invite-collaborator"
                            defaultMessage="Invite collaborator"
                          />
                        </Text>
                      </Button>
                      <HelpPopover
                        color="gray.300"
                        _hover={{ color: "gray.400" }}
                        marginLeft={2}
                      >
                        <FormattedMessage
                          id="recipient-view.delegate-access.help"
                          defaultMessage="Use this option to request someone else to complete the information for you."
                        />
                      </HelpPopover>
                    </Flex>
                  </SimpleGrid>
                </Box>
              </Flex>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Flex>
    </Box>
  );
}

RecipientViewHeader.fragments = {
  PublicContact: gql`
    fragment RecipientViewHeader_PublicContact on PublicContact {
      id
      fullName
      firstName
      email
    }
  `,
  PublicUser: gql`
    fragment RecipientViewHeader_PublicUser on PublicUser {
      id
      firstName
      fullName
      email
      organization {
        name
        identifier
        logoUrl
      }
    }
  `,
};

RecipientViewHeader.mutations = [
  gql`
    mutation RecipientViewHeader_publicDelegateAccessToContact(
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
          recipients {
            id
            fullName
            email
          }
        }
      }
    }
  `,
];

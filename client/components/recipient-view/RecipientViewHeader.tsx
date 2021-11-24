import { gql, useMutation } from "@apollo/client";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Divider,
  DividerProps,
  Flex,
  Heading,
  HStack,
  Img,
  Stack,
  Text,
  Tooltip,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import { CloudOkIcon, HelpOutlineIcon } from "@parallel/chakra/icons";
import { CardProps } from "@parallel/components/common/Card";
import { Logo } from "@parallel/components/common/Logo";
import {
  RecipientViewHeader_PublicContactFragment,
  RecipientViewHeader_publicDelegateAccessToContactDocument,
  RecipientViewHeader_PublicUserFragment,
  RecipientView_PublicPetitionMessageFragment,
  Tone,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { EnumerateList } from "@parallel/utils/EnumerateList";
import { useUserPreference } from "@parallel/utils/useUserPreference";
import { useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ContactListPopover } from "../common/ContactListPopover";
import { HelpPopover } from "../common/HelpPopover";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SmallPopover } from "../common/SmallPopover";
import { useTone } from "../common/ToneProvider";
import { useDelegateAccessDialog } from "./dialogs/DelegateAccessDialog";
import { useRecipientViewHelpDialog } from "./dialogs/RecipientViewHelpModal";
import { useLastSaved } from "./LastSavedProvider";
function Contact({
  contact,
  isFull,
  ...props
}: {
  contact: RecipientViewHeader_PublicContactFragment | RecipientViewHeader_PublicUserFragment;
  isFull?: boolean;
}) {
  return (
    <Tooltip label={contact.email}>
      <Text
        as="span"
        whiteSpace="nowrap"
        color="purple.600"
        _hover={{ color: "purple.800" }}
        {...props}
        tabIndex={0}
      >
        {`${contact.fullName || contact.email}`}
        {isFull && contact.fullName ? `<${contact.email}>` : null}
      </Text>
    </Tooltip>
  );
}

interface RecipientViewHeaderProps extends CardProps {
  sender: RecipientViewHeader_PublicUserFragment;
  contact: RecipientViewHeader_PublicContactFragment;
  recipients: RecipientViewHeader_PublicContactFragment[];
  message: RecipientView_PublicPetitionMessageFragment | null | undefined;
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
  const [publicDelegateAccessToContact] = useMutation(
    RecipientViewHeader_publicDelegateAccessToContactDocument
  );

  const dividerOrientation = useBreakpointValue<DividerProps["orientation"]>({
    base: "horizontal",
    md: "vertical",
  });

  const tone = useTone();
  const handleHelpClick = useHelpModal({ tone });
  const { lastSaved } = useLastSaved();

  const handleDelegateAccess = async () => {
    try {
      const data = await showDelegateAccessDialog({
        keycode,
        contactName: contact.firstName ?? "",
        organizationName: sender?.organization.name ?? "",
        tone,
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
    <Box position="relative" width="100%" zIndex={3} backgroundColor="white" {...props}>
      <Flex flexDirection="column" alignItems="center">
        <Flex
          maxWidth="container.lg"
          width="100%"
          paddingY={{ base: 2, md: 3 }}
          paddingX={2.5}
          justifyContent="space-between"
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
          <HStack spacing={3}>
            {lastSaved ? (
              <SmallPopover
                content={
                  <Box fontSize="sm">
                    <Text mb={2}>
                      <FormattedMessage
                        id="recipient-view.last-saved-info"
                        defaultMessage="Your answers are automatically saved."
                      />
                    </Text>
                    <Text>
                      <FormattedMessage
                        id="recipient-view.last-saved-info-date"
                        defaultMessage="<b>Last saved:</b> {date}"
                        values={{ date: intl.formatDate(lastSaved, FORMATS.LLL) }}
                      />
                    </Text>
                  </Box>
                }
                placement="bottom"
                width="320px"
              >
                <HStack>
                  <CloudOkIcon fontSize="18px" color="green.600" />
                  <Text
                    fontStyle="italic"
                    color="green.600"
                    display={{ base: "none", md: "block" }}
                  >
                    <FormattedMessage
                      id="recipient-view.last-saved-time"
                      defaultMessage="Last saved {time}"
                      values={{ time: intl.formatDate(lastSaved, FORMATS.HHmm) }}
                    />
                  </Text>
                  <Text
                    fontStyle="italic"
                    color="green.600"
                    display={{ base: "block", md: "none" }}
                  >
                    <FormattedMessage
                      id="recipient-view.last-saved-time-short"
                      defaultMessage="Saved {time}"
                      values={{ time: intl.formatDate(lastSaved, FORMATS.HHmm) }}
                    />
                  </Text>
                </HStack>
              </SmallPopover>
            ) : null}

            <IconButtonWithTooltip
              label={intl.formatMessage({
                id: "recipient-view.need-help",
                defaultMessage: "Help",
              })}
              placement="bottom"
              size="md"
              variant="ghost"
              backgroundColor="white"
              isRound
              onClick={handleHelpClick}
              icon={<HelpOutlineIcon fontSize="22px" />}
            />
          </HStack>
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
              <Flex paddingX={{ base: 0, md: 0 }} width="100%" alignItems="center">
                <Heading as="h2" flex="1" size="sm" textAlign="left">
                  <FormattedMessage
                    id="recipient-view.request-information"
                    defaultMessage="Request information"
                  />
                </Heading>
              </Flex>
              <AccordionIcon boxSize={6} />
            </AccordionButton>

            <AccordionPanel
              maxWidth="container.lg"
              width="100%"
              marginX={"auto"}
              marginY={0}
              paddingBottom={4}
            >
              <Stack
                direction={{ base: "column", md: "row" }}
                alignItems="stretch"
                spacing={4}
                divider={<Divider height="auto" orientation={dividerOrientation} />}
              >
                <Stack flex="1">
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
                  {message ? (
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
                  ) : null}
                </Stack>
                <Stack flex="2">
                  <Box flexWrap="wrap">
                    <Text as="span" whiteSpace="nowrap" marginRight={2}>
                      <FormattedMessage id="recipient-view.in-order-to" defaultMessage="To" />:
                    </Text>
                    <EnumerateList
                      maxItems={7}
                      values={recipients}
                      renderItem={({ value }, index) => {
                        if (contact.email === value.email)
                          return (
                            <Text key={index} as="span" whiteSpace="nowrap">
                              {`${value.fullName || value.email}`}
                            </Text>
                          );
                        else return <Contact key={index} contact={value} />;
                      }}
                      renderOther={({ children, remaining }) => {
                        return (
                          <ContactListPopover key="other" contacts={remaining}>
                            <Text
                              display="initial"
                              color="purple.600"
                              _hover={{ color: "purple.800" }}
                            >
                              {children}
                            </Text>
                          </ContactListPopover>
                        );
                      }}
                      type="conjunction"
                    />
                  </Box>
                  <Flex alignItems="center">
                    <Button variant="link" onClick={handleDelegateAccess}>
                      <Text fontWeight="bold">
                        <FormattedMessage
                          id="recipient-view.invite-collaborator"
                          defaultMessage="Invite collaborator"
                        />
                      </Text>
                    </Button>
                    <HelpPopover>
                      <FormattedMessage
                        id="recipient-view.invite-collaborator.help"
                        defaultMessage="Use this option to request someone else to complete the information for you."
                      />
                    </HelpPopover>
                  </Flex>
                </Stack>
              </Stack>
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

function useHelpModal({ tone }: { tone: Tone }) {
  const [firstTime, setFirstTime] = useUserPreference("recipient-first-time-check", "");
  const showRecipientViewHelpDialog = useRecipientViewHelpDialog();

  useEffect(() => {
    if (firstTime !== "check") showHelp();
  }, []);

  async function showHelp() {
    try {
      await showRecipientViewHelpDialog({ tone });
      setFirstTime("check");
    } catch {}
  }
  return async function () {
    try {
      await showRecipientViewHelpDialog({ tone });
    } catch {}
  };
}

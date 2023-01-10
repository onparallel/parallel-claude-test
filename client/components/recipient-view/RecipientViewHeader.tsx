import { gql, useMutation } from "@apollo/client";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Avatar,
  Box,
  Button,
  Circle,
  Divider,
  DividerProps,
  Flex,
  Heading,
  HStack,
  IconButton,
  Img,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Text,
  Tooltip,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import {
  CloudOkIcon,
  DownloadIcon,
  HelpOutlineIcon,
  HomeIcon,
  MoreVerticalIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Logo } from "@parallel/components/common/Logo";
import {
  RecipientViewHeader_PublicContactFragment,
  RecipientViewHeader_publicDelegateAccessToContactDocument,
  RecipientViewHeader_PublicUserFragment,
  RecipientView_PublicPetitionMessageFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { EnumerateList } from "@parallel/utils/EnumerateList";
import { usePublicPrintPdfTask } from "@parallel/utils/tasks/usePublicPrintPdfTask";
import { FormattedMessage, useIntl } from "react-intl";
import { ContactListPopover } from "../common/ContactListPopover";
import { HelpPopover } from "../common/HelpPopover";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import { SmallPopover } from "../common/SmallPopover";
import { useTone } from "../common/ToneProvider";
import { useDelegateAccessDialog } from "./dialogs/DelegateAccessDialog";
import { useLastSaved } from "./LastSavedProvider";
import { useHelpModal } from "./useHelpModal";

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
        color="primary.600"
        _hover={{ color: "primary.800" }}
        {...props}
        tabIndex={0}
      >
        {`${contact.fullName || contact.email}`}
        {isFull && contact.fullName ? `<${contact.email}>` : null}
      </Text>
    </Tooltip>
  );
}

interface RecipientViewHeaderProps {
  sender: RecipientViewHeader_PublicUserFragment;
  contact: RecipientViewHeader_PublicContactFragment;
  recipients: RecipientViewHeader_PublicContactFragment[];
  message: RecipientView_PublicPetitionMessageFragment | null | undefined;
  hasClientPortalAccess: boolean;
  pendingPetitions: number;
  keycode: string;
  isClosed: boolean;
}

export const RecipientViewHeader = Object.assign(
  chakraForwardRef<"section", RecipientViewHeaderProps>(function RecipientViewHeader(
    {
      sender,
      contact,
      message,
      recipients,
      hasClientPortalAccess,
      pendingPetitions,
      keycode,
      isClosed,
      ...props
    },
    ref
  ) {
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
                "We have sent an email to {email} with instructions to access this parallel.",
            },
            { email: data.email }
          ),
          duration: 5000,
          isClosable: true,
          status: "success",
        });
      } catch {}
    };

    const publicPrintPdfTask = usePublicPrintPdfTask();

    return (
      <Box
        ref={ref as any}
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
                    <CloudOkIcon fontSize="18px" color="green.600" role="presentation" />
                    <Text
                      fontStyle="italic"
                      color="green.600"
                      display={{ base: "none", md: "block" }}
                    >
                      <FormattedMessage
                        id="recipient-view.last-saved-time"
                        defaultMessage="Last saved {time}"
                        values={{ time: intl.formatDate(lastSaved, FORMATS.LT) }}
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
                        values={{ time: intl.formatDate(lastSaved, FORMATS.LT) }}
                      />
                    </Text>
                  </HStack>
                </SmallPopover>
              ) : null}
              <HStack display={{ base: "none", md: "flex" }} spacing={0} gap={2}>
                <IconButtonWithTooltip
                  onClick={() => publicPrintPdfTask(keycode)}
                  icon={<DownloadIcon boxSize={6} />}
                  label={intl.formatMessage({
                    id: "recipient-view.export-to-pdf",
                    defaultMessage: "Export to PDF",
                  })}
                  variant="ghost"
                />
                {hasClientPortalAccess ? null : (
                  <IconButtonWithTooltip
                    onClick={handleHelpClick}
                    icon={<HelpOutlineIcon boxSize={6} />}
                    label={intl.formatMessage({
                      id: "recipient-view.guide-me",
                      defaultMessage: "Guide me",
                    })}
                    variant="ghost"
                  />
                )}
              </HStack>

              {hasClientPortalAccess ? (
                <Menu placement="bottom-end">
                  <Tooltip
                    placement="bottom"
                    label={intl.formatMessage({
                      id: "header.user-menu-button",
                      defaultMessage: "User menu",
                    })}
                    whiteSpace="nowrap"
                  >
                    <MenuButton
                      as={Button}
                      aria-label={intl.formatMessage({
                        id: "header.user-menu-button",
                        defaultMessage: "User menu",
                      })}
                      _hover={{
                        shadow: "long",
                        transform: "scale(1.1)",
                      }}
                      _active={{
                        shadow: "long",
                        transform: "scale(1.1)",
                      }}
                      borderRadius="full"
                      height={10}
                      paddingLeft={0}
                      paddingRight={0}
                      transition="all 200ms"
                    >
                      <Avatar
                        name={contact.fullName}
                        boxSize={10}
                        size="md"
                        getInitials={contact.initials ? () => contact.initials! : undefined}
                      />
                      {pendingPetitions ? (
                        <Circle
                          size="16px"
                          background="yellow.500"
                          position="absolute"
                          top="-4px"
                          right="-4px"
                          border="1px solid"
                          borderColor="white"
                        />
                      ) : null}
                    </MenuButton>
                  </Tooltip>
                  <Portal>
                    <MenuList minW="min-content">
                      <HStack paddingX={3.5} paddingY={1} position="relative">
                        <Avatar
                          name={contact.fullName}
                          size="sm"
                          getInitials={contact.initials ? () => contact.initials! : undefined}
                        />
                        <Stack spacing={0}>
                          <Text as="div" fontWeight="semibold">
                            {contact.fullName}
                          </Text>
                          <Text as="div" color="gray.600" fontSize="sm">
                            {contact.email}
                          </Text>
                        </Stack>
                      </HStack>

                      <MenuDivider />
                      <MenuItem
                        display={{ base: "flex", md: "none" }}
                        onClick={() => publicPrintPdfTask(keycode)}
                        icon={<DownloadIcon display="block" boxSize={4} />}
                      >
                        <FormattedMessage
                          id="recipient-view.export-to-pdf"
                          defaultMessage="Export to PDF"
                        />
                      </MenuItem>
                      <NakedLink href={`/petition/${keycode}/home`}>
                        <MenuItem as="a" icon={<HomeIcon display="block" boxSize={4} />}>
                          <HStack justifyContent="space-between">
                            <Text as="span">
                              <FormattedMessage
                                id="recipient-view.go-to-my-processes"
                                defaultMessage="Go to my processes"
                              />
                            </Text>

                            {pendingPetitions ? (
                              <HStack fontWeight={600} color="yellow.500" spacing={1}>
                                <Text as="span">{pendingPetitions}</Text>
                                <TimeIcon boxSize={4} color="yellow.600" />
                              </HStack>
                            ) : null}
                          </HStack>
                        </MenuItem>
                      </NakedLink>
                      <MenuItem
                        onClick={handleHelpClick}
                        icon={<HelpOutlineIcon display="block" boxSize={4} />}
                      >
                        <FormattedMessage id="recipient-view.guide-me" defaultMessage="Guide me" />
                      </MenuItem>
                    </MenuList>
                  </Portal>
                </Menu>
              ) : (
                <Menu placement="bottom-end">
                  <Tooltip
                    placement="bottom-end"
                    label={intl.formatMessage({
                      id: "generic.options",
                      defaultMessage: "Options...",
                    })}
                    whiteSpace="nowrap"
                  >
                    <MenuButton
                      as={IconButton}
                      variant="outline"
                      icon={<MoreVerticalIcon />}
                      aria-label={intl.formatMessage({
                        id: "generic.options",
                        defaultMessage: "Options...",
                      })}
                      display={{ base: "inline-flex", md: "none" }}
                    />
                  </Tooltip>
                  <Portal>
                    <MenuList minW="min-content">
                      <MenuItem
                        onClick={() => publicPrintPdfTask(keycode)}
                        icon={<DownloadIcon fontSize="md" />}
                      >
                        <FormattedMessage
                          id="recipient-view.export-to-pdf"
                          defaultMessage="Export to PDF"
                        />
                      </MenuItem>
                      <MenuItem onClick={handleHelpClick} icon={<HelpOutlineIcon fontSize="md" />}>
                        <FormattedMessage id="recipient-view.guide-me" defaultMessage="Guide me" />
                      </MenuItem>
                    </MenuList>
                  </Portal>
                </Menu>
              )}
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
                      defaultMessage="Information"
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
                  divider={<Divider height="auto" orientation={dividerOrientation ?? "vertical"} />}
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
                                color="primary.600"
                                _hover={{ color: "primary.800" }}
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
  }),
  {
    fragments: {
      PublicContact: gql`
        fragment RecipientViewHeader_PublicContact on PublicContact {
          id
          fullName
          firstName
          email
          initials
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
            logoUrl(options: { resize: { height: 80 } })
          }
        }
      `,
    },
  }
);

const _mutations = [
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

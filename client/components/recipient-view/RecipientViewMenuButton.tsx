import { gql } from "@apollo/client";
import {
  Circle,
  HStack,
  IconButton,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { Menu, Tooltip } from "@parallel/chakra/components";
import {
  DownloadIcon,
  HelpOutlineIcon,
  HomeIcon,
  MoreVerticalIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import { RecipientViewMenuButton_PublicContactFragment } from "@parallel/graphql/__types";
import { usePublicPrintPdfTask } from "@parallel/utils/tasks/usePublicPrintPdfTask";
import { FormattedMessage, useIntl } from "react-intl";
import NextLink from "next/link";
import { useTone } from "../common/ToneProvider";
import { Avatar } from "../ui";
import { useRecipientViewHelpDialog } from "./dialogs/RecipientViewHelpDialog";
import { Button, Text } from "@parallel/components/ui";
export function RecipientViewMenuButton({
  keycode,
  hasClientPortalAccess,
  pendingPetitions,
  contact,
  hideHomeButton,
}: {
  keycode: string;
  hasClientPortalAccess: boolean;
  pendingPetitions: number;
  contact: RecipientViewMenuButton_PublicContactFragment;
  hideHomeButton?: boolean;
}) {
  const intl = useIntl();
  const tone = useTone();
  const showRecipientViewHelpDialog = useRecipientViewHelpDialog();

  function showHelpModal() {
    showRecipientViewHelpDialog.ignoringDialogErrors({ tone }).then();
  }

  const showExportPdfInMenu = useBreakpointValue({
    base: true,
    md: false,
  });

  const publicPrintPdfTask = usePublicPrintPdfTask();

  if (hasClientPortalAccess) {
    return (
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
            paddingStart={0}
            paddingEnd={0}
            transition="all 200ms"
          >
            <Avatar.Root
              boxSize={10}
              size="md"
              getInitials={contact.initials ? () => contact.initials! : undefined}
            >
              <Avatar.Fallback name={contact.fullName} />
            </Avatar.Root>
            {pendingPetitions > 0 ? (
              <Circle
                size="16px"
                background="yellow.500"
                position="absolute"
                top="-4px"
                insetEnd="-4px"
                border="1px solid"
                borderColor="white"
              />
            ) : null}
          </MenuButton>
        </Tooltip>
        <Portal>
          <MenuList minW="min-content">
            <HStack paddingX={3.5} paddingY={1} position="relative">
              <Avatar.Root
                size="sm"
                getInitials={contact.initials ? () => contact.initials! : undefined}
              >
                <Avatar.Fallback name={contact.fullName} />
              </Avatar.Root>
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
            {showExportPdfInMenu ? (
              <MenuItem
                onClick={() => publicPrintPdfTask(keycode)}
                icon={<DownloadIcon display="block" boxSize={4} />}
              >
                <FormattedMessage
                  id="generic.recipient-view-export-to-pdf"
                  defaultMessage="Export to PDF"
                />
              </MenuItem>
            ) : null}
            {hideHomeButton ? null : (
              <MenuItem
                as={NextLink}
                href={`/petition/${keycode}/home${pendingPetitions ? "?status=PENDING" : ""}`}
                icon={<HomeIcon display="block" boxSize={4} />}
              >
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
            )}

            <MenuItem
              onClick={showHelpModal}
              icon={<HelpOutlineIcon display="block" boxSize={4} />}
            >
              <FormattedMessage id="generic.recipient-view-guide-me" defaultMessage="Guide me" />
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    );
  }

  return (
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
              id="generic.recipient-view-export-to-pdf"
              defaultMessage="Export to PDF"
            />
          </MenuItem>
          <MenuItem onClick={showHelpModal} icon={<HelpOutlineIcon fontSize="md" />}>
            <FormattedMessage id="generic.recipient-view-guide-me" defaultMessage="Guide me" />
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  );
}

const _fragments = {
  PublicContact: gql`
    fragment RecipientViewMenuButton_PublicContact on PublicContact {
      id
      fullName
      firstName
      email
      initials
    }
  `,
};

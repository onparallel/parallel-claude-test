import { gql } from "@apollo/client";
import {
  Avatar,
  Box,
  Button,
  HStack,
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
} from "@chakra-ui/react";
import { HelpOutlineIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Logo } from "@parallel/components/common/Logo";
import {
  RecipientPortalHeader_PublicContactFragment,
  RecipientPortalHeader_PublicUserFragment,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { useTone } from "../common/ToneProvider";
import { useHelpModal } from "./useHelpModal";

interface RecipientPortalHeaderProps {
  sender: RecipientPortalHeader_PublicUserFragment;
  contact: RecipientPortalHeader_PublicContactFragment;
  keycode: string;
}

export const RecipientPortalHeader = Object.assign(
  chakraForwardRef<"section", RecipientPortalHeaderProps>(function RecipientPortalHeader(
    { sender, contact, keycode, ...props },
    ref
  ) {
    const intl = useIntl();
    const tone = useTone();
    const handleHelpClick = useHelpModal({ tone });
    return (
      <Box
        ref={ref as any}
        position="relative"
        width="100%"
        zIndex={3}
        backgroundColor="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        {...props}
      >
        <HStack
          maxWidth="container.lg"
          margin="0 auto"
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
          <HStack spacing={0} gap={3}>
            <Text>
              <FormattedMessage
                id="component.recipient-portal-header.hello-name"
                defaultMessage="Hello, {name}!"
                values={{ name: contact.firstName }}
              />
            </Text>
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
                </MenuButton>
              </Tooltip>
              <Portal>
                <MenuList minW="min-content">
                  <HStack paddingX={3.5} paddingY={1}>
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

                  <MenuItem onClick={handleHelpClick} icon={<HelpOutlineIcon fontSize="md" />}>
                    <FormattedMessage id="recipient-view.guide-me" defaultMessage="Guide me" />
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          </HStack>
        </HStack>
      </Box>
    );
  }),
  {
    fragments: {
      PublicContact: gql`
        fragment RecipientPortalHeader_PublicContact on PublicContact {
          id
          fullName
          firstName
          email
          initials
        }
      `,
      PublicUser: gql`
        fragment RecipientPortalHeader_PublicUser on PublicUser {
          id
          organization {
            name
            logoUrl(options: { resize: { height: 80 } })
          }
        }
      `,
    },
  }
);

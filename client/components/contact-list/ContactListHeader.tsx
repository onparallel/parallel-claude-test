import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Tooltip,
} from "@chakra-ui/react";
import { MoreVerticalIcon, RepeatIcon, UploadIcon, UserPlusIcon } from "@parallel/chakra/icons";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { ResponsiveButtonIcon } from "../common/ResponsiveButtonIcon";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export interface ContactListHeaderProps {
  search: string | null;
  onSearchChange: (value: string | null) => void;
  onReload: () => void;
  onCreateClick: () => void;
  onImportClick: () => void;
}

export function ContactListHeader({
  search: _search,
  onSearchChange,
  onReload,
  onCreateClick,
  onImportClick,
}: ContactListHeaderProps) {
  const intl = useIntl();
  const [search, setSearch] = useState(_search ?? "");
  const debouncedOnSearchChange = useDebouncedCallback(onSearchChange, 300, [onSearchChange]);
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange]
  );
  return (
    <Stack direction="row" padding={2}>
      <Box flex="0 1 400px">
        <SearchInput id="contacts-search" value={search ?? ""} onChange={handleSearchChange} />
      </Box>
      <IconButtonWithTooltip
        id="contacts-reload"
        onClick={() => onReload()}
        icon={<RepeatIcon />}
        placement="bottom"
        variant="outline"
        label={intl.formatMessage({
          id: "generic.reload-data",
          defaultMessage: "Reload",
        })}
      />
      <Spacer />
      <Button display={{ base: "none", md: "block" }} variant="outline" onClick={onImportClick}>
        <FormattedMessage
          id="component.contact-list-header.import-contacts-button"
          defaultMessage="Import contacts"
        />
      </Button>
      <ResponsiveButtonIcon
        display={{ base: "none", md: "block" }}
        breakpoint="lg"
        icon={<UserPlusIcon />}
        hideIconOnDesktop
        colorScheme="primary"
        onClick={onCreateClick}
        label={intl.formatMessage({
          id: "component.contact-list-header.create-contact-button",
          defaultMessage: "Create contact",
        })}
      />
      <Menu placement="bottom-end">
        <Tooltip
          placement="bottom-end"
          label={intl.formatMessage({
            id: "generic.more-options",
            defaultMessage: "More options...",
          })}
          whiteSpace="nowrap"
        >
          <MenuButton
            display={{ base: "block", md: "none" }}
            as={IconButton}
            variant="outline"
            icon={<MoreVerticalIcon />}
            aria-label={intl.formatMessage({
              id: "generic.more-options",
              defaultMessage: "More options...",
            })}
          />
        </Tooltip>
        <Portal>
          <MenuList width="min-content">
            <MenuItem onClick={onImportClick} icon={<UploadIcon display="block" boxSize={4} />}>
              <FormattedMessage
                id="component.contact-list-header.import-contacts-button"
                defaultMessage="Import contacts"
              />
            </MenuItem>
            <MenuItem
              justifyContent="left"
              type="submit"
              onClick={onCreateClick}
              icon={<UserPlusIcon display="block" boxSize={4} />}
            >
              <FormattedMessage
                id="component.contact-list-header.create-contact-button"
                defaultMessage="Create contact"
              />
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    </Stack>
  );
}

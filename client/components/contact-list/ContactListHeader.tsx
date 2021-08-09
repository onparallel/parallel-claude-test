import { Box, Button, Menu, MenuButton, MenuItem, MenuList, Portal, Stack } from "@chakra-ui/react";
import { ChevronDownIcon, DeleteIcon, RepeatIcon } from "@parallel/chakra/icons";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export interface ContactListHeaderProps {
  search: string | null;
  showActions: boolean;
  onSearchChange: (value: string | null) => void;
  onReload: () => void;
  onDeleteClick: () => void;
  onCreateClick: () => void;
  onImportClick: () => void;
}

export function ContactListHeader({
  search: _search,
  showActions,
  onSearchChange,
  onReload,
  onCreateClick,
  onDeleteClick,
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
      {showActions ? (
        <Box>
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
              <FormattedMessage
                id="component.contact-list-header.actions-button"
                defaultMessage="Actions"
              />
            </MenuButton>
            <Portal>
              <MenuList minWidth="160px">
                <MenuItem onClick={onDeleteClick} icon={<DeleteIcon display="block" boxSize={4} />}>
                  <FormattedMessage
                    id="component.contact-list-header.delete-label"
                    defaultMessage="Delete selected"
                  />
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        </Box>
      ) : null}
      <Button variant="outline" onClick={onImportClick}>
        <FormattedMessage
          id="component.contact-list-header.import-contacts-button"
          defaultMessage="Import contacts"
        />
      </Button>
      <Button colorScheme="purple" onClick={onCreateClick} id="pw-new-contact">
        <FormattedMessage
          id="component.contact-list-header.create-contact-button"
          defaultMessage="Create contact"
        />
      </Button>
    </Stack>
  );
}

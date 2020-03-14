import { Box, Button, Stack, MenuList, MenuItem, Icon } from "@chakra-ui/core";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";
import { ButtonDropdown } from "../common/ButtonDropdown";

export interface ContactListHeaderProps {
  search: string | null;
  showActions: boolean;
  onSearchChange: (value: string | null) => void;
  // onStatusChange: (value: PetitionStatus | null) => void;
  onDeleteClick: () => void;
  onCreateClick: () => void;
}

export function ContactListHeader({
  search: _search,
  showActions,
  onSearchChange,
  onCreateClick,
  onDeleteClick
}: // onStatusChange,
ContactListHeaderProps) {
  const [search, setSearch] = useState(_search ?? "");
  const debouncedOnSearchChange = useDebouncedCallback(onSearchChange, 300, [
    onSearchChange
  ]);
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange]
  );
  return (
    <Stack direction="row" padding={4}>
      <Box flex="0 1 400px">
        <SearchInput value={search ?? ""} onChange={handleSearchChange} />
      </Box>
      <Spacer />
      {showActions ? (
        <Box>
          <ButtonDropdown
            rightIcon="chevron-down"
            children={
              <FormattedMessage
                id="components.contact-list-header.actions-button"
                defaultMessage="Actions"
              ></FormattedMessage>
            }
            dropdown={
              <MenuList minWidth="160px">
                <MenuItem onClick={onDeleteClick}>
                  <Icon name="delete" marginRight={2} />
                  <FormattedMessage
                    id="components.contact-list-header.delete-label"
                    defaultMessage="Delete selected"
                  />
                </MenuItem>
              </MenuList>
            }
          ></ButtonDropdown>
        </Box>
      ) : null}
      <Button variantColor="purple" onClick={onCreateClick}>
        <FormattedMessage
          id="components.contact-list-header.create-contact-button"
          defaultMessage="Create contact"
        />
      </Button>
    </Stack>
  );
}

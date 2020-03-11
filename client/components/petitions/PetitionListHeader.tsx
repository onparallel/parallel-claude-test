import {
  Box,
  Button,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack
} from "@chakra-ui/core";
import { PetitionStatus } from "@parallel/graphql/__types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionStatusFilter } from "../common/PetitionStatusFilter";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";
import { ButtonDropdown } from "../common/ButtonDropdown";

export interface PetitionListHeaderProps {
  search: string | null;
  status: PetitionStatus | null;
  showActions: boolean;
  onSearchChange: (value: string | null) => void;
  onStatusChange: (value: PetitionStatus | null) => void;
  onDeleteClick: () => void;
  onCreateClick: () => void;
}

export function PetitionListHeader({
  search: _search,
  status,
  showActions,
  onSearchChange,
  onStatusChange,
  onDeleteClick,
  onCreateClick
}: PetitionListHeaderProps) {
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
      <PetitionStatusFilter value={status} onChange={onStatusChange} />
      <Spacer />
      {showActions ? (
        <Box>
          <ButtonDropdown
            rightIcon="chevron-down"
            children={
              <FormattedMessage
                id="components.petition-list-header.actions-button"
                defaultMessage="Actions"
              ></FormattedMessage>
            }
            dropdown={
              <MenuList minWidth="160px">
                <MenuItem onClick={onDeleteClick}>
                  <Icon name="delete" marginRight={2} />
                  <FormattedMessage
                    id="components.petition-list-header.delete-label"
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
          id="components.petition-list-header.create-petition-button"
          defaultMessage="Create petition"
        />
      </Button>
    </Stack>
  );
}

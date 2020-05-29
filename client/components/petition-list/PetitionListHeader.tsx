import {
  Box,
  Button,
  Icon,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
} from "@chakra-ui/core";
import { PetitionStatus } from "@parallel/graphql/__types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { identity } from "remeda";
import { ButtonDropdown } from "../common/ButtonDropdown";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { PetitionStatusFilter } from "../common/PetitionStatusFilter";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export interface PetitionListHeaderProps {
  search: string | null;
  status: PetitionStatus | null;
  showClone: boolean;
  showDelete: boolean;
  onSearchChange: (value: string | null) => void;
  onStatusChange: (value: PetitionStatus | null) => void;
  onDeleteClick: () => void;
  onCreateClick: () => void;
  onReload: () => void;
  onCloneClick: () => void;
}

export function PetitionListHeader({
  search: _search,
  status,
  showClone,
  showDelete,
  onSearchChange,
  onStatusChange,
  onDeleteClick,
  onCreateClick,
  onReload,
  onCloneClick,
}: PetitionListHeaderProps) {
  const intl = useIntl();
  const [search, setSearch] = useState(_search ?? "");
  const debouncedOnSearchChange = useDebouncedCallback(onSearchChange, 300, [
    onSearchChange,
  ]);
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange]
  );
  const showActions = [showDelete, showClone].some(identity);

  return (
    <Stack direction="row" padding={2}>
      <Box flex="0 1 400px">
        <SearchInput value={search ?? ""} onChange={handleSearchChange} />
      </Box>
      <IconButtonWithTooltip
        onClick={() => onReload()}
        icon="repeat"
        placement="bottom"
        variant="outline"
        label={intl.formatMessage({
          id: "generic.reload-data",
          defaultMessage: "Reload",
        })}
      />
      <PetitionStatusFilter value={status} onChange={onStatusChange} />
      <Spacer />
      {showActions ? (
        <Box>
          <ButtonDropdown
            rightIcon="chevron-down"
            dropdown={
              <MenuList minWidth="160px">
                <MenuItem onClick={onCloneClick} isDisabled={!showClone}>
                  <Icon name="copy" marginRight={2} />
                  <FormattedMessage
                    id="component.petition-list-header.clone-label"
                    defaultMessage="Clone petition"
                  />
                </MenuItem>
                <MenuDivider />
                <MenuItem onClick={onDeleteClick} isDisabled={!showDelete}>
                  <Icon name="delete" marginRight={2} />
                  <FormattedMessage
                    id="component.petition-list-header.delete-label"
                    defaultMessage="Delete selected"
                  />
                </MenuItem>
              </MenuList>
            }
          >
            <FormattedMessage
              id="generic.actions-button"
              defaultMessage="Actions"
            ></FormattedMessage>
          </ButtonDropdown>
        </Box>
      ) : null}
      <Button variantColor="purple" onClick={onCreateClick}>
        <FormattedMessage
          id="component.petition-list-header.create-petition-button"
          defaultMessage="Create petition"
        />
      </Button>
    </Stack>
  );
}

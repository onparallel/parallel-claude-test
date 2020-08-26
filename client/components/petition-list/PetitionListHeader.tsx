import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Stack,
} from "@chakra-ui/core";
import {
  ChevronDownIcon,
  CopyIcon,
  DeleteIcon,
  RepeatIcon,
} from "@parallel/chakra/icons";
import { PetitionStatus } from "@parallel/graphql/__types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { identity } from "remeda";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { PetitionListFilter } from "../common/PetitionListFilter";
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
        icon={<RepeatIcon />}
        placement="bottom"
        variant="outline"
        label={intl.formatMessage({
          id: "generic.reload-data",
          defaultMessage: "Reload",
        })}
      />
      <Box>
        <PetitionListFilter value={status} onChange={onStatusChange} />
      </Box>
      <Spacer />
      {showActions ? (
        <Box>
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
              <FormattedMessage
                id="generic.actions-button"
                defaultMessage="Actions"
              />
            </MenuButton>
            <Portal>
              <MenuList minWidth="160px">
                <MenuItem onClick={onCloneClick} isDisabled={!showClone}>
                  <CopyIcon marginRight={2} />
                  <FormattedMessage
                    id="component.petition-list-header.clone-label"
                    defaultMessage="Clone petition"
                  />
                </MenuItem>
                <MenuDivider />
                <MenuItem onClick={onDeleteClick} isDisabled={!showDelete}>
                  <DeleteIcon marginRight={2} />
                  <FormattedMessage
                    id="component.petition-list-header.delete-label"
                    defaultMessage="Delete selected"
                  />
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        </Box>
      ) : null}
      <Button colorScheme="purple" onClick={onCreateClick}>
        <FormattedMessage
          id="component.petition-list-header.create-petition-button"
          defaultMessage="Create petition"
        />
      </Button>
    </Stack>
  );
}

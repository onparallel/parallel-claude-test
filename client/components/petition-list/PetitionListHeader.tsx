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
  SaveIcon,
} from "@parallel/chakra/icons";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { identity, pick } from "remeda";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import {
  PetitionListFilter,
  PetitionListFilterProps,
} from "../common/PetitionListFilter";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export type PetitionListHeaderProps = PetitionListFilterProps & {
  search: string | null;
  showClone: boolean;
  showDelete: boolean;
  showCreateTemplates: boolean;
  onSearchChange: (value: string | null) => void;
  onDeleteClick: () => void;
  onCreateClick: () => void;
  onCreateTemplateClick: () => void;
  onReload: () => void;
  onCloneClick: () => void;
};

export function PetitionListHeader({
  search: _search,
  showClone,
  showDelete,
  showCreateTemplates,
  onSearchChange,
  onDeleteClick,
  onCreateClick,
  onCreateTemplateClick,
  onReload,
  onCloneClick,
  ...props
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
  const showActions = [showDelete, showClone, showCreateTemplates].some(
    identity
  );

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
        <PetitionListFilter
          {...pick(props, ["status", "type", "onFilterChange"])}
        />
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
                <MenuItem
                  onClick={onCreateTemplateClick}
                  isDisabled={!showCreateTemplates}
                >
                  <SaveIcon marginRight={2} />
                  <FormattedMessage
                    id="component.petition-list-header.save-as-template-label"
                    defaultMessage="Save as template"
                  />
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  color="red.500"
                  onClick={onDeleteClick}
                  isDisabled={!showDelete}
                >
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

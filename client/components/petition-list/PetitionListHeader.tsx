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
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import {
  PetitionListFilter,
  PetitionListFilterProps,
} from "../common/PetitionListFilter";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export type PetitionListHeaderProps = PetitionListFilterProps & {
  search: string | null;
  selectedCount: number;
  onSearchChange: (value: string | null) => void;
  onDeleteClick: () => void;
  onCloneAsTemplateClick: () => void;
  onReload: () => void;
  onCloneClick: () => void;
  onCreatePetition: () => void;
};

export function PetitionListHeader({
  type,
  status,
  search: _search,
  selectedCount,
  onSearchChange,
  onDeleteClick,
  onCloneAsTemplateClick,
  onReload,
  onCloneClick,
  onFilterChange,
  onCreatePetition,
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
  const showActions = selectedCount > 0;

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
          status={status}
          type={type}
          onFilterChange={onFilterChange}
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
                <MenuItem
                  onClick={onCloneClick}
                  isDisabled={selectedCount === 0}
                >
                  <CopyIcon marginRight={2} />
                  {type === "PETITION" ? (
                    <FormattedMessage
                      id="component.petition-list-header.clone-petition-label"
                      defaultMessage="Clone {count, plural, =1{petition} other{petitions}}"
                      values={{ count: selectedCount }}
                    />
                  ) : (
                    <FormattedMessage
                      id="component.petition-list-header.clone-template-label"
                      defaultMessage="Clone {count, plural, =1{template} other{templates}}"
                      values={{ count: selectedCount }}
                    />
                  )}
                </MenuItem>
                {type === "PETITION" ? (
                  <MenuItem
                    onClick={onCloneAsTemplateClick}
                    isDisabled={selectedCount !== 1}
                  >
                    <CopyIcon marginRight={2} />
                    <FormattedMessage
                      id="component.petition-list-header.clone-as-template-label"
                      defaultMessage="Clone as template"
                    />
                  </MenuItem>
                ) : null}
                <MenuDivider />
                <MenuItem
                  color="red.500"
                  onClick={onDeleteClick}
                  isDisabled={selectedCount === 0}
                >
                  <DeleteIcon marginRight={2} />
                  {type === "PETITION" ? (
                    <FormattedMessage
                      id="component.petition-list-header.delete-petition-label"
                      defaultMessage="Delete {count, plural, =1{petition} other{petitions}}"
                      values={{ count: selectedCount }}
                    />
                  ) : (
                    <FormattedMessage
                      id="component.petition-list-header.delete-template-label"
                      defaultMessage="Delete {count, plural, =1{template} other{templates}}"
                      values={{ count: selectedCount }}
                    />
                  )}
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        </Box>
      ) : null}
      <Button colorScheme="purple" onClick={onCreatePetition}>
        {type === "PETITION" ? (
          <FormattedMessage
            id="component.petition-list-header.create-petition-button"
            defaultMessage="Create petition"
          />
        ) : (
          <FormattedMessage
            id="component.petition-list-header.create-template-button"
            defaultMessage="Create template"
          />
        )}
      </Button>
    </Stack>
  );
}

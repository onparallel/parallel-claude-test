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
} from "@chakra-ui/react";
import {
  ChevronDownIcon,
  CopyIcon,
  DeleteIcon,
  PaperPlaneIcon,
  RepeatIcon,
} from "@parallel/chakra/icons";
import { PetitionFilter } from "@parallel/graphql/__types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { UserArrowIcon } from "../../chakra/icons";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export type PetitionListHeaderProps = {
  search: string | null;
  filter: PetitionFilter;
  selectedCount: number;
  onSearchChange: (value: string | null) => void;
  onFilterChange: (value: PetitionFilter) => void;
  onDeleteClick: () => void;
  onCloneAsTemplateClick: () => void;
  onUseTemplateClick: () => void;
  onReload: () => void;
  onCloneClick: () => void;
  onShareClick: () => void;
};

export function PetitionListHeader({
  search: _search,
  filter,
  selectedCount,
  onSearchChange,
  onDeleteClick,
  onCloneAsTemplateClick,
  onUseTemplateClick,
  onReload,
  onCloneClick,
  onFilterChange,
  onShareClick,
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
      <Spacer />
      <Box>
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            isDisabled={!showActions}
          >
            <FormattedMessage
              id="generic.actions-button"
              defaultMessage="Actions"
            />
          </MenuButton>
          <Portal>
            <MenuList minWidth="160px">
              <MenuItem
                onClick={onShareClick}
                isDisabled={selectedCount === 0}
                icon={<UserArrowIcon display="block" boxSize={4} />}
              >
                {filter.type === "PETITION" ? (
                  <FormattedMessage
                    id="component.petition-list-header.share-petition-label"
                    defaultMessage="Share {count, plural, =1{petition} other{petitions}}"
                    values={{ count: selectedCount }}
                  />
                ) : (
                  <FormattedMessage
                    id="component.petition-list-header.share-template-label"
                    defaultMessage="Share {count, plural, =1{template} other{templates}}"
                    values={{ count: selectedCount }}
                  />
                )}
              </MenuItem>
              <MenuItem
                onClick={onCloneClick}
                isDisabled={selectedCount === 0}
                icon={<CopyIcon display="block" boxSize={4} />}
              >
                {filter.type === "PETITION" ? (
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
              {filter.type === "PETITION" ? (
                <MenuItem
                  onClick={onCloneAsTemplateClick}
                  isDisabled={selectedCount !== 1}
                  icon={<CopyIcon display="block" boxSize={4} />}
                >
                  <FormattedMessage
                    id="component.petition-list-header.save-as-template-label"
                    defaultMessage="Save as template"
                  />
                </MenuItem>
              ) : (
                <MenuItem
                  onClick={onUseTemplateClick}
                  isDisabled={selectedCount !== 1}
                  icon={<PaperPlaneIcon display="block" boxSize={4} />}
                >
                  <FormattedMessage
                    id="component.petition-list-header.use-template-label"
                    defaultMessage="Use template"
                  />
                </MenuItem>
              )}
              <MenuDivider />
              <MenuItem
                color="red.500"
                onClick={onDeleteClick}
                isDisabled={selectedCount === 0}
                icon={<DeleteIcon display="block" boxSize={4} />}
              >
                {filter.type === "PETITION" ? (
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
    </Stack>
  );
}

import { Box, Button, MenuItem, MenuList, Stack } from "@chakra-ui/core";
import {
  ChevronDownIcon,
  DeleteIcon,
  RepeatIcon,
} from "@parallel/chakra/icons";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ButtonDropdown } from "../common/ButtonDropdown";
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
}

export function ContactListHeader({
  search: _search,
  showActions,
  onSearchChange,
  onReload,
  onCreateClick,
  onDeleteClick,
}: ContactListHeaderProps) {
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
      {showActions ? (
        <Box>
          <ButtonDropdown
            rightIcon={<ChevronDownIcon />}
            dropdown={
              <MenuList minWidth="160px">
                <MenuItem onClick={onDeleteClick}>
                  <DeleteIcon marginRight={2} />
                  <FormattedMessage
                    id="component.contact-list-header.delete-label"
                    defaultMessage="Delete selected"
                  />
                </MenuItem>
              </MenuList>
            }
          >
            <FormattedMessage
              id="component.contact-list-header.actions-button"
              defaultMessage="Actions"
            />
          </ButtonDropdown>
        </Box>
      ) : null}
      <Button colorScheme="purple" onClick={onCreateClick}>
        <FormattedMessage
          id="component.contact-list-header.create-contact-button"
          defaultMessage="Create contact"
        />
      </Button>
    </Stack>
  );
}

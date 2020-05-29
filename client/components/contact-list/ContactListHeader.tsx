import { Box, Button, Stack, MenuList, MenuItem, Icon } from "@chakra-ui/core";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";
import { ButtonDropdown } from "../common/ButtonDropdown";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";

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
        icon="repeat"
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
            rightIcon="chevron-down"
            dropdown={
              <MenuList minWidth="160px">
                <MenuItem onClick={onDeleteClick}>
                  <Icon name="delete" marginRight={2} />
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
            ></FormattedMessage>
          </ButtonDropdown>
        </Box>
      ) : null}
      <Button variantColor="purple" onClick={onCreateClick}>
        <FormattedMessage
          id="component.contact-list-header.create-contact-button"
          defaultMessage="Create contact"
        />
      </Button>
    </Stack>
  );
}

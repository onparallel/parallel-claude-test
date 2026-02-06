import { Box, HStack } from "@chakra-ui/react";
import { RepeatIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { Spacer } from "@parallel/components/common/Spacer";
import { Button } from "@parallel/components/ui";
import { QueryStateOf, SetQueryState } from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ProfileTypesQueryState } from "../../../pages/app/organization/profiles/types";

interface ProfileTypesListHeaderProps {
  shape: QueryStateOf<ProfileTypesQueryState>;
  state: ProfileTypesQueryState;
  onStateChange: SetQueryState<Partial<ProfileTypesQueryState>>;
  onReload: () => void;
  onCreateType?: () => void;
}

export function ProfileTypesListHeader({
  shape,
  state,
  onStateChange,
  onReload,
  onCreateType,
}: ProfileTypesListHeaderProps) {
  const intl = useIntl();
  const [search, setSearch] = useState(state.search ?? "");

  const debouncedOnSearchChange = useDebouncedCallback(
    (search) =>
      onStateChange(({ ...current }) => ({
        ...current,
        search,
        page: 1,
      })),
    300,
    [onStateChange],
  );

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange],
  );

  return (
    <HStack padding={2}>
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
      <Box flex="0 1 400px">
        <SearchInput value={search ?? ""} onChange={handleSearchChange} />
      </Box>
      {onCreateType ? (
        <>
          <Spacer />
          <Button colorPalette="primary" onClick={onCreateType}>
            <FormattedMessage
              id="component.profile-types-table.new-type"
              defaultMessage="New type"
            />
          </Button>
        </>
      ) : null}
    </HStack>
  );
}

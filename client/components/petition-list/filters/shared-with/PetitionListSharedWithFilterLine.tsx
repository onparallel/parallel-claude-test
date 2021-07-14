import { Box, CloseButton } from "@chakra-ui/react";
import { useInlineReactSelectProps } from "@parallel/utils/react-select/hooks";
import { OptionType } from "@parallel/utils/react-select/types";
import { ValueProps } from "@parallel/utils/ValueProps";
import { useCallback, useMemo } from "react";
import { useIntl } from "react-intl";
import Select from "react-select";
import { UserSelect, useSearchUsers } from "../../../common/UserSelect";
import { SharedWithFilterLine, FilterSharedWithOperator } from "./types";

export interface PetitionListSharedWithFilterProps
  extends ValueProps<SharedWithFilterLine, false> {
  onRemove: () => void;
}

export function PetitionListSharedWithFilterLine({
  value,
  onChange,
  onRemove,
}: PetitionListSharedWithFilterProps) {
  const intl = useIntl();

  const selectProps = useInlineReactSelectProps<any, false, never>({
    size: "sm",
    usePortal: false,
  });

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (
      search: string,
      excludeUsers: string[],
      excludeUserGroups: string[]
    ) => {
      return await _handleSearchUsers(search, {
        includeGroups: true,
        excludeUsers: [...excludeUsers],
        excludeUserGroups: [...excludeUserGroups],
      });
    },
    [_handleSearchUsers]
  );

  const operators = useMemo<OptionType<FilterSharedWithOperator>[]>(() => {
    return [
      {
        label: intl.formatMessage({
          id: "component.shared-filter.shared-with",
          defaultMessage: "shared with",
        }),
        value: "SHARED_WITH",
      },
      {
        label: intl.formatMessage({
          id: "component.shared-filter.not-shared-with",
          defaultMessage: "not shared with",
        }),
        value: "NOT_SHARED_WITH",
      },
      {
        label: intl.formatMessage({
          id: "component.shared-filter.is-owner",
          defaultMessage: "is owner",
        }),
        value: "IS_OWNER",
      },
    ];
  }, [intl.locale]);

  return (
    <>
      <CloseButton size="md" onClick={onRemove} />
      <Select
        options={operators}
        value={operators.find((o) => o.value === value.operator)}
        onChange={(option: OptionType<FilterSharedWithOperator>) => {
          onChange({ ...value, operator: option.value });
        }}
        {...selectProps}
      />
      <Box flex="1" minWidth="240px">
        <UserSelect
          size="sm"
          includeGroups
          value={value.value}
          onKeyDown={(e: KeyboardEvent) => {
            if (e.key === "Enter" && !(e.target as HTMLInputElement).value) {
              e.preventDefault();
            }
          }}
          onChange={(userOrGroup) => {
            onChange({ ...value, value: userOrGroup?.id ?? null });
          }}
          onSearch={handleSearchUsers}
          placeholder={intl.formatMessage({
            id: "component.shared-filter.add-user-or-group",
            defaultMessage: "Select a user or group",
          })}
          usePortal={false}
        />
      </Box>
    </>
  );
}

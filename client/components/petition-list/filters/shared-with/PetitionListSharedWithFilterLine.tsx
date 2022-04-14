import { Box, CloseButton } from "@chakra-ui/react";
import { SimpleOption, SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { FilterSharedWithOperator, PetitionSharedWithFilterLine } from "@parallel/graphql/__types";
import { ValueProps } from "@parallel/utils/ValueProps";
import { useCallback, useMemo } from "react";
import { useIntl } from "react-intl";
import { UserSelect, useSearchUsers } from "../../../common/UserSelect";

export interface PetitionListSharedWithFilterProps
  extends ValueProps<PetitionSharedWithFilterLine, false> {
  onRemove: () => void;
}

export function PetitionListSharedWithFilterLine({
  value,
  onChange,
  onRemove,
}: PetitionListSharedWithFilterProps) {
  const intl = useIntl();

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[], excludeUserGroups: string[]) => {
      return await _handleSearchUsers(search, {
        includeGroups: value.operator !== "IS_OWNER",
        excludeUsers: [...excludeUsers],
        excludeUserGroups: [...excludeUserGroups],
      });
    },
    [_handleSearchUsers, value.operator]
  );

  const operators = useMemo<SimpleOption<FilterSharedWithOperator>[]>(() => {
    return [
      {
        label: intl.formatMessage({
          id: "component.petition-list-shared-with-filter.shared-with",
          defaultMessage: "Shared with",
        }),
        value: "SHARED_WITH",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-list-shared-with-filter.not-shared-with",
          defaultMessage: "Not shared with",
        }),
        value: "NOT_SHARED_WITH",
      },
      {
        label: intl.formatMessage({
          id: "component.petition-list-shared-with-filter.is-owner",
          defaultMessage: "Owner is",
        }),
        value: "IS_OWNER",
      },
    ];
  }, [intl.locale]);

  return (
    <>
      <CloseButton
        gridRow={{ base: "span 2", sm: "auto" }}
        aria-label={intl.formatMessage({
          id: "generic.remove",
          defaultMessage: "Remove",
        })}
        size="md"
        onClick={onRemove}
      />
      <SimpleSelect
        size="sm"
        usePortal={false}
        isSearchable={false}
        options={operators}
        value={value.operator}
        onChange={(operator) => {
          onChange({ ...value, operator: operator! });
        }}
      />
      <Box flex="1" minWidth="240px">
        <UserSelect
          size="sm"
          includeGroups={value.operator !== "IS_OWNER"}
          value={value.value}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !(e.target as HTMLInputElement).value) {
              e.preventDefault();
            }
          }}
          onChange={(userOrGroup) => {
            onChange({ ...value, value: (userOrGroup?.id ?? null) as any });
          }}
          onSearch={handleSearchUsers}
          usePortal={false}
        />
      </Box>
    </>
  );
}

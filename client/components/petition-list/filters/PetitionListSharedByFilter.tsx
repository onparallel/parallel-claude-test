import { Box, CloseButton, Flex, HStack, Text } from "@chakra-ui/react";
import { useInlineReactSelectProps } from "@parallel/utils/react-select/hooks";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
import { UserSelect, useSearchUsers } from "../../common/UserSelect";

export type PetitionListSharedByFilterProps = {
  index: number;
  operators: any;
  operator: string;
  logicalOperators: any;
  logicalOperator: string;
  value: any;
  onChangeValue: (value: any, index: number) => void;
  onChangeOperator: (event: any, index: number) => void;
  onChangeLogicalOperator: (event: any) => void;
  onRemoveFilter: (index: number) => void;
};

export const PetitionListSharedByFilter = ({
  index,
  operators,
  operator,
  logicalOperators,
  logicalOperator,
  value,
  onChangeValue,
  onChangeOperator,
  onChangeLogicalOperator,
  onRemoveFilter,
}: PetitionListSharedByFilterProps) => {
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

  return (
    <>
      <HStack>
        <CloseButton
          fontSize="10px"
          borderRadius="50%"
          height="20px"
          width="20px"
          marginRight={1}
          color="gray.500"
          _hover={{ backgroundColor: "gray.100", color: "gray.700" }}
          _active={{ backgroundColor: "gray.200", color: "gray.700" }}
          onClick={() => onRemoveFilter(index)}
        />
        {logicalOperators ? (
          index > 1 ? (
            <Flex
              flex="1"
              alignItems="center"
              paddingLeft="11px"
              textStyle="muted"
            >
              {
                logicalOperators.find(
                  (o: { label: string; value: string }) =>
                    o.value === logicalOperator
                ).label
              }
            </Flex>
          ) : (
            <Select
              options={logicalOperators}
              value={logicalOperators.find(
                (o: { label: string; value: string }) =>
                  o.value === logicalOperator
              )}
              onChange={onChangeLogicalOperator}
              {...selectProps}
            />
          )
        ) : (
          <Text as="span" paddingRight={1}>
            <FormattedMessage
              id="component.shared-filter.where"
              defaultMessage="Where"
            />
          </Text>
        )}
      </HStack>

      <Select
        options={operators}
        value={operators.find(
          (o: { label: string; value: string }) => o.value === operator
        )}
        onChange={(event) => {
          onChangeOperator(event, index);
        }}
        {...selectProps}
      />
      <Box flex="1" minWidth="240px">
        <UserSelect
          size="sm"
          includeGroups
          value={value}
          onKeyDown={(e: KeyboardEvent) => {
            if (e.key === "Enter" && !(e.target as HTMLInputElement).value) {
              e.preventDefault();
            }
          }}
          onChange={(userOrGroup) => {
            onChangeValue(userOrGroup?.id ?? "", index);
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
};

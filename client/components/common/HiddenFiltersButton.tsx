import {
  Box,
  Heading,
  HStack,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Stack,
} from "@chakra-ui/react";
import { Popover } from "@parallel/chakra/components";
import { CloseIcon, EyeIcon, FilterIcon } from "@parallel/chakra/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";
import { ResponsiveButtonIcon } from "./ResponsiveButtonIcon";
import { TableColumn } from "./Table";

export interface HiddenFiltersButtonProps<TFilter extends Record<string, any>> {
  columns: TableColumn<any, any, TFilter>[];
  selection: string[];
  filter: Record<string, any>;
  onShowColumn: (key: string) => void;
  onRemoveFilter: (key: string) => void;
}

export function HiddenFiltersButton<TFilter extends Record<string, any>>({
  columns,
  selection,
  filter,
  onShowColumn,
  onRemoveFilter,
}: HiddenFiltersButtonProps<TFilter>) {
  const intl = useIntl();
  const notVisibleFilteredOutColumns = columns.filter(
    (c) =>
      !c.isFixed &&
      !selection.includes(c.key) &&
      isNonNullish(c.Filter) &&
      isNonNullish(filter?.[c.key]),
  );
  return notVisibleFilteredOutColumns.length ? (
    <Popover placement="bottom-start">
      <PopoverTrigger>
        <ResponsiveButtonIcon
          icon={<FilterIcon />}
          variant="ghost"
          colorScheme="purple"
          breakpoint="lg"
          label={intl.formatMessage(
            {
              id: "component.hidden-filters-button.label",
              defaultMessage: "{count, plural, =1{# hidden filter} other{# hidden filters}}",
            },
            { count: notVisibleFilteredOutColumns.length },
          )}
        />
      </PopoverTrigger>
      <Portal>
        <PopoverContent width="auto" minWidth="160px">
          <PopoverBody as={Stack}>
            <Heading textTransform="uppercase" fontSize="sm" color="gray.600">
              <FormattedMessage
                id="component.petition-list-header.hidden-filters-title"
                defaultMessage="Filters"
              />
            </Heading>
            <Stack as="ul">
              {notVisibleFilteredOutColumns.map((column) => {
                return (
                  <HStack as="li" key={column.key}>
                    <Box flex="1">
                      {typeof column.label === "string" ? column.label : column.label(intl)}
                    </Box>
                    <IconButtonWithTooltip
                      variant="ghost"
                      label={intl.formatMessage({
                        id: "component.hidden-filters-button.show-column",
                        defaultMessage: "Show column",
                      })}
                      size="xs"
                      icon={<EyeIcon />}
                      onClick={() => onShowColumn(column.key)}
                    />
                    <IconButtonWithTooltip
                      variant="ghost"
                      label={intl.formatMessage({
                        id: "generic.remove",
                        defaultMessage: "Remove",
                      })}
                      size="xs"
                      icon={<CloseIcon />}
                      onClick={() => onRemoveFilter(column.key)}
                    />
                  </HStack>
                );
              })}
            </Stack>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  ) : null;
}

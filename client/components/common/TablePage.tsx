import { Box, BoxProps, Button, Flex, Spinner, Stack } from "@chakra-ui/core";
import { Card } from "@parallel/components/common/Card";
import { Spacer } from "@parallel/components/common/Spacer";
import {
  Table,
  TableProps,
  useTableColors,
} from "@parallel/components/common/Table";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

export type TableCardProps<T> = TableProps<T> & {
  loading: boolean;
  header?: ReactNode;
  body?: ReactNode;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
} & BoxProps;

export function TablePage<T>({
  columns,
  rows,
  rowKeyProp,
  isSelectable: selectable,
  isHighlightable: highlightable,
  sort,
  onSelectionChange,
  onRowClick,
  onSortChange,
  loading,
  header,
  body,
  totalCount,
  page,
  pageSize,
  onPageChange,
  ...props
}: TableCardProps<T>) {
  const colors = useTableColors();

  return (
    <Card display="flex" flexDirection="column" {...props}>
      {header ? (
        <Box borderBottom="1px solid" borderBottomColor={colors.border}>
          {header}
        </Box>
      ) : null}
      <Flex flexDirection="column" minHeight="300px" position="relative">
        {loading ? (
          <Flex
            position="absolute"
            width="100%"
            height="100%"
            justifyContent="center"
            alignItems="center"
            backgroundColor="whiteAlpha.800"
          >
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="purple.500"
              size="xl"
            />
          </Flex>
        ) : null}
        {body ? (
          body
        ) : (
          <Table
            columns={columns}
            rows={rows}
            rowKeyProp={rowKeyProp}
            isSelectable={selectable}
            isHighlightable={highlightable}
            sort={sort}
            onSelectionChange={onSelectionChange}
            onRowClick={onRowClick}
            onSortChange={onSortChange}
            borderTop="1px solid"
            borderTopColor={colors.border}
            marginTop="-1px"
          ></Table>
        )}
      </Flex>
      <Stack
        direction="row"
        spacing={2}
        padding={2}
        borderTop="1px solid"
        alignItems="center"
        borderTopColor={colors.border}
        marginTop="-1px"
      >
        <Box marginLeft={2}>
          {totalCount ? (
            <FormattedMessage
              id="component.table.total-results"
              defaultMessage="Showing {start}-{end} of {total, plural, =1 {# result} other {# results}}"
              values={{
                total: totalCount,
                start: pageSize * (page - 1) + 1,
                end: Math.min(pageSize * page, totalCount),
              }}
            />
          ) : (
            <FormattedMessage
              id="component.table.no-results"
              defaultMessage="No results"
            />
          )}
        </Box>
        <Spacer />
        <Button
          variant="outline"
          isDisabled={page === 1}
          onClick={() => onPageChange?.(page - 1)}
        >
          <FormattedMessage
            id="component.table.prev-page-button"
            defaultMessage="Previous"
          />
        </Button>
        <Button
          variant="outline"
          isDisabled={page * pageSize >= totalCount}
          onClick={() => onPageChange?.(page + 1)}
        >
          <FormattedMessage
            id="component.table.next-page-button"
            defaultMessage="Next"
          />
        </Button>
      </Stack>
    </Card>
  );
}

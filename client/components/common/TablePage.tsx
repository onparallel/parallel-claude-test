import { Box, BoxProps, Button, Flex, Spinner, Stack } from "@chakra-ui/core";
import { Card } from "@parallel/components/common/Card";
import { Spacer } from "@parallel/components/common/Spacer";
import {
  Table,
  TableProps,
  useTableColors
} from "@parallel/components/common/Table";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

export type TableCardProps<T> = TableProps<T> & {
  loading: boolean;
  header?: ReactNode;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
} & BoxProps;

export function TablePage<T>({
  columns,
  rows,
  rowKeyProp,
  selectable,
  onSelectionChange,
  onRowClick,
  loading,
  header,
  totalCount,
  page,
  pageSize,
  onPageChange,
  ...props
}: TableCardProps<T>) {
  const colors = useTableColors();

  return (
    <Card display="flex" flexDirection="column" {...props}>
      {header ?? null}
      <Box flex="1" position="relative">
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
        <Table
          columns={columns}
          rows={rows}
          rowKeyProp={rowKeyProp}
          selectable={selectable}
          onSelectionChange={onSelectionChange}
          onRowClick={onRowClick}
          borderTop={header ? "1px solid" : "none"}
          borderTopColor={colors.border}
        ></Table>
        <Spacer marginTop="-1px" />
      </Box>
      <Stack
        direction="row"
        spacing={2}
        padding={4}
        borderTop="1px solid"
        alignItems="center"
        borderTopColor={colors.border}
      >
        <Box>
          <FormattedMessage
            id="component.table.total-results"
            defaultMessage="Showing {start}-{end} of {total, plural, =1 {# result} other {# results}}"
            values={{
              total: totalCount,
              start: pageSize * (page - 1) + 1,
              end: pageSize * (page - 1) + rows.length
            }}
          />
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

import {
  Box,
  Button,
  Center,
  Flex,
  IconButton,
  Select,
  Spinner,
  Stack,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@parallel/chakra/icons";
import { WithChakraProps } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { Spacer } from "@parallel/components/common/Spacer";
import {
  Table,
  TableProps,
  useTableColors,
} from "@parallel/components/common/Table";
import { ReactNode, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export type TablePageProps<T, TContext = unknown> = TableProps<T, TContext> & {
  loading: boolean;
  header?: ReactNode;
  body?: ReactNode;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

export function TablePage<T, TContext = unknown>({
  columns,
  rows,
  context,
  rowKeyProp,
  isExpandable,
  isSelectable,
  isHighlightable,
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
  onPageSizeChange,
  onPageChange,
  color,
  ...props
}: WithChakraProps<"section", TablePageProps<T, TContext>>) {
  const colors = useTableColors();
  const intl = useIntl();
  const pagination = usePagination({ current: page, pageSize, totalCount });
  return (
    <Card display="flex" flexDirection="column" {...props}>
      {header ? header : null}
      <Flex
        flexDirection="column"
        flex="1 1 0"
        minWidth="0"
        position="relative"
        overflowX="auto"
        minHeight="128px"
      >
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
            context={context}
            rowKeyProp={rowKeyProp}
            isExpandable={isExpandable}
            isSelectable={isSelectable}
            isHighlightable={isHighlightable}
            sort={sort}
            onSelectionChange={onSelectionChange}
            onRowClick={onRowClick}
            onSortChange={onSortChange}
          />
        )}
      </Flex>
      <Stack
        direction={{ base: "column", sm: "row" }}
        spacing={{ base: 2, sm: 4 }}
        paddingY={2}
        paddingX={3}
        borderTop="1px solid"
        alignItems="center"
        borderTopColor={colors.border}
      >
        <Box paddingLeft={1}>
          <Select
            size="sm"
            variant="unstyled"
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(parseInt(e.target.value))}
          >
            {[10, 25, 50].map((items) => (
              <option key={items} value={items}>
                {intl.formatMessage(
                  {
                    id: "component.table.page-size",
                    defaultMessage: "{items} items",
                  },
                  { items }
                )}
              </option>
            ))}
          </Select>
        </Box>
        <Box fontSize="sm">
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
        <Box as="nav">
          <Stack as="ul" direction="row" spacing={1} listStyleType="none">
            {pagination.map((item) => (
              <Box
                key={item.type === "PAGE" ? `page-${item.value}` : item.type}
                as="li"
                role={
                  item.type === "END_ELLIPSIS" || item.type === "START_ELLIPSIS"
                    ? "separator"
                    : undefined
                }
              >
                {item.type === "PREVIOUS" ? (
                  <IconButton
                    size="sm"
                    variant="ghost"
                    isDisabled={item.isDisabled}
                    onClick={() => onPageChange?.(item.value)}
                    aria-label={intl.formatMessage({
                      id: "component.table.prev-page-button",
                      defaultMessage: "Previous",
                    })}
                    icon={
                      <ChevronLeftIcon
                        fontSize="xl"
                        position="relative"
                        top="1px"
                      />
                    }
                  />
                ) : item.type === "NEXT" ? (
                  <IconButton
                    size="sm"
                    variant="ghost"
                    isDisabled={item.isDisabled}
                    onClick={() => onPageChange?.(item.value)}
                    aria-label={intl.formatMessage({
                      id: "component.table.next-page-button",
                      defaultMessage: "Next",
                    })}
                    icon={
                      <ChevronRightIcon
                        fontSize="xl"
                        position="relative"
                        top="1px"
                      />
                    }
                  />
                ) : item.type === "END_ELLIPSIS" ||
                  item.type === "START_ELLIPSIS" ? (
                  <Center boxSize={8}>...</Center>
                ) : (
                  <Button
                    padding={0}
                    variant={item.isCurrent ? "solid" : "ghost"}
                    size="sm"
                    onClick={
                      item.isCurrent
                        ? () => onPageChange?.(item.value)
                        : undefined
                    }
                    aria-current={item.isCurrent ? "page" : undefined}
                  >
                    {item.value}
                  </Button>
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
}

type PaginationItem =
  | {
      type: "NEXT";
      value: number;
      isDisabled: boolean;
    }
  | {
      type: "PREVIOUS";
      value: number;
      isDisabled: boolean;
    }
  | {
      type: "PAGE";
      isCurrent: boolean;
      value: number;
    }
  | { type: "START_ELLIPSIS" }
  | { type: "END_ELLIPSIS" };

function usePagination({
  current,
  pageSize,
  totalCount,
}: {
  current: number;
  pageSize: number;
  totalCount: number;
}): PaginationItem[] {
  return useMemo(() => {
    const pages: PaginationItem[] = [
      { type: "PREVIOUS", value: current - 1, isDisabled: current === 1 },
      { type: "PAGE", value: 1, isCurrent: current === 1 },
    ];
    if (current === 2) {
      pages.push({ type: "PAGE", value: 2, isCurrent: true });
    } else if (current === 3) {
      pages.push(
        { type: "PAGE", value: 2, isCurrent: false },
        { type: "PAGE", value: 3, isCurrent: true }
      );
    } else if (current > 3) {
      pages.push(
        { type: "START_ELLIPSIS" },
        { type: "PAGE", value: current, isCurrent: true }
      );
    }

    const total = Math.ceil(totalCount / pageSize);
    if (current < total - 2) {
      pages.push({ type: "END_ELLIPSIS" });
    } else if (current === total - 2) {
      pages.push({ type: "PAGE", value: total - 1, isCurrent: false });
    }
    if (current < total) {
      pages.push({ type: "PAGE", value: total, isCurrent: current === total });
    }
    pages.push({
      type: "NEXT",
      value: current + 1,
      isDisabled: current === total,
    });
    return pages;
  }, [current, pageSize, totalCount]);
}

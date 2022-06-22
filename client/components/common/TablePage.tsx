import {
  Box,
  Button,
  ButtonProps,
  Center,
  Flex,
  HStack,
  IconButton,
  Select,
  Spinner,
  Stack,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@parallel/chakra/icons";
import { WithChakraProps } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { Spacer } from "@parallel/components/common/Spacer";
import { Table, TableProps, useTableColors } from "@parallel/components/common/Table";
import { ComponentType, Key, ReactNode, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, pick } from "remeda";

export type TablePageProps<TRow, TContext = unknown, TImpl extends TRow = TRow> = TableProps<
  TRow,
  TContext,
  TImpl
> & {
  loading: boolean;
  actions?: (ButtonProps & { key: Key })[];
  header?: ReactNode;
  body?: ReactNode;
  totalCount: number;
  page: number;
  pageSize: number;
  /**
   * Esto es un apaño temporal hasta que haya mas casos de querer renderizar cosas
   * al final de la tabla. Si aparecen más casos pensar una solución mejor.
   */
  Footer?: ComponentType<any>;
  footerProps?: any;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

export function TablePage<TRow, TContext = unknown, TImpl extends TRow = TRow>({
  columns,
  rows,
  context,
  rowKeyProp,
  isExpandable,
  isSelectable,
  isHighlightable,
  sort,
  filter,
  onFilterChange,
  onSelectionChange,
  onRowClick,
  onSortChange,
  loading,
  header,
  actions,
  body,
  totalCount,
  page,
  pageSize,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Footer,
  footerProps,
  onPageSizeChange,
  onPageChange,
  color,
  ...props
}: WithChakraProps<"section", TablePageProps<TRow, TContext, TImpl>>) {
  const colors = useTableColors();
  const intl = useIntl();
  const pagination = usePagination({ current: page, pageSize, totalCount });
  const bottom = (
    <>
      <Box paddingLeft={1}>
        <Select
          size="sm"
          variant="unstyled"
          value={pageSize}
          onChange={(e) => onPageSizeChange?.(parseInt(e.target.value))}
          display="flex"
          alignItems="center"
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
          <FormattedMessage id="component.table.no-results" defaultMessage="No results" />
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
                  icon={<ChevronLeftIcon fontSize="xl" position="relative" top="1px" />}
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
                  icon={<ChevronRightIcon fontSize="xl" position="relative" top="1px" />}
                />
              ) : item.type === "END_ELLIPSIS" || item.type === "START_ELLIPSIS" ? (
                <Center boxSize={8}>...</Center>
              ) : (
                <Button
                  padding={0}
                  variant={item.isCurrent ? "solid" : "ghost"}
                  size="sm"
                  onClick={!item.isCurrent ? () => onPageChange?.(item.value) : undefined}
                  aria-current={item.isCurrent ? "page" : undefined}
                >
                  {item.value}
                </Button>
              )}
            </Box>
          ))}
        </Stack>
      </Box>
    </>
  );
  const [selectedCount, setSelectedCount] = useState(0);
  const handleSelectionChange = useCallback(
    (selected: string[]) => {
      onSelectionChange?.(selected);
      setSelectedCount(selected.length);
    },
    [onSelectionChange]
  );
  columns = useMemo(
    () =>
      selectedCount > 0 && isDefined(actions)
        ? [
            {
              ...pick(columns[0], ["key", "CellContent", "cellProps"]),
              header: "",
              Header: ({ context }) => (
                <Box as="th" colSpan={columns.length} fontWeight="normal">
                  <HStack height="38px" paddingX={3} position="relative" top="1px">
                    <Box fontSize="sm">
                      <FormattedMessage
                        id="component.table-page.n-selected"
                        defaultMessage="{count} selected"
                        values={{ count: (context as any).selectedCount }}
                      />
                    </Box>
                    {actions?.map(({ key, ...props }) => (
                      <Button key={key} variant="ghost" size="sm" fontWeight="normal" {...props} />
                    ))}
                  </HStack>
                </Box>
              ),
            },
            ...columns.slice(1).map((column) => ({
              ...column,
              Header: () => null,
            })),
          ]
        : columns,
    [columns, actions, selectedCount]
  );
  return (
    <Card display="flex" flexDirection="column" {...props}>
      {header ? <Box flex="none">{header}</Box> : null}
      <Flex
        flexDirection="column"
        flex="0 1 auto"
        minWidth="0"
        position="relative"
        overflowX="auto"
        minHeight="128px"
      >
        {loading ? (
          <Flex
            position="absolute"
            inset={0}
            justifyContent="center"
            alignItems="center"
            backgroundColor="whiteAlpha.800"
          >
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="primary.500"
              size="xl"
            />
          </Flex>
        ) : null}
        <Table
          columns={columns}
          rows={rows}
          context={{ ...context, selectedCount } as any}
          rowKeyProp={rowKeyProp}
          isExpandable={isExpandable}
          isSelectable={isSelectable}
          isHighlightable={isHighlightable}
          sort={sort}
          filter={filter}
          onFilterChange={onFilterChange}
          onSelectionChange={handleSelectionChange}
          onRowClick={onRowClick}
          onSortChange={onSortChange}
        />
        {body ? (
          <Flex
            flexDirection="column"
            borderTop="1px solid"
            borderTopColor={colors.border}
            flex="1 1 300px"
          >
            {body}
          </Flex>
        ) : null}
      </Flex>
      <Stack
        flexShrink={0}
        direction={{ base: "column", md: "row" }}
        spacing={{ base: 2, sm: 4 }}
        paddingY={2}
        paddingX={3}
        borderTop="1px solid"
        alignItems="center"
        borderTopColor={colors.border}
      >
        {Footer ? <Footer {...footerProps}>{bottom}</Footer> : <>{bottom}</>}
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
      pages.push({ type: "START_ELLIPSIS" }, { type: "PAGE", value: current, isCurrent: true });
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
      isDisabled: total === 0 || current === total,
    });
    return pages;
  }, [current, pageSize, totalCount]);
}

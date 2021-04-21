import {
  Box,
  BoxProps,
  Checkbox,
  Collapse,
  Flex,
  HTMLChakraProps,
  IconButton,
} from "@chakra-ui/react";
import { getColor } from "@chakra-ui/theme-tools";
import {
  ArrowUpDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "@parallel/chakra/icons";
import { useSelectionState } from "@parallel/utils/useSelectionState";
import {
  ComponentType,
  memo,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useIntl } from "react-intl";

export type TableSortingDirection = "ASC" | "DESC";

export interface TableSorting<T extends string> {
  field: T;
  direction: TableSortingDirection;
}

function toggleSortingDirection(
  direction: TableSortingDirection
): TableSortingDirection {
  return direction === "ASC" ? "DESC" : "ASC";
}

export interface TableProps<TRow, TContext = unknown>
  extends HTMLChakraProps<"table"> {
  columns: TableColumn<TRow, TContext>[];
  rows: TRow[];
  context?: TContext;
  rowKeyProp: keyof TRow;
  sort?: TableSorting<any>;
  isSelectable?: boolean;
  isExpandable?: boolean;
  isHighlightable?: boolean;
  onSelectionChange?: (selected: string[]) => void;
  onRowClick?: (row: TRow, event: MouseEvent) => void;
  onSortChange?: (sort: TableSorting<any>) => void;
}

export interface TableHeaderProps<TRow, TContext = unknown>
  extends HTMLChakraProps<"th"> {
  column: TableColumn<TRow, TContext>;
  context?: TContext;
  sort: TableSorting<any> | undefined;
  allSelected: boolean;
  anySelected: boolean;
  onSortByClick?: (value: string, event: MouseEvent) => void;
  onToggleAll: (event?: any) => void;
}

export interface TableCellProps<TRow, TContext = unknown> {
  row: TRow;
  context?: TContext;
  rowKey: string;
  column: TableColumn<TRow, TContext>;
  isSelected?: boolean;
  isExpanded?: boolean;
  onToggleSelection?: (event: any) => void;
  onToggleExpand?: (expanded: boolean) => void;
}

export interface TableColumn<TRow, TContext = unknown> {
  key: string;
  align?: BoxProps["textAlign"];
  context?: TContext;
  isSortable?: true;
  header: string;
  Header?: ComponentType<TableHeaderProps<TRow, TContext>>;
  headerProps?: HTMLChakraProps<"th">;
  CellContent: ComponentType<TableCellProps<TRow, TContext>>;
  cellProps?: HTMLChakraProps<"td">;
}

function _Table<TRow, TContext = unknown>({
  columns,
  rows,
  context,
  rowKeyProp,
  isSelectable,
  isExpandable,
  isHighlightable,
  sort,
  onSelectionChange,
  onRowClick,
  onSortChange,
  ...props
}: TableProps<TRow, TContext>) {
  const {
    selection,
    allSelected,
    anySelected,
    toggle,
    toggleAll,
  } = useSelectionState(rows, rowKeyProp);
  const colors = useTableColors();

  useEffect(() => {
    onSelectionChange?.(
      Object.entries(selection)
        .filter(([_, value]) => value)
        .map(([key]) => key)
    );
  }, [selection]);

  const handleOnSortByClick = useCallback(
    (value: string) => {
      onSortChange?.(
        sort?.field === value
          ? {
              field: value,
              direction: toggleSortingDirection(sort.direction),
            }
          : {
              field: value,
              direction: "ASC" as const,
            }
      );
    },
    [sort, onSortChange]
  );

  const [expanded, setExpanded] = useState<string | null>(null);
  const handleToggleExpand = useCallback(function (
    key: string,
    value: boolean
  ) {
    setExpanded(value ? key : null);
  },
  []);

  columns = useMemo(() => {
    const updated = [...columns];
    if (isExpandable) {
      updated.unshift({
        key: "expand-toggle",
        header: "",
        Header: () => <Box as="th" width="1px" />,
        cellProps: {
          paddingY: 0,
          paddingRight: 1,
          _first: {
            paddingLeft: 2,
          },
        },
        CellContent: ({ isExpanded, onToggleExpand: toggleExpand }) => {
          const intl = useIntl();
          return (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              as="button"
              borderRadius="full"
              width={8}
              height={8}
              color="gray.700"
              _hover={{
                color: "gray.900",
                backgroundColor: "gray.100",
              }}
              aria-label={
                isExpanded
                  ? intl.formatMessage({
                      id: "generic.collapse",
                      defaultMessage: "Collapse",
                    })
                  : intl.formatMessage({
                      id: "generic.expand",
                      defaultMessage: "Expand",
                    })
              }
              onClick={() => toggleExpand?.(!isExpanded)}
            >
              <ChevronRightIcon
                boxSize="20px"
                transform={isExpanded ? `rotate(90deg)` : undefined}
                transition="transform 150ms ease"
              />
            </Box>
          );
        },
      });
    }
    if (isSelectable) {
      updated.unshift({
        key: "selection-checkbox",
        header: "",
        Header: ({ anySelected, allSelected, onToggleAll }) => (
          <Box
            as="th"
            width="1px"
            paddingLeft={5}
            paddingRight={2}
            height="38px"
            userSelect="none"
          >
            <Box height="16px">
              <Checkbox
                isChecked={anySelected && allSelected}
                isIndeterminate={anySelected && !allSelected}
                colorScheme="purple"
                onChange={onToggleAll}
              />
            </Box>
          </Box>
        ),
        cellProps: {
          paddingY: 0,
          paddingRight: 0,
          _first: { paddingLeft: 3 },
        },
        CellContent: ({ isSelected, onToggleSelection: toggle }) => {
          return (
            <Flex
              as="label"
              alignItems="center"
              justifyContent="center"
              height="32px"
              borderRadius="32px"
              cursor="pointer"
              onClick={toggle}
            >
              <Checkbox
                isChecked={isSelected}
                colorScheme="purple"
                onChange={function () {}}
              />
            </Flex>
          );
        },
      });
    }
    return updated;
  }, [columns, isSelectable, isExpandable]);

  return (
    <Box
      as="table"
      style={{ tableLayout: "auto", width: "100%" }}
      borderBottom="1px solid"
      borderBottomColor={colors.border}
      {...props}
    >
      <Box as="thead" position="sticky" top="0" zIndex="10">
        <Box
          as="tr"
          backgroundColor={colors.header}
          sx={{
            boxShadow: (theme) => {
              const color = getColor(theme, colors.border);
              return `0 1px 0 ${color}, inset 0 1px 0 ${color}`;
            },
          }}
        >
          {columns.map((column) => {
            return column.Header ? (
              <column.Header
                key={column.key}
                column={column}
                context={context}
                sort={sort}
                onSortByClick={handleOnSortByClick}
                allSelected={allSelected}
                anySelected={anySelected}
                onToggleAll={toggleAll}
              />
            ) : (
              <DefaultHeader
                key={column.key}
                column={column as any}
                context={context}
                sort={sort}
                onSortByClick={handleOnSortByClick}
                allSelected={allSelected}
                anySelected={anySelected}
                onToggleAll={toggleAll}
                {...(column.headerProps ?? {})}
              />
            );
          })}
        </Box>
      </Box>
      <Box as="tbody">
        {rows.map((row) => {
          const key = row[rowKeyProp] as any;
          const isSelected = selection[key] ?? false;
          const isExpanded = key === expanded;
          return (
            <Row
              key={key}
              row={row}
              context={context}
              rowKey={key}
              columns={columns}
              isSelected={isSelected}
              isExpanded={isExpanded}
              isExpandable={isExpandable}
              isHighlightable={isHighlightable}
              onRowClick={onRowClick}
              onToggleExpand={handleToggleExpand}
              onToggleSelection={toggle}
            />
          );
        })}
      </Box>
    </Box>
  );
}

export const Table: typeof _Table = memo(_Table) as any;

export function useTableColors() {
  return useMemo(() => {
    return {
      border: "gray.200",
      header: "gray.50",
      row: "white",
      rowHover: "gray.50",
      rowSelected: "purple.50",
    };
  }, []);
}

function _Row<TRow, TContext = unknown>({
  row,
  context,
  rowKey,
  columns,
  isSelected,
  isExpanded,
  isExpandable,
  isHighlightable,
  onRowClick,
  onToggleSelection,
  onToggleExpand,
}: {
  row: TRow;
  context?: TContext;
  rowKey: string;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelection: (key: string, event: any) => void;
  onToggleExpand: (key: string, value: boolean) => void;
} & Pick<
  TableProps<TRow, TContext>,
  "columns" | "isExpandable" | "isHighlightable" | "onRowClick"
>) {
  const colors = useTableColors();
  const handleToggleSelection = useCallback(
    onToggleSelection.bind(null, rowKey),
    [onToggleSelection, rowKey]
  );
  const handleToggleExpand = useCallback(onToggleExpand.bind(null, rowKey), [
    onToggleExpand,
    rowKey,
  ]);
  return (
    <>
      <Box
        as="tr"
        backgroundColor={isSelected ? colors.rowSelected : colors.row}
        _hover={{
          backgroundColor: isSelected
            ? colors.rowSelected
            : isHighlightable
            ? colors.rowHover
            : colors.row,
        }}
        cursor={onRowClick ? "pointer" : "default"}
        borderTop="1px solid"
        borderTopColor={colors.border}
        {...(isExpandable
          ? {}
          : {
              borderTop: "1px solid",
              borderTopColor: colors.border,
            })}
        onClick={(event) => onRowClick?.(row, event)}
      >
        {columns.map((column) => {
          return (
            <Cell
              key={column.key}
              row={row}
              context={context}
              rowKey={rowKey}
              column={column}
              isSelected={isSelected}
              isExpanded={isExpanded}
              onToggleSelection={handleToggleSelection}
              onToggleExpand={handleToggleExpand}
            />
          );
        })}
      </Box>
      {isExpandable ? (
        <Box as="tr" borderTop="1px solid" borderTopColor={colors.border}>
          <Box as="td" padding={0} colSpan={columns.length}>
            <Collapse in={isExpanded}>
              <Box borderTop="1px solid" borderTopColor={colors.border} />
            </Collapse>
          </Box>
        </Box>
      ) : null}
    </>
  );
}
const Row: typeof _Row = memo(_Row) as any;

function _Cell<TRow, TContext>({
  column,
  ...props
}: TableCellProps<TRow, TContext>) {
  return (
    <Box
      as="td"
      padding={2}
      _last={{ paddingRight: 5 }}
      _first={{ paddingLeft: 5 }}
      userSelect="none"
      textAlign={column.align ?? "left"}
      {...(column.cellProps ?? {})}
    >
      <column.CellContent column={column} {...props} />
    </Box>
  );
}
const Cell: typeof _Cell = memo(_Cell) as any;

export function DefaultHeader({
  column,
  sort,
  onSortByClick,
  context,
  allSelected,
  anySelected,
  onToggleAll,
  ...props
}: TableHeaderProps<any>) {
  const intl = useIntl();
  return (
    <Box
      key={column.key}
      as="th"
      paddingX={2}
      paddingY={1}
      _last={{ paddingRight: 5 }}
      _first={{ paddingLeft: 5 }}
      height="38px"
      fontSize="sm"
      fontWeight="normal"
      textTransform="uppercase"
      userSelect="none"
      whiteSpace="nowrap"
      className={sort?.field === column.key ? "sort-active" : undefined}
      aria-sort={
        column.isSortable
          ? sort?.field === column.key
            ? sort.direction === "ASC"
              ? "ascending"
              : "descending"
            : "none"
          : undefined
      }
      sx={{
        ".sort-by-button": {
          opacity: 0,
        },
        "&.sort-active .sort-by-button": {
          opacity: 1,
        },
        "&:hover, &:focus-within": {
          ".sort-by-button": {
            opacity: 1,
          },
        },
      }}
      {...props}
    >
      <Flex alignItems="center" justifyContent={column.align ?? "left"}>
        {column.header}
        {column.isSortable ? (
          <IconButton
            className="sort-by-button"
            onClick={(event) => onSortByClick?.(column.key, event)}
            marginLeft={1}
            icon={
              sort?.field === column.key ? (
                sort.direction === "ASC" ? (
                  <ChevronUpIcon />
                ) : (
                  <ChevronDownIcon />
                )
              ) : (
                <ArrowUpDownIcon />
              )
            }
            size="xs"
            variant="ghost"
            aria-label={
              sort?.field === column.key
                ? intl.formatMessage(
                    {
                      id: "components.table.change-sorting",
                      defaultMessage: 'Change sorting for "{column}"',
                    },
                    { column: column.header }
                  )
                : intl.formatMessage(
                    {
                      id: "components.table.sort by",
                      defaultMessage: 'Sort by "{column}"',
                    },
                    { column: column.header }
                  )
            }
          />
        ) : null}
      </Flex>
    </Box>
  );
}

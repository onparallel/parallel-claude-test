/** @jsx jsx */
import {
  Box,
  BoxProps,
  Checkbox,
  Collapse,
  Flex,
  Icon,
  IconButton,
  PseudoBox,
  PseudoBoxProps,
  useColorMode,
} from "@chakra-ui/core";
import { css, jsx } from "@emotion/core";
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
import { noop } from "remeda";
import { useSelectionState } from "../../utils/useSelectionState";

export type SortingDirection = "ASC" | "DESC";

export type Sorting<T extends string> = {
  field: T;
  direction: SortingDirection;
};

function toggleSortingDirection(direction: SortingDirection): SortingDirection {
  return direction === "ASC" ? "DESC" : "ASC";
}

export type TableProps<TRow> = BoxProps & {
  columns: TableColumn<TRow>[];
  rows: TRow[];
  rowKeyProp: keyof TRow;
  sort?: Sorting<any>;
  isSelectable?: boolean;
  isExpandable?: boolean;
  isHighlightable?: boolean;
  onSelectionChange?: (selected: string[]) => void;
  onRowClick?: (row: TRow, event: MouseEvent) => void;
  onSortChange?: (sort: Sorting<any>) => void;
  onAction?: (row: TRow, action: string, data?: any) => void;
};

export type TableHeaderProps<TRow> = {
  column: TableColumn<TRow>;
  sort: Sorting<any> | undefined;
  allSelected: boolean;
  anySelected: boolean;
  onSortByClick?: (value: string, event: MouseEvent) => void;
  onToggleAll: (event?: any) => void;
};

export type TableCellProps<TRow> = {
  row: TRow;
  rowKey: string;
  column: TableColumn<TRow>;
  isSelected?: boolean;
  isExpanded?: boolean;
  onToggleSelection?: (event: any) => void;
  onToggleExpand?: (expanded: boolean) => void;
  onAction: (action: string, data?: any) => void;
};

export type TableColumn<TRow> = {
  key: string;
  align?: BoxProps["textAlign"];
  isSortable?: true;
  header: string;
  Header?: ComponentType<TableHeaderProps<TRow>>;
  CellContent: ComponentType<TableCellProps<TRow>>;
  cellProps?: PseudoBoxProps;
};

function _Table<TRow>({
  columns,
  rows,
  rowKeyProp,
  isSelectable,
  isExpandable,
  isHighlightable,
  sort,
  onSelectionChange,
  onRowClick,
  onSortChange,
  onAction,
  ...props
}: TableProps<TRow>) {
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
        Header: () => <PseudoBox as="th" width="1px" />,
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
            <PseudoBox
              display="flex"
              justifyContent="center"
              alignItems="center"
              as="button"
              rounded="100%"
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
              <Icon
                name="chevron-right"
                size="20px"
                transform={isExpanded ? `rotate(90deg)` : null}
                transition="transform 150ms ease"
              />
            </PseudoBox>
          );
        },
      });
    }
    if (isSelectable) {
      updated.unshift({
        key: "selection-checkbox",
        header: "",
        Header: ({ anySelected, allSelected, onToggleAll }) => (
          <PseudoBox
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
                size="md"
                colorScheme="purple"
                onChange={onToggleAll}
              />
            </Box>
          </PseudoBox>
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
                size="md"
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
    <Box as="table" style={{ tableLayout: "auto", width: "100%" }} {...props}>
      <Box as="thead">
        <PseudoBox
          as="tr"
          backgroundColor={colors.header}
          borderBottom="1px solid"
          borderBottomColor={colors.border}
        >
          {columns.map((column) => {
            return column.Header ? (
              <column.Header
                key={column.key}
                column={column}
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
                sort={sort}
                onSortByClick={handleOnSortByClick}
                allSelected={allSelected}
                anySelected={anySelected}
                onToggleAll={toggleAll}
              />
            );
          })}
        </PseudoBox>
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
              rowKey={key}
              columns={columns}
              isSelected={isSelected}
              isExpanded={isExpanded}
              isExpandable={isExpandable}
              isHighlightable={isHighlightable}
              onRowClick={onRowClick}
              onToggleExpand={handleToggleExpand}
              onToggleSelection={toggle}
              onAction={onAction}
            />
          );
        })}
      </Box>
    </Box>
  );
}

export const Table: typeof _Table = memo(_Table) as any;

export function useTableColors() {
  const { colorMode } = useColorMode();
  return useMemo(() => {
    switch (colorMode) {
      case "light":
        return {
          border: "gray.200",
          header: "gray.50",
          row: "white",
          rowHover: "gray.50",
          rowSelected: "purple.50",
        };
      case "dark":
        return {
          border: "gray.600",
          header: "gray.700",
          row: "gray.900",
          rowHover: "gray.800",
          rowSelected: "blue.900",
        };
    }
  }, [colorMode]);
}

function _Row<TRow>({
  row,
  rowKey,
  columns,
  isSelected,
  isExpanded,
  isExpandable,
  isHighlightable,
  onRowClick,
  onAction,
  onToggleSelection,
  onToggleExpand,
}: {
  row: TRow;
  rowKey: string;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelection: (key: string, event: any) => void;
  onToggleExpand: (key: string, value: boolean) => void;
} & Pick<
  TableProps<TRow>,
  "columns" | "isExpandable" | "isHighlightable" | "onRowClick" | "onAction"
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
  const handleAction = useCallback(onAction?.bind(null, row) ?? noop, [
    onAction,
    row,
  ]);
  return (
    <>
      <PseudoBox
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
              borderBottom: "1px solid",
              borderBottomColor: colors.border,
            })}
        onClick={(event) => onRowClick?.(row, event as any)}
      >
        {columns.map((column) => {
          return (
            <Cell
              key={column.key}
              row={row}
              rowKey={rowKey}
              column={column}
              isSelected={isSelected}
              isExpanded={isExpanded}
              onToggleSelection={handleToggleSelection}
              onToggleExpand={handleToggleExpand}
              onAction={handleAction}
            />
          );
        })}
      </PseudoBox>
      {isExpandable ? (
        <PseudoBox
          as="tr"
          borderBottom="1px solid"
          borderBottomColor={colors.border}
        >
          <PseudoBox as="td" padding={0} {...{ colSpan: columns.length }}>
            <Collapse isOpen={isExpanded}>
              <Box borderTop="1px solid" borderTopColor={colors.border} />
            </Collapse>
          </PseudoBox>
        </PseudoBox>
      ) : null}
    </>
  );
}
const Row: typeof _Row = memo(_Row) as any;

function _Cell<TRow>({ column, ...props }: TableCellProps<TRow>) {
  return (
    <PseudoBox
      as="td"
      padding={2}
      _last={{ paddingRight: 5 }}
      _first={{ paddingLeft: 5 }}
      userSelect="none"
      textAlign={column.align ?? "left"}
      {...(column.cellProps ?? {})}
    >
      <column.CellContent column={column} {...props} />
    </PseudoBox>
  );
}
const Cell: typeof _Cell = memo(_Cell) as any;

export function DefaultHeader({
  column,
  sort,
  onSortByClick,
}: TableHeaderProps<any>) {
  const intl = useIntl();
  return (
    <PseudoBox
      key={column.key}
      as="th"
      paddingX={2}
      _last={{ paddingRight: 5 }}
      _first={{ paddingLeft: 5 }}
      height="38px"
      fontSize="sm"
      fontWeight={400}
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
      textAlign={column.align ?? "left"}
      css={css`
        .sort-by-button {
          opacity: 0;
        }
        &.sort-active .sort-by-button {
          opacity: 1;
        }
        &:hover,
        &:focus-within {
          .sort-by-button {
            opacity: 1;
          }
        }
      `}
    >
      <Flex alignItems="center">
        {column.header}
        {column.isSortable ? (
          <IconButton
            className="sort-by-button"
            onClick={(event) => onSortByClick?.(column.key, event)}
            marginLeft={1}
            icon={
              sort?.field === column.key
                ? sort.direction === "ASC"
                  ? "chevron-up"
                  : "chevron-down"
                : "arrow-up-down"
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
    </PseudoBox>
  );
}

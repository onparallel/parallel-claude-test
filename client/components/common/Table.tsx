/** @jsx jsx */
import {
  Box,
  BoxProps,
  Checkbox,
  Flex,
  IconButton,
  PseudoBox,
  useColorMode,
} from "@chakra-ui/core";
import { css, jsx } from "@emotion/core";
import {
  ComponentType,
  memo,
  MouseEvent,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useIntl } from "react-intl";
import { useSelectionState } from "../../utils/useSelectionState";

export type SortingDirection = "ASC" | "DESC";

export type Sorting<T extends string> = {
  field: T;
  direction: SortingDirection;
};

function toggleSortingDirection(direction: SortingDirection): SortingDirection {
  return direction === "ASC" ? "DESC" : "ASC";
}

export type TableProps<TRow, TAction extends string = string> = BoxProps & {
  columns: TableColumn<TRow, TAction>[];
  rows: TRow[];
  rowKeyProp: keyof TRow;
  selectable?: boolean;
  sort?: Sorting<any>;
  highlightable?: boolean;
  onSelectionChange?: (selected: string[]) => void;
  onRowClick?: (row: TRow, event: MouseEvent) => void;
  onSortChange?: (sort: Sorting<any>) => void;
  onAction?: (action: TAction, row: TRow, data?: any) => void;
};

export type TableHeaderProps<TRow, TAction extends string = string> = {
  column: TableColumn<TRow, TAction>;
  sort: Sorting<any> | undefined;
  allSelected: boolean;
  anySelected: boolean;
  onSortByClick?: (value: string, event: MouseEvent) => void;
  onToggleAll: (event?: any) => void;
};

export type TableCellProps<TRow, TAction extends string = string> = {
  key: string;
  row: TRow;
  column: TableColumn<TRow, TAction>;
  isSelected?: boolean;
  toggle?: (event: any) => void;
  onAction: (action: TAction, data?: any) => void;
};

export type TableColumn<TRow, TAction extends string = string> = {
  key: string;
  align?: BoxProps["textAlign"];
  isSortable?: true;
  header: string;
  Header?: ComponentType<TableHeaderProps<TRow, TAction>>;
  Cell: ComponentType<TableCellProps<TRow, TAction>>;
};

function _Table<TRow, TAction extends string = string>({
  columns,
  rows,
  rowKeyProp,
  selectable,
  highlightable,
  sort,
  onSelectionChange,
  onRowClick,
  onSortChange,
  onAction,
  ...props
}: TableProps<TRow, TAction>) {
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

  columns = useMemo(() => {
    if (!selectable) {
      return columns;
    } else {
      return [
        {
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
                  variantColor="purple"
                  onChange={onToggleAll}
                />
              </Box>
            </PseudoBox>
          ),
          Cell: ({ isSelected, toggle }) => {
            return (
              <Flex
                as="label"
                alignItems="center"
                justifyContent="center"
                borderRadius="32px"
                onClick={toggle}
              >
                <Checkbox
                  isChecked={isSelected}
                  size="md"
                  variantColor="purple"
                  onChange={function () {}}
                />
              </Flex>
            );
          },
        },
        ...columns,
      ];
    }
  }, [selectable]);

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

          function handleAction(action: TAction, data: any) {
            onAction?.(action, row, data);
          }
          return (
            <PseudoBox
              key={key}
              as="tr"
              backgroundColor={isSelected ? colors.rowSelected : colors.row}
              _hover={{
                backgroundColor: isSelected
                  ? colors.rowSelected
                  : highlightable
                  ? colors.rowHover
                  : colors.row,
              }}
              cursor={onRowClick ? "pointer" : "default"}
              borderTop="1px solid"
              borderTopColor={colors.border}
              borderBottom="1px solid"
              borderBottomColor={colors.border}
              onClick={(event) => onRowClick?.(row, event as any)}
            >
              {columns.map((column) => {
                return (
                  <PseudoBox
                    key={column.key}
                    as="td"
                    padding={2}
                    _last={{ paddingRight: 5 }}
                    _first={{ paddingLeft: 5 }}
                    userSelect="none"
                    textAlign={column.align ?? "left"}
                  >
                    <column.Cell
                      key={key}
                      row={row}
                      column={column}
                      isSelected={isSelected}
                      toggle={(event) => toggle(key, event)}
                      onAction={handleAction}
                    ></column.Cell>
                  </PseudoBox>
                );
              })}
            </PseudoBox>
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

export function DefaultHeader({
  column,
  sort,
  onSortByClick,
}: TableHeaderProps<any, string>) {
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

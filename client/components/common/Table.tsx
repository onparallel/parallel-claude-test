import {
  Box,
  BoxProps,
  Checkbox,
  PseudoBox,
  PseudoBoxProps,
  useColorMode,
  Flex,
} from "@chakra-ui/core";
import { ComponentType, useEffect, useMemo, memo, MouseEvent } from "react";
import { useSelectionState } from "../../utils/useSelectionState";

export type TableProps<TRow, TAction extends string = string> = BoxProps & {
  columns: TableColumn<TRow, TAction>[];
  rows: TRow[];
  rowKeyProp: keyof TRow;
  selectable?: boolean;
  highlightable?: boolean;
  onSelectionChange?: (selected: string[]) => void;
  onRowClick?: (row: TRow, event: MouseEvent) => void;
  onAction?: (action: TAction, row: TRow, data?: any) => void;
};

export type TableHeaderProps<TRow, TAction extends string = string> = {
  column: TableColumn<TRow, TAction>;
  allSelected: boolean;
  anySelected: boolean;
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
  Header: ComponentType<TableHeaderProps<TRow, TAction>>;
  headerProps?: PseudoBoxProps;
  Cell: ComponentType<TableCellProps<TRow, TAction>>;
  cellProps?: PseudoBoxProps;
};

function _Table<TRow, TAction extends string = string>({
  columns,
  rows,
  rowKeyProp,
  selectable,
  highlightable,
  onSelectionChange,
  onRowClick,
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

  columns = useMemo(() => {
    if (!selectable) {
      return columns;
    } else {
      return [
        {
          key: "selection-checkbox",
          Header: ({ anySelected, allSelected, onToggleAll }) => (
            <Box height="16px">
              <Checkbox
                isChecked={anySelected && allSelected}
                isIndeterminate={anySelected && !allSelected}
                size="md"
                variantColor="purple"
                onChange={onToggleAll}
              />
            </Box>
          ),
          headerProps: { width: "1px" },
          cellProps: {
            paddingY: 0,
            paddingRight: 0,
            _first: { paddingLeft: 3 },
          },
          Cell: ({ isSelected, toggle }) => {
            return (
              <Flex
                as="label"
                height="32px"
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
            return (
              <PseudoBox
                key={column.key}
                as="th"
                padding={2}
                _last={{ paddingRight: 5 }}
                _first={{ paddingLeft: 5 }}
                fontSize="sm"
                fontWeight={400}
                textTransform="uppercase"
                userSelect="none"
                textAlign={column.align ?? "left"}
                {...column.headerProps}
              >
                <column.Header
                  column={column}
                  allSelected={allSelected}
                  anySelected={anySelected}
                  onToggleAll={toggleAll}
                ></column.Header>
              </PseudoBox>
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
                    {...column.cellProps}
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

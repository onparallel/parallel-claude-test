import {
  Box,
  BoxProps,
  Checkbox,
  PseudoBox,
  PseudoBoxProps,
  useColorMode
} from "@chakra-ui/core";
import { ComponentType, useEffect, useMemo, memo } from "react";
import { useSelectionState } from "../../utils/useSelectionState";

export type TableProps<T> = BoxProps & {
  columns: TableColumn<T>[];
  rows: T[];
  rowKeyProp: keyof T;
  selectable?: boolean;
  onSelectionChange?: (selected: string[]) => void;
};

export type TableHeaderProps<T> = {
  column: TableColumn<T>;
  allSelected: boolean;
  anySelected: boolean;
  onToggleAll: (event?: any) => void;
};

export type TableCellProps<T> = {
  key: string;
  row: T;
  column: TableColumn<T>;
  isSelected?: boolean;
  toggle?: (event: any) => void;
};

export type TableColumn<T> = {
  key: string;
  align?: BoxProps["textAlign"];
  Header: ComponentType<TableHeaderProps<T>>;
  headerProps?: PseudoBoxProps;
  Cell: ComponentType<TableCellProps<T>>;
  cellProps?: PseudoBoxProps;
};

function _Table<T>({
  columns,
  rows,
  rowKeyProp,
  selectable,
  onSelectionChange,
  ...props
}: TableProps<T>) {
  const {
    selection,
    allSelected,
    anySelected,
    toggle,
    toggleAll
  } = useSelectionState(rows, rowKeyProp);
  const colors = useTableColors();

  useEffect(() => {
    onSelectionChange &&
      onSelectionChange(
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
          headerProps: { width: 0 },
          Cell: ({ isSelected, toggle }) => {
            return (
              <Box height="16px">
                <Checkbox
                  isChecked={isSelected}
                  size="md"
                  variantColor="purple"
                  onClick={toggle}
                  onChange={function() {}}
                />
              </Box>
            );
          }
        },
        ...columns
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
          {columns.map(column => {
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
        {rows.map(row => {
          const key = row[rowKeyProp] as any;
          const isSelected = selection[key] ?? false;
          return (
            <PseudoBox
              key={key}
              as="tr"
              backgroundColor={isSelected ? colors.rowSelected : colors.row}
              _hover={{
                backgroundColor: isSelected
                  ? colors.rowSelected
                  : colors.rowHover
              }}
              cursor="pointer"
              borderBottom="1px solid"
              borderBottomColor={colors.border}
            >
              {columns.map(column => {
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
                      toggle={event => toggle(key, event)}
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
          rowSelected: "yellow.50"
        };
      case "dark":
        return {
          border: "gray.600",
          header: "gray.700",
          row: "gray.900",
          rowHover: "gray.800",
          rowSelected: "blue.900"
        };
    }
  }, [colorMode]);
}

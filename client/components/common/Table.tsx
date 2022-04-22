import { FocusLock } from "@chakra-ui/focus-lock";
import {
  Box,
  BoxProps,
  Center,
  Checkbox,
  Collapse,
  Heading,
  HStack,
  HTMLChakraProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Portal,
  Text,
  useBreakpointValue,
  useDisclosure,
  useOutsideClick,
  usePopper,
} from "@chakra-ui/react";
import { getColor } from "@chakra-ui/theme-tools";
import {
  ArrowUpDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  FilterIcon,
} from "@parallel/chakra/icons";
import { useSelectionState } from "@parallel/utils/useSelectionState";
import { ValueProps } from "@parallel/utils/ValueProps";
import useMergedRef from "@react-hook/merged-ref";
import {
  ComponentType,
  memo,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Card } from "./Card";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";

export type TableSortingDirection = "ASC" | "DESC";

export interface TableSorting<T extends string> {
  field: T;
  direction: TableSortingDirection;
}

function toggleSortingDirection(direction: TableSortingDirection): TableSortingDirection {
  return direction === "ASC" ? "DESC" : "ASC";
}

export interface TableProps<TRow, TContext = unknown, TImpl extends TRow = TRow>
  extends HTMLChakraProps<"table"> {
  columns: TableColumn<TRow, TContext>[];
  rows: TImpl[];
  context?: TContext;
  rowKeyProp: keyof TRow;
  sort?: TableSorting<any>;
  filter?: Record<string, any>;
  isSelectable?: boolean;
  isExpandable?: boolean;
  isHighlightable?: boolean;
  onSelectionChange?: (selected: string[]) => void;
  onRowClick?: (row: TImpl, event: MouseEvent) => void;
  onSortChange?: (sort: TableSorting<any>) => void;
  onFilterChange?: (key: string, value: any) => void;
}

export interface TableHeaderProps<TRow, TContext = unknown, TFilter = unknown>
  extends HTMLChakraProps<"th"> {
  column: TableColumn<TRow, TContext, TFilter>;
  context: TContext;
  filter: any;
  onFilterChange: (value: any) => void;
  sort: TableSorting<any> | undefined;
  allSelected: boolean;
  anySelected: boolean;
  onSortByClick?: (value: string, event: MouseEvent) => void;
  onToggleAll: () => void;
}

export interface TableCellProps<TRow, TContext = unknown, TFilter = unknown> {
  row: TRow;
  context: TContext;
  rowKey: string;
  column: TableColumn<TRow, TContext, TFilter>;
  isSelected?: boolean;
  isExpanded?: boolean;
  onToggleSelection?: (event: any) => void;
  onToggleExpand?: (expanded: boolean) => void;
}

type MaybeFunction<TResult, TArgs extends any[] = []> = TResult | ((...args: TArgs) => TResult);

export interface TableColumn<TRow, TContext = unknown, TFilter = unknown> {
  key: string;
  align?: BoxProps["textAlign"];
  isSortable?: true;
  isFilterable?: true;
  Filter?: ComponentType<TableColumnFilterProps<TFilter, TContext>>;
  header: string;
  Header?: ComponentType<TableHeaderProps<TRow, TContext, TFilter>>;
  headerProps?: MaybeFunction<HTMLChakraProps<"th">, [TContext]>;
  CellContent: ComponentType<TableCellProps<TRow, TContext, TFilter>>;
  cellProps?: MaybeFunction<HTMLChakraProps<"td">, [TRow, TContext]>;
}

export interface TableColumnFilterProps<TFilter, TContext = unknown> extends ValueProps<TFilter> {
  context: TContext;
}

function _Table<TRow, TContext = unknown, TImpl extends TRow = TRow>({
  columns,
  rows,
  context,
  rowKeyProp,
  isSelectable,
  isExpandable,
  isHighlightable,
  sort,
  filter,
  onSelectionChange,
  onRowClick,
  onSortChange,
  onFilterChange,
  ...props
}: TableProps<TRow, TContext, TImpl>) {
  const { selection, allSelected, anySelected, toggle, toggleAll } = useSelectionState(
    rows,
    rowKeyProp
  );
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

  const handleToggleExpand = useCallback(function (key: string, value: boolean) {
    setExpanded(value ? key : null);
  }, []);

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
            padding={0}
            userSelect="none"
            position="relative"
            _after={{
              position: "absolute",
              right: 0,
              top: 0,
              content: "''",
              display: "block",
              width: "1px",
              height: "4  1px",
              backgroundColor: colors.border,
            }}
          >
            <Center
              as="label"
              boxSize="40px"
              cursor="pointer"
              position="relative"
              top="1px"
              onClick={onToggleAll}
            >
              <Checkbox
                isChecked={anySelected && allSelected}
                isIndeterminate={anySelected && !allSelected}
                onChange={function () {}}
                colorScheme="purple"
              />
            </Center>
          </Box>
        ),
        cellProps: {
          paddingY: 0,
          paddingRight: 0,
          _first: { paddingLeft: 0 },
        },
        CellContent: ({ isSelected, onToggleSelection }) => {
          return (
            <Center as="label" boxSize="40px" cursor="pointer" onClick={onToggleSelection}>
              <Checkbox isChecked={isSelected} colorScheme="purple" onChange={function () {}} />
            </Center>
          );
        },
      });
    }
    return updated;
  }, [columns, isSelectable, isExpandable]);

  return (
    <Box
      as="table"
      borderBottom="1px solid"
      borderBottomColor={colors.border}
      {...props}
      sx={{ tableLayout: "auto", width: "100%", ...props.sx }}
    >
      <Box as="thead" position="sticky" top="0" zIndex="10">
        <Box
          as="tr"
          backgroundColor={colors.header}
          height="41px"
          sx={{
            boxShadow: (theme) => {
              const color = getColor(theme, colors.border);
              return `0 1px 0 ${color}, inset 0 1px 0 ${color}`;
            },
          }}
        >
          {columns.map((column) => {
            if (column.Header) {
              return (
                <column.Header
                  key={column.key}
                  column={column}
                  context={context!}
                  sort={sort}
                  filter={filter?.[column.key]}
                  onFilterChange={(value) => onFilterChange?.(column.key, value)}
                  onSortByClick={handleOnSortByClick}
                  allSelected={allSelected}
                  anySelected={anySelected}
                  onToggleAll={toggleAll}
                />
              );
            } else {
              const headerProps =
                typeof column.headerProps === "function"
                  ? column.headerProps(context!)
                  : column.headerProps ?? {};
              return (
                <DefaultHeader
                  key={column.key}
                  column={column as any}
                  context={context}
                  sort={sort}
                  filter={filter?.[column.key]}
                  onFilterChange={(value) => onFilterChange?.(column.key, value)}
                  onSortByClick={handleOnSortByClick}
                  allSelected={allSelected}
                  anySelected={anySelected}
                  onToggleAll={toggleAll}
                  {...headerProps}
                />
              );
            }
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
              context={context!}
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

function _Row<TRow, TContext = unknown, TImpl extends TRow = TRow>({
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
  row: TImpl;
  context: TContext;
  rowKey: string;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelection: (key: string, event: any) => void;
  onToggleExpand: (key: string, value: boolean) => void;
} & Pick<
  TableProps<TRow, TContext, TImpl>,
  "columns" | "isExpandable" | "isHighlightable" | "onRowClick"
>) {
  const colors = useTableColors();
  const handleToggleSelection = useCallback(onToggleSelection.bind(null, rowKey), [
    onToggleSelection,
    rowKey,
  ]);
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

function _Cell<TRow, TContext>({ column, ...props }: TableCellProps<TRow, TContext>) {
  const cellProps =
    typeof column.cellProps === "function"
      ? column.cellProps(props.row, props.context)
      : column.cellProps ?? {};
  return (
    <Box
      as="td"
      padding={2}
      _last={{ paddingRight: 5 }}
      _first={{ paddingLeft: 5 }}
      userSelect="none"
      textAlign={column.align ?? "left"}
      {...cellProps}
    >
      <column.CellContent column={column} {...props} />
    </Box>
  );
}
const Cell: typeof _Cell = memo(_Cell) as any;

export function DefaultHeader({
  column,
  sort,
  filter,
  onFilterChange,
  onSortByClick,
  context,
  allSelected,
  anySelected,
  onToggleAll,
  ...props
}: TableHeaderProps<any>) {
  const intl = useIntl();
  const {
    onClose: onCloseFilter,
    onToggle: onToggleFilter,
    isOpen: isFilterOpen,
    getButtonProps: getFilterButtonProps,
    getDisclosureProps: getFilterPopoverProps,
  } = useDisclosure();

  const { referenceRef, popperRef } = usePopper({
    enabled: isFilterOpen,
    placement: "bottom-start",
    gutter: 2,
    modifiers: [
      {
        name: "matchMinWidth",
        enabled: true,
        phase: "beforeWrite",
        requires: ["computeStyles"],
        fn: ({ state }) => {
          state.styles.popper.minWidth = `${state.rects.reference.width}px`;
        },
        effect:
          ({ state }) =>
          () => {
            const reference = state.elements.reference as HTMLElement;
            state.elements.popper.style.minWidth = `${reference.offsetWidth}px`;
          },
      },
    ],
  });
  const ref = useRef<HTMLElement>(null);
  const filterButtonRef = useRef<HTMLElement>(null);

  const isMobile = useBreakpointValue({ base: true, sm: false });
  useOutsideClick({
    ref,
    handler: (event) => {
      if (filterButtonRef?.current?.contains(event.target as HTMLElement)) {
        // ignore
        return;
      }
      if (isMobile) {
        return;
      }
      onCloseFilter();
    },
  });

  const toFlexAlignment = (alignment: BoxProps["textAlign"]) => {
    if (alignment === "right") return "flex-end";
    if (alignment === "left") return "flex-start";
    else return alignment;
  };

  const _ref = useMergedRef(ref, popperRef);
  return (
    <Box
      ref={referenceRef}
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
      {...props}
    >
      <HStack
        spacing={1}
        alignItems="center"
        justifyContent={toFlexAlignment(column.align) ?? "flex-start"}
      >
        <Text as="div" isTruncated>
          {column.header}
        </Text>
        {column.isFilterable ? (
          <IconButtonWithTooltip
            ref={filterButtonRef}
            icon={<FilterIcon />}
            label={intl.formatMessage({
              id: "components.table.filter-button",
              defaultMessage: "Filter",
            })}
            size="xs"
            variant={isFilterOpen ? "solid" : filter ? "outline" : "ghost"}
            colorScheme={isFilterOpen ? "gray" : filter ? "purple" : "gray"}
            aria-label={intl.formatMessage(
              {
                id: "components.table.filter",
                defaultMessage: 'Filter "{column}"',
              },
              { column: column.header }
            )}
            {...getFilterButtonProps()}
            onClick={onToggleFilter}
          />
        ) : null}
        {column.isSortable ? (
          <IconButtonWithTooltip
            className="sort-by-button"
            onClick={(event) => onSortByClick?.(column.key, event)}
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
            label={intl.formatMessage({
              id: "components.table.sort-button",
              defaultMessage: "Sort",
            })}
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
                      id: "components.table.sort-by",
                      defaultMessage: 'Sort by "{column}"',
                    },
                    { column: column.header }
                  )
            }
          />
        ) : null}
      </HStack>
      {column.isFilterable && column.Filter ? (
        isMobile ? (
          <Modal isOpen={isFilterOpen} onClose={onCloseFilter}>
            <ModalOverlay>
              <ModalContent>
                <ModalCloseButton
                  aria-label={intl.formatMessage({
                    id: "generic.close",
                    defaultMessage: "Close",
                  })}
                />
                <ModalHeader>
                  <FormattedMessage id="component.table.filter-header" defaultMessage="Filter" />
                </ModalHeader>
                <ModalBody paddingTop={0} paddingX={4} paddingBottom={6}>
                  <column.Filter value={filter} onChange={onFilterChange} context={context} />
                </ModalBody>
              </ModalContent>
            </ModalOverlay>
          </Modal>
        ) : (
          <Portal>
            {isFilterOpen ? (
              <FocusLock restoreFocus>
                <Card
                  ref={_ref}
                  {...getFilterPopoverProps()}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      onCloseFilter();
                    }
                  }}
                >
                  <Heading as="h4" size="xs" textTransform="uppercase" paddingX={2} paddingY={2}>
                    <FormattedMessage id="component.table.filter-header" defaultMessage="Filter" />
                  </Heading>
                  <column.Filter value={filter} onChange={onFilterChange} context={context} />
                </Card>
              </FocusLock>
            ) : null}
          </Portal>
        )
      ) : null}
    </Box>
  );
}

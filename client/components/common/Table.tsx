import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Center,
  Table as ChakraTable,
  Checkbox,
  Collapse,
  FocusLock,
  HStack,
  HTMLChakraProps,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
import { Popover } from "@parallel/chakra/components";
import {
  ArrowUpDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  FilterIcon,
} from "@parallel/chakra/icons";
import { getKey, KeyProp } from "@parallel/utils/keyProp";
import { MaybeFunction, unMaybeFunction } from "@parallel/utils/types";
import { useEffectSkipFirst } from "@parallel/utils/useEffectSkipFirst";
import { useSelectionState } from "@parallel/utils/useSelectionState";
import { ValueProps } from "@parallel/utils/ValueProps";
import {
  ComponentType,
  Fragment,
  isValidElement,
  Key,
  memo,
  MouseEvent,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { identity, isNonNullish, noop, pick } from "remeda";
import { assert } from "ts-essentials";
import { HelpPopover } from "./HelpPopover";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";
import { Wrap } from "./Wrap";

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
  rows?: TImpl[];
  context?: TContext;
  rowKeyProp: KeyProp<TImpl>;
  sort?: TableSorting<any>;
  filter?: Record<string, any>;
  isSelectable?: boolean;
  isExpandable?: boolean;
  isHighlightable?: boolean;
  actions?: ((ButtonProps & { key: Key; wrap?: (node: ReactNode) => ReactNode }) | ReactElement)[];
  headProps?: MaybeFunction<HTMLChakraProps<"thead">, [context: TContext]>;
  rowProps?: MaybeFunction<HTMLChakraProps<"tr">, [row: TRow, context: TContext]>;
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

export interface TableRowProps<TRow, TContext = unknown> {
  row: TRow;
  context: TContext;
  rowKey: string;
  isSelected?: boolean;
  isExpanded?: boolean;
  onToggleSelection?: (event: any) => void;
  onToggleExpand?: (expanded: boolean) => void;
}

export interface TableCellProps<TRow, TContext = unknown, TFilter = unknown>
  extends TableRowProps<TRow, TContext> {
  column: TableColumn<TRow, TContext, TFilter>;
}

export interface TableColumn<
  TRow,
  TContext = unknown,
  TFilter extends Record<string, any> | unknown = unknown,
> {
  key: string;
  align?: BoxProps["textAlign"];
  isSortable?: true;
  isFixed?: true;
  Filter?: ComponentType<TableColumnFilterProps<TFilter, TContext>>;
  label: string | ((intl: IntlShape) => string);
  /** overrides label */
  header?: ReactNode;
  headerHelp?: string | ReactNode;
  Header?: ComponentType<TableHeaderProps<TRow, TContext, TFilter>>;
  headerProps?: MaybeFunction<HTMLChakraProps<"th">, [TContext]>;
  CellContent: ComponentType<TableCellProps<TRow, TContext, TFilter>>;
  cellProps?: MaybeFunction<HTMLChakraProps<"td">, [TRow, TContext]>;
}

export interface TableColumnFilterProps<
  TFilter extends Record<string, any> | unknown = unknown,
  TContext = unknown,
  TValue = TFilter extends Record<string, infer U> ? U : unknown,
> extends ValueProps<TValue> {
  column: TableColumn<any, TContext, TFilter>;
  context: TContext;
}

function unIntl(value: string | ((intl: IntlShape) => string), intl: IntlShape) {
  return typeof value === "string" ? value : value(intl);
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
  actions,
  headProps,
  rowProps,
  onSelectionChange,
  onRowClick,
  onSortChange,
  onFilterChange,
  ...props
}: TableProps<TRow, TContext, TImpl>) {
  const { selection, allSelected, anySelected, selectedCount, toggle, toggleAll } =
    useSelectionState(rows ?? [], rowKeyProp);

  useEffect(() => {
    onSelectionChange?.(
      Object.entries(selection)
        .filter(([_, value]) => value)
        .map(([key]) => key),
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
            },
      );
    },
    [sort, onSortChange],
  );

  const [expanded, setExpanded] = useState<string | null>(null);

  const handleToggleExpand = useCallback(function (key: string, value: boolean) {
    setExpanded(value ? key : null);
  }, []);

  const _columns = useMemo(() => {
    const updated =
      selectedCount > 0 && isNonNullish(actions)
        ? ([
            {
              ...pick(columns[0], ["key", "CellContent", "cellProps"]),
              label: "",
              Header: ({ context }) => (
                <Th colSpan={columns.length} paddingY="0" textTransform="none">
                  <HStack>
                    <Box fontSize="sm">
                      <FormattedMessage
                        id="component.table-page.n-selected"
                        defaultMessage="{count} selected"
                        values={{ count: context.selectedCount }}
                      />
                    </Box>
                    {actions?.map((action) => {
                      if (isValidElement(action)) {
                        return action;
                      } else {
                        const {
                          key,
                          wrap = identity,
                          ...props
                        } = action as Exclude<typeof action, ReactElement>;
                        return (
                          <Fragment key={key}>
                            {wrap(
                              <Button variant="ghost" size="sm" fontWeight="normal" {...props} />,
                            )}
                          </Fragment>
                        );
                      }
                    })}
                  </HStack>
                </Th>
              ),
            },
            ...columns.slice(1).map((column) => ({
              ...column,
              Header: () => null,
            })),
          ] as TableColumn<TRow, TContext & { selectedCount: number }>[])
        : [...(columns as TableColumn<TRow, TContext & { selectedCount: number }>[])];
    if (isExpandable) {
      updated.unshift({
        key: "expand-toggle",
        label: "",
        Header: () => <Th width="1px" />,
        cellProps: {
          paddingY: "0",
          paddingEnd: 1,
          _first: {
            paddingStart: 2,
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
        label: "",
        Header: ({ anySelected, allSelected, onToggleAll }) => (
          <Th padding="0 !important" width="40px">
            <Center as="label" height="38px" width="40px" cursor="pointer" onClick={onToggleAll}>
              <Checkbox
                isChecked={anySelected && allSelected}
                isIndeterminate={anySelected && !allSelected}
                onChange={noop}
              />
            </Center>
          </Th>
        ),
        cellProps: {
          padding: "0 !important",
        },
        CellContent: ({ isSelected, onToggleSelection }) => {
          return (
            <Center as="label" boxSize="40px" cursor="pointer" onClick={onToggleSelection}>
              <Checkbox isChecked={isSelected} onChange={noop} />
            </Center>
          );
        },
      });
    }
    return updated;
  }, [columns, selectedCount, actions, isSelectable, isExpandable]);

  const _context = useMemo(
    () => Object.assign({}, context, { selectedCount }),
    [context, selectedCount],
  );

  const handleRowClick = useMemo(
    () => onRowClick && preventClickWhenSelection(onRowClick),
    [onRowClick],
  );

  return (
    <ChakraTable
      variant="parallel"
      borderInline="none"
      {...props}
      sx={{ tableLayout: "auto", width: "100%", ...props.sx }}
    >
      <Thead {...unMaybeFunction(headProps, context as TContext)}>
        <Tr>
          {_columns.map((column) => {
            const Header = column.Header ?? DefaultHeader;
            return (
              <Header
                key={column.key}
                column={column}
                context={_context}
                sort={sort}
                filter={filter?.[column.key]}
                onFilterChange={(value) => onFilterChange?.(column.key, value)}
                onSortByClick={handleOnSortByClick}
                allSelected={allSelected}
                anySelected={anySelected}
                onToggleAll={toggleAll}
                {...unMaybeFunction(column.headerProps, _context!)}
              />
            );
          })}
        </Tr>
      </Thead>
      <Tbody>
        {(rows ?? []).map((row) => {
          const key = getKey(row, rowKeyProp);
          const isSelected = selection[key] ?? false;
          const isExpanded = key === expanded;
          return (
            <Row
              key={key}
              row={row}
              context={_context}
              rowKey={key}
              columns={_columns}
              isSelected={isSelected}
              isExpanded={isExpanded}
              isExpandable={isExpandable}
              isHighlightable={isHighlightable}
              rowProps={rowProps}
              onRowClick={handleRowClick}
              onToggleExpand={handleToggleExpand}
              onToggleSelection={toggle}
            />
          );
        })}
      </Tbody>
    </ChakraTable>
  );
}

export const Table: typeof _Table = memo(_Table) as any;

function _Row<TRow, TContext = unknown, TImpl extends TRow = TRow>({
  row,
  context,
  rowKey,
  columns,
  isSelected,
  isExpanded,
  isExpandable,
  isHighlightable,
  rowProps,
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
  "columns" | "isExpandable" | "isHighlightable" | "onRowClick" | "rowProps"
>) {
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
      <Tr
        data-highlightable={isHighlightable ? true : undefined}
        data-selected={isSelected ? true : undefined}
        cursor={onRowClick ? "pointer" : "default"}
        {...(isExpandable
          ? {}
          : {
              borderTop: "1px solid",
              borderTopColor: "gray.200",
            })}
        onClick={onRowClick?.bind(null, row)}
        {...unMaybeFunction(rowProps, row, context)}
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
      </Tr>
      {isExpandable ? (
        <Tr>
          <Td padding={0} colSpan={columns.length}>
            <Collapse in={isExpanded}>
              <FormattedMessage id="generic.expand" defaultMessage="Expand" />
            </Collapse>
          </Td>
        </Tr>
      ) : null}
    </>
  );
}
const Row: typeof _Row = memo(_Row) as any;

function _Cell<TRow, TContext>({ column, ...props }: TableCellProps<TRow, TContext>) {
  return (
    <Td
      userSelect="contain"
      textAlign={column.align ?? "left"}
      {...unMaybeFunction(column.cellProps, props.row, props.context)}
    >
      <column.CellContent column={column} {...props} />
    </Td>
  );
}
const Cell: typeof _Cell = memo(_Cell) as any;

export function DefaultHeader<TRow, TContext = unknown, TFilter = unknown>({
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
}: TableHeaderProps<TRow, TContext, TFilter>) {
  const intl = useIntl();
  const {
    onClose: onCloseFilter,
    onOpen: onOpenFilter,
    onToggle: onToggleFilter,
    isOpen: isFilterOpen,
  } = useDisclosure();

  const form = useForm({
    mode: "onSubmit",
    defaultValues: { filter },
  });

  useEffectSkipFirst(() => {
    reset({ filter });
  }, [filter]);
  const { handleSubmit, reset } = form;

  const popoverRef = useRef<HTMLFormElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  async function handleOverlayClick(event: MouseEvent) {
    if (event.currentTarget === event.target) {
      handleSubmit(({ filter }) => {
        onFilterChange(filter);
        onCloseFilter();
      })();
    }
  }

  const handleCancel = () => {
    onCloseFilter();
    reset();
  };

  const toFlexAlignment = (alignment: BoxProps["textAlign"]) => {
    if (alignment === "right") return "flex-end";
    if (alignment === "left") return "flex-start";
    else return alignment;
  };

  return (
    <Th
      key={column.key}
      className={sort?.field === column.key ? "sort-active" : undefined}
      paddingY={0}
      height="40px"
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
        <Text as="div" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
          {column.header ?? unIntl(column.label, intl)}
        </Text>
        {column.headerHelp ? <HelpPopover>{column.headerHelp}</HelpPopover> : null}
        {column.Filter ? (
          <Popover
            isOpen={isFilterOpen}
            onOpen={onOpenFilter}
            onClose={handleCancel}
            closeOnBlur={false}
            returnFocusOnClose={false}
          >
            <PopoverTrigger>
              {
                <IconButtonWithTooltip
                  ref={filterButtonRef}
                  icon={<FilterIcon />}
                  label={intl.formatMessage({
                    id: "component.table.filter-button",
                    defaultMessage: "Filter",
                  })}
                  size="xs"
                  variant={isFilterOpen ? "solid" : filter ? "outline" : "ghost"}
                  colorScheme={isFilterOpen ? "gray" : filter ? "primary" : "gray"}
                  aria-label={intl.formatMessage(
                    {
                      id: "component.table.filter",
                      defaultMessage: 'Filter "{column}"',
                    },
                    { column: unIntl(column.label, intl) },
                  )}
                  onClick={onToggleFilter}
                />
              }
            </PopoverTrigger>
            <Portal>
              <Wrap
                when={isFilterOpen}
                wrapper={({ children }) => (
                  <Box
                    __css={{
                      position: "fixed",
                      left: "0",
                      top: "0",
                      width: "100vw",
                      height: "100vh",
                      zIndex: "popover",
                    }}
                    onClick={handleOverlayClick}
                  >
                    {children}
                  </Box>
                )}
              >
                <PopoverContent ref={popoverRef} width="min-content">
                  <FocusLock restoreFocus={false}>
                    <PopoverHeader
                      textTransform="uppercase"
                      borderBottom="none"
                      fontWeight="medium"
                      fontSize="sm"
                      paddingBottom={0}
                    >
                      <FormattedMessage
                        id="component.table.filter-header"
                        defaultMessage="Filter"
                      />
                    </PopoverHeader>
                    <PopoverCloseButton />
                    <PopoverBody
                      as="form"
                      onSubmit={handleSubmit(({ filter }) => {
                        onFilterChange(filter);
                        onCloseFilter();
                      })}
                    >
                      {(assert(isNonNullish(column.Filter)), null)}
                      <FormProvider {...form}>
                        <column.Filter
                          value={filter}
                          onChange={onFilterChange}
                          context={context}
                          column={column}
                        />
                      </FormProvider>
                    </PopoverBody>
                  </FocusLock>
                </PopoverContent>
              </Wrap>
            </Portal>
          </Popover>
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
              id: "component.table.sort-button",
              defaultMessage: "Sort",
            })}
            size="xs"
            variant="ghost"
            aria-label={
              sort?.field === column.key
                ? intl.formatMessage(
                    {
                      id: "component.table.change-sorting",
                      defaultMessage: 'Change sorting for "{column}"',
                    },
                    { column: unIntl(column.label, intl) },
                  )
                : intl.formatMessage(
                    {
                      id: "component.table.sort-by",
                      defaultMessage: 'Sort by "{column}"',
                    },
                    {
                      column: unIntl(column.label, intl),
                    },
                  )
            }
          />
        ) : null}
      </HStack>
    </Th>
  );
}

function preventClickWhenSelection<T extends (...args: any[]) => void>(
  fn: T,
): (...args: Parameters<T>) => void {
  return function (...args: any[]) {
    setTimeout(() => {
      const selection = document.getSelection();
      if (isNonNullish(selection)) {
        if (
          !selection.isCollapsed &&
          (selection.anchorNode?.nodeType === Node.TEXT_NODE || selection.rangeCount > 1)
        ) {
          return;
        } else {
          if ("empty" in selection) {
            selection.empty();
          }
        }
      }
      fn(...args);
    });
  };
}

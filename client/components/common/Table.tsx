import { FocusLock } from "@chakra-ui/focus-lock";
import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Center,
  Table as ChakraTable,
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
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useBreakpointValue,
  useDisclosure,
  useOutsideClick,
  usePopper,
} from "@chakra-ui/react";
import {
  ArrowUpDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  FilterIcon,
} from "@parallel/chakra/icons";
import { getKey, KeyProp } from "@parallel/utils/keyProp";
import { useSelectionState } from "@parallel/utils/useSelectionState";
import { ValueProps } from "@parallel/utils/ValueProps";
import useMergedRef from "@react-hook/merged-ref";
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
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { identity, isNonNullish, noop, pick } from "remeda";
import { Card } from "./Card";
import { HelpPopover } from "./HelpPopover";
import { IconButtonWithTooltip } from "./IconButtonWithTooltip";
import { ScrollTableContainer } from "./ScrollTableContainer";

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
  isFixed?: true;
  isFilterable?: true;
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

export interface TableColumnFilterProps<TFilter, TContext = unknown> extends ValueProps<TFilter> {
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
          <Th width="40px" padding="0 !important">
            <Center as="label" boxSize="40px" cursor="pointer" onClick={onToggleAll}>
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
    <ScrollTableContainer>
      <ChakraTable
        variant="parallel"
        borderInline="none"
        {...props}
        sx={{ tableLayout: "auto", width: "100%", ...props.sx }}
      >
        <Thead>
          <Tr height="42px">
            {_columns.map((column) => {
              if (column.Header) {
                return (
                  <column.Header
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
                  />
                );
              } else {
                const headerProps =
                  typeof column.headerProps === "function"
                    ? column.headerProps(_context!)
                    : (column.headerProps ?? {});
                return (
                  <DefaultHeader
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
                    {...headerProps}
                  />
                );
              }
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
                onRowClick={handleRowClick}
                onToggleExpand={handleToggleExpand}
                onToggleSelection={toggle}
              />
            );
          })}
        </Tbody>
      </ChakraTable>
    </ScrollTableContainer>
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
  const cellProps =
    typeof column.cellProps === "function"
      ? column.cellProps(props.row, props.context)
      : (column.cellProps ?? {});
  return (
    <Td userSelect="contain" textAlign={column.align ?? "left"} {...cellProps}>
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
    <Th
      ref={referenceRef}
      key={column.key}
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
        <Text as="div" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
          {column.header ?? unIntl(column.label, intl)}
        </Text>
        {column.headerHelp ? <HelpPopover>{column.headerHelp}</HelpPopover> : null}

        {column.isFilterable ? (
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
                  transition="none"
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

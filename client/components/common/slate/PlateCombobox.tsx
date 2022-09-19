import { Box, Center, Portal, Spinner } from "@chakra-ui/react";
import { MaybePromise } from "@parallel/utils/types";
import { useAsyncEffect } from "@parallel/utils/useAsyncEffect";
import {
  comboboxActions,
  comboboxSelectors,
  ComboboxState,
  ComboboxStateById,
  Data,
  getComboboxStoreById,
  NoData,
  TComboboxItem,
  useComboboxControls,
  useComboboxSelectors,
} from "@udecode/plate-combobox";
import {
  getAboveNode,
  RenderFunction,
  toDOMNode,
  useEditorState,
  useEventEditorSelectors,
} from "@udecode/plate-core";
import { flip, offset, shift, useVirtualFloating } from "@udecode/plate-floating";
import { useCallback, useEffect, useState } from "react";
import { Card } from "../Card";

export interface ComboboxItemProps<TData> {
  item: TComboboxItem<TData>;
  search: string;
}

export interface ComboboxProps<TData = NoData>
  extends Partial<Pick<ComboboxState<TData>, "items">>,
    ComboboxStateById<TData> {
  inputType: string;
  defaultItems?: TComboboxItem<TData>[];
  onSearchItems: (search: string) => MaybePromise<TComboboxItem<TData>[]>;
  /**
   * Render combobox item.
   * @default item.text
   */
  onRenderItem?: RenderFunction<ComboboxItemProps<TData>>;
  onRenderNoItems?: RenderFunction<{ search: string }>;
}

const ComboboxContent = <TData extends Data = NoData>(
  props: Omit<
    ComboboxProps<TData>,
    | "id"
    | "trigger"
    | "searchPattern"
    | "onSelectItem"
    | "controlled"
    | "maxSuggestions"
    | "filter"
    | "sort"
  >
) => {
  const {
    inputType,
    defaultItems,
    onSearchItems,
    onRenderItem: Item = ({ item }) => item.text,
    onRenderNoItems: NoItems = () => null,
  } = props;

  const targetRange = useComboboxSelectors.targetRange();
  const filteredItems = useComboboxSelectors.filteredItems();
  const highlightedIndex = useComboboxSelectors.highlightedIndex();
  const floatingOptions = useComboboxSelectors.floatingOptions?.();
  const editor = useEditorState();
  const combobox = useComboboxControls();
  const isOpen = useComboboxSelectors.isOpen();
  const text = useComboboxSelectors.text() ?? "";

  const [isLoading, setIsLoading] = useState(false);

  // Update items
  useAsyncEffect(
    async (isMounted) => {
      try {
        if (isOpen) {
          let items = [] as TComboboxItem<TData>[];
          if (text === "") {
            items = defaultItems ?? [];
          } else {
            setIsLoading(true);
            items = await onSearchItems(text);
          }
          if (isMounted()) {
            comboboxActions.items(items);
            comboboxActions.filteredItems(items);
            setIsLoading(false);
          }
        } else {
          comboboxActions.items([]);
          comboboxActions.filteredItems([]);
          setIsLoading(false);
        }
      } catch {}
    },
    [defaultItems, text, isOpen, onSearchItems]
  );

  // Get target range rect
  const getBoundingClientRect = useCallback(() => {
    const match = getAboveNode(editor as any, {
      at: targetRange ?? undefined,
      match: (node) => node.type === inputType,
    });
    const node = match && match[0];
    const domNode = node && toDOMNode(editor, node);
    return (
      domNode?.getBoundingClientRect() ?? {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        top: -9999,
        left: -9999,
        right: 9999,
        bottom: 9999,
      }
    );
  }, [editor, targetRange]);

  // Update popper position
  const { style, floating } = useVirtualFloating({
    placement: "bottom-start",
    getBoundingClientRect,
    middleware: [offset({ mainAxis: 4, alignmentAxis: -3 }), shift(), flip()],
    ...floatingOptions,
  });

  const menuProps = combobox
    ? combobox.getMenuProps({}, { suppressRefError: true })
    : { ref: null };

  return (
    <Portal>
      <Card
        {...menuProps}
        ref={floating}
        style={style}
        paddingY={1}
        transition="none"
        maxHeight="220px"
        overflow="auto"
        minWidth="320px"
        maxWidth="320px"
      >
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <Box
                key={item.key}
                backgroundColor={isHighlighted ? "gray.100" : undefined}
                paddingX={4}
                paddingY={1}
                cursor="pointer"
                {...combobox.getItemProps({
                  item,
                  index,
                })}
                whiteSpace="nowrap"
                onMouseEnter={(e) => {
                  comboboxActions.highlightedIndex(index);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  const onSelectItem = getComboboxStoreById(
                    comboboxSelectors.activeId()
                  )?.get.onSelectItem();
                  onSelectItem?.(editor, item);
                }}
              >
                <Item search={text} item={item as TComboboxItem<TData>} />
              </Box>
            );
          })
        ) : isLoading ? (
          <Center minHeight={40}>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="primary.500"
              size="xl"
            />
          </Center>
        ) : (
          <NoItems search={text} />
        )}
      </Card>
    </Portal>
  );
};

/**
 * Register the combobox id, trigger, onSelectItem
 * Renders the combobox if active.
 */
export const PlateCombobox = <TData extends Data = NoData>({
  id,
  trigger,
  searchPattern,
  onSelectItem,
  controlled,
  maxSuggestions,
  filter,
  sort,
  ...props
}: ComboboxProps<TData>) => {
  const editor = useEditorState();
  const focusedEditorId = useEventEditorSelectors.focus?.();
  const combobox = useComboboxControls();
  const activeId = useComboboxSelectors.activeId();

  useEffect(() => {
    comboboxActions.setComboboxById({
      id,
      trigger,
      searchPattern,
      controlled,
      onSelectItem,
      maxSuggestions,
      filter,
      sort,
    });
  }, [id, trigger, searchPattern, controlled, onSelectItem, maxSuggestions, filter, sort]);

  if (!combobox || !editor.selection || focusedEditorId !== editor.id || activeId !== id) {
    return null;
  }

  return <ComboboxContent {...props} />;
};

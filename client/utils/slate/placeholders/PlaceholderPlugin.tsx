import { Box } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { HighlightText } from "@parallel/components/common/HighlightText";
import useMergedRef from "@react-hook/merged-ref";
import { getNodeDeserializer, getText } from "@udecode/plate-common";
import {
  getPlatePluginTypes,
  PlatePlugin,
  TRenderElementProps,
} from "@udecode/plate-core";
import {
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { Editor, Range, Transforms } from "slate";
import { useFocused, useSelected } from "slate-react";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import { CustomEditor, PlaceholderElement } from "../types";
import { insertPlaceholder } from "./insertPlaceholder";
import { textWithPlaceholderToSlateNodes } from "./textWithPlaceholderToSlateNodes";

export type Placeholder = {
  value: string;
  label: string;
};

export const ELEMENT_PLACEHOLDER = "placeholder";

export function usePlaceholderPlugin(placeholders: Placeholder[]) {
  type PlaceholderState = {
    target: Range | null;
    index: number;
    search: string | null;
  };
  const [{ target, index, search }, dispatch] = useReducer(
    (
      state: PlaceholderState,
      action: (prevState: PlaceholderState) => PlaceholderState
    ) => action(state),
    {
      target: null,
      index: 0,
      search: null,
    }
  );
  const values = search
    ? placeholders.filter((c) =>
        c.label.toLowerCase().includes(search.toLowerCase())
      )
    : placeholders;

  const onAddPlaceholder = useCallback(
    (editor: Editor, placeholder: Placeholder) => {
      if (target !== null) {
        Transforms.select(editor, target);
        insertPlaceholder(editor, placeholder);
        dispatch((state) => ({ ...state, target: null }));
      }
    },
    [target]
  );

  const onKeyDownPlaceholder = useCallback(
    (e: KeyboardEvent, editor: Editor) => {
      if (target && values.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          dispatch((state) => ({
            ...state,
            index: index < values.length - 1 ? index + 1 : 0,
          }));
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          dispatch((state) => ({
            ...state,
            index: index > 0 ? index - 1 : values.length - 1,
          }));
        }
        if (e.key === "Escape") {
          e.preventDefault();
          dispatch((state) => ({ ...state, target: null }));
        }

        if (["Tab", "Enter"].includes(e.key)) {
          const value = values[index];
          if (value) {
            e.preventDefault();
            return onAddPlaceholder(editor, value);
          }
        }
      }
    },
    [values, index, target, onAddPlaceholder]
  );

  const onChangePlaceholder = useCallback((editor: Editor) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const cursor = Range.start(selection);
      const before = Editor.before(editor, cursor, { unit: "block" });
      const beforeRange = before && Editor.range(editor, before, cursor);
      const beforeText = beforeRange && Editor.string(editor, beforeRange);
      const match = !!beforeText && beforeText.match(/#([a-z-]*)$/);
      const after = Editor.after(editor, cursor);
      const afterRange = Editor.range(editor, cursor, after);
      const afterText = getText(editor, afterRange);
      if (match && afterText.match(/^([^a-z]|$)/)) {
        // Get the range for the #xxx
        const beforeHash = Editor.before(editor, cursor, {
          unit: "character",
          distance: match ? match[0].length : 0,
        });
        const target = beforeHash && Editor.range(editor, beforeHash, cursor);
        const [, search] = match;
        dispatch(() => ({ target: target ?? null, search, index: 0 }));
        return;
      }
    }
    dispatch((state) => ({ ...state, target: null, search: null }));
  }, []);

  const onHighlightOption = useCallback((index: number) => {
    dispatch((state) => ({ ...state, index }));
  }, []);

  return {
    search,
    selectedIndex: index,
    target,
    values,
    onChangePlaceholder,
    onKeyDownPlaceholder,
    onAddPlaceholder,
    onHighlightOption,
    plugin: useMemo<PlatePlugin>(
      () => ({
        withOverrides: ((editor: CustomEditor) => {
          editor.insertData = (data) => {
            const text = data.getData("text/plain");
            editor.insertFragment(
              textWithPlaceholderToSlateNodes(text, placeholders)
            );
          };
          return editor;
        }) as any,
        inlineTypes: getPlatePluginTypes(ELEMENT_PLACEHOLDER),
        voidTypes: getPlatePluginTypes(ELEMENT_PLACEHOLDER),
        renderElementDeps: [placeholders],
        renderElement: () => (props: TRenderElementProps) => {
          const { children, attributes } = props;
          const element = props.element as PlaceholderElement;
          const placeholder = placeholders.find(
            (p) => p.value === element.placeholder
          );
          return placeholder ? (
            <PlaceholderToken
              value={element.placeholder}
              label={placeholder.label}
              attributes={attributes}
            >
              {children}
            </PlaceholderToken>
          ) : undefined;
        },
        deserialize: () => ({
          element: getNodeDeserializer({
            type: ELEMENT_PLACEHOLDER,
            getNode: (el) => ({
              type: "placeholder",
              value: el.getAttribute("data-placeholder"),
            }),
            rules: [{ className: "slate-placeholder" }],
          }),
        }),
      }),
      []
    ),
  };
}

interface PlaceholderMenuProps {
  menuId: string;
  itemIdPrefix: string;
  search?: string | null;
  values: Placeholder[];
  selectedIndex: number;
  onAddPlaceholder: (placeholder: Placeholder) => void;
  onHighlightOption: (index: number) => void;
}

export const PlaceholderMenu = chakraForwardRef<"div", PlaceholderMenuProps>(
  function PlaceholderMenu(
    {
      search,
      menuId,
      itemIdPrefix,
      values,
      selectedIndex,
      onAddPlaceholder,
      onHighlightOption,
      ...props
    },
    ref
  ) {
    const menuRef = useRef<HTMLElement>(null);
    const mergedRef = useMergedRef(ref, menuRef);
    useEffect(() => {
      const element = menuRef.current?.children.item(selectedIndex);
      if (element) {
        scrollIntoView(element, { block: "nearest", scrollMode: "if-needed" });
      }
    }, [selectedIndex]);
    return (
      <Card
        as="div"
        ref={mergedRef}
        id={menuId}
        role="listbox"
        overflow="auto"
        maxHeight="180px"
        paddingY={1}
        {...props}
      >
        {values.map((placeholder, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Box
              key={placeholder.value}
              id={`${itemIdPrefix}-${placeholder.value}`}
              role="option"
              aria-selected={isSelected ? "true" : undefined}
              backgroundColor={isSelected ? "gray.100" : "white"}
              paddingX={4}
              paddingY={1}
              cursor="pointer"
              onMouseDown={() => onAddPlaceholder(placeholder)}
              onMouseEnter={() => onHighlightOption(index)}
            >
              <Box whiteSpace="nowrap">
                <HighlightText text={placeholder.label} search={search ?? ""} />
              </Box>
            </Box>
          );
        })}
      </Card>
    );
  }
);

const PlaceholderToken = function ({
  value,
  label,
  attributes,
  children,
}: {
  value: string;
  label: string;
  attributes: any;
  children: ReactNode;
}) {
  const selected = useSelected();
  const focused = useFocused();
  return (
    <Box
      className="slate-placeholder"
      contentEditable={false}
      data-placeholder={value}
      {...attributes}
      as="span"
      display="inline-block"
      backgroundColor="purple.500"
      color="white"
      borderRadius="sm"
      fontSize="xs"
      boxShadow={selected && focused ? "outline" : "none"}
      textTransform="uppercase"
      paddingX={1}
      marginX="0.1em"
      position="relative"
      top="-1px"
    >
      <Box
        as="span"
        data-placeholder-label={label}
        _before={{ content: `attr(data-placeholder-label)` }}
      />
      <Box as="span" fontSize={0} aria-hidden>{`#${value}#`}</Box>
      {children}
    </Box>
  );
};

import { Box } from "@chakra-ui/react";
import { normalizeEventKey } from "@parallel/utils/keys";
import { useConstant } from "@parallel/utils/useConstant";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { getText } from "@udecode/plate-common";
import {
  createPluginFactory,
  insertNodes,
  moveSelection,
  PlatePlugin,
  select,
  TRenderElementProps,
} from "@udecode/plate-core";
import { ReactNode, useCallback, useState } from "react";
import { clamp, isDefined } from "remeda";
import { Editor, Range } from "slate";
import { useFocused, useSelected } from "slate-react";
import { CustomEditor, SlateElement, SlateText } from "../types";

export type PlaceholderOption = {
  value: string;
  label: string;
};

export const PLACEHOLDER_TYPE = "placeholder" as const;
export interface PlaceholderElement extends SlateElement<typeof PLACEHOLDER_TYPE, SlateText> {
  placeholder: string;
}

export function usePlaceholderPlugin(options: PlaceholderOption[]) {
  const [state, setState] = useState<{
    target: Range | null;
    index: number;
    search: string | null;
  }>({
    target: null,
    index: 0,
    search: null,
  });
  const stateRef = useUpdatingRef(state);
  const placeholderOptionsRef = useUpdatingRef(options);
  const filteredValuesRef = useUpdatingRef(
    isDefined(state.search)
      ? options.filter((c) => c.label.toLowerCase().includes(state.search!.toLowerCase()))
      : options
  );
  const onAddPlaceholder = useCallback((editor: CustomEditor, placeholder: PlaceholderOption) => {
    const { target } = stateRef.current;
    if (target !== null) {
      select(editor, target);
      insertPlaceholder(editor, placeholder);
      setState((state) => ({ ...state, index: 0, target: null }));
    }
  }, []);

  const onHighlightOption = useCallback((index: number) => {
    setState((s) => ({ ...s, index }));
  }, []);

  return {
    ...state,
    values: filteredValuesRef.current,
    onAddPlaceholder,
    onHighlightOption,
    plugin: useConstant<PlatePlugin>(() =>
      createPluginFactory({
        key: PLACEHOLDER_TYPE,
        isElement: true,
        isInline: true,
        isVoid: true,
        handlers: {
          onKeyDown: (editor) => (event) => {
            const values = filteredValuesRef.current;
            const { index, target } = stateRef.current!;
            if (target && values.length > 0) {
              const eventKey = normalizeEventKey(event);
              if (eventKey === "ArrowDown") {
                event.preventDefault();
                setState((s) => ({
                  ...s,
                  index: clamp(index + 1, { max: values.length - 1, min: 0 }),
                }));
              }
              if (eventKey === "ArrowUp") {
                event.preventDefault();
                setState((s) => ({
                  ...s,
                  index: clamp(index - 1, { max: values.length - 1, min: 0 }),
                }));
              }
              if (eventKey === "Escape") {
                event.preventDefault();
                setState((state) => ({ ...state, index: 0, target: null }));
              }
              if (["Tab", "Enter"].includes(eventKey)) {
                const value = values[index];
                if (value) {
                  event.preventDefault();
                  return onAddPlaceholder(editor, value);
                }
              }
            }
          },
          onChange: (editor) => (value) => {
            const { selection } = editor;

            if (selection && Range.isCollapsed(selection)) {
              const cursor = Range.start(selection);
              const before = Editor.before(editor as any, cursor, { unit: "block" });
              const beforeRange = before && Editor.range(editor as any, before, cursor);
              const beforeText = beforeRange && Editor.string(editor as any, beforeRange);
              const match = !!beforeText && beforeText.match(/#([a-z-]*)$/);
              const after = Editor.after(editor as any, cursor);
              const afterRange = Editor.range(editor as any, cursor, after);
              const afterText = getText(editor as any, afterRange);
              if (match && afterText.match(/^([^a-z]|$)/)) {
                // Get the range for the #xxx
                const beforeHash = Editor.before(editor as any, cursor, {
                  unit: "character",
                  distance: match ? match[0].length : 0,
                });
                const target = beforeHash && Editor.range(editor as any, beforeHash, cursor);
                const [, search] = match;
                setState(() => ({ target: target ?? null, search, index: 0 }));
                return;
              }
            }
            setState((s) => ({ ...s, target: null, search: null }));
          },
        },
        then: (editor, { key }) => ({
          options: {
            id: key,
          },
          component: (props: TRenderElementProps) => {
            const { children, attributes } = props;
            const element = props.element as PlaceholderElement;
            const placeholder = placeholderOptionsRef.current.find(
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
            ) : null;
          },
          deserializeHtml: {
            type: PLACEHOLDER_TYPE,
            validAttribute: "data-placeholder",
            getNode: (el) => ({
              type: PLACEHOLDER_TYPE,
              value: el.getAttribute("data-placeholder"),
            }),
            rules: [{ validAttribute: "data-placeholder" }],
          },
        }),
      })()
    ),
  };
}

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
      fontSize="80%"
      fontWeight="normal"
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

function insertPlaceholder(editor: CustomEditor, placeholder: PlaceholderOption) {
  insertNodes(editor, {
    type: PLACEHOLDER_TYPE,
    placeholder: placeholder.value,
    children: [{ text: "" }],
  });

  moveSelection(editor);
}

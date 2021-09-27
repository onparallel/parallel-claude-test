import { Box } from "@chakra-ui/react";
import { normalizeEventKey } from "@parallel/utils/normalizeEventKey";
import { useConstant } from "@parallel/utils/useConstant";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { getNodeDeserializer, getText } from "@udecode/plate-common";
import { getPlatePluginTypes, PlatePlugin, TRenderElementProps } from "@udecode/plate-core";
import { KeyboardEvent, ReactNode, useMemo, useState } from "react";
import { clamp, isDefined } from "remeda";
import { Editor, Range, Transforms } from "slate";
import { useFocused, useSelected } from "slate-react";
import { SlateElement, SlateText } from "../types";

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

  return {
    ...state,
    values: filteredValuesRef.current,
    ...useMemo(() => {
      const onAddPlaceholder = (editor: Editor, placeholder: PlaceholderOption) => {
        const { target } = stateRef.current;
        if (target !== null) {
          Transforms.select(editor, target);
          insertPlaceholder(editor, placeholder);
          setState((state) => ({ ...state, index: 0, target: null }));
        }
      };
      const onKeyDownPlaceholder = (e: KeyboardEvent, editor: Editor) => {
        const values = filteredValuesRef.current;
        const { index, target } = stateRef.current!;
        if (target && values.length > 0) {
          const eventKey = normalizeEventKey(e);
          if (eventKey === "ArrowDown") {
            e.preventDefault();
            setState((s) => ({
              ...s,
              index: clamp(index + 1, { max: values.length - 1, min: 0 }),
            }));
          }
          if (eventKey === "ArrowUp") {
            e.preventDefault();
            setState((s) => ({
              ...s,
              index: clamp(index - 1, { max: values.length - 1, min: 0 }),
            }));
          }
          if (eventKey === "Escape") {
            e.preventDefault();
            setState((state) => ({ ...state, index: 0, target: null }));
          }
          if (["Tab", "Enter"].includes(eventKey)) {
            const value = values[index];
            if (value) {
              e.preventDefault();
              return onAddPlaceholder(editor, value);
            }
          }
        }
      };
      const onChangePlaceholder = (editor: Editor) => {
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
            setState(() => ({ target: target ?? null, search, index: 0 }));
            return;
          }
        }
        setState((s) => ({ ...s, target: null, search: null }));
      };
      const onHighlightOption = (index: number) => {
        setState((s) => ({ ...s, index }));
      };
      return {
        onAddPlaceholder,
        onKeyDownPlaceholder,
        onChangePlaceholder,
        onHighlightOption,
      };
    }, []),
    plugin: useConstant<PlatePlugin>(() => ({
      inlineTypes: getPlatePluginTypes(PLACEHOLDER_TYPE),
      voidTypes: getPlatePluginTypes(PLACEHOLDER_TYPE),
      renderElement: () => (props: TRenderElementProps) => {
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
        ) : undefined;
      },
      deserialize: () => ({
        element: getNodeDeserializer({
          type: PLACEHOLDER_TYPE,
          getNode: (el) => ({
            type: PLACEHOLDER_TYPE,
            value: el.getAttribute("data-placeholder"),
          }),
          rules: [{ className: "slate-placeholder" }],
        }),
      }),
    })),
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

function insertPlaceholder(editor: Editor, placeholder: PlaceholderOption) {
  Transforms.insertNodes(editor, {
    type: PLACEHOLDER_TYPE,
    placeholder: placeholder.value,
    children: [{ text: "" }],
  });

  Transforms.move(editor);
}

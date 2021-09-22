import {
  Box,
  Portal,
  Text,
  useFormControl,
  useId,
  useMultiStyleConfig,
  usePopper,
} from "@chakra-ui/react";
import { formatList } from "@parallel/utils/slate/formatList";
import {
  PlaceholderOption,
  PlaceholderMenu,
  usePlaceholderPlugin,
} from "@parallel/utils/slate/placeholders/PlaceholderPlugin";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { CustomEditor } from "@parallel/utils/slate/types";
import { useConstant } from "@parallel/utils/useConstant";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { ValueProps } from "@parallel/utils/ValueProps";
import { createAutoformatPlugin } from "@udecode/plate-autoformat";
import {
  createBoldPlugin,
  createItalicPlugin,
  createUnderlinePlugin,
  DEFAULTS_BOLD,
  DEFAULTS_ITALIC,
  DEFAULTS_UNDERLINE,
  MARK_BOLD,
  MARK_ITALIC,
  MARK_UNDERLINE,
} from "@udecode/plate-basic-marks";
import { createExitBreakPlugin } from "@udecode/plate-break";
import { getNode, withProps } from "@udecode/plate-common";
import {
  createHistoryPlugin,
  createReactPlugin,
  Plate,
  PlatePluginOptions,
  useStoreEditorState,
} from "@udecode/plate-core";
import { createHeadingPlugin, ELEMENT_H1, ELEMENT_H2 } from "@udecode/plate-heading";
import { createLinkPlugin, ELEMENT_LINK } from "@udecode/plate-link";
import {
  createListPlugin,
  ELEMENT_LI,
  ELEMENT_LIC,
  ELEMENT_OL,
  ELEMENT_UL,
  unwrapList,
} from "@udecode/plate-list";
import { createParagraphPlugin, ELEMENT_PARAGRAPH } from "@udecode/plate-paragraph";
import {
  CSSProperties,
  forwardRef,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";
import { omit, pick } from "remeda";
import { ReactEditor } from "slate-react";
import { EditableProps } from "slate-react/dist/components/editable";
import { RichTextEditorToolbar } from "./RichTextEditorToolbar";

const components = {
  [ELEMENT_H1]: withProps(RenderElement, {
    as: "h1",
    fontSize: "xl",
    fontWeight: "bold",
  }),
  [ELEMENT_H2]: withProps(RenderElement, {
    as: "h2",
    fontSize: "lg",
    fontWeight: "bold",
  }),
  [ELEMENT_PARAGRAPH]: withProps(RenderElement, { as: "p" }),
  [ELEMENT_OL]: withProps(RenderElement, { as: "ol", paddingInlineStart: 6 }),
  [ELEMENT_UL]: withProps(RenderElement, { as: "ul", paddingInlineStart: 6 }),
  [ELEMENT_LI]: withProps(RenderElement, { as: "li" }),
  [ELEMENT_LIC]: withProps(RenderElement, {}),
  [ELEMENT_LINK]: RenderLink,
  [MARK_BOLD]: withProps(RenderElement, { as: "strong" }),
  [MARK_ITALIC]: withProps(RenderElement, { as: "em" }),
  [MARK_UNDERLINE]: withProps(RenderElement, { as: "u" }),
};

const options = {
  [ELEMENT_H1]: { type: "heading", hotkey: ["mod+opt+1", "mod+shift+1"] },
  [ELEMENT_H2]: { type: "subheading", hotkey: ["mod+opt+2", "mod+shift+2"] },
  [ELEMENT_PARAGRAPH]: {
    type: "paragraph",
    hotkey: ["mod+opt+0", "mod+shift+0"],
  },
  [ELEMENT_OL]: { type: "numbered-list" },
  [ELEMENT_UL]: { type: "bulleted-list" },
  [ELEMENT_LI]: { type: "list-item" },
  [ELEMENT_LIC]: { type: "list-item-child" },
  [MARK_BOLD]: DEFAULTS_BOLD,
  [MARK_ITALIC]: DEFAULTS_ITALIC,
  [MARK_UNDERLINE]: DEFAULTS_UNDERLINE,
  [ELEMENT_LINK]: { type: "link" },
} as Record<string, PlatePluginOptions>;

export interface RichTextEditorProps
  extends ValueProps<RichTextEditorValue, false>,
    Omit<EditableProps, "value" | "onChange"> {
  // we need an id to pass it to the Plate element
  id: string;
  placeholder?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
  placeholderOptions?: PlaceholderOption[];
}

export interface RichTextEditorInstance {
  focus(): void;
}

export const RichTextEditor = forwardRef<RichTextEditorInstance, RichTextEditorProps>(
  function RichTextEditor(
    {
      id,
      value,
      onChange,
      isDisabled,
      isInvalid,
      isRequired,
      isReadOnly,
      onKeyDown,
      placeholder,
      placeholderOptions = [],
      ...props
    },
    ref
  ) {
    const {
      plugin: placholderPlugin,
      onAddPlaceholder,
      onChangePlaceholder,
      onKeyDownPlaceholder,
      onHighlightOption,
      selectedIndex,
      search,
      target,
      values,
    } = usePlaceholderPlugin(placeholderOptions);
    const plugins = useConstant(() => [
      createReactPlugin(),
      createHistoryPlugin(),
      createParagraphPlugin(),
      createBoldPlugin(),
      createItalicPlugin(),
      createUnderlinePlugin(),
      createListPlugin(),
      createAutoformatPlugin({
        rules: [
          {
            mode: "block",
            type: "list-item",
            match: ["* ", "- "],
            preFormat: (editor: CustomEditor) => unwrapList(editor),
            format: (editor) => formatList(editor, "bulleted-list"),
          },
          {
            mode: "block",
            type: "list-item",
            match: ["1. ", "1) "],
            preFormat: (editor: CustomEditor) => unwrapList(editor),
            format: (editor) => formatList(editor, "numbered-list"),
          },
        ],
      }),
      placholderPlugin,
      createHeadingPlugin({ levels: 2 }),
      createLinkPlugin(),
      createExitBreakPlugin({
        rules: [
          {
            hotkey: "enter",
            query: {
              start: true,
              end: true,
              allow: ["heading", "subheading"],
            },
          },
        ],
      }),
    ]);
    const formControl = useFormControl({
      id,
      isDisabled,
      isInvalid,
      isRequired,
      isReadOnly,
    });
    const editorRef = useUpdatingRef(useStoreEditorState(id));

    useImperativeHandle(ref, () => ({
      focus: () => {
        ReactEditor.focus(editorRef.current!);
      },
    }));

    const { field: inputStyleConfig } = useMultiStyleConfig("Input", props);
    const inputStyles = {
      ...omit(inputStyleConfig as any, [
        "px",
        "pl",
        "pr",
        "paddingX",
        "paddingRight",
        "paddingLeft",
        "paddingY",
        "h",
        "height",
        "_focus",
        "_invalid",
      ]),
      _focusWithin: (inputStyleConfig as any)._focus,
      _invalid: (inputStyleConfig as any)._invalid,
    } as any;

    const isMenuOpen = Boolean(target && values.length > 0);
    const selected = isMenuOpen ? values[selectedIndex] : undefined;

    const handleChange = useCallback(
      (value: RichTextEditorValue) => {
        onChangePlaceholder(editorRef.current!);
        onChange(value);
      },
      [onChange, onChangePlaceholder]
    );

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDownPlaceholder(event, editorRef.current!);
        onKeyDown?.(event);
      },
      [onKeyDown, onKeyDownPlaceholder]
    );

    const placeholderMenuId = useId(undefined, "rte-placeholder-menu");
    const itemIdPrefix = useId(undefined, "rte-placeholder-menu-item");

    const editableProps = useMemo(
      () => ({
        readOnly: isDisabled,
        placeholder,
        style: {
          padding: "12px 16px",
          maxHeight: "250px",
          overflow: "auto",
        } as CSSProperties,
        onKeyDown: handleKeyDown,
        "aria-controls": placeholderMenuId,
        "aria-autocomplete": "list" as const,
        "aria-activedescendant": selected ? `${itemIdPrefix}-${selected.value}` : undefined,
      }),
      [isDisabled, placeholder, handleKeyDown, placeholderMenuId, itemIdPrefix, selected?.value]
    );
    const { referenceRef, popperRef, forceUpdate } = usePopper({
      placement: "bottom-start",
      enabled: isMenuOpen,
    });
    useEffect(() => {
      if (isMenuOpen && target) {
        reposition();
        document.addEventListener("scroll", reposition, true);
        return () => document.removeEventListener("scroll", reposition, true);
      }
      function reposition() {
        /**
         * The main idea of this function is to place the placeholders menu next to the #.
         * This function gets the node of the piece of text where the anchor is.
         * This node will always be a span.
         * We create a "fake" paragraph and we insert the text of the node but:
         * - We insert a span with all the previous text before and including the #.
         * - We add a marginLeft to this span to ensure it overlaps the text in the real editor.
         * - We add an empty span which we will use as the needle to position the menu
         * We insert this fake paragraph and we compute the boundingClientRect of the second
         * children which we will use to create a popper virtual element.
         */
        const { path, offset } = target!.anchor;
        const editor = editorRef.current!;
        const node = ReactEditor.toDOMNode(editor, getNode(editor, path)!);
        const parentRect = (node.parentNode! as HTMLElement).getBoundingClientRect();
        const fake = document.createElement("div");
        fake.style.visibility = "hidden";
        const prefix = document.createElement("span");
        const style = window.getComputedStyle(node.offsetParent!);
        prefix.style.marginLeft = `${node.offsetLeft - parseInt(style.paddingLeft)}px`;
        prefix.innerText = node.textContent!.slice(0, offset + 1);
        fake.appendChild(prefix);
        const _target = document.createElement("span");
        fake.appendChild(_target);
        fake.style.position = "fixed";
        fake.style.top = `${parentRect.top}px`;
        fake.style.left = `${parentRect.left}px`;
        fake.style.width = `${parentRect.width}px`;
        node.parentElement!.appendChild(fake);
        const rect = _target.getBoundingClientRect();
        node.parentElement!.removeChild(fake);
        referenceRef({ getBoundingClientRect: () => rect, contextElement: node });
        forceUpdate?.();
      }
    }, [isMenuOpen, target?.anchor.offset]);

    // for some reason frozen objects from the apollo cache cause issues when typing
    const initialValue = useConstant(() => JSON.parse(JSON.stringify(value)));

    return (
      <Box
        role="application"
        {...pick(formControl, [
          "id",
          "aria-invalid",
          "aria-required",
          "aria-readonly",
          "aria-describedby",
        ])}
        overflow="hidden"
        aria-disabled={formControl.disabled}
        {...inputStyles}
      >
        <Plate
          id={id}
          plugins={plugins}
          options={options}
          components={components}
          initialValue={initialValue}
          onChange={handleChange}
          editableProps={editableProps}
          renderEditable={renderEditable}
        >
          <RichTextEditorToolbar
            height="40px"
            isDisabled={formControl.disabled || formControl.readOnly}
            hasPlaceholders={placeholderOptions.length > 0}
          />
        </Plate>
        <Portal>
          <PlaceholderMenu
            ref={popperRef}
            menuId={placeholderMenuId}
            itemIdPrefix={itemIdPrefix}
            search={search}
            values={values}
            selectedIndex={selectedIndex}
            hidden={!isMenuOpen}
            onAddPlaceholder={(placeholder) => onAddPlaceholder(editorRef.current!, placeholder)}
            onHighlightOption={onHighlightOption}
            width="fit-content"
            position="relative"
            opacity={isMenuOpen ? 1 : 0}
          />
        </Portal>
      </Box>
    );
  }
);

function RenderElement({ attributes, nodeProps, styles, element, ...props }: any) {
  return <Text {...attributes} {...props} />;
}

function RenderLink({ attributes, nodeProps, styles, element, ...props }: any) {
  return (
    <Text
      as="a"
      cursor="text"
      target="_blank"
      href={element.url}
      color="purple.600"
      rel="noopener noreferrer"
      {...attributes}
      {...props}
    />
  );
}

function renderEditable(editable: ReactNode) {
  return (
    <Box
      sx={{
        '[contenteditable="false"]': {
          width: "auto !important",
        },
        "> div": {
          minHeight: "120px !important",
        },
      }}
    >
      {editable}
    </Box>
  );
}

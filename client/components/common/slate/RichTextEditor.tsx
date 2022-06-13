import { Box, Portal, Text, useFormControl, useId, useMultiStyleConfig } from "@chakra-ui/react";
import { PlaceholderMenu } from "@parallel/components/common/slate/PlaceholderMenu";
import { formatList } from "@parallel/utils/slate/formatList";
import {
  PlaceholderOption,
  usePlaceholderPlugin,
} from "@parallel/utils/slate/placeholders/PlaceholderPlugin";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { CustomEditor } from "@parallel/utils/slate/types";
import { useEditorPopper } from "@parallel/utils/slate/useEditorPopper";
import { useConstant } from "@parallel/utils/useConstant";
import { useFocus } from "@parallel/utils/useFocus";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { ValueProps } from "@parallel/utils/ValueProps";
import { createAutoformatPlugin } from "@udecode/plate-autoformat";
import {
  createBoldPlugin,
  createItalicPlugin,
  createUnderlinePlugin,
  MARK_BOLD,
  MARK_ITALIC,
  MARK_UNDERLINE,
} from "@udecode/plate-basic-marks";
import { createExitBreakPlugin } from "@udecode/plate-break";
import { withProps } from "@udecode/plate-common";
import {
  createHistoryPlugin,
  createPlugins,
  createReactPlugin,
  focusEditor,
  Plate,
  PlateProvider,
  usePlateEditorState,
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
import { CSSProperties, forwardRef, ReactNode, useImperativeHandle, useMemo } from "react";
import { omit, pick } from "remeda";
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

type RichTextPEditor = CustomEditor<RichTextEditorValue>;

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
  toolbarOpts?: {
    headingButton?: boolean;
    listButtons?: boolean;
  };
}

export interface RichTextEditorInstance {
  focus(): void;
}

const _RichTextEditor = forwardRef<RichTextEditorInstance, RichTextEditorProps>(
  function RichTextEditor(
    {
      id,
      value,
      onChange,
      isDisabled,
      isInvalid,
      isRequired,
      isReadOnly,
      placeholder,
      placeholderOptions = [],
      toolbarOpts,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) {
    const {
      plugin: placholderPlugin,
      onAddPlaceholder,
      onHighlightOption,
      index,
      search,
      target,
      values,
    } = usePlaceholderPlugin(placeholderOptions);
    const plugins = useConstant(() =>
      createPlugins<RichTextEditorValue, RichTextPEditor>(
        [
          createReactPlugin(),
          createHistoryPlugin(),
          createParagraphPlugin(),
          createBoldPlugin(),
          createItalicPlugin(),
          createUnderlinePlugin(),
          createListPlugin(),
          createAutoformatPlugin({
            options: {
              rules: [
                {
                  mode: "block",
                  type: "list-item",
                  match: ["* ", "- "],
                  preFormat: (editor: CustomEditor) => unwrapList(editor),
                  format: (editor: CustomEditor) => formatList(editor, "bulleted-list"),
                },
                {
                  mode: "block",
                  type: "list-item",
                  match: ["1. ", "1) "],
                  preFormat: (editor: CustomEditor) => unwrapList(editor),
                  format: (editor: CustomEditor) => formatList(editor, "numbered-list"),
                },
              ],
            },
          }),
          placholderPlugin as any,
          createHeadingPlugin({ options: { levels: 2 } }),
          createLinkPlugin(),
          createExitBreakPlugin({
            options: {
              rules: [
                {
                  hotkey: "enter",
                  query: { start: true, end: true, allow: ["heading", "subheading"] },
                },
              ],
            },
          }),
        ],
        {
          components,
          overrideByKey: {
            [ELEMENT_PARAGRAPH]: { type: "paragraph" },
            [ELEMENT_H1]: { type: "heading" },
            [ELEMENT_H2]: { type: "subheading" },
            [ELEMENT_OL]: { type: "numbered-list" },
            [ELEMENT_UL]: { type: "bulleted-list" },
            [ELEMENT_LI]: { type: "list-item" },
            [ELEMENT_LIC]: { type: "list-item-child" },
            [ELEMENT_LINK]: { type: "link" },
          },
        }
      )
    );
    const formControl = useFormControl({
      id,
      isDisabled,
      isInvalid,
      isRequired,
      isReadOnly,
    });
    const editorRef = useUpdatingRef(usePlateEditorState(id));

    useImperativeHandle(ref, () => ({
      focus: () => {
        focusEditor(editorRef.current!);
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

    const [isFocused, focusProps] = useFocus({ onBlur, onFocus });

    const isMenuOpen = Boolean(isFocused && target && values.length > 0);
    const selected = isMenuOpen ? values[index] : undefined;

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
        "aria-controls": placeholderMenuId,
        "aria-autocomplete": "list" as const,
        "aria-activedescendant": selected ? `${itemIdPrefix}-${selected.value}` : undefined,
        ...focusProps,
      }),
      [isDisabled, placeholder, placeholderMenuId, itemIdPrefix, selected?.value, focusProps]
    );

    const { popperRef } = useEditorPopper(editorRef.current!, target, {
      strategy: "fixed",
      placement: "bottom-start",
      enabled: isMenuOpen,
    });

    // for some reason frozen objects from the apollo cache cause issues when typing
    const initialValue = useConstant(() => JSON.parse(JSON.stringify(value)));

    const formControlProps = pick(formControl, [
      "id",
      "aria-invalid",
      "aria-required",
      "aria-readonly",
      "aria-describedby",
    ]);

    return (
      <Box
        role="application"
        overflow="hidden"
        aria-disabled={formControl.disabled}
        {...formControlProps}
        {...inputStyles}
      >
        <Plate<RichTextEditorValue, RichTextPEditor>
          id={id}
          plugins={plugins}
          initialValue={initialValue}
          onChange={!isDisabled ? onChange : undefined}
          editableProps={editableProps}
          renderEditable={renderEditable}
        >
          <RichTextEditorToolbar
            height="40px"
            isDisabled={formControl.disabled || formControl.readOnly}
            hasPlaceholders={placeholderOptions.length > 0}
            hasHeadingButton={toolbarOpts?.headingButton}
            hasListButtons={toolbarOpts?.listButtons}
          />
        </Plate>
        <Portal>
          <PlaceholderMenu
            ref={popperRef}
            isOpen={isMenuOpen}
            menuId={placeholderMenuId}
            itemIdPrefix={itemIdPrefix}
            search={search}
            values={values}
            highlightedIndex={index}
            onAddPlaceholder={(placeholder) => onAddPlaceholder(editorRef.current!, placeholder)}
            onHighlightOption={onHighlightOption}
            width="fit-content"
            position="relative"
          />
        </Portal>
      </Box>
    );
  }
);

export const RichTextEditor = forwardRef<RichTextEditorInstance, RichTextEditorProps>(
  (props, ref) => (
    <PlateProvider id={props.id}>
      <_RichTextEditor ref={ref} {...props} />
    </PlateProvider>
  )
);

function RenderElement({ attributes, nodeProps, styles, element, editor, ...props }: any) {
  return <Text {...attributes} {...props} />;
}

function RenderLink({ attributes, nodeProps, styles, element, editor, ...props }: any) {
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
        "[data-slate-placeholder]": {
          opacity: "1 !important",
          color: "gray.400",
        },
      }}
    >
      {editable}
    </Box>
  );
}

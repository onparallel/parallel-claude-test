import { Box, Text, useFormControl, useMultiStyleConfig } from "@chakra-ui/react";
import { formatList } from "@parallel/utils/slate/formatList";
import {
  createPlaceholderPlugin,
  PlaceholderCombobox,
  PlaceholderOption,
  PlaceholdersProvider,
  removePlaceholderInputElements,
} from "@parallel/utils/slate/PlaceholderPlugin";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { CustomEditor } from "@parallel/utils/slate/types";
import { structuredClone } from "@parallel/utils/structuredClone";
import { useConstant } from "@parallel/utils/useConstant";
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
import { createComboboxPlugin } from "@udecode/plate-combobox";
import {
  createHistoryPlugin,
  createPlugins,
  createReactPlugin,
  focusEditor,
  PlatePlugin,
  PlateProvider,
  withProps,
} from "@udecode/plate-common";
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
import { forwardRef, useImperativeHandle, useRef } from "react";
import { createPipe, identity, isDefined, omit, pick } from "remeda";
import { EditableProps } from "slate-react/dist/components/editable";
import { PlateWithEditorRef } from "./PlateWithEditorRef";
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
      placeholder,
      placeholderOptions,
      toolbarOpts,
      ...props
    },
    ref
  ) {
    const hasPlaceholders = isDefined(placeholderOptions) && placeholderOptions.length > 0;
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
          ...(hasPlaceholders
            ? ([createComboboxPlugin(), createPlaceholderPlugin()] as PlatePlugin<
                any,
                RichTextEditorValue,
                RichTextPEditor
              >[])
            : []),
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
    const editorRef = useRef<RichTextPEditor>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        focusEditor(editorRef.current!);
      },
    }));

    const { field: inputStyleConfig } = useMultiStyleConfig("Input", props);
    const inputStyles = {
      ...omit(inputStyleConfig as any, ["px", "h", "_focus", "_invalid"]),
      _focusWithin: (inputStyleConfig as any)._focus,
      _invalid: (inputStyleConfig as any)._invalid,
    } as any;

    const editableProps = {
      readOnly: isDisabled,
      "aria-disabled": formControl.disabled,
      placeholder,
    };

    const initialValue = useConstant(() => structuredClone(value));

    const formControlProps = pick(formControl, [
      "id",
      "aria-invalid",
      "aria-required",
      "aria-readonly",
      "aria-describedby",
    ]);

    return (
      <PlateProvider<RichTextEditorValue, RichTextPEditor>
        plugins={plugins}
        initialValue={initialValue}
        onChange={
          !isDisabled
            ? createPipe(hasPlaceholders ? removePlaceholderInputElements : identity, onChange)
            : undefined
        }
      >
        <Box
          role="application"
          overflow="hidden"
          aria-disabled={formControl.disabled}
          {...formControlProps}
          {...inputStyles}
          {...props}
          sx={{
            '[contenteditable="false"]': {
              width: "auto !important",
            },
            '> [role="textbox"]': {
              minHeight: "120px !important",
              paddingX: 4,
              paddingY: 3,
              maxHeight: "250px",
              overflow: "auto",
            },
            "[data-slate-placeholder]": {
              opacity: "1 !important",
              color: "gray.400",
            },
          }}
        >
          <RichTextEditorToolbar
            height="40px"
            isDisabled={formControl.disabled || formControl.readOnly}
            hasPlaceholders={hasPlaceholders}
            hasHeadingButton={toolbarOpts?.headingButton}
            hasListButtons={toolbarOpts?.listButtons}
          />
          <PlaceholdersProvider placeholders={placeholderOptions ?? []}>
            <PlateWithEditorRef<RichTextEditorValue, RichTextPEditor>
              editorRef={editorRef}
              editableProps={editableProps}
            >
              {hasPlaceholders ? <PlaceholderCombobox placeholders={placeholderOptions} /> : null}
            </PlateWithEditorRef>
          </PlaceholdersProvider>
        </Box>
      </PlateProvider>
    );
  }
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
      color="primary.600"
      rel="noopener noreferrer"
      {...attributes}
      {...props}
    />
  );
}

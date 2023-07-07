import { Box, Text, useFormControl, useMultiStyleConfig } from "@chakra-ui/react";
import {
  createMentionPlugin,
  MentionCombobox,
  MentionComboboxProps,
  MentionElement,
  MentionInputElement,
  MENTION_TYPE,
} from "@parallel/utils/slate/MentionPlugin";
import { isEmptyParagraph } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { CustomEditor, SlateElement, SlateText } from "@parallel/utils/slate/types";
import { structuredClone } from "@parallel/utils/structuredClone";
import { Maybe } from "@parallel/utils/types";
import { useConstant } from "@parallel/utils/useConstant";
import { ValueProps } from "@parallel/utils/ValueProps";
import { createComboboxPlugin } from "@udecode/plate-combobox";
import {
  createHistoryPlugin,
  createPlugins,
  createReactPlugin,
  focusEditor,
  getEndPoint,
  PlatePluginComponent,
  PlateProvider,
  withProps,
} from "@udecode/plate-common";
import { ELEMENT_MENTION_INPUT } from "@udecode/plate-mention";
import { createParagraphPlugin, ELEMENT_PARAGRAPH } from "@udecode/plate-paragraph";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { isDefined, omit, pick } from "remeda";
import { Editor, Transforms } from "slate";
import { EditableProps } from "slate-react/dist/components/editable";
import { PlateWithEditorRef } from "./PlateWithEditorRef";

const components = {
  [ELEMENT_PARAGRAPH]: withProps(RenderElement, { as: "p" }),
} as Record<string, PlatePluginComponent>;

export type CommentEditorValue = CommentEditorBlock[];
interface CommentEditorBlock extends SlateElement<"paragraph", CommentEditorBlockContent> {}
interface CommentEditorText extends SlateText {}
type CommentEditorBlockContent = CommentEditorText | MentionElement | MentionInputElement;

type CommentPEditor = CustomEditor<CommentEditorValue>;

export function isEmptyCommentEditorValue(content: Maybe<CommentEditorValue>) {
  return isDefined(content) && content.every((element) => isEmptyParagraph(element));
}

export function emptyCommentEditorValue(): CommentEditorValue {
  return [{ type: "paragraph", children: [{ text: "" }] }];
}

/**
 * transforms mention_input elements into text element
 */
export function removeMentionInputElements(content: CommentEditorValue) {
  return content.map((block) => {
    if (!("text" in block.children[0])) {
      throw new Error("First element in paragraph must be text");
    }
    let currentText: CommentEditorText | null = {
      text: (block.children[0] as CommentEditorText).text,
    };
    const children: (CommentEditorText | MentionElement)[] = [currentText];
    for (let i = 1; i < block.children.length; ++i) {
      const element = block.children[i];
      if (element.type === MENTION_TYPE) {
        children.push(element);
        currentText = null;
      } else {
        if (currentText === null) {
          currentText = { text: "" };
          children.push(currentText);
        }
        if (element.type === ELEMENT_MENTION_INPUT) {
          currentText.text += "@" + (element as MentionInputElement).children[0].text;
        } else if ("text" in element) {
          currentText.text += (element as CommentEditorText).text;
        }
      }
    }
    return { type: "paragraph", children };
  });
}

export interface CommentEditorProps
  extends ValueProps<CommentEditorValue, false>,
    Omit<EditableProps, "value" | "onChange">,
    Pick<MentionComboboxProps, "defaultMentionables">,
    Partial<Pick<MentionComboboxProps, "onSearchMentionables">> {
  placeholder?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
}

export interface CommentEditorInstance {
  clear(): void;
  focus(): void;
}

export const CommentEditor = forwardRef<CommentEditorInstance, CommentEditorProps>(
  function CommentEditor(
    {
      id,
      placeholder,
      value,
      onChange,
      isDisabled,
      isInvalid,
      isRequired,
      isReadOnly,
      defaultMentionables,
      onSearchMentionables,
      ...props
    },
    ref,
  ) {
    const plugins = useMemo(
      () =>
        createPlugins<CommentEditorValue, CommentPEditor>(
          [
            createReactPlugin(),
            createHistoryPlugin(),
            createParagraphPlugin(),
            createComboboxPlugin(),
            ...(isDefined(onSearchMentionables)
              ? [createMentionPlugin<CommentEditorValue, CommentPEditor>()]
              : []),
          ],
          {
            components,
            overrideByKey: {
              [ELEMENT_PARAGRAPH]: { type: "paragraph" },
            },
          },
        ),
      [isDefined(onSearchMentionables)],
    );
    const formControl = useFormControl({
      id,
      isDisabled,
      isInvalid,
      isRequired,
      isReadOnly,
    });
    const editorRef = useRef<CommentPEditor>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        focusEditor(editorRef.current!, getEndPoint(editorRef.current!, []));
      },
      clear: () => {
        const editor = editorRef.current! as any;
        Transforms.delete(editor, {
          at: {
            anchor: Editor.start(editor, []),
            focus: Editor.end(editor, []),
          },
        });
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
        "bg",
      ]),
      backgroundColor: "white",
      _focusWithin: (inputStyleConfig as any)._focusVisible,
      _invalid: (inputStyleConfig as any)._invalid,
    } as any;

    const editableProps = {
      readOnly: formControl.disabled,
      "aria-disabled": formControl.disabled,
      placeholder,
      ...props,
    };

    // for some reason frozen objects from the apollo cache cause issues when typing
    const initialValue = useConstant(() => structuredClone(value));

    return (
      <PlateProvider<CommentEditorValue, CommentPEditor>
        id={formControl.id}
        plugins={plugins}
        initialValue={initialValue}
        onChange={!isDisabled ? onChange : undefined}
      >
        <Box
          overflow="hidden"
          aria-disabled={formControl.disabled}
          {...(pick(formControl, [
            "aria-invalid",
            "aria-required",
            "aria-readonly",
            "aria-describedby",
          ]) as any)}
          {...inputStyles}
          sx={{
            "[data-slate-editor]": {
              outline: "none",
              minHeight: "40px !important",
              paddingX: 3,
              paddingY: 2,
              maxHeight: "250px",
              overflow: "auto",
            },
            "[data-slate-placeholder]": {
              top: "unset !important",
              width: "auto !important",
              opacity: "1 !important",
              color: "gray.400",
            },
          }}
        >
          <PlateWithEditorRef<CommentEditorValue, CommentPEditor>
            id={formControl.id}
            editorRef={editorRef}
            editableProps={editableProps}
          >
            {onSearchMentionables ? (
              <MentionCombobox
                defaultMentionables={defaultMentionables}
                onSearchMentionables={onSearchMentionables}
              />
            ) : null}
          </PlateWithEditorRef>
        </Box>
      </PlateProvider>
    );
  },
);

function RenderElement({ attributes, nodeProps, styles, element, editor, ...props }: any) {
  return <Text {...attributes} {...props} />;
}

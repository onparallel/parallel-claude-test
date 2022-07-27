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
import { Maybe } from "@parallel/utils/types";
import { useConstant } from "@parallel/utils/useConstant";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { ValueProps } from "@parallel/utils/ValueProps";
import { createComboboxPlugin } from "@udecode/plate-combobox";
import { withProps } from "@udecode/plate-common";
import {
  createHistoryPlugin,
  createPlugins,
  createReactPlugin,
  focusEditor,
  getEndPoint,
  Plate,
  PlateProvider,
  usePlateEditorState,
} from "@udecode/plate-core";
import { ELEMENT_MENTION_INPUT } from "@udecode/plate-mention";
import { createParagraphPlugin, ELEMENT_PARAGRAPH } from "@udecode/plate-paragraph";
import { CSSProperties, forwardRef, ReactNode, useImperativeHandle, useMemo } from "react";
import { isDefined, omit, pick } from "remeda";
import { Editor, Transforms } from "slate";
import { EditableProps } from "slate-react/dist/components/editable";

const components = {
  [ELEMENT_PARAGRAPH]: withProps(RenderElement, { as: "p" }),
  [ELEMENT_MENTION_INPUT]: MentionInputElement,
};

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
    Omit<EditableProps, "value" | "onChange"> {
  // we need an id to pass it to the Plate element
  id: string;
  placeholder?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
  onSearchMentionables?: MentionComboboxProps["onSearchMentionables"];
}

export interface CommentEditorInstance {
  clear(): void;
  focus(): void;
}

const _CommentEditor = forwardRef<CommentEditorInstance, CommentEditorProps>(function CommentEditor(
  {
    id,
    placeholder,
    value,
    onChange,
    isDisabled,
    isInvalid,
    isRequired,
    isReadOnly,
    onSearchMentionables,
    ...props
  },
  ref
) {
  // TODO remove this line to enable mentions
  onSearchMentionables = undefined;
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
        }
      ),
    [isDefined(onSearchMentionables)]
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
    _focusWithin: (inputStyleConfig as any)._focus,
    _invalid: (inputStyleConfig as any)._invalid,
  } as any;

  const editableProps = {
    readOnly: isDisabled,
    placeholder,
    style: {
      padding: "8px 12px",
      maxHeight: "250px",
      overflow: "auto",
    } as CSSProperties,
    ...props,
  };

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
      <Plate<CommentEditorValue, CommentPEditor>
        id={id}
        plugins={plugins}
        initialValue={initialValue}
        onChange={!isDisabled ? onChange : undefined}
        editableProps={editableProps}
        renderEditable={renderEditable}
      >
        {onSearchMentionables ? (
          <MentionCombobox onSearchMentionables={onSearchMentionables} />
        ) : null}
      </Plate>
    </Box>
  );
});

export const CommentEditor = forwardRef<CommentEditorInstance, CommentEditorProps>((props, ref) => (
  <PlateProvider id={props.id}>
    <_CommentEditor ref={ref} {...props} />
  </PlateProvider>
));

function RenderElement({ attributes, nodeProps, styles, element, editor, ...props }: any) {
  return <Text {...attributes} {...props} />;
}

function renderEditable(editable: ReactNode) {
  return (
    <Box
      sx={{
        '[contenteditable="false"]': {
          width: "auto !important",
        },
        "> div": {
          minHeight: "40px !important",
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

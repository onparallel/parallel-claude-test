import { gql } from "@apollo/client";
import { Box, Text } from "@chakra-ui/react";
import {
  PetitionFieldOptionsListEditor_PetitionFieldFragment,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { getMinMaxCheckboxLimit } from "@parallel/utils/petitionFields";
import { isEmptyParagraph } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { SlateElement, SlateText } from "@parallel/utils/slate/types";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { isSelectionExpanded } from "@udecode/plate-common";
import {
  forwardRef,
  KeyboardEvent,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { FormattedMessage } from "react-intl";
import { pipe } from "remeda";
import { shallowEqualArrays } from "shallow-equal";
import { createEditor, Editor, Point, Transforms } from "slate";
import { withHistory } from "slate-history";
import {
  Editable,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  withReact,
} from "slate-react";
import { EditableProps } from "slate-react/dist/components/editable";

type PetitionFieldOptionsListEditorValue = PetitionFieldOptionsListEditorBlock[];

interface PetitionFieldOptionsListEditorBlock extends SlateElement<"paragraph", SlateText> {}

export interface PetitionFieldOptionsListEditorProps extends EditableProps {
  field: PetitionFieldOptionsListEditor_PetitionFieldFragment;
  showError: boolean;
  onFieldEdit: (data: UpdatePetitionFieldInput) => void;
  onFocusNextField: () => void;
  onFocusDescription: () => void;
  isReadOnly?: boolean;
}

export type PetitionFieldOptionsListEditorRef = {
  focus: (position?: "START" | "END") => void;
};

function valuesToSlateNodes(values: string[]): PetitionFieldOptionsListEditorValue {
  return (values.length ? values : [""]).map((option) => ({
    type: "paragraph",
    children: [{ text: option }],
  }));
}

export const PetitionFieldOptionsListEditor = Object.assign(
  forwardRef<PetitionFieldOptionsListEditorRef, PetitionFieldOptionsListEditorProps>(
    function PetitionFieldOptionsListEditor(
      { field, showError, onFieldEdit, onFocusNextField, onFocusDescription, isReadOnly, ...props },
      ref
    ) {
      const editor = useMemo(() => pipe(createEditor(), withHistory, withReact), []);
      const editorRef = useUpdatingRef(editor);
      const [value, onChange] = useState(valuesToSlateNodes(field.options.values ?? []));
      useImperativeHandle(
        ref,
        () =>
          ({
            focus: (position) => {
              const editor = editorRef.current;
              ReactEditor.focus(editor);
              if (position) {
                Transforms.select(
                  editor,
                  position === "START" ? Editor.start(editor, []) : Editor.end(editor, [])
                );
              }
            },
          } as PetitionFieldOptionsListEditorRef)
      );

      const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
          if (editor.selection && isSelectionExpanded(editor)) {
            return;
          }
          const anchor = editor.selection?.anchor;
          if (!anchor) {
            return;
          }

          switch (event.key) {
            case "ArrowDown":
              const atEnd = Point.equals(anchor, Editor.end(editor, []));
              if (atEnd) {
                onFocusNextField();
              }
              break;
            case "ArrowUp":
              const atStart = Point.equals(anchor, Editor.start(editor, []));
              if (atStart) {
                onFocusDescription();
              }
              break;
          }
        },
        [editor, onFocusNextField, onFocusDescription]
      );

      const handleBlur = useCallback(() => {
        const values = value
          .map((n) => (n.children as any)[0].text.trim())
          .filter((option) => option !== "");
        if (!shallowEqualArrays(field.options.values, values)) {
          if (field.type === "CHECKBOX") {
            const [min, max] = getMinMaxCheckboxLimit({
              min: field.options.limit.min || 0,
              max: field.options.limit.max || 1,
              valuesLength: values.length || 1,
              optional: field.optional,
            });
            onFieldEdit({
              options: {
                ...field.options,
                limit: {
                  ...field.options.limit,
                  min,
                  max,
                },
                values,
              },
            });
          } else {
            onFieldEdit({ options: { ...field.options, values } });
          }
        }
      }, [field.options.values, value, onFieldEdit, onChange]);

      return isReadOnly ? (
        <Box textStyle="muted">
          {field.options.values.map((value: string, index: number) => {
            return (
              <Text
                key={index}
                fontSize="sm"
                marginY={0}
                _before={{ content: "'-'", marginRight: 1 }}
              >
                {value}
              </Text>
            );
          })}
        </Box>
      ) : (
        <Slate editor={editor} value={value} onChange={onChange as any}>
          <Box maxHeight="200px" overflow="auto" fontSize="sm">
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              {...props}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />
          </Box>
        </Slate>
      );
    }
  ),

  {
    fragments: {
      PetitionField: gql`
        fragment PetitionFieldOptionsListEditor_PetitionField on PetitionField {
          id
          type
          optional
          options
        }
      `,
    },
  }
);

function renderElement({ attributes, children, element }: RenderElementProps) {
  const isEmpty = isEmptyParagraph(element as PetitionFieldOptionsListEditorBlock);
  return (
    <Text
      as="div"
      _before={{ content: "'-'", marginRight: 1 }}
      color={isEmpty ? "gray.400" : undefined}
      {...attributes}
    >
      {children}
    </Text>
  );
}

function renderLeaf({ attributes, children, leaf }: RenderLeafProps) {
  const isEmpty = !leaf.text;
  return (
    <Text as="span" {...attributes}>
      {isEmpty ? (
        <Text
          as="span"
          display="inline-block"
          whiteSpace="nowrap"
          userSelect="none"
          pointerEvents="none"
          contentEditable={false}
          width={0}
        >
          <FormattedMessage id="generic.choice" defaultMessage="Choice" />
        </Text>
      ) : null}
      {children}
    </Text>
  );
}

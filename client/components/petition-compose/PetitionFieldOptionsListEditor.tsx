import { gql } from "@apollo/client";
import { Box, Text } from "@chakra-ui/react";
import {
  PetitionFieldOptionsListEditor_PetitionFieldFragment,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { assignRef } from "@parallel/utils/assignRef";
import { getMinMaxCheckboxLimit } from "@parallel/utils/petitionFields";
import { isEmptyParagraph } from "@parallel/utils/slate/isEmptyRTEValue";
import { ParagraphElement } from "@parallel/utils/slate/types";
import { isSelectionExpanded, pipe } from "@udecode/slate-plugins";
import {
  forwardRef,
  KeyboardEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { FormattedMessage } from "react-intl";
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

export interface PetitionFieldOptionsListEditorProps extends EditableProps {
  field: PetitionFieldOptionsListEditor_PetitionFieldFragment;
  showError: boolean;
  onFieldEdit: (data: UpdatePetitionFieldInput) => void;
  onFocusNextField: () => void;
  onFocusDescription: () => void;
}

function renderElement({ attributes, children, element }: RenderElementProps) {
  const isEmpty = isEmptyParagraph(element);
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

export type PetitionFieldOptionsListEditorRef = {
  focus: (position?: "START" | "END") => void;
  editor: Editor;
};

function valuesToSlateNodes(values: string[]): ParagraphElement[] {
  return (values.length ? values : [""]).map((option) => ({
    type: "paragraph",
    children: [{ text: option }],
  }));
}

export const PetitionFieldOptionsListEditor = Object.assign(
  forwardRef<
    PetitionFieldOptionsListEditorRef,
    PetitionFieldOptionsListEditorProps
  >(function PetitionFieldOptionsListEditor(
    {
      field,
      showError,
      onFieldEdit,
      onFocusNextField,
      onFocusDescription,
      ...props
    },
    ref
  ) {
    const editor = useMemo(
      () => pipe(createEditor(), withHistory, withReact),
      []
    );
    const [value, onChange] = useState<ParagraphElement[]>(
      valuesToSlateNodes(field.options.values ?? [])
    );
    assignRef(
      ref,
      useMemo(
        () =>
          ({
            focus: (position) => {
              ReactEditor.focus(editor);
              if (position) {
                Transforms.select(
                  editor,
                  position === "START"
                    ? Editor.start(editor, [])
                    : Editor.end(editor, [])
                );
              }
            },
            editor,
          } as PetitionFieldOptionsListEditorRef),
        [editor]
      )
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
    return (
      <Slate editor={editor} value={value} onChange={onChange as any}>
        <Box maxHeight="200px" overflow="auto" fontSize="sm">
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        </Box>
      </Slate>
    );
  }),

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

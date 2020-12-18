import { gql } from "@apollo/client";
import { Box, Text } from "@chakra-ui/react";
import {
  SelectTypeFieldOptions_PetitionFieldFragment,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { pipe } from "@udecode/slate-plugins";
import { forwardRef, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { createEditor, Editor, Node, Transforms } from "slate";
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

export interface SelectTypeFieldOptionsProps extends EditableProps {
  field: SelectTypeFieldOptions_PetitionFieldFragment;
  showError: boolean;
  onFieldEdit: (data: UpdatePetitionFieldInput) => void;
}

function renderElement({ attributes, children, element }: RenderElementProps) {
  const isEmpty = !element.children[0].text;
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

export type SelectTypeFieldOptionsRef = {
  focus: (position?: "START" | "END") => void;
  editor: Editor;
};

function valuesToSlateNodes(values: string[]) {
  return (values.length ? values : [""]).map((option) => ({
    children: [{ text: option }],
  }));
}

export const SelectTypeFieldOptions = Object.assign(
  forwardRef<SelectTypeFieldOptionsRef, SelectTypeFieldOptionsProps>(
    function SelectTypeFieldOptions(
      { field, showError, onFieldEdit, ...props },
      ref
    ) {
      const editor = useMemo(
        () => pipe(createEditor(), withHistory, withReact),
        []
      );
      const [value, onChange] = useState<Node[]>(
        valuesToSlateNodes(field.options?.values ?? [])
      );
      const _ref = useMemo(
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
          } as SelectTypeFieldOptionsRef),
        [editor]
      );
      if (typeof ref === "function") {
        ref(_ref);
      } else if (ref) {
        ref.current = _ref;
      }
      return (
        <Slate editor={editor} value={value} onChange={onChange}>
          <Box maxHeight="200px" overflow="auto" fontSize="sm">
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              onBlur={() => {
                const values = value
                  .map((n) => (n.children as any)[0].text.trim())
                  .filter((option) => option !== "");
                onFieldEdit({ options: { values } });
                onChange(valuesToSlateNodes(values));
              }}
              {...props}
            />
          </Box>
        </Slate>
      );
    }
  ),

  {
    fragments: {
      PetitionField: gql`
        fragment SelectTypeFieldOptions_PetitionField on PetitionField {
          id
          options
        }
      `,
    },
  }
);

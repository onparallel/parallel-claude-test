import { gql } from "@apollo/client";
import { Box, Text } from "@chakra-ui/core";
import {
  SelectTypeFieldOptions_PetitionFieldFragment,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { pipe } from "@udecode/slate-plugins";
import { forwardRef, PropsWithRef, useMemo, useState } from "react";
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

export type SelectTypeFieldOptionsProps = {
  field: SelectTypeFieldOptions_PetitionFieldFragment;
  showError: boolean;
  onFieldEdit: (data: UpdatePetitionFieldInput) => void;
};

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
  focus: (position: "START" | "END") => void;
};

export const SelectTypeFieldOptions = Object.assign(
  forwardRef<SelectTypeFieldOptionsRef, SelectTypeFieldOptionsProps>(
    function SelectTypeFieldOptions({ field, showError, onFieldEdit }, ref) {
      const editor = useMemo(
        () => pipe(createEditor(), withHistory, withReact),
        []
      );
      const [value, onChange] = useState<Node[]>(
        ((field.options?.values?.length
          ? field.options?.values
          : [""]) as string[]).map((option) => ({
          children: [{ text: option }],
        }))
      );
      const _ref = useMemo(
        () =>
          ({
            focus: (position) => {
              ReactEditor.focus(editor);
              Transforms.select(
                editor,
                position === "START"
                  ? Editor.start(editor, [])
                  : Editor.end(editor, [])
              );
            },
          } as SelectTypeFieldOptionsRef),
        [editor]
      );
      if (typeof ref === "function") {
        ref(_ref);
      } else if (ref) {
        ref.current = _ref;
      }
      return (
        <Slate
          editor={editor}
          value={value}
          onChange={(value: Node[]) => {
            console.log(editor.selection);
            onChange(value);
          }}
        >
          <Box maxHeight="200px" overflow="auto" fontSize="sm">
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              onBlur={() => {
                onFieldEdit({
                  options: {
                    values: value
                      .map((n) => (n.children as any)[0].text.trim())
                      .filter((option) => option !== ""),
                  },
                });
              }}
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

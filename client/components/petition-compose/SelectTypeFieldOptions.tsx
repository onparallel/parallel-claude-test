import { gql } from "@apollo/client";
import { Box, Text } from "@chakra-ui/core";
import {
  SelectTypeFieldOptions_PetitionFieldFragment,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { pipe } from "@udecode/slate-plugins";
import { useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { createEditor, Node } from "slate";
import { withHistory } from "slate-history";
import {
  Editable,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  withReact,
} from "slate-react";

type SelectTypeFieldOptionsProps = {
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

export function SelectTypeFieldOptions({
  field,
  showError,
  onFieldEdit,
}: SelectTypeFieldOptionsProps) {
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
  return (
    <Slate editor={editor} value={value} onChange={onChange as any}>
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

SelectTypeFieldOptions.fragments = {
  PetitionField: gql`
    fragment SelectTypeFieldOptions_PetitionField on PetitionField {
      id
      options
    }
  `,
};

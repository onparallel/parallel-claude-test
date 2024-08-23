import { gql } from "@apollo/client";
import { Box, List, ListItem, Text } from "@chakra-ui/react";
import { SettingsIcon } from "@parallel/chakra/icons";
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
  KeyboardEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, pipe } from "remeda";
import { shallowEqualArrays } from "shallow-equal";
import { Editor, Point, Transforms, createEditor } from "slate";
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
import { getStandardListLabel } from "../common/StandardListSelect";

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

export interface PetitionFieldOptionsListEditorRef {
  focus: (position?: "START" | "END") => void;
}

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
      ref,
    ) {
      const intl = useIntl();
      const editor = useMemo(() => pipe(createEditor(), withHistory, withReact), []);
      const editorRef = useUpdatingRef(editor);
      const [value, onChange] = useState(valuesToSlateNodes(field.options.values ?? []));
      const currentValues = useRef(field.options.values);

      const hasLabels =
        ["SELECT", "CHECKBOX"].includes(field.type) &&
        isNonNullish(field.options.labels) &&
        field.options.values.length === field.options.labels.length;

      useEffect(() => {
        if (!hasLabels && !shallowEqualArrays(field.options.values, currentValues.current)) {
          const newSlateValue = valuesToSlateNodes(field.options.values);
          onChange(newSlateValue);

          const currentEditor = editorRef.current;

          Editor.withoutNormalizing(currentEditor, () => {
            // Select all the nodes
            Transforms.select(currentEditor, {
              anchor: Editor.start(currentEditor, []),
              focus: Editor.end(currentEditor, []),
            });
            // Deletes all the selection and the empty node that creates by default
            Transforms.delete(currentEditor);
            Transforms.removeNodes(currentEditor, { at: [0] });

            // Insert new values as nodes
            Transforms.insertNodes(currentEditor, newSlateValue, { at: [0] });
          });

          currentValues.current = field.options.values;
        }
      }, [field.options.values.join(","), hasLabels]);

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
                  position === "START" ? Editor.start(editor, []) : Editor.end(editor, []),
                );
              }
            },
          }) as PetitionFieldOptionsListEditorRef,
      );

      const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
          if (editor.selection && isSelectionExpanded(editor as any)) {
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
        [editor, onFocusNextField, onFocusDescription],
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
            onFieldEdit({ options: { values } });
          }
          currentValues.current = values;
        }
      }, [field.options.values, value, onFieldEdit, onChange]);

      const validOptions = value.filter((v) => !isEmptyParagraph(v));
      const isInvalid =
        field.type === "SELECT" ? validOptions.length < 2 : validOptions.length === 0;

      const standardList =
        field.type === "SELECT" && field.options.standardList ? field.options.standardList : null;

      return field.isLinkedToProfileTypeField || isReadOnly || hasLabels || standardList ? (
        <>
          {standardList && !field.isLinkedToProfileTypeField ? (
            <Text fontSize="sm">
              <FormattedMessage
                id="component.petition-field-options-list-editor.settings-standard-options-description"
                defaultMessage='Standard options from <b>"{standardList}"</b>. Edit from the field settings.'
                values={{ standardList: getStandardListLabel(standardList, intl) }}
              />
              <Text as="span" marginStart={1} position="relative" top="-1px">
                (<SettingsIcon />)
              </Text>
            </Text>
          ) : hasLabels && !field.isLinkedToProfileTypeField ? (
            <Text fontSize="sm">
              <FormattedMessage
                id="component.petition-field-options-list-editor.settings-imported-options-description"
                defaultMessage="Options imported with internal values. To edit, import an Excel file from field settings."
              />
              <Text as="span" marginStart={1} position="relative" top="-1px">
                (<SettingsIcon />)
              </Text>
            </Text>
          ) : null}

          <List textStyle="muted" maxHeight="200px" overflow="auto" fontSize="sm">
            {field.options.values.map((value: string, index: number) => {
              const label = field.options.labels?.[index];
              return (
                <ListItem key={index} _before={{ content: "'-'", marginEnd: 1 }}>
                  {value}
                  {isNonNullish(label) ? `: ${label}` : null}
                </ListItem>
              );
            })}
          </List>
        </>
      ) : (
        <Slate editor={editor} initialValue={value} onChange={onChange as any}>
          <Box maxHeight="200px" overflow="auto" fontSize="sm">
            <Editable
              style={{ outline: "none" }}
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              {...props}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              as="ul"
              aria-invalid={(showError && isInvalid) || undefined}
            />
          </Box>
        </Slate>
      );
    },
  ),

  {
    fragments: {
      PetitionField: gql`
        fragment PetitionFieldOptionsListEditor_PetitionField on PetitionField {
          id
          type
          optional
          options
          isLinkedToProfileTypeField
        }
      `,
    },
  },
);

function renderElement({ attributes, children, element }: RenderElementProps) {
  return (
    <Text
      as="li"
      _before={{ content: "'-'", marginEnd: 1 }}
      sx={{
        "[aria-invalid] &": {
          color: "red.500",
        },
      }}
      wordBreak="break-word"
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
          opacity={0.3}
          width={0}
        >
          <FormattedMessage id="generic.choice" defaultMessage="Choice" />
        </Text>
      ) : null}
      {children}
    </Text>
  );
}

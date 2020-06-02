import { Box, Flex, Heading, Text } from "@chakra-ui/core";
import { Card, CardProps } from "@parallel/components/common/Card";
import { AddFieldPopover } from "@parallel/components/petition-compose/AddFieldPopover";
import { PetitionComposeField } from "@parallel/components/petition-compose/PetitionComposeField";
import {
  PetitionComposeField_PetitionFieldFragment,
  PetitionFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { gql } from "apollo-boost";
import {
  KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { FormattedMessage } from "react-intl";
import { indexBy } from "remeda";

type FieldSelection = PetitionComposeField_PetitionFieldFragment;

type FieldsReducerState = {
  fieldsById: { [id: string]: FieldSelection };
  fieldIds: string[];
};

function fieldsReducer(
  state: FieldsReducerState,
  action:
    | { type: "RESET"; fields: FieldSelection[] }
    | { type: "SORT"; fieldIds: string[] }
): FieldsReducerState {
  switch (action.type) {
    case "RESET":
      return reset(action.fields, state);
    case "SORT":
      return {
        ...state,
        fieldIds: action.fieldIds,
      };
  }
}

function reset(
  fields: FieldSelection[],
  prev?: FieldsReducerState
): FieldsReducerState {
  return {
    fieldsById: indexBy(fields, (f) => f.id),
    fieldIds: fields.map((f) => f.id),
  };
}

export type PetitionComposeFieldListProps = {
  active: Maybe<string>;
  fields: FieldSelection[];
  showErrors: boolean;
  onUpdateFieldPositions: (fieldIds: string[]) => void;
  onFieldSettingsClick: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onFieldFocus: (fieldId: string) => void;
  onAddField: (type: PetitionFieldType) => void;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => void;
} & CardProps;

export const PetitionComposeFieldList = Object.assign(
  memo(function PetitionComposeFieldList({
    active,
    fields,
    showErrors,
    onUpdateFieldPositions,
    onFieldSettingsClick,
    onDeleteField,
    onFieldFocus,
    onAddField,
    onFieldEdit,
    ...props
  }: PetitionComposeFieldListProps) {
    const [{ fieldsById, fieldIds }, dispatch] = useReducer(
      fieldsReducer,
      fields,
      reset
    );
    useEffect(() => dispatch({ type: "RESET", fields: fields }), [fields]);

    const addFieldRef = useRef<HTMLButtonElement>(null);

    const handleFieldMove = useCallback(
      async function (
        dragIndex: number,
        hoverIndex: number,
        dropped?: boolean
      ) {
        const newFieldIds = [...fieldIds];
        const [field] = newFieldIds.splice(dragIndex, 1);
        newFieldIds.splice(hoverIndex, 0, field);
        dispatch({ type: "SORT", fieldIds: newFieldIds });
        if (dropped) {
          onUpdateFieldPositions(newFieldIds);
        }
      },
      [fieldIds.join(",")]
    );

    const focusTitle = useCallback((fieldId: string) => {
      const title = document.querySelector<HTMLElement>(
        `#field-title-${fieldId}`
      );
      title?.focus();
    }, []);

    const focusDescription = useCallback((fieldId: string) => {
      const title = document.querySelector<HTMLElement>(
        `#field-description-${fieldId}`
      );
      title?.focus();
    }, []);

    // Memoize field callbacks
    const handleFocus = useMemoFactory(
      (fieldId: string) => () => onFieldFocus(fieldId),
      [onFieldFocus]
    );
    const handleSettingsClick = useMemoFactory(
      (fieldId: string) => () => onFieldSettingsClick(fieldId),
      [onFieldSettingsClick]
    );
    const handleDeleteClick = useMemoFactory(
      (fieldId: string) => () => onDeleteField(fieldId),
      [onDeleteField]
    );
    const handleFieldEdit = useMemoFactory(
      (fieldId: string) => (data: UpdatePetitionFieldInput) =>
        onFieldEdit(fieldId, data),
      [onFieldEdit]
    );

    const handleTitleKeyUp = useMemoFactory(
      (fieldId: string) => (event: KeyboardEvent<any>) => {
        const index = fieldIds.indexOf(fieldId);
        switch (event.key) {
          case "ArrowDown":
            focusDescription(fieldId);
            break;
          case "ArrowUp":
            if (index > 0) {
              focusDescription(fieldIds[index - 1]);
            }
            break;
          case "Enter":
            addFieldRef.current!.click();
            break;
        }
      },
      [fieldIds.toString()]
    );

    const handleDescriptionKeyUp = useMemoFactory(
      (fieldId: string) => (event: KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = event.target as HTMLTextAreaElement;
        const totalLines = (textarea.value.match(/\n/g) ?? []).length + 1;
        const beforeCursor = textarea.value.substr(0, textarea.selectionStart);
        const currentLine = (beforeCursor.match(/\n/g) ?? []).length;
        const index = fieldIds.indexOf(fieldId);
        switch (event.key) {
          case "ArrowDown":
            if (index < fieldIds.length - 1 && currentLine === totalLines - 1) {
              focusTitle(fieldIds[index + 1]);
            }
            break;
          case "ArrowUp":
            if (currentLine === 0) {
              focusTitle(fieldId);
            }
            break;
        }
      },
      [fieldIds.toString()]
    );

    return (
      <Card id="petition-fields" {...props}>
        {fieldIds.length ? (
          <>
            <Box padding={4}>
              <Heading as="h2" size="sm">
                <FormattedMessage
                  id="petition.fields-header"
                  defaultMessage="This is the information that you need"
                />
              </Heading>
            </Box>
            {fieldIds.map((fieldId, index) => (
              <PetitionComposeField
                id={`field-${fieldId}`}
                onMove={handleFieldMove}
                key={fieldId}
                field={fieldsById[fieldId]}
                index={index}
                active={active === fieldId}
                showError={showErrors}
                onFocus={handleFocus(fieldId)}
                onSettingsClick={handleSettingsClick(fieldId)}
                onDeleteClick={handleDeleteClick(fieldId)}
                onFieldEdit={handleFieldEdit(fieldId)}
                onTitleKeyUp={handleTitleKeyUp(fieldId)}
                onDescriptionKeyUp={handleDescriptionKeyUp(fieldId)}
              />
            ))}
            <Flex padding={2} justifyContent="center">
              <AddFieldPopover
                ref={addFieldRef}
                variant="ghost"
                leftIcon="add"
                onSelectFieldType={onAddField}
              >
                <FormattedMessage
                  id="petition.add-another-field-button"
                  defaultMessage="Add another field"
                />
              </AddFieldPopover>
            </Flex>
          </>
        ) : (
          <Box textAlign="center" padding={4}>
            <Heading as="h2" size="md" marginTop={8} marginBottom={2}>
              <FormattedMessage
                id="petition.empty-header"
                defaultMessage="What information do you want us to collect?"
              />
            </Heading>
            <Text fontSize="md">
              <FormattedMessage
                id="petition.empty-text"
                defaultMessage="Let's add our first field"
              />
            </Text>
            <AddFieldPopover
              marginTop={8}
              marginBottom={6}
              variantColor="purple"
              leftIcon="add"
              onSelectFieldType={onAddField}
            >
              <FormattedMessage
                id="petition.add-field-button"
                defaultMessage="Add field"
              />
            </AddFieldPopover>
          </Box>
        )}
      </Card>
    );
  }),
  {
    fragments: {
      petition: gql`
        fragment PetitionComposeFieldList_Petition on Petition {
          fields {
            ...PetitionComposeField_PetitionField
          }
        }
        ${PetitionComposeField.fragments.PetitionField}
      `,
    },
  }
);

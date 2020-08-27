import { gql } from "@apollo/client";
import { Button, Flex } from "@chakra-ui/core";
import { AddIcon } from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { AddFieldPopover } from "@parallel/components/petition-compose/AddFieldPopover";
import { PetitionComposeField } from "@parallel/components/petition-compose/PetitionComposeField";
import {
  PetitionComposeField_PetitionFieldFragment,
  PetitionFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import {
  KeyboardEvent,
  memo,
  ReactEventHandler,
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

export type PetitionComposeFieldListProps = ExtendChakra<{
  active: Maybe<string>;
  fields: FieldSelection[];
  showErrors: boolean;
  onUpdateFieldPositions: (fieldIds: string[]) => void;
  onCopyFieldClick: (fieldId: string) => void;
  onFieldSettingsClick: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onSelectField: (fieldId: string) => void;
  onAddField: (type: PetitionFieldType, position?: number) => void;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => void;
}>;

export const PetitionComposeFieldList = Object.assign(
  memo(function PetitionComposeFieldList({
    active,
    fields,
    showErrors,
    onUpdateFieldPositions,
    onCopyFieldClick,
    onFieldSettingsClick,
    onDeleteField,
    onSelectField,
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
      (fieldId: string) => () => onSelectField(fieldId),
      [onSelectField]
    );
    const handleClick = useMemoFactory(
      (fieldId: string) => () => onSelectField(fieldId),
      [onSelectField]
    );
    const handleCloneClick = useMemoFactory(
      (fieldId: string): ReactEventHandler => (event) => {
        event.stopPropagation();
        onCopyFieldClick(fieldId);
      },
      [onCopyFieldClick]
    );
    const handleSettingsClick = useMemoFactory(
      (fieldId: string): ReactEventHandler => (event) => {
        event.stopPropagation();
        onFieldSettingsClick(fieldId);
      },
      [onFieldSettingsClick]
    );
    const handleDeleteClick = useMemoFactory(
      (fieldId: string): ReactEventHandler => (event) => {
        event.stopPropagation();
        onDeleteField(fieldId);
      },
      [onDeleteField]
    );
    const handleFieldEdit = useMemoFactory(
      (fieldId: string) => (data: UpdatePetitionFieldInput) =>
        onFieldEdit(fieldId, data),
      [onFieldEdit]
    );

    const titleFieldProps = useMemoFactory(
      (fieldId: string) => ({
        onKeyDown: (event: KeyboardEvent<any>) => {
          const index = fieldIds.indexOf(fieldId);
          switch (event.key) {
            case "ArrowDown":
              setTimeout(() => focusDescription(fieldId));
              break;
            case "ArrowUp":
              if (index > 0) {
                setTimeout(() => focusDescription(fieldIds[index - 1]));
              }
              break;
          }
        },
        onKeyUp: (event: KeyboardEvent<any>) => {
          switch (event.key) {
            case "Enter":
              const addFieldButton = document.querySelector<HTMLButtonElement>(
                ".add-field-after"
              );
              (addFieldButton ?? addFieldRef.current!).click();
              break;
          }
        },
      }),
      [fieldIds.toString()]
    );

    const descriptionFieldProps = useMemoFactory(
      (fieldId: string) => ({
        onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => {
          const textarea = event.target as HTMLTextAreaElement;
          const totalLines = (textarea.value.match(/\n/g) ?? []).length + 1;
          const beforeCursor = textarea.value.substr(
            0,
            textarea.selectionStart
          );
          const currentLine = (beforeCursor.match(/\n/g) ?? []).length;
          const index = fieldIds.indexOf(fieldId);
          switch (event.key) {
            case "ArrowDown":
              if (
                index < fieldIds.length - 1 &&
                currentLine === totalLines - 1
              ) {
                focusTitle(fieldIds[index + 1]);
              }
              break;
            case "ArrowUp":
              if (currentLine === 0) {
                focusTitle(fieldId);
              }
              break;
            case "Enter":
              // if (!event.shiftKey) {
              //   event.preventDefault();
              // }
              break;
          }
        },
        onKeyUp: (event: KeyboardEvent<any>) => {
          switch (event.key) {
            case "Enter":
              // if (!event.shiftKey) {
              //   const addFieldButton = document.querySelector<
              //     HTMLButtonElement
              //   >(".add-field-after");
              //   (addFieldButton ?? addFieldRef.current!).click();
              // }
              break;
          }
        },
      }),
      [fieldIds.toString()]
    );

    return (
      <Card id="petition-fields" {...props}>
        <CardHeader headingAs="h2">
          <FormattedMessage
            id="petition.fields-header"
            defaultMessage="This is the information that you need"
          />
        </CardHeader>
        {fieldIds.map((fieldId, index) => (
          <PetitionComposeField
            id={`field-${fieldId}`}
            onMove={handleFieldMove}
            key={fieldId}
            field={fieldsById[fieldId]}
            index={index}
            isActive={active === fieldId}
            isLast={index === fieldIds.length - 1}
            showError={showErrors}
            onAddField={onAddField}
            onClick={handleClick(fieldId)}
            onFocus={handleFocus(fieldId)}
            onCloneClick={handleCloneClick(fieldId)}
            onSettingsClick={handleSettingsClick(fieldId)}
            onDeleteClick={handleDeleteClick(fieldId)}
            onFieldEdit={handleFieldEdit(fieldId)}
            titleFieldProps={titleFieldProps(fieldId)}
            descriptionFieldProps={descriptionFieldProps(fieldId)}
          />
        ))}
        <Flex padding={2} justifyContent="center">
          <AddFieldPopover
            as={Button}
            ref={addFieldRef}
            variant="ghost"
            leftIcon={<AddIcon />}
            onSelectFieldType={onAddField}
          >
            <FormattedMessage
              id="petition.add-another-field-button"
              defaultMessage="Add another field"
            />
          </AddFieldPopover>
        </Flex>
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

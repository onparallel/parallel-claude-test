import { gql } from "@apollo/client";
import { Button, Flex } from "@chakra-ui/core";
import { AddIcon } from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { AddFieldPopover } from "@parallel/components/petition-compose/AddFieldPopover";
import {
  PetitionComposeField,
  PetitionComposeFieldProps,
} from "@parallel/components/petition-compose/PetitionComposeField";
import {
  PetitionComposeField_PetitionFieldFragment,
  PetitionFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { useFieldIndexValues } from "@parallel/utils/fieldIndexValues";
import { Maybe } from "@parallel/utils/types";
import { useEffectSkipFirst } from "@parallel/utils/useEffectSkipFirst";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { KeyboardEvent, memo, useCallback, useReducer, useRef } from "react";
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
    useEffectSkipFirst(() => dispatch({ type: "RESET", fields: fields }), [
      fields,
    ]);

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
      setTimeout(() => {
        const title = document.querySelector<HTMLElement>(
          `#field-title-${fieldId}`
        );
        title?.focus();
      });
    }, []);

    // Memoize field callbacks
    const fieldProps = useMemoFactory(
      (
        fieldId
      ): Pick<
        PetitionComposeFieldProps,
        | "onClick"
        | "onFocus"
        | "onCloneClick"
        | "onSettingsClick"
        | "onDeleteClick"
        | "onFieldEdit"
        | "titleFieldProps"
        | "descriptionFieldProps"
      > => ({
        onClick: () => onSelectField(fieldId),
        onFocus: () => onSelectField(fieldId),
        onCloneClick: (event) => {
          event.stopPropagation();
          onCopyFieldClick(fieldId);
        },
        onSettingsClick: (event) => {
          event.stopPropagation();
          onFieldSettingsClick(fieldId);
        },
        onDeleteClick: (event) => {
          event.stopPropagation();
          onDeleteField(fieldId);
        },
        onFieldEdit: (data) => onFieldEdit(fieldId, data),
        titleFieldProps: {
          onKeyDown: (event) => {
            const index = fields.findIndex((f) => f.id === fieldId);
            const prevId = index > 0 ? fields[index - 1].id : null;
            const nextId =
              index < fields.length - 1 ? fields[index + 1].id : null;
            switch (event.key) {
              case "ArrowDown":
                if (nextId) {
                  focusTitle(nextId);
                }
                break;
              case "ArrowUp":
                if (prevId) {
                  focusTitle(prevId);
                }
                break;
            }
          },
          onKeyUp: (event) => {
            switch (event.key) {
              case "Enter":
                const addFieldButton = document.querySelector<
                  HTMLButtonElement
                >(".add-field-after");
                (addFieldButton ?? addFieldRef.current!).click();
                break;
            }
          },
        },
        descriptionFieldProps: {
          onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => {
            const textarea = event.target as HTMLTextAreaElement;
            const totalLines = (textarea.value.match(/\n/g) ?? []).length + 1;
            const beforeCursor = textarea.value.substr(
              0,
              textarea.selectionStart
            );
            const currentLine = (beforeCursor.match(/\n/g) ?? []).length;
            const index = fields.findIndex((f) => f.id === fieldId);
            const nextId =
              index < fields.length - 1 ? fields[index + 1].id : null;
            switch (event.key) {
              case "ArrowDown":
                if (nextId && currentLine === totalLines - 1) {
                  focusTitle(nextId);
                }
                break;
              case "ArrowUp":
                if (currentLine === 0) {
                  focusTitle(fieldId);
                }
                break;
            }
          },
        },
      }),
      [
        onSelectField,
        onCopyFieldClick,
        onFieldSettingsClick,
        onDeleteField,
        onFieldEdit,
        fields.map((f) => f.id).join(","),
      ]
    );

    const fieldIndexValues = useFieldIndexValues(fields);

    return (
      <>
        <Card id="petition-fields" overflow="hidden" {...props}>
          {fieldIds.map((fieldId, index) => (
            <PetitionComposeField
              id={`field-${fieldId}`}
              onMove={handleFieldMove}
              key={fieldId}
              field={fieldsById[fieldId]}
              fieldRelativeIndex={fieldIndexValues[index]}
              index={index}
              isActive={active === fieldId}
              isLast={index === fieldIds.length - 1}
              showError={showErrors}
              onAddField={onAddField}
              {...fieldProps(fieldId)}
            />
          ))}
        </Card>
        <Flex marginTop={4} justifyContent="center">
          <AddFieldPopover
            as={Button}
            ref={addFieldRef}
            leftIcon={<AddIcon />}
            onSelectFieldType={onAddField}
          >
            <FormattedMessage
              id="petition.add-another-field-button"
              defaultMessage="Add another field"
            />
          </AddFieldPopover>
        </Flex>
      </>
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

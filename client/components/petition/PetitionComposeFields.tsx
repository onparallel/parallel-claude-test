import { Box, Flex, Heading, Text } from "@chakra-ui/core";
import { Card, CardProps } from "@parallel/components/common/Card";
import { AddFieldPopover } from "@parallel/components/petition/AddFieldPopover";
import { PetitionComposeField } from "@parallel/components/petition/PetitionComposeField";
import {
  PetitionComposeField_PetitionFieldFragment,
  PetitionFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { gql } from "apollo-boost";
import {
  KeyboardEvent,
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

export type PetitionComposeFieldsProps = {
  active: Maybe<string>;
  fields: any;
  showErrors: boolean;
  onUpdateFieldPositions: (fieldIds: string[]) => void;
  onSettingsClick: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onFieldFocus: (fieldId: string) => void;
  onAddField: (type: PetitionFieldType) => void;
  onUpdateField: (fieldId: string, data: UpdatePetitionFieldInput) => void;
} & CardProps;

export function PetitionComposeFields({
  active,
  fields,
  showErrors,
  onUpdateFieldPositions,
  onSettingsClick,
  onDeleteField,
  onFieldFocus,
  onAddField,
  onUpdateField,
  ...props
}: PetitionComposeFieldsProps) {
  const [{ fieldsById, fieldIds }, dispatch] = useReducer(
    fieldsReducer,
    fields,
    reset
  );
  useEffect(() => dispatch({ type: "RESET", fields: fields }), [fields]);

  const addFieldRef = useRef<HTMLButtonElement>(null);

  const handleFieldMove = useCallback(
    async function (dragIndex: number, hoverIndex: number, dropped?: boolean) {
      const newFieldIds = [...fieldIds];
      const [field] = newFieldIds.splice(dragIndex, 1);
      newFieldIds.splice(hoverIndex, 0, field);
      dispatch({ type: "SORT", fieldIds: newFieldIds });
      if (dropped) {
        onUpdateFieldPositions(newFieldIds);
      }
    },
    [fieldIds]
  );

  const focusTitle = useCallback((fieldId: string) => {
    const title = document.querySelector<HTMLElement>(
      `#field-title-${fieldId}`
    );
    title?.click();
  }, []);

  const handleTitleKeyDown = useCallback(
    function (fieldId: string, event: KeyboardEvent<any>) {
      const index = fieldIds.indexOf(fieldId);
      switch (event.key) {
        case "ArrowDown":
          if (index < fieldIds.length - 1) {
            focusTitle(fieldIds[index + 1]);
          }
          break;
        case "ArrowUp":
          if (index > 0) {
            focusTitle(fieldIds[index - 1]);
          }
          break;
        case "Enter":
          addFieldRef.current!.click();
          break;
      }
    },
    [fieldIds]
  );

  return (
    <Card {...props}>
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
              onFocus={() => onFieldFocus(fieldId)}
              onMove={handleFieldMove}
              key={fieldId}
              field={fieldsById[fieldId]}
              index={index}
              active={active === fieldId}
              showError={showErrors}
              onSettingsClick={() => onSettingsClick(fieldId)}
              onDeleteClick={() => onDeleteField(fieldId)}
              onFieldEdit={(data) => onUpdateField(fieldId, data)}
              onTitleKeyDown={(event) => handleTitleKeyDown(fieldId, event)}
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
        <Flex flexDirection="column" alignItems="center">
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
        </Flex>
      )}
    </Card>
  );
}

PetitionComposeFields.fragments = {
  petition: gql`
    fragment PetitionComposeFields_Petition on Petition {
      fields {
        ...PetitionComposeField_PetitionField
      }
    }
    ${PetitionComposeField.fragments.petitionField}
  `,
};

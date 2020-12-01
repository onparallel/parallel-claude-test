import { gql } from "@apollo/client";
import {
  Box,
  Button,
  ButtonProps,
  Flex,
  IconButton,
  Tooltip,
} from "@chakra-ui/core";
import { AddIcon } from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { AddFieldPopover } from "@parallel/components/petition-compose/AddFieldPopover";
import {
  PetitionComposeField,
  PetitionComposeFieldProps,
  PetitionComposeFieldRef,
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
import {
  createRef,
  forwardRef,
  memo,
  RefObject,
  useCallback,
  useRef,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { indexBy, pick } from "remeda";

type FieldSelection = PetitionComposeField_PetitionFieldFragment;

type FieldsState = {
  fieldsById: Record<string, FieldSelection>;
  fieldIds: string[];
};

function reset(fields: FieldSelection[]): () => FieldsState {
  return () => ({
    fieldsById: indexBy(fields, (f) => f.id),
    fieldIds: fields.map((f) => f.id),
  });
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
    const [{ fieldsById, fieldIds }, setState] = useState(reset(fields));
    useEffectSkipFirst(() => setState(reset(fields)), [fields]);

    const handleFieldMove = useCallback(
      async function (
        dragIndex: number,
        hoverIndex: number,
        dropped?: boolean
      ) {
        setState((state) => {
          const newFieldIds = [...state.fieldIds];
          const [field] = newFieldIds.splice(dragIndex, 1);
          newFieldIds.splice(hoverIndex, 0, field);
          if (dropped) {
            setTimeout(() => onUpdateFieldPositions(newFieldIds));
          }
          return {
            ...state,
            fieldIds: newFieldIds,
          };
        });
      },
      [onUpdateFieldPositions]
    );

    const fieldRefs = useRef<
      Record<string, RefObject<PetitionComposeFieldRef>>
    >({});

    // Memoize field callbacks
    const fieldProps = useMemoFactory(
      (
        fieldId: string
      ): Pick<
        PetitionComposeFieldProps,
        | "onClick"
        | "onFocus"
        | "onCloneClick"
        | "onSettingsClick"
        | "onDeleteClick"
        | "onFieldEdit"
        | "onFocusPrevField"
        | "onFocusNextField"
        | "onAddField"
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
        onFocusPrevField: () => {
          const index = fields.findIndex((f) => f.id === fieldId);
          if (index > 0) {
            const prevId = fields[index - 1].id;
            fieldRefs.current![prevId].current!.focusFromNext();
          }
        },
        onFocusNextField: () => {
          const index = fields.findIndex((f) => f.id === fieldId);
          if (index < fields.length - 1) {
            const nextId = fields[index + 1].id;
            fieldRefs.current![nextId].current!.focusFromPrevious();
          }
        },
        onAddField: () => {
          const index = fields.findIndex((f) => f.id === fieldId);
          if (index === fields.length - 1) {
            document
              .querySelector<HTMLButtonElement>(".add-field-outer-button")!
              .click();
          } else {
            document
              .querySelector<HTMLButtonElement>(
                `#field-${fieldId} .add-field-after-button`
              )!
              .click();
          }
        },
      }),
      [
        onSelectField,
        onCopyFieldClick,
        onFieldSettingsClick,
        onDeleteField,
        onFieldEdit,
        fields.map((f) => `${f.id}:${f.type}`).join(","),
      ]
    );

    const fieldIndexValues = useFieldIndexValues(
      fieldIds.map((fieldId) => pick(fieldsById[fieldId], ["type"]))
    );

    return (
      <>
        <Card id="petition-fields" overflow="hidden" {...props}>
          {fieldIds.map((fieldId, index) => {
            const field = fieldsById[fieldId];
            const isActive = active === fieldId;
            const isLast = index === fieldIds.length - 1;
            return (
              <Box key={fieldId} id={`field-${fieldId}`} position="relative">
                {isActive && !field.isFixed ? (
                  <AddFieldButton
                    position="absolute"
                    top="-1px"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    zIndex="1"
                    onSelectFieldType={(type) => onAddField(type, index)}
                  />
                ) : null}
                <PetitionComposeField
                  ref={
                    fieldRefs.current[fieldId] ??
                    (fieldRefs.current[fieldId] = createRef())
                  }
                  onMove={handleFieldMove}
                  field={field}
                  fieldRelativeIndex={fieldIndexValues[index]}
                  index={index}
                  isActive={isActive}
                  showError={showErrors}
                  {...fieldProps(fieldId)}
                />
                {isActive && !isLast ? (
                  <AddFieldButton
                    className="add-field-after-button"
                    position="absolute"
                    bottom={0}
                    left="50%"
                    transform="translate(-50%, 50%)"
                    zIndex="1"
                    onSelectFieldType={(type) => onAddField(type, index + 1)}
                  />
                ) : null}
              </Box>
            );
          })}
        </Card>
        <Flex marginTop={4} justifyContent="center">
          <AddFieldPopover
            as={Button}
            className="add-field-outer-button"
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
            isFixed
            ...PetitionComposeField_PetitionField
          }
        }
        ${PetitionComposeField.fragments.PetitionField}
      `,
    },
  }
);

const AddFieldButton = forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    onSelectFieldType: (type: PetitionFieldType) => void;
  }
>(function AddFieldButton(props, ref) {
  const intl = useIntl();
  return (
    <Tooltip
      label={intl.formatMessage({
        id: "petition.add-field-button",
        defaultMessage: "Add field",
      })}
    >
      <AddFieldPopover
        ref={ref as any}
        as={IconButton}
        label={intl.formatMessage({
          id: "petition.add-field-button",
          defaultMessage: "Add field",
        })}
        icon={<AddIcon />}
        size="xs"
        variant="outline"
        rounded="full"
        backgroundColor="white"
        borderColor="gray.200"
        color="gray.500"
        _hover={{
          borderColor: "gray.300",
          color: "gray.800",
        }}
        _active={{
          backgroundColor: "gray.50",
        }}
        {...props}
      />
    </Tooltip>
  );
});

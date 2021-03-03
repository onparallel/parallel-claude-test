import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Flex,
  HTMLChakraProps,
  IconButton,
} from "@chakra-ui/react";
import { AddIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import {
  AddFieldPopover,
  AddFieldPopoverProps,
} from "@parallel/components/petition-compose/AddFieldPopover";
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
import { assignRef } from "@parallel/utils/assignRef";
import { useFieldIndexValues } from "@parallel/utils/fieldIndexValues";
import { Maybe } from "@parallel/utils/types";
import { useEffectSkipFirst } from "@parallel/utils/useEffectSkipFirst";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { Fragment, memo, useCallback, useRef, useState } from "react";
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

export interface PetitionComposeFieldListProps extends BoxProps {
  active: Maybe<string>;
  fields: FieldSelection[];
  showErrors: boolean;
  onUpdateFieldPositions: (fieldIds: string[]) => void;
  onCloneField: (fieldId: string) => void;
  onFieldSettingsClick: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onAddField: (type: PetitionFieldType, position?: number) => void;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => void;
}

export const PetitionComposeFieldList = Object.assign(
  memo(function PetitionComposeFieldList({
    active,
    fields,
    showErrors,
    onUpdateFieldPositions,
    onCloneField,
    onFieldSettingsClick,
    onDeleteField,
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

    const fieldRefs = useMultipleRefs<PetitionComposeFieldRef>();

    // Memoize field callbacks
    const fieldsDataRef = useRef(fields);
    assignRef(fieldsDataRef, fields);
    const fieldProps = useMemoFactory(
      (
        fieldId: string
      ): Pick<
        PetitionComposeFieldProps & BoxProps,
        | "onCloneField"
        | "onSettingsClick"
        | "onDeleteClick"
        | "onFieldEdit"
        | "onFocusPrevField"
        | "onFocusNextField"
        | "onAddField"
      > => ({
        onCloneField: () => onCloneField(fieldId),
        onSettingsClick: () => onFieldSettingsClick(fieldId),
        onDeleteClick: () => {
          const fields = fieldsDataRef.current!;
          if (
            fields.some((f) => f.visibility?.conditions.some((c) => c.fieldId))
          )
            onDeleteField(fieldId);
        },
        onFieldEdit: (data) => {
          const fields = fieldsDataRef.current!;
          const field = fields.find((f) => f.id === fieldId)!;
          if (field.type === "SELECT" && data.options) {
            // ensure no other field has a condition on it
          }
          onFieldEdit(fieldId, data);
        },
        onFocusPrevField: () => {
          const fields = fieldsDataRef.current;
          const index = fields.findIndex((f) => f.id === fieldId);
          if (index > 0) {
            const prevId = fields[index - 1].id;
            fieldRefs[prevId].current!.focusFromNext();
          }
        },
        onFocusNextField: () => {
          const fields = fieldsDataRef.current;
          const index = fields.findIndex((f) => f.id === fieldId);
          if (index < fields.length - 1) {
            const nextId = fields[index + 1].id;
            fieldRefs[nextId].current!.focusFromPrevious();
          }
        },
        onAddField: () => {
          const fields = fieldsDataRef.current;
          const index = fields.findIndex((f) => f.id === fieldId);
          if (index === fields.length - 1) {
            document
              .querySelector<HTMLButtonElement>(".big-add-field-button")!
              .click();
          } else {
            setHoveredFieldId(fieldId);
            setTimeout(() => {
              document
                .querySelector<HTMLButtonElement>(
                  `#field-${fieldId} + .add-field-button-wrapper  button`
                )!
                .click();
            });
          }
        },
      }),
      [onCloneField, onFieldSettingsClick, onDeleteField, onFieldEdit]
    );

    const fieldIndexValues = useFieldIndexValues(
      fieldIds.map((fieldId) => pick(fieldsById[fieldId], ["type"]))
    );

    const [hoveredFieldId, _setHoveredFieldId] = useState<string | null>(null);
    const hoveredFieldIdRef = useRef<string>(null);
    const hoveredFieldIdWhileMenuOpenedRef = useRef<string>(null);
    const setHoveredFieldId = useCallback(
      (fieldId) => {
        _setHoveredFieldId(fieldId);
        assignRef(hoveredFieldIdRef, fieldId);
      },
      [_setHoveredFieldId]
    );
    const [focusedFieldId, _setFocusedFieldId] = useState<string | null>(null);
    const focusedFieldIdRef = useRef<string>(null);
    const setFocusedFieldId = useCallback(
      (fieldId) => {
        _setFocusedFieldId(fieldId);
        assignRef(focusedFieldIdRef, fieldId);
      },
      [_setFocusedFieldId]
    );
    const isMenuOpenedRef = useRef(false);
    const timeoutRef = useRef<number>();
    const fieldMouseHandlers = useMemoFactory(
      (fieldId) =>
        ({
          onFocus() {
            clearTimeout(timeoutRef.current);
            if (fieldId !== focusedFieldIdRef.current) {
              setFocusedFieldId(fieldId);
            }
          },
          onBlur() {
            timeoutRef.current = setTimeout(() => setFocusedFieldId(null));
          },
          onMouseMove() {
            if (!isMenuOpenedRef.current) {
              if (fieldId !== hoveredFieldIdRef.current) {
                setHoveredFieldId(fieldId);
              }
            } else {
              if (fieldId !== hoveredFieldIdWhileMenuOpenedRef.current) {
                assignRef(hoveredFieldIdWhileMenuOpenedRef, fieldId);
              }
            }
          },
          onMouseEnter() {
            clearTimeout(timeoutRef.current);
            if (!isMenuOpenedRef.current) {
              setHoveredFieldId(fieldId);
            } else {
              assignRef(hoveredFieldIdWhileMenuOpenedRef, fieldId);
            }
          },
          onMouseLeave() {
            if (!isMenuOpenedRef.current) {
              timeoutRef.current = setTimeout(() => setHoveredFieldId(null));
            } else {
              assignRef(hoveredFieldIdWhileMenuOpenedRef, null);
            }
          },
        } as HTMLChakraProps<"div">),
      [setHoveredFieldId, setFocusedFieldId]
    );
    const addButtonMouseHandlers = useMemoFactory(
      (fieldId) =>
        ({
          onMouseEnter() {
            clearTimeout(timeoutRef.current);
          },
          onFocus() {
            clearTimeout(timeoutRef.current);
          },
          onSelectFieldType(type) {
            const fields = fieldsDataRef.current;
            onAddField(type, fields.findIndex((f) => f.id === fieldId) + 1);
          },
          onOpen() {
            assignRef(isMenuOpenedRef, true);
          },
          onClose() {
            assignRef(isMenuOpenedRef, false);
            if (
              hoveredFieldIdRef.current !==
              hoveredFieldIdWhileMenuOpenedRef.current
            ) {
              setHoveredFieldId(hoveredFieldIdWhileMenuOpenedRef.current);
            }
          },
        } as ButtonProps & AddFieldPopoverProps),
      []
    );

    return (
      <>
        <Card id="petition-fields" overflow="hidden" {...props}>
          {fieldIds.map((fieldId, index) => {
            const field = fieldsById[fieldId];
            const isActive = active === fieldId;
            const nextFieldId =
              index < fieldIds.length - 1 ? fieldIds[index + 1] : null;
            const showAddFieldButton =
              fieldId === hoveredFieldId ||
              nextFieldId === hoveredFieldId ||
              fieldId === focusedFieldId ||
              nextFieldId === focusedFieldId;
            return (
              <Fragment key={fieldId}>
                <PetitionComposeField
                  ref={fieldRefs[fieldId]}
                  id={`field-${fieldId}`}
                  onMove={handleFieldMove}
                  field={field}
                  fields={fields}
                  fieldIndex={fieldIndexValues[index]}
                  index={index}
                  isActive={isActive}
                  showError={showErrors}
                  {...fieldProps(fieldId)}
                  {...fieldMouseHandlers(fieldId)}
                />
                {nextFieldId ? (
                  <Box
                    className="add-field-button-wrapper"
                    position="relative"
                    zIndex="1"
                    display={showAddFieldButton ? "block" : "none"}
                  >
                    <AddFieldButton
                      position="absolute"
                      bottom={0}
                      left="50%"
                      transform="translate(-50%, 50%)"
                      className="add-field-after-button"
                      {...addButtonMouseHandlers(fieldId)}
                    />
                  </Box>
                ) : null}
              </Fragment>
            );
          })}
        </Card>
        <Flex marginTop={4} justifyContent="center">
          <BigAddFieldButton
            className="big-add-field-button"
            onSelectFieldType={onAddField}
          />
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

const AddFieldButton = memo(
  chakraForwardRef<"button", ButtonProps & AddFieldPopoverProps>(
    function AddFieldButton(props, ref) {
      const intl = useIntl();
      return (
        <AddFieldPopover
          ref={ref as any}
          as={IconButton}
          label={intl.formatMessage({
            id: "petition.add-field-button",
            defaultMessage: "Add field",
          })}
          icon={<AddIcon />}
          autoFocus={false}
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
      );
    }
  )
);

const BigAddFieldButton = memo(
  chakraForwardRef<"button", ButtonProps & AddFieldPopoverProps>(
    function AddFieldButton(props, ref) {
      return (
        <AddFieldPopover as={Button} leftIcon={<AddIcon />} {...props}>
          <FormattedMessage
            id="petition.add-another-field-button"
            defaultMessage="Add another field"
          />
        </AddFieldPopover>
      );
    }
  )
);

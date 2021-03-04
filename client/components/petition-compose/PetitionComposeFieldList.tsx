import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Flex,
  HTMLChakraProps,
  IconButton,
  Stack,
  Text,
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
  PetitionComposeFieldList_PetitionFragment,
  PetitionComposeField_PetitionFieldFragment,
  PetitionFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { assignRef } from "@parallel/utils/assignRef";
import { useFieldIndexValues } from "@parallel/utils/fieldIndexValues";
import { PetitionFieldVisibility } from "@parallel/utils/fieldVisibility/types";
import { Maybe } from "@parallel/utils/types";
import { useEffectSkipFirst } from "@parallel/utils/useEffectSkipFirst";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { Fragment, memo, useCallback, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { indexBy, pick, zip } from "remeda";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";
import { PetitionFieldTypeIndicator } from "../petition-common/PetitionFieldTypeIndicator";

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
  onDeleteField: (fieldId: string) => Promise<void>;
  onAddField: (type: PetitionFieldType, position?: number) => void;
  onFieldEdit: (
    fieldId: string,
    data: UpdatePetitionFieldInput
  ) => Promise<void>;
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

    const indices = useFieldIndexValues(
      fieldIds.map((fieldId) => pick(fieldsById[fieldId], ["type"]))
    );

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

    const showDeletingReferencedFields = useDeletingReferencedFieldsDialog();
    // Memoize field callbacks
    const fieldsDataRef = useRef({ fields, indices, active });
    assignRef(fieldsDataRef, { fields, indices, active });
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
        onDeleteClick: async () => {
          const { fields } = fieldsDataRef.current!;
          // if this field is being referenced by any other field?
          const referencing = zip(fields, indices).filter(([f]) =>
            (f.visibility as PetitionFieldVisibility)?.conditions.some(
              (c) => c.fieldId === fieldId
            )
          );
          if (referencing.length > 0) {
            try {
              await showDeletingReferencedFields({
                fieldsWithIndices: referencing.map(([field, fieldIndex]) => ({
                  field,
                  fieldIndex,
                })),
              });
              for (const [field] of referencing) {
                const visibility = field.visibility! as PetitionFieldVisibility;
                const conditions = visibility.conditions.filter(
                  (c) => c.fieldId !== fieldId
                );
                await onFieldEdit(field.id, {
                  visibility:
                    conditions.length > 0
                      ? { ...visibility, conditions }
                      : null,
                });
              }
            } catch {
              return;
            }
          }
          await onDeleteField(fieldId);
        },
        onFieldEdit: async (data) => {
          const { fields } = fieldsDataRef.current!;
          const field = fields.find((f) => f.id === fieldId)!;
          await onFieldEdit(fieldId, data);
          if (field.type === "SELECT" && data.options) {
            // ensure no field has a condition on a missing value
            const values = field.options.values as any[];
            const newValues = data.options.values as any[];
            const referencing = fields.filter((f) =>
              (f.visibility as PetitionFieldVisibility)?.conditions.some(
                (c) =>
                  c.fieldId === fieldId &&
                  c.value !== null &&
                  !newValues.includes(c.value)
              )
            );
            for (const field of referencing) {
              const visibility = field.visibility as PetitionFieldVisibility;
              // update visibility for fields referencing old options
              await onFieldEdit(field.id, {
                visibility: {
                  ...visibility,
                  conditions: visibility.conditions.map((c) => {
                    if (
                      c.fieldId === fieldId &&
                      c.value !== null &&
                      !newValues.includes(c.value)
                    ) {
                      const index = values.indexOf(c.value);
                      return {
                        ...c,
                        value:
                          index > newValues.length - 1
                            ? null
                            : newValues[index],
                      };
                    } else {
                      return c;
                    }
                  }),
                },
              });
            }
          }
        },
        onFocusPrevField: () => {
          const { fields } = fieldsDataRef.current!;
          const index = fields.findIndex((f) => f.id === fieldId);
          if (index > 0) {
            const prevId = fields[index - 1].id;
            fieldRefs[prevId].current!.focusFromNext();
          }
        },
        onFocusNextField: () => {
          const { fields } = fieldsDataRef.current!;
          const index = fields.findIndex((f) => f.id === fieldId);
          if (index < fields.length - 1) {
            const nextId = fields[index + 1].id;
            fieldRefs[nextId].current!.focusFromPrevious();
          }
        },
        onAddField: () => {
          const { fields } = fieldsDataRef.current!;
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
            // if field settings are visisble change them the focused field
            const { fields, active } = fieldsDataRef.current!;
            if (active && fieldId !== active) {
              const field = fields.find((f) => f.id === fieldId)!;
              if (field.type === "HEADING" && field.isFixed) {
                // pass
              } else {
                onFieldSettingsClick(fieldId);
              }
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
      [setHoveredFieldId, setFocusedFieldId, onFieldSettingsClick]
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
            const { fields } = fieldsDataRef.current;
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
                  fieldIndex={indices[index]}
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

function useDeletingReferencedFieldsDialog() {
  return useDialog(DeletingReferencedFieldsDialog);
}

function DeletingReferencedFieldsDialog({
  fieldsWithIndices,
  ...props
}: DialogProps<{
  fieldsWithIndices: {
    field: PetitionComposeFieldList_PetitionFragment["fields"][0];
    fieldIndex: string | number;
  }[];
}>) {
  return (
    <ConfirmDialog
      {...props}
      closeOnOverlayClick={false}
      header={
        <FormattedMessage
          id="component.deleting-referenced-field-dialog.header"
          defaultMessage="This field is being referenced"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.deleting-referenced-field-dialog.description"
              defaultMessage="The following {count, plural, =1 {field is} other {fields are}} referencing the field you are trying to delete:"
              values={{ count: fieldsWithIndices.length }}
            />
          </Text>
          {fieldsWithIndices.map(({ field, fieldIndex }) => (
            <Flex key={field.id} paddingLeft={2}>
              <PetitionFieldTypeIndicator
                as="div"
                type={field.type}
                fieldIndex={fieldIndex}
                isTooltipDisabled
                flexShrink={0}
              />
              <Box marginLeft={2} flex="1" minWidth="0" isTruncated>
                {field.title ? (
                  field.title
                ) : (
                  <Text as="span" textStyle="hint">
                    <FormattedMessage
                      id="generic.untitled-field"
                      defaultMessage="Untitled field"
                    />
                  </Text>
                )}
              </Box>
            </Flex>
          ))}
        </Stack>
      }
      confirm={
        <Button colorScheme="purple" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="component.deleting-referenced-field-dialog.confirm"
            defaultMessage="Remove conditions"
          />
        </Button>
      }
    />
  );
}

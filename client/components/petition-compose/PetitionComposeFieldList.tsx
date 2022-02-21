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
import { useFieldIndices } from "@parallel/utils/fieldIndices";
import { defaultCondition } from "@parallel/utils/fieldVisibility/conditions";
import { PetitionFieldVisibility } from "@parallel/utils/fieldVisibility/types";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { Maybe } from "@parallel/utils/types";
import { useEffectSkipFirst } from "@parallel/utils/useEffectSkipFirst";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { Fragment, memo, useCallback, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { indexBy, pick, zip } from "remeda";
import { useErrorDialog } from "../common/dialogs/ErrorDialog";
import { ReferencedFieldDialog, useReferencedFieldDialog } from "./dialogs/ReferencedFieldDialog";

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
  petitionId: string;
  active: Maybe<string>;
  fields: FieldSelection[];
  showErrors: boolean;
  onUpdateFieldPositions: (fieldIds: string[]) => void;
  onCloneField: (fieldId: string) => void;
  onFieldSettingsClick: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => Promise<void>;
  onAddField: (type: PetitionFieldType, position?: number) => void;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => Promise<void>;
  isReadOnly?: boolean;
  isPublicTemplate?: boolean;
  isTemplate?: boolean;
}

export const PetitionComposeFieldList = Object.assign(
  memo(function PetitionComposeFieldList({
    petitionId,
    active,
    fields,
    showErrors,
    onUpdateFieldPositions,
    onCloneField,
    onFieldSettingsClick,
    onDeleteField,
    onAddField,
    onFieldEdit,
    isReadOnly,
    isPublicTemplate,
    isTemplate,
    ...props
  }: PetitionComposeFieldListProps) {
    const [{ fieldsById, fieldIds }, setState] = useState(reset(fields));
    useEffectSkipFirst(() => setState(reset(fields)), [fields]);

    const indices = useFieldIndices(fieldIds.map((fieldId) => pick(fieldsById[fieldId], ["type"])));

    const fieldsStateRef = useUpdatingRef({ fieldsById, fieldIds, fields });

    const showError = useErrorDialog();
    const handleFieldMove = useCallback(
      async function (dragIndex: number, hoverIndex: number, dropped?: boolean) {
        const { fieldIds, fieldsById, fields } = fieldsStateRef.current;
        const newFieldIds = [...fieldIds];
        const [fieldId] = newFieldIds.splice(dragIndex, 1);
        newFieldIds.splice(hoverIndex, 0, fieldId);
        if (dropped) {
          // check that this order of fields is respecting that visibility only refers to previous fields
          const fieldPositions = Object.fromEntries(
            Array.from(newFieldIds.entries()).map(([i, id]) => [id, i])
          );
          for (const [position, fieldId] of Array.from(fieldIds.entries())) {
            const visibility = fieldsById[fieldId].visibility as PetitionFieldVisibility;
            if (
              visibility &&
              visibility.conditions.some((c) => fieldPositions[c.fieldId] > position)
            ) {
              try {
                setState(reset(fields));
                await showError({
                  message: (
                    <FormattedMessage
                      id="component.petition-compose-field-list.move-referenced-field-error"
                      defaultMessage="You can only move fields so that visibility conditions refer only to previous fields."
                    />
                  ),
                });
              } catch {}
              return;
            }
          }
          setState({ fieldsById, fieldIds: newFieldIds });
          setTimeout(() => onUpdateFieldPositions(newFieldIds));
        } else {
          setState({ fieldsById, fieldIds: newFieldIds });
        }
      },
      [onUpdateFieldPositions]
    );

    const fieldRefs = useMultipleRefs<PetitionComposeFieldRef>();

    const showReferencedFieldDialog = useReferencedFieldDialog();

    // Memoize field callbacks
    const fieldsDataRef = useUpdatingRef({ fields, indices, active });
    const fieldProps = useMemoFactory(
      (
        fieldId: string
      ): Pick<
        PetitionComposeFieldProps & BoxProps,
        | "petitionId"
        | "onCloneField"
        | "onSettingsClick"
        | "onDeleteClick"
        | "onFieldEdit"
        | "onFieldVisibilityClick"
        | "onFocusPrevField"
        | "onFocusNextField"
        | "onAddField"
      > => ({
        petitionId,
        onCloneField: () => onCloneField(fieldId),
        onSettingsClick: () => onFieldSettingsClick(fieldId),
        onDeleteClick: async () => {
          const { fields } = fieldsDataRef.current!;
          // if this field is being referenced by any other field ask the user
          // if they want to remove the conflicting conditions
          const referencing = zip(fields, indices).filter(([f]) =>
            (f.visibility as PetitionFieldVisibility)?.conditions.some((c) => c.fieldId === fieldId)
          );
          if (referencing.length > 0) {
            try {
              await showReferencedFieldDialog({
                type: "DELETING_FIELD",
                fieldsWithIndices: referencing.map(([field, fieldIndex]) => ({
                  field,
                  fieldIndex,
                })),
              });
              for (const [field] of referencing) {
                const visibility = field.visibility! as PetitionFieldVisibility;
                const conditions = visibility.conditions.filter((c) => c.fieldId !== fieldId);
                await onFieldEdit(field.id, {
                  visibility: conditions.length > 0 ? { ...visibility, conditions } : null,
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
          if ((field.type === "CHECKBOX" || field.type === "SELECT") && data.options) {
            // ensure no field has a condition on a missing value
            const values = field.options.values as any[];
            const newValues = data.options.values as any[];
            const referencing = fields.filter((f) =>
              (f.visibility as PetitionFieldVisibility)?.conditions.some(
                (c) =>
                  c.fieldId === fieldId &&
                  c.modifier !== "NUMBER_OF_REPLIES" &&
                  c.value !== null &&
                  !newValues.includes(c.value)
              )
            );
            // update visibility for fields referencing old options
            await Promise.all(
              referencing.map(async (field) => {
                const visibility = field.visibility as PetitionFieldVisibility;
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
                          value: index > newValues.length - 1 ? null : newValues[index] ?? null,
                        };
                      } else {
                        return c;
                      }
                    }),
                  },
                });
              })
            );
          }
        },
        onFieldVisibilityClick: () => {
          const { fields } = fieldsDataRef.current!;
          const field = fields.find((f) => f.id === fieldId)!;
          if (field.visibility) {
            onFieldEdit(fieldId, { visibility: null });
          } else {
            const index = fields.findIndex((f) => f.id === field.id);
            const prevField = fields[index - 1];
            // if the previous field has a visibility setting copy it
            if (prevField.visibility) {
              onFieldEdit(fieldId, { visibility: prevField.visibility });
            } else {
              // create a factible condition based on the previous field
              const field = fields
                .slice(0, index)
                .reverse()
                .find((f) => !f.isReadOnly)!;

              const condition = defaultCondition(
                field.type === "DYNAMIC_SELECT" &&
                  (field.options as FieldOptions["DYNAMIC_SELECT"]).labels?.length
                  ? [field, 0]
                  : field
              );
              onFieldEdit(fieldId, {
                visibility: {
                  type: "SHOW",
                  operator: "AND",
                  conditions: [condition],
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
            document.querySelector<HTMLButtonElement>("#menu-button-big-add-field-button")?.click();
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
          onFocus(e) {
            // see comment for onBlur below
            clearTimeout(timeoutRef.current);
            if (fieldId !== focusedFieldIdRef.current) {
              setFocusedFieldId(fieldId);
            }
            // if field settings are visible change them to the focused field
            const { fields, active } = fieldsDataRef.current!;
            if (
              active &&
              fieldId !== active &&
              // avoid calling onFieldSettingsClick when clicking on the field settings button
              !e.target.classList.contains("field-settings-button")
            ) {
              const field = fields.find((f) => f.id === fieldId)!;
              if (field.type === "HEADING" && field.isFixed) {
                // pass
              } else {
                onFieldSettingsClick(fieldId);
              }
            }
          },
          onBlur() {
            /**
             * When moving from a field to another the following happens synchronously:
             * - old active field -> blur event
             * - new active field -> focus event
             * To prevent hiding and showing the settings which would cause a bit of flickering
             * we deactivate with a setTimeout that is cancelled on the focus event.
             * This way instead of oldActiveId -> null -> newActiveId we oldActiveId -> newActiveId
             * directly
             */
            timeoutRef.current = window.setTimeout(() => setFocusedFieldId(null));
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
            // Something very similar to the focus/blur situation happens here, see comment
            // for the onBlur handler above.
            if (!isMenuOpenedRef.current) {
              timeoutRef.current = window.setTimeout(() => setHoveredFieldId(null));
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
            if (hoveredFieldIdRef.current !== hoveredFieldIdWhileMenuOpenedRef.current) {
              setHoveredFieldId(hoveredFieldIdWhileMenuOpenedRef.current);
            }
          },
        } as ButtonProps & AddFieldPopoverProps),
      []
    );

    return (
      <>
        <Card
          data-section="compose-fields"
          overflow="hidden"
          sx={{
            // safari fix round corners + overflow
            WebkitBackfaceVisibility: "hidden",
            WebkitTransform: "translate3d(0, 0, 0)",
          }}
          {...props}
        >
          {fieldIds.map((fieldId, index) => {
            const field = fieldsById[fieldId];
            const isActive = active === fieldId;
            const nextFieldId = index < fieldIds.length - 1 ? fieldIds[index + 1] : null;
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
                  data-section="compose-field"
                  onMove={handleFieldMove}
                  field={field}
                  fields={fields}
                  fieldIndex={indices[index]}
                  index={index}
                  isActive={isActive}
                  showError={showErrors}
                  isReadOnly={isReadOnly}
                  isPublicTemplate={isPublicTemplate}
                  {...fieldProps(fieldId)}
                  {...fieldMouseHandlers(fieldId)}
                />
                {nextFieldId && !isReadOnly ? (
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
                      colorScheme={isTemplate ? "purple" : undefined}
                      {...addButtonMouseHandlers(fieldId)}
                    />
                  </Box>
                ) : null}
              </Fragment>
            );
          })}
        </Card>
        {!isReadOnly ? (
          <Flex marginTop={4} justifyContent="center">
            <BigAddFieldButton
              data-action="big-add-field"
              id="big-add-field-button"
              onSelectFieldType={onAddField}
              colorScheme={isTemplate ? "purple" : undefined}
            />
          </Flex>
        ) : null}
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
            ...ReferencedFieldDialog_PetitionField
          }
        }
        ${PetitionComposeField.fragments.PetitionField}
        ${ReferencedFieldDialog.fragments.PetitionField}
      `,
    },
  }
);

const AddFieldButton = memo(
  chakraForwardRef<"button", ButtonProps & AddFieldPopoverProps>(function AddFieldButton(
    props,
    ref
  ) {
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
  })
);

const BigAddFieldButton = memo(
  chakraForwardRef<"button", ButtonProps & AddFieldPopoverProps>(function BigAddFieldButton(
    props,
    ref
  ) {
    return (
      <AddFieldPopover as={Button} leftIcon={<AddIcon />} {...props}>
        <FormattedMessage
          id="petition.add-another-field-button"
          defaultMessage="Add another field"
        />
      </AddFieldPopover>
    );
  })
);

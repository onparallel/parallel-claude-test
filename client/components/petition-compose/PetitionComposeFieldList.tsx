import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Button,
  ButtonOptions,
  Flex,
  HTMLChakraProps,
  ThemingProps,
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
  PetitionComposeFieldList_PetitionBaseFragment,
  PetitionComposeFieldList_UserFragment,
  PetitionFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { assignRef } from "@parallel/utils/assignRef";
import { useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { defaultFieldCondition } from "@parallel/utils/fieldLogic/conditions";
import {
  PetitionFieldLogicCondition,
  PetitionFieldMath,
  PetitionFieldVisibility,
} from "@parallel/utils/fieldLogic/types";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { Maybe } from "@parallel/utils/types";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { usePetitionComposeFieldReorder } from "@parallel/utils/usePetitionComposeFieldReorder";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { Fragment, memo, useCallback, useMemo, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { intersection, isDefined } from "remeda";
import { AddFieldButton } from "../petition-common/AddFieldButton";
import { useEditPetitionFieldCalculationsDialog } from "./dialogs/EditPetitionFieldCalculationsDialog";

export interface PetitionComposeFieldListProps extends BoxProps {
  user: PetitionComposeFieldList_UserFragment;
  activeFieldId: Maybe<string>;
  petition: PetitionComposeFieldList_PetitionBaseFragment;
  showErrors: boolean;
  onUpdateFieldPositions: (fieldIds: string[], parentFieldId?: string) => void;
  onCloneField: (fieldId: string) => void;
  onFieldSettingsClick: (fieldId: string) => void;
  onFieldTypeIndicatorClick: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => Promise<void>;
  onAddField: (type: PetitionFieldType, position?: number, parentFieldId?: string) => void;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => Promise<void>;
  onUnlinkField: (parentFieldId: string, childrenFieldIds: string[]) => void;
  onLinkField: (parentFieldId: string, childrenFieldIds: string[]) => void;
  isReadOnly?: boolean;
}

export const PetitionComposeFieldList = Object.assign(
  memo(function PetitionComposeFieldList({
    user,
    petition,
    activeFieldId,
    showErrors,
    onUpdateFieldPositions,
    onCloneField,
    onFieldSettingsClick,
    onFieldTypeIndicatorClick,
    onDeleteField,
    onAddField,
    onFieldEdit,
    onLinkField,
    onUnlinkField,
    isReadOnly,
    ...props
  }: PetitionComposeFieldListProps) {
    const fieldRefs = useMultipleRefs<PetitionComposeFieldRef>();

    const { fields, onFieldMove } = usePetitionComposeFieldReorder({
      fields: petition.fields,
      onUpdateFieldPositions,
    });

    const fieldsWithIndices = useFieldsWithIndices(fields);

    const allFields = useMemo(
      () => petition.fields.flatMap((f) => [f, ...(f.children ?? [])]),
      [petition.fields],
    );

    const showEditPetitionFieldCalculationsDialog = useEditPetitionFieldCalculationsDialog();

    // Memoize field callbacks
    const petitionDataRef = useUpdatingRef({ petition });
    const allFieldsDataRef = useUpdatingRef({ fields: allFields, active: activeFieldId });
    const fieldsDataRef = useUpdatingRef({ fields: petition.fields, active: activeFieldId });
    const fieldProps = useMemoFactory(
      (
        fieldId: string,
      ): Pick<
        PetitionComposeFieldProps,
        | "onCloneField"
        | "onSettingsClick"
        | "onTypeIndicatorClick"
        | "onDeleteClick"
        | "onFieldEdit"
        | "onFieldVisibilityClick"
        | "onFieldCalculationsClick"
        | "onFocusPrevField"
        | "onFocusNextField"
        | "onAddField"
      > => ({
        onCloneField: () => onCloneField(fieldId),
        onSettingsClick: () => onFieldSettingsClick(fieldId),
        onTypeIndicatorClick: () => onFieldTypeIndicatorClick(fieldId),
        onDeleteClick: async () => onDeleteField(fieldId),
        onFieldEdit: async (data) => {
          const { fields } = allFieldsDataRef.current!;
          const field = fields.find((f) => f.id === fieldId)!;

          await onFieldEdit(fieldId, data);
          if ((field.type === "CHECKBOX" || field.type === "SELECT") && data.options) {
            // ensure no field has a condition on a missing value
            const values = field.options.values as any[];
            const newValues = data.options.values as any[];
            const referencingVisibility = fields.filter((f) =>
              (f.visibility as PetitionFieldVisibility)?.conditions.some(
                (c) =>
                  "fieldId" in c &&
                  c.fieldId === fieldId &&
                  c.modifier !== "NUMBER_OF_REPLIES" &&
                  c.value !== null &&
                  !newValues.includes(c.value),
              ),
            );

            const referencingMath = fields.filter((f) =>
              (f.math as PetitionFieldMath[])?.some((calc) =>
                calc.conditions.some(
                  (c) =>
                    "fieldId" in c &&
                    c.fieldId === fieldId &&
                    c.modifier !== "NUMBER_OF_REPLIES" &&
                    c.value !== null &&
                    !newValues.includes(c.value),
                ),
              ),
            );

            const updatePetitionFieldLogicCondition = (c: PetitionFieldLogicCondition) => {
              if ("fieldId" in c && c.fieldId !== fieldId) return c;

              if (c.operator === "NOT_IS_ONE_OF" || c.operator === "IS_ONE_OF") {
                if (Array.isArray(c.value)) {
                  return {
                    ...c,
                    value: intersection(c.value, newValues),
                  };
                } else {
                  return c;
                }
              } else if (c.value !== null && !newValues.includes(c.value)) {
                const index = values.indexOf(c.value);
                return {
                  ...c,
                  value: index > newValues.length - 1 ? null : newValues[index] ?? null,
                };
              } else {
                return c;
              }
            };

            // update visibility for fields referencing old options
            await Promise.all(
              referencingVisibility.map(async (field) => {
                const visibility = field.visibility as PetitionFieldVisibility;
                await onFieldEdit(field.id, {
                  visibility: {
                    ...visibility,
                    conditions: visibility.conditions.map(updatePetitionFieldLogicCondition),
                  },
                });
              }),
            );

            // update math for fields referencing old options
            await Promise.all(
              referencingMath.map(async (field) => {
                const math = field.math as PetitionFieldMath[];
                await onFieldEdit(field.id, {
                  math: math.map((calc) => {
                    return {
                      ...calc,
                      conditions: calc.conditions.map(updatePetitionFieldLogicCondition),
                    };
                  }),
                });
              }),
            );
          }
        },
        onFieldVisibilityClick: () => {
          const { fields } = allFieldsDataRef.current!;
          const field = fields.find((f) => f.id === fieldId)!;
          if (field.visibility) {
            onFieldEdit(fieldId, { visibility: null });
          } else {
            const index = fields.findIndex((f) => f.id === field.id);

            const prevField = isDefined(field.parent)
              ? fields[index - 1]
              : fields.slice(0, index).findLast((f) => !isDefined(f.parent))!;

            // if the previous field has a visibility setting copy it
            if (prevField.visibility) {
              onFieldEdit(fieldId, { visibility: prevField.visibility });
            } else {
              // create a factible condition based on the previous field
              const referencedField =
                fields
                  .slice(0, index)
                  .findLast((f) => !f.isReadOnly && f.parent === field.parent) ??
                fields.slice(0, index).findLast((f) => !f.isReadOnly)!;

              const condition = defaultFieldCondition(
                referencedField.type === "DYNAMIC_SELECT" &&
                  (referencedField.options as FieldOptions["DYNAMIC_SELECT"]).labels?.length
                  ? [referencedField, 0]
                  : referencedField,
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
        onFieldCalculationsClick: async (removeMath?: boolean) => {
          const { fields } = allFieldsDataRef.current!;
          const { petition } = petitionDataRef.current!;
          const field = fields.find((f) => f.id === fieldId)!;
          try {
            if (field.math && removeMath === true) {
              onFieldEdit(fieldId, { math: null });
            } else {
              const { math } = await showEditPetitionFieldCalculationsDialog({
                field,
                petition,
                isReadOnly,
              });

              onFieldEdit(fieldId, { math });
            }
          } catch {}
        },
        onFocusPrevField: () => {
          const { fields } = allFieldsDataRef.current!;
          const index = fields.findIndex((f) => f.id === fieldId);
          if (index > 0) {
            const prevId = fields[index - 1].id;
            fieldRefs[prevId].current!.focusFromNext();
          }
        },
        onFocusNextField: () => {
          const { fields } = allFieldsDataRef.current!;
          const index = fields.findIndex((f) => f.id === fieldId);
          if (index < fields.length - 1) {
            const nextId = fields[index + 1].id;
            fieldRefs[nextId].current!.focusFromPrevious();
          }
        },
        onAddField: (type?: PetitionFieldType, position?: number, parentFieldId?: string) => {
          if (type) {
            onAddField(type, position, parentFieldId);
          } else {
            const { fields } = fieldsDataRef.current!;
            const index = fields.findIndex((f) => f.id === fieldId);
            if (index === fields.length - 1) {
              document
                .querySelector<HTMLButtonElement>("#menu-button-big-add-field-button")
                ?.click();
            } else {
              setHoveredFieldId(fieldId);
              setTimeout(() => {
                document
                  .querySelector<HTMLButtonElement>(
                    `#field-${fieldId} + .add-field-button-wrapper  button`,
                  )!
                  .click();
              });
            }
          }
        },
      }),
      [onCloneField, onFieldSettingsClick, onDeleteField, onFieldEdit, isReadOnly],
    );

    const [hoveredFieldId, _setHoveredFieldId] = useState<string | null>(null);
    const hoveredFieldIdRef = useRef<string>(null);
    const hoveredFieldIdWhileMenuOpenedRef = useRef<string>(null);
    const setHoveredFieldId = useCallback(
      (fieldId: string | null) => {
        _setHoveredFieldId(fieldId);
        assignRef(hoveredFieldIdRef, fieldId);
      },
      [_setHoveredFieldId],
    );
    const [focusedFieldId, _setFocusedFieldId] = useState<string | null>(null);
    const focusedFieldIdRef = useRef<string>(null);
    const setFocusedFieldId = useCallback(
      (fieldId: string | null) => {
        _setFocusedFieldId(fieldId);
        assignRef(focusedFieldIdRef, fieldId);
      },
      [_setFocusedFieldId],
    );
    const isMenuOpenedRef = useRef(false);
    const timeoutRef = useRef<number>();
    const fieldMouseHandlers = useMemoFactory(
      (fieldId) =>
        ({
          onFocus(e) {
            e.stopPropagation();
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
        }) as HTMLChakraProps<"div">,
      [setHoveredFieldId, setFocusedFieldId, onFieldSettingsClick],
    );
    const addButtonMouseHandlers = useMemoFactory(
      (fieldId) => ({
        onMouseEnter() {
          clearTimeout(timeoutRef.current);
        },
        onFocus() {
          clearTimeout(timeoutRef.current);
        },
        onSelectFieldType(type: PetitionFieldType) {
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
        user,
      }),
      [],
    );

    return (
      <>
        <Card
          data-testid="compose-fields"
          data-section="compose-fields"
          overflow="hidden"
          sx={{
            // safari fix round corners + overflow
            WebkitBackfaceVisibility: "hidden",
            WebkitTransform: "translate3d(0, 0, 0)",
          }}
          {...props}
        >
          {fieldsWithIndices.map(([field, fieldIndex, childrenFieldIndices], i) => {
            const nextFieldId = i < fields.length - 1 ? fields[i + 1].id : null;
            const showAddFieldButton = [field.id, nextFieldId].some(
              (id) => id === hoveredFieldId || id === focusedFieldId,
            );
            return (
              <Fragment key={field.id}>
                <PetitionComposeField
                  ref={fieldRefs[field.id]}
                  onMove={onFieldMove}
                  user={user}
                  field={field}
                  childrenFieldIndices={childrenFieldIndices}
                  fieldRefs={fieldRefs}
                  petition={petition}
                  fieldIndex={fieldIndex}
                  index={i}
                  isActive={field.id === activeFieldId}
                  activeChildFieldId={
                    isDefined(field.children) && field.children.some((f) => f.id === activeFieldId)
                      ? activeFieldId
                      : null
                  }
                  showError={showErrors}
                  isReadOnly={isReadOnly}
                  {...fieldProps(field.id)}
                  {...fieldMouseHandlers(field.id)}
                  fieldProps={fieldProps}
                  onUpdateFieldPositions={onUpdateFieldPositions}
                  onLinkField={onLinkField}
                  onUnlinkField={onUnlinkField}
                />
                {nextFieldId && !isReadOnly ? (
                  <Box
                    className="add-field-button-wrapper"
                    position="relative"
                    zIndex="1"
                    sx={{
                      visibility: showAddFieldButton ? "visible" : "hidden",
                      "& :hover, & :focus-within": {
                        visibility: "visible",
                      },
                    }}
                  >
                    <AddFieldButton
                      position="absolute"
                      bottom={0}
                      left="50%"
                      transform="translate(-50%, 50%)"
                      className="add-field-after-button"
                      data-testid="small-add-field-button"
                      colorScheme={
                        petition.__typename === "PetitionTemplate" ? "primary" : undefined
                      }
                      {...addButtonMouseHandlers(field.id)}
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
              id="big-add-field-button"
              data-action="big-add-field"
              data-testid="big-add-field-button"
              onSelectFieldType={onAddField}
              colorScheme={petition.__typename === "PetitionTemplate" ? "primary" : undefined}
              user={user}
            />
          </Flex>
        ) : null}
      </>
    );
  }),
  {
    fragments: {
      User: gql`
        fragment PetitionComposeFieldList_User on User {
          ...AddFieldPopover_User
          ...PetitionComposeField_User
        }
        ${AddFieldPopover.fragments.User}
        ${PetitionComposeField.fragments.User}
      `,
      PetitionField: gql`
        fragment PetitionComposeFieldList_PetitionField on PetitionField {
          id
          type
          options
          visibility
          math
          isReadOnly
          isFixed
          ...PetitionComposeField_PetitionField
          ...usePetitionComposeFieldReorder_PetitionField
        }
        ${PetitionComposeField.fragments.PetitionField}
        ${usePetitionComposeFieldReorder.fragments.PetitionField}
      `,
      PetitionBase: gql`
        fragment PetitionComposeFieldList_PetitionBase on PetitionBase {
          id
          fields {
            ...PetitionComposeFieldList_PetitionField
          }
          ...PetitionComposeField_PetitionBase
        }
        ${PetitionComposeField.fragments.PetitionBase}
        ${useEditPetitionFieldCalculationsDialog.fragments.PetitionBase}
      `,
    },
  },
);

interface BigAddFieldButtonProps
  extends ButtonOptions,
    ThemingProps<"Button">,
    AddFieldPopoverProps {}

const BigAddFieldButton = memo(
  chakraForwardRef<"button", BigAddFieldButtonProps>(function BigAddFieldButton(props, ref) {
    return (
      <AddFieldPopover as={Button} leftIcon={<AddIcon />} {...props}>
        <FormattedMessage
          id="petition.add-another-field-button"
          defaultMessage="Add another field"
        />
      </AddFieldPopover>
    );
  }),
);

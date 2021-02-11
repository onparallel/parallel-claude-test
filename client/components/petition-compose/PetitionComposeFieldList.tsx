import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Flex,
  HTMLChakraProps,
  IconButton,
  ScaleFade,
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
  onCopyFieldClick: (fieldId: string) => void;
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
    onCopyFieldClick,
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
    const fieldProps = useMemoFactory(
      (
        fieldId: string
      ): Pick<
        PetitionComposeFieldProps & BoxProps,
        | "onCloneClick"
        | "onSettingsClick"
        | "onDeleteClick"
        | "onFieldEdit"
        | "onFocusPrevField"
        | "onFocusNextField"
        | "onAddField"
      > => ({
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
            fieldRefs[prevId].current!.focusFromNext();
          }
        },
        onFocusNextField: () => {
          const index = fields.findIndex((f) => f.id === fieldId);
          if (index < fields.length - 1) {
            const nextId = fields[index + 1].id;
            fieldRefs[nextId].current!.focusFromPrevious();
          }
        },
        onAddField: () => {
          const index = fields.findIndex((f) => f.id === fieldId);
          if (index === fields.length - 1) {
            document
              .querySelector<HTMLButtonElement>(".add-field-outer-button")!
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
      [
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

    const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);
    const [
      hoveredFieldIdWhileMenuOpened,
      setHoveredFieldIdWhileMenuOpened,
    ] = useState<string | null>(null);
    const [isMenuOpened, setIsMenuOpened] = useState(false);
    const timeoutRef = useRef<number>();
    const fieldMouseHandlers = useMemoFactory(
      (fieldId) =>
        ({
          onFocus() {
            clearTimeout(timeoutRef.current);
            if (fieldId !== hoveredFieldId) {
              setHoveredFieldId(fieldId);
            }
          },
          onBlur() {
            timeoutRef.current = setTimeout(() => setHoveredFieldId(null));
          },
          onMouseMove() {
            if (!isMenuOpened) {
              if (fieldId !== hoveredFieldId) {
                setHoveredFieldId(fieldId);
              }
            } else {
              if (fieldId !== hoveredFieldIdWhileMenuOpened) {
                setHoveredFieldIdWhileMenuOpened(fieldId);
              }
            }
          },
          onMouseEnter() {
            clearTimeout(timeoutRef.current);
            if (!isMenuOpened) {
              setHoveredFieldId(fieldId);
            } else {
              setHoveredFieldIdWhileMenuOpened(fieldId);
            }
          },
          onMouseLeave() {
            if (!isMenuOpened) {
              timeoutRef.current = setTimeout(() => setHoveredFieldId(null));
            } else {
              timeoutRef.current = setTimeout(() =>
                setHoveredFieldIdWhileMenuOpened(null)
              );
            }
          },
        } as HTMLChakraProps<"div">),
      [hoveredFieldId, hoveredFieldIdWhileMenuOpened, isMenuOpened]
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
        } as HTMLChakraProps<"div">),
      [isMenuOpened]
    );

    return (
      <>
        <Card id="petition-fields" overflow="hidden" {...props}>
          {fieldIds.map((fieldId, index) => {
            const field = fieldsById[fieldId];
            const isActive = active === fieldId;
            const nextFieldId =
              index < fieldIds.length - 1 ? fieldIds[index + 1] : null;
            return (
              <Fragment key={fieldId}>
                <PetitionComposeField
                  ref={fieldRefs[fieldId]}
                  id={`field-${fieldId}`}
                  onMove={handleFieldMove}
                  field={field}
                  fieldRelativeIndex={fieldIndexValues[index]}
                  index={index}
                  isActive={isActive}
                  showError={showErrors}
                  {...fieldProps(fieldId)}
                  {...fieldMouseHandlers(fieldId)}
                />
                {nextFieldId ? (
                  <Box className="add-field-button-wrapper" position="relative">
                    <Box
                      position="absolute"
                      bottom={0}
                      left="50%"
                      transform="translate(-50%, 50%)"
                      zIndex="1"
                      {...addButtonMouseHandlers(fieldId)}
                    >
                      <ScaleFade
                        unmountOnExit
                        in={[fieldId, nextFieldId].includes(hoveredFieldId!)}
                      >
                        <AddFieldButton
                          className="add-field-after-button"
                          onSelectFieldType={(type) =>
                            onAddField(type, index + 1)
                          }
                          onOpen={() => setIsMenuOpened(true)}
                          onClose={() => {
                            setIsMenuOpened(false);
                            if (
                              hoveredFieldId !== hoveredFieldIdWhileMenuOpened
                            ) {
                              setHoveredFieldId(hoveredFieldIdWhileMenuOpened);
                            }
                          }}
                        />
                      </ScaleFade>
                    </Box>
                  </Box>
                ) : null}
              </Fragment>
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

interface AddFieldButtonProps extends ButtonProps, AddFieldPopoverProps {}

const AddFieldButton = chakraForwardRef<"button", AddFieldButtonProps>(
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
);

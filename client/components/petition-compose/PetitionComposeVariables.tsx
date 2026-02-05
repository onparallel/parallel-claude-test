import { CombinedGraphQLErrors, gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Stack,
} from "@chakra-ui/react";
import { Menu } from "@parallel/chakra/components";
import {
  AddIcon,
  AlertCircleIcon,
  BracesIcon,
  CalculatorIcon,
  EditIcon,
  HelpOutlineIcon,
  MoreVerticalIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionComposeVariables_PetitionBaseFragment,
  PetitionComposeVariables_PetitionFieldFragment,
  PetitionComposeVariables_PetitionVariableFragment,
  PetitionComposeVariables_deletePetitionVariableDocument,
  PetitionComposeVariables_updatePetitionFieldDocument,
  PetitionVariableType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { PetitionFieldMath, PetitionFieldVisibility } from "@parallel/utils/fieldLogic/types";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, uniqueBy } from "remeda";
import { useErrorDialog } from "../common/dialogs/ErrorDialog";
import { HelpCenterLink, NakedHelpCenterLink } from "../common/HelpCenterLink";
import { IconButtonWithTooltip, IconButtonWithTooltipProps } from "../common/IconButtonWithTooltip";
import { OverflownText } from "../common/OverflownText";
import { PetitionFieldReference } from "../common/PetitionFieldReference";
import { VariableReference } from "../common/VariableReference";
import { PetitionFieldTypeIndicator } from "../petition-common/PetitionFieldTypeIndicator";
import { useConfirmDeleteVariableDialog } from "./dialogs/ConfirmDeleteVariableDialog";
import {
  useCreatePetitionVariableDialog,
  useUpdateEnumPetitionVariableDialog,
  useUpdateNumericPetitionVariableDialog,
} from "./dialogs/CreateOrUpdatePetitionVariableDialog";
import { usePetitionComposeCalculationRulesDialog } from "./dialogs/PetitionComposeCalculationRulesDialog";
import { useReferencedCalculationsDialog } from "./dialogs/ReferencedCalculationsDialog";
import { Text } from "@parallel/components/ui";

export interface PetitionComposeVariablesProps {
  allFieldsWithIndices: [
    field: PetitionComposeVariables_PetitionFieldFragment,
    fieldIndex: PetitionFieldIndex,
  ][];

  petition: PetitionComposeVariables_PetitionBaseFragment;
  isReadOnly: boolean;
}

export function PetitionComposeVariables({
  allFieldsWithIndices,
  petition,
  isReadOnly,
}: PetitionComposeVariablesProps) {
  const intl = useIntl();

  const showErrorDialog = useErrorDialog();

  const [updatePetitionField] = useMutation(PetitionComposeVariables_updatePetitionFieldDocument);
  const handleEditField = async (fieldId: string, data: UpdatePetitionFieldInput) => {
    try {
      await updatePetitionField({
        variables: { petitionId: petition.id, fieldId, data },
      });
    } catch {}
  };

  const showCreateVariableDialog = useCreatePetitionVariableDialog();
  const handleAddNewVariable = async () => {
    try {
      await showCreateVariableDialog({
        petitionId: petition.id,
      });
    } catch {}
  };

  const showConfirmDeleteVariableDialog = useConfirmDeleteVariableDialog();
  const showReferencedCalculationsDialog = useReferencedCalculationsDialog();
  const [deletePetitionVariable] = useMutation(
    PetitionComposeVariables_deletePetitionVariableDocument,
  );
  const handleDeleteVariable = async (name: string) => {
    try {
      const referencingMath = allFieldsWithIndices.filter(([f]) =>
        (f.math as PetitionFieldMath)?.some(
          (calc) =>
            calc.conditions.some((c) => "variableName" in c && c.variableName === name) ||
            calc.operations.some(
              (o) =>
                ("variable" in o && o.variable === name) ||
                (o.operand.type === "VARIABLE" && o.operand.name === name) ||
                (o.operand.type === "ENUM" && o.operand.value === name),
            ),
        ),
      );

      const referencingVisibility = allFieldsWithIndices.filter(([f]) =>
        (f.visibility as PetitionFieldVisibility)?.conditions.some(
          (c) => "variableName" in c && c.variableName === name,
        ),
      );
      if (referencingMath.length > 0 || referencingVisibility.length > 0) {
        await handleReferencingFieldsError(referencingMath, referencingVisibility, name);
      }
      await showConfirmDeleteVariableDialog();
      await deletePetitionVariable({
        variables: { petitionId: petition.id, name },
      });
    } catch (error) {
      if (isApolloError(error, "VARIABLE_IS_REFERENCED_IN_PETITION_ATTACHMENTS_VISIBILITY")) {
        await showErrorDialog.ignoringDialogErrors({
          header: (
            <Stack direction="row" spacing={2} align="center">
              <AlertCircleIcon role="presentation" />
              <Text>
                <FormattedMessage
                  id="page.petition-compose.variable-referenced-in-header"
                  defaultMessage="Variable referenced"
                />
              </Text>
            </Stack>
          ),

          message: (
            <FormattedMessage
              id="page.petition-compose.variable-referenced-in-petition-attachments-visibility"
              defaultMessage="This variable is referenced in the visibility conditions of a document attachment. To continue, first remove the referencing conditions."
            />
          ),
        });
        return false;
      } else if (isApolloError(error, "VARIABLE_IS_REFERENCED_IN_APPROVAL_FLOW_CONFIG")) {
        await showErrorDialog.ignoringDialogErrors({
          header: (
            <Stack direction="row" spacing={2} align="center">
              <AlertCircleIcon role="presentation" />
              <Text>
                <FormattedMessage
                  id="page.petition-compose.variable-referenced-in-header"
                  defaultMessage="Variable referenced"
                />
              </Text>
            </Stack>
          ),

          message: (
            <FormattedMessage
              id="page.petition-compose.variable-referenced-in-message"
              defaultMessage="This variable is referenced in <b>{configurationName}</b> and cannot be removed."
              values={{
                configurationName: intl
                  .formatMessage({
                    id: "component.petition-settings.approval-steps",
                    defaultMessage: "Approval steps",
                  })
                  .toLowerCase(),
              }}
            />
          ),
        });
        return false;
      } else if (isApolloError(error, "VARIABLE_IS_REFERENCED_IN_UPDATE_PROFILE_ON_CLOSE_CONFIG")) {
        const fieldGroups = allFieldsWithIndices.filter(([f]) =>
          (
            (error as CombinedGraphQLErrors).errors[0].extensions?.fieldGroupsIds as string[]
          )?.includes(f.id),
        );

        await showErrorDialog.ignoringDialogErrors({
          message: (
            <Stack>
              <Text>
                <FormattedMessage
                  id="component.petition-compose-variables.variable-updates-profile-on-close-message"
                  defaultMessage="This variable updates a profile on close and cannot be removed or edited."
                />
              </Text>
              <Text>
                <FormattedMessage
                  id="component.petition-compose-variables.variable-referenced-in-update-profile-on-close-message-2"
                  defaultMessage="Update the configuration of the following { fieldsCount, plural, =1 {field} other {fields}} and try again."
                  values={{
                    fieldsCount: fieldGroups.length,
                  }}
                />
              </Text>
              <Stack spacing={1} paddingTop={2} paddingX={1}>
                {fieldGroups.map(([f, fieldIndex]) => (
                  <HStack key={f.id} alignItems="flex-start">
                    <PetitionFieldTypeIndicator
                      as="span"
                      type={f.type}
                      fieldIndex={fieldIndex}
                      marginTop={1}
                    />

                    <OverflownText flex="1">
                      <PetitionFieldReference field={f} fontWeight="normal" />
                    </OverflownText>
                  </HStack>
                ))}
              </Stack>
            </Stack>
          ),
        });
      } else if (isApolloError(error, "VARIABLE_IS_REFERENCED_ERROR")) {
        const referencingMath = allFieldsWithIndices.filter(([f]) =>
          (error.errors[0].extensions?.referencingFieldInMathIds as string[])?.includes(f.id),
        );

        const referencingVisibility = allFieldsWithIndices.filter(([f]) =>
          (error.errors[0].extensions?.referencingFieldInVisibilityIds as string[])?.includes(f.id),
        );

        await handleReferencingFieldsError(referencingMath, referencingVisibility, name);
        await showConfirmDeleteVariableDialog();
        await deletePetitionVariable({
          variables: {
            petitionId: petition.id,
            name,
          },
        });
      }
    }
    return true;
  };

  async function handleReferencingFieldsError(
    referencingMath: [field: PetitionComposeVariables_PetitionFieldFragment, fieldIndex: string][],
    referencingVisibility: [
      field: PetitionComposeVariables_PetitionFieldFragment,
      fieldIndex: string,
    ][],

    name: string,
  ) {
    await showReferencedCalculationsDialog({
      fieldsWithIndices: uniqueBy(
        [...referencingMath, ...referencingVisibility],
        ([_, fieldIndex]) => fieldIndex,
      ),
      referencedInMath: referencingMath.length > 0,
      referencesInVisibility: referencingVisibility.length > 0,
    });
    for (const [field] of referencingVisibility) {
      const visibility = field.visibility! as PetitionFieldVisibility;
      const conditions = visibility.conditions.filter(
        (c) => !("variableName" in c && c?.variableName === name),
      );
      await handleEditField(field.id, {
        visibility: conditions.length > 0 ? { ...visibility, conditions } : null,
      });
    }
    for (const [field] of referencingMath) {
      const newMath = (field.math! as PetitionFieldMath)
        .map((calc) => {
          const conditions = calc.conditions.filter(
            (c) => !("variableName" in c && c?.variableName === name),
          );

          const operations = calc.operations.filter(
            (o) =>
              !(
                ("variable" in o && o.variable === name) ||
                (o.operand.type === "VARIABLE" && o.operand.name === name)
              ),
          );

          if (!conditions.length || !operations.length) {
            return null;
          }

          return {
            ...calc,
            conditions,
            operations,
          };
        })
        .filter(isNonNullish);

      await handleEditField(field.id, {
        math: newMath.length > 0 ? newMath : null,
      });
    }
  }

  const showUpdateNumericVariableDialog = useUpdateNumericPetitionVariableDialog();
  const showUpdateEnumVariableDialog = useUpdateEnumPetitionVariableDialog();

  const handleEditVariable = async (
    variable: PetitionComposeVariables_PetitionVariableFragment,
  ) => {
    try {
      if (variable.type === "NUMBER") {
        await showUpdateNumericVariableDialog({
          petitionId: petition.id,
          variable,
          onDelete: handleDeleteVariable,
        });
      } else {
        await showUpdateEnumVariableDialog({
          petitionId: petition.id,
          variable,
          onDelete: handleDeleteVariable,
        });
      }
    } catch {}
  };

  const copyFormula = useClipboardWithToast({
    text: intl.formatMessage({
      id: "component.copy-liquid-reference-button.reference-copied",
      defaultMessage: "Copied to clipboard!",
    }),
  });

  const showCalculationRulesDialog = usePetitionComposeCalculationRulesDialog();

  const handleViewCalculationRules = async ({
    name,
    type,
  }: {
    name: string;
    type: PetitionVariableType;
  }) => {
    try {
      await showCalculationRulesDialog({
        petitionId: petition.id,
        variableName: name,
        variableType: type,
      });
    } catch {}
  };

  return (
    <Stack padding={4} spacing={2}>
      <Stack spacing={1} paddingBottom={2}>
        <Text>
          <FormattedMessage
            id="component.petition-compose-variables.description"
            defaultMessage="Define variables to perform calculations based on answers."
          />
        </Text>
        <Flex>
          <HelpCenterLink articleId={8575034} display="flex" alignItems="center">
            <FormattedMessage
              id="component.petition-compose-variables.more-about-variables-link"
              defaultMessage="More about variables"
            />
          </HelpCenterLink>
        </Flex>
      </Stack>

      {petition.variables.length === 0 ? (
        <Text color="gray.400">
          <FormattedMessage
            id="component.petition-compose-variables.no-variables-available"
            defaultMessage="No variables available"
          />
        </Text>
      ) : (
        petition.variables.map((variable) => {
          return (
            <HStack key={variable.name} spacing={4}>
              <IconButtonWithTooltip
                icon={<BracesIcon />}
                fontSize="16px"
                onClick={() => copyFormula({ value: `{{ ${variable.name} }}` })}
                size="sm"
                label={intl.formatMessage({
                  id: "component.copy-liquid-reference-button.copy-reference",
                  defaultMessage: "Copy reference",
                })}
                isDisabled={isReadOnly}
              />

              <Flex flex="1" alignContent="center" minWidth="0">
                <VariableReference variable={variable} />
              </Flex>
              <HStack>
                <IconButtonWithTooltip
                  variant="outline"
                  label={intl.formatMessage({
                    id: "component.petition-compose-variables.show-calculation-steps",
                    defaultMessage: "Show calculation steps",
                  })}
                  icon={<CalculatorIcon boxSize={4} />}
                  size="sm"
                  onClick={() =>
                    handleViewCalculationRules({ name: variable.name, type: variable.type })
                  }
                />

                <IconButtonWithTooltip
                  variant="outline"
                  label={intl.formatMessage({
                    id: "component.petition-compose-variables.edit-variable",
                    defaultMessage: "Edit variable",
                  })}
                  icon={<EditIcon />}
                  size="sm"
                  onClick={() => handleEditVariable(variable)}
                  isDisabled={isReadOnly}
                />

                <MoreLiquidVariablesButton name={variable.name} isDisabled={isReadOnly} />
              </HStack>
            </HStack>
          );
        })
      )}

      {isReadOnly ? null : (
        <Box paddingY={2}>
          <Button
            leftIcon={<AddIcon boxSize={3} />}
            variant="outline"
            size="sm"
            fontSize="md"
            onClick={handleAddNewVariable}
            fontWeight={400}
          >
            <FormattedMessage
              id="component.petition-compose-variables.add-variable"
              defaultMessage="Add variable"
            />
          </Button>
        </Box>
      )}
    </Stack>
  );
}

const _fragments = {
  PetitionVariable: gql`
    fragment PetitionComposeVariables_PetitionVariable on PetitionVariable {
      name
      type
      ...VariableReference_PetitionVariable
      ...useCreatePetitionVariableDialog_PetitionVariable
    }
  `,
  PetitionField: gql`
    fragment PetitionComposeVariables_PetitionField on PetitionField {
      id
      visibility
      math
      ...ReferencedCalculationsDialog_PetitionField
    }
  `,
  PetitionBase: gql`
    fragment PetitionComposeVariables_PetitionBase on PetitionBase {
      id
      variables {
        ...PetitionComposeVariables_PetitionVariable
      }
      lastChangeAt
    }
  `,
};

const _mutations = [
  gql`
    mutation PetitionComposeVariables_deletePetitionVariable($petitionId: GID!, $name: String!) {
      deletePetitionVariable(petitionId: $petitionId, name: $name) {
        ...PetitionComposeVariables_PetitionBase
      }
    }
  `,
  gql`
    mutation PetitionComposeVariables_updatePetitionField(
      $petitionId: GID!
      $fieldId: GID!
      $data: UpdatePetitionFieldInput!
      $force: Boolean
    ) {
      updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data, force: $force) {
        id
        ...PetitionComposeVariables_PetitionField
        petition {
          id
          lastChangeAt
        }
      }
    }
  `,
];

interface MoreLiquidVariablesButtonProps extends Omit<IconButtonWithTooltipProps, "label"> {
  name: string;
}

const MoreLiquidVariablesButton = chakraForwardRef<"button", MoreLiquidVariablesButtonProps>(
  function MoreLiquidVariablesButton({ name, ...props }, ref) {
    const intl = useIntl();
    const copyReference = useClipboardWithToast({
      text: intl.formatMessage({
        id: "component.more-liquid-variables-button.formula-copied-alert",
        defaultMessage: "Formula copied to clipboard",
      }),
    });

    const references = [
      {
        title: intl.formatMessage({
          id: "component.more-liquid-variables-button.current-value",
          defaultMessage: "Current value",
        }),
        description: intl.formatMessage({
          id: "component.more-liquid-variables-button.current-value-description",
          defaultMessage: "Shows the result up to this field.",
        }),
        builder: (name: string) => `{{ ${name}.after }}`,
      },
      {
        title: intl.formatMessage({
          id: "component.more-liquid-variables-button.final-value",
          defaultMessage: "Final value",
        }),
        description: intl.formatMessage({
          id: "component.more-liquid-variables-button.final-value-description",
          defaultMessage: "Shows the final result.",
        }),
        builder: (name: string) => `{{ ${name} }}`,
      },
    ];

    return (
      <Menu>
        <MenuButton
          onClick={(event) => {
            event.stopPropagation();
          }}
          ref={ref}
          as={IconButtonWithTooltip}
          label={intl.formatMessage({
            id: "component.more-liquid-variables-button.formulas",
            defaultMessage: "Formulas",
          })}
          icon={<MoreVerticalIcon />}
          size="sm"
          variant="outline"
          {...props}
        />

        <Portal>
          <MenuList width="min-content" minWidth="20rem">
            <Heading
              paddingX={4}
              paddingTop={1}
              paddingBottom={1.5}
              as="h4"
              size="xs"
              textTransform="uppercase"
            >
              <FormattedMessage
                id="component.more-liquid-variables-button.formulas"
                defaultMessage="Formulas"
              />
            </Heading>
            {references.map(({ title, description, builder }, index) => (
              <MenuItem
                onClick={async (event) => {
                  event.stopPropagation();
                  try {
                    copyReference({ value: builder(name) });
                  } catch {}
                }}
                key={index}
              >
                <Stack spacing={1}>
                  <Text fontSize="md" fontWeight="bold">
                    {title}
                  </Text>
                  <Text fontSize="sm">{description}</Text>
                </Stack>
              </MenuItem>
            ))}
            <MenuDivider />
            <MenuItem
              icon={<HelpOutlineIcon display="block" boxSize={4} />}
              as={NakedHelpCenterLink}
              articleId={6323096}
            >
              <FormattedMessage id="generic.learn-more" defaultMessage="Learn more" />
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    );
  },
);

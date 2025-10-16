import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  Badge,
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
  Text,
} from "@chakra-ui/react";
import { Menu } from "@parallel/chakra/components";
import {
  AddIcon,
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
  PetitionComposeVariables_deletePetitionVariableDocument,
  PetitionComposeVariables_updatePetitionFieldDocument,
  PetitionVariable,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { PetitionFieldMath, PetitionFieldVisibility } from "@parallel/utils/fieldLogic/types";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, uniqueBy } from "remeda";
import { HelpCenterLink, NakedHelpCenterLink } from "../common/HelpCenterLink";
import { IconButtonWithTooltip, IconButtonWithTooltipProps } from "../common/IconButtonWithTooltip";
import { OverflownText } from "../common/OverflownText";
import { useConfirmDeleteVariableDialog } from "./dialogs/ConfirmDeleteVariableDialog";
import { useCreateOrUpdatePetitionVariableDialog } from "./dialogs/CreateOrUpdatePetitionVariableDialog";
import { usePetitionComposeCalculationRulesDialog } from "./dialogs/PetitionComposeCalculationRulesDialog";
import {
  ReferencedCalculationsDialog,
  useReferencedCalculationsDialog,
} from "./dialogs/ReferencedCalculationsDialog";

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

  const [updatePetitionField] = useMutation(PetitionComposeVariables_updatePetitionFieldDocument);
  const handleEditField = async (fieldId: string, data: UpdatePetitionFieldInput) => {
    try {
      await updatePetitionField({
        variables: { petitionId: petition.id, fieldId, data },
      });
    } catch {}
  };

  const showCreateOrEditVariableDialog = useCreateOrUpdatePetitionVariableDialog();
  const handleAddNewVariable = async () => {
    try {
      await showCreateOrEditVariableDialog({
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
    const referencingMath = allFieldsWithIndices.filter(([f]) =>
      (f.math as PetitionFieldMath)?.some(
        (calc) =>
          calc.conditions.some((c) => "variableName" in c && c.variableName === name) ||
          calc.operations.some(
            (o) =>
              ("variable" in o && o.variable === name) ||
              (o.operand.type === "VARIABLE" && o.operand.name === name),
          ),
      ),
    );

    const referencingVisibility = allFieldsWithIndices.filter(([f]) =>
      (f.visibility as PetitionFieldVisibility)?.conditions.some(
        (c) => "variableName" in c && c.variableName === name,
      ),
    );

    if (referencingMath.length || referencingVisibility.length) {
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
    } else {
      await showConfirmDeleteVariableDialog();
    }
    await deletePetitionVariable({
      variables: {
        petitionId: petition.id,
        name,
      },
    });
  };

  const handleEditVariable = async (variable: PetitionVariable) => {
    try {
      await showCreateOrEditVariableDialog({
        petitionId: petition.id,
        variable,
        onDelete: handleDeleteVariable,
      });
    } catch {}
  };

  const copyFormula = useClipboardWithToast({
    text: intl.formatMessage({
      id: "component.copy-liquid-reference-button.reference-copied",
      defaultMessage: "Copied to clipboard!",
    }),
  });

  const showCalculationRulesDialog = usePetitionComposeCalculationRulesDialog();

  const handleViewCalculationRules = async (variableName: string) => {
    try {
      await showCalculationRulesDialog({
        petitionId: petition.id,
        variableName,
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
                <OverflownText
                  as={Badge}
                  colorScheme="blue"
                  textTransform="inherit"
                  fontSize="md"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  minWidth="0"
                >
                  {variable.name}
                </OverflownText>
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
                  onClick={() => handleViewCalculationRules(variable.name)}
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

PetitionComposeVariables.fragments = {
  PetitionField: gql`
    fragment PetitionComposeVariables_PetitionField on PetitionField {
      id
      visibility
      math
      ...ReferencedCalculationsDialog_PetitionField
    }
    ${ReferencedCalculationsDialog.fragments.PetitionField}
  `,
  PetitionBase: gql`
    fragment PetitionComposeVariables_PetitionBase on PetitionBase {
      id
      variables {
        name
        defaultValue
        ...CreateOrUpdatePetitionVariableDialog_PetitionVariable
      }
      lastChangeAt
    }
    ${useCreateOrUpdatePetitionVariableDialog.fragments.PetitionVariable}
  `,
};

const _mutations = [
  gql`
    mutation PetitionComposeVariables_deletePetitionVariable($petitionId: GID!, $name: String!) {
      deletePetitionVariable(petitionId: $petitionId, name: $name) {
        ...PetitionComposeVariables_PetitionBase
      }
    }
    ${PetitionComposeVariables.fragments.PetitionBase}
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
    ${PetitionComposeVariables.fragments.PetitionField}
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

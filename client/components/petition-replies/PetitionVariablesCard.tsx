import { gql } from "@apollo/client";

import { CalculatorIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import {
  PetitionVariablesCard_PetitionBaseFragment,
  PetitionVariableType,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { Card, CardHeader } from "../common/Card";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { VariableReference } from "../common/VariableReference";
import { usePetitionComposeCalculationRulesDialog } from "../petition-compose/dialogs/PetitionComposeCalculationRulesDialog";
import { HStack, Stack, Text } from "@parallel/components/ui";

export interface PetitionSignaturesCardProps {
  petition: PetitionVariablesCard_PetitionBaseFragment;
  finalVariables: Record<string, number | string>;
}

export const PetitionVariablesCard = chakraComponent<"section", PetitionSignaturesCardProps>(
  function PetitionVariablesCard({ ref, petition, finalVariables, ...props }) {
    const intl = useIntl();

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
          showFieldLogicChanges: true,
        });
      } catch {}
    };

    return (
      <Card ref={ref} data-section="variables-card" {...props}>
        <CardHeader leftIcon={<CalculatorIcon fontSize="20px" />}>
          <FormattedMessage
            id="component.petition-variables-card.header"
            defaultMessage="Calculation results"
          />
        </CardHeader>
        <Stack gap={4} padding={4} paddingBottom={6} overflowX="auto">
          {petition.variables
            .filter((v) => v.showInReplies)
            .map((variable) => {
              const name = variable.name;
              const valueLabels =
                variable.__typename === "PetitionVariableNumber"
                  ? variable.valueLabels
                  : variable.__typename === "PetitionVariableEnum"
                    ? variable.enumLabels
                    : [];
              const finalValue = finalVariables[name];
              const label = valueLabels.find((v) => v.value === finalValue)?.label;
              return (
                <HStack key={name}>
                  <IconButtonWithTooltip
                    label={intl.formatMessage({
                      id: "component.petition-compose-variables.show-calculation-steps",
                      defaultMessage: "Show calculation steps",
                    })}
                    icon={<CalculatorIcon boxSize={4} />}
                    size="xs"
                    onClick={() => handleViewCalculationRules({ name, type: variable.type })}
                  />

                  <VariableReference variable={variable} />
                  <Text as="span">=</Text>
                  <Text>
                    {label ? (
                      <>
                        <b>{label}</b> ({finalValue})
                      </>
                    ) : (
                      finalValue
                    )}
                  </Text>
                </HStack>
              );
            })}
        </Stack>
      </Card>
    );
  },
);

const _fragments = {
  PetitionBase: gql`
    fragment PetitionVariablesCard_PetitionBase on PetitionBase {
      id
      variables {
        name
        showInReplies
        ... on PetitionVariableNumber {
          defaultValue
          valueLabels {
            value
            label
          }
        }
        ... on PetitionVariableEnum {
          defaultEnum: defaultValue
          enumLabels: valueLabels {
            value
            label
          }
        }
        ...VariableReference_PetitionVariable
      }
    }
  `,
};

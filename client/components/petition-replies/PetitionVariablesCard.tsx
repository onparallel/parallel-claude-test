import { gql } from "@apollo/client";
import { Badge, HStack, Stack, Text } from "@chakra-ui/react";
import { CalculatorIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionVariablesCard_PetitionBaseFragment } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { Card, CardHeader } from "../common/Card";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { OverflownText } from "../common/OverflownText";
import { usePetitionComposeCalculationRulesDialog } from "../petition-compose/dialogs/PetitionComposeCalculationRulesDialog";

export interface PetitionSignaturesCardProps {
  petition: PetitionVariablesCard_PetitionBaseFragment;
  finalVariables: Record<string, number>;
}

export const PetitionVariablesCard = Object.assign(
  chakraForwardRef<"section", PetitionSignaturesCardProps>(function PetitionVariablesCard(
    { petition, finalVariables, ...props },
    ref,
  ) {
    const intl = useIntl();

    const showCalculationRulesDialog = usePetitionComposeCalculationRulesDialog();

    const handleViewCalculationRules = async (variableName: string) => {
      try {
        await showCalculationRulesDialog({
          petitionId: petition.id,
          variableName,
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
        <Stack spacing={4} padding={4} paddingBottom={6} overflowX="auto">
          {petition.variables
            .filter((v) => v.showInReplies)
            .map(({ name, valueLabels }) => {
              const total = finalVariables[name];
              const label = valueLabels.find((v) => v.value === total)?.label;
              return (
                <HStack key={name}>
                  <IconButtonWithTooltip
                    label={intl.formatMessage({
                      id: "component.petition-compose-variables.show-calculation-steps",
                      defaultMessage: "Show calculation steps",
                    })}
                    icon={<CalculatorIcon boxSize={4} />}
                    size="xs"
                    onClick={() => handleViewCalculationRules(name)}
                  />
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
                    {name}
                  </OverflownText>
                  <Text as="span">=</Text>
                  <Text>
                    {label ? (
                      <>
                        <b>{label}</b> ({total})
                      </>
                    ) : (
                      total
                    )}
                  </Text>
                </HStack>
              );
            })}
        </Stack>
      </Card>
    );
  }),
  {
    fragments: {
      PetitionBase: gql`
        fragment PetitionVariablesCard_PetitionBase on PetitionBase {
          id
          variables {
            name
            defaultValue
            showInReplies
            valueLabels {
              value
              label
            }
          }
        }
      `,
    },
  },
);

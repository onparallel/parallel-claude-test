import { gql } from "@apollo/client";
import { Badge, HStack, Stack, Text } from "@chakra-ui/react";
import { CalculatorIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionVariablesCard_PetitionBaseFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { Card, CardHeader } from "../common/Card";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";

export interface PetitionSignaturesCardProps {
  petition: PetitionVariablesCard_PetitionBaseFragment;
  finalVariables: Record<string, number>;
}

export const PetitionVariablesCard = Object.assign(
  chakraForwardRef<"section", PetitionSignaturesCardProps>(function PetitionVariablesCard(
    { petition, finalVariables, ...props },
    ref,
  ) {
    return (
      <Card ref={ref} data-section="variables-card" {...props}>
        <CardHeader leftIcon={<CalculatorIcon fontSize="20px" />}>
          <FormattedMessage
            id="component.petition-variables-card.header"
            defaultMessage="Calculation results"
          />
        </CardHeader>
        <Stack spacing={4} padding={4} paddingBottom={6} overflowX="auto">
          {petition.variables.map(({ name }) => {
            const total = finalVariables[name];
            return (
              <HStack key={name}>
                <CopyToClipboardButton size="xs" fontSize="md" text={String(total)} />
                <Badge colorScheme="blue" textTransform="inherit" fontSize="md">
                  {name}
                </Badge>
                <Text as="span">=</Text>
                <Text>{total}</Text>
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
          }
        }
      `,
    },
  },
);

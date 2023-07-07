import { HStack, SystemProps, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionStatus } from "@parallel/graphql/__types";
import { usePetitionStatusColor } from "@parallel/utils/usePetitionStatusColor";
import { usePetitionStatusLabels } from "@parallel/utils/usePetitionStatusLabels";
import { PetitionStatusIcon } from "./PetitionStatusIcon";

interface PetitionStatusLabelProps {
  spacing?: SystemProps["margin"];
  status: PetitionStatus;
}

export const PetitionStatusLabel = chakraForwardRef<"div", PetitionStatusLabelProps>(
  function PetitionStatusLabel({ status, ...props }, ref) {
    const labels = usePetitionStatusLabels();
    const color = usePetitionStatusColor(status);

    return (
      <HStack ref={ref} color={color} alignContent="center" {...props}>
        <PetitionStatusIcon status={status} disableTooltip />
        <Text as="span" fontSize="sm" lineHeight="24px">
          {labels[status]}
        </Text>
      </HStack>
    );
  },
);

import { HStack, SystemProps, TypographyProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionStatus } from "@parallel/graphql/__types";
import { usePetitionStatusColor } from "@parallel/utils/usePetitionStatusColor";
import { usePetitionStatusLabels } from "@parallel/utils/usePetitionStatusLabels";
import { PetitionStatusIcon } from "./PetitionStatusIcon";
import { Text } from "@parallel/components/ui";

interface PetitionStatusLabelProps {
  spacing?: SystemProps["margin"];
  fontSize?: TypographyProps["fontSize"];
  lineHeight?: TypographyProps["lineHeight"];
  status: PetitionStatus;
}

export const PetitionStatusLabel = chakraForwardRef<"div", PetitionStatusLabelProps>(
  function PetitionStatusLabel({ status, fontSize, lineHeight, ...props }, ref) {
    const labels = usePetitionStatusLabels();
    const color = usePetitionStatusColor(status);

    return (
      <HStack ref={ref} color={color} alignContent="center" {...props}>
        <PetitionStatusIcon status={status} disableTooltip />
        <Text as="span" fontSize={fontSize ?? "sm"} lineHeight={lineHeight ?? "24px"}>
          {labels[status]}
        </Text>
      </HStack>
    );
  },
);

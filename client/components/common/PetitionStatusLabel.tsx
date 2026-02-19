import { chakraComponent } from "@parallel/chakra/utils";
import { SystemProps, TypographyProps } from "@chakra-ui/react";
import { PetitionStatus } from "@parallel/graphql/__types";
import { usePetitionStatusColor } from "@parallel/utils/usePetitionStatusColor";
import { usePetitionStatusLabels } from "@parallel/utils/usePetitionStatusLabels";
import { PetitionStatusIcon } from "./PetitionStatusIcon";
import { HStack, Text } from "@parallel/components/ui";

interface PetitionStatusLabelProps {
  spacing?: SystemProps["margin"];
  fontSize?: TypographyProps["fontSize"];
  lineHeight?: TypographyProps["lineHeight"];
  status: PetitionStatus;
}

export const PetitionStatusLabel = chakraComponent<"div", PetitionStatusLabelProps>(
  function PetitionStatusLabel({ ref, status, fontSize, lineHeight, ...props }) {
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

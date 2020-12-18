import { Button, Text, Tooltip } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import {
  usePetitionFieldTypeColor,
  usePetitionFieldTypeLabel,
} from "@parallel/utils/petitionFields";
import { PetitionFieldTypeIcon } from "./PetitionFieldTypeIcon";

export interface PetitionFieldTypeIndicatorProps {
  type: PetitionFieldType;
  relativeIndex: number | string;
}

export const PetitionFieldTypeIndicator = chakraForwardRef<
  "button",
  PetitionFieldTypeIndicatorProps
>(function PetitionFieldTypeIndicator(
  { type, relativeIndex, ...props }: PetitionFieldTypeIndicatorProps,
  ref
) {
  const label = usePetitionFieldTypeLabel(type);
  const color = usePetitionFieldTypeColor(type);

  return (
    <Tooltip label={label}>
      <Button
        ref={ref}
        size="2xs"
        aria-label={label}
        backgroundColor={color}
        _hover={{ backgroundColor: color }}
        color="white"
        alignItems="center"
        {...props}
      >
        <PetitionFieldTypeIcon type={type} boxSize="16px" role="presentation" />
        <Text
          width={4}
          as="span"
          fontSize="xs"
          marginLeft={1}
          textAlign="center"
        >
          {relativeIndex}
        </Text>
      </Button>
    </Tooltip>
  );
});

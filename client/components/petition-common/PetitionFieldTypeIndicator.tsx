import { Button, Text, Tooltip } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import {
  usePetitionFieldTypeColor,
  usePetitionFieldTypeLabel,
} from "@parallel/utils/petitionFields";
import { PetitionFieldTypeIcon } from "./PetitionFieldTypeIcon";

export interface PetitionFieldTypeIndicatorProps {
  type: PetitionFieldType;
  fieldIndex: PetitionFieldIndex;
  isTooltipDisabled?: boolean;
}

export const PetitionFieldTypeIndicator = chakraForwardRef<
  "button",
  PetitionFieldTypeIndicatorProps
>(function PetitionFieldTypeIndicator(
  {
    type,
    fieldIndex,
    isTooltipDisabled,
    ...props
  }: PetitionFieldTypeIndicatorProps,
  ref
) {
  const label = usePetitionFieldTypeLabel(type);
  const color = usePetitionFieldTypeColor(type);

  return (
    <Tooltip label={label} isDisabled={isTooltipDisabled}>
      <Button
        ref={ref}
        size="2xs"
        aria-label={label}
        backgroundColor={color}
        _hover={{ backgroundColor: color }}
        _active={{ backgroundColor: color }}
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
          {fieldIndex}
        </Text>
      </Button>
    </Tooltip>
  );
});

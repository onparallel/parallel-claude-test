import { Tooltip } from "@parallel/chakra/components";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Button, Text } from "@parallel/components/ui";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import {
  usePetitionFieldTypeColor,
  usePetitionFieldTypeLabel,
} from "@parallel/utils/petitionFields";
import { PetitionFieldTypeIcon } from "./PetitionFieldTypeIcon";

export interface PetitionFieldTypeIndicatorProps {
  type: PetitionFieldType;
  fieldIndex?: PetitionFieldIndex;
  isTooltipDisabled?: boolean;
  isFixedWidth?: boolean;
  hideIcon?: boolean;
}

export const PetitionFieldTypeIndicator = chakraForwardRef<
  "button",
  PetitionFieldTypeIndicatorProps
>(function PetitionFieldTypeIndicator(
  {
    type,
    fieldIndex,
    isTooltipDisabled,
    hideIcon,
    isFixedWidth = true,
    ...props
  }: PetitionFieldTypeIndicatorProps,
  ref,
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
        minWidth={isFixedWidth ? 8 : undefined}
        {...props}
      >
        {hideIcon ? null : <PetitionFieldTypeIcon type={type} boxSize="16px" role="presentation" />}
        {fieldIndex ? (
          <Text
            width={isFixedWidth ? 5 : undefined}
            contentEditable={false}
            as="span"
            fontSize="xs"
            marginStart={hideIcon ? 0 : 0.5}
            textAlign="center"
          >
            {fieldIndex}
          </Text>
        ) : null}
      </Button>
    </Tooltip>
  );
});

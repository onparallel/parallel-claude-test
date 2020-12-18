import { Button, Text, Tooltip } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import {
  usePetitionFieldTypeColor,
  usePetitionFieldTypeLabel,
} from "@parallel/utils/petitionFields";
import { PetitionFieldTypeIcon } from "./PetitionFieldTypeIcon";

export type PetitionFieldTypeIndicatorProps = ExtendChakra<{
  type: PetitionFieldType;
  relativeIndex: number | string;
}>;

export function PetitionFieldTypeIndicator({
  type,
  relativeIndex,
  ...props
}: PetitionFieldTypeIndicatorProps) {
  const label = usePetitionFieldTypeLabel(type);
  const color = usePetitionFieldTypeColor(type);

  return (
    <Tooltip label={label}>
      <Button
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
}

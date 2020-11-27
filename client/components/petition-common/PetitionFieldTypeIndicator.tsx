import { Button, Text, Tooltip } from "@chakra-ui/core";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { PetitionFieldTypeIcon } from "./PetitionFieldTypeIcon";
import { ExtendChakra } from "@parallel/chakra/utils";
import { usePetitionFieldTypeLabels } from "@parallel/utils/usePetitionFieldTypeLabels";
import { useIntl } from "react-intl";

export type PetitionFieldTypeIndicatorProps = ExtendChakra<{
  type: PetitionFieldType;
  relativeIndex: number | string;
}>;

export function PetitionFieldTypeIndicator({
  type,
  relativeIndex,
  ...props
}: PetitionFieldTypeIndicatorProps) {
  const intl = useIntl();
  const labels = usePetitionFieldTypeLabels();
  const label = useMemo(() => labels[type], [type, intl.locale]);

  return (
    <Tooltip label={label}>
      <Button
        size="2xs"
        aria-label={label}
        backgroundColor={`field.${type}`}
        _hover={{ backgroundColor: `field.${type}` }}
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

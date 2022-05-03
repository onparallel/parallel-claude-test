import { Text, TextProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { usePetitionFieldTypeLabel } from "@parallel/utils/petitionFields";

interface PetitionFieldTypeTextProps extends TextProps {
  type: PetitionFieldType;
}

export const PetitionFieldTypeText = chakraForwardRef<"p", PetitionFieldTypeTextProps>(
  function PetitionFieldTypeText({ type, ...props }, ref) {
    const label = usePetitionFieldTypeLabel(type);
    return (
      <Text ref={ref} {...props}>
        {label}
      </Text>
    );
  }
);

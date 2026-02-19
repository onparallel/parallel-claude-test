import { chakraComponent } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { usePetitionFieldTypeLabel } from "@parallel/utils/petitionFields";
import { Text } from "@parallel/components/ui";

interface PetitionFieldTypeTextProps {
  type: PetitionFieldType;
}

export const PetitionFieldTypeText = chakraComponent<"p", PetitionFieldTypeTextProps>(
  function PetitionFieldTypeText({ ref, type, ...props }) {
    const label = usePetitionFieldTypeLabel(type);
    return (
      <Text ref={ref} {...props}>
        {label}
      </Text>
    );
  },
);

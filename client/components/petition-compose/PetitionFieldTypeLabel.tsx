import { Box } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { usePetitionFieldTypeColor } from "@parallel/utils/petitionFields";
import { PetitionFieldTypeIcon } from "../petition-common/PetitionFieldTypeIcon";
import { PetitionFieldTypeText } from "./PetitionFieldTypeText";

interface PetitionFieldTypeLabelProps {
  type: PetitionFieldType;
}

export const PetitionFieldTypeLabel = chakraForwardRef<"div", PetitionFieldTypeLabelProps>(
  function PetitionFieldTypeLabel({ type, ...props }, ref) {
    const color = usePetitionFieldTypeColor(type);
    return (
      <Box ref={ref} display="inline-flex" alignItems="center" {...props}>
        <Box
          backgroundColor={color}
          color="white"
          borderRadius="md"
          padding={1}
          width="28px"
          height="28px"
        >
          <PetitionFieldTypeIcon type={type} display="block" boxSize="20px" role="presentation" />
        </Box>
        <PetitionFieldTypeText
          whiteSpace="nowrap"
          type={type}
          as={"div" as any}
          flex="1"
          marginLeft={2}
        />
      </Box>
    );
  }
);

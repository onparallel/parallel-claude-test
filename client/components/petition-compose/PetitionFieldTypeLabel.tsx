import { chakraComponent } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { usePetitionFieldTypeColor } from "@parallel/utils/petitionFields";
import { Box, BoxProps } from "@parallel/components/ui";
import { PetitionFieldTypeIcon } from "../petition-common/PetitionFieldTypeIcon";
import { PetitionFieldTypeText } from "./PetitionFieldTypeText";

interface PetitionFieldTypeLabelProps {
  type: PetitionFieldType;
  labelProps?: BoxProps;
}

export const PetitionFieldTypeLabel = chakraComponent<"div", PetitionFieldTypeLabelProps>(
  function PetitionFieldTypeLabel({ ref, type, labelProps, ...props }) {
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
          marginStart={2}
          {...labelProps}
        />
      </Box>
    );
  },
);

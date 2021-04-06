import { Icon, IconProps } from "@chakra-ui/react";
import {
  FieldDynamicSelectIcon,
  FieldFileUploadIcon,
  FieldHeadingIcon,
  FieldSelectIcon,
  FieldTextIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { ElementType } from "react";

export interface PetitionFieldTypeIconProps extends IconProps {
  type: PetitionFieldType;
}

export const PetitionFieldTypeIcon = chakraForwardRef<
  "svg",
  PetitionFieldTypeIconProps
>(function PetitionFieldTypeIcon({ type, ...props }, ref) {
  const icon = ({
    FILE_UPLOAD: FieldFileUploadIcon,
    TEXT: FieldTextIcon,
    HEADING: FieldHeadingIcon,
    SELECT: FieldSelectIcon,
    DYNAMIC_SELECT: FieldDynamicSelectIcon,
  } as Record<PetitionFieldType, ElementType>)[type];
  return <Icon as={icon} {...props} ref={ref} />;
});

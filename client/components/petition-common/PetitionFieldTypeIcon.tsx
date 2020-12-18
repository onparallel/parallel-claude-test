import { Icon, IconProps } from "@chakra-ui/react";
import {
  FieldFileUploadIcon,
  FieldHeadingIcon,
  FieldSelectIcon,
  FieldTextIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";

export interface PetitionFieldTypeIconProps extends IconProps {
  type: PetitionFieldType;
}

export const PetitionFieldTypeIcon = chakraForwardRef<
  "svg",
  PetitionFieldTypeIconProps
>(function PetitionFieldTypeIcon({ type, ...props }, ref) {
  const icon = {
    FILE_UPLOAD: FieldFileUploadIcon,
    TEXT: FieldTextIcon,
    HEADING: FieldHeadingIcon,
    SELECT: FieldSelectIcon,
  }[type];
  return <Icon as={icon} {...props} ref={ref} />;
});

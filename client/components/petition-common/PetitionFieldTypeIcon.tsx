import { Icon, IconProps } from "@chakra-ui/core";
import {
  FieldFileUploadIcon,
  FieldTextIcon,
  FieldHeadingIcon,
  ChevronDownIcon,
} from "@parallel/chakra/icons";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { forwardRef } from "react";

export type PetitionFieldTypeIconProps = IconProps & {
  type: PetitionFieldType;
};

export const PetitionFieldTypeIcon = forwardRef<
  SVGSVGElement,
  PetitionFieldTypeIconProps
>(function PetitionFieldTypeIcon({ type, ...props }, ref) {
  const icon = {
    FILE_UPLOAD: FieldFileUploadIcon,
    TEXT: FieldTextIcon,
    HEADING: FieldHeadingIcon,
    SELECT: ChevronDownIcon,
  }[type];
  return <Icon as={icon} {...props} ref={ref} />;
});

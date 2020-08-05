import { Icon, IconProps } from "@chakra-ui/core";
import {
  FieldFileUploadIcon,
  FieldTextIcon,
  FieldHeadingIcon,
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
  }[type];
  return <Icon as={icon} {...props} ref={ref} />;
});

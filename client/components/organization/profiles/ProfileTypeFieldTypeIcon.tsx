import { Icon } from "@chakra-ui/react";
import {
  FieldDateIcon,
  FieldFileUploadIcon,
  FieldNumberIcon,
  FieldPhoneIcon,
  FieldShortTextIcon,
  FieldTextIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ElementType } from "react";
import { ProfileTypeFieldType } from "@parallel/graphql/__types";

export interface ProfileTypeFieldTypeIconProps {
  type: ProfileTypeFieldType;
}

export const ProfileTypeFieldTypeIcon = chakraForwardRef<"svg", ProfileTypeFieldTypeIconProps>(
  function ProfileTypeFieldTypeIcon({ type, ...props }, ref) {
    const icon = (
      {
        DATE: FieldDateIcon,
        FILE: FieldFileUploadIcon,
        NUMBER: FieldNumberIcon,
        PHONE: FieldPhoneIcon,
        SHORT_TEXT: FieldShortTextIcon,
        TEXT: FieldTextIcon,
      } as Record<ProfileTypeFieldType, ElementType>
    )[type];
    return <Icon as={icon} {...(props as any)} ref={ref} />;
  }
);

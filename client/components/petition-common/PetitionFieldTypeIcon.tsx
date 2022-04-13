import { Icon } from "@chakra-ui/react";
import {
  FieldDynamicSelectIcon,
  FieldFileUploadIcon,
  FieldHeadingIcon,
  FieldSelectIcon,
  FieldTextIcon,
  FieldShortTextIcon,
  FieldCheckboxIcon,
  FieldNumberIcon,
  FieldDateIcon,
  FieldPhoneIcon,
  FieldTaxDocumentsIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { ElementType } from "react";

export interface PetitionFieldTypeIconProps {
  type: PetitionFieldType;
}

export const PetitionFieldTypeIcon = chakraForwardRef<"svg", PetitionFieldTypeIconProps>(
  function PetitionFieldTypeIcon({ type, ...props }, ref) {
    const icon = (
      {
        FILE_UPLOAD: FieldFileUploadIcon,
        SHORT_TEXT: FieldShortTextIcon,
        TEXT: FieldTextIcon,
        HEADING: FieldHeadingIcon,
        SELECT: FieldSelectIcon,
        DYNAMIC_SELECT: FieldDynamicSelectIcon,
        CHECKBOX: FieldCheckboxIcon,
        NUMBER: FieldNumberIcon,
        DATE: FieldDateIcon,
        PHONE: FieldPhoneIcon,
        ES_TAX_DOCUMENTS: FieldTaxDocumentsIcon,
      } as Record<PetitionFieldType, ElementType>
    )[type];
    return <Icon as={icon} {...props} ref={ref} />;
  }
);

import { Icon } from "@chakra-ui/react";
import {
  DowJonesIcon,
  FieldCheckboxIcon,
  FieldDateIcon,
  FieldDateTimeIcon,
  FieldDynamicSelectIcon,
  FieldFileUploadIcon,
  FieldGroupIcon,
  FieldHeadingIcon,
  FieldNumberIcon,
  FieldPhoneIcon,
  FieldSelectIcon,
  FieldShortTextIcon,
  FieldTaxDocumentsIcon,
  FieldTextIcon,
  IdVerificationIcon,
  MediaIcon,
  ProfileSearchIcon,
  ShortSearchIcon,
  UserIcon,
} from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { ElementType } from "react";

export interface PetitionFieldTypeIconProps {
  type: PetitionFieldType;
}

export const PetitionFieldTypeIcon = chakraComponent<"svg", PetitionFieldTypeIconProps>(
  function PetitionFieldTypeIcon({ ref, type, ...props }) {
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
        DATE_TIME: FieldDateTimeIcon,
        PHONE: FieldPhoneIcon,
        ES_TAX_DOCUMENTS: FieldTaxDocumentsIcon,
        DOW_JONES_KYC: DowJonesIcon,
        BACKGROUND_CHECK: ShortSearchIcon,
        FIELD_GROUP: FieldGroupIcon,
        ID_VERIFICATION: IdVerificationIcon,
        PROFILE_SEARCH: ProfileSearchIcon,
        ADVERSE_MEDIA_SEARCH: MediaIcon,
        USER_ASSIGNMENT: UserIcon,
      } as Record<PetitionFieldType, ElementType>
    )[type];
    return <Icon as={icon} {...(props as any)} ref={ref} />;
  },
);

import { ComponentWithAs, IconProps } from "@chakra-ui/react";
import {
  FieldDateIcon,
  FieldFileUploadIcon,
  FieldNumberIcon,
  FieldPhoneIcon,
  FieldSelectIcon,
  FieldShortTextIcon,
  FieldTextIcon,
} from "@parallel/chakra/icons";
import { LocalizableUserText } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileTypeFieldType } from "@parallel/graphql/__types";
import { IntlShape } from "react-intl";
import { Maybe } from "./types";

export interface ProfileTypeFieldOptions {
  DATE: {
    useReplyAsExpiryDate?: Maybe<boolean>;
  };
  SELECT: {
    values: { label: LocalizableUserText; value: string; color?: string }[];
    showOptionsWithColors?: Maybe<boolean>;
  };
}

export const PROFILE_TYPE_FIELD_CONFIG = Object.freeze({
  SHORT_TEXT: {
    label: (intl) =>
      intl.formatMessage({
        id: "generic.profile-type-field-type-short-text",
        defaultMessage: "Short text",
      }),
    icon: FieldShortTextIcon,
    color: "yellow.400",
  },
  TEXT: {
    label: (intl) =>
      intl.formatMessage({
        id: "generic.profile-type-field-type-text",
        defaultMessage: "Long text",
      }),
    icon: FieldTextIcon,
    color: "yellow.500",
  },
  NUMBER: {
    label: (intl) =>
      intl.formatMessage({
        id: "generic.profile-type-field-type-number",
        defaultMessage: "Numbers",
      }),
    icon: FieldNumberIcon,
    color: "orange.500",
  },
  PHONE: {
    label: (intl) =>
      intl.formatMessage({
        id: "generic.profile-type-field-type-phone",
        defaultMessage: "Phone number",
      }),
    icon: FieldPhoneIcon,
    color: "orange.400",
  },
  DATE: {
    label: (intl) =>
      intl.formatMessage({
        id: "generic.profile-type-field-type-date",
        defaultMessage: "Date",
      }),
    icon: FieldDateIcon,
    color: "orange.300",
  },
  FILE: {
    label: (intl) =>
      intl.formatMessage({
        id: "generic.profile-type-field-type-file-upload",
        defaultMessage: "Documents and files",
      }),
    icon: FieldFileUploadIcon,
    color: "teal.400",
  },
  SELECT: {
    label: (intl) =>
      intl.formatMessage({
        id: "generic.profile-type-field-type-select",
        defaultMessage: "Select",
      }),
    icon: FieldSelectIcon,
    color: "pink.400",
  },
} as Record<
  ProfileTypeFieldType,
  { icon: ComponentWithAs<"svg", IconProps>; label: (intl: IntlShape) => string; color: string }
>);

export const PROFILE_TYPE_FIELDS = Object.freeze(
  Object.keys(PROFILE_TYPE_FIELD_CONFIG) as ProfileTypeFieldType[],
);

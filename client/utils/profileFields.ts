import { ComponentWithAs, IconProps } from "@chakra-ui/react";
import {
  FieldCheckboxIcon,
  FieldDateIcon,
  FieldFileUploadIcon,
  FieldNumberIcon,
  FieldPhoneIcon,
  FieldSelectIcon,
  FieldShortTextIcon,
  FieldTextIcon,
  MediaIcon,
  ShortSearchIcon,
} from "@parallel/chakra/icons";
import { LocalizableUserText } from "@parallel/components/common/LocalizableUserTextRender";
import type { IProfileFieldMonitoringSettings } from "@parallel/components/organization/profiles/settings/ProfileFieldMonitoringSettings";
import { ProfileTypeFieldType } from "@parallel/graphql/__types";
import { IntlShape } from "react-intl";
import { Maybe } from "./types";

export type ProfileTypeFieldOptions<TType extends ProfileTypeFieldType> = {
  FILE: {};
  NUMBER: {};
  PHONE: {};
  SHORT_TEXT: { format?: Maybe<string> };
  TEXT: {};
  DATE: {
    useReplyAsExpiryDate?: Maybe<boolean>;
  };
  SELECT: {
    values: {
      label: LocalizableUserText;
      value: string;
      color?: string;
      isStandard?: boolean;
    }[];
    showOptionsWithColors?: Maybe<boolean>;
    standardList?: Maybe<string>;
  };
  CHECKBOX: {
    values: {
      label: LocalizableUserText;
      value: string;
    }[];
    standardList?: Maybe<string>;
  };
  BACKGROUND_CHECK: IProfileFieldMonitoringSettings;
  ADVERSE_MEDIA_SEARCH: IProfileFieldMonitoringSettings;
}[TType];

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

  CHECKBOX: {
    label: (intl) =>
      intl.formatMessage({
        id: "generic.profile-type-field-type-checkbox",
        defaultMessage: "Multiple choice",
      }),
    icon: FieldCheckboxIcon,
    color: "#805AD5",
  },
  BACKGROUND_CHECK: {
    label: (intl) =>
      intl.formatMessage({
        id: "generic.profile-type-field-type-background-check",
        defaultMessage: "Background check",
      }),
    icon: ShortSearchIcon,
    color: "green.700",
  },
  ADVERSE_MEDIA_SEARCH: {
    label: (intl) =>
      intl.formatMessage({
        id: "generic.profile-type-field-type-adverse-media-search",
        defaultMessage: "Adverse media search",
      }),
    icon: MediaIcon,
    color: "green.700",
  },
} as Record<
  ProfileTypeFieldType,
  { icon: ComponentWithAs<"svg", IconProps>; label: (intl: IntlShape) => string; color: string }
>);

export const PROFILE_TYPE_FIELDS = Object.freeze(
  Object.keys(PROFILE_TYPE_FIELD_CONFIG) as ProfileTypeFieldType[],
);

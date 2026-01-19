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
  UserIcon,
} from "@parallel/chakra/icons";
import { LocalizableUserText } from "@parallel/components/common/LocalizableUserTextRender";
import type { IProfileFieldMonitoringSettings } from "@parallel/components/organization/profiles/settings/ProfileFieldMonitoringSettings";
import { BackgroundCheckEntitySearchType, ProfileTypeFieldType } from "@parallel/graphql/__types";
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
      isHidden?: boolean;
    }[];
    showOptionsWithColors?: Maybe<boolean>;
    standardList?: Maybe<string>;
  };
  CHECKBOX: {
    values: {
      label: LocalizableUserText;
      value: string;
      isHidden?: boolean;
    }[];
    standardList?: Maybe<string>;
  };
  BACKGROUND_CHECK: IProfileFieldMonitoringSettings & {
    autoSearchConfig?: {
      // name and date are globalIds pointing to SHORT_TEXT and DATE fields on the profile type
      name: string[];
      date: string | null;
      type: BackgroundCheckEntitySearchType | null;
      country: string | null;
      birthCountry: string | null;
      activationCondition: {
        profileTypeFieldId: string;
        values: string[];
      } | null;
    } | null;
  };
  ADVERSE_MEDIA_SEARCH: IProfileFieldMonitoringSettings;
  USER_ASSIGNMENT: {
    allowedUserGroupId?: Maybe<string>;
  };
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
  USER_ASSIGNMENT: {
    label: (intl) =>
      intl.formatMessage({
        id: "generic.profile-type-field-type-user-assignment",
        defaultMessage: "User assignment",
      }),
    icon: UserIcon,
    color: "blue.500",
  },
} as Record<
  ProfileTypeFieldType,
  { icon: ComponentWithAs<"svg", IconProps>; label: (intl: IntlShape) => string; color: string }
>);

export const PROFILE_TYPE_FIELDS = Object.freeze(
  Object.keys(PROFILE_TYPE_FIELD_CONFIG) as ProfileTypeFieldType[],
);

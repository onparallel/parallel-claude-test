import { gql } from "@apollo/client";
import { Badge, FormControl, FormLabel, HStack } from "@chakra-ui/react";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import {
  ProfileField_ProfileFieldFileFragment,
  ProfileField_ProfileFieldValueFragment,
  ProfileField_ProfileTypeFieldFragment,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { ProfileFieldDate } from "./ProfileFieldDate";
import { ProfileFieldFileUpload } from "./ProfileFieldFileUpload";
import { ProfileFieldNumber } from "./ProfileFieldNumber";
import { ProfileFieldPhone } from "./ProfileFieldPhone";
import { ProfileFieldShortText } from "./ProfileFieldShortText";
import { ProfileFieldText } from "./ProfileFieldText";

export interface ProfileFieldProps {
  index: number;
  isDirty: boolean;
  isInvalid: boolean;
  profileId: string;
  field: ProfileField_ProfileTypeFieldFragment;
  value?: ProfileField_ProfileFieldValueFragment | null;
  files?: ProfileField_ProfileFieldFileFragment[] | null;
}

export function ProfileField(props: ProfileFieldProps) {
  const intl = useIntl();
  const { field, isDirty, isInvalid } = props;

  return (
    <FormControl as="li" key={field.id} listStyleType="none" isInvalid={isInvalid}>
      <HStack justify="space-between" marginBottom={1}>
        <FormLabel fontSize="sm" fontWeight={400} color="gray.600" margin={0}>
          <LocalizableUserTextRender
            value={field.name}
            default={intl.formatMessage({
              id: "generic.unnamed-profile-type-field",
              defaultMessage: "Unnamed property",
            })}
          />
        </FormLabel>
        {isDirty ? (
          <Badge colorScheme="blue">
            <FormattedMessage id="generic.edited-indicator" defaultMessage="Edited" />
          </Badge>
        ) : null}
      </HStack>
      {field.type === "FILE" ? (
        <ProfileFieldFileUpload {...props} />
      ) : field.type === "DATE" ? (
        <ProfileFieldDate {...props} />
      ) : field.type === "NUMBER" ? (
        <ProfileFieldNumber {...props} />
      ) : field.type === "PHONE" ? (
        <ProfileFieldPhone {...props} />
      ) : field.type === "TEXT" ? (
        <ProfileFieldText {...props} />
      ) : field.type === "SHORT_TEXT" ? (
        <ProfileFieldShortText {...props} />
      ) : null}
    </FormControl>
  );
}

ProfileField.fragments = {
  get ProfileTypeField() {
    return gql`
      fragment ProfileField_ProfileTypeField on ProfileTypeField {
        id
        name
        type
      }
    `;
  },
  get ProfileFieldValue() {
    return gql`
      fragment ProfileField_ProfileFieldValue on ProfileFieldValue {
        id
        content
      }
    `;
  },
  get ProfileFieldFile() {
    return gql`
      fragment ProfileField_ProfileFieldFile on ProfileFieldFile {
        ...ProfileFieldFileUpload_ProfileFieldFile
      }
      ${ProfileFieldFileUpload.fragments.ProfileFieldFile}
    `;
  },
};

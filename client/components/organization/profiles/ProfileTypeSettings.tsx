import { gql } from "@apollo/client";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Stack,
  Text,
} from "@chakra-ui/react";
import { SettingsIcon } from "@parallel/chakra/icons";
import { Card, CardHeader, CardProps } from "@parallel/components/common/Card";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import {
  localizableUserTextRender,
  LocalizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { PlaceholderInput } from "@parallel/components/common/slate/PlaceholderInput";
import { ProfileTypeSettings_ProfileTypeFragment } from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { isNotEmptyText } from "@parallel/utils/strings";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { useAutoConfirmDiscardChangesDialog } from "../dialogs/ConfirmDiscardChangesDialog";
import { MaybePromise } from "@parallel/utils/types";

interface ProfileTypeSettingsProps extends CardProps {
  profileType: ProfileTypeSettings_ProfileTypeFragment;
  onSave: (pattern: string) => MaybePromise<void>;
}

export function ProfileTypeSettings({ profileType, onSave, ...props }: ProfileTypeSettingsProps) {
  const intl = useIntl();

  const {
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<{ pattern: string }>({
    defaultValues: { pattern: profileType.profileNamePattern },
  });

  useAutoConfirmDiscardChangesDialog(isDirty);

  const placeholders = profileType.fields
    .filter(
      (field) =>
        ["SHORT_TEXT", "SELECT"].includes(field.type) && field.defaultPermission !== "HIDDEN",
    )
    .map((field) => ({
      key: field.id,
      text: localizableUserTextRender({
        value: field.name,
        intl,
        default: intl.formatMessage({
          id: "generic.unnamed-profile-type-field",
          defaultMessage: "Unnamed property",
        }),
      }),
    }));

  const isPatternDisabled = profileType.isStandard;

  return (
    <Card
      {...props}
      as="form"
      onSubmit={handleSubmit(async (data) => {
        try {
          await onSave(data.pattern);
          reset(data);
        } catch (e) {
          if (isApolloError(e, "INVALID_PROFILE_NAME_PATTERN")) {
            setError("pattern", { type: "invalid_pattern" });
          }
        }
      })}
    >
      <CardHeader leftIcon={<SettingsIcon />} headingSize="md" headingLevel="h2">
        <FormattedMessage id="component.profile-type-settings.settings" defaultMessage="Settings" />
      </CardHeader>
      <FormControl
        id="pattern"
        isInvalid={!!errors.pattern}
        isDisabled={isPatternDisabled}
        as={Stack}
        paddingX={6}
        paddingY={4}
        direction={{ base: "column", lg: "row" }}
      >
        <FormLabel
          whiteSpace="nowrap"
          display="flex"
          alignItems="center"
          alignSelf="start"
          marginTop="2"
          fontWeight={400}
        >
          <Text>
            <FormattedMessage
              id="component.profile-type-settings.profile-name-pattern"
              defaultMessage="Profile name"
            />
          </Text>
          <HelpPopover>
            <Text>
              <FormattedMessage
                id="component.profile-type-settings.name-of-each-profile-help"
                defaultMessage="Specify how the name of the profiles of type <b>{ProfileName}</b> will be generated. If you change it, existing profiles of this type will be updated."
                values={{
                  ProfileName: (
                    <LocalizableUserTextRender
                      value={profileType.name}
                      default={intl.formatMessage({
                        id: "generic.unnamed-profile-type",
                        defaultMessage: "Unnamed profile type",
                      })}
                    />
                  ),
                }}
              />
            </Text>
          </HelpPopover>
        </FormLabel>
        <Stack flex="1" minW={0}>
          <Controller
            name="pattern"
            control={control}
            rules={{
              required: true,
              validate: { isNotEmptyText },
            }}
            render={({ field: { value, onChange } }) => (
              <PlaceholderInput
                key={profileType.id}
                value={value}
                placeholder={intl.formatMessage({
                  id: "component.profile-type-settings.profile-name-pattern-placeholder",
                  defaultMessage: "Select a property",
                })}
                onChange={onChange}
                placeholders={placeholders}
                isDisabled={isPatternDisabled}
              />
            )}
          />
          {errors.pattern?.type === "invalid_pattern" ? (
            <FormErrorMessage>
              <FormattedMessage
                id="component.profile-type-settings.add-profile-type-field-to-name-error"
                defaultMessage="Please add a property to the name"
              />
            </FormErrorMessage>
          ) : null}
        </Stack>
        <Box paddingTop={{ base: 2, lg: 0 }} alignSelf={{ base: "end", lg: "start" }}>
          <Button isDisabled={!isDirty} colorScheme="primary" type="submit">
            <FormattedMessage id="generic.save-changes" defaultMessage="Save changes" />
          </Button>
        </Box>
      </FormControl>
    </Card>
  );
}

ProfileTypeSettings.fragments = {
  get ProfileTypeField() {
    return gql`
      fragment ProfileTypeSettings_ProfileTypeField on ProfileTypeField {
        id
        name
        type
        defaultPermission
      }
    `;
  },
  get ProfileType() {
    return gql`
      fragment ProfileTypeSettings_ProfileType on ProfileType {
        id
        name
        fields {
          ...ProfileTypeSettings_ProfileTypeField
        }
        isStandard
        profileNamePattern
      }
      ${this.ProfileTypeField}
    `;
  },
};

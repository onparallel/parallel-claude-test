import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { FormControl, FormErrorMessage, FormLabel, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  LocalizableUserText,
  localizableUserTextRender,
  LocalizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileTypeSelect } from "@parallel/components/common/ProfileTypeSelect";
import { Button } from "@parallel/components/ui";
import {
  CreateProfileFieldValueInput,
  useCreateProfileDialog_createProfileDocument,
  useCreateProfileDialog_ProfileFragment,
  useCreateProfileDialog_profileTypeDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { Focusable } from "@parallel/utils/types";
import { useEffect, useRef } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { ProfileFormFieldSelect } from "../form-fields/ProfileFormFieldSelect";
import { ProfileFormFieldShortText } from "../form-fields/ProfileFormFieldShortText";

interface CreateProfileFormData {
  profileTypeId: string | null;
  fields: Record<string, CreateProfileFieldValueInput>;
}

interface CreateProfileDialogResult {
  profile: useCreateProfileDialog_ProfileFragment;
  hasValues: boolean;
}

interface CreateProfileDialogProps {
  suggestedName?: string;
  profileTypeId?: string;
  profileTypeName?: LocalizableUserText;
  profileFieldValues?: Record<string, string | number>;
}

function CreateProfileDialog({
  profileTypeId,
  profileTypeName,
  suggestedName,
  profileFieldValues,
  ...props
}: DialogProps<CreateProfileDialogProps, CreateProfileDialogResult>) {
  const intl = useIntl();

  const form = useForm<CreateProfileFormData>({
    defaultValues: {
      profileTypeId: profileTypeId ?? null,
      fields: {},
    },
  });
  const {
    control,
    formState: { errors },
    watch,
    handleSubmit,
    setFocus,
    setError,
    reset,
  } = form;

  const _profileTypeId = watch("profileTypeId");
  const [createProfile, { loading }] = useMutation(useCreateProfileDialog_createProfileDocument);

  const selectRef = useRef<Focusable>({
    focus: () => {
      setFocus("profileTypeId");
    },
  });

  const isFixedTypeMode = isNonNullish(profileTypeName) && isNonNullish(profileTypeId);
  const { data: profileTypeData } = useQuery(useCreateProfileDialog_profileTypeDocument, {
    variables: { profileTypeId: _profileTypeId! },
    skip: isNullish(_profileTypeId),
  });

  const fieldsForProfileName =
    profileTypeData?.profileType.fields.filter((f) => f.isUsedInProfileName) || [];

  useEffect(() => {
    if (isNonNullish(profileTypeData) && fieldsForProfileName.length > 0) {
      const fieldsData: Record<string, CreateProfileFieldValueInput> = {};

      if (profileFieldValues) {
        fieldsForProfileName.forEach((field) => {
          fieldsData[field.id] = {
            profileTypeFieldId: field.id,
            content: { value: profileFieldValues[field.id] },
          };
        });
      } else {
        const suggestions = (suggestedName ?? "").split(" ");
        fieldsForProfileName.forEach((field, index) => {
          const defaultValue = field.type === "SHORT_TEXT" ? "" : null;
          const moreShortTextsAfterThis = fieldsForProfileName
            .slice(index + 1)
            .some((f) => f.type === "SHORT_TEXT");
          const value =
            field.myPermission !== "WRITE"
              ? defaultValue
              : moreShortTextsAfterThis
                ? (suggestions.shift() ?? "")
                : suggestions.join(" ");

          fieldsData[field.id] = {
            profileTypeFieldId: field.id,
            content: { value },
          };
        });
      }

      reset({
        profileTypeId: _profileTypeId,
        fields: fieldsData,
      });

      setTimeout(() => {
        const firstFieldId = fieldsForProfileName[0]?.id;
        if (firstFieldId) {
          setFocus(`fields.${firstFieldId}.content.value`);
        }
      }, 100);
    }
  }, [profileTypeData, profileFieldValues, suggestedName]);

  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      size="md"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async ({ profileTypeId, fields }) => {
            try {
              const profile = await createProfile({
                variables: {
                  profileTypeId: profileTypeId!,
                  fields: Object.values(fields).filter(
                    (value) => isNonNullish(value?.content?.value) && value!.content!.value !== "",
                  ),
                },
              });
              props.onResolve({
                profile: profile.data!.createProfile,
                hasValues: Object.keys(fields).length > 0,
              });
            } catch (e) {
              if (isApolloError(e, "PROFILE_FIELD_VALUE_UNIQUE_CONSTRAINT")) {
                const { conflicts } = e.errors[0].extensions as {
                  conflicts: { profileTypeFieldId: string; profileId: string }[];
                };
                for (const conflict of conflicts) {
                  setError(
                    `fields.${conflict.profileTypeFieldId}.content.value`,
                    { type: "unique" },
                    { shouldFocus: true },
                  );
                }
                return;
              } else if (isApolloError(e, "INVALID_PROFILE_FIELD_VALUE")) {
                const aggregatedErrors =
                  (e.errors[0].extensions!.aggregatedErrors as {
                    profileTypeFieldId: string;
                    code: string;
                  }[]) ?? [];

                for (const err of aggregatedErrors) {
                  setError(`fields.${err.profileTypeFieldId}.content.value`, { type: "validate" });
                }
              }
            }
          }),
        },
      }}
      initialFocusRef={isFixedTypeMode ? undefined : selectRef}
      header={
        isNonNullish(profileTypeName) ? (
          <FormattedMessage
            id="generic.create-name"
            defaultMessage="Create {name}"
            values={{
              name: localizableUserTextRender({
                value: profileTypeName,
                intl,
                default: intl.formatMessage({
                  id: "generic.unnamed-profile-type",
                  defaultMessage: "Unnamed profile type",
                }),
              }).toLowerCase(),
            }}
          />
        ) : (
          <FormattedMessage
            id="component.create-profile-dialog.new-profile"
            defaultMessage="New profile"
          />
        )
      }
      body={
        <Stack spacing={4}>
          {isFixedTypeMode ? null : (
            <FormControl
              isInvalid={!!errors.profileTypeId}
              isDisabled={isNonNullish(profileTypeId)}
            >
              <FormLabel fontWeight={400}>
                <FormattedMessage
                  id="component.create-profile-dialog.profile-type"
                  defaultMessage="Profile type"
                />
              </FormLabel>
              <Controller
                name="profileTypeId"
                control={control}
                rules={{ required: true }}
                render={({ field: { onChange, ...props } }) => (
                  <ProfileTypeSelect
                    defaultOptions
                    onChange={(v) => {
                      onChange(v?.id ?? null);
                      reset({
                        profileTypeId: v?.id ?? null,
                        fields: {},
                      });
                    }}
                    showOnlyCreatable
                    {...props}
                  />
                )}
              />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.field-required-error"
                  defaultMessage="This field is required"
                />
              </FormErrorMessage>
            </FormControl>
          )}
          <FormProvider {...form}>
            {fieldsForProfileName.map((profileTypeField) => {
              return (
                <FormControl
                  key={profileTypeField.id}
                  isInvalid={!!errors.fields?.[profileTypeField.id]?.content?.value}
                >
                  <FormLabel fontWeight={400}>
                    <LocalizableUserTextRender value={profileTypeField.name} default="" />
                  </FormLabel>
                  {profileTypeField.type === "SHORT_TEXT" ? (
                    <ProfileFormFieldShortText
                      field={profileTypeField}
                      isDisabled={profileTypeField.myPermission !== "WRITE"}
                      showBaseStyles
                      isRequired
                    />
                  ) : (
                    <ProfileFormFieldSelect
                      field={profileTypeField}
                      isDisabled={profileTypeField.myPermission !== "WRITE"}
                      showBaseStyles
                      isRequired
                    />
                  )}
                  {errors.fields?.[profileTypeField.id]?.content?.value?.type === "required" ? (
                    <FormErrorMessage>
                      <FormattedMessage
                        id="generic.field-required-error"
                        defaultMessage="This field is required"
                      />
                    </FormErrorMessage>
                  ) : null}
                </FormControl>
              );
            })}
          </FormProvider>
        </Stack>
      }
      confirm={
        <Button colorPalette="primary" type="submit" loading={loading}>
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
    />
  );
}

export function useCreateProfileDialog() {
  return useDialog(CreateProfileDialog);
}

const _fragments = {
  Profile: gql`
    fragment useCreateProfileDialog_Profile on Profile {
      id
      localizableName
      status
      profileType {
        id
        name
      }
    }
  `,
  ProfileType: gql`
    fragment useCreateProfileDialog_ProfileType on ProfileType {
      id
      name
      createdAt
      fields {
        id
        type
        name
        isUsedInProfileName
        myPermission
        options
        isExpirable
      }
    }
  `,
  ProfileTypePagination: gql`
    fragment useCreateProfileDialog_ProfileTypePagination on ProfileTypePagination {
      items {
        ...useCreateProfileDialog_ProfileType
      }
      totalCount
    }
  `,
};

const _queries = [
  gql`
    query useCreateProfileDialog_profileType($profileTypeId: GID!) {
      profileType(profileTypeId: $profileTypeId) {
        ...useCreateProfileDialog_ProfileType
      }
    }
  `,
];

const _mutations = [
  gql`
    mutation useCreateProfileDialog_createProfile(
      $profileTypeId: GID!
      $fields: [CreateProfileFieldValueInput!]!
    ) {
      createProfile(profileTypeId: $profileTypeId, fields: $fields, subscribe: true) {
        ...useCreateProfileDialog_Profile
      }
    }
  `,
];

import { gql, useMutation, useQuery } from "@apollo/client";
import { Button, FormControl, FormErrorMessage, FormLabel, Stack } from "@chakra-ui/react";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileTypeSelect } from "@parallel/components/common/ProfileTypeSelect";
import { FormatFormErrorMessage, ShortTextInput } from "@parallel/components/common/ShortTextInput";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  UpdateProfileFieldValueInput,
  useCreateProfileDialog_ProfileFragment,
  useCreateProfileDialog_createProfileDocument,
  useCreateProfileDialog_profileTypeDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { Focusable } from "@parallel/utils/types";
import { useShortTextFormats } from "@parallel/utils/useShortTextFormats";
import { useEffect, useRef } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { ProfileFormFieldSelectInner } from "../form-fields/ProfileFormFieldSelect";

interface CreateProfileDialogResult {
  profile: useCreateProfileDialog_ProfileFragment;
  hasValues: boolean;
}

interface CreateProfileDialogProps {
  suggestedName?: string;
  profileTypeId?: string;
  profileFieldValues?: Record<string, string | number>;
}

function CreateProfileDialog({
  profileTypeId,
  suggestedName,
  profileFieldValues,
  ...props
}: DialogProps<CreateProfileDialogProps, CreateProfileDialogResult>) {
  const intl = useIntl();

  const {
    control,
    formState: { errors },
    watch,
    handleSubmit,
    setFocus,
    setError,
    setValue,
  } = useForm<{ profileTypeId: string | null; fieldValues: UpdateProfileFieldValueInput[] }>({
    defaultValues: {
      profileTypeId: profileTypeId ?? null,
      fieldValues: [],
    },
  });

  const { fields, replace } = useFieldArray({ name: "fieldValues", control });

  const _profileTypeId = watch("profileTypeId");
  const { data: profileTypeData } = useQuery(useCreateProfileDialog_profileTypeDocument, {
    variables: { profileTypeId: _profileTypeId! },
    skip: isNullish(_profileTypeId),
  });

  useEffect(() => {
    if (isNonNullish(profileTypeData)) {
      const fields = profileTypeData.profileType.fields.filter((f) => f.isUsedInProfileName);
      if (profileFieldValues) {
        replace(
          fields.map((field) => {
            return {
              profileTypeFieldId: field.id,
              content: { value: profileFieldValues[field.id] },
            };
          }),
        );
      } else {
        const suggestions = (suggestedName ?? "").split(" ");
        replace(
          fields.map((field, i, rest) => {
            const defaultValue = field.type === "SHORT_TEXT" ? "" : null;
            const moreShortTextsAfterThis = rest.slice(i + 1).some((f) => f.type === "SHORT_TEXT");
            const value =
              field.myPermission !== "WRITE"
                ? defaultValue
                : moreShortTextsAfterThis
                  ? (suggestions.shift() ?? "")
                  : suggestions.join(" ");
            return {
              profileTypeFieldId: field.id,
              content: { value },
            };
          }),
        );
      }
      setTimeout(() => {
        setFocus(`fieldValues.0.content.value`);
      }, 100);
    }
  }, [profileTypeData]);

  const formats = useShortTextFormats();

  const [createProfile, { loading }] = useMutation(useCreateProfileDialog_createProfileDocument);
  const selectRef = useRef<Focusable>({
    focus: () => {
      setFocus("profileTypeId");
    },
  });

  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      size="md"
      content={{
        as: "form",
        onSubmit: handleSubmit(async ({ profileTypeId, fieldValues }) => {
          try {
            const profile = await createProfile({
              variables: {
                profileTypeId: profileTypeId!,
                fields: fieldValues.filter(
                  (value) => isNonNullish(value?.content?.value) && value!.content!.value !== "",
                ),
              },
            });
            props.onResolve({
              profile: profile.data!.createProfile,
              hasValues: fieldValues.length > 0,
            });
          } catch (error) {
            if (isApolloError(error, "INVALID_PROFILE_FIELD_VALUE")) {
              const aggregatedErrors =
                (error.graphQLErrors[0].extensions!.aggregatedErrors as {
                  profileTypeFieldId: string;
                  code: string;
                }[]) ?? [];

              for (const err of aggregatedErrors) {
                const index = fieldValues.findIndex(
                  (f) => f.profileTypeFieldId === err.profileTypeFieldId,
                );
                setError(`fieldValues.${index}.content.value`, { type: "validate" });
              }
            }
          }
        }),
      }}
      initialFocusRef={selectRef}
      header={
        <FormattedMessage
          id="component.create-profile-dialog.new-profile"
          defaultMessage="New profile"
        />
      }
      body={
        <Stack spacing={4}>
          <FormControl isInvalid={!!errors.profileTypeId} isDisabled={isNonNullish(profileTypeId)}>
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
                    setValue("fieldValues", []);
                  }}
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
          {fields.map((field, index) => {
            const profileTypeField = profileTypeData!.profileType.fields.find(
              (f) => f.id === field.profileTypeFieldId,
            )!;
            const format = isNonNullish(profileTypeField.options.format)
              ? formats.find((f) => f.value === profileTypeField.options.format)
              : null;

            return (
              <FormControl key={field.id} isInvalid={!!errors.fieldValues?.[index]?.content?.value}>
                <FormLabel fontWeight={400}>
                  <LocalizableUserTextRender value={profileTypeField.name} default="" />
                </FormLabel>
                {profileTypeField.type === "SHORT_TEXT" ? (
                  <>
                    <Controller
                      name={`fieldValues.${index}.content.value`}
                      control={control}
                      rules={{
                        validate: (value) => {
                          return isNonNullish(format) && value?.length
                            ? (format.validate?.(value) ?? true)
                            : true;
                        },
                      }}
                      render={({ field: { value, ...props } }) => {
                        return (
                          <ShortTextInput
                            value={value ?? ""}
                            {...props}
                            disabled={profileTypeField.myPermission !== "WRITE"}
                            format={format}
                            placeholder={
                              isNonNullish(format)
                                ? intl.formatMessage(
                                    {
                                      id: "generic.for-example",
                                      defaultMessage: "E.g. {example}",
                                    },
                                    {
                                      example: format.example,
                                    },
                                  )
                                : undefined
                            }
                          />
                        );
                      }}
                    />
                    {isNonNullish(format) ? <FormatFormErrorMessage format={format} /> : null}
                  </>
                ) : (
                  <Controller
                    name={`fieldValues.${index}.content.value`}
                    control={control}
                    render={({ field: { ...props } }) => {
                      return (
                        <ProfileFormFieldSelectInner
                          field={profileTypeField}
                          {...props}
                          isDisabled={profileTypeField.myPermission !== "WRITE"}
                        />
                      );
                    }}
                  />
                )}
              </FormControl>
            );
          })}
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit" isLoading={loading}>
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
  get ProfileType() {
    return gql`
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
    `;
  },
  get ProfileTypePagination() {
    return gql`
      fragment useCreateProfileDialog_ProfileTypePagination on ProfileTypePagination {
        items {
          ...useCreateProfileDialog_ProfileType
        }
        totalCount
      }
      ${this.ProfileType}
    `;
  },
};

const _queries = [
  gql`
    query useCreateProfileDialog_profileType($profileTypeId: GID!) {
      profileType(profileTypeId: $profileTypeId) {
        ...useCreateProfileDialog_ProfileType
      }
    }
    ${_fragments.ProfileType}
  `,
];

const _mutations = [
  gql`
    mutation useCreateProfileDialog_createProfile(
      $profileTypeId: GID!
      $fields: [UpdateProfileFieldValueInput!]
    ) {
      createProfile(profileTypeId: $profileTypeId, fields: $fields, subscribe: true) {
        ...useCreateProfileDialog_Profile
      }
    }
    ${_fragments.Profile}
  `,
];

import { gql, useMutation, useQuery } from "@apollo/client";
import { Button, FormControl, FormErrorMessage, FormLabel, Stack } from "@chakra-ui/react";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileSelect } from "@parallel/components/common/ProfileSelect";
import { ProfileTypeSelect } from "@parallel/components/common/ProfileTypeSelect";
import { FormatFormErrorMessage, ShortTextInput } from "@parallel/components/common/ShortTextInput";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  UpdateProfileFieldValueInput,
  ProfileSelect_ProfileFragment,
  useCreateProfileDialog_createProfileDocument,
  useCreateProfileDialog_profileTypeDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useShortTextFormats } from "@parallel/utils/useShortTextFormats";
import { useEffect, useRef } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { SelectInstance } from "react-select";
import { isDefined } from "remeda";
import { ProfileFieldSelectInner } from "../fields/ProfileFieldSelect";

interface CreateProfileDialogResult {
  profile: ProfileSelect_ProfileFragment;
  hasValues: boolean;
}

function CreateProfileDialog({
  defaultProfileTypeId,
  suggestedName = "",
  ...props
}: DialogProps<
  { defaultProfileTypeId?: string | null; suggestedName?: string },
  CreateProfileDialogResult
>) {
  const intl = useIntl();
  const selectRef = useRef<SelectInstance>(null);

  const {
    control,
    formState: { errors },
    watch,
    handleSubmit,
    setFocus,
    setError,
  } = useForm<{ profileTypeId: string | null; fieldValues: UpdateProfileFieldValueInput[] }>({
    defaultValues: {
      profileTypeId: defaultProfileTypeId ?? null,
      fieldValues: [],
    },
  });

  const { fields, replace } = useFieldArray({ name: "fieldValues", control });
  const profileTypeId = watch("profileTypeId");

  const { data: profileTypeData } = useQuery(useCreateProfileDialog_profileTypeDocument, {
    variables: { profileTypeId: profileTypeId! },
    skip: !isDefined(profileTypeId),
  });

  useEffect(() => {
    if (isDefined(profileTypeData)) {
      const fields = profileTypeData.profileType.fields.filter((f) => f.isUsedInProfileName);
      const suggestions = suggestedName.split(" ");
      replace(
        fields.map((field, i) => {
          const value =
            field.myPermission !== "WRITE"
              ? ""
              : i < fields.length - 1
                ? suggestions[i] ?? ""
                : suggestions.slice(i).join(" ");

          return {
            profileTypeFieldId: field.id,
            content: {
              value,
            },
          };
        }) ?? [],
      );
      setTimeout(() => setFocus(`fieldValues.0.content.value`));
    }
  }, [profileTypeData]);

  const formats = useShortTextFormats();

  const [createProfile, { loading }] = useMutation(useCreateProfileDialog_createProfileDocument);

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
                fields: fieldValues,
              },
            });
            props.onResolve({
              profile: profile.data!.createProfile,
              hasValues: fieldValues.length > 0,
            });
          } catch (error) {
            if (isApolloError(error, "INVALID_PROFILE_FIELD_VALUE")) {
              const aggregatedErrors =
                (error.graphQLErrors[0].extensions.aggregatedErrors as {
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
          <FormControl isInvalid={!!errors.profileTypeId}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-profile-dialog.profile-type"
                defaultMessage="Profile type"
              />
            </FormLabel>
            <Controller
              name="profileTypeId"
              control={control}
              rules={{
                required: true,
              }}
              render={({ field: { value, onChange } }) => (
                <ProfileTypeSelect
                  ref={selectRef as any}
                  defaultOptions
                  value={value}
                  onChange={(v) => onChange(v?.id ?? "")}
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
          {profileTypeData?.profileType?.fields
            .filter((f) => f.isUsedInProfileName)
            .map((field) => {
              const index = fields.findIndex((f) => f.profileTypeFieldId === field.id)!;
              const format = isDefined(field.options.format)
                ? formats.find((f) => f.value === field.options.format)
                : null;

              return (
                <FormControl
                  key={field.id}
                  isInvalid={!!errors.fieldValues?.[index]?.content?.value}
                >
                  <FormLabel fontWeight={400}>
                    <LocalizableUserTextRender value={field.name} default="" />
                  </FormLabel>
                  {field.type === "SHORT_TEXT" ? (
                    <>
                      <Controller
                        name={`fieldValues.${index}.content.value`}
                        control={control}
                        rules={{
                          validate: (value) => {
                            return isDefined(format) && value?.length
                              ? format.validate?.(value) ?? true
                              : true;
                          },
                        }}
                        render={({ field: { value, onChange, onBlur } }) => {
                          return (
                            <ShortTextInput
                              value={value ?? ""}
                              onChange={onChange}
                              onBlur={onBlur}
                              disabled={field.myPermission !== "WRITE"}
                              format={format}
                              placeholder={
                                isDefined(format)
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
                      {isDefined(format) ? <FormatFormErrorMessage format={format} /> : null}
                    </>
                  ) : (
                    <Controller
                      name={`fieldValues.${index}.content.value`}
                      control={control}
                      render={({ field: { value, onChange, onBlur } }) => {
                        return (
                          <ProfileFieldSelectInner
                            field={field}
                            value={value}
                            onChange={onChange}
                            onBlur={onBlur}
                            isDisabled={field.myPermission !== "WRITE"}
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
        ...ProfileSelect_Profile
      }
    }
    ${ProfileSelect.fragments.Profile}
  `,
];

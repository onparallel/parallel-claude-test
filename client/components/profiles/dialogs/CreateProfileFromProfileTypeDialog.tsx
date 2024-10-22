import { gql, useMutation, useQuery } from "@apollo/client";
import { Button, Center, FormControl, FormLabel, Spinner, Stack } from "@chakra-ui/react";
import {
  LocalizableUserText,
  localizableUserTextRender,
  LocalizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { FormatFormErrorMessage, ShortTextInput } from "@parallel/components/common/ShortTextInput";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  UpdateProfileFieldValueInput,
  useCreateProfileFromProfileTypeDialog_createProfileDocument,
  useCreateProfileFromProfileTypeDialog_ProfileFragment,
  useCreateProfileFromProfileTypeDialog_profileTypeDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useShortTextFormats } from "@parallel/utils/useShortTextFormats";
import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { ProfileFormFieldSelectInner } from "../form-fields/ProfileFormFieldSelect";

interface CreateProfileFromProfileTypeDialogResult {
  profile: useCreateProfileFromProfileTypeDialog_ProfileFragment;
  hasValues: boolean;
}

interface CreateProfileFromProfileTypeDialogProps {
  profileTypeId: string;
  profileTypeName: LocalizableUserText;
}

function CreateProfileFromProfileTypeDialog({
  profileTypeId,
  profileTypeName,
  ...props
}: DialogProps<CreateProfileFromProfileTypeDialogProps, CreateProfileFromProfileTypeDialogResult>) {
  const intl = useIntl();

  const {
    control,
    formState: { errors },
    handleSubmit,
    setFocus,
    setError,
  } = useForm<{ fieldValues: UpdateProfileFieldValueInput[] }>({
    defaultValues: {
      fieldValues: [],
    },
  });

  const { fields, replace } = useFieldArray({ name: "fieldValues", control });

  const { data: profileTypeData, loading: isLoadingProfileType } = useQuery(
    useCreateProfileFromProfileTypeDialog_profileTypeDocument,
    {
      variables: { profileTypeId },
    },
  );

  useEffect(() => {
    if (isNonNullish(profileTypeData)) {
      const fields = profileTypeData.profileType.fields.filter((f) => f.isUsedInProfileName);
      replace(
        fields.map((field) => {
          return {
            profileTypeFieldId: field.id,
            content: null,
          };
        }),
      );
      setTimeout(() => {
        setFocus(`fieldValues.0.content.value`);
      }, 100);
    }
  }, [profileTypeData]);

  const formats = useShortTextFormats();

  const [createProfile, { loading }] = useMutation(
    useCreateProfileFromProfileTypeDialog_createProfileDocument,
  );

  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      size="md"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async ({ fieldValues }) => {
            try {
              const profile = await createProfile({
                variables: {
                  profileTypeId,
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
        },
      }}
      header={
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
      }
      body={
        isLoadingProfileType ? (
          <Center height="144px">
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="primary.500"
              size="xl"
            />
          </Center>
        ) : (
          <Stack spacing={4}>
            {fields.map((field, index) => {
              const profileTypeField = profileTypeData!.profileType.fields.find(
                (f) => f.id === field.profileTypeFieldId,
              )!;
              const format = isNonNullish(profileTypeField.options.format)
                ? formats.find((f) => f.value === profileTypeField.options.format)
                : null;

              return (
                <FormControl
                  key={field.id}
                  isInvalid={!!errors.fieldValues?.[index]?.content?.value}
                >
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
        )
      }
      confirm={
        <Button colorScheme="primary" type="submit" isLoading={loading}>
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
    />
  );
}

export function useCreateProfileFromProfileTypeDialog() {
  return useDialog(CreateProfileFromProfileTypeDialog);
}

const _fragments = {
  Profile: gql`
    fragment useCreateProfileFromProfileTypeDialog_Profile on Profile {
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
      fragment useCreateProfileFromProfileTypeDialog_ProfileType on ProfileType {
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
      fragment useCreateProfileFromProfileTypeDialog_ProfileTypePagination on ProfileTypePagination {
        items {
          ...useCreateProfileFromProfileTypeDialog_ProfileType
        }
        totalCount
      }
      ${this.ProfileType}
    `;
  },
};

const _queries = [
  gql`
    query useCreateProfileFromProfileTypeDialog_profileType($profileTypeId: GID!) {
      profileType(profileTypeId: $profileTypeId) {
        ...useCreateProfileFromProfileTypeDialog_ProfileType
      }
    }
    ${_fragments.ProfileType}
  `,
];

const _mutations = [
  gql`
    mutation useCreateProfileFromProfileTypeDialog_createProfile(
      $profileTypeId: GID!
      $fields: [UpdateProfileFieldValueInput!]
    ) {
      createProfile(profileTypeId: $profileTypeId, fields: $fields, subscribe: true) {
        ...useCreateProfileFromProfileTypeDialog_Profile
      }
    }
    ${_fragments.Profile}
  `,
];

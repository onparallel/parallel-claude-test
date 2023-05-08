import { gql, useQuery } from "@apollo/client";
import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  LocalizableUserTextRender,
  localizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import {
  UpdateProfileFieldValueInput,
  useCreateProfileDialog_profileTypesDocument,
  UserLocale,
} from "@parallel/graphql/__types";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface CreateProfileDialogResult {
  profileTypeId: string;
  fieldValues: UpdateProfileFieldValueInput[];
}

function CreateProfileDialog({ ...props }: DialogProps<{}, CreateProfileDialogResult>) {
  const intl = useIntl();

  const { data } = useQuery(useCreateProfileDialog_profileTypesDocument, {
    variables: {
      offset: 0,
      limit: 999,
      locale: intl.locale as UserLocale,
    },
    fetchPolicy: "cache-and-network",
  });

  const profileTypes = data?.profileTypes.items ?? [];

  const {
    control,
    formState: { errors },
    reset,
    register,
    watch,
    handleSubmit,
  } = useForm<CreateProfileDialogResult>({
    defaultValues: {
      profileTypeId: "",
      fieldValues: [],
    },
  });

  const { fields } = useFieldArray({ name: "fieldValues", control });
  const profileTypeId = watch("profileTypeId");
  const profileType = profileTypes.find((pt) => pt.id === profileTypeId);

  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      size="md"
      content={{
        as: "form",
        onSubmit: handleSubmit(({ profileTypeId, fieldValues }) => {
          props.onResolve({ profileTypeId: profileTypeId!, fieldValues });
        }),
      }}
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
              render={({ field: { value } }) => (
                <SimpleSelect
                  value={value}
                  options={profileTypes.map((profileType) => ({
                    value: profileType.id,
                    label: localizableUserTextRender({
                      value: profileType.name,
                      intl,
                      default: intl.formatMessage({
                        id: "generic.unnamed-profile-type",
                        defaultMessage: "Unnamed profile type",
                      }),
                    }),
                  }))}
                  placeholder={intl.formatMessage({
                    id: "component.create-profile-dialog.select-profile-type",
                    defaultMessage: "Select a profile type",
                  })}
                  onChange={(id) => {
                    const profileType = profileTypes.find((pt) => pt.id === id);
                    reset({
                      profileTypeId: id!,
                      fieldValues:
                        profileType?.fields
                          .filter((f) => f.isUsedInProfileName)
                          .map((pt) => ({ profileTypeFieldId: pt.id, content: undefined })) ?? [],
                    });
                  }}
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
          {profileType?.fields
            .filter((f) => f.isUsedInProfileName)
            .map(({ id, name }) => {
              const index = fields.findIndex((f) => f.profileTypeFieldId === id)!;
              return (
                <FormControl key={fields[index].id}>
                  <FormLabel fontWeight={400}>
                    <LocalizableUserTextRender value={name} default="" />
                  </FormLabel>
                  <Input {...register(`fieldValues.${index}.content.value`)} />
                </FormControl>
              );
            })}
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
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
    query useCreateProfileDialog_profileTypes($offset: Int!, $limit: Int!, $locale: UserLocale) {
      profileTypes(offset: $offset, limit: $limit, locale: $locale) {
        ...useCreateProfileDialog_ProfileTypePagination
      }
    }
    ${_fragments.ProfileTypePagination}
  `,
];

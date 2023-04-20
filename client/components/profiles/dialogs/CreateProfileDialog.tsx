import { gql, useQuery } from "@apollo/client";
import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { UserLocale, useCreateProfileDialog_profileTypesDocument } from "@parallel/graphql/__types";
import { isNotEmptyText } from "@parallel/utils/strings";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";

interface CreateProfileDialogResult {
  profileTypeId: string;
  name: string;
}

function CreateProfileDialog({ ...props }: DialogProps<{}, CreateProfileDialogResult>) {
  const intl = useIntl();
  const {
    control,
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<{ profileTypeId: string | null; name: string }>({
    defaultValues: {
      profileTypeId: null,
      name: "",
    },
  });

  const { data } = useQuery(useCreateProfileDialog_profileTypesDocument, {
    variables: {
      offset: 0,
      limit: 999,
      locale: intl.locale as UserLocale,
    },
    fetchPolicy: "cache-and-network",
  });

  const profileTypes = data?.profileTypes.items ?? [];

  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      size="md"
      content={{
        as: "form",
        onSubmit: handleSubmit(({ name, profileTypeId }) => {
          props.onResolve({ name, profileTypeId: profileTypeId! });
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
              render={({ field: { value, onChange } }) => (
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
                  onChange={onChange}
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
          <FormControl isInvalid={!!errors.name}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-profile-dialog.profile-name"
                defaultMessage="Profile name"
              />
            </FormLabel>
            <Input {...register("name", { required: true, validate: { isNotEmptyText } })} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
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

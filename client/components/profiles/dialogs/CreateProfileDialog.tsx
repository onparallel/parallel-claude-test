import { gql, useQuery } from "@apollo/client";
import { Button, FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileTypeSelect } from "@parallel/components/common/ProfileTypeSelect";
import {
  UpdateProfileFieldValueInput,
  useCreateProfileDialog_profileTypeDocument,
} from "@parallel/graphql/__types";
import { useEffect, useRef } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { SelectInstance } from "react-select";
import { isDefined } from "remeda";

interface CreateProfileDialogResult {
  profileTypeId: string;
  fieldValues: UpdateProfileFieldValueInput[];
}

function CreateProfileDialog({
  defaultProfileTypeId,
  suggestedName = "",
  ...props
}: DialogProps<
  { defaultProfileTypeId?: string | null; suggestedName?: string },
  CreateProfileDialogResult
>) {
  const selectRef = useRef<SelectInstance>(null);

  const {
    control,
    formState: { errors },
    register,
    watch,
    handleSubmit,
    setFocus,
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

  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      size="md"
      content={{
        as: "form",
        onSubmit: handleSubmit(({ profileTypeId, fieldValues }) => {
          props.onResolve({
            profileTypeId: profileTypeId!,
            fieldValues: fieldValues.filter((f) => f.content?.value.trim() !== ""),
          });
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
            .map(({ id, name, myPermission }) => {
              const index = fields.findIndex((f) => f.profileTypeFieldId === id)!;

              return (
                <FormControl key={id}>
                  <FormLabel fontWeight={400}>
                    <LocalizableUserTextRender value={name} default="" />
                  </FormLabel>
                  <Input
                    {...register(`fieldValues.${index}.content.value`)}
                    isDisabled={myPermission !== "WRITE"}
                  />
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
          myPermission
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

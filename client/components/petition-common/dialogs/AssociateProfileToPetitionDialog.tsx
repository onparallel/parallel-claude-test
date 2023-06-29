import { gql, useMutation } from "@apollo/client";
import { Button, FormControl, FormErrorMessage, FormLabel, HStack, Text } from "@chakra-ui/react";
import { ArrowDiagonalRightIcon } from "@parallel/chakra/icons";
import {
  ProfileSelect,
  ProfileSelectInstance,
  ProfileSelectSelection,
} from "@parallel/components/common/ProfileSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  DialogProps,
  isDialogError,
  useDialog,
} from "@parallel/components/common/dialogs/DialogProvider";
import { useCreateProfileDialog } from "@parallel/components/profiles/dialogs/CreateProfileDialog";
import {
  AssociateProfileToPetitionDialog_createProfileDocument,
  AssociateProfileToPetitionDialog_updateProfileFieldValueDocument,
} from "@parallel/graphql/__types";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";

interface AssociateProfileToPetitionDialogProps {
  excludeProfiles?: string[];
}

interface AssociateProfileToPetitionDialogData {
  profileId: string | null;
}

function AssociateProfileToPetitionDialog({
  excludeProfiles,
  ...props
}: DialogProps<AssociateProfileToPetitionDialogProps, string>) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AssociateProfileToPetitionDialogData>({
    defaultValues: { profileId: null },
  });

  const [counter, setCounter] = useState(0);

  const formRef = useRef<HTMLFormElement>(null);
  const selectRef = useRef<ProfileSelectInstance<false>>(null);

  const [createProfile] = useMutation(AssociateProfileToPetitionDialog_createProfileDocument);
  const [updateProfileFieldValue] = useMutation(
    AssociateProfileToPetitionDialog_updateProfileFieldValueDocument
  );
  const showCreateProfileDialog = useCreateProfileDialog();
  const handleCreateProfile = async (search: string) => {
    try {
      const { profileTypeId: _profileTypeId, fieldValues } = await showCreateProfileDialog({
        suggestedName: search,
      });
      const { data } = await createProfile({
        variables: {
          profileTypeId: _profileTypeId,
        },
      });

      if (isDefined(data)) {
        await updateProfileFieldValue({
          variables: {
            profileId: data!.createProfile.id,
            fields: fieldValues,
          },
        });
      }
      setCounter((c) => c + 1);

      return data?.createProfile as ProfileSelectSelection;
    } catch (e) {
      if (isDialogError(e)) {
        setTimeout(() => {
          // for some reason this is needed, at least on ff
          formRef.current?.focus();
          selectRef.current?.focus();
        });
      }
    }
  };

  return (
    <ConfirmDialog
      size="lg"
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      initialFocusRef={selectRef}
      content={
        {
          as: "form",
          ref: formRef,
          onSubmit: handleSubmit(({ profileId }) => props.onResolve(profileId!)),
        } as any
      }
      {...props}
      header={
        <HStack>
          <ArrowDiagonalRightIcon />
          <Text as="span">
            <FormattedMessage
              id="component.associate-profile-to-parallel-dialog.header"
              defaultMessage="Associate profile"
            />
          </Text>
        </HStack>
      }
      body={
        <FormControl isInvalid={!!errors.profileId}>
          <FormLabel fontWeight={400}>
            <FormattedMessage
              id="component.associate-profile-to-parallel-dialog.profile-label"
              defaultMessage="Profile"
            />
          </FormLabel>
          <Controller
            name="profileId"
            control={control}
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <ProfileSelect
                ref={selectRef}
                key={counter}
                excludeProfiles={excludeProfiles}
                defaultOptions
                value={value}
                onChange={(v) => {
                  onChange(v?.id ?? null);
                }}
                onCreateProfile={handleCreateProfile}
              />
            )}
          />
          <FormErrorMessage>
            <FormattedMessage
              id="component.associate-profile-to-parallel-dialog.profile-error"
              defaultMessage="Please, select a profile"
            />
          </FormErrorMessage>
        </FormControl>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage
            id="component.associate-profile-to-parallel-dialog.associate"
            defaultMessage="Associate"
          />
        </Button>
      }
    />
  );
}

const _fragments = {
  get Profile() {
    return gql`
      fragment AssociateProfileToPetitionDialog_Profile on Profile {
        id
        ...ProfileSelect_Profile
      }
      ${ProfileSelect.fragments.Profile}
    `;
  },
};

const _mutations = [
  gql`
    mutation AssociateProfileToPetitionDialog_createProfile($profileTypeId: GID!) {
      createProfile(profileTypeId: $profileTypeId, subscribe: true) {
        ...AssociateProfileToPetitionDialog_Profile
      }
    }
    ${_fragments.Profile}
  `,
  gql`
    mutation AssociateProfileToPetitionDialog_updateProfileFieldValue(
      $profileId: GID!
      $fields: [UpdateProfileFieldValueInput!]!
    ) {
      updateProfileFieldValue(profileId: $profileId, fields: $fields) {
        ...AssociateProfileToPetitionDialog_Profile
      }
    }
    ${_fragments.Profile}
  `,
];

export function useAssociateProfileToPetitionDialog() {
  return useDialog(AssociateProfileToPetitionDialog);
}

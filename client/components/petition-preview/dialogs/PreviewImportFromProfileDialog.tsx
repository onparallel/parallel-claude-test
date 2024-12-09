import { gql, useLazyQuery } from "@apollo/client";
import { Button, FormControl, FormErrorMessage, FormLabel, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import { ProfileSelect, ProfileSelectInstance } from "@parallel/components/common/ProfileSelect";
import {
  calculateCompatibleFieldGroups,
  calculateRelatedFieldGroupsWithCompatibleProfiles,
  ProfileRelationshipsAssociationTable,
} from "@parallel/components/profiles/ProfileRelationshipsAssociationTable";
import {
  CreatePetitionFromProfilePrefillInput,
  usePreviewImportFromProfileDialog_PetitionBaseFragment,
  usePreviewImportFromProfileDialog_petitionDocument,
  usePreviewImportFromProfileDialog_profileDocument,
  usePreviewImportFromProfileDialog_ProfileFragment,
} from "@parallel/graphql/__types";
import { useRef } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";

type PreviewImportFromProfileDialogSteps = {
  SELECT_PROFILES: {
    profileTypeId: string;
    showMultipleSelect: boolean;
    petitionId: string;
    fieldId: string;
    profileIds?: string[];
  };
  PREFILL_FIELD_GROUPS: {
    profile: usePreviewImportFromProfileDialog_ProfileFragment;
    petition: usePreviewImportFromProfileDialog_PetitionBaseFragment;
    fieldId: string;
  };
};

function PreviewImportFromProfileDialogSelectProfiles({
  profileTypeId,
  showMultipleSelect,
  profileIds,
  fieldId,
  petitionId,
  onStep,
  ...props
}: WizardStepDialogProps<
  PreviewImportFromProfileDialogSteps,
  "SELECT_PROFILES",
  {
    profileIds: string[];
  }
>) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<{ profileIds: string[] }>({
    defaultValues: { profileIds: profileIds ?? [] },
  });

  const [getProfile] = useLazyQuery(usePreviewImportFromProfileDialog_profileDocument);

  const [getPetition] = useLazyQuery(usePreviewImportFromProfileDialog_petitionDocument);

  const selectRef = useRef<ProfileSelectInstance<any>>(null);
  return (
    <ConfirmDialog
      initialFocusRef={selectRef}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async ({ profileIds }) => {
            if (profileIds.length > 1) {
              props.onResolve({ profileIds });
            } else {
              const { data: profileData } = await getProfile({
                variables: { profileId: profileIds[0] },
              });
              const { data: petitionData } = await getPetition({ variables: { petitionId } });
              const profile = profileData?.profile;
              const petition = petitionData?.petition;

              if (profile && petition) {
                const compatibleFieldGroups = calculateCompatibleFieldGroups({ profile, petition });

                const relatedFieldGroupsWithCompatibleProfiles =
                  calculateRelatedFieldGroupsWithCompatibleProfiles({
                    petition,
                    profile,
                    compatibleFieldGroups,
                    groupId: fieldId,
                  });

                if (
                  (!showMultipleSelect || profileIds.length === 1) &&
                  (relatedFieldGroupsWithCompatibleProfiles.length > 1 ||
                    relatedFieldGroupsWithCompatibleProfiles[0]?.[1]?.length > 1)
                ) {
                  onStep(
                    "PREFILL_FIELD_GROUPS",
                    {
                      fieldId,
                      petition,
                      profile,
                    },
                    { profileIds },
                  );
                }
              }
            }
          }),
        },
      }}
      {...props}
      header={
        <FormattedMessage
          id="component.preview-import-from-profile-dialog.header"
          defaultMessage="Import from profile"
        />
      }
      body={
        <Stack>
          <FormControl isInvalid={!!errors.profileIds}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.preview-import-from-profile-dialog.select-profile-label"
                defaultMessage="Select a profile to import the information from"
              />
            </FormLabel>
            <Controller
              name="profileIds"
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <ProfileSelect
                  ref={selectRef}
                  defaultOptions
                  isMulti={showMultipleSelect}
                  value={value}
                  onChange={(v) => {
                    if (isNonNullish(v)) {
                      if (Array.isArray(v)) {
                        onChange(v.map((v) => v.id));
                      } else {
                        onChange([v.id]);
                      }
                    }
                  }}
                  profileTypeId={profileTypeId}
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="component.preview-import-from-profile-dialog.profile-error"
                defaultMessage="Please, select a profile"
              />
            </FormErrorMessage>
          </FormControl>
          <Text fontStyle="italic">
            <FormattedMessage
              id="component.preview-import-from-profile-dialog.body"
              defaultMessage="All replies to linked fields will be overwritten."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

function PreviewImportFromProfileDialogPrefillFieldGroups({
  profile,
  fieldId,
  petition,
  ...props
}: WizardStepDialogProps<
  PreviewImportFromProfileDialogSteps,
  "PREFILL_FIELD_GROUPS",
  {
    prefill: CreatePetitionFromProfilePrefillInput[];
  }
>) {
  const form = useForm<{ prefill: CreatePetitionFromProfilePrefillInput[] }>({
    defaultValues: { prefill: [] },
  });
  const { handleSubmit } = form;

  const selectRef = useRef<ProfileSelectInstance<any>>(null);
  return (
    <ConfirmDialog
      initialFocusRef={selectRef}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(({ prefill }) => {
            props.onResolve({ prefill });
          }),
        },
      }}
      {...props}
      header={
        <FormattedMessage
          id="component.preview-import-from-profile-dialog.header"
          defaultMessage="Import from profile"
        />
      }
      body={
        <Stack spacing={3}>
          <Text>
            <FormattedMessage
              id="component.preview-import-from-profile-dialog.body-select-relationships"
              defaultMessage="Select the relationships you would like to import in the related fields:"
            />
          </Text>
          <FormProvider {...form}>
            <ProfileRelationshipsAssociationTable
              name="prefill"
              groupId={fieldId}
              petition={petition}
              profile={profile}
            />
          </FormProvider>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid">
          <FormattedMessage id="generic.import" defaultMessage="Import" />
        </Button>
      }
      {...props}
    />
  );
}

export function usePreviewImportFromProfileDialog() {
  return useWizardDialog(
    {
      SELECT_PROFILES: PreviewImportFromProfileDialogSelectProfiles,
      PREFILL_FIELD_GROUPS: PreviewImportFromProfileDialogPrefillFieldGroups,
    },
    "SELECT_PROFILES",
  );
}

usePreviewImportFromProfileDialog.fragments = {
  get PetitionBase() {
    return gql`
      fragment usePreviewImportFromProfileDialog_PetitionBase on PetitionBase {
        id
        ...ProfileRelationshipsAssociationTable_PetitionBase
      }
      ${ProfileRelationshipsAssociationTable.fragments.PetitionBase}
    `;
  },
  get Profile() {
    return gql`
      fragment usePreviewImportFromProfileDialog_Profile on Profile {
        id
        ...ProfileRelationshipsAssociationTable_Profile
      }
      ${ProfileRelationshipsAssociationTable.fragments.Profile}
    `;
  },
};

const _queries = [
  gql`
    query usePreviewImportFromProfileDialog_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        ...usePreviewImportFromProfileDialog_PetitionBase
      }
    }
    ${usePreviewImportFromProfileDialog.fragments.PetitionBase}
  `,
  gql`
    query usePreviewImportFromProfileDialog_profile($profileId: GID!) {
      profile(profileId: $profileId) {
        ...usePreviewImportFromProfileDialog_Profile
      }
    }
    ${usePreviewImportFromProfileDialog.fragments.Profile}
  `,
];

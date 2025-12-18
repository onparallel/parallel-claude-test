import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Button, Center, Icon, Skeleton, Spinner, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { getProfileTypeIcon } from "@parallel/components/organization/profiles/getProfileTypeIcon";
import {
  buildFormDefaultValue,
  ProfileFormInner,
  useProfileFormInnerSubmitHandler,
} from "@parallel/components/profiles/ProfileFormInner";
import { HStack } from "@parallel/components/ui";
import {
  UpdateProfileFieldValueOnClosePetitionDialog_PetitionBaseFragment,
  UpdateProfileFieldValueOnClosePetitionDialog_petitionDocument,
  UpdateProfileFieldValueOnClosePetitionDialog_profileDocument,
  UpdateProfileFieldValueOnClosePetitionDialog_ProfileFragment,
} from "@parallel/graphql/__types";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, partition } from "remeda";

type UpdateProfileFieldValueOnClosePetitionDialogSteps = {
  LOADING: {
    petitionFieldId: string;
    petitionId: string;
    profileId: string;
    profileTypeFieldIds: string[];
  };
  STEP_1: {
    title: string;
    profile: UpdateProfileFieldValueOnClosePetitionDialog_ProfileFragment;
    petition: UpdateProfileFieldValueOnClosePetitionDialog_PetitionBaseFragment;
    profileTypeFieldIds: string[];
  };
};

function UpdateProfileFieldValueOnClosePetitionLoadingDialog({
  petitionFieldId,
  petitionId,
  profileId,
  profileTypeFieldIds,
  onStep,
  ...props
}: WizardStepDialogProps<UpdateProfileFieldValueOnClosePetitionDialogSteps, "LOADING", void>) {
  const intl = useIntl();
  const { data, loading } = useQuery(UpdateProfileFieldValueOnClosePetitionDialog_profileDocument, {
    variables: { profileId },
  });

  const { data: petitionData, loading: petitionLoading } = useQuery(
    UpdateProfileFieldValueOnClosePetitionDialog_petitionDocument,
    {
      variables: { petitionId },
    },
  );

  useEffect(() => {
    if (
      !loading &&
      isNonNullish(data) &&
      !petitionLoading &&
      isNonNullish(petitionData) &&
      isNonNullish(petitionData.petition)
    ) {
      const petitionField = petitionData.petition.fields.find(
        (field) => field.id === petitionFieldId,
      );

      const title =
        petitionField?.options?.groupName ??
        petitionField?.title ??
        intl.formatMessage({
          id: "generic.untitled-field",
          defaultMessage: "Untitled field",
        });

      onStep("STEP_1", {
        title,
        profile: data.profile,
        petition: petitionData.petition,
        profileTypeFieldIds,
      });
    }
  }, [
    intl.locale,
    profileTypeFieldIds,
    petitionFieldId,
    loading,
    data,
    onStep,
    petitionLoading,
    petitionData,
  ]);

  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton
      header={<Skeleton height="24px" width="240px" />}
      body={
        <Center padding={8} minHeight="200px">
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="primary.500"
            size="xl"
          />
        </Center>
      }
      confirm={
        <Button colorScheme="primary" isDisabled>
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      }
      cancel={
        <Button isDisabled>
          <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
        </Button>
      }
      {...props}
    />
  );
}

function UpdateProfileFieldValueOnClosePetitionDialog({
  title,
  profile,
  petition,
  profileTypeFieldIds,
  onStep,
  ...props
}: WizardStepDialogProps<UpdateProfileFieldValueOnClosePetitionDialogSteps, "STEP_1", void>) {
  const profileIcon = getProfileTypeIcon(profile?.profileType?.icon ?? "DATABASE");

  const { refetch: refetchProfile, data: profileData } = useQuery(
    UpdateProfileFieldValueOnClosePetitionDialog_profileDocument,
    {
      variables: { profileId: profile.id },
      skip: !isNonNullish(profile.id),
    },
  );

  const currentProfile = profileData?.profile ?? profile;

  const [properties, hiddenProperties] = useMemo(
    () =>
      partition(
        profile.properties.filter((property) => profileTypeFieldIds.includes(property.field.id)),
        (property) => property.field.myPermission !== "HIDDEN",
      ),
    [profile.properties, profileTypeFieldIds],
  );

  const form = useForm({
    defaultValues: buildFormDefaultValue(properties),
  });

  const { formState, handleSubmit } = form;

  const submitHandler = useProfileFormInnerSubmitHandler({
    properties,
    profileId: currentProfile.id,
    petitionId: petition.id,
    form,
  });

  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            await submitHandler(data);
            props.onResolve();
          }),
        },
      }}
      header={
        <HStack>
          <Icon as={profileIcon} />
          <Text>{title}</Text>
        </HStack>
      }
      body={
        <FormProvider {...form}>
          <Stack spacing={2}>
            <ProfileReference profile={profile} paddingBottom={4} fontStyle="italic" />
            <ProfileFormInner
              profileId={currentProfile.id}
              properties={properties}
              hiddenProperties={hiddenProperties}
              petition={petition}
              petitionId={petition.id}
              showBaseStyles
              isDisabled={currentProfile.status !== "OPEN"}
              onRefetch={async () => {
                await refetchProfile();
              }}
            />
          </Stack>
        </FormProvider>
      }
      confirm={
        <Button
          colorScheme="primary"
          type="submit"
          isDisabled={formState.dirtyFields.fields === undefined || formState.isSubmitting}
        >
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      }
      cancel={
        <Button
          type="button"
          onClick={() => {
            props.onReject();
          }}
        >
          <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
        </Button>
      }
      {...props}
    />
  );
}

export function useUpdateProfileFieldValueOnClosePetitionDialog() {
  return useWizardDialog(
    {
      LOADING: UpdateProfileFieldValueOnClosePetitionLoadingDialog,
      STEP_1: UpdateProfileFieldValueOnClosePetitionDialog,
    },
    "LOADING",
  );
}

useUpdateProfileFieldValueOnClosePetitionDialog.fragments = {
  get Profile() {
    return gql`
      fragment UpdateProfileFieldValueOnClosePetitionDialog_Profile on Profile {
        id
        status
        profileType {
          id
          icon
        }
        properties {
          ...buildFormDefaultValue_ProfileFieldProperty
          ...ProfileFormInner_ProfileFieldProperty
        }
        ...ProfileReference_Profile
      }
      ${ProfileReference.fragments.Profile}
      ${buildFormDefaultValue.fragments.ProfileFieldProperty}
      ${ProfileFormInner.fragments.ProfileFieldProperty}
    `;
  },
  get PetitionField() {
    return gql`
      fragment UpdateProfileFieldValueOnClosePetitionDialog_PetitionField on PetitionField {
        id
        title
        options
      }
    `;
  },
  get PetitionBase() {
    return gql`
      fragment UpdateProfileFieldValueOnClosePetitionDialog_PetitionBase on PetitionBase {
        id
        fields {
          id
          ...UpdateProfileFieldValueOnClosePetitionDialog_PetitionField
        }
        ...ProfileFormInner_PetitionBase
      }
      ${ProfileFormInner.fragments.PetitionBase}
    `;
  },
};

const _queries = {
  profile: gql`
    query UpdateProfileFieldValueOnClosePetitionDialog_profile($profileId: GID!) {
      profile(profileId: $profileId) {
        id
        ...UpdateProfileFieldValueOnClosePetitionDialog_Profile
      }
    }
    ${useUpdateProfileFieldValueOnClosePetitionDialog.fragments.Profile}
  `,
  petition: gql`
    query UpdateProfileFieldValueOnClosePetitionDialog_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        id
        ...UpdateProfileFieldValueOnClosePetitionDialog_PetitionBase
      }
    }
    ${useUpdateProfileFieldValueOnClosePetitionDialog.fragments.PetitionBase}
  `,
};

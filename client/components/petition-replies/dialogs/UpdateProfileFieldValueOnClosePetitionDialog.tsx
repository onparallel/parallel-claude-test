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
  ProfileFormInner,
  ProfileFormInnerInstance,
} from "@parallel/components/profiles/ProfileFormInner";
import { HStack } from "@parallel/components/ui";
import {
  UpdateProfileFieldValueOnClosePetitionDialog_PetitionBaseFragment,
  UpdateProfileFieldValueOnClosePetitionDialog_petitionDocument,
  UpdateProfileFieldValueOnClosePetitionDialog_profileDocument,
  UpdateProfileFieldValueOnClosePetitionDialog_ProfileFragment,
} from "@parallel/graphql/__types";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";

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
  }, [loading, data, onStep, petitionLoading, petitionData]);

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
  const formRef = useRef<ProfileFormInnerInstance>(null);

  const { refetch: refetchProfile, data: profileData } = useQuery(
    UpdateProfileFieldValueOnClosePetitionDialog_profileDocument,
    {
      variables: { profileId: profile.id },
      skip: !isNonNullish(profile.id),
    },
  );

  const [formState, setFormState] = useState<{
    dirtyFields: { fields?: Record<string, any> };
    isSubmitting: boolean;
  }>({
    dirtyFields: {},
    isSubmitting: false,
  });

  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton
      content={{
        containerProps: {
          as: "form",
          onSubmit: (e) => {
            e?.preventDefault();
            formRef.current?.handleSubmit(async () => {
              // Form submission handled by ProfileFormInner
              // After success, resolve dialog
              props.onResolve();
            })(e);
          },
        },
      }}
      header={
        <HStack>
          <Icon as={profileIcon} />
          <Text>{title}</Text>
        </HStack>
      }
      body={
        <Stack spacing={2}>
          <ProfileReference profile={profile} paddingBottom={4} fontStyle="italic" />
          <ProfileFormInner
            ref={formRef}
            profile={profileData?.profile ?? profile}
            petition={petition}
            petitionId={petition.id}
            filterProperties={(property) => profileTypeFieldIds.includes(property.field.id)}
            showHiddenProperties={false}
            enableRouterHooks={false}
            showBaseStyles
            onRefetch={async () => {
              await refetchProfile();
            }}
            onFormStateChange={(state) => {
              setFormState({
                dirtyFields: state.dirtyFields,
                isSubmitting: state.isSubmitting,
              });
            }}
          />
        </Stack>
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
        profileType {
          id
          icon
        }
        ...ProfileReference_Profile
        ...ProfileFormInner_Profile
      }
      ${ProfileReference.fragments.Profile}
      ${ProfileFormInner.fragments.Profile}
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

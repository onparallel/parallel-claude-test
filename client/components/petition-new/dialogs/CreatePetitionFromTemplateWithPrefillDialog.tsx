import { gql, useLazyQuery, useMutation } from "@apollo/client";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { PetitionFieldReference } from "@parallel/components/common/PetitionFieldReference";
import { ProfileSelect, ProfileSelectInstance } from "@parallel/components/common/ProfileSelect";
import { ProfileTypeReference } from "@parallel/components/common/ProfileTypeReference";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import { usePreviewImportFromProfileFormatErrorDialog } from "@parallel/components/petition-preview/dialogs/PreviewImportFromProfileFormatErrorDialog";
import {
  AssociateNewPetitionToProfileDialogPrefillFieldGroups,
  useAssociateNewPetitionToProfileDialog,
} from "@parallel/components/profiles/dialogs/AssociateNewPetitionToProfileDialog";
import { ProfileRelationshipsAssociationTable } from "@parallel/components/profiles/ProfileRelationshipsAssociationTable";
import {
  useCreatePetitionFromTemplateWithPrefillDialog_createPetitionFromProfileDocument,
  useCreatePetitionFromTemplateWithPrefillDialog_PetitionBaseFragment,
  useCreatePetitionFromTemplateWithPrefillDialog_profileDocument,
  useCreatePetitionFromTemplateWithPrefillDialog_ProfileFragment,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { getLinkedFieldGroups } from "@parallel/utils/petitions/getLinkedFieldGroups";
import {
  calculateCompatibleFieldGroups,
  calculateRelatedFieldGroupsWithCompatibleProfiles,
  generatePrefillData,
} from "@parallel/utils/petitions/profilePrefill";
import { useMemo, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";

type CreatePetitionFromTemplateWithPrefillDialogSteps = {
  SELECT_FIELD_GROUPS: {
    template: useCreatePetitionFromTemplateWithPrefillDialog_PetitionBaseFragment;
    selectedGroupId?: string;
  };
  SELECT_PROFILE: {
    template: useCreatePetitionFromTemplateWithPrefillDialog_PetitionBaseFragment;
    selectedGroupId: string;
    selectedProfileId?: string;
  };
  PREFILL_FIELD_GROUPS: {
    profile: useCreatePetitionFromTemplateWithPrefillDialog_ProfileFragment;
    template: useCreatePetitionFromTemplateWithPrefillDialog_PetitionBaseFragment;
    groupId: string;
  };
};

/* 
  Dialog that creates a petition from a template with profile prefill.
  It has a maximum of 3 steps:
  Step 1 "SELECT_FIELD_GROUPS" - select which field groups to prefill from the template
  Step 2 "SELECT_PROFILE" - select the profile to use for prefilling
  Step 3 "PREFILL_FIELD_GROUPS" - configure relationships (reuses existing step)
*/

function CreatePetitionFromTemplateSelectFieldGroupsStep({
  template,
  selectedGroupId,
  onStep,
  ...props
}: WizardStepDialogProps<
  CreatePetitionFromTemplateWithPrefillDialogSteps,
  "SELECT_FIELD_GROUPS",
  string
>) {
  const { handleSubmit, control, formState } = useForm<{
    selectedGroupId: string | null;
  }>({
    mode: "onSubmit",
    defaultValues: {
      selectedGroupId: selectedGroupId || null,
    },
  });

  const { errors } = formState;

  const linkedFieldGroups = useMemo(() => getLinkedFieldGroups(template as any), [template]);
  const fieldsWithIndices = useFieldsWithIndices(template);

  const filteredFieldsWithIndices = useMemo(() => {
    const linkedGroupIds = linkedFieldGroups.map((f: any) => f.id);
    return fieldsWithIndices.filter(([f]) => linkedGroupIds.includes(f.id));
  }, [fieldsWithIndices, linkedFieldGroups]);

  return (
    <ConfirmDialog
      size="lg"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async ({ selectedGroupId }) => {
            if (!selectedGroupId) {
              return; // Form validation should handle this
            }

            onStep(
              "SELECT_PROFILE",
              {
                template,
                selectedGroupId,
              },
              { selectedGroupId },
            );
          }),
        },
      }}
      hasCloseButton
      header={
        <FormattedMessage
          id="component.create-petition-from-template-with-prefill-dialog.header-1"
          defaultMessage="Prefill parallel"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.create-petition-from-template-with-prefill-dialog.group-of-fields-description"
              defaultMessage="This template can be prefilled with profile information. Select which group of fields you would like to prefill."
            />
          </Text>

          <FormControl isInvalid={!!errors.selectedGroupId}>
            <FormLabel>
              <FormattedMessage
                id="component.create-petition-from-template-with-prefill-dialog.group-of-fields-label"
                defaultMessage="Group of fields"
              />
            </FormLabel>
            <Controller
              name="selectedGroupId"
              control={control}
              rules={{
                required: true,
              }}
              render={({ field: { onChange, value } }) => (
                <RadioGroup
                  as={Stack}
                  spacing={2}
                  onChange={onChange}
                  value={value || ""}
                  colorScheme="primary"
                >
                  {filteredFieldsWithIndices.map(([field, fieldIndex]) => (
                    <Radio key={field.id} value={field.id}>
                      <HStack>
                        <PetitionFieldTypeIndicator
                          as="span"
                          type={field.type}
                          fieldIndex={fieldIndex}
                        />
                        <OverflownText>
                          {field.options?.groupName || (
                            <PetitionFieldReference field={field} as="span" />
                          )}
                        </OverflownText>
                        {field.profileType && (
                          <Text fontSize="sm" color="gray.600" alignSelf="flex-end">
                            <ProfileTypeReference profileType={field.profileType} />
                          </Text>
                        )}
                      </HStack>
                    </Radio>
                  ))}
                </RadioGroup>
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="component.create-petition-from-template-with-prefill-dialog.group-of-fields-error"
                defaultMessage="Select a group of fields"
              />
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      alternative={
        <Button onClick={() => props.onReject("CREATE_EMPTY_PETITION")} variant="outline">
          <FormattedMessage
            id="component.create-petition-from-template-with-prefill-dialog.create-empty"
            defaultMessage="Create empty parallel"
          />
        </Button>
      }
      confirm={
        <Button type="submit" colorScheme="primary">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

function CreatePetitionFromTemplateSelectProfileStep({
  template,
  selectedGroupId,
  selectedProfileId,
  onStep,
  onBack,
  ...props
}: WizardStepDialogProps<
  CreatePetitionFromTemplateWithPrefillDialogSteps,
  "SELECT_PROFILE",
  string
>) {
  const focusRef = useRef<ProfileSelectInstance<false>>(null);

  const { handleSubmit, control, formState } = useForm<{
    profileId: string | null;
  }>({
    mode: "onSubmit",
    defaultValues: {
      profileId: selectedProfileId || null,
    },
  });

  const { errors } = formState;

  // Get profile type from selected field group
  const selectedFieldGroup = useMemo(
    () => template.fields.find((group: any) => group.id === selectedGroupId),
    [selectedGroupId],
  );

  const profileTypeIds = useMemo(
    () => (selectedFieldGroup?.profileType?.id ? [selectedFieldGroup.profileType.id] : []),
    [selectedFieldGroup],
  );

  const [createPetitionFromProfile] = useMutation(
    useCreatePetitionFromTemplateWithPrefillDialog_createPetitionFromProfileDocument,
  );

  const [getProfile] = useLazyQuery(useCreatePetitionFromTemplateWithPrefillDialog_profileDocument);

  const showPreviewImportFromProfileFormatErrorDialog =
    usePreviewImportFromProfileFormatErrorDialog();

  return (
    <ConfirmDialog
      size="lg"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async ({ profileId }) => {
            if (!profileId) return;

            try {
              // Fetch the complete profile data
              const { data: profileData } = await getProfile({ variables: { profileId } });

              const profile = profileData?.profile;
              if (!profile) {
                console.error("Profile not found:", profileId);
                return;
              }

              const compatibleFieldGroups = calculateCompatibleFieldGroups({
                profile,
                petition: template,
              });

              const relatedFieldGroupsWithCompatibleProfiles =
                calculateRelatedFieldGroupsWithCompatibleProfiles({
                  petition: template,
                  profile,
                  compatibleFieldGroups,
                  groupId: selectedGroupId,
                });

              // If there are no multiple groups compatible with the profile relationships, the step is skipped and the parallel is created.
              if (
                relatedFieldGroupsWithCompatibleProfiles.length === 1 &&
                relatedFieldGroupsWithCompatibleProfiles[0]?.[1]?.length === 1
              ) {
                const prefill = generatePrefillData(
                  relatedFieldGroupsWithCompatibleProfiles,
                  selectedGroupId,
                );

                const createPetition = async (skipFormatErrors: boolean) => {
                  const res = await createPetitionFromProfile({
                    variables: {
                      profileId: profile.id,
                      templateId: template.id,
                      prefill,
                      petitionFieldId: selectedGroupId,
                      skipFormatErrors,
                    },
                  });

                  if (isNonNullish(res?.data)) {
                    props.onResolve(res.data.createPetitionFromProfile.id);
                  } else {
                    props.onReject("ERROR");
                  }
                };

                try {
                  await createPetition(false);
                } catch (e) {
                  if (isApolloError(e, "INVALID_FORMAT_ERROR")) {
                    try {
                      await showPreviewImportFromProfileFormatErrorDialog({
                        profileIds: [profile.id],
                        profileTypeFieldIds: e.graphQLErrors?.[0].extensions
                          ?.profileTypeFieldIds as string[],
                      });
                      await createPetition(true);
                    } catch {}
                  } else {
                    props.onReject("ERROR");
                  }
                }
              } else {
                onStep(
                  "PREFILL_FIELD_GROUPS",
                  {
                    groupId: selectedGroupId,
                    profile,
                    template,
                  },
                  { selectedProfileId: profileId },
                );
              }
            } catch (error) {
              console.error("Failed to fetch profile:", error);
            }
          }),
        },
      }}
      initialFocusRef={focusRef}
      hasCloseButton
      header={
        <FormattedMessage
          id="component.create-petition-from-template-with-prefill-dialog.header-1"
          defaultMessage="Prefill parallel"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.create-petition-from-template-with-prefill-dialog.select-profile-description"
              defaultMessage="Select the profile with which to prefill the parallel"
            />
          </Text>

          <FormControl isInvalid={!!errors.profileId}>
            <FormLabel>
              <FormattedMessage
                id="component.create-petition-from-template-with-prefill-dialog.profile-label"
                defaultMessage="Profile"
              />
            </FormLabel>
            <Controller
              name="profileId"
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <ProfileSelect
                  ref={focusRef}
                  value={value}
                  onChange={(profile) => onChange(profile?.id ?? null)}
                  profileTypeId={profileTypeIds}
                  defaultOptions
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="component.create-petition-from-template-with-prefill-dialog.profile-error"
                defaultMessage="Please, select a profile"
              />
            </FormErrorMessage>
          </FormControl>

          <Text>
            <FormattedMessage
              id="component.create-petition-from-template-with-prefill-dialog.profile-not-found-help"
              defaultMessage="Can't find the profile? It may not exist yet."
            />
            <br />
            <FormattedMessage
              id="component.create-petition-from-template-with-prefill-dialog.profile-not-found-help-2"
              defaultMessage="You can create an empty parallel and then save the collected information in a profile."
            />
          </Text>
        </Stack>
      }
      alternative={
        <Button onClick={() => props.onReject("CREATE_EMPTY_PETITION")} variant="outline">
          <FormattedMessage
            id="component.create-petition-from-template-with-prefill-dialog.create-empty"
            defaultMessage="Create empty parallel"
          />
        </Button>
      }
      cancel={
        <Button onClick={() => onBack()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      confirm={
        <Button type="submit" colorScheme="primary">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useCreatePetitionFromTemplateWithPrefillDialog() {
  return useWizardDialog(
    {
      SELECT_FIELD_GROUPS: CreatePetitionFromTemplateSelectFieldGroupsStep,
      SELECT_PROFILE: CreatePetitionFromTemplateSelectProfileStep,
      PREFILL_FIELD_GROUPS: AssociateNewPetitionToProfileDialogPrefillFieldGroups,
    },
    "SELECT_FIELD_GROUPS",
  );
}

// Reuse fragments from the original dialog
useCreatePetitionFromTemplateWithPrefillDialog.fragments = {
  PetitionBase: gql`
    fragment useCreatePetitionFromTemplateWithPrefillDialog_PetitionBase on PetitionBase {
      id
      name
      fields {
        id
        type
        options
        ...PetitionFieldReference_PetitionField
        profileType {
          id
          ...ProfileTypeReference_ProfileType
        }
      }
      ...getLinkedFieldGroups_PetitionBase
      ...useFieldsWithIndices_PetitionBase
      ...ProfileRelationshipsAssociationTable_PetitionBase
      ...useAssociateNewPetitionToProfileDialog_PetitionBase
    }
    ${PetitionFieldReference.fragments.PetitionField}
    ${getLinkedFieldGroups.fragments.PetitionBase}
    ${useFieldsWithIndices.fragments.PetitionBase}
    ${ProfileRelationshipsAssociationTable.fragments.PetitionBase}
    ${ProfileTypeReference.fragments.ProfileType}
    ${useAssociateNewPetitionToProfileDialog.fragments.PetitionBase}
  `,
  Profile: gql`
    fragment useCreatePetitionFromTemplateWithPrefillDialog_Profile on Profile {
      id
      ...calculateCompatibleFieldGroups_Profile
      ...calculateRelatedFieldGroupsWithCompatibleProfiles_Profile
      ...useAssociateNewPetitionToProfileDialog_Profile
    }
    ${calculateCompatibleFieldGroups.fragments.Profile}
    ${calculateRelatedFieldGroupsWithCompatibleProfiles.fragments.Profile}
    ${useAssociateNewPetitionToProfileDialog.fragments.Profile}
  `,
};

const _queries = [
  gql`
    query useCreatePetitionFromTemplateWithPrefillDialog_profile($profileId: GID!) {
      profile(profileId: $profileId) {
        id
        ...useCreatePetitionFromTemplateWithPrefillDialog_Profile
      }
    }
    ${useCreatePetitionFromTemplateWithPrefillDialog.fragments.Profile}
  `,
];

const _mutations = [
  gql`
    mutation useCreatePetitionFromTemplateWithPrefillDialog_createPetitionFromProfile(
      $profileId: GID!
      $templateId: GID!
      $prefill: [CreatePetitionFromProfilePrefillInput!]!
      $petitionFieldId: GID
      $skipFormatErrors: Boolean
    ) {
      createPetitionFromProfile(
        profileId: $profileId
        templateId: $templateId
        prefill: $prefill
        petitionFieldId: $petitionFieldId
        skipFormatErrors: $skipFormatErrors
      ) {
        id
      }
    }
  `,
];

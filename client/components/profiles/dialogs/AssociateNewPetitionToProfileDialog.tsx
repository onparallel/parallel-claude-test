import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Radio,
  RadioGroup,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { PetitionFieldReference } from "@parallel/components/common/PetitionFieldReference";
import { PetitionSelect, PetitionSelectInstance } from "@parallel/components/common/PetitionSelect";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import { usePreviewImportFromProfileFormatErrorDialog } from "@parallel/components/petition-preview/dialogs/PreviewImportFromProfileFormatErrorDialog";
import { Button, HStack, Stack, Text } from "@parallel/components/ui";
import {
  CreatePetitionFromProfilePrefillInput,
  useAssociateNewPetitionToProfileDialog_createPetitionFromProfileDocument,
  useAssociateNewPetitionToProfileDialog_PetitionBaseFragment,
  useAssociateNewPetitionToProfileDialog_petitionDocument,
  useAssociateNewPetitionToProfileDialog_ProfileFragment,
  useAssociateNewPetitionToProfileDialog_ProfileTypeProcessFragment,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { groupFieldsWithProfileTypes } from "@parallel/utils/groupFieldsWithProfileTypes";
import {
  calculateCompatibleFieldGroups,
  calculateRelatedFieldGroupsWithCompatibleProfiles,
  generatePrefillData,
} from "@parallel/utils/petitions/profilePrefill";
import { useMemo, useRef } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { ProfileRelationshipsAssociationTable } from "../ProfileRelationshipsAssociationTable";

type AssociateNewPetitionToProfileDialogSteps = {
  SELECT_TEMPLATE: {
    profile: useAssociateNewPetitionToProfileDialog_ProfileFragment;
    keyProcess?: useAssociateNewPetitionToProfileDialog_ProfileTypeProcessFragment;
    selectedTemplateId?: string;
  };
  SELECT_FIELD_GROUP: {
    profile: useAssociateNewPetitionToProfileDialog_ProfileFragment;
    template: useAssociateNewPetitionToProfileDialog_PetitionBaseFragment;
    selectedGroupId?: string;
  };
  PREFILL_FIELD_GROUPS: {
    profile: useAssociateNewPetitionToProfileDialog_ProfileFragment;
    template: useAssociateNewPetitionToProfileDialog_PetitionBaseFragment;
    groupId: string;
  };
};

/*
  Dialog that is called from the related parallels table in the profile or from the key process cards.
  It has a maximum of 3 steps
  Step 1 "SELECT_TEMPLATE" - select the template to create the parallel,
        depending on the template group fields and user options all the following steps can be omitted or not
  Step 2 "SELECT_FIELD_GROUP" - only if you have more than one compatible group to choose from
  Step 3 "PREFILL_FIELD_GROUPS" - only if you have more than one group compatible with the current profile relationships
        and have the same relationship in the template.
*/

function AssociateNewPetitionToProfileDialogSelectTemplate({
  keyProcess,
  profile,
  selectedTemplateId,
  onStep,
  fromStep,
  ...props
}: WizardStepDialogProps<AssociateNewPetitionToProfileDialogSteps, "SELECT_TEMPLATE", string>) {
  const focusRef = useRef<PetitionSelectInstance<false>>(null);
  const { handleSubmit, control, register, formState, watch } = useForm<{
    templateId: string | null;
    fillWithProfileData: boolean;
  }>({
    mode: "onSubmit",
    defaultValues: {
      templateId:
        selectedTemplateId ??
        (isNonNullish(keyProcess) && keyProcess.templates.length === 1
          ? keyProcess.templates[0].id
          : null),
      fillWithProfileData: true,
    },
  });
  const { errors } = formState;
  const templateId = watch("templateId");

  const isFromKeyProcess = isNonNullish(keyProcess);

  const keyProcessTemplates = isFromKeyProcess
    ? keyProcess.templates.filter((t) => isNonNullish(t.myEffectivePermission))
    : [];

  const { loading, data } = useQuery(useAssociateNewPetitionToProfileDialog_petitionDocument, {
    variables: { id: templateId! },
    skip: !templateId,
  });

  const template = data?.petition;

  const compatibleFieldGroups = useMemo(
    () => calculateCompatibleFieldGroups({ profile, petition: template }),
    [template, profile],
  );

  const [createPetitionFromProfile, { loading: creatingPetition }] = useMutation(
    useAssociateNewPetitionToProfileDialog_createPetitionFromProfileDocument,
  );

  const showPreviewImportFromProfileFormatErrorDialog =
    usePreviewImportFromProfileFormatErrorDialog();

  return (
    <ConfirmDialog
      size="lg"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async ({ fillWithProfileData, templateId }) => {
            const groupId = compatibleFieldGroups[0]?.id;

            const relatedFieldGroupsWithCompatibleProfiles =
              calculateRelatedFieldGroupsWithCompatibleProfiles({
                petition: template,
                profile,
                compatibleFieldGroups,
                groupId,
              });

            const hasMultipleCompatibleGroupsOrFieldsWithProfiles =
              compatibleFieldGroups.length > 1 ||
              relatedFieldGroupsWithCompatibleProfiles.length > 1 ||
              relatedFieldGroupsWithCompatibleProfiles[0]?.[1]?.length > 1;

            // If do not have multiple compatible group fields and compatible relationships we can calculate the prefill and omit the following steps.
            if (!hasMultipleCompatibleGroupsOrFieldsWithProfiles || !fillWithProfileData) {
              const prefill = fillWithProfileData
                ? generatePrefillData(relatedFieldGroupsWithCompatibleProfiles, groupId)
                : [];

              const createPetition = async (skipFormatErrors: boolean) => {
                const res = await createPetitionFromProfile({
                  variables: {
                    profileId: profile.id,
                    templateId: templateId!,
                    prefill,
                    petitionFieldId: fillWithProfileData ? groupId : undefined,
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
                    const profileIds = prefill.flatMap((p) => p.profileIds);
                    await showPreviewImportFromProfileFormatErrorDialog({
                      profileTypeId: profile.profileType.id,
                      profileIds,
                      profileTypeFieldIds: e.errors?.[0].extensions
                        ?.profileTypeFieldIds as string[],
                    });
                    await createPetition(true);
                  } catch {}
                } else {
                  props.onReject("ERROR");
                }
              }
            } else {
              // we omit SELECT_FIELD_GROUP step and jump to the final if do not have multiple compatible group fields
              if (compatibleFieldGroups.length === 1) {
                onStep(
                  "PREFILL_FIELD_GROUPS",
                  {
                    profile,
                    template: template!,
                    groupId,
                  },
                  { selectedTemplateId: template!.id },
                );
              } else {
                onStep(
                  "SELECT_FIELD_GROUP",
                  {
                    profile,
                    template: template!,
                  },
                  { selectedTemplateId: template!.id },
                );
              }
            }
          }),
        },
      }}
      initialFocusRef={focusRef}
      hasCloseButton
      header={
        <FormattedMessage
          id="component.associate-new-petition-to-profile-dialog.header-1"
          defaultMessage="New parallel"
        />
      }
      body={
        <Stack>
          {isFromKeyProcess && keyProcessTemplates.length === 0 ? (
            <Alert status="warning" rounded="md">
              <AlertIcon />
              <AlertDescription>
                <FormattedMessage
                  id="component.associate-new-petition-to-profile-dialog.no-access-to-process-templates"
                  defaultMessage="You don't have access to these templates. Request it to the owner of the organization to create parallels."
                />
              </AlertDescription>
            </Alert>
          ) : null}
          <FormControl isInvalid={!!errors.templateId}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.associate-new-petition-to-profile-dialog.template-label"
                defaultMessage="Template"
              />
            </FormLabel>
            <Controller
              name="templateId"
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <PetitionSelect
                  ref={focusRef}
                  isDisabled={isFromKeyProcess && keyProcessTemplates.length === 0}
                  isSync={isFromKeyProcess}
                  defaultOptions={!isFromKeyProcess}
                  options={isFromKeyProcess ? keyProcessTemplates : undefined}
                  type="TEMPLATE"
                  value={value}
                  onChange={(v) => {
                    onChange(v?.id ?? null);
                  }}
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="component.associate-new-petition-to-profile-dialog.template-error"
                defaultMessage="Please, select a template"
              />
            </FormErrorMessage>
          </FormControl>

          {compatibleFieldGroups.length ? (
            <FormControl>
              <Checkbox {...register("fillWithProfileData")} colorScheme="primary">
                <FormattedMessage
                  id="component.associate-new-petition-to-profile-dialog.prefill-checkbox-label"
                  defaultMessage="Prefill with profile information and relationships"
                />
              </Checkbox>
            </FormControl>
          ) : null}
        </Stack>
      }
      confirm={
        <Button
          type="submit"
          colorPalette="primary"
          loading={loading || creatingPetition}
          disabled={!formState.isValid || (isFromKeyProcess && keyProcessTemplates.length === 0)}
        >
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

function AssociateNewPetitionToProfileDialogSelectFieldGroup({
  template,
  profile,
  selectedGroupId,
  onStep,
  onBack,
  ...props
}: WizardStepDialogProps<AssociateNewPetitionToProfileDialogSteps, "SELECT_FIELD_GROUP", string>) {
  const intl = useIntl();

  const compatibleFieldGroups = useMemo(
    () => calculateCompatibleFieldGroups({ profile, petition: template }),
    [template, profile],
  );

  const { handleSubmit, control, formState } = useForm<{
    groupId?: string;
  }>({
    mode: "onSubmit",
    defaultValues: {
      groupId: selectedGroupId ?? compatibleFieldGroups[0]?.id,
    },
  });
  const { errors } = formState;

  const fieldsWithIndices = useFieldsWithIndices(template);

  const compatibleFieldGroupsIds = groupFieldsWithProfileTypes(compatibleFieldGroups).map(
    ([f]) => f.id,
  );

  const filteredFieldsWithIndices = useMemo(() => {
    return fieldsWithIndices.filter(([f]) => compatibleFieldGroupsIds.includes(f.id));
  }, [fieldsWithIndices, compatibleFieldGroupsIds.join(",")]);

  const [createPetitionFromProfile, { loading: creatingPetition }] = useMutation(
    useAssociateNewPetitionToProfileDialog_createPetitionFromProfileDocument,
  );

  const showPreviewImportFromProfileFormatErrorDialog =
    usePreviewImportFromProfileFormatErrorDialog();

  return (
    <ConfirmDialog
      size="xl"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async ({ groupId }) => {
            const relatedFieldGroupsWithCompatibleProfiles =
              calculateRelatedFieldGroupsWithCompatibleProfiles({
                petition: template,
                profile,
                compatibleFieldGroups,
                groupId,
              });

            // If there are no multiple groups compatible with the profile relationships, the step is skipped and the parallel is created.
            if (
              relatedFieldGroupsWithCompatibleProfiles.length === 1 &&
              relatedFieldGroupsWithCompatibleProfiles[0]?.[1]?.length === 1
            ) {
              const prefill = generatePrefillData(
                relatedFieldGroupsWithCompatibleProfiles,
                groupId!,
              );

              const createPetition = async (skipFormatErrors: boolean) => {
                const res = await createPetitionFromProfile({
                  variables: {
                    profileId: profile.id,
                    templateId: template.id,
                    prefill,
                    petitionFieldId: groupId,
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
                    const profileIds = prefill.flatMap((p) => p.profileIds);
                    await showPreviewImportFromProfileFormatErrorDialog({
                      profileTypeId: profile.profileType.id,
                      profileIds,
                      profileTypeFieldIds: e.errors?.[0].extensions
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
                  groupId: groupId!,
                  profile,
                  template,
                },
                { selectedGroupId: groupId },
              );
            }
          }),
        },
      }}
      hasCloseButton
      header={
        <FormattedMessage
          id="component.associate-new-petition-to-profile-dialog.header-2"
          defaultMessage="Prefill groups"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.associate-new-petition-to-profile-dialog.select-group-label"
              defaultMessage="Select in which group you want to pre-fill the profile information:"
            />
          </Text>
          <FormControl isInvalid={!!errors.groupId}>
            <FormLabel>
              <Text as="span" fontSize="md">
                <LocalizableUserTextRender
                  default={intl.formatMessage({
                    id: "generic.unnamed-profile",
                    defaultMessage: "Unnamed profile",
                  })}
                  value={profile.localizableName}
                />
              </Text>
              &nbsp;
              <Text as="span" fontSize="sm" fontWeight="normal">
                <LocalizableUserTextRender
                  default={intl.formatMessage({
                    id: "generic.unnamed-profile-type",
                    defaultMessage: "Unnamed profile type",
                  })}
                  value={profile.profileType.name}
                />
              </Text>
            </FormLabel>
            <Controller
              name="groupId"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <RadioGroup
                  as={Stack}
                  gap={2}
                  onChange={(value) => onChange(value as string)}
                  value={value}
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
                      </HStack>
                    </Radio>
                  ))}
                </RadioGroup>
              )}
            />
          </FormControl>
        </Stack>
      }
      cancel={
        <Button onClick={() => onBack()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      confirm={
        <Button
          type="submit"
          colorPalette="primary"
          disabled={!formState.isValid}
          loading={creatingPetition}
        >
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function AssociateNewPetitionToProfileDialogPrefillFieldGroups({
  profile,
  template,
  groupId,
  onStep,
  onBack,
  ...props
}: WizardStepDialogProps<
  AssociateNewPetitionToProfileDialogSteps,
  "PREFILL_FIELD_GROUPS",
  string
>) {
  const intl = useIntl();
  const form = useForm<{
    prefill: CreatePetitionFromProfilePrefillInput[];
  }>({
    mode: "onSubmit",
    defaultValues: {
      prefill: [],
    },
  });

  const { handleSubmit } = form;

  const [createPetitionFromProfile, { loading: creatingPetition }] = useMutation(
    useAssociateNewPetitionToProfileDialog_createPetitionFromProfileDocument,
  );

  const showPreviewImportFromProfileFormatErrorDialog =
    usePreviewImportFromProfileFormatErrorDialog();

  return (
    <ConfirmDialog
      size="3xl"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async ({ prefill }) => {
            const createPetition = async (skipFormatErrors: boolean) => {
              const res = await createPetitionFromProfile({
                variables: {
                  profileId: profile.id,
                  templateId: template.id,
                  prefill,
                  petitionFieldId: groupId,
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
                  const profileIds = prefill.flatMap((p) => p.profileIds);
                  await showPreviewImportFromProfileFormatErrorDialog({
                    profileTypeId: profile.profileType.id,
                    profileIds,
                    profileTypeFieldIds: e.errors?.[0].extensions?.profileTypeFieldIds as string[],
                  });
                  await createPetition(true);
                } catch {}
              } else {
                props.onReject("ERROR");
              }
            }
          }),
        },
      }}
      hasCloseButton
      header={
        <FormattedMessage
          id="component.associate-new-petition-to-profile-dialog.header-3"
          defaultMessage="Include relationships"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.associate-new-petition-to-profile-dialog.relationships-label"
              defaultMessage="Select the profile relationships you want to include in the {templateName} parallel."
              values={{
                templateName: template.name ? (
                  <b>{template.name}</b>
                ) : (
                  <i>
                    {intl.formatMessage({
                      id: "generic.unnamed-template",
                      defaultMessage: "Unnamed template",
                    })}
                  </i>
                ),
              }}
            />
          </Text>
          <FormProvider {...form}>
            <ProfileRelationshipsAssociationTable
              name="prefill"
              groupId={groupId}
              petition={template}
              profile={profile}
              isDefaultChecked
            />
          </FormProvider>
        </Stack>
      }
      cancel={
        <Button onClick={() => onBack()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      confirm={
        <Button colorPalette="primary" type="submit" loading={creatingPetition}>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useAssociateNewPetitionToProfileDialog() {
  return useWizardDialog(
    {
      SELECT_TEMPLATE: AssociateNewPetitionToProfileDialogSelectTemplate,
      SELECT_FIELD_GROUP: AssociateNewPetitionToProfileDialogSelectFieldGroup,
      PREFILL_FIELD_GROUPS: AssociateNewPetitionToProfileDialogPrefillFieldGroups,
    },
    "SELECT_TEMPLATE",
  );
}

const _fragments = {
  PetitionBase: gql`
    fragment useAssociateNewPetitionToProfileDialog_PetitionBase on PetitionBase {
      id
      name
      fields {
        id
        type
        options
        ...PetitionFieldReference_PetitionField
        ...groupFieldsWithProfileTypes_PetitionField
      }
      ...useFieldsWithIndices_PetitionBase
      ...ProfileRelationshipsAssociationTable_PetitionBase
    }
  `,
  ProfileInner: gql`
    fragment useAssociateNewPetitionToProfileDialog_ProfileInner on Profile {
      id
      localizableName
      profileType {
        id
      }
    }
  `,
  ProfileTypeProcess: gql`
    fragment useAssociateNewPetitionToProfileDialog_ProfileTypeProcess on ProfileTypeProcess {
      id
      templates {
        id
        name
        myEffectivePermission {
          permissionType
        }
      }
    }
  `,
  Profile: gql`
    fragment useAssociateNewPetitionToProfileDialog_Profile on Profile {
      ...useAssociateNewPetitionToProfileDialog_ProfileInner
      profileType {
        id
        name
      }
      ...ProfileRelationshipsAssociationTable_Profile
    }
  `,
};

const _queries = [
  gql`
    query useAssociateNewPetitionToProfileDialog_petition($id: GID!) {
      petition(id: $id) {
        ...useAssociateNewPetitionToProfileDialog_PetitionBase
      }
    }
  `,
];

const _mutations = [
  gql`
    mutation useAssociateNewPetitionToProfileDialog_createPetitionFromProfile(
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

import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Radio,
  RadioGroup,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { RadioButtonSelected } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { PetitionFieldReference } from "@parallel/components/common/PetitionFieldReference";
import { PetitionSelect, PetitionSelectInstance } from "@parallel/components/common/PetitionSelect";
import { ScrollTableContainer } from "@parallel/components/common/ScrollTableContainer";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import {
  CreatePetitionFromProfilePrefillInput,
  useAssociateNewPetitionToProfileDialog_createPetitionFromProfileDocument,
  useAssociateNewPetitionToProfileDialog_PetitionBaseFragment,
  useAssociateNewPetitionToProfileDialog_petitionDocument,
  useAssociateNewPetitionToProfileDialog_ProfileFragment,
  useAssociateNewPetitionToProfileDialog_ProfileInnerFragment,
  useAssociateNewPetitionToProfileDialog_ProfileTypeProcessFragment,
} from "@parallel/graphql/__types";
import { useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { Assert, UnwrapArray } from "@parallel/utils/types";
import { useMemo, useRef } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish, uniqueBy } from "remeda";

type PetitionFieldSelection = UnwrapArray<
  Assert<useAssociateNewPetitionToProfileDialog_PetitionBaseFragment["fields"]>
>;

type AssociateNewPetitionToProfileDialogSteps = {
  SELECT_TEMPLATE: {
    profile: useAssociateNewPetitionToProfileDialog_ProfileFragment;
    keyProcess?: useAssociateNewPetitionToProfileDialog_ProfileTypeProcessFragment;
    selectedTemplateId?: string;
  };
  SELECT_FIELD_GROUP: {
    profile: useAssociateNewPetitionToProfileDialog_ProfileFragment;
    template: useAssociateNewPetitionToProfileDialog_PetitionBaseFragment;
    profileTypeProcessId?: string;
    selectedGroupId?: string;
  };
  PREFILL_FIELD_GROUPS: {
    profile: useAssociateNewPetitionToProfileDialog_ProfileFragment;
    template: useAssociateNewPetitionToProfileDialog_PetitionBaseFragment;
    groupId: string;
    profileTypeProcessId?: string;
  };
};

const calculateCompatibleFieldGroups = ({
  profile,
  template,
}: {
  profile: useAssociateNewPetitionToProfileDialog_ProfileFragment;
  template?: useAssociateNewPetitionToProfileDialog_PetitionBaseFragment | null;
}) => {
  if (!template) return [];

  const allFieldGroups =
    template.fields.filter(
      (f) => isNonNullish(f) && f.type === "FIELD_GROUP" && f.isLinkedToProfileType,
    ) ?? [];

  return allFieldGroups.filter((f) => f.profileType?.id === profile.profileType.id);
};

const calculateRelatedFieldGroupsWithCompatibleProfiles = ({
  profile,
  template,
  compatibleFieldGroups,
  groupId,
}: {
  profile: useAssociateNewPetitionToProfileDialog_ProfileFragment;
  template?: useAssociateNewPetitionToProfileDialog_PetitionBaseFragment | null;
  compatibleFieldGroups: PetitionFieldSelection[];
  groupId?: string;
}): [PetitionFieldSelection, useAssociateNewPetitionToProfileDialog_ProfileInnerFragment[]][] => {
  if (!template || !compatibleFieldGroups.length) return [];

  const allFieldGroups =
    template.fields.filter(
      (f) => isNonNullish(f) && f.type === "FIELD_GROUP" && f.isLinkedToProfileType,
    ) ?? [];

  const selectedGroup = groupId
    ? compatibleFieldGroups.find((f) => f.id === groupId)
    : compatibleFieldGroups[0];
  const selectedGroupId = selectedGroup?.id;

  // Filter the compatible relationships that the template has configured with the selected group, by default the first one.
  const templateRelationships = template.fieldRelationships.filter(
    (r) =>
      selectedGroupId === r.rightSidePetitionField.id ||
      selectedGroupId === r.leftSidePetitionField.id,
  );

  const relatedFieldGroupsWithCompatibleProfiles =
    profile.relationships.length === 0
      ? isNonNullish(selectedGroup)
        ? ([[selectedGroup, [profile]]] as [
            PetitionFieldSelection,
            useAssociateNewPetitionToProfileDialog_ProfileInnerFragment[],
          ][])
        : []
      : (allFieldGroups
          .map((f) => {
            const profiles = uniqueBy(
              [
                ...(selectedGroupId === f.id ? [profile] : []),
                // filter the available relationships in the profile to suggest the "prefill" in step 3
                ...profile.relationships
                  .filter((pr) =>
                    templateRelationships
                      .filter(
                        // relationships of the same type
                        (tr) =>
                          tr.relationshipTypeWithDirection.profileRelationshipType.id ===
                          pr.relationshipType.id,
                      )
                      .some((tr) => {
                        let [leftId, rightId] = [
                          tr.leftSidePetitionField.id,
                          tr.rightSidePetitionField.id,
                        ];
                        if (tr.relationshipTypeWithDirection.profileRelationshipType.isReciprocal) {
                          return (
                            (leftId === selectedGroupId && rightId === f.id) ||
                            (leftId === f.id && rightId === selectedGroupId)
                          );
                        }
                        if (pr.rightSideProfile.id === profile.id) {
                          [leftId, rightId] = [rightId, leftId];
                        }
                        if (tr.relationshipTypeWithDirection.direction === "RIGHT_LEFT") {
                          [leftId, rightId] = [rightId, leftId];
                        }
                        return leftId === selectedGroupId && rightId === f.id;
                      }),
                  )
                  .map((r) =>
                    r.leftSideProfile.id === profile.id ? r.rightSideProfile : r.leftSideProfile,
                  ),
              ],
              (p) => p.id,
            );

            const filteredProfiles = profiles.filter((p) => p.profileType.id === f.profileType?.id);

            return filteredProfiles.length > 0 ? [f, filteredProfiles] : null;
          })
          .filter(isNonNullish) as [
          PetitionFieldSelection,
          useAssociateNewPetitionToProfileDialog_ProfileInnerFragment[],
        ][]);

  return relatedFieldGroupsWithCompatibleProfiles;
};

const generatePrefillData = (
  relatedFieldGroupsWithCompatibleProfiles: [
    PetitionFieldSelection,
    useAssociateNewPetitionToProfileDialog_ProfileInnerFragment[],
  ][],
  selectedGroupId: string,
): CreatePetitionFromProfilePrefillInput[] => {
  return relatedFieldGroupsWithCompatibleProfiles
    .map(([field, profiles]: [any, any[]]) => ({
      petitionFieldId: field.id,
      profileIds: !field.multiple ? [profiles[0]?.id] : profiles.map((p) => p.id),
    }))
    .sort((a, b) =>
      a.petitionFieldId === selectedGroupId ? -1 : b.petitionFieldId === selectedGroupId ? 1 : 0,
    );
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
    () => calculateCompatibleFieldGroups({ profile, template }),
    [template, profile],
  );

  const [createPetitionFromProfile, { loading: creatingPetition }] = useMutation(
    useAssociateNewPetitionToProfileDialog_createPetitionFromProfileDocument,
  );

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
                template,
                profile,
                compatibleFieldGroups,
                groupId,
              });

            const hasMultipleCompatibleGroupsOrFieldsWithProfiles =
              compatibleFieldGroups.length > 1 ||
              relatedFieldGroupsWithCompatibleProfiles.length > 1;
            // If do not have multiple compatible group fields and compatible relationships we can calculate the prefill and omit the following steps.
            if (!hasMultipleCompatibleGroupsOrFieldsWithProfiles || !fillWithProfileData) {
              const prefill = fillWithProfileData
                ? generatePrefillData(relatedFieldGroupsWithCompatibleProfiles, groupId)
                : [];
              const res = await createPetitionFromProfile({
                variables: {
                  profileId: profile.id,
                  templateId: templateId!,
                  prefill,
                  petitionFieldId: fillWithProfileData ? groupId : undefined,
                  profileTypeProcessId: keyProcess?.id,
                },
              });

              if (isNonNullish(res?.data)) {
                props.onResolve(res.data.createPetitionFromProfile.id);
              } else {
                props.onReject("ERROR");
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
                    profileTypeProcessId: keyProcess?.id,
                  },
                  { selectedTemplateId: template!.id },
                );
              } else {
                onStep(
                  "SELECT_FIELD_GROUP",
                  {
                    profile,
                    template: template!,
                    profileTypeProcessId: keyProcess?.id,
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
          colorScheme="primary"
          isLoading={loading || creatingPetition}
          isDisabled={!formState.isValid || (isFromKeyProcess && keyProcessTemplates.length === 0)}
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
  profileTypeProcessId,
  selectedGroupId,
  onStep,
  onBack,
  ...props
}: WizardStepDialogProps<AssociateNewPetitionToProfileDialogSteps, "SELECT_FIELD_GROUP", string>) {
  const intl = useIntl();

  const compatibleFieldGroups = useMemo(
    () => calculateCompatibleFieldGroups({ profile, template }),
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

  const compatibleFieldGroupsIds = compatibleFieldGroups.map((f) => f.id);

  const filteredFieldsWithIndices = useMemo(() => {
    return fieldsWithIndices.filter(([f]) => compatibleFieldGroupsIds.includes(f.id));
  }, [fieldsWithIndices, compatibleFieldGroupsIds.join(",")]);

  const [createPetitionFromProfile, { loading: creatingPetition }] = useMutation(
    useAssociateNewPetitionToProfileDialog_createPetitionFromProfileDocument,
  );

  return (
    <ConfirmDialog
      size="xl"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async ({ groupId }) => {
            const relatedFieldGroupsWithCompatibleProfiles =
              calculateRelatedFieldGroupsWithCompatibleProfiles({
                template,
                profile,
                compatibleFieldGroups,
                groupId,
              });

            // If there are no multiple groups compatible with the profile relationships, the step is skipped and the parallel is created.
            if (relatedFieldGroupsWithCompatibleProfiles.length < 2) {
              const prefill = generatePrefillData(
                relatedFieldGroupsWithCompatibleProfiles,
                groupId!,
              );

              const res = await createPetitionFromProfile({
                variables: {
                  profileId: profile.id,
                  templateId: template.id,
                  prefill,
                  petitionFieldId: groupId,
                  profileTypeProcessId,
                },
              });

              if (isNonNullish(res?.data)) {
                props.onResolve(res.data.createPetitionFromProfile.id);
              } else {
                props.onReject("ERROR");
              }
            } else {
              onStep(
                "PREFILL_FIELD_GROUPS",
                {
                  groupId: groupId!,
                  profile,
                  template,
                  profileTypeProcessId,
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
                  spacing={2}
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
          colorScheme="primary"
          isDisabled={!formState.isValid}
          isLoading={creatingPetition}
        >
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

function AssociateNewPetitionToProfileDialogPrefillFieldGroups({
  profile,
  template,
  groupId,
  profileTypeProcessId,
  onStep,
  onBack,
  ...props
}: WizardStepDialogProps<
  AssociateNewPetitionToProfileDialogSteps,
  "PREFILL_FIELD_GROUPS",
  string
>) {
  const intl = useIntl();

  const compatibleFieldGroups = useMemo(
    () => calculateCompatibleFieldGroups({ profile, template }),
    [template, profile],
  );

  const relatedFieldGroupsWithCompatibleProfiles = useMemo(
    () =>
      calculateRelatedFieldGroupsWithCompatibleProfiles({
        template,
        profile,
        compatibleFieldGroups,
        groupId,
      }),
    [template, profile, groupId],
  );

  const { handleSubmit, control } = useForm<{
    prefill: CreatePetitionFromProfilePrefillInput[];
  }>({
    mode: "onSubmit",
    defaultValues: {
      prefill: generatePrefillData(relatedFieldGroupsWithCompatibleProfiles, groupId),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "prefill",
  });

  const fieldsWithIndices = useFieldsWithIndices(template);

  const [createPetitionFromProfile, { loading: creatingPetition }] = useMutation(
    useAssociateNewPetitionToProfileDialog_createPetitionFromProfileDocument,
  );

  return (
    <ConfirmDialog
      size="3xl"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async ({ prefill }) => {
            const res = await createPetitionFromProfile({
              variables: {
                profileId: profile.id,
                templateId: template.id,
                prefill,
                petitionFieldId: groupId,
                profileTypeProcessId,
              },
            });

            if (isNonNullish(res?.data)) {
              props.onResolve(res.data.createPetitionFromProfile.id);
            } else {
              props.onReject("ERROR");
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
          <ScrollTableContainer maxHeight="350px">
            <Table variant="parallel">
              <Thead>
                <Tr position="sticky" top={0} zIndex={1}>
                  <Th>
                    <FormattedMessage
                      id="component.associate-new-petition-to-profile-dialog.table-header-group"
                      defaultMessage="Group"
                    />
                  </Th>
                  <Th>
                    <FormattedMessage
                      id="component.associate-new-petition-to-profile-dialog.table-header-profile"
                      defaultMessage="Profile"
                    />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {fields.map((item, index) => {
                  const [field, profiles] = relatedFieldGroupsWithCompatibleProfiles.find(
                    ([field]) => field.id === item.petitionFieldId,
                  ) as [
                    PetitionFieldSelection,
                    useAssociateNewPetitionToProfileDialog_ProfileInnerFragment[],
                  ];

                  const isRadioButton = !field.multiple;
                  const [_, fieldIndex] = fieldsWithIndices.find(([f]) => f.id === field.id)!;

                  if (isNullish(field) || isNullish(profiles)) return null;

                  return (
                    <Tr key={item.id}>
                      <Td>
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
                      </Td>
                      <Td>
                        <Controller
                          name={`prefill.${index}.profileIds` as const}
                          control={control}
                          render={({ field: { onChange, value } }) => {
                            return (
                              <CheckboxGroup
                                key={item.id}
                                colorScheme="primary"
                                value={value}
                                onChange={isRadioButton ? undefined : onChange}
                              >
                                <Stack>
                                  {profiles.map((compatibleProfile) => {
                                    const isDefaultChecked =
                                      compatibleProfile.id === profile.id && groupId === field.id;

                                    const isDisabled = isRadioButton && index === 0;

                                    return (
                                      <Checkbox
                                        key={compatibleProfile.id + field.id}
                                        value={compatibleProfile.id}
                                        isDisabled={isDefaultChecked || isDisabled}
                                        onChange={
                                          isRadioButton
                                            ? (e) =>
                                                onChange(e.target.checked ? [e.target.value] : [])
                                            : undefined
                                        }
                                        {...(isRadioButton
                                          ? {
                                              icon:
                                                isDisabled && !isDefaultChecked ? undefined : (
                                                  <RadioButtonSelected />
                                                ),
                                              variant: "radio",
                                            }
                                          : {})}
                                      >
                                        <LocalizableUserTextRender
                                          default={intl.formatMessage({
                                            id: "generic.unnamed-profile",
                                            defaultMessage: "Unnamed profile",
                                          })}
                                          value={compatibleProfile.localizableName}
                                        />
                                      </Checkbox>
                                    );
                                  })}
                                </Stack>
                              </CheckboxGroup>
                            );
                          }}
                        />
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </ScrollTableContainer>
        </Stack>
      }
      cancel={
        <Button onClick={() => onBack()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      confirm={
        <Button colorScheme="primary" type="submit" isLoading={creatingPetition}>
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

useAssociateNewPetitionToProfileDialog.fragments = {
  get PetitionBase() {
    return gql`
      fragment useAssociateNewPetitionToProfileDialog_PetitionBase on PetitionBase {
        id
        name
        fields {
          id
          type
          title
          alias
          isLinkedToProfileType
          options
          multiple
          profileType {
            id
            name
            isStandard
          }
          ...PetitionFieldReference_PetitionField
        }
        fieldRelationships {
          id
          leftSidePetitionField {
            id
            profileType {
              id
            }
          }
          rightSidePetitionField {
            id
            profileType {
              id
            }
          }
          relationshipTypeWithDirection {
            direction
            profileRelationshipType {
              id
              isReciprocal
            }
          }
        }
        ...useFieldsWithIndices_PetitionBase
      }
      ${PetitionFieldReference.fragments.PetitionField}
      ${useFieldsWithIndices.fragments.PetitionBase}
    `;
  },
  get ProfileInner() {
    return gql`
      fragment useAssociateNewPetitionToProfileDialog_ProfileInner on Profile {
        id
        localizableName
        profileType {
          id
        }
      }
    `;
  },
  get ProfileTypeProcess() {
    return gql`
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
    `;
  },
  get Profile() {
    return gql`
      fragment useAssociateNewPetitionToProfileDialog_Profile on Profile {
        ...useAssociateNewPetitionToProfileDialog_ProfileInner
        profileType {
          id
          name
        }
        relationships {
          ...useAssociateNewPetitionToProfileDialog_ProfileRelationship
        }
      }
      ${this.ProfileInner}
      ${this.ProfileRelationship}
    `;
  },
  get ProfileRelationship() {
    return gql`
      fragment useAssociateNewPetitionToProfileDialog_ProfileRelationship on ProfileRelationship {
        id
        leftSideProfile {
          ...useAssociateNewPetitionToProfileDialog_ProfileInner
        }
        rightSideProfile {
          ...useAssociateNewPetitionToProfileDialog_ProfileInner
        }
        relationshipType {
          id
          isReciprocal
        }
      }
      ${this.ProfileInner}
    `;
  },
};

const _queries = [
  gql`
    query useAssociateNewPetitionToProfileDialog_petition($id: GID!) {
      petition(id: $id) {
        ...useAssociateNewPetitionToProfileDialog_PetitionBase
      }
    }
    ${useAssociateNewPetitionToProfileDialog.fragments.PetitionBase}
  `,
  gql`
    query useAssociateNewPetitionToProfileDialog_profileRelationshipTypes {
      profileRelationshipTypes {
        id
        alias
        allowedLeftRightProfileTypeIds
        allowedRightLeftProfileTypeIds
        isReciprocal
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
      $profileTypeProcessId: GID
    ) {
      createPetitionFromProfile(
        profileId: $profileId
        templateId: $templateId
        prefill: $prefill
        petitionFieldId: $petitionFieldId
        profileTypeProcessId: $profileTypeProcessId
      ) {
        id
      }
    }
  `,
];

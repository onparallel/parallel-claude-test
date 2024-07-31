import { gql, useMutation, useQuery } from "@apollo/client";
import {
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
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useCounter,
} from "@chakra-ui/react";
import { RadioButtonSelected } from "@parallel/chakra/icons";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { PetitionSelect, PetitionSelectInstance } from "@parallel/components/common/PetitionSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PetitionFieldReference } from "@parallel/components/common/PetitionFieldReference";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import {
  CreatePetitionFromProfilePrefillInput,
  useAssociateNewPetitionToProfileDialog_PetitionBaseFragment,
  useAssociateNewPetitionToProfileDialog_ProfileFragment,
  useAssociateNewPetitionToProfileDialog_ProfileInnerFragment,
  useAssociateNewPetitionToProfileDialog_createPetitionFromProfileDocument,
  useAssociateNewPetitionToProfileDialog_petitionDocument,
} from "@parallel/graphql/__types";
import { useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { Assert, UnwrapArray } from "@parallel/utils/types";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { ForwardedRef, forwardRef, useEffect, useMemo, useRef } from "react";
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, uniqBy } from "remeda";

type PetitionFieldSelection = UnwrapArray<
  Assert<useAssociateNewPetitionToProfileDialog_PetitionBaseFragment["fields"]>
>;

interface AssociateNewPetitionToProfileDialogProps {
  profile: useAssociateNewPetitionToProfileDialog_ProfileFragment;
}

interface AssociateNewPetitionToProfileDialogData {
  templateId: string | null;
  fillWithProfileData: boolean;
  groupId?: string;
  prefill: CreatePetitionFromProfilePrefillInput[];
}

function AssociateNewPetitionToProfileDialog({
  profile,
  ...props
}: DialogProps<AssociateNewPetitionToProfileDialogProps, {}>) {
  const goToPetition = useGoToPetition();
  const showGenericErrorToast = useGenericErrorToast();
  const form = useForm<AssociateNewPetitionToProfileDialogData>({
    defaultValues: { templateId: null, fillWithProfileData: true, prefill: [] },
  });

  const { handleSubmit, trigger, watch, setValue, control } = form;

  const { replace } = useFieldArray({
    control,
    name: "prefill",
  });

  const templateId = watch("templateId");
  const fillWithProfileData = watch("fillWithProfileData");
  const groupId = watch("groupId");

  const { loading, data } = useQuery(useAssociateNewPetitionToProfileDialog_petitionDocument, {
    variables: { id: templateId! },
    skip: !templateId,
  });

  const template = data?.petition;

  const { fieldsWithCompatibleProfiles = [], compatibleFieldGroups = [] } = useMemo(() => {
    if (!template) return {};

    const allFieldGroups =
      template.fields.filter(
        (f) => isDefined(f) && f.type === "FIELD_GROUP" && f.isLinkedToProfileType,
      ) ?? [];

    // Filter the groups of fields compatible with the profile to suggest in step 2.
    const compatibleFieldGroups = allFieldGroups.filter(
      (f) => f.profileType?.id === profile.profileType.id,
    );

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

    const fieldsWithCompatibleProfiles =
      profile.relationships.length === 0
        ? isDefined(selectedGroup)
          ? ([[selectedGroup, [profile]]] as [
              PetitionFieldSelection,
              useAssociateNewPetitionToProfileDialog_ProfileInnerFragment[],
            ][])
          : undefined
        : (allFieldGroups
            .map((f) => {
              const profiles = uniqBy(
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
                          if (
                            tr.relationshipTypeWithDirection.profileRelationshipType.isReciprocal
                          ) {
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

              const filteredProfiles = profiles.filter(
                (p) => p.profileType.id === f.profileType?.id,
              );

              return filteredProfiles.length > 0 ? [f, filteredProfiles] : null;
            })
            .filter(isDefined) as [
            PetitionFieldSelection,
            useAssociateNewPetitionToProfileDialog_ProfileInnerFragment[],
          ][]);

    return { fieldsWithCompatibleProfiles, compatibleFieldGroups };
  }, [template, profile, groupId]);

  const compatibleFieldGroupsIds = compatibleFieldGroups.map((f) => f.id);

  const omitStep2 = compatibleFieldGroupsIds.length < 2;
  const omitStep3 = fieldsWithCompatibleProfiles.length < 2;

  let maxSteps = 2;
  if (!fillWithProfileData) maxSteps = 0;
  else {
    if (omitStep2) --maxSteps;
    if (omitStep3) --maxSteps;
  }

  const {
    valueAsNumber: currentStep,
    isAtMax: isLastStep,
    increment: nextStep,
    decrement: previousStep,
  } = useCounter({ min: 0, max: maxSteps, defaultValue: 0 });

  const selectRef = useRef<PetitionSelectInstance<false>>(null);
  const selectedGroupId = groupId ?? compatibleFieldGroupsIds[0];
  useEffect(() => {
    replace(
      fieldsWithCompatibleProfiles
        .map(([field, profiles]) => {
          const isRadio = !field.multiple;

          return {
            petitionFieldId: field.id,
            profileIds: isRadio ? [profiles[0]?.id] : profiles.map((p) => p.id),
          };
        })
        .sort((fieldA, fieldB) =>
          fieldA.petitionFieldId === selectedGroupId
            ? -1
            : fieldB.petitionFieldId === selectedGroupId
              ? 1
              : 0,
        ),
    );
  }, [templateId, selectedGroupId]);

  const handleNextClick = async () => {
    if (currentStep === 0 && !(await trigger("templateId"))) return;
    if (currentStep === 1 && !(await trigger("groupId"))) return;
    if (currentStep === 0) setValue("groupId", compatibleFieldGroupsIds[0]);
    nextStep();
  };

  const handlePreviousClick = () => {
    if (!omitStep2 && currentStep === 1) setValue("groupId", undefined);
    previousStep();
  };

  const [createPetitionFromProfile, { loading: creatingPetition }] = useMutation(
    useAssociateNewPetitionToProfileDialog_createPetitionFromProfileDocument,
  );

  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      initialFocusRef={selectRef}
      size={currentStep === 0 ? "md" : currentStep === 1 ? "xl" : "3xl"}
      content={
        {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            if (!isDefined(data.templateId)) return;

            const groupId = data.groupId ?? compatibleFieldGroupsIds[0];

            const prefill =
              data.fillWithProfileData && groupId
                ? data.prefill.filter((p) => p.profileIds.length > 0)
                : [];

            try {
              const res = await createPetitionFromProfile({
                variables: {
                  profileId: profile.id,
                  templateId: data.templateId,
                  prefill,
                  petitionFieldId: data.fillWithProfileData ? groupId : undefined,
                },
              });

              if (isDefined(res?.data)) {
                goToPetition(res.data.createPetitionFromProfile.id, "preview");
              } else {
                throw new Error("No data in createPetitionFromProfile mutation response");
              }

              props.onResolve({});
            } catch {
              showGenericErrorToast();
            }
          }),
        } as any
      }
      {...props}
      header={
        currentStep === 0 ? (
          <FormattedMessage
            id="component.associate-new-petition-to-profile-dialog.header-1"
            defaultMessage="New parallel"
          />
        ) : currentStep === 1 && !omitStep2 ? (
          <FormattedMessage
            id="component.associate-new-petition-to-profile-dialog.header-2"
            defaultMessage="Prefill groups"
          />
        ) : (
          <FormattedMessage
            id="component.associate-new-petition-to-profile-dialog.header-3"
            defaultMessage="Include relationships"
          />
        )
      }
      body={
        <FormProvider {...form}>
          {currentStep === 0 || !isDefined(template) ? (
            <AssociateNewPetitionToProfileStep1
              key="step1"
              ref={selectRef}
              showCheckbox={isDefined(template) && (!omitStep2 || !omitStep3)}
            />
          ) : currentStep === 1 ? (
            omitStep2 ? (
              <AssociateNewPetitionToProfileStep3
                key="step3"
                profile={profile}
                template={template}
                fieldsWithCompatibleProfiles={fieldsWithCompatibleProfiles}
              />
            ) : (
              <AssociateNewPetitionToProfileStep2
                key="step2"
                profile={profile}
                template={template}
                compatibleFieldGroupsIds={compatibleFieldGroupsIds}
              />
            )
          ) : (
            <AssociateNewPetitionToProfileStep3
              key="step3"
              profile={profile}
              template={template}
              fieldsWithCompatibleProfiles={fieldsWithCompatibleProfiles}
            />
          )}
        </FormProvider>
      }
      confirm={
        isLastStep ? (
          <Button
            key="accept"
            colorScheme="primary"
            type="submit"
            isLoading={loading || creatingPetition}
          >
            <FormattedMessage id="generic.accept" defaultMessage="Accept" />
          </Button>
        ) : (
          <Button key="next" colorScheme="primary" onClick={handleNextClick} isLoading={loading}>
            <FormattedMessage id="generic.next-button" defaultMessage="Next" />
          </Button>
        )
      }
      cancel={
        currentStep !== 0 ? (
          <Button onClick={handlePreviousClick}>
            <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
          </Button>
        ) : null
      }
    />
  );
}

export function useAssociateNewPetitionToProfileDialog() {
  return useDialog(AssociateNewPetitionToProfileDialog);
}

const AssociateNewPetitionToProfileStep1 = forwardRef(function AssociateNewPetitionToProfileStep1(
  { showCheckbox }: { showCheckbox?: boolean },
  ref: ForwardedRef<PetitionSelectInstance<false>>,
) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<AssociateNewPetitionToProfileDialogData>();

  return (
    <Stack>
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
              ref={ref}
              defaultOptions
              type="TEMPLATE"
              permissionTypes={["OWNER", "WRITE"]}
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

      {showCheckbox ? (
        <FormControl>
          <Checkbox
            {...register("fillWithProfileData")}
            colorScheme="primary"
            alignItems={"flex-start"}
            sx={{ "span:first-of-type": { marginTop: 1 } }}
          >
            <FormattedMessage
              id="component.associate-new-petition-to-profile-dialog.prefill-checkbox-label"
              defaultMessage="Prefill with profile information and relationships"
            />
          </Checkbox>
        </FormControl>
      ) : null}
    </Stack>
  );
});

function AssociateNewPetitionToProfileStep2({
  profile,
  template,
  compatibleFieldGroupsIds,
}: {
  profile: useAssociateNewPetitionToProfileDialog_ProfileFragment;
  template: useAssociateNewPetitionToProfileDialog_PetitionBaseFragment;
  compatibleFieldGroupsIds: string[];
}) {
  const intl = useIntl();
  const fieldsWithIndices = useFieldsWithIndices(template);

  const filteredFieldsWithIndices = useMemo(() => {
    return fieldsWithIndices.filter(([f]) => compatibleFieldGroupsIds.includes(f.id));
  }, [fieldsWithIndices, compatibleFieldGroupsIds.join(",")]);

  const {
    control,
    formState: { errors },
  } = useFormContext<AssociateNewPetitionToProfileDialogData>();

  return (
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
  );
}

function AssociateNewPetitionToProfileStep3({
  profile,
  fieldsWithCompatibleProfiles,
  template,
}: {
  profile: useAssociateNewPetitionToProfileDialog_ProfileFragment;
  fieldsWithCompatibleProfiles: [
    PetitionFieldSelection,
    useAssociateNewPetitionToProfileDialog_ProfileInnerFragment[],
  ][];
  template: useAssociateNewPetitionToProfileDialog_PetitionBaseFragment;
}) {
  const intl = useIntl();
  const fieldsWithIndices = useFieldsWithIndices(template);

  const { control, watch } = useFormContext<AssociateNewPetitionToProfileDialogData>();
  const { fields } = useFieldArray({
    control,
    name: "prefill",
  });

  const groupId = watch("groupId");

  return (
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
      <TableContainer overflowY="auto" border="1px solid" borderColor="gray.200" maxHeight="350px">
        <Table
          variant="unstyled"
          sx={{
            tableLayout: "fixed",
            borderCollapse: "separate",
            borderSpacing: 0,
            "& th": {
              padding: 2,
              fontWeight: 400,
              fontSize: "sm",
              borderBottom: "1px solid",
              borderColor: "gray.200",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "gray.50",
            },
            "& th:first-of-type, & td:first-of-type": {
              paddingStart: 4,
            },
            "& th:last-of-type, & td:last-of-type": {
              paddingEnd: 4,
            },
            "& td": {
              borderBottom: "1px solid",
              borderColor: "gray.200",
            },
            "& tr:last-of-type td": {
              borderBottom: "none",
            },
          }}
        >
          <Thead>
            <Tr>
              <Th width="50%">
                <FormattedMessage
                  id="component.associate-new-petition-to-profile-dialog.table-header-group"
                  defaultMessage="Group"
                />
              </Th>
              <Th width="50%">
                <FormattedMessage
                  id="component.associate-new-petition-to-profile-dialog.table-header-profile"
                  defaultMessage="Profile"
                />
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {fields.map((item, index) => {
              const [field, profiles] = fieldsWithCompatibleProfiles.find(
                ([field]) => field.id === item.petitionFieldId,
              ) as [
                PetitionFieldSelection,
                useAssociateNewPetitionToProfileDialog_ProfileInnerFragment[],
              ];

              const isRadioButton = !field.multiple;
              const [_, fieldIndex] = fieldsWithIndices.find(([f]) => f.id === field.id)!;

              if (!isDefined(field) || !isDefined(profiles)) return null;

              return (
                <Tr key={item.id}>
                  <Td padding={2}>
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
                  <Td padding={2}>
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
                                        ? (e) => onChange(e.target.checked ? [e.target.value] : [])
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
      </TableContainer>
    </Stack>
  );
}

useAssociateNewPetitionToProfileDialog.fragments = {
  PetitionBase: gql`
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
  Profile: gql`
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
  `,
  ProfileRelationship: gql`
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
  `,
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
    ) {
      createPetitionFromProfile(
        profileId: $profileId
        templateId: $templateId
        prefill: $prefill
        petitionFieldId: $petitionFieldId
      ) {
        id
      }
    }
  `,
];

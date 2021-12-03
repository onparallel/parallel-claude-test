import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Progress,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
} from "@chakra-ui/react";
import { ArrowForwardIcon, ListIcon, SettingsIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { useBlockingDialog } from "@parallel/components/common/dialogs/BlockingDialog";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { Link } from "@parallel/components/common/Link";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { PaneWithFlyout } from "@parallel/components/layout/PaneWithFlyout";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import {
  AddPetitionAccessDialog,
  useAddPetitionAccessDialog,
} from "@parallel/components/petition-activity/dialogs/AddPetitionAccessDialog";
import { PetitionContents } from "@parallel/components/petition-common/PetitionContents";
import { PetitionSettings } from "@parallel/components/petition-common/PetitionSettings";
import { useCompletedPetitionDialog } from "@parallel/components/petition-compose/dialogs/CompletedPetitionDialog";
import { useConfirmChangeFieldTypeDialog } from "@parallel/components/petition-compose/dialogs/ConfirmChangeFieldTypeDialog";
import { useConfirmDeleteFieldDialog } from "@parallel/components/petition-compose/dialogs/ConfirmDeleteFieldDialog";
import { usePublicTemplateDialog } from "@parallel/components/petition-compose/dialogs/PublicTemplateDialog";
import { useReferencedFieldDialog } from "@parallel/components/petition-compose/dialogs/ReferencedFieldDialog";
import { useTestSignatureDialog } from "@parallel/components/petition-compose/dialogs/TestSignatureDialog";
import { PetitionComposeField } from "@parallel/components/petition-compose/PetitionComposeField";
import { PetitionComposeFieldList } from "@parallel/components/petition-compose/PetitionComposeFieldList";
import { PetitionLimitReachedAlert } from "@parallel/components/petition-compose/PetitionLimitReachedAlert";
import { PetitionTemplateComposeMessageEditor } from "@parallel/components/petition-compose/PetitionTemplateComposeMessageEditor";
import { PetitionTemplateDescriptionEdit } from "@parallel/components/petition-compose/PetitionTemplateDescriptionEdit";
import { PetitionComposeFieldSettings } from "@parallel/components/petition-compose/settings/PetitionComposeFieldSettings";
import {
  PetitionCompose_batchSendPetitionDocument,
  PetitionCompose_changePetitionFieldTypeDocument,
  PetitionCompose_clonePetitionFieldDocument,
  PetitionCompose_createPetitionFieldDocument,
  PetitionCompose_deletePetitionFieldDocument,
  PetitionCompose_petitionDocument,
  PetitionCompose_PetitionFieldFragment,
  PetitionCompose_updateFieldPositionsDocument,
  PetitionCompose_updatePetitionDocument,
  PetitionCompose_updatePetitionFieldDocument,
  PetitionCompose_userDocument,
  PetitionFieldType,
  UpdatePetitionFieldInput,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useFieldIndices } from "@parallel/utils/fieldIndices";
import {
  PetitionFieldVisibility,
  PetitionFieldVisibilityCondition,
} from "@parallel/utils/fieldVisibility/types";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { withError } from "@parallel/utils/promises/withError";
import { Maybe, UnwrapPromise } from "@parallel/utils/types";
import { usePetitionLimitReachedErrorDialog } from "@parallel/utils/usePetitionLimitReachedErrorDialog";
import { usePetitionStateWrapper, withPetitionState } from "@parallel/utils/usePetitionState";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { useUserPreference } from "@parallel/utils/useUserPreference";
import { validatePetitionFields } from "@parallel/utils/validatePetitionFields";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { zip } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";

type PetitionComposeProps = UnwrapPromise<ReturnType<typeof PetitionCompose.getInitialProps>>;

type FieldSelection = PetitionCompose_PetitionFieldFragment;

function PetitionCompose({ petitionId }: PetitionComposeProps) {
  const router = useRouter();
  const intl = useIntl();
  const toast = useToast();
  const {
    data: { me },
  } = useAssertQuery(PetitionCompose_userDocument);
  const { data } = useAssertQuery(PetitionCompose_petitionDocument, {
    variables: { id: petitionId },
  });
  const petition = data.petition!;

  const updateIsReadNotification = useUpdateIsReadNotification();
  useEffect(() => {
    updateIsReadNotification({ isRead: true, filter: "SHARED" });
  }, []);

  const isPublicTemplate = petition?.__typename === "PetitionTemplate" && petition.isPublic;

  const isSharedByLink =
    (petition?.__typename === "PetitionTemplate" && petition.publicLink?.isActive) ?? false;

  const indices = useFieldIndices(petition.fields);
  const petitionDataRef = useUpdatingRef({ fields: petition.fields, indices });

  const wrapper = usePetitionStateWrapper();
  const [activeFieldId, setActiveFieldId] = useState<Maybe<string>>(null);

  const [showErrors, setShowErrors] = useState(false);
  const activeField: Maybe<FieldSelection> = useMemo(() => {
    return activeFieldId ? petition.fields?.find((f) => f.id === activeFieldId) ?? null : null;
  }, [activeFieldId, petition.fields]);
  const activeFieldElement = useMemo(() => {
    return activeFieldId ? document.querySelector<HTMLElement>(`#field-${activeFieldId}`)! : null;
  }, [activeFieldId]);

  const showPublicTemplateDialog = usePublicTemplateDialog();
  // When the petition is completed show a dialog to avoid unintended changes
  const completedDialog = useCompletedPetitionDialog();
  useEffect(() => {
    if (petition?.__typename === "Petition" && ["COMPLETED", "CLOSED"].includes(petition.status)) {
      completedDialog({});
    }

    if (isPublicTemplate) {
      showPublicTemplateDialog({});
    }
  }, []);

  useEffect(() => {
    setShowErrors(isSharedByLink);
  }, [setShowErrors, isSharedByLink]);

  const [updatePetition] = useMutation(PetitionCompose_updatePetitionDocument);
  const handleUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({
        variables: {
          petitionId,
          data,
        },
      });
    }),
    [petitionId]
  );

  const [updateFieldPositions] = useMutation(PetitionCompose_updateFieldPositionsDocument);
  const handleUpdateFieldPositions = useCallback(
    wrapper(async function (fieldIds: string[]) {
      await updateFieldPositions({ variables: { petitionId, fieldIds } });
    }),
    [petitionId]
  );

  const [clonePetitionField] = useMutation(PetitionCompose_clonePetitionFieldDocument);
  const handleCloneField = useCallback(
    wrapper(async (fieldId: string) => {
      const { data } = await clonePetitionField({
        variables: { petitionId, fieldId },
      });
      const field = data!.clonePetitionField.field;
      focusFieldTitle(field.id);
    }),
    [petitionId]
  );

  const [deletePetitionField] = useMutation(PetitionCompose_deletePetitionFieldDocument);
  const confirmDelete = useConfirmDeleteFieldDialog();
  const handleDeleteField = useCallback(
    wrapper(async function (fieldId: string) {
      setActiveFieldId((activeFieldId) => (activeFieldId === fieldId ? null : activeFieldId));
      try {
        await deletePetitionField({
          variables: { petitionId, fieldId },
        });
        return;
      } catch {}
      try {
        await confirmDelete({});
        await deletePetitionField({
          variables: { petitionId, fieldId, force: true },
        });
      } catch {}
    }),
    [petitionId]
  );

  const handleFieldSettingsClick = useCallback(
    function (fieldId: string) {
      setActiveFieldId((activeFieldId) => (activeFieldId === fieldId ? null : fieldId));
    },
    [petitionId]
  );

  const handleSettingsClose = useCallback(
    function () {
      setActiveFieldId(null);
    },
    [petitionId]
  );

  const [updatePetitionField] = useMutation(PetitionCompose_updatePetitionFieldDocument);
  const _handleFieldEdit = useCallback(
    async function (fieldId: string, data: UpdatePetitionFieldInput) {
      const { fields } = petitionDataRef.current!;
      const field = fields.find((f) => f.id === fieldId);
      if (data.multiple === false) {
        // check no field is referencing with invalid NUMBER_OF_REPLIES condition
        const validCondition = (c: PetitionFieldVisibilityCondition) => {
          if (c.fieldId === fieldId) {
            if (c.modifier === "NUMBER_OF_REPLIES") {
              return c.value === 0 && (c.operator === "EQUAL" || c.operator === "GREATER_THAN");
            } else if (c.modifier === "ALL" || c.modifier === "NONE") {
              return false;
            }
          }
          return true;
        };
        const referencing = zip(fields, indices).filter(([f]) =>
          (f.visibility as PetitionFieldVisibility)?.conditions.some((c) => !validCondition(c))
        );
        if (referencing.length) {
          try {
            await showReferencedFieldDialog({
              type: "INVALID_CONDITION",
              fieldsWithIndices: referencing.map(([field, fieldIndex]) => ({
                field,
                fieldIndex,
              })),
            });
            await Promise.all(
              referencing.map(async ([field]) => {
                const visibility = field.visibility! as PetitionFieldVisibility;
                const conditions = visibility.conditions.filter(validCondition);
                await _handleFieldEdit(field.id, {
                  visibility: conditions.length > 0 ? { ...visibility, conditions } : null,
                });
              })
            );
          } catch {
            return;
          }
        }
      }
      await updatePetitionField({
        variables: { petitionId, fieldId, data },
        optimisticResponse: {
          updatePetitionField: {
            __typename: `${petition.__typename}AndField` as any,
            petition: {
              __typename: petition.__typename! as any,
              id: petitionId,
              status: (petition as any).status,
              updatedAt: new Date().toISOString(),
            },
            field: {
              __typename: "PetitionField",
              ...field,
              ...(data as any),
            },
          },
        },
      });
    },
    [petitionId]
  );
  const handleFieldEdit = useCallback(wrapper(_handleFieldEdit), [petitionId, _handleFieldEdit]);

  const showReferencedFieldDialog = useReferencedFieldDialog();
  const confirmChangeFieldType = useConfirmChangeFieldTypeDialog();
  const [changePetitionFieldType] = useMutation(PetitionCompose_changePetitionFieldTypeDocument);
  const handleFieldTypeChange = useCallback(
    wrapper(async function (fieldId: string, type: PetitionFieldType) {
      const { fields, indices } = petitionDataRef.current!;
      const field = fields.find((f) => f.id === fieldId)!;
      const referencing = zip(fields, indices).filter(([f]) =>
        (f.visibility as PetitionFieldVisibility)?.conditions.some((c) => c.fieldId === fieldId)
      );
      if (referencing.length) {
        // valid field types changes
        if (type === "TEXT" && field.type === "SELECT") {
          // pass
        } else {
          try {
            await showReferencedFieldDialog({
              type: "INVALID_CONDITION",
              fieldsWithIndices: referencing.map(([field, fieldIndex]) => ({
                field,
                fieldIndex,
              })),
            });
            for (const [field] of referencing) {
              const visibility = field.visibility! as PetitionFieldVisibility;
              const conditions = visibility.conditions.filter((c) => c.fieldId !== fieldId);
              await _handleFieldEdit(field.id, {
                visibility: conditions.length > 0 ? { ...visibility, conditions } : null,
              });
            }
          } catch {
            return;
          }
        }
      }
      try {
        await changePetitionFieldType({
          variables: { petitionId, fieldId, type },
        });
        return;
      } catch {}
      try {
        await confirmChangeFieldType({});
        await changePetitionFieldType({
          variables: { petitionId, fieldId, type, force: true },
        });
      } catch {}
    }),
    [petitionId]
  );

  const [createPetitionField] = useMutation(PetitionCompose_createPetitionFieldDocument);
  const handleAddField = useCallback(
    wrapper(async function (type: PetitionFieldType, position?: number) {
      const { data } = await createPetitionField({
        variables: { petitionId, type, position },
      });
      const field = data!.createPetitionField.field;
      focusFieldTitle(field.id);
    }),
    [petitionId]
  );

  const validPetitionFields = async () => {
    if (!petition) return false;
    const { error, errorMessage, field } = validatePetitionFields(petition.fields);
    if (error) {
      setShowErrors(true);
      await withError(showErrorDialog({ message: errorMessage }));
      if (error === "NO_REPLIABLE_FIELDS") {
        document.querySelector<HTMLButtonElement>("#menu-button-big-add-field-button")?.click();
      } else if (field) {
        const node = document.querySelector(`#field-${field.id}`);
        await scrollIntoView(node!, { block: "center", behavior: "smooth" });
      }
      return false;
    }
    return true;
  };

  const [showTestSignatureDialogUserPreference, setShowTestSignatureDialogUserPreference] =
    useUserPreference("show-test-signature-dialog", true);
  const showTestSignatureDialog = useTestSignatureDialog();

  const showErrorDialog = useErrorDialog();
  const [batchSendPetition] = useMutation(PetitionCompose_batchSendPetitionDocument);
  const showAddPetitionAccessDialog = useAddPetitionAccessDialog();
  const showLongBatchSendDialog = useBlockingDialog();
  const showPetitionLimitReachedErrorDialog = usePetitionLimitReachedErrorDialog();
  const handleNextClick = useCallback(async () => {
    if (petition?.__typename !== "Petition") {
      throw new Error("Can't send a template");
    }

    const isFieldsValid = await validPetitionFields();
    if (!isFieldsValid) return;

    try {
      if (
        showTestSignatureDialogUserPreference &&
        petition.signatureConfig?.integration?.environment === "DEMO"
      ) {
        const { dontShow } = await showTestSignatureDialog({
          integrationName: petition.signatureConfig.integration.name,
        });
        if (dontShow) {
          setShowTestSignatureDialogUserPreference(false);
        }
      }

      const {
        recipientIdGroups,
        subject,
        body,
        remindersConfig,
        scheduledAt,
        batchSendSigningMode,
      } = await showAddPetitionAccessDialog({
        petition,
        onUpdatePetition: handleUpdatePetition,
        canAddRecipientGroups: true,
      });
      const task = batchSendPetition({
        variables: {
          petitionId: petition.id,
          contactIdGroups: recipientIdGroups,
          subject,
          body,
          remindersConfig,
          scheduledAt: scheduledAt?.toISOString() ?? null,
          batchSendSigningMode,
        },
      });
      if (recipientIdGroups.length > 20) {
        await withError(
          showLongBatchSendDialog({
            task,
            header: (
              <FormattedMessage
                id="petition.long-batch-send-dialog.header"
                defaultMessage="Sending petitions"
              />
            ),
            body: (
              <Stack spacing={4}>
                <Text>
                  <FormattedMessage
                    id="petition.long-batch-send-dialog.message"
                    defaultMessage="We are sending your petitions. It might take a little bit, please wait."
                  />
                </Text>
                <Progress isIndeterminate size="sm" borderRadius="full" />
              </Stack>
            ),
          })
        );
      }
      const { data } = await task;
      if (data?.batchSendPetition.some((r) => r.result !== "SUCCESS")) {
        toast({
          isClosable: true,
          status: "error",
          title: intl.formatMessage({
            id: "petition.petition-send-error.title",
            defaultMessage: "Error",
          }),
          description: intl.formatMessage({
            id: "petition.petition-send-error.description",
            defaultMessage:
              "There was an error sending your petition. Try again and, if it fails, reach out to support for help.",
          }),
        });
        return;
      }
      if (scheduledAt) {
        toast({
          isClosable: true,
          status: "info",
          title: intl.formatMessage(
            {
              id: "petition.petition-scheduled-toast.title",
              defaultMessage: "{count, plural, =1{Petition} other{Petitions}} scheduled",
            },
            { count: recipientIdGroups.length }
          ),
          description: intl.formatMessage(
            {
              id: "petition.petition-scheduled-toast.description",
              defaultMessage:
                "Your {count, plural, =1{petition} other{petitions}} will be sent on {date}.",
            },
            {
              count: recipientIdGroups.length,
              date: intl.formatTime(scheduledAt!, FORMATS.LLL),
            }
          ),
        });
      } else {
        toast({
          isClosable: true,
          status: "success",
          title: intl.formatMessage(
            {
              id: "petition.petition-sent-toast.title",
              defaultMessage: "{count, plural, =1{Petition} other{Petitions}} sent",
            },
            { count: recipientIdGroups.length }
          ),
          description: intl.formatMessage(
            {
              id: "petition.petition-sent-toast.description",
              defaultMessage:
                "Your {count, plural, =1{petition is on its} other{petitions are on their}} way.",
            },
            { count: recipientIdGroups.length }
          ),
        });
      }
      router.push("/app/petitions");
    } catch (e) {
      if (
        isApolloError(e) &&
        e.graphQLErrors[0]?.extensions?.code === "PETITION_SEND_CREDITS_ERROR"
      ) {
        await withError(showPetitionLimitReachedErrorDialog());
      }
    }
  }, [petition, showPetitionLimitReachedErrorDialog, showTestSignatureDialogUserPreference]);

  const handleIndexFieldClick = useCallback(async (fieldId: string) => {
    const fieldElement = document.querySelector(`#field-${fieldId}`);
    if (fieldElement) {
      focusFieldTitle(fieldId);
      await scrollIntoView(fieldElement, {
        behavior: "smooth",
        scrollMode: "if-needed",
      });
    }
  }, []);

  function focusFieldTitle(fieldId: string) {
    setTimeout(() => {
      const title = document.querySelector<HTMLElement>(`#field-title-${fieldId}`);
      title?.focus();
    });
  }

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

  const displayPetitionLimitReachedAlert =
    me.organization.usageLimits.petitions.limit <= me.organization.usageLimits.petitions.used &&
    petition?.__typename === "Petition" &&
    petition.status === "DRAFT";

  return (
    <ToneProvider value={petition.tone}>
      <PetitionLayout
        key={petition.id}
        user={me}
        petition={petition}
        onUpdatePetition={handleUpdatePetition}
        section="compose"
        scrollBody
        headerActions={
          petition?.__typename === "Petition" && petition.status === "DRAFT" ? (
            <ResponsiveButtonIcon
              data-action="compose-next"
              id="petition-next"
              colorScheme="purple"
              icon={<ArrowForwardIcon fontSize="18px" />}
              label={intl.formatMessage({
                id: "generic.next",
                defaultMessage: "Next",
              })}
              onClick={handleNextClick}
            />
          ) : null
        }
      >
        {displayPetitionLimitReachedAlert ? (
          <PetitionLimitReachedAlert limit={me.organization.usageLimits.petitions.limit} />
        ) : null}
        <PaneWithFlyout
          isFlyoutActive={Boolean(activeField)}
          alignWith={activeField ? activeFieldElement : null}
          flyout={
            <Box padding={{ base: 4 }} paddingLeft={{ md: 0 }}>
              {activeField ? (
                <PetitionComposeFieldSettings
                  petitionId={petition.id}
                  key={activeField.id}
                  field={activeField}
                  onFieldEdit={handleFieldEdit}
                  onFieldTypeChange={handleFieldTypeChange}
                  onClose={handleSettingsClose}
                  isReadOnly={petition.isRestricted || isPublicTemplate}
                  hasDeveloperAccess={me.hasDeveloperAccess}
                />
              ) : (
                <Card display="flex" flexDirection="column" maxHeight={`calc(100vh - 6rem)`}>
                  <Tabs variant="enclosed" {...extendFlexColumn}>
                    <TabList marginX="-1px" marginTop="-1px" flex="none">
                      <Tab padding={4} lineHeight={5} fontWeight="bold">
                        <ListIcon fontSize="18px" marginRight={2} />
                        <FormattedMessage id="petition.contents" defaultMessage="Contents" />
                      </Tab>
                      <Tab
                        className="petition-settings"
                        padding={4}
                        lineHeight={5}
                        fontWeight="bold"
                      >
                        <SettingsIcon fontSize="16px" marginRight={2} />
                        <FormattedMessage
                          id="petition-compose.settings"
                          defaultMessage="Settings"
                        />
                      </Tab>
                    </TabList>
                    <TabPanels {...extendFlexColumn}>
                      <TabPanel {...extendFlexColumn} padding={0} overflow="auto">
                        <PetitionContents
                          fields={petition.fields}
                          fieldIndices={indices}
                          onFieldClick={handleIndexFieldClick}
                        />
                      </TabPanel>
                      <TabPanel {...extendFlexColumn} padding={0} overflow="auto">
                        <PetitionSettings
                          user={me}
                          petition={petition}
                          onUpdatePetition={handleUpdatePetition}
                          validPetitionFields={validPetitionFields}
                        />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Card>
              )}
            </Box>
          }
        >
          <Box padding={4}>
            <PetitionComposeFieldList
              petitionId={petition.id}
              showErrors={showErrors}
              fields={petition.fields}
              active={activeFieldId}
              onAddField={handleAddField}
              onCloneField={handleCloneField}
              onDeleteField={handleDeleteField}
              onUpdateFieldPositions={handleUpdateFieldPositions}
              onFieldEdit={handleFieldEdit}
              onFieldSettingsClick={handleFieldSettingsClick}
              isReadOnly={petition.isRestricted || isPublicTemplate}
              isPublicTemplate={isPublicTemplate}
            />
            {petition?.__typename === "PetitionTemplate" ? (
              <PetitionTemplateDescriptionEdit
                marginTop="4"
                description={petition.description}
                onUpdatePetition={handleUpdatePetition}
                isReadOnly={petition.isRestricted || isPublicTemplate}
              />
            ) : null}
            {petition && petition.__typename === "Petition" ? (
              petition.status !== "DRAFT" ? (
                <Box color="gray.500" marginTop={12} paddingX={4} textAlign="center">
                  <Text>
                    <FormattedMessage
                      id="petition.already-sent"
                      defaultMessage="This petition has already been sent."
                    />
                  </Text>
                  <Text>
                    <FormattedMessage
                      id="petition.send-from-activity"
                      defaultMessage="If you want to send it to someone else you can do it from the <a>Activity</a> tab."
                      values={{
                        a: (chunks: any) => (
                          <Link href={`/app/petitions/${petitionId}/activity`}>{chunks}</Link>
                        ),
                      }}
                    />
                  </Text>
                </Box>
              ) : null
            ) : petition?.__typename === "PetitionTemplate" ? (
              <PetitionTemplateComposeMessageEditor
                marginTop={4}
                petition={petition}
                onUpdatePetition={handleUpdatePetition}
              />
            ) : null}
          </Box>
        </PaneWithFlyout>
      </PetitionLayout>
    </ToneProvider>
  );
}

PetitionCompose.fragments = {
  get PetitionBase() {
    return gql`
      fragment PetitionCompose_PetitionBase on PetitionBase {
        id
        ...PetitionLayout_PetitionBase
        ...AddPetitionAccessDialog_Petition
        ...PetitionTemplateComposeMessageEditor_Petition
        ...PetitionSettings_PetitionBase
        tone
        isRestricted
        fields {
          ...PetitionCompose_PetitionField
        }
        ... on Petition {
          status
          signatureConfig {
            integration {
              environment
              name
            }
          }
        }
        ... on PetitionTemplate {
          isPublic
        }
      }
      ${PetitionLayout.fragments.PetitionBase}
      ${PetitionSettings.fragments.PetitionBase}
      ${AddPetitionAccessDialog.fragments.Petition}
      ${PetitionTemplateComposeMessageEditor.fragments.Petition}
      ${this.PetitionField}
    `;
  },
  get PetitionField() {
    return gql`
      fragment PetitionCompose_PetitionField on PetitionField {
        ...PetitionComposeField_PetitionField
        ...PetitionComposeFieldSettings_PetitionField
        ...PetitionContents_PetitionField
      }
      ${PetitionComposeField.fragments.PetitionField}
      ${PetitionComposeFieldSettings.fragments.PetitionField}
      ${PetitionContents.fragments.PetitionField}
    `;
  },
  get User() {
    return gql`
      fragment PetitionCompose_User on User {
        id
        ...PetitionLayout_User
        ...PetitionSettings_User
        ...useUpdateIsReadNotification_User
        organization {
          ...PetitionCompose_Organization
        }
      }
      ${PetitionLayout.fragments.User}
      ${PetitionSettings.fragments.User}
      ${useUpdateIsReadNotification.fragments.User}
      ${this.Organization}
    `;
  },
  get Organization() {
    return gql`
      fragment PetitionCompose_Organization on Organization {
        usageLimits {
          petitions {
            limit
            used
          }
        }
      }
    `;
  },
};

PetitionCompose.mutations = [
  gql`
    mutation PetitionCompose_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionLayout_PetitionBase
        ...PetitionSettings_PetitionBase
        ...AddPetitionAccessDialog_Petition
        ...PetitionTemplateComposeMessageEditor_Petition
      }
    }
    ${PetitionLayout.fragments.PetitionBase}
    ${PetitionSettings.fragments.PetitionBase}
    ${AddPetitionAccessDialog.fragments.Petition}
    ${PetitionTemplateComposeMessageEditor.fragments.Petition}
  `,
  gql`
    mutation PetitionCompose_updateFieldPositions($petitionId: GID!, $fieldIds: [GID!]!) {
      updateFieldPositions(petitionId: $petitionId, fieldIds: $fieldIds) {
        id
        ...PetitionLayout_PetitionBase
        fields {
          id
        }
      }
    }
    ${PetitionLayout.fragments.PetitionBase}
  `,
  gql`
    mutation PetitionCompose_createPetitionField(
      $petitionId: GID!
      $type: PetitionFieldType!
      $position: Int
    ) {
      createPetitionField(petitionId: $petitionId, type: $type, position: $position) {
        field {
          id
          ...PetitionCompose_PetitionField
        }
        petition {
          ...PetitionLayout_PetitionBase
          fields {
            id
          }
        }
      }
    }
    ${PetitionLayout.fragments.PetitionBase}
    ${PetitionCompose.fragments.PetitionField}
  `,
  gql`
    mutation PetitionCompose_clonePetitionField($petitionId: GID!, $fieldId: GID!) {
      clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
        field {
          id
          ...PetitionCompose_PetitionField
        }
        petition {
          ...PetitionLayout_PetitionBase
          fields {
            id
          }
        }
      }
    }
    ${PetitionLayout.fragments.PetitionBase}
    ${PetitionCompose.fragments.PetitionField}
  `,
  gql`
    mutation PetitionCompose_deletePetitionField(
      $petitionId: GID!
      $fieldId: GID!
      $force: Boolean
    ) {
      deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: $force) {
        id
        ...PetitionLayout_PetitionBase
        fields {
          id
        }
      }
    }
    ${PetitionLayout.fragments.PetitionBase}
  `,
  gql`
    mutation PetitionCompose_updatePetitionField(
      $petitionId: GID!
      $fieldId: GID!
      $data: UpdatePetitionFieldInput!
    ) {
      updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
        field {
          id
          ...PetitionCompose_PetitionField
        }
        petition {
          id
          updatedAt
          ... on Petition {
            status
          }
        }
      }
    }
    ${PetitionCompose.fragments.PetitionField}
  `,
  gql`
    mutation PetitionCompose_changePetitionFieldType(
      $petitionId: GID!
      $fieldId: GID!
      $type: PetitionFieldType!
      $force: Boolean
    ) {
      changePetitionFieldType(
        petitionId: $petitionId
        fieldId: $fieldId
        type: $type
        force: $force
      ) {
        field {
          id
          ...PetitionCompose_PetitionField
        }
        petition {
          id
          ... on Petition {
            status
          }
          updatedAt
        }
      }
    }
    ${PetitionCompose.fragments.PetitionField}
  `,
  gql`
    mutation PetitionCompose_batchSendPetition(
      $petitionId: GID!
      $contactIdGroups: [[GID!]!]!
      $subject: String!
      $body: JSON!
      $remindersConfig: RemindersConfigInput
      $scheduledAt: DateTime
      $batchSendSigningMode: BatchSendSigningMode
    ) {
      batchSendPetition(
        petitionId: $petitionId
        contactIdGroups: $contactIdGroups
        subject: $subject
        body: $body
        remindersConfig: $remindersConfig
        scheduledAt: $scheduledAt
        batchSendSigningMode: $batchSendSigningMode
      ) {
        result
        petition {
          id
          status
        }
      }
    }
  `,
];

PetitionCompose.queries = [
  gql`
    query PetitionCompose_user {
      me {
        ...PetitionCompose_User
      }
    }
    ${PetitionCompose.fragments.User}
  `,
  gql`
    query PetitionCompose_petition($id: GID!) {
      petition(id: $id) {
        ...PetitionCompose_PetitionBase
      }
    }
    ${PetitionCompose.fragments.PetitionBase}
  `,
];

PetitionCompose.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  await Promise.all([
    fetchQuery(PetitionCompose_userDocument),
    fetchQuery(PetitionCompose_petitionDocument, {
      variables: { id: petitionId },
      ignoreCache: true,
    }),
  ]);
  return { petitionId };
};

export default compose(withPetitionState, withDialogs, withApolloData)(PetitionCompose);

import { gql, useApolloClient } from "@apollo/client";
import { Box, Text, useToast } from "@chakra-ui/core";
import { useErrorDialog } from "@parallel/components/common/ErrorDialog";
import { Link } from "@parallel/components/common/Link";
import { withOnboarding } from "@parallel/components/common/OnboardingTour";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { PaneWithFlyout } from "@parallel/components/layout/PaneWithFlyout";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import {
  AddPetitionAccessDialog,
  useAddPetitionAccessDialog,
} from "@parallel/components/petition-activity/AddPetitionAccessDialog";
import { PetitionFieldsIndex } from "@parallel/components/petition-common/PetitionFieldsIndex";
import { useCompletedPetitionDialog } from "@parallel/components/petition-compose/CompletedPetitionDialog";
import { useConfirmChangeFieldTypeDialog } from "@parallel/components/petition-compose/ConfirmChangeFieldTypeDialog";
import { useConfirmDeleteFieldDialog } from "@parallel/components/petition-compose/ConfirmDeleteFieldDialog";
import { PetitionComposeField } from "@parallel/components/petition-compose/PetitionComposeField";
import { PetitionComposeFieldList } from "@parallel/components/petition-compose/PetitionComposeFieldList";
import { PetitionComposeFieldSettings } from "@parallel/components/petition-compose/PetitionComposeFieldSettings";
import { PetitionTemplateComposeMessageEditor } from "@parallel/components/petition-compose/PetitionTemplateComposeMessageEditor";
import { PetitionTemplateDescriptionEdit } from "@parallel/components/petition-compose/PetitionTemplateDescriptionEdit";
import {
  onFieldEdit_PetitionFieldFragment,
  PetitionComposeQuery,
  PetitionComposeQueryVariables,
  PetitionComposeUserQuery,
  PetitionCompose_PetitionFieldFragment,
  PetitionFieldType,
  updateIsDescriptionShown_PetitionFieldFragment,
  UpdatePetitionFieldInput,
  UpdatePetitionInput,
  usePetitionComposeQuery,
  usePetitionComposeUserQuery,
  usePetitionCompose_changePetitionFieldTypeMutation,
  usePetitionCompose_clonePetitionFieldMutation,
  usePetitionCompose_createPetitionFieldMutation,
  usePetitionCompose_deletePetitionFieldMutation,
  usePetitionCompose_sendPetitionMutation,
  usePetitionCompose_updateFieldPositionsMutation,
  usePetitionCompose_updatePetitionFieldMutation,
  usePetitionCompose_updatePetitionMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { resolveUrl } from "@parallel/utils/next";
import { Maybe, UnwrapPromise } from "@parallel/utils/types";
import { usePetitionState } from "@parallel/utils/usePetitionState";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import scrollIntoView from "smooth-scroll-into-view-if-needed";

type PetitionComposeProps = UnwrapPromise<
  ReturnType<typeof PetitionCompose.getInitialProps>
>;

type FieldSelection = PetitionCompose_PetitionFieldFragment;

type PetitionComposeState = {
  activeFieldId: Maybe<string>;
  showSettings: boolean;
};

function PetitionCompose({ petitionId }: PetitionComposeProps) {
  const router = useRouter();
  const intl = useIntl();
  const toast = useToast();
  const {
    data: { me },
  } = assertQuery(usePetitionComposeUserQuery());
  const {
    data: { petition },
  } = assertQuery(usePetitionComposeQuery({ variables: { id: petitionId } }));

  const [petitionState, wrapper] = usePetitionState();
  const [{ activeFieldId, showSettings }, dispatch] = useReducer(
    function (
      state: PetitionComposeState,
      action: (prev: PetitionComposeState) => PetitionComposeState
    ) {
      return action(state);
    },
    {
      activeFieldId: null,
      showSettings: false,
    }
  );

  const client = useApolloClient();
  const handleIsDescriptionShownChange = useCallback(
    async (fieldId: string) => {
      try {
        const fragment = gql`
          fragment updateIsDescriptionShown_PetitionField on PetitionField {
            isDescriptionShown @client
            description
          }
        `;
        const { isDescriptionShown, description } = client.cache.readFragment<
          updateIsDescriptionShown_PetitionFieldFragment
        >({
          fragment,
          id: fieldId,
        })!;
        client.cache.writeFragment<
          updateIsDescriptionShown_PetitionFieldFragment
        >({
          fragment,
          id: fieldId,
          data: {
            __typename: "PetitionField",
            isDescriptionShown: !isDescriptionShown,
            description,
          },
        });
        if (isDescriptionShown && !!description) {
          await updatePetitionField({
            variables: {
              petitionId,
              fieldId,
              data: { description: null },
            },
          });
        } else {
          focusFieldDescription(fieldId);
        }
      } catch {}
    },
    [petitionId]
  );

  const [showErrors, setShowErrors] = useState(false);
  const activeField: Maybe<FieldSelection> = useMemo(() => {
    if (activeFieldId) {
      return (
        (petition!.fields as any[]).find((f) => f.id === activeFieldId) ?? null
      );
    }
    return null;
  }, [activeFieldId, petition!.fields]);
  const activeFieldElement = useMemo(() => {
    return activeFieldId
      ? document.querySelector<HTMLElement>(`#field-${activeFieldId}`)!
      : null;
  }, [activeFieldId]);

  // When the petition is completed show a dialog to avoid unintended changes
  const completedDialog = useCompletedPetitionDialog();
  useEffect(() => {
    if (
      petition?.__typename === "Petition" &&
      petition?.status === "COMPLETED"
    ) {
      completedDialog({});
    }
  }, []);

  const confirmDelete = useConfirmDeleteFieldDialog();
  const [
    deletePetitionField,
  ] = usePetitionCompose_deletePetitionFieldMutation();

  const [updatePetition] = usePetitionCompose_updatePetitionMutation();
  const [clonePetitionField] = usePetitionCompose_clonePetitionFieldMutation();
  const [
    updateFieldPositions,
  ] = usePetitionCompose_updateFieldPositionsMutation();
  const [
    createPetitionField,
  ] = usePetitionCompose_createPetitionFieldMutation();
  const [
    updatePetitionField,
  ] = usePetitionCompose_updatePetitionFieldMutation();

  const handleUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { petitionId, data } });
    }),
    [petitionId]
  );

  const handleUpdateFieldPositions = useCallback(
    wrapper(async function (fieldIds: string[]) {
      await updateFieldPositions({ variables: { petitionId, fieldIds } });
    }),
    [petitionId]
  );

  const handleClonePetitionField = useCallback(
    wrapper(async (fieldId: string) => {
      const { data } = await clonePetitionField({
        variables: { petitionId, fieldId },
      });
      const field = data!.clonePetitionField.field;
      focusFieldTitle(field.id);
    }),
    [petitionId]
  );
  const handleDeleteField = useCallback(
    wrapper(async function (fieldId: string) {
      dispatch((state) => ({
        ...state,
        activeFieldId:
          state.activeFieldId === fieldId ? null : state.activeFieldId,
        showSettings:
          state.activeFieldId === fieldId ? false : state.showSettings,
      }));
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

  const handleSettingsClick = useCallback(
    function (fieldId: string) {
      dispatch((state) => ({
        ...state,
        activeFieldId: fieldId,
        showSettings:
          state.activeFieldId !== fieldId ? true : !state.showSettings,
      }));
    },
    [petitionId]
  );

  const handleSettingsClose = useCallback(
    function () {
      dispatch((state) => ({ ...state, showSettings: false }));
    },
    [petitionId]
  );

  const handleFieldEdit = useCallback(
    wrapper(async function (fieldId: string, data: UpdatePetitionFieldInput) {
      const field = client.cache.readFragment<
        onFieldEdit_PetitionFieldFragment
      >({
        fragment: gql`
          fragment onFieldEdit_PetitionField on PetitionField {
            ...PetitionCompose_PetitionField
          }
          ${PetitionCompose.fragments.PetitionField}
        `,
        fragmentName: "onFieldEdit_PetitionField",
        id: fieldId,
      })!;
      await updatePetitionField({
        variables: { petitionId, fieldId, data },
        optimisticResponse: {
          updatePetitionField: {
            __typename: `${petition!.__typename}AndField` as any,
            petition: {
              __typename: petition!.__typename! as any,
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
    }),
    [petitionId]
  );

  const confirmChangeFieldType = useConfirmChangeFieldTypeDialog();
  const [
    changePetitionFieldType,
  ] = usePetitionCompose_changePetitionFieldTypeMutation();
  const handleFieldTypeChange = useCallback(
    wrapper(async function (fieldId: string, type: PetitionFieldType) {
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

  const handleSelectField = useCallback(function (fieldId: string) {
    // Show settings only if they were already showing for this field
    dispatch((state) => ({
      ...state,
      activeFieldId: fieldId,
      showSettings:
        state.activeFieldId === fieldId ? state.showSettings : false,
    }));
  }, []);

  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();

  const showErrorDialog = useErrorDialog();
  const [sendPetition] = usePetitionCompose_sendPetitionMutation();
  const showAddPetitionAccessDialog = useAddPetitionAccessDialog();
  const handleNextClick = useCallback(async () => {
    if (petition?.__typename !== "Petition") {
      throw new Error("Can't send a template");
    }
    if (petition.fields.filter((f) => f.type !== "HEADING").length === 0) {
      try {
        await showErrorDialog({
          message: (
            <FormattedMessage
              id="petition.no-fields-error"
              defaultMessage="Please add at least one field with information you want to ask."
            />
          ),
        });
        const element = document.getElementById("menu-button-add-field");
        element && element.click();
      } finally {
        return;
      }
    }
    const fieldWithoutTitle = petition.fields.find((f) => !f.title);
    if (fieldWithoutTitle) {
      try {
        setShowErrors(true);
        const node = document.querySelector(`#field-${fieldWithoutTitle.id}`);
        scrollIntoView(node!, { block: "center", behavior: "smooth" });
        await showErrorDialog({
          message: (
            <FormattedMessage
              id="petition.no-fields-without-title-error"
              defaultMessage="Please add a title to every field."
            />
          ),
        });
      } finally {
        return;
      }
    }
    try {
      const {
        recipientIds,
        subject,
        body,
        remindersConfig,
        scheduledAt,
      } = await showAddPetitionAccessDialog({
        defaultSubject: petition.emailSubject,
        defaultBody: petition.emailBody,
        defaultRemindersConfig: petition.remindersConfig,
        onUpdatePetition: handleUpdatePetition,
        onCreateContact: handleCreateContact,
        onSearchContacts: handleSearchContacts,
      });
      const { data } = await sendPetition({
        variables: {
          petitionId: petition.id,
          contactIds: recipientIds,
          subject,
          body,
          remindersConfig,
          scheduledAt: scheduledAt?.toISOString() ?? null,
        },
        update(client) {
          // clear stale data
          delete (client as any).data.data[petitionId].accesses;
          delete (client as any).data.data[petitionId].recipients;
        },
      });
      if (data?.sendPetition.result !== "SUCCESS") {
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
          title: intl.formatMessage({
            id: "petition.petition-scheduled-toast.title",
            defaultMessage: "Petition scheduled",
          }),
          description: intl.formatMessage(
            {
              id: "petition.petition-scheduled-toast.description",
              defaultMessage: "Your petition will be sent on {date}.",
            },
            { date: intl.formatTime(scheduledAt!, FORMATS.LLL) }
          ),
        });
      } else {
        toast({
          isClosable: true,
          status: "success",
          title: intl.formatMessage({
            id: "petition.petition-sent-toast.title",
            defaultMessage: "Petition sent",
          }),
          description: intl.formatMessage({
            id: "petition.petition-sent-toast.description",
            defaultMessage: "Your petition is on it's way.",
          }),
        });
      }
      const pathname = "/[locale]/app/petitions";
      router.push(pathname, resolveUrl(pathname, router.query));
    } catch {}
  }, [petition]);

  const handleIndexFieldClick = useCallback((fieldId: string) => {
    const fieldElement = document.querySelector(`#field-${fieldId}`);
    if (fieldElement) {
      scrollIntoView(fieldElement, { scrollMode: "if-needed" });
      focusFieldTitle(fieldId);
    }
  }, []);

  function focusFieldTitle(fieldId: string) {
    setTimeout(() => {
      const title = document.querySelector<HTMLElement>(
        `#field-title-${fieldId}`
      );
      title?.focus();
    });
  }

  function focusFieldDescription(fieldId: string) {
    setTimeout(() => {
      const title = document.querySelector<HTMLElement>(
        `#field-description-${fieldId}`
      );
      title?.focus();
    });
  }

  return (
    <PetitionLayout
      key={petition!.id}
      user={me}
      petition={petition!}
      onUpdatePetition={handleUpdatePetition}
      onNextClick={handleNextClick}
      section="compose"
      scrollBody
      state={petitionState}
    >
      <PaneWithFlyout
        isFlyoutActive={showSettings}
        alignWith={showSettings ? activeFieldElement : null}
        flyout={
          <Box padding={{ base: 4 }} paddingLeft={{ md: 0 }}>
            {showSettings ? (
              <PetitionComposeFieldSettings
                key={activeField!.id}
                field={activeField!}
                onFieldEdit={handleFieldEdit}
                onFieldTypeChange={handleFieldTypeChange}
                onIsDescriptionShownChange={handleIsDescriptionShownChange}
                onClose={handleSettingsClose}
              />
            ) : (
              <PetitionFieldsIndex
                fields={petition!.fields}
                onFieldClick={handleIndexFieldClick}
                maxHeight={`calc(100vh - 6rem)`}
              />
            )}
          </Box>
        }
      >
        <Box padding={4}>
          <PetitionComposeFieldList
            showErrors={showErrors}
            fields={petition!.fields}
            active={activeFieldId}
            onAddField={handleAddField}
            onCopyFieldClick={handleClonePetitionField}
            onDeleteField={handleDeleteField}
            onSelectField={handleSelectField}
            onUpdateFieldPositions={handleUpdateFieldPositions}
            onFieldEdit={handleFieldEdit}
            onFieldSettingsClick={handleSettingsClick}
          />
          {petition?.__typename === "PetitionTemplate" ? (
            <PetitionTemplateDescriptionEdit
              marginTop="4"
              description={petition.description}
              onUpdatePetition={handleUpdatePetition}
            />
          ) : null}
          {petition && petition.__typename === "Petition" ? (
            petition!.status !== "DRAFT" ? (
              <Box
                color="gray.500"
                marginTop={12}
                paddingX={4}
                textAlign="center"
              >
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
                      a: (chunks: any[]) => (
                        <Link
                          href="/app/petitions/[petitionId]/activity"
                          as={`/app/petitions/${petitionId}/activity`}
                        >
                          {chunks}
                        </Link>
                      ),
                    }}
                  />
                </Text>
              </Box>
            ) : null
          ) : petition?.__typename === "PetitionTemplate" ? (
            <PetitionTemplateComposeMessageEditor
              marginTop={4}
              petition={petition!}
              onUpdatePetition={handleUpdatePetition}
            />
          ) : null}
        </Box>
      </PaneWithFlyout>
    </PetitionLayout>
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
        fields {
          ...PetitionCompose_PetitionField
        }
      }
      ${PetitionLayout.fragments.PetitionBase}
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
        ...PetitionFieldsIndex_PetitionField
      }
      ${PetitionComposeField.fragments.PetitionField}
      ${PetitionComposeFieldSettings.fragments.PetitionField}
      ${PetitionFieldsIndex.fragments.PetitionField}
    `;
  },
  get User() {
    return gql`
      fragment PetitionCompose_User on User {
        ...PetitionLayout_User
      }
      ${PetitionLayout.fragments.User}
    `;
  },
};

PetitionCompose.mutations = [
  gql`
    mutation PetitionCompose_updatePetition(
      $petitionId: GID!
      $data: UpdatePetitionInput!
    ) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionLayout_PetitionBase
        ...AddPetitionAccessDialog_Petition
        ...PetitionTemplateComposeMessageEditor_Petition
      }
    }
    ${PetitionLayout.fragments.PetitionBase}
    ${AddPetitionAccessDialog.fragments.Petition}
    ${PetitionTemplateComposeMessageEditor.fragments.Petition}
  `,
  gql`
    mutation PetitionCompose_updateFieldPositions(
      $petitionId: GID!
      $fieldIds: [GID!]!
    ) {
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
      createPetitionField(
        petitionId: $petitionId
        type: $type
        position: $position
      ) {
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
    mutation PetitionCompose_clonePetitionField(
      $petitionId: GID!
      $fieldId: GID!
    ) {
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
      deletePetitionField(
        petitionId: $petitionId
        fieldId: $fieldId
        force: $force
      ) {
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
      updatePetitionField(
        petitionId: $petitionId
        fieldId: $fieldId
        data: $data
      ) {
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
          updatedAt
        }
      }
    }
    ${PetitionCompose.fragments.PetitionField}
  `,
  gql`
    mutation PetitionCompose_sendPetition(
      $petitionId: GID!
      $contactIds: [GID!]!
      $subject: String!
      $body: JSON!
      $remindersConfig: RemindersConfigInput
      $scheduledAt: DateTime
    ) {
      sendPetition(
        petitionId: $petitionId
        contactIds: $contactIds
        subject: $subject
        body: $body
        remindersConfig: $remindersConfig
        scheduledAt: $scheduledAt
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

PetitionCompose.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery<PetitionComposeQuery, PetitionComposeQueryVariables>(
      gql`
        query PetitionCompose($id: GID!) {
          petition(id: $id) {
            ...PetitionCompose_PetitionBase
          }
        }
        ${PetitionCompose.fragments.PetitionBase}
      `,
      {
        variables: { id: query.petitionId as string },
        ignoreCache: true,
      }
    ),
    fetchQuery<PetitionComposeUserQuery>(
      gql`
        query PetitionComposeUser {
          me {
            ...PetitionCompose_User
          }
        }
        ${PetitionCompose.fragments.User}
      `
    ),
  ]);
  return {
    petitionId: query.petitionId as string,
  };
};

export default compose(
  withOnboarding({
    key: "PETITION_COMPOSE",
    steps: [
      {
        title: (
          <FormattedMessage
            id="tour.petition-compose.create-petition"
            defaultMessage="Let's fill out your first petition"
          />
        ),
        content: (
          <>
            <Text>
              <FormattedMessage
                id="tour.petition-compose.set-petition"
                defaultMessage="On this page, you can set up the information that you need from your recipients."
              />
            </Text>
            <Text marginTop={4}>
              <FormattedMessage
                id="tour.petition-compose.show-around"
                defaultMessage="Let us show you step by step!"
              />
            </Text>
          </>
        ),
        placement: "center",
        target: "#__next",
      },
      {
        content: (
          <Text marginTop={4}>
            <FormattedMessage
              id="tour.petition-compose.field-types"
              defaultMessage="Here you can add what you need from your recipients and choose the type of information it is (files or written replies)."
            />
          </Text>
        ),
        placement: "right-start",
        target: "#petition-fields",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-compose.add-petition-fields-title"
            defaultMessage="Message and automatic reminders"
          />
        ),
        content: (
          <Text>
            <FormattedMessage
              id="tour.petition-compose.add-petition-fields"
              defaultMessage="Here you can add the recipients, your first message, and configure your automatic reminders."
            />
          </Text>
        ),
        placement: "right-start",
        target: "#petition-message-compose",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-compose.select-recipients-title"
            defaultMessage="Select your recipients"
          />
        ),
        content: (
          <Text>
            <FormattedMessage
              id="tour.petition-compose.select-multiple-recipients"
              defaultMessage="If you select <b>multiple recipients</b>, any of them will be able to reply to any of the items you requested."
              values={{
                b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
              }}
            />
          </Text>
        ),
        placement: "right-start",
        target: "#petition-select-recipients",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-compose.petition-reminders-title"
            defaultMessage="We will handle this, but tell us a little bit more."
          />
        ),
        content: (
          <Text>
            <FormattedMessage
              id="tour.petition-compose.petition-reminders"
              defaultMessage="We know that every situation and every client is different, so please help us understand better when it is best to send the reminders."
            />
          </Text>
        ),
        placement: "top",
        target: "#petition-reminders",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-compose.petition-advanced-settings-title"
            defaultMessage="Need more customization?"
          />
        ),
        content: (
          <Text>
            <FormattedMessage
              id="tour.petition-compose.petition-advanced-settings"
              defaultMessage="Choose here the <b>language</b> from the upload page and the automatic messages that we will send to your recipients, and the <b>deadline</b> you want us to inform them."
              values={{
                b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
              }}
            />
          </Text>
        ),
        placement: "top",
        target: "#petition-advanced-settings",
      },
    ],
  }),
  withApolloData
)(PetitionCompose);

import { gql } from "@apollo/client";
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
import { useCompletedPetitionDialog } from "@parallel/components/petition-compose/CompletedPetitionDialog";
import { useConfirmChangeFieldTypeDialog } from "@parallel/components/petition-compose/ConfirmChangeFieldTypeDialog";
import { useConfirmDeleteFieldDialog } from "@parallel/components/petition-compose/ConfirmDeleteFieldDialog";
import { PetitionComposeField } from "@parallel/components/petition-compose/PetitionComposeField";
import { PetitionComposeFieldList } from "@parallel/components/petition-compose/PetitionComposeFieldList";
import { PetitionComposeFieldSettings } from "@parallel/components/petition-compose/PetitionComposeFieldSettings";
import {
  PetitionComposeMessageEditor,
  PetitionComposeMessageEditorProps,
} from "@parallel/components/petition-compose/PetitionComposeMessageEditor";
import { useScheduleMessageDialog } from "@parallel/components/petition-compose/ScheduleMessageDialog";
import {
  PetitionComposeQuery,
  PetitionComposeQueryVariables,
  PetitionComposeUserQuery,
  PetitionCompose_PetitionFieldFragment,
  PetitionFieldType,
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
import { assertQuery } from "@parallel/utils/apollo";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { resolveUrl } from "@parallel/utils/next";
import { isEmptyContent } from "@parallel/utils/slate/isEmptyContent";
import { Maybe, UnwrapPromise } from "@parallel/utils/types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { usePetitionState } from "@parallel/utils/usePetitionState";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { omit } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import { useSearchContacts } from "../../../../../utils/useSearchContacts";

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

  const [showErrors, setShowErrors] = useState(false);
  const activeField: Maybe<FieldSelection> = useMemo(() => {
    if (activeFieldId) {
      return petition!.fields.find((f) => f.id === activeFieldId) ?? null;
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
    if (petition?.status === "COMPLETED") {
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
      focusField(field.id);
    }),
    [petitionId]
  );
  const handleDeleteField = useCallback(
    wrapper(async function (fieldId: string) {
      dispatch((state) => ({
        ...state,
        activeFieldId:
          state.activeFieldId === fieldId ? null : state.activeFieldId,
        showSettings: state.activeFieldId === fieldId ? false : true,
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
      const field = petition!.fields.find((f) => f.id === fieldId);
      await updatePetitionField({
        variables: { petitionId, fieldId, data },
        optimisticResponse: {
          updatePetitionField: {
            __typename: "PetitionAndField",
            petition: {
              __typename: "Petition",
              id: petitionId,
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
    [petitionId, petition!.fields]
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
      focusField(field.id);
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
  const showScheduleMessageDialog = useScheduleMessageDialog();
  const [sendPetition] = usePetitionCompose_sendPetitionMutation();
  const handleSend: PetitionComposeMessageEditorProps["onSend"] = useCallback(
    async ({ contactIds, schedule }) => {
      if (petition!.fields.filter((f) => f.type !== "HEADING").length === 0) {
        try {
          await showErrorDialog({
            message: (
              <FormattedMessage
                id="petition.no-fields-error"
                defaultMessage="Please add at least one field with information you want to ask."
              />
            ),
          });
        } finally {
          return;
        }
      }
      const fieldWithoutTitle = petition!.fields.find((f) => !f.title);
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
      if (
        !petition ||
        contactIds.length === 0 ||
        !petition.emailSubject ||
        petition.emailBody === null ||
        isEmptyContent(petition!.emailBody)
      ) {
        setShowErrors(true);
        return;
      }
      let scheduledAt: Date | null = null;
      if (schedule) {
        try {
          scheduledAt = await showScheduleMessageDialog({});
        } catch {
          return;
        }
      }
      const { data } = await sendPetition({
        variables: {
          petitionId: petition!.id,
          contactIds,
          subject: petition.emailSubject,
          body: petition.emailBody,
          remindersConfig: petition.remindersConfig
            ? omit(petition.remindersConfig, ["__typename"])
            : null,
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
      toast({
        isClosable: true,
        status: schedule ? "info" : "success",
        title: schedule
          ? intl.formatMessage({
              id: "petition.petition-scheduled-toast.title",
              defaultMessage: "Petition scheduled",
            })
          : intl.formatMessage({
              id: "petition.petition-sent-toast.title",
              defaultMessage: "Petition sent",
            }),
        description: schedule
          ? intl.formatMessage(
              {
                id: "petition.petition-scheduled-toast.description",
                defaultMessage: "Your petition will be sent on {date}.",
              },
              { date: intl.formatTime(scheduledAt!, FORMATS.LLL) }
            )
          : intl.formatMessage({
              id: "petition.petition-sent-toast.description",
              defaultMessage: "Your petition is on it's way.",
            }),
      });
      const pathname = "/[locale]/app/petitions";
      router.push(pathname, resolveUrl(pathname, router.query));
    },
    [petition]
  );

  function focusField(fieldId: string) {
    setTimeout(() => {
      const title = document.querySelector<HTMLElement>(
        `#field-title-${fieldId}`
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
      section="compose"
      scrollBody
      state={petitionState}
    >
      <PaneWithFlyout
        isActive={showSettings}
        alignWith={activeFieldElement}
        flyout={
          showSettings && (
            <Box padding={{ base: 4 }} paddingLeft={{ md: 0 }}>
              <PetitionComposeFieldSettings
                key={activeField!.id}
                field={activeField!}
                onFieldEdit={handleFieldEdit}
                onFieldTypeChange={handleFieldTypeChange}
                onClose={handleSettingsClose}
              />
            </Box>
          )
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
          {petition!.status === "DRAFT" ? (
            <PetitionComposeMessageEditor
              marginTop={4}
              petition={petition!}
              showErrors={showErrors}
              onCreateContact={handleCreateContact}
              onSearchContacts={handleSearchContacts}
              onUpdatePetition={handleUpdatePetition}
              onSend={handleSend}
            />
          ) : (
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
          )}
        </Box>
      </PaneWithFlyout>
    </PetitionLayout>
  );
}

PetitionCompose.fragments = {
  Petition: gql`
    fragment PetitionCompose_Petition on Petition {
      id
      ...PetitionLayout_Petition
      fields {
        ...PetitionCompose_PetitionField
      }
      ...PetitionComposeMessageEditor_Petition
    }
    fragment PetitionCompose_PetitionField on PetitionField {
      ...PetitionComposeField_PetitionField
      ...PetitionComposeFieldSettings_PetitionField
    }
    ${PetitionLayout.fragments.Petition}
    ${PetitionComposeField.fragments.PetitionField}
    ${PetitionComposeFieldSettings.fragments.PetitionField}
    ${PetitionComposeMessageEditor.fragments.Petition}
  `,
  User: gql`
    fragment PetitionCompose_User on User {
      ...PetitionLayout_User
    }
    ${PetitionLayout.fragments.User}
  `,
};

PetitionCompose.mutations = [
  gql`
    mutation PetitionCompose_updatePetition(
      $petitionId: ID!
      $data: UpdatePetitionInput!
    ) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionLayout_Petition
        ...PetitionComposeMessageEditor_Petition
      }
    }
    ${PetitionLayout.fragments.Petition}
    ${PetitionComposeMessageEditor.fragments.Petition}
  `,
  gql`
    mutation PetitionCompose_updateFieldPositions(
      $petitionId: ID!
      $fieldIds: [ID!]!
    ) {
      updateFieldPositions(petitionId: $petitionId, fieldIds: $fieldIds) {
        id
        ...PetitionLayout_Petition
        fields {
          id
        }
      }
    }
    ${PetitionLayout.fragments.Petition}
  `,
  gql`
    mutation PetitionCompose_createPetitionField(
      $petitionId: ID!
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
          ...PetitionComposeField_PetitionField
          ...PetitionComposeFieldSettings_PetitionField
        }
        petition {
          ...PetitionLayout_Petition
          fields {
            id
          }
        }
      }
    }
    ${PetitionLayout.fragments.Petition}
    ${PetitionComposeField.fragments.PetitionField}
    ${PetitionComposeFieldSettings.fragments.PetitionField}
  `,
  gql`
    mutation PetitionCompose_clonePetitionField(
      $petitionId: ID!
      $fieldId: ID!
    ) {
      clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
        field {
          id
          ...PetitionComposeField_PetitionField
          ...PetitionComposeFieldSettings_PetitionField
        }
        petition {
          ...PetitionLayout_Petition
          fields {
            id
          }
        }
      }
    }
    ${PetitionLayout.fragments.Petition}
    ${PetitionComposeField.fragments.PetitionField}
    ${PetitionComposeFieldSettings.fragments.PetitionField}
  `,
  gql`
    mutation PetitionCompose_deletePetitionField(
      $petitionId: ID!
      $fieldId: ID!
      $force: Boolean
    ) {
      deletePetitionField(
        petitionId: $petitionId
        fieldId: $fieldId
        force: $force
      ) {
        id
        ...PetitionLayout_Petition
        fields {
          id
        }
      }
    }
    ${PetitionLayout.fragments.Petition}
  `,
  gql`
    mutation PetitionCompose_updatePetitionField(
      $petitionId: ID!
      $fieldId: ID!
      $data: UpdatePetitionFieldInput!
    ) {
      updatePetitionField(
        petitionId: $petitionId
        fieldId: $fieldId
        data: $data
      ) {
        field {
          id
          ...PetitionComposeField_PetitionField
          ...PetitionComposeFieldSettings_PetitionField
        }
        petition {
          id
          updatedAt
        }
      }
    }
    ${PetitionComposeField.fragments.PetitionField}
    ${PetitionComposeFieldSettings.fragments.PetitionField}
  `,
  gql`
    mutation PetitionCompose_changePetitionFieldType(
      $petitionId: ID!
      $fieldId: ID!
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
          ...PetitionComposeField_PetitionField
          ...PetitionComposeFieldSettings_PetitionField
          replies {
            id
          }
        }
        petition {
          id
          updatedAt
        }
      }
    }
    ${PetitionComposeField.fragments.PetitionField}
    ${PetitionComposeFieldSettings.fragments.PetitionField}
  `,
  gql`
    mutation PetitionCompose_sendPetition(
      $petitionId: ID!
      $contactIds: [ID!]!
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
        query PetitionCompose($id: ID!) {
          petition(id: $id) {
            ...PetitionCompose_Petition
          }
        }
        ${PetitionCompose.fragments.Petition}
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
        placement: "bottom-end",
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

import { gql } from "@apollo/client";
import { Alert, AlertIcon, Box, Flex, Heading, Stack } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import {
  ContactSelectSelection,
  ContactSelect,
  ContactSelectProps,
} from "@parallel/components/common/ContactSelect";
import { RichTextEditorContent } from "@parallel/components/common/RichTextEditor";
import { Spacer } from "@parallel/components/common/Spacer";
import {
  PetitionComposeMessageEditor_PetitionFragment,
  RemindersConfig,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { isEmptyContent } from "@parallel/utils/slate/isEmptyContent";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { memo, useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { omit } from "remeda";
import { MessageEmailEditor } from "../petition-common/MessageEmailEditor";
import { SendButton } from "../petition-common/SendButton";
import { PetitionRemindersConfig } from "./PetitionRemindersConfig";

export type PetitionComposeMessageEditorProps = ExtendChakra<{
  petition: PetitionComposeMessageEditor_PetitionFragment;
  showErrors: boolean;
  onSearchContacts: ContactSelectProps["onSearchContacts"];
  onCreateContact: ContactSelectProps["onCreateContact"];
  onUpdatePetition: (data: UpdatePetitionInput) => void;
  onSend: (data: { contactIds: string[]; schedule: boolean }) => void;
}>;

export const PetitionComposeMessageEditor = Object.assign(
  memo(function PetitionComposeMessageEditor({
    petition,
    showErrors,
    onSearchContacts,
    onCreateContact,
    onUpdatePetition,
    onSend,
    ...props
  }: PetitionComposeMessageEditorProps) {
    const [recipients, setRecipients] = useState<ContactSelectSelection[]>([]);
    const [subject, setSubject] = useState(petition.emailSubject ?? "");
    const [body, setBody] = useState<RichTextEditorContent>(
      petition.emailBody ?? [{ children: [{ text: "" }] }]
    );
    const [
      remindersConfig,
      setRemindersConfig,
    ] = useState<RemindersConfig | null>(petition.remindersConfig ?? null);
    const updateSubject = useDebouncedCallback(onUpdatePetition, 500, [
      onUpdatePetition,
    ]);
    const updateBody = useDebouncedCallback(onUpdatePetition, 500, [
      onUpdatePetition,
    ]);
    const updateRemindersConfig = useDebouncedCallback(onUpdatePetition, 500, [
      onUpdatePetition,
    ]);

    const handleSubjectChange = useCallback(
      (value: string) => {
        setSubject(value);
        updateSubject({ emailSubject: value || null });
      },
      [updateSubject]
    );

    const handleBodyChange = useCallback(
      (value: RichTextEditorContent) => {
        setBody(value);
        updateBody({ emailBody: isEmptyContent(value) ? null : value });
      },
      [updateBody]
    );

    function handleRemindersChange(value: RemindersConfig | null) {
      setRemindersConfig(value);
      updateRemindersConfig({
        remindersConfig: value ? omit(value, ["__typename"]) : value,
      });
    }

    const [enabledReminders, setEnableReminders] = useState<boolean>(false);

    async function handleSendClick({ schedule = false } = {}) {
      onSend({
        schedule,
        contactIds: recipients.map((r) => r.id),
      });
    }

    return (
      <Card id="petition-message-compose" {...props}>
        <Box padding={4} borderBottom="1px solid" borderBottomColor="gray.200">
          <Heading as="h2" size="sm">
            <FormattedMessage
              id="petition.message-settings.header"
              defaultMessage="Who do you want to send it to?"
            />
          </Heading>
        </Box>
        <Stack spacing={2} padding={4}>
          <Box id="petition-select-recipients">
            <ContactSelect
              isInvalid={showErrors && recipients.length === 0}
              onSearchContacts={onSearchContacts}
              onCreateContact={onCreateContact}
              value={recipients}
              onChange={setRecipients}
            />
          </Box>
          {recipients.length >= 2 ? (
            <Alert status="info">
              <AlertIcon />
              <FormattedMessage
                id="petition.message-settings.same-petition-warning"
                defaultMessage="All {recipientCount} recipients will receive a link to the same petition so they can fill it out collaboratively."
                values={{ recipientCount: recipients.length }}
              />
            </Alert>
          ) : null}
          <MessageEmailEditor
            showErrors={showErrors}
            subject={subject}
            body={body}
            onSubjectChange={handleSubjectChange}
            onBodyChange={handleBodyChange}
          />
          <PetitionRemindersConfig
            id="petition-reminders"
            value={remindersConfig}
            isEnabled={enabledReminders}
            onSwitched={setEnableReminders}
            onChange={handleRemindersChange}
            marginTop={2}
          />
          <Flex marginTop={2}>
            <Spacer />
            <SendButton
              onSendClick={() => handleSendClick()}
              onScheduleClick={() => handleSendClick({ schedule: true })}
            />
          </Flex>
        </Stack>
      </Card>
    );
  }),
  {
    fragments: {
      contact: gql`
        fragment PetitionComposeMessageEditor_Contact on Contact {
          id
          fullName
          email
        }
      `,
      Petition: gql`
        fragment PetitionComposeMessageEditor_Petition on Petition {
          emailSubject
          emailBody
          remindersConfig {
            offset
            time
            timezone
            weekdaysOnly
          }
        }
      `,
    },
  }
);

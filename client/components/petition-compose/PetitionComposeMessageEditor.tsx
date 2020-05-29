import { Alert, AlertIcon, Box, Flex, Heading, Stack } from "@chakra-ui/core";
import { Card, CardProps } from "@parallel/components/common/Card";
import {
  Recipient,
  RecipientSelect,
  RecipientSelectProps,
} from "@parallel/components/common/RecipientSelect";
import {
  isEmptyContent,
  RichTextEditorContent,
} from "@parallel/components/common/RichTextEditor";
import { Spacer } from "@parallel/components/common/Spacer";
import {
  PetitionComposeMessageEditor_PetitionFragment,
  RemindersConfig,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { gql } from "apollo-boost";
import { memo, useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { omit } from "remeda";
import { MessageEmailEditor } from "../petition-common/MessageEmailEditor";
import { SendButton } from "../petition-common/SendButton";
import { PetitionRemindersConfig } from "./PetitionRemindersConfig";

export type PetitionComposeMessageEditorProps = {
  petition: PetitionComposeMessageEditor_PetitionFragment;
  showErrors: boolean;
  onSearchContacts: RecipientSelectProps["onSearchContacts"];
  onCreateContact: RecipientSelectProps["onCreateContact"];
  onUpdatePetition: (data: UpdatePetitionInput) => void;
  onSend: (data: { contactIds: string[]; schedule: boolean }) => void;
} & CardProps;

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
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [subject, setSubject] = useState(petition.emailSubject ?? "");
    const [body, setBody] = useState<RichTextEditorContent>(
      petition.emailBody ?? [{ children: [{ text: "" }] }]
    );
    const [
      remindersConfig,
      setRemindersConfig,
    ] = useState<RemindersConfig | null>(petition.remindersConfig ?? null);
    const updateSubject = useDebouncedCallback(onUpdatePetition, 500, []);
    const updateBody = useDebouncedCallback(onUpdatePetition, 500, []);
    const updateRemindersConfig = useDebouncedCallback(
      onUpdatePetition,
      500,
      []
    );

    const handleSubjectChange = useCallback((value: string) => {
      setSubject(value);
      updateSubject({ emailSubject: value || null });
    }, []);

    const handleBodyChange = useCallback((value: RichTextEditorContent) => {
      setBody(value);
      updateBody({ emailBody: isEmptyContent(value) ? null : value });
    }, []);

    function handleRemindersChange(value: RemindersConfig | null) {
      setRemindersConfig(value);
      updateRemindersConfig({
        remindersConfig: value ? omit(value, ["__typename"]) : value,
      });
    }

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
            <RecipientSelect
              showErrors={showErrors}
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

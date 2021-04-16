import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import {
  RemindersConfig,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { emptyRTEValue } from "@parallel/utils/slate/emptyRTEValue";
import { isEmptyRTEValue } from "@parallel/utils/slate/isEmptyRTEValue";
import { Maybe } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useCallback, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { noop, omit } from "remeda";
import {
  ContactSelectProps,
  ContactSelectSelection,
} from "../common/ContactSelect";
import { HelpPopover } from "../common/HelpPopover";
import { RecipientSelectGroups } from "../common/RecipientSelectGroups";
import { RichTextEditorValue } from "../common/RichTextEditor";
import { MessageEmailEditor } from "../petition-common/MessageEmailEditor";
import { SendButton } from "../petition-common/SendButton";
import { PetitionRemindersConfig } from "../petition-compose/PetitionRemindersConfig";
import { useScheduleMessageDialog } from "../petition-compose/ScheduleMessageDialog";

export type AddPetitionAccessDialogProps = {
  onSearchContacts?: ContactSelectProps["onSearchContacts"];
  onCreateContact?: ContactSelectProps["onCreateContact"];
  onUpdatePetition?: (data: UpdatePetitionInput) => void;
  maxRecipientGroups?: number;
  defaultSubject?: Maybe<string>;
  defaultBody?: Maybe<RichTextEditorValue>;
  defaultRemindersConfig?: Maybe<RemindersConfig>;
};

export type AddPetitionAccessDialogResult = {
  recipientIdGroups: string[][];
  subject: string;
  body: RichTextEditorValue;
  remindersConfig: Maybe<RemindersConfig>;
  scheduledAt: Maybe<Date>;
};

export function AddPetitionAccessDialog({
  defaultSubject,
  defaultBody,
  defaultRemindersConfig,
  maxRecipientGroups,
  onUpdatePetition = noop,
  onSearchContacts = useSearchContacts(),
  onCreateContact = useCreateContact(),
  ...props
}: DialogProps<AddPetitionAccessDialogProps, AddPetitionAccessDialogResult>) {
  const [showErrors, setShowErrors] = useState(false);
  const [recipientGroups, setRecipientGroups] = useState<
    ContactSelectSelection[][]
  >([[]]);

  const [subject, setSubject] = useState(defaultSubject ?? "");
  const [body, setBody] = useState<RichTextEditorValue>(
    defaultBody ?? emptyRTEValue()
  );
  const [remindersConfig, setRemindersConfig] = useState<
    Maybe<RemindersConfig>
  >(
    defaultRemindersConfig ? omit(defaultRemindersConfig, ["__typename"]) : null
  );
  const [updateSubject, updateBody, updateRemindersConfig] = [
    useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]),
    useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]),
    useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]),
  ];

  const handleSubjectChange = useCallback(
    (value: string) => {
      setSubject(value);
      updateSubject({ emailSubject: value || null });
    },
    [updateSubject]
  );

  const handleBodyChange = useCallback(
    (value: RichTextEditorValue) => {
      setBody(value);
      updateBody({ emailBody: isEmptyRTEValue(value) ? null : value });
    },
    [updateBody]
  );

  const handleRemindersConfigChange = useCallback(
    (value: Maybe<RemindersConfig>) => {
      setRemindersConfig(value);
      updateRemindersConfig({
        remindersConfig: value ? omit(value, ["__typename"]) : null,
      });
    },
    [updateRemindersConfig]
  );

  const recipientsRef = useRef<HTMLInputElement>(null);

  const isValid = Boolean(
    subject &&
      !isEmptyRTEValue(body) &&
      recipientGroups.every(
        (g) => g.length > 0 && g.every((r) => !r.isInvalid && !r.isDeleted)
      )
  );

  const showScheduleMessageDialog = useScheduleMessageDialog();
  const handleSendClick = async (schedule: boolean) => {
    try {
      if (!isValid) {
        setShowErrors(true);
        return;
      }
      const scheduledAt = schedule ? await showScheduleMessageDialog({}) : null;
      props.onResolve({
        recipientIdGroups: recipientGroups.map((group) =>
          group.map((g) => g.id)
        ),
        subject,
        body,
        remindersConfig,
        scheduledAt,
      });
    } catch {}
  };

  return (
    <ConfirmDialog
      closeOnEsc={false}
      closeOnOverlayClick={false}
      initialFocusRef={recipientsRef}
      size="2xl"
      header={
        <Flex alignItems="center">
          <FormattedMessage
            id="petition.add-access.header"
            defaultMessage="Who do you want to send it to?"
          />
          {maxRecipientGroups === 1 ? null : (
            <HelpPopover
              popoverWidth="container.2xs"
              marginLeft={2}
              color="blue.200"
              _hover={{ color: "blue.300" }}
            >
              <Stack direction="row">
                <Stack flex="1" alignItems="flex-start">
                  <Image
                    height="40px"
                    marginRight={2}
                    src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/recipient-collaboration.svg`}
                  />
                  <Heading size="sm">
                    <FormattedMessage
                      id="component.add-petition-access-dialog.recipients-label"
                      defaultMessage="Recipients"
                    />
                  </Heading>
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="component.add-petition-access-dialog.recipients-description"
                      defaultMessage="Will reply to the same petition collaboratively."
                    />
                  </Text>
                </Stack>
                <Stack flex="1" alignItems="flex-start">
                  <Image
                    height="40px"
                    marginRight={2}
                    src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/recipient-groups.svg`}
                  />
                  <Heading size="sm">
                    <FormattedMessage
                      id="component.add-petition-access-dialog.recipient-groups-label"
                      defaultMessage="Recipient groups"
                    />
                  </Heading>
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="component.add-petition-access-dialog.recipient-groups-description"
                      defaultMessage="Each group will reply to different petitions."
                    />
                  </Text>
                </Stack>
              </Stack>
            </HelpPopover>
          )}
        </Flex>
      }
      body={
        <>
          <RecipientSelectGroups
            recipientGroups={recipientGroups}
            onChangeRecipientGroups={setRecipientGroups}
            onSearchContacts={onSearchContacts}
            onCreateContact={onCreateContact}
            showErrors={showErrors}
            maxGroups={maxRecipientGroups}
          />
          <Box marginTop={4}>
            <MessageEmailEditor
              showErrors={showErrors}
              subject={subject}
              body={body}
              onSubjectChange={handleSubjectChange}
              onBodyChange={handleBodyChange}
            />
          </Box>
          <PetitionRemindersConfig
            marginTop={2}
            value={remindersConfig}
            onChange={handleRemindersConfigChange}
          />
        </>
      }
      confirm={
        <SendButton
          onSendClick={() => handleSendClick(false)}
          onScheduleClick={() => handleSendClick(true)}
        />
      }
      cancel={
        <Button onClick={() => props.onReject({ reason: "CANCEL" })}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      {...props}
    />
  );
}

AddPetitionAccessDialog.fragments = {
  Petition: gql`
    fragment AddPetitionAccessDialog_Petition on Petition {
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
};

export function useAddPetitionAccessDialog() {
  return useDialog(AddPetitionAccessDialog);
}

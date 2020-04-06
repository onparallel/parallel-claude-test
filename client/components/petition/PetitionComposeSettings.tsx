import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  IconButton,
  Input,
  MenuItem,
  MenuList,
  Select,
  Stack,
  Heading,
} from "@chakra-ui/core";
import { Card, CardProps } from "@parallel/components/common/Card";
import { DateTimeInput } from "@parallel/components/common/DatetimeInput";
import { Divider } from "@parallel/components/common/Divider";
import {
  Recipient,
  RecipientSelect,
} from "@parallel/components/common/RecipientSelect";
import {
  isEmptyContent,
  RichTextEditor,
  RichTextEditorContent,
} from "@parallel/components/common/RichTextEditor";
import { Spacer } from "@parallel/components/common/Spacer";
import { SplitButton } from "@parallel/components/common/SplitButton";
import {
  PetitionComposeSettings_ContactFragment,
  PetitionComposeSettings_PetitionFragment,
  PetitionLocale,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { gql } from "apollo-boost";
import { ChangeEvent, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ButtonDropdown } from "../common/ButtonDropdown";
import { CollapseContent } from "../common/CollapseContent";

export type PetitionComposeSettingsProps = {
  petition: PetitionComposeSettings_PetitionFragment;
  searchContacts: (
    search: string,
    exclude: string[]
  ) => Promise<PetitionComposeSettings_ContactFragment[]>;
  onUpdatePetition: (data: UpdatePetitionInput) => void;
} & CardProps;

export function PetitionComposeSettings({
  petition,
  searchContacts,
  onUpdatePetition,
  ...props
}: PetitionComposeSettingsProps) {
  const intl = useIntl();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState(petition!.emailSubject ?? "");
  const [body, setBody] = useState<RichTextEditorContent>(
    petition!.emailBody ?? [{ children: [{ text: "" }] }]
  );
  const updateSubject = useDebouncedCallback(onUpdatePetition, 500, []);
  const updateBody = useDebouncedCallback(onUpdatePetition, 500, []);
  const updateDeadline = useDebouncedCallback(onUpdatePetition, 500, []);

  const handleSubjectChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSubject(event.target.value);
      updateSubject({ emailSubject: event.target.value || null });
    },
    []
  );

  const handleBodyChange = useCallback((value: RichTextEditorContent) => {
    setBody(value);
    updateBody({ emailBody: isEmptyContent(value) ? null : value });
  }, []);

  const handleLocaleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onUpdatePetition({
        locale: event.target.value as PetitionLocale,
      });
    },
    []
  );

  const handleDeadlineChange = useCallback((value: Date | null) => {
    updateDeadline({ deadline: value ? value.toISOString() : null });
  }, []);

  return (
    <Card {...props}>
      <Box padding={4} borderBottom="1px solid" borderBottomColor="gray.200">
        <Heading as="h2" size="sm">
          <FormattedMessage
            id="petition.settings-header"
            defaultMessage="Who do you want to send it to?"
          />
        </Heading>
      </Box>
      <Stack spacing={2} padding={4}>
        <FormControl>
          <FormLabel
            htmlFor="petition-recipients"
            paddingBottom={0}
            minWidth="120px"
          >
            <FormattedMessage
              id="petition.recipients-label"
              defaultMessage="Recipients"
            />
          </FormLabel>
          <RecipientSelect
            inputId="petition-recipients"
            searchContacts={searchContacts}
            value={recipients}
            onChange={setRecipients}
          />
        </FormControl>
        {recipients.length >= 2 ? (
          <Alert status="info">
            <AlertIcon />
            <FormattedMessage
              id="petition.same-petition-warning"
              defaultMessage="All {recipients} recipients will receive a link to the same petition so they can fill it out collaboratively."
              values={{ recipients: recipients.length }}
            />
          </Alert>
        ) : null}
        <FormControl>
          <FormLabel
            htmlFor="petition-subject"
            paddingBottom={0}
            minWidth="120px"
          >
            <FormattedMessage
              id="petition.subject-label"
              defaultMessage="Subject"
            />
          </FormLabel>
          <Input
            id="petition-subject"
            type="text"
            value={subject ?? ""}
            placeholder={intl.formatMessage({
              id: "petition.subject-placeholder",
              defaultMessage: "Enter the subject of the email",
            })}
            onChange={handleSubjectChange}
          ></Input>
        </FormControl>
        <Box>
          <RichTextEditor
            placeholder={intl.formatMessage({
              id: "petition.body-placeholder",
              defaultMessage: "Write a message to include in the email",
            })}
            value={body}
            onChange={handleBodyChange}
            style={{ minHeight: "100px" }}
          ></RichTextEditor>
        </Box>
        <CollapseContent
          marginTop={2}
          header={
            <Heading size="sm">
              <FormattedMessage
                id="petition.advanced-settings"
                defaultMessage="Advanced settings"
              />
            </Heading>
          }
        >
          <Stack paddingTop={0} spacing={4}>
            <FormControl>
              <FormLabel htmlFor="petition-locale">
                <FormattedMessage
                  id="petition.locale-label"
                  defaultMessage="Language"
                />
              </FormLabel>
              <Select
                id="petition-locale"
                value={petition!.locale}
                onChange={handleLocaleChange}
              >
                <option value="en">
                  {intl.formatMessage({
                    id: "petition.locale.en",
                    defaultMessage: "English",
                  })}
                </option>
                <option value="es">
                  {intl.formatMessage({
                    id: "petition.locale.es",
                    defaultMessage: "Spanish",
                  })}
                </option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel
                htmlFor="petition-deadline"
                paddingBottom={0}
                minWidth="120px"
              >
                <FormattedMessage
                  id="petition.deadline-label"
                  defaultMessage="Deadline"
                />
              </FormLabel>
              <DateTimeInput
                id="petition-deadline"
                type="datetime-local"
                isFullWidth
                value={petition!.deadline ? new Date(petition!.deadline) : null}
                onChange={handleDeadlineChange}
              />
            </FormControl>
          </Stack>
        </CollapseContent>
        <Flex marginTop={2}>
          <Spacer />
          <SplitButton dividerColor="purple.600">
            <Button variantColor="purple" leftIcon={"paper-plane" as any}>
              <FormattedMessage
                id="petition.send-button"
                defaultMessage="Send"
              />
            </Button>
            <ButtonDropdown
              as={IconButton}
              variantColor="purple"
              icon="chevron-down"
              aria-label="Options"
              minWidth={8}
              dropdown={
                <MenuList minWidth={0} placement="bottom-end">
                  <MenuItem>
                    <Icon name="time" marginRight={2} />
                    <FormattedMessage
                      id="petition.schedule-send-button"
                      defaultMessage="Schedule send"
                    />
                  </MenuItem>
                </MenuList>
              }
            ></ButtonDropdown>
          </SplitButton>
        </Flex>
      </Stack>
    </Card>
  );
}

PetitionComposeSettings.fragments = {
  contact: gql`
    fragment PetitionComposeSettings_Contact on Contact {
      id
      fullName
      email
    }
  `,
  petition: gql`
    fragment PetitionComposeSettings_Petition on Petition {
      locale
      deadline
      emailSubject
      emailBody
    }
  `,
};

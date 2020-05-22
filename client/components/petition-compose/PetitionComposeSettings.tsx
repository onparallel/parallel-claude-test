import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  IconButton,
  Input,
  MenuItem,
  MenuList,
  PseudoBox,
  Select,
  Stack,
  Text,
} from "@chakra-ui/core";
import { Card, CardProps } from "@parallel/components/common/Card";
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
  RemindersConfig,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { gql } from "apollo-boost";
import { ChangeEvent, useCallback, useState, memo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { omit } from "remeda";
import { ButtonDropdown } from "../common/ButtonDropdown";
import { CollapseContent } from "../common/CollapseContent";
import { DateTime } from "../common/DateTime";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { usePetitionDeadlineDialog } from "./PetitionDeadlineDialog";
import { PetitionRemindersConfig } from "./PetitionRemindersConfig";

export type PetitionComposeSettingsProps = {
  petition: PetitionComposeSettings_PetitionFragment;
  searchContacts: (
    search: string,
    exclude: string[]
  ) => Promise<PetitionComposeSettings_ContactFragment[]>;
  onUpdatePetition: (data: UpdatePetitionInput) => void;
  onSend: (data: { contactIds: string[]; schedule: boolean }) => void;
} & CardProps;

export const PetitionComposeSettings = Object.assign(
  memo(function PetitionComposeSettings({
    petition,
    searchContacts,
    onUpdatePetition,
    onSend,
    ...props
  }: PetitionComposeSettingsProps) {
    const intl = useIntl();
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

    function handleEnableRemindersChange(event: ChangeEvent<HTMLInputElement>) {
      const value = event.target.checked
        ? {
            offset: 2,
            time: "09:00",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            weekdaysOnly: false,
          }
        : null;
      setRemindersConfig(value);
      updateRemindersConfig({ remindersConfig: value });
    }

    function handleRemindersChange(value: RemindersConfig) {
      setRemindersConfig(value);
      updateRemindersConfig({
        remindersConfig: omit(value, ["__typename"]),
      });
    }

    async function handleSendClick({ schedule = false } = {}) {
      onSend({
        schedule,
        contactIds: recipients.map((r) => r.id),
      });
    }

    const showPetitionDeadlineDialog = usePetitionDeadlineDialog();
    async function handleSetDeadlineClick() {
      try {
        const deadline = await showPetitionDeadlineDialog({});
        onUpdatePetition({ deadline: deadline.toISOString() });
      } catch {}
    }

    return (
      <Card id="petition-message-compose" {...props}>
        <Box padding={4} borderBottom="1px solid" borderBottomColor="gray.200">
          <Heading as="h2" size="sm">
            <FormattedMessage
              id="petition.settings-header"
              defaultMessage="Who do you want to send it to?"
            />
          </Heading>
        </Box>
        <Stack spacing={2} padding={4}>
          <FormControl id="petition-select-recipients">
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
          <Flex id="petition-reminders" alignItems="center" marginTop={2}>
            <Checkbox
              id="petition-reminders"
              variantColor="purple"
              size="lg"
              marginRight={2}
              isChecked={Boolean(remindersConfig)}
              onChange={handleEnableRemindersChange}
            />
            <Text as="label" {...{ htmlFor: "petition-reminders" }}>
              <FormattedMessage
                id="petition.reminders-label"
                defaultMessage="Enable automatic reminders"
              />
            </Text>
          </Flex>
          {remindersConfig ? (
            <PetitionRemindersConfig
              value={remindersConfig}
              onChange={handleRemindersChange}
            />
          ) : null}
          <CollapseContent
            id="petition-advanced-settings"
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
            <Stack paddingTop={0} spacing={2}>
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
                  onChange={(event) =>
                    onUpdatePetition({
                      locale: event.target.value as PetitionLocale,
                    })
                  }
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
              <Box>
                <Text paddingBottom={1} margin={0}>
                  <FormattedMessage
                    id="petition.deadline-label"
                    defaultMessage="Deadline"
                  />
                </Text>
                <PseudoBox
                  display="flex"
                  alignItems="center"
                  paddingLeft={4}
                  paddingRight={2}
                  rounded="md"
                  border="1px solid"
                  borderColor="gray.200"
                  _hover={{
                    borderColor: "gray.300",
                  }}
                  height={10}
                >
                  {petition!.deadline ? (
                    <>
                      <DateTime
                        value={petition!.deadline}
                        format={{ ...FORMATS.LLL, weekday: "long" }}
                      />
                      {petition!.deadline ? (
                        <IconButtonWithTooltip
                          marginLeft={2}
                          variant="ghost"
                          size="xs"
                          icon="close"
                          label={intl.formatMessage({
                            id: "petition.remove-deadline",
                            defaultMessage: "Remove deadline",
                          })}
                          onClick={() => onUpdatePetition({ deadline: null })}
                        />
                      ) : null}
                    </>
                  ) : (
                    <Text color="gray.400" fontStyle="italic">
                      <FormattedMessage
                        id="generic.no-deadline"
                        defaultMessage="No deadline"
                      />
                    </Text>
                  )}
                  <Spacer />
                  <Button
                    marginLeft={2}
                    leftIcon="time"
                    size="xs"
                    onClick={handleSetDeadlineClick}
                  >
                    {petition!.deadline ? (
                      <FormattedMessage
                        id="petition.change-deadline"
                        defaultMessage="Change deadline"
                      />
                    ) : (
                      <FormattedMessage
                        id="petition.set-a-deadline"
                        defaultMessage="Set a deadline"
                      />
                    )}
                  </Button>
                </PseudoBox>
              </Box>
            </Stack>
          </CollapseContent>
          <Flex marginTop={2}>
            <Spacer />
            <SplitButton dividerColor="purple.600">
              <Button
                variantColor="purple"
                leftIcon={"paper-plane" as any}
                onClick={() => handleSendClick()}
              >
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
                  <MenuList minWidth={0} placement="top-end">
                    <MenuItem
                      onClick={() => handleSendClick({ schedule: true })}
                    >
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
  }),
  {
    fragments: {
      contact: gql`
        fragment PetitionComposeSettings_Contact on Contact {
          id
          fullName
          email
        }
      `,
      Petition: gql`
        fragment PetitionComposeSettings_Petition on Petition {
          locale
          deadline
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

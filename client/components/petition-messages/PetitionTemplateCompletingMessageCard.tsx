import { gql } from "@apollo/client";
import {
  AlertIcon,
  Box,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Input,
  Switch,
  Text,
} from "@chakra-ui/react";
import { AppWindowIcon } from "@parallel/chakra/icons";
import {
  PetitionTemplateCompletingMessageCard_PetitionTemplateFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { usePetitionMessagePlaceholderOptions } from "@parallel/utils/slate/placeholders/usePetitionMessagePlaceholderOptions";
import { emptyRTEValue } from "@parallel/utils/slate/RichTextEditor/emptyRTEValue";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { ChangeEvent, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Card, CardHeader, CardProps } from "../common/Card";
import { CloseableAlert } from "../common/CloseableAlert";
import { HelpPopover } from "../common/HelpPopover";
import { PaddedCollapse } from "../common/PaddedCollapse";
import { RichTextEditor } from "../common/slate/RichTextEditor";
import { Spacer } from "../common/Spacer";

interface PetitionTemplateCompletingMessageCardProps extends CardProps {
  petition: PetitionTemplateCompletingMessageCard_PetitionTemplateFragment;
  onUpdatePetition: (data: UpdatePetitionInput) => void;
}

export function PetitionTemplateCompletingMessageCard({
  petition,
  onUpdatePetition,
  ...props
}: PetitionTemplateCompletingMessageCardProps) {
  const intl = useIntl();

  const [isEnabled, setIsEnabled] = useState(petition.isCompletingMessageEnabled);
  const [subject, setSubject] = useState(petition.completingMessageSubject ?? "");
  const [body, setBody] = useState(petition.completingMessageBody ?? emptyRTEValue());

  const handleSubjectChange = (completingMessageSubject: string) => {
    if (completingMessageSubject === subject) return;
    setSubject(completingMessageSubject);
    setIsEnabled(!!completingMessageSubject || !isEmptyRTEValue(body));
    onUpdatePetition({
      completingMessageSubject,
      isCompletingMessageEnabled: !!completingMessageSubject || !isEmptyRTEValue(body),
    });
  };

  const handleBodyChange = (completingMessageBody: RichTextEditorValue) => {
    setBody(completingMessageBody);
    setIsEnabled(!!subject || !isEmptyRTEValue(completingMessageBody));
    onUpdatePetition({
      completingMessageBody: isEmptyRTEValue(completingMessageBody) ? null : completingMessageBody,
      isCompletingMessageEnabled: !!subject || !isEmptyRTEValue(completingMessageBody),
    });
  };

  const handleSwitchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIsEnabled(event.target.checked);
    onUpdatePetition({
      isCompletingMessageEnabled: event.target.checked,
    });
  };

  const isReadOnly = petition.isRestricted || petition.isPublic;
  const placeholderOptions = usePetitionMessagePlaceholderOptions();

  return (
    <Card {...props}>
      <CardHeader>
        <Flex alignItems="center">
          <AppWindowIcon marginRight={2} />
          <FormattedMessage
            id="component.petition-template-completing-message.card-header"
            defaultMessage="Thank you message"
          />
          <HelpPopover>
            <FormattedMessage
              id="component.petition-template-completing-message.popover"
              defaultMessage="Your message will be displayed in a pop-up upon completion."
            />
            <Image
              marginTop={2}
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/templates/thankyou_message_${intl.locale}.gif`}
            />
          </HelpPopover>
          <Spacer />
          <Switch
            isChecked={isEnabled}
            onChange={handleSwitchChange}
            isDisabled={petition.isRestricted || petition.isPublic}
          />
        </Flex>
      </CardHeader>
      <Box padding={4}>
        <Text marginBottom={2}>
          <FormattedMessage
            id="component.petition-template-completing-message.card-explainer"
            defaultMessage="This message will be shown when the recipient <b>completes</b> the petition. Use it to thank them or to include further instructions."
          />
        </Text>
        <PaddedCollapse in={isEnabled}>
          {petition.signatureConfig ? (
            <CloseableAlert status="info" mb={2} alignItems="start">
              <AlertIcon />
              <FormattedMessage
                id="component.petition-template-completing-message.card-signature-alert"
                defaultMessage="There is a signature added in this template. We recommend that you take this into account in your message, as it will appear before the recipient receives the signature."
              />
            </CloseableAlert>
          ) : null}
          <FormControl>
            <FormLabel paddingBottom={0}>
              <FormattedMessage
                id="component.petition-template-completing-message.subject-label"
                defaultMessage="Title of the window"
              />
            </FormLabel>
            <Input
              id="input-message-email-editor-subject"
              type="text"
              value={subject}
              maxLength={255}
              onChange={(event) => handleSubjectChange(event.target.value)}
              onBlur={() => handleSubjectChange(subject.trim())}
              placeholder={intl.formatMessage({
                id: "component.petition-template-completing-message.subject-placeholder",
                defaultMessage: "Enter a title or subject for your message",
              })}
              isDisabled={isReadOnly}
            />
          </FormControl>
          <FormControl marginTop={4}>
            <RichTextEditor
              id={`completing-message-${petition.id}`}
              value={body}
              onChange={handleBodyChange}
              placeholder={intl.formatMessage({
                id: "component.petition-template-completing-message.body-placeholder",
                defaultMessage:
                  "Write the message that your recipients will see when they finalize",
              })}
              placeholderOptions={placeholderOptions}
              isDisabled={isReadOnly}
            />
          </FormControl>
        </PaddedCollapse>
      </Box>
    </Card>
  );
}

PetitionTemplateCompletingMessageCard.fragments = {
  PetitionTemplate: gql`
    fragment PetitionTemplateCompletingMessageCard_PetitionTemplate on PetitionTemplate {
      id
      isCompletingMessageEnabled
      completingMessageSubject
      completingMessageBody
      isRestricted
      isPublic
      signatureConfig {
        __typename
      }
    }
  `,
};

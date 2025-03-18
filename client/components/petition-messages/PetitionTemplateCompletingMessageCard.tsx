import { gql } from "@apollo/client";
import {
  AlertDescription,
  AlertIcon,
  Box,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Input,
  Switch,
  Text,
} from "@chakra-ui/react";
import { AppWindowIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionLocale,
  PetitionTemplateCompletingMessageCard_PetitionTemplateFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { textWithPlaceholderToSlateNodes } from "@parallel/utils/slate/textWithPlaceholder";
import { usePetitionMessagePlaceholderOptions } from "@parallel/utils/usePetitionMessagePlaceholderOptions";
import { ChangeEvent, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Card, CardHeader } from "../common/Card";
import { CloseableAlert } from "../common/CloseableAlert";
import { HelpPopover } from "../common/HelpPopover";
import { PaddedCollapse } from "../common/PaddedCollapse";
import { RichTextEditor } from "../common/slate/RichTextEditor";

interface PetitionTemplateCompletingMessageCardProps {
  petition: PetitionTemplateCompletingMessageCard_PetitionTemplateFragment;
  onUpdatePetition: (data: UpdatePetitionInput) => void;
}

const messagesSubject: Record<PetitionLocale, string> = {
  ca: "Gràcies per haver completat",
  en: "Thank you for completing",
  es: "Gracias por completar",
  it: "Grazie per aver completato",
  pt: "Obrigado por completar",
};

const messagesBody: Record<PetitionLocale, string> = {
  ca: "Hem informat a {{ user-first-name }} que s'ha completat la informació per continuar amb el procés",
  en: "We informed {{ user-first-name }} that you have completed the information to continue with the process",
  es: "Hemos informado a {{ user-first-name }} de que se ha completado la información para continuar con el proceso",
  it: "Abbiamo informato {{ user-first-name }} che le informazioni sono state completate per continuare con il processo",
  pt: "Informámos {{ user-first-name }} de que completou a informação para continuar com o processo",
};

export const PetitionTemplateCompletingMessageCard = Object.assign(
  chakraForwardRef<"section", PetitionTemplateCompletingMessageCardProps>(
    function PetitionTemplateCompletingMessageCard({ petition, onUpdatePetition, ...props }, ref) {
      const intl = useIntl();
      const placeholders = usePetitionMessagePlaceholderOptions({ petition });
      const [isEnabled, setIsEnabled] = useState(petition.isCompletingMessageEnabled);
      const [subject, setSubject] = useState(
        petition.completingMessageSubject ?? messagesSubject[petition.locale],
      );
      const [body, setBody] = useState(
        petition.completingMessageBody ??
          textWithPlaceholderToSlateNodes(messagesBody[petition.locale], placeholders),
      );

      const myEffectivePermission = petition.myEffectivePermission!.permissionType;

      const handleSubjectChange = (completingMessageSubject: string) => {
        if (completingMessageSubject === subject) return;
        setSubject(completingMessageSubject);
        onUpdatePetition({
          completingMessageSubject,
          isCompletingMessageEnabled: !!completingMessageSubject || !isEmptyRTEValue(body),
        });
      };

      const handleBodyChange = (completingMessageBody: RichTextEditorValue) => {
        setBody(completingMessageBody);
        onUpdatePetition({
          completingMessageBody: isEmptyRTEValue(completingMessageBody)
            ? null
            : completingMessageBody,
          isCompletingMessageEnabled: !!subject || !isEmptyRTEValue(completingMessageBody),
        });
      };

      const handleSwitchChange = (event: ChangeEvent<HTMLInputElement>) => {
        setIsEnabled(event.target.checked);

        onUpdatePetition({
          completingMessageSubject: subject,
          completingMessageBody: isEmptyRTEValue(body) ? null : body,
          isCompletingMessageEnabled: event.target.checked,
        });
      };

      const isReadOnly =
        petition.isRestricted || petition.isPublic || myEffectivePermission === "READ";

      return (
        <Card {...props}>
          <CardHeader
            leftIcon={<AppWindowIcon marginEnd={2} role="presentation" />}
            rightAction={
              <Switch isChecked={isEnabled} onChange={handleSwitchChange} isDisabled={isReadOnly} />
            }
          >
            <HStack>
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
                  src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/templates/thankyou_message_${intl.locale}.gif`}
                />
              </HelpPopover>
            </HStack>
          </CardHeader>
          <Box padding={4}>
            <Text marginBottom={2}>
              <FormattedMessage
                id="component.petition-template-completing-message.card-explainer"
                defaultMessage="This message will be shown when the recipient <b>completes</b> the parallel. Use it to thank them or to include further instructions."
              />
            </Text>
            <PaddedCollapse in={isEnabled}>
              {petition.signatureConfig?.isEnabled ? (
                <CloseableAlert status="info" rounded="md" marginBottom={2}>
                  <AlertIcon />
                  <AlertDescription>
                    <FormattedMessage
                      id="component.petition-template-completing-message.card-signature-alert"
                      defaultMessage="There is a signature added in this template. We recommend that you take this into account in your message, as it will appear before the recipient receives the signature email."
                    />
                  </AlertDescription>
                </CloseableAlert>
              ) : null}
              <FormControl isDisabled={isReadOnly}>
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
                />
              </FormControl>
              <FormControl
                marginTop={4}
                id={`completing-message-${petition.id}`}
                isDisabled={isReadOnly}
              >
                <RichTextEditor
                  value={body}
                  onChange={handleBodyChange}
                  placeholder={intl.formatMessage({
                    id: "component.petition-template-completing-message.body-placeholder",
                    defaultMessage:
                      "Write the message that your recipients will see when they finalize",
                  })}
                  placeholderOptions={placeholders}
                />
              </FormControl>
            </PaddedCollapse>
          </Box>
        </Card>
      );
    },
  ),
  {
    fragments: {
      PetitionTemplate: gql`
        fragment PetitionTemplateCompletingMessageCard_PetitionTemplate on PetitionTemplate {
          id
          isCompletingMessageEnabled
          completingMessageSubject
          completingMessageBody
          isRestricted
          isPublic
          locale
          signatureConfig {
            isEnabled
          }
          myEffectivePermission {
            permissionType
          }
          ...usePetitionMessagePlaceholderOptions_PetitionBase
        }
        ${usePetitionMessagePlaceholderOptions.fragments.PetitionBase}
      `,
    },
  },
);

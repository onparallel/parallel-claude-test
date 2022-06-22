import { gql } from "@apollo/client";
import {
  Button,
  Center,
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { PaperPlaneIcon, ThumbUpIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PetitionLocale } from "@parallel/graphql/__types";
import { textWithPlaceholderToSlateNodes } from "@parallel/utils/slate/placeholders/textWithPlaceholderToSlateNodes";
import { usePetitionMessagePlaceholderOptions } from "@parallel/utils/slate/placeholders/usePetitionMessagePlaceholderOptions";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { Maybe } from "@parallel/utils/types";
import { outdent } from "outdent";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { HelpPopover } from "../../common/HelpPopover";
import { PaddedCollapse } from "../../common/PaddedCollapse";
import { RichTextEditor, RichTextEditorInstance } from "../../common/slate/RichTextEditor";

interface ClosePetitionDialogInput {
  id: string;
  locale: PetitionLocale;
  petitionName: Maybe<string>;
  hasPetitionPdfExport: boolean;
  requiredMessage: boolean;
  showNotify: boolean;
  emailMessage?: RichTextEditorValue;
}

interface ClosePetitionDialogNotification {
  message: Maybe<RichTextEditorValue>;
  pdfExportTitle: Maybe<string>;
}

const messages: Record<PetitionLocale, string> = {
  en: outdent`
    Dear #contact-first-name#,

    We have reviewed all the information that we requested, and we can confirm that everything is correct.

    Let us know if you have any questions or comments.
    
    Best regards.
  `,
  es: outdent`
    Apreciado/a #contact-first-name#,

    Le comunicamos que hemos revisado toda la información que le requerimos y le confirmamos que está todo correcto.
    
    Quedamos a su entera disposición para aclarar o comentar cualquier aspecto que considere oportuno.
    
    Reciba un cordial saludo.
  `,
};

export function ClosePetitionDialog({
  id,
  locale,
  petitionName,
  hasPetitionPdfExport,
  requiredMessage,
  showNotify,
  emailMessage,
  ...props
}: DialogProps<ClosePetitionDialogInput, ClosePetitionDialogNotification>) {
  const intl = useIntl();
  const placeholders = usePetitionMessagePlaceholderOptions();
  const [message, setMessage] = useState<RichTextEditorValue>(
    emailMessage ?? textWithPlaceholderToSlateNodes(messages[locale], placeholders)
  );
  const [sendMessage, setSendMessage] = useState(requiredMessage);
  const messageRef = useRef<RichTextEditorInstance>(null);

  const [attachPdfExport, setAttachPdfExport] = useState(false);
  const pdfExportTitleRef = useRef<HTMLInputElement>(null);
  const [pdfExportTitle, setPdfExportTitle] = useState(petitionName ?? "");

  const [isInvalid, setIsInvalid] = useState(false);

  const handleMessageChange = (value: RichTextEditorValue) => {
    setMessage(value);
    if (!isEmptyRTEValue(value) && isInvalid) {
      setIsInvalid(false);
    }
  };

  const placeholderOptions = usePetitionMessagePlaceholderOptions();

  return (
    <ConfirmDialog
      size="xl"
      header={
        <Stack direction="row" spacing={4} alignItems="center">
          <Center backgroundColor="blue.500" borderRadius="full" boxSize="36px">
            <ThumbUpIcon boxSize="20px" color="white" />
          </Center>
          <Text>
            <FormattedMessage
              id="component.close-petition-dialog.heading"
              defaultMessage="Finish petition"
            />
          </Text>
        </Stack>
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="component.close-petition-dialog.subheading"
              defaultMessage="When finishing, the petition will remain closed. You can come back anytime to review the information."
            />
          </Text>
          {showNotify ? (
            <Stack>
              <Checkbox
                hidden={requiredMessage}
                isChecked={sendMessage}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  if (isChecked) {
                    setTimeout(() => messageRef.current?.focus());
                  }
                  setSendMessage(isChecked);
                }}
              >
                <FormattedMessage
                  id="component.close-petition-dialog.notify-recipient.notify-recipient"
                  defaultMessage="Notify the recipient that everything is reviewed."
                />
              </Checkbox>
              <PaddedCollapse in={requiredMessage || sendMessage}>
                <Stack>
                  <RichTextEditor
                    id={`close-petition-message-${id}`}
                    isInvalid={isInvalid}
                    ref={messageRef}
                    value={message}
                    onChange={handleMessageChange}
                    placeholder={intl.formatMessage({
                      id: "component.close-petition-dialog.notify-recipient.message-placeholder",
                      defaultMessage: "Add a message to include in the email",
                    })}
                    placeholderOptions={placeholderOptions}
                  />
                  {hasPetitionPdfExport ? (
                    <>
                      <Checkbox
                        colorScheme="primary"
                        onChange={(e) => {
                          setAttachPdfExport(e.target.checked);
                          if (e.target.checked) {
                            setTimeout(() => {
                              pdfExportTitleRef.current!.select();
                            });
                          }
                        }}
                        isChecked={attachPdfExport}
                      >
                        <FormattedMessage
                          id="component.close-petition-dialog.attach-pdf-export.checkbox"
                          defaultMessage="Attach a PDF export with the submitted replies"
                        />
                      </Checkbox>
                      <PaddedCollapse in={attachPdfExport}>
                        <FormControl>
                          <FormLabel display="flex" alignItems="center">
                            <FormattedMessage
                              id="component.close-petition-dialog.attach-pdf-export.title"
                              defaultMessage="PDF export title"
                            />
                            <HelpPopover placement="auto">
                              <FormattedMessage
                                id="component.close-petition-dialog.attach-pdf-export.title.help"
                                defaultMessage="This will be the name of the attached PDF file."
                              />
                            </HelpPopover>
                          </FormLabel>
                          <Input
                            ref={pdfExportTitleRef}
                            value={pdfExportTitle}
                            isInvalid={attachPdfExport && !pdfExportTitle}
                            onChange={(e) => setPdfExportTitle(e.target.value)}
                          />
                        </FormControl>
                      </PaddedCollapse>
                    </>
                  ) : null}
                </Stack>
              </PaddedCollapse>
            </Stack>
          ) : null}
        </Stack>
      }
      confirm={
        <Button
          leftIcon={sendMessage ? <PaperPlaneIcon /> : undefined}
          colorScheme="primary"
          onClick={() => {
            if (sendMessage && (isEmptyRTEValue(message) || (attachPdfExport && !pdfExportTitle))) {
              if (isEmptyRTEValue(message)) setIsInvalid(true);
              return;
            }

            props.onResolve({
              message: sendMessage ? message : null,
              pdfExportTitle: attachPdfExport ? pdfExportTitle : null,
            });
          }}
        >
          {sendMessage ? (
            <FormattedMessage
              id="component.close-petition-dialog.button-send-finish"
              defaultMessage="Send & finish"
            />
          ) : (
            <FormattedMessage
              id="component.close-petition-dialog.button-finish"
              defaultMessage="Finish"
            />
          )}
        </Button>
      }
      {...props}
    />
  );
}

export function useClosePetitionDialog() {
  return useDialog(ClosePetitionDialog);
}

useClosePetitionDialog.fragments = {
  Petition: gql`
    fragment useClosePetitionDialog_Petition on Petition {
      id
      closingEmailBody
    }
  `,
};

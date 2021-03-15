import {
  Box,
  Button,
  Center,
  Checkbox,
  Collapse,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { PaperPlaneIcon, ThumbUpIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { PetitionLocale } from "@parallel/graphql/__types";
import { isEmptyRTEValue } from "@parallel/utils/slate/isEmptyRTEValue";
import { plainTextToRTEValue } from "@parallel/utils/slate/plainTextToRTEValue";
import { Maybe } from "@parallel/utils/types";
import outdent from "outdent";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { HelpPopover } from "../common/HelpPopover";
import {
  RichTextEditor,
  RichTextEditorInstance,
  RichTextEditorValue,
} from "../common/RichTextEditor";

const messages: Record<PetitionLocale, string> = {
  en: outdent`
    Dear Sir/Madam,

    We have reviewed all the information that we requested, and we can confirm that everything is correct.

    Let us know if you have any questions or comments.
    
    Best regards.
  `,
  es: outdent`
    Apreciado Sr/Sra,

    Le comunicamos que hemos revisado toda la información que le requerimos y le confirmamos que está todo correcto.
    
    Quedamos a su entera disposición para aclarar o comentar cualquier aspecto que considere oportuno.
    
    Reciba un cordial saludo.
  `,
};

interface ClosePetitionDialogInput {
  locale: PetitionLocale;
  petitionName: Maybe<string>;
  hasPetitionPdfExport: boolean;
  requiredMessage: boolean;
}

interface ClosePetitionDialogNotification {
  message: Maybe<RichTextEditorValue>;
  pdfExportTitle: Maybe<string>;
}

export function ClosePetitionDialog({
  locale,
  petitionName,
  hasPetitionPdfExport,
  requiredMessage,
  ...props
}: DialogProps<ClosePetitionDialogInput, ClosePetitionDialogNotification>) {
  const intl = useIntl();

  const [message, setMessage] = useState<RichTextEditorValue>(
    plainTextToRTEValue(messages[intl.locale as PetitionLocale])
  );
  const [sendMessage, setSendMessage] = useState(requiredMessage);
  const messageRef = useRef<RichTextEditorInstance>(null);

  const [attachPdfExport, setAttachPdfExport] = useState(false);
  const pdfExportTitleRef = useRef<HTMLInputElement>(null);
  const [pdfExportTitle, setPdfExportTitle] = useState(petitionName ?? "");

  const isInvalid =
    (sendMessage && isEmptyRTEValue(message)) ||
    (attachPdfExport && !pdfExportTitle);

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
              defaultMessage="If everything is correct, we will close this petition but you can review the information again at any time. If you want, you can notify the recipient for peace of mind."
            />
          </Text>
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
                id="component.close-petition-dialog.notify-recipient.checkbox"
                defaultMessage="Notify the recipient before closing"
              />
            </Checkbox>
            <Box>
              <Collapse in={requiredMessage || sendMessage}>
                <Box padding={1}>
                  <RichTextEditor
                    isInvalid={sendMessage && isEmptyRTEValue(message)}
                    ref={messageRef}
                    value={message}
                    onChange={setMessage}
                    placeholder={intl.formatMessage({
                      id:
                        "component.close-petition-dialog.notify-recipient.message-placeholder",
                      defaultMessage: "Add a message to include in the email",
                    })}
                  />
                  {hasPetitionPdfExport ? (
                    <Box marginTop={2}>
                      <Checkbox
                        colorScheme="purple"
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
                      <Collapse in={attachPdfExport}>
                        <Box paddingTop={1}>
                          <FormControl>
                            <FormLabel display="flex" alignItems="center">
                              <FormattedMessage
                                id="component.close-petition-dialog.attach-pdf-export.title"
                                defaultMessage="PDF export title"
                              />
                              <HelpPopover marginLeft={2} placement="auto">
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
                              onChange={(e) =>
                                setPdfExportTitle(e.target.value)
                              }
                            />
                          </FormControl>
                        </Box>
                      </Collapse>
                    </Box>
                  ) : null}
                </Box>
              </Collapse>
            </Box>
          </Stack>
        </Stack>
      }
      confirm={
        <Button
          disabled={isInvalid}
          leftIcon={sendMessage ? <PaperPlaneIcon /> : undefined}
          colorScheme="purple"
          onClick={() =>
            props.onResolve({
              message: sendMessage ? message : null,
              pdfExportTitle: attachPdfExport ? pdfExportTitle : null,
            })
          }
        >
          {sendMessage ? (
            <FormattedMessage id="generic.send" defaultMessage="Send" />
          ) : (
            <FormattedMessage
              id="component.close-petition-dialog.heading"
              defaultMessage="Finish petition"
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

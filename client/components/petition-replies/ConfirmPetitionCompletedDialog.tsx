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
} from "@chakra-ui/core";
import { PaperPlaneIcon, ThumbUpIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { PetitionLocale } from "@parallel/graphql/__types";
import { isEmptyContent } from "@parallel/utils/slate/isEmptyContent";
import { Maybe } from "@parallel/utils/types";
import outdent from "outdent";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { HelpPopover } from "../common/HelpPopover";
import {
  RichTextEditor,
  RichTextEditorContent,
} from "../common/RichTextEditor";

const messages: Record<PetitionLocale, string> = {
  en: outdent`
    Hi,

    We have reviewed all the information and we can confirm that everything is correct.

    We will get to work and if we have any questions or need any more information we will let you know.
    
    Best regards,
  `,
  es: outdent`
    Hola,
    
    Ya hemos revisado toda la información y podemos confirmar que está todo correcto.
    
    Vamos a ponernos a trabajar y si tenemos cualquier duda o necesitamos cualquier información más te lo haremos saber.
    
    Saludos,
  `,
};

export function ConfirmPetitionCompletedDialog({
  locale,
  petitionName,
  ...props
}: DialogProps<
  { locale: PetitionLocale; petitionName: Maybe<string> },
  {
    body: RichTextEditorContent;
    attachPdfExport: boolean;
    pdfExportTitle: Maybe<string>;
  }
>) {
  const intl = useIntl();
  const message = Object.keys(messages).includes(locale)
    ? messages[locale]
    : messages["en"];
  const [body, setBody] = useState<RichTextEditorContent>(
    message.split("\n").map((text) => ({ children: [{ text }] }))
  );

  const isInvalidBody = isEmptyContent(body);

  const [attachPdfExport, setAttachPdfExport] = useState(false);
  const pdfExportTitleRef = useRef<HTMLInputElement>(null);
  const [pdfExportTitle, setPdfExportTitle] = useState(petitionName ?? "");

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
              id="petition-replies.confirm-reviewed.dialog-heading"
              defaultMessage="Confirm that you have all the information"
            />
          </Text>
        </Stack>
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="petition-replies.confirm-reviewed.dialog-subheading"
              defaultMessage="If everything is correct, notify the recipient for peace of mind."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="petition-replies.confirm-reviewed.dialog-disclaimer"
              defaultMessage="We will only notify recipients with active access."
            />
          </Text>
          <RichTextEditor
            isInvalid={isInvalidBody}
            value={body}
            onChange={setBody}
            placeholder={intl.formatMessage({
              id: "component.message-email-editor.body-placeholder",
              defaultMessage: "Write a message to include in the email",
            })}
          />
          <Box>
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
                id="petition-replies.confirm-reviewed.attach-pdf-export"
                defaultMessage="Attach a PDF export with the submitted replies"
              />
            </Checkbox>
            <Collapse isOpen={attachPdfExport}>
              <Box paddingTop={1}>
                <FormControl>
                  <FormLabel display="flex" alignItems="center">
                    <FormattedMessage
                      id="petition-replies.confirm-reviewed.pdf-export-title"
                      defaultMessage="PDF export title"
                    />
                    <HelpPopover marginLeft={2} placement="auto">
                      <FormattedMessage
                        id="petition-replies.confirm-reviewed.pdf-export-title.help"
                        defaultMessage="This will be the name of the attached PDF file."
                      />
                    </HelpPopover>
                  </FormLabel>
                  <Input
                    ref={pdfExportTitleRef}
                    value={pdfExportTitle}
                    onChange={(e) => setPdfExportTitle(e.target.value)}
                  />
                </FormControl>
              </Box>
            </Collapse>
          </Box>
        </Stack>
      }
      confirm={
        <Button
          leftIcon={<PaperPlaneIcon />}
          colorScheme="purple"
          onClick={() =>
            props.onResolve({
              body,
              attachPdfExport,
              pdfExportTitle: attachPdfExport ? pdfExportTitle : null,
            })
          }
          disabled={isInvalidBody}
        >
          <FormattedMessage id="generic.send" defaultMessage="Send" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmPetitionCompletedDialog() {
  return useDialog(ConfirmPetitionCompletedDialog);
}

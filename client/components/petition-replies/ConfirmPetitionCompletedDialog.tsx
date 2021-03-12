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
import { RichTextEditor, RichTextEditorValue } from "../common/RichTextEditor";

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

export function ConfirmPetitionCompletedDialog({
  locale,
  petitionName,
  hasPetitionPdfExport,
  ...props
}: DialogProps<
  {
    locale: PetitionLocale;
    petitionName: Maybe<string>;
    hasPetitionPdfExport: boolean;
  },
  {
    body: RichTextEditorValue;
    attachPdfExport: boolean;
    pdfExportTitle: Maybe<string>;
  }
>) {
  const intl = useIntl();
  const [body, setBody] = useState<RichTextEditorValue>(
    plainTextToRTEValue(messages[locale] ?? messages["en"])
  );

  const isInvalidBody = isEmptyRTEValue(body);

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
          {hasPetitionPdfExport ? (
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
              <Collapse in={attachPdfExport}>
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
          ) : null}
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

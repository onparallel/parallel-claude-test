import { Box, Button, Flex, ModalCloseButton, Text } from "@chakra-ui/core";
import { ThumbUpIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { useState } from "react";
import { useIntl } from "react-intl";
import {
  RichTextEditor,
  RichTextEditorContent,
} from "../common/RichTextEditor";

export function ConfirmPetitionCompletedDialog({
  ...props
}: DialogProps<{}, RichTextEditorContent>) {
  const intl = useIntl();
  const [body, setBody] = useState<RichTextEditorContent>([
    { children: [{ text: "Hola," }] },
    { children: [{ text: "" }] },
    {
      children: [
        {
          text: "Ya hemos revisado toda la información. ",
        },
        {
          text: "Te confirmamos que está todo correcto.",
        },
      ],
    },
    { children: [{ text: "" }] },
    {
      children: [
        {
          text:
            " Vamos a ponernos a trabajar y si tenemos cualquier duda o necesitamos cualquier información más te lo haremos saber.",
        },
      ],
    },
    { children: [{ text: "" }] },
    { children: [{ text: "Un saludo." }] },
  ]);

  return (
    <ConfirmDialog
      size="xl"
      header={
        <>
          <ModalCloseButton />
          <Flex alignItems="center">
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              backgroundColor="blue.500"
              borderRadius="100%"
              margin={1}
              padding={2}
            >
              <ThumbUpIcon color="white" />
            </Box>
            Confirmar que ya tienes toda la información
          </Flex>
          <Text fontWeight="normal" fontSize="md" marginTop={1}>
            Si está todo correcto, notifica al destinatario para que esté
            tranquilo.
          </Text>
        </>
      }
      body={
        <RichTextEditor
          value={body}
          onChange={setBody}
          placeholder={intl.formatMessage({
            id: "component.message-email-editor.body-placeholder",
            defaultMessage: "Write a message to include in the email",
          })}
        />
      }
      cancel={
        <Button onClick={() => props.onReject({ reason: "CLOSE" })}>
          Confirmar más tarde
        </Button>
      }
      confirm={
        <Button colorScheme="purple" onClick={() => props.onResolve(body)}>
          Enviar
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmPetitionCompletedDialog() {
  return useDialog(ConfirmPetitionCompletedDialog);
}

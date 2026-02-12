import { FormControl, FormErrorMessage, FormLabel } from "@chakra-ui/react";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { Box, Button, HStack, Stack, Text } from "@parallel/components/ui";
import * as Sentry from "@sentry/nextjs";
import { useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { loadPdfJs, PdfJs } from "./pdfjs";
import { useRegisterWithRef } from "./react-form-hook/useRegisterWithRef";
import { turnOffPasswordManagers } from "./turnOffPasswordManagers";

export function useCheckIfFileIsPasswordProtected() {
  const showEnterFilePasswordDialog = useDialog(EnterFilePasswordDialog);
  const showConfirmUploadAnywaysDialog = useDialog(ConfirmUploadAnywaysDialog);
  return useCallback(async (file: File) => {
    if (file.type === "application/pdf") {
      let pdfJs: PdfJs;
      try {
        pdfJs = await loadPdfJs();
      } catch (error) {
        // fail gracefully
        Sentry.captureException(error);
        return { message: "NO_PASSWORD" as const };
      }
      let hasPassword: boolean;
      try {
        hasPassword = !(await checkPassword(pdfJs, file, undefined));
      } catch (error) {
        // this is usually due to malformed pdf files. we give the ability to upload anyways
        try {
          await showConfirmUploadAnywaysDialog();
          // capture exception for further inspection. maybe pdf is ok but pdfjs is not.
          Sentry.captureException(error);
          return { message: "NO_PASSWORD" as const };
        } catch {
          return { message: "CANCEL" as const };
        }
      }
      if (hasPassword) {
        try {
          const { password } = await showEnterFilePasswordDialog({ pdfJs, file });
          return { password, message: "PASSWORD_ENTERED" as const };
        } catch {
          return { message: "CANCEL" as const };
        }
      } else {
        return { message: "NO_PASSWORD" as const };
      }
    } else {
      return { message: "NO_PASSWORD" as const };
    }
  }, []);
}

async function checkPassword(pdfjs: PdfJs, file: File, password: string | undefined) {
  return new Promise<boolean>(async (resolve, reject) => {
    const task = pdfjs.getDocument({ data: await file.arrayBuffer(), password });
    task.onPassword = () => {
      resolve(false);
    };
    task.promise.then(() => resolve(true), reject);
  });
}

function EnterFilePasswordDialog({
  pdfJs,
  file,
  ...props
}: DialogProps<{ pdfJs: PdfJs; file: File }, { password: string }>) {
  const { handleSubmit, register, formState } = useForm({
    mode: "onSubmit",
    defaultValues: {
      password: "",
    },
  });
  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordProps = useRegisterWithRef(passwordRef, register, "password", {
    async validate(password) {
      return (await checkPassword(pdfJs, file, password)) || "INVALID";
    },
  });

  return (
    <ConfirmDialog
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(props.onResolve),
        },
      }}
      initialFocusRef={passwordRef}
      header={
        <FormattedMessage
          id="component.enter-file-password-dialog.header"
          defaultMessage="File is password protected"
        />
      }
      body={
        <FormControl isInvalid={!!formState.errors.password}>
          <FormLabel fontWeight={400}>
            <FormattedMessage
              id="component.enter-file-password-dialog.password-label"
              defaultMessage="Please, enter password for file {name}"
              values={{
                name: (
                  <Text as="em" fontWeight={500}>
                    {file.name}
                  </Text>
                ),
              }}
            />
          </FormLabel>
          <PasswordInput {...passwordProps} {...turnOffPasswordManagers} />
          <FormErrorMessage>
            <FormattedMessage
              id="generic.incorrect-password"
              defaultMessage="The password is incorrect"
            />
          </FormErrorMessage>
        </FormControl>
      }
      confirm={
        <Button type="submit" colorPalette="primary">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

function ConfirmUploadAnywaysDialog(props: DialogProps) {
  return (
    <ConfirmDialog
      header={
        <HStack>
          <AlertCircleIcon role="presentation" />
          <Box>
            <FormattedMessage
              id="component.enter-file-password-dialog.error-header"
              defaultMessage="Something is wrong"
            />
          </Box>
        </HStack>
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.enter-file-password-dialog.error-description"
              defaultMessage="We couldn't verify that the file is readable. Please check if it's correct. If you're confident, you can still proceed with the upload."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button onClick={() => props.onResolve()} colorPalette="primary">
          <FormattedMessage
            id="component.enter-file-password-dialog.error-confirm"
            defaultMessage="Proceed with upload"
          />
        </Button>
      }
      {...props}
    />
  );
}

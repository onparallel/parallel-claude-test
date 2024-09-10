import { Button, FormControl, FormErrorMessage, FormLabel, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { loadPdfJs, PdfJs } from "./pdfjs";
import { withError } from "./promises/withError";
import { useRegisterWithRef } from "./react-form-hook/useRegisterWithRef";
import { turnOffPasswordManagers } from "./turnOffPasswordManagers";

export function useCheckIfFileIsPasswordProtected() {
  const showEnterFilePasswordDialog = useDialog(EnterFilePasswordDialog);
  return useCallback(async (file: File) => {
    if (file.type === "application/pdf") {
      const [error, pdfJs] = await withError(loadPdfJs());
      if (error) {
        // fail gracefully
        return { message: "NO_PASSWORD" as const };
      }
      if (await checkPassword(pdfJs, file, undefined)) {
        return { message: "NO_PASSWORD" as const };
      } else {
        try {
          const { password } = await showEnterFilePasswordDialog({ pdfJs, file });
          return { password, message: "PASSWORD_ENTERED" as const };
        } catch {
          return { message: "PASSWORD_NOT_ENTERED" as const };
        }
      }
    } else {
      return { message: "NO_PASSWORD" as const };
    }
  }, []);
}

async function checkPassword(pdfjs: PdfJs, file: File, password: string | undefined) {
  return new Promise<boolean>(async (resolve) => {
    const task = pdfjs.getDocument({ data: await file.arrayBuffer(), password });
    task.onPassword = () => {
      resolve(false);
    };
    task.promise.then(() => resolve(true));
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
        <Button type="submit" colorScheme="primary">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

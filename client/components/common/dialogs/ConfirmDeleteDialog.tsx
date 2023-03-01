import { Button, FormControl, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
import {
  ConfirmDialog,
  ConfirmDialogProps,
} from "@parallel/components/common/dialogs/ConfirmDialog";
import { useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { ReactNode, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

export interface ConfirmDeleteDialogProps
  extends Omit<ConfirmDialogProps<void>, "body" | "confirm"> {
  description: ReactNode;
  confirmation?: string;
  confirm?: ReactNode;
}

function ConfirmDeleteDialog({
  description,
  confirmation: _confirmation,
  confirm,
  ...props
}: ConfirmDeleteDialogProps) {
  const intl = useIntl();
  const confirmation =
    _confirmation ??
    intl
      .formatMessage({
        id: "generic.delete",
        defaultMessage: "Delete",
      })
      .toLocaleLowerCase(intl.locale);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { confirmation: "" },
    mode: "onSubmit",
  });
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <ConfirmDialog
      initialFocusRef={inputRef}
      content={{ ...props.content, as: "form", onSubmit: handleSubmit(() => props.onResolve()) }}
      body={
        <Stack spacing={2}>
          {description}
          <FormControl isInvalid={!!errors.confirmation}>
            <FormLabel fontWeight="normal" _invalid={{ color: "red.500" }}>
              <FormattedMessage
                id="generic.type-to-confirm"
                defaultMessage="Please type {confirmation} to confirm"
                values={{
                  confirmation: <Text as="strong">{confirmation}</Text>,
                }}
              />
            </FormLabel>
            <Input
              {...register("confirmation", { validate: (value) => value === confirmation })}
              placeholder={confirmation}
            />
          </FormControl>
        </Stack>
      }
      confirm={
        confirm ?? (
          <Button colorScheme="red" type="submit">
            <FormattedMessage id="generic.confirm-delete-button" defaultMessage="Yes, delete" />
          </Button>
        )
      }
      {...props}
    />
  );
}

export function useConfirmDeleteDialog() {
  return useDialog(ConfirmDeleteDialog);
}

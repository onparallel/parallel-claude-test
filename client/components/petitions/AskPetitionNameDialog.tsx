import { Button, FormControl, Input, Text } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogCallbacks,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { useMergeRefs } from "../../utils/useMergeRefs";

export type CreatePetitionFormData = {
  name: string;
};

export function AskPetitionNameDialog({
  defaultName,
  ...props
}: { defaultName?: string } & DialogCallbacks<string>) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    errors,
    formState: { isValid },
  } = useForm<CreatePetitionFormData>({
    mode: "onChange",
    defaultValues: { name: defaultName ?? "" },
  });
  const focusRef = useRef<HTMLInputElement>(null);
  const inputRef = useMergeRefs(focusRef, register({ required: true }));
  function onContinue({ name }: CreatePetitionFormData) {
    props.onResolve(name);
  }
  return (
    <ConfirmDialog
      content={{
        as: "form",
        onSubmit: handleSubmit(onContinue),
      }}
      focusRef={focusRef}
      header={
        <Text as="label" {...{ htmlFor: "petition-name" }}>
          <FormattedMessage
            id="petitions.create-new-petition.header"
            defaultMessage="Give a name to your new petition"
          />
        </Text>
      }
      body={
        <FormControl isInvalid={!!errors.name}>
          <Input
            id="petition-name"
            name="name"
            ref={inputRef}
            placeholder={intl.formatMessage({
              id: "generic.untitled-petition",
              defaultMessage: "Untitled petition",
            })}
          />
        </FormControl>
      }
      confirm={
        <Button type="submit" variantColor="purple" isDisabled={!isValid}>
          <FormattedMessage
            id="petitions.create-new-petition.continue-button"
            defaultMessage="Let's continue"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useAskPetitionNameDialog() {
  return useDialog(AskPetitionNameDialog);
}

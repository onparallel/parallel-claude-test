import { Button, FormControl, FormErrorMessage, FormLabel, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { LocalizableUserTextInput } from "@parallel/components/common/LocalizableUserTextInput";
import { LocalizableUserText } from "@parallel/components/common/LocalizableUserTextRender";
import { PetitionSelect } from "@parallel/components/common/PetitionSelect";
import { UserLocale } from "@parallel/graphql/__types";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface CreateOrUpdateProfileTypeKeyProcessDialogProps {
  processName?: LocalizableUserText;
  templateIds?: string[];
}

interface CreateOrUpdateProfileTypeKeyProcessDialogResult {
  processName: LocalizableUserText;
  templateIds: string[];
}

function CreateOrUpdateProfileTypeKeyProcessDialog({
  processName,
  templateIds,
  ...props
}: DialogProps<
  CreateOrUpdateProfileTypeKeyProcessDialogProps,
  CreateOrUpdateProfileTypeKeyProcessDialogResult
>) {
  const intl = useIntl();
  const [selectedLocale, setSelectedLocale] = useState(intl.locale as UserLocale);
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<CreateOrUpdateProfileTypeKeyProcessDialogResult>({
    defaultValues: {
      processName: processName ?? { [intl.locale]: "" },
      templateIds: templateIds ?? [],
    },
  });
  const focusRef = useRef<HTMLInputElement>(null);

  return (
    <ConfirmDialog
      {...props}
      closeOnEsc
      initialFocusRef={focusRef}
      size="xl"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(({ processName, templateIds }) => {
            props.onResolve({ processName, templateIds });
          }),
        },
      }}
      header={
        <FormattedMessage
          id="component.create-or-update-profile-type-key-process-dialog.header"
          defaultMessage="Key processs"
        />
      }
      body={
        <Stack>
          <FormControl isInvalid={!!errors.processName}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-or-update-profile-type-key-process-dialog.process-name"
                defaultMessage="Process name"
              />
            </FormLabel>
            <Controller
              name="processName"
              control={control}
              rules={{
                required: true,
                validate: {
                  isNotEmpty: (name) =>
                    Object.values(name).some((value) => value!.trim().length > 0),
                },
              }}
              render={({ field: { value, onChange } }) => (
                <LocalizableUserTextInput
                  value={value}
                  onChange={onChange}
                  inputRef={focusRef}
                  locale={selectedLocale}
                  onChangeLocale={(locale) => setSelectedLocale(locale)}
                  placeholder={intl.formatMessage(
                    {
                      id: "generic.for-example",
                      defaultMessage: "E.g. {example}",
                    },
                    {
                      example: "KYC",
                    },
                  )}
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.templateIds}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-or-update-profile-type-key-process-dialog.templates-label"
                defaultMessage="Templates"
              />
            </FormLabel>
            <Controller
              name="templateIds"
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <PetitionSelect
                  defaultOptions
                  isMulti
                  type="TEMPLATE"
                  value={value}
                  onChange={(v) => {
                    const templateIds = v?.map((p) => p.id) ?? [];
                    onChange(templateIds);
                  }}
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="component.create-or-update-profile-type-key-process-dialog.templates-error-message"
                defaultMessage="Select at least one template"
              />
            </FormErrorMessage>
          </FormControl>
          <Text>
            <FormattedMessage
              id="component.create-or-update-profile-type-key-process-dialog.body-text"
              defaultMessage="The last parallel created from the selected templates will be highlighted in the profile view."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      }
    />
  );
}

export function useCreateOrUpdateProfileTypeKeyProcessDialog() {
  return useDialog(CreateOrUpdateProfileTypeKeyProcessDialog);
}

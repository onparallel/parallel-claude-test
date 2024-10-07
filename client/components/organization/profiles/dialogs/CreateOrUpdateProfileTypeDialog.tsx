import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  GridItem,
  SimpleGrid,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { LocalizableUserTextInput } from "@parallel/components/common/LocalizableUserTextInput";
import { LocalizableUserText } from "@parallel/components/common/LocalizableUserTextRender";
import { UserLocale } from "@parallel/graphql/__types";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";

interface CreateOrUpdateProfileTypeDialogProps {
  name?: LocalizableUserText;
  pluralName?: LocalizableUserText;
  isEditing?: boolean;
}

interface CreateOrUpdateProfileTypeDialogResult {
  name: LocalizableUserText;
  pluralName: LocalizableUserText;
}

function CreateOrUpdateProfileTypeDialog({
  name,
  pluralName,
  isEditing,
  ...props
}: DialogProps<CreateOrUpdateProfileTypeDialogProps, CreateOrUpdateProfileTypeDialogResult>) {
  const intl = useIntl();
  const [selectedLocale, setSelectedLocale] = useState(intl.locale as UserLocale);
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<CreateOrUpdateProfileTypeDialogResult>({
    defaultValues: {
      name: name ?? { [intl.locale]: "" },
      pluralName: pluralName ?? { [intl.locale]: "" },
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
          onSubmit: handleSubmit(({ name, pluralName }) => {
            props.onResolve({ name, pluralName });
          }),
        },
      }}
      header={
        isNonNullish(name) && isEditing ? (
          <FormattedMessage
            id="component.create-profile-type-dialog.edit-profile-type-name"
            defaultMessage="Edit profile type name"
          />
        ) : (
          <FormattedMessage
            id="component.create-profile-type-dialog.new-profile-type"
            defaultMessage="New profile type"
          />
        )
      }
      body={
        <SimpleGrid gap={4} columns={{ base: 1, sm: 2 }}>
          <FormControl as={GridItem} isInvalid={!!errors.name}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-profile-type-dialog.singular-name"
                defaultMessage="Singular name"
              />
            </FormLabel>
            <Controller
              name="name"
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
                />
              )}
            />

            <FormErrorMessage>
              <FormattedMessage
                id="generic.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
            <FormHelperText>
              <FormattedMessage
                id="generic.for-example"
                defaultMessage="E.g. {example}"
                values={{
                  example: (
                    <FormattedMessage
                      id="component.create-profile-type-dialog.singular-name-helper"
                      defaultMessage="Individual"
                    />
                  ),
                }}
              />
            </FormHelperText>
          </FormControl>
          <FormControl as={GridItem} isInvalid={!!errors.pluralName}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-profile-type-dialog.plural-name"
                defaultMessage="Plural name"
              />
            </FormLabel>
            <Controller
              name="pluralName"
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
                  locale={selectedLocale}
                  onChangeLocale={(locale) => setSelectedLocale(locale)}
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
            <FormHelperText>
              <FormattedMessage
                id="generic.for-example"
                defaultMessage="E.g. {example}"
                values={{
                  example: (
                    <FormattedMessage
                      id="component.create-profile-type-dialog.plural-name-helper"
                      defaultMessage="Individuals"
                    />
                  ),
                }}
              />
            </FormHelperText>
          </FormControl>
        </SimpleGrid>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
    />
  );
}

export function useCreateOrUpdateProfileTypeDialog() {
  return useDialog(CreateOrUpdateProfileTypeDialog);
}

import { gql } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FieldDateIcon } from "@parallel/chakra/icons";
import { DateInput } from "@parallel/components/common/DateInput";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { SimpleFileButton } from "@parallel/components/common/SimpleFileButton";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  ArchiveFieldGroupReplyIntoProfileExpirationInput,
  useConfigureExpirationsDateDialog_PetitionFieldFragment,
  useConfigureExpirationsDateDialog_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { useDownloadReplyFile } from "@parallel/utils/useDownloadReplyFile";
import { useMetadata } from "@parallel/utils/withMetadata";
import { isPast, sub } from "date-fns";
import { useEffect, useState } from "react";

import { FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";

interface ConfigureExpirationsDateDialogProps {
  petitionId: string;
  profileName: React.ReactNode;
  profileTypeFieldsWithReplies: [
    useConfigureExpirationsDateDialog_PetitionFieldFragment,
    useConfigureExpirationsDateDialog_PetitionFieldReplyFragment[],
  ][];
}

interface ConfigureExpirationsDateDialogData {
  expirations: {
    profileTypeFieldId: string;
    expiryDate: string | null;
  }[];
}

function ConfigureExpirationsDateDialog({
  petitionId,
  profileName,
  profileTypeFieldsWithReplies,
  ...props
}: DialogProps<
  ConfigureExpirationsDateDialogProps,
  ArchiveFieldGroupReplyIntoProfileExpirationInput[]
>) {
  const form = useForm<ConfigureExpirationsDateDialogData>({
    mode: "onChange",
    defaultValues: {
      expirations: profileTypeFieldsWithReplies.map(([field]) => ({
        profileTypeFieldId: field.profileTypeField!.id,
        expiryDate: null,
      })),
    },
  });

  const { control, handleSubmit, setFocus } = form;

  const { fields } = useFieldArray({
    name: "expirations",
    control,
  });

  useEffect(() => {
    setTimeout(() => setFocus(`expirations.0.expiryDate`), 0);
  }, [fields.length]);

  return (
    <ConfirmDialog
      size="lg"
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      content={{
        as: "form",
        onSubmit: handleSubmit(async (data) => {
          props.onResolve(data.expirations);
        }),
      }}
      {...props}
      header={
        <FormattedMessage
          id="component.configure-expirations-date-dialog.header"
          defaultMessage="Configure expirations date"
        />
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="component.configure-expirations-date-dialog.body"
              defaultMessage="Adds the expiration date of the following <b>{profileName}</b> properties:"
              values={{
                profileName,
              }}
            />
          </Text>
          <Stack spacing={4}>
            <FormProvider {...form}>
              {fields.map((field, index) => {
                const [currentField, replies] = profileTypeFieldsWithReplies.find(
                  ([f]) => f.profileTypeField!.id === field.profileTypeFieldId,
                )!;
                return (
                  <ExpirationDateRow
                    key={field.id}
                    index={index}
                    petitionId={petitionId}
                    field={currentField}
                    replies={replies}
                  />
                );
              })}
            </FormProvider>
          </Stack>
        </Stack>
      }
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
    />
  );
}

function ExpirationDateRow({
  index,
  petitionId,
  field,
  replies,
}: {
  index: number;
  petitionId: string;
  field: useConfigureExpirationsDateDialog_PetitionFieldFragment;
  replies: useConfigureExpirationsDateDialog_PetitionFieldReplyFragment[];
}) {
  const intl = useIntl();

  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<ConfigureExpirationsDateDialogData>();

  const { browserName } = useMetadata();
  const downloadReplyFile = useDownloadReplyFile();

  const { name, expiryAlertAheadTime } = field.profileTypeField!;

  const expiryDate = watch(`expirations.${index}.expiryDate` as const);

  const notificationDate =
    expiryDate && expiryAlertAheadTime ? sub(new Date(expiryDate), expiryAlertAheadTime) : null;

  const checkIfIsPast = (value: string | null) => isNonNullish(value) && isPast(new Date(value));
  const [isPastDate, setIsPastDate] = useState(checkIfIsPast(expiryDate));
  const handleOnBlur = () => setIsPastDate(checkIfIsPast(expiryDate));
  return (
    <FormControl key={field.id} as={Stack} isInvalid={!!errors.expirations?.[index]?.expiryDate}>
      <FormLabel fontWeight={400}>
        <FormattedMessage
          id="component.update-profile-field-expiration-dialog.date-label"
          defaultMessage="Expiration date of {fieldName}"
          values={{
            fieldName: (
              <LocalizableUserTextRender
                value={name}
                default={
                  <Text as="em">
                    {intl.formatMessage({
                      id: "generic.unnamed-profile-type-field",
                      defaultMessage: "Unnamed property",
                    })}
                  </Text>
                }
              />
            ),
          }}
        />
      </FormLabel>
      <Flex flex="1" position="relative">
        <DateInput {...register(`expirations.${index}.expiryDate`)} onBlur={handleOnBlur} />
        {browserName !== "Firefox" ? (
          <Center boxSize={10} position="absolute" insetEnd={0} bottom={0} pointerEvents="none">
            <FieldDateIcon fontSize="18px" />
          </Center>
        ) : null}
      </Flex>

      {isFileTypeField(field.type) ? (
        <Flex gap={2} flexWrap="wrap">
          {replies.map((reply) => {
            const file = reply.content;
            return (
              <Box key={reply.id}>
                <SimpleFileButton
                  isDisabled={!file.uploadComplete}
                  onClick={async () => {
                    await downloadReplyFile(petitionId, reply, true);
                  }}
                  filename={file.filename}
                  contentType={file.contentType}
                />
              </Box>
            );
          })}
        </Flex>
      ) : null}

      <Text>
        {notificationDate ? (
          <FormattedMessage
            id="component.update-profile-field-expiration-dialog.alert-date"
            defaultMessage="We will notify starting from {date}"
            values={{
              date: intl.formatDate(notificationDate, FORMATS.L),
            }}
          />
        ) : isNonNullish(expiryAlertAheadTime?.days) ? (
          <FormattedMessage
            id="component.update-profile-field-expiration-dialog.alert-duration-days"
            defaultMessage="We will let you know {count, select, 1 {one day} 7 {seven days} 15 {fifteen days} other {# days}} {isAfter, select, true {after} other {before}}."
            values={{
              count: Math.abs(expiryAlertAheadTime?.days || 1),
              isAfter: (expiryAlertAheadTime?.days || 1) < 0,
            }}
          />
        ) : isNonNullish(expiryAlertAheadTime?.months) ? (
          <FormattedMessage
            id="component.update-profile-field-expiration-dialog.alert-duration-months"
            defaultMessage="We will let you know {count, select, 1 {one month} 2 {two months} 3 {three months} other {# months}} {isAfter, select, true {after} other {before}}."
            values={{
              count: Math.abs(expiryAlertAheadTime?.months || 1),
              isAfter: (expiryAlertAheadTime?.months || 1) < 0,
            }}
          />
        ) : (
          <FormattedMessage
            id="component.update-profile-field-expiration-dialog.no-alert-duration"
            defaultMessage="This property does not have any established alerts."
          />
        )}
      </Text>
      {isPastDate ? (
        <Alert status="warning" rounded="md">
          <AlertIcon />
          <AlertDescription flex="1">
            <FormattedMessage
              id="component.update-profile-field-expiration-dialog.date-expired-alert"
              defaultMessage="The set date has already passed."
            />
          </AlertDescription>
        </Alert>
      ) : null}
    </FormControl>
  );
}

export function useConfigureExpirationsDateDialog() {
  return useDialog(ConfigureExpirationsDateDialog);
}

useConfigureExpirationsDateDialog.fragments = {
  PetitionField: gql`
    fragment useConfigureExpirationsDateDialog_PetitionField on PetitionField {
      id
      type
      profileTypeField {
        id
        name
        expiryAlertAheadTime
      }
    }
  `,
  PetitionFieldReply: gql`
    fragment useConfigureExpirationsDateDialog_PetitionFieldReply on PetitionFieldReply {
      id
      content
    }
  `,
};

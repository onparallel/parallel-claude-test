import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FieldDateIcon } from "@parallel/chakra/icons";
import { DateInput } from "@parallel/components/common/DateInput";
import {
  LocalizableUserText,
  LocalizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { FORMATS } from "@parallel/utils/dates";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useBrowserMetadata } from "@parallel/utils/useBrowserMetadata";
import { Duration, isPast, sub } from "date-fns";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";

interface UpdateProfileFieldExpirationDialogResult {
  expiryDate: string | null;
}

interface UpdateProfileFieldExpirationDialogProps {
  expiryDate?: string | null;
  expiryAlertAheadTime?: Duration | null;
  fieldName: LocalizableUserText;
}

function UpdateProfileFieldExpirationDialog({
  expiryDate,
  expiryAlertAheadTime,
  fieldName,
  ...props
}: DialogProps<UpdateProfileFieldExpirationDialogProps, UpdateProfileFieldExpirationDialogResult>) {
  const intl = useIntl();
  const { register, watch, handleSubmit } = useForm<UpdateProfileFieldExpirationDialogResult>({
    defaultValues: {
      expiryDate,
    },
  });
  const { browserName } = useBrowserMetadata();

  const expirationDate = watch("expiryDate");

  const checkIfIsPast = (value: string | null) => isNonNullish(value) && isPast(new Date(value));
  const [isPastDate, setIsPastDate] = useState(checkIfIsPast(expirationDate));
  const handleOnBlur = () => setIsPastDate(checkIfIsPast(expirationDate));

  const notificationDate =
    expirationDate && expiryAlertAheadTime
      ? sub(new Date(expirationDate), expiryAlertAheadTime)
      : null;

  const dateRef = useRef<HTMLInputElement>(null);
  const dateRegisterProps = useRegisterWithRef(dateRef, register, "expiryDate");

  return (
    <ConfirmDialog
      {...props}
      initialFocusRef={dateRef}
      closeOnEsc
      closeOnOverlayClick={false}
      size="md"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit((data) => {
            props.onResolve(data);
          }),
        },
      }}
      header={
        <HStack>
          <FieldDateIcon />
          <Text>
            <FormattedMessage
              id="component.update-profile-field-expiration-dialog.title"
              defaultMessage="Configure expiration date"
            />
          </Text>
        </HStack>
      }
      body={
        <Stack>
          <FormControl>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.update-profile-field-expiration-dialog.date-label"
                defaultMessage="Expiration date of {fieldName}"
                values={{
                  fieldName: (
                    <LocalizableUserTextRender
                      value={fieldName}
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
              <DateInput {...dateRegisterProps} onBlur={handleOnBlur} />
              {browserName !== "Firefox" ? (
                <Center
                  boxSize={10}
                  position="absolute"
                  insetEnd={0}
                  bottom={0}
                  pointerEvents="none"
                >
                  <FieldDateIcon fontSize="18px" />
                </Center>
              ) : null}
            </Flex>
          </FormControl>
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
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
    />
  );
}

export function useUpdateProfileFieldExpirationDialog() {
  return useDialog(UpdateProfileFieldExpirationDialog);
}

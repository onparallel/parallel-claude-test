import { ApolloError } from "@apollo/client";
import {
  Button,
  Collapse,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Link,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PetitionEventType } from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { Maybe, MaybePromise } from "@parallel/utils/types";
import { useMemo, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import Select, { OptionTypeBase } from "react-select";

interface CreateEventSubscriptionDialogProps {
  onCreate: (props: {
    eventsUrl: string;
    eventTypes: PetitionEventType[] | null;
    name: string | null;
  }) => MaybePromise<void>;
}

interface CreateEventSubscriptionDialogFormData {
  name: Maybe<string>;
  eventsUrl: string;
  eventsMode: "ALL" | "SPECIFIC";
  eventTypes: OptionTypeBase[];
}

export function CreateEventSubscriptionDialog(
  props: DialogProps<CreateEventSubscriptionDialogProps>
) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    control,
    watch,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<CreateEventSubscriptionDialogFormData>({
    defaultValues: {
      name: "",
      eventsUrl: "",
      eventsMode: "ALL",
      eventTypes: [],
    },
  });
  const eventsMode = watch("eventsMode");

  const eventsUrlInputRef = useRef<HTMLInputElement>(null);
  const eventsUrlInputProps = useRegisterWithRef(eventsUrlInputRef, register, "eventsUrl", {
    required: true,
    validate: function isValidUrl(url: string) {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },
  });
  const reactSelectProps = useReactSelectProps<OptionTypeBase, true>();
  const options = useMemo(() => eventTypes.map((event) => ({ label: event, value: event })), []);
  return (
    <ConfirmDialog
      size="lg"
      closeOnEsc={false}
      closeOnOverlayClick={false}
      initialFocusRef={eventsUrlInputRef}
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit(async (data) => {
          try {
            await props.onCreate({
              name: data.name,
              eventsUrl: data.eventsUrl,
              eventTypes: data.eventsMode === "ALL" ? null : data.eventTypes.map((x) => x.value),
            });
            clearErrors("eventsUrl");
            props.onResolve();
          } catch (error) {
            if (error instanceof ApolloError) {
              const code = error.graphQLErrors[0]?.extensions?.code;
              if (code === "WEBHOOK_CHALLENGE_FAILED") {
                setError("eventsUrl", { type: "challengeFailed" }, { shouldFocus: true });
              }
            }
          }
        }),
      }}
      header={
        <FormattedMessage
          id="component.create-event-subscription-dialog.title"
          defaultMessage="Event subscription"
        />
      }
      body={
        <Stack>
          <FormControl>
            <FormLabel>
              <FormattedMessage
                id="component.create-event-subscription-dialog.name"
                defaultMessage="Subscription name"
              />
            </FormLabel>
            <Input {...register("name")} />
          </FormControl>
          <FormControl isInvalid={!!errors.eventsUrl}>
            <FormLabel>
              <FormattedMessage
                id="component.create-event-subscription-dialog.explanation"
                defaultMessage="Events URL where you want to be notified"
              />
            </FormLabel>
            <Input
              {...eventsUrlInputProps}
              placeholder={intl.formatMessage({
                id: "generic.forms.url-placeholder",
                defaultMessage: "https://www.example.com",
              })}
            />
            <FormErrorMessage>
              {errors.eventsUrl?.type === "validate" || errors.eventsUrl?.type === "required" ? (
                <FormattedMessage
                  id="component.create-event-subscription-dialog.invalid-url"
                  defaultMessage="Please, provide a valid URL."
                />
              ) : errors.eventsUrl?.type === "challengeFailed" ? (
                <FormattedMessage
                  id="component.create-event-subscription-dialog.failed-challenge"
                  defaultMessage="Your URL does not seem to accept POST requests."
                />
              ) : null}
            </FormErrorMessage>
          </FormControl>
          <Text fontSize="sm">
            <FormattedMessage
              id="component.create-event-subscription-dialog.challenge-explanation"
              defaultMessage="When you click continue an HTTP POST request will be sent to this URL which must respond with status code 200."
            />
          </Text>
          <FormControl>
            <Controller
              name="eventsMode"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <RadioGroup value={value} onChange={onChange}>
                  <Stack>
                    <Radio value="ALL">
                      <FormattedMessage id="generic.all-event-types" defaultMessage="All events" />
                    </Radio>
                    <Radio value="SPECIFIC">
                      <FormattedMessage
                        id="component.create-event-subscription-dialog.specific-events"
                        defaultMessage="Specific events"
                      />
                    </Radio>
                  </Stack>
                </RadioGroup>
              )}
            />
          </FormControl>
          <Collapse in={eventsMode === "SPECIFIC"}>
            <Stack paddingLeft={6}>
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.create-event-subscription-dialog.events-documentation"
                  defaultMessage="For a complete list of events visit our <a>API documentation</a>"
                  values={{
                    a: (chunks: any) => (
                      <Link
                        href="https://www.onparallel.com/developers/api#tag/Petition-Event"
                        isExternal
                      >
                        {chunks}
                      </Link>
                    ),
                  }}
                />
              </Text>
              <FormControl isInvalid={!!errors.eventTypes}>
                <Controller
                  name="eventTypes"
                  control={control}
                  rules={{ required: eventsMode === "SPECIFIC", validate: (v) => v.length > 0 }}
                  render={({ field: { onChange, value } }) => (
                    <>
                      <Select
                        value={value}
                        onChange={onChange}
                        isMulti
                        options={options}
                        {...reactSelectProps}
                      />
                      <FormErrorMessage>
                        <FormattedMessage
                          id="component.create-event-subscription-dialog.invalid-event-types"
                          defaultMessage="Please, select at least one event type."
                        />
                      </FormErrorMessage>
                    </>
                  )}
                />
              </FormControl>
            </Stack>
          </Collapse>
        </Stack>
      }
      confirm={
        <Button colorScheme="purple" type="submit" isLoading={isSubmitting}>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useCreateEventSubscriptionDialog() {
  return useDialog(CreateEventSubscriptionDialog);
}

const eventTypes: PetitionEventType[] = [
  "ACCESS_ACTIVATED",
  "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK",
  "ACCESS_DEACTIVATED",
  "ACCESS_DELEGATED",
  "ACCESS_OPENED",
  "COMMENT_DELETED",
  "COMMENT_PUBLISHED",
  "GROUP_PERMISSION_ADDED",
  "GROUP_PERMISSION_EDITED",
  "GROUP_PERMISSION_REMOVED",
  "MESSAGE_CANCELLED",
  "MESSAGE_SCHEDULED",
  "MESSAGE_SENT",
  "OWNERSHIP_TRANSFERRED",
  "PETITION_CLONED",
  "PETITION_CLOSED",
  "PETITION_CLOSED_NOTIFIED",
  "PETITION_COMPLETED",
  "PETITION_CREATED",
  "PETITION_MESSAGE_BOUNCED",
  "PETITION_REMINDER_BOUNCED",
  "PETITION_REOPENED",
  "PETITION_DELETED",
  "RECIPIENT_SIGNED",
  "REMINDER_SENT",
  "REPLY_CREATED",
  "REPLY_DELETED",
  "REPLY_UPDATED",
  "SIGNATURE_OPENED",
  "SIGNATURE_CANCELLED",
  "SIGNATURE_COMPLETED",
  "SIGNATURE_REMINDER",
  "SIGNATURE_STARTED",
  "TEMPLATE_USED",
  "USER_PERMISSION_ADDED",
  "USER_PERMISSION_EDITED",
  "USER_PERMISSION_REMOVED",
  "REMINDERS_OPT_OUT",
];

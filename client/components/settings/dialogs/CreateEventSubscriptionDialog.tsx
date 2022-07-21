import { ApolloError, gql, useApolloClient } from "@apollo/client";
import {
  Button,
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
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import {
  CreateEventSubscriptionDialog_PetitionBaseFragment,
  CreateEventSubscriptionDialog_petitionsDocument,
  PetitionEventType,
} from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { genericRsComponent, useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { Maybe, MaybePromise } from "@parallel/utils/types";
import { useCallback, useMemo, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { components } from "react-select";
import Select from "react-select/async";

interface CreateEventSubscriptionDialogProps {
  onCreate: (props: {
    eventsUrl: string;
    eventTypes: PetitionEventType[] | null;
    name: string | null;
    fromTemplateId: string | null;
  }) => MaybePromise<void>;
}

interface CreateEventSubscriptionDialogFormData {
  name: Maybe<string>;
  eventsUrl: string;
  eventsMode: "ALL" | "SPECIFIC";
  eventTypes: PetitionEventType[];
  fromTemplate: Maybe<CreateEventSubscriptionDialog_PetitionBaseFragment>;
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
      fromTemplate: null,
    },
  });
  const eventsMode = watch("eventsMode");

  const apollo = useApolloClient();
  const loadTemplates = useCallback(async (search) => {
    const result = await apollo.query({
      query: CreateEventSubscriptionDialog_petitionsDocument,
      variables: {
        offset: 0,
        limit: 100,
        filters: {
          type: "TEMPLATE",
        },
        search,
        sortBy: "lastUsedAt_DESC",
      },
    });
    return result.data.petitions.items;
  }, []);

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
  const reactSelectProps = useReactSelectProps<
    CreateEventSubscriptionDialog_PetitionBaseFragment,
    false
  >({ components: { Option, SingleValue } });

  const options = useMemo(
    () => eventTypes.map((event) => ({ label: event as string, value: event })),
    []
  );
  return (
    <ConfirmDialog
      size="xl"
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
              eventTypes: data.eventsMode === "ALL" ? null : data.eventTypes,
              fromTemplateId: data.fromTemplate?.id ?? null,
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
          <FormControl id="from-template-id">
            <FormLabel>
              <FormattedMessage
                id="component.create-event-subscription-dialog.from-template-label"
                defaultMessage="Filter events from parallels created from a specific template (Optional)."
              />
            </FormLabel>
            <Controller
              name="fromTemplate"
              control={control}
              rules={{
                required: false,
              }}
              render={({ field: { onChange, value } }) => (
                <Select<CreateEventSubscriptionDialog_PetitionBaseFragment, false>
                  {...reactSelectProps}
                  value={value}
                  inputId="from-template-id"
                  onChange={onChange}
                  defaultOptions
                  loadOptions={loadTemplates}
                  isSearchable
                  isClearable
                  placeholder={intl.formatMessage({
                    id: "component.create-event-subscription-dialog.from-template-placeholder",
                    defaultMessage: "Search for templates...",
                  })}
                  getOptionValue={(o) => o.id}
                  getOptionLabel={(o) => o.name ?? ""}
                />
              )}
            />
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
          <PaddedCollapse in={eventsMode === "SPECIFIC"}>
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
                  rules={{
                    required: eventsMode === "SPECIFIC",
                    validate: (v) => (eventsMode === "SPECIFIC" ? v.length > 0 : true),
                  }}
                  render={({ field: { onChange, value } }) => (
                    <>
                      <SimpleSelect
                        value={value}
                        onChange={onChange}
                        isMulti
                        options={options}
                        placeholder={intl.formatMessage({
                          id: "component.create-event-subscription-dialog.event-select.placeholder",
                          defaultMessage: "Search events...",
                        })}
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
          </PaddedCollapse>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit" isLoading={isSubmitting}>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

const rsComponent = genericRsComponent<CreateEventSubscriptionDialog_PetitionBaseFragment, false>();

const Option = rsComponent("Option", function (props) {
  return (
    <components.Option {...props}>
      {props.data.name ?? (
        <Text as="span" textStyle="hint">
          <FormattedMessage id="generic.unnamed-template" defaultMessage="Unnamed template" />
        </Text>
      )}
    </components.Option>
  );
});

const SingleValue = rsComponent("SingleValue", function (props) {
  return (
    <components.SingleValue {...props}>
      {props.data.name ?? (
        <Text as="span" textStyle="hint">
          <FormattedMessage id="generic.unnamed-template" defaultMessage="Unnamed template" />
        </Text>
      )}
    </components.SingleValue>
  );
});

CreateEventSubscriptionDialog.fragments = {
  PetitionBase: gql`
    fragment CreateEventSubscriptionDialog_PetitionBase on PetitionBase {
      id
      name
    }
  `,
};

CreateEventSubscriptionDialog.queries = [
  gql`
    query CreateEventSubscriptionDialog_petitions(
      $offset: Int!
      $limit: Int!
      $search: String
      $sortBy: [QueryPetitions_OrderBy!]
      $filters: PetitionFilter
    ) {
      petitions(
        offset: $offset
        limit: $limit
        search: $search
        sortBy: $sortBy
        filters: $filters
      ) {
        items {
          ...CreateEventSubscriptionDialog_PetitionBase
        }
      }
    }
    ${CreateEventSubscriptionDialog.fragments.PetitionBase}
  `,
];

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
  "PETITION_ANONYMIZED",
];

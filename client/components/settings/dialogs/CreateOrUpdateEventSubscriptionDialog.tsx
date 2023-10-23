import { ApolloError, gql, useApolloClient, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputRightAddon,
  Link,
  Radio,
  RadioGroup,
  Stack,
  Text,
  useCounter,
} from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { CopyToClipboardButton } from "@parallel/components/common/CopyToClipboardButton";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import { PetitionFieldSelect } from "@parallel/components/common/PetitionFieldSelect";
import { SimpleSelect, useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { Steps } from "@parallel/components/common/Steps";
import {
  CreateOrUpdateEventSubscriptionDialog_EventSubscriptionSignatureKeyFragment,
  CreateOrUpdateEventSubscriptionDialog_PetitionBaseFragment,
  CreateOrUpdateEventSubscriptionDialog_PetitionEventSubscriptionFragment,
  CreateOrUpdateEventSubscriptionDialog_PetitionFieldFragment,
  CreateOrUpdateEventSubscriptionDialog_petitionsDocument,
  CreateOrUpdateEventSubscriptionDialog_petitionWithFieldsDocument,
  PetitionEventType,
} from "@parallel/graphql/__types";
import { assertTypenameArray } from "@parallel/utils/apollo/typename";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { Maybe } from "@parallel/utils/types";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useEffectSkipFirst } from "@parallel/utils/useEffectSkipFirst";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { components, OptionProps, SingleValueProps } from "react-select";
import Select from "react-select/async";
import { isDefined } from "remeda";

interface CreateOrUpdateEventSubscriptionDialogProps {
  eventSubscription?: CreateOrUpdateEventSubscriptionDialog_PetitionEventSubscriptionFragment;
  initialStep?: number;
  onSubscriptionSubmit: (
    subscriptionId: string | null,
    data: {
      eventsUrl: string;
      eventTypes: PetitionEventType[] | null;
      name: string | null;
      fromTemplateId: string | null;
      fromTemplateFieldIds: string[] | null;
    },
  ) => Promise<string>;
  onAddSignatureKey: (
    subscriptionId: string,
  ) => Promise<CreateOrUpdateEventSubscriptionDialog_EventSubscriptionSignatureKeyFragment>;
  onDeleteSignatureKey: (signatureKeyId: string) => Promise<void>;
}

interface CreateOrUpdateEventSubscriptionDialogFormData {
  name: Maybe<string>;
  eventsUrl: string;
  eventsMode: "ALL" | "SPECIFIC";
  eventTypes: PetitionEventType[];
  fromTemplate: Maybe<
    Omit<CreateOrUpdateEventSubscriptionDialog_PetitionBaseFragment, "__typename">
  >;
  fromTemplateFields: CreateOrUpdateEventSubscriptionDialog_PetitionFieldFragment[];
}

const EVENT_TYPES: PetitionEventType[] = [
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
  "REPLY_STATUS_CHANGED",
  "PROFILE_ASSOCIATED",
  "PROFILE_DISASSOCIATED",
];

const FIELD_EVENTS: PetitionEventType[] = [
  "COMMENT_DELETED",
  "COMMENT_PUBLISHED",
  "REPLY_CREATED",
  "REPLY_DELETED",
  "REPLY_STATUS_CHANGED",
  "REPLY_UPDATED",
];

export function CreateOrUpdateEventSubscriptionDialog({
  eventSubscription,
  initialStep,
  onSubscriptionSubmit,
  onAddSignatureKey,
  onDeleteSignatureKey,
  ...props
}: DialogProps<CreateOrUpdateEventSubscriptionDialogProps>) {
  const intl = useIntl();

  const {
    valueAsNumber: currentStep,
    increment: nextStep,
    decrement: prevStep,
  } = useCounter({ min: 0, max: 1, defaultValue: initialStep ?? 0 });

  const [newSubscriptionId, setNewSubscriptionId] = useState<string | null>(
    eventSubscription?.id ?? null,
  );

  const {
    handleSubmit,
    register,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    resetField,
    setError,
    clearErrors,
  } = useForm<CreateOrUpdateEventSubscriptionDialogFormData>({
    defaultValues: {
      name: eventSubscription?.name ?? "",
      eventsUrl: eventSubscription?.eventsUrl ?? "",
      eventsMode: isDefined(eventSubscription?.eventTypes) ? "SPECIFIC" : "ALL",
      eventTypes: eventSubscription?.eventTypes ?? [],
      fromTemplate: eventSubscription?.fromTemplate,
      fromTemplateFields: [],
    },
  });
  const eventsMode = watch("eventsMode");
  const eventTypes = watch("eventTypes");

  const apollo = useApolloClient();

  const loadTemplates = useDebouncedAsync(
    async (search: string | null | undefined) => {
      const result = await apollo.query({
        query: CreateOrUpdateEventSubscriptionDialog_petitionsDocument,
        variables: {
          offset: 0,
          limit: 100,
          filters: {
            type: "TEMPLATE",
          },
          search,
          sortBy: "lastUsedAt_DESC",
        },
        fetchPolicy: "no-cache",
      });
      assertTypenameArray(result.data.petitions.items, "PetitionTemplate");
      return result.data.petitions.items;
    },
    300,
    [],
  );

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
    CreateOrUpdateEventSubscriptionDialog_PetitionBaseFragment,
    false
  >({ components: { Option, SingleValue } as any });

  const options = useSimpleSelectOptions(
    () => EVENT_TYPES.map((event) => ({ label: event, value: event })),
    [],
  );

  function handlePrevStep() {
    if (currentStep === 1) {
      prevStep();
    } else {
      props.onReject("CLOSE");
    }
  }

  const [signatureKeys, setSignatureKeys] = useState<
    CreateOrUpdateEventSubscriptionDialog_EventSubscriptionSignatureKeyFragment[]
  >(eventSubscription?.signatureKeys ?? []);

  async function handleAddNewSignatureKey(subscriptionId: string) {
    try {
      const newKey = await onAddSignatureKey(subscriptionId);
      setSignatureKeys([...signatureKeys, newKey]);
    } catch {}
  }

  const showDeleteWebhookSignatureKeysDialog = useDeleteWebhookSignatureKeysDialog();
  async function handleDeleteSignatureKey(signatureKeyId: string) {
    try {
      await showDeleteWebhookSignatureKeysDialog();
      await onDeleteSignatureKey(signatureKeyId);
      setSignatureKeys(signatureKeys.filter((k) => k.id !== signatureKeyId));
    } catch {}
  }

  const fromTemplate = watch("fromTemplate");

  const { data } = useQuery(CreateOrUpdateEventSubscriptionDialog_petitionWithFieldsDocument, {
    variables: fromTemplate ? { petitionId: fromTemplate.id } : undefined,
    skip: !isDefined(fromTemplate),
    fetchPolicy: "no-cache",
  });

  const fields = data?.petition?.fields ?? [];

  useEffectSkipFirst(() => {
    // reset fields when template changes
    setValue("fromTemplateFields", []);
  }, [fromTemplate?.id]);

  const initialFieldsSetRef = useRef(false);
  useEffect(() => {
    // set initial fields
    setTimeout(() => {
      if (
        isDefined(eventSubscription) &&
        isDefined(eventSubscription.fromTemplateFields) &&
        fields.length > 0 &&
        !initialFieldsSetRef.current
      ) {
        resetField("fromTemplateFields", {
          defaultValue: fields.filter(
            (field) => eventSubscription.fromTemplateFields?.some((f) => field.id === f.id),
          ),
        });
        initialFieldsSetRef.current = true;
      }
    });
  }, [eventSubscription?.fromTemplateFields, fields]);

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
            if (currentStep === 0) {
              setNewSubscriptionId(
                await onSubscriptionSubmit(newSubscriptionId, {
                  name: data.name?.trim() || null,
                  eventsUrl: data.eventsUrl,
                  eventTypes: data.eventsMode === "ALL" ? null : data.eventTypes,
                  fromTemplateId: data.fromTemplate?.id ?? null,
                  fromTemplateFieldIds:
                    isDefined(data.fromTemplate) && data.fromTemplateFields.length > 0
                      ? data.fromTemplateFields.map((f) => f.id)
                      : null,
                }),
              );

              clearErrors("eventsUrl");
              nextStep();
            } else {
              props.onResolve();
            }
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
        <Flex alignItems="baseline">
          {currentStep === 0 ? (
            <FormattedMessage
              id="component.create-event-subscription-dialog.title.step-1"
              defaultMessage="Event subscription"
            />
          ) : (
            <FormattedMessage
              id="component.create-event-subscription-dialog.title.step-2"
              defaultMessage="Signature keys"
            />
          )}
          <Text marginLeft={2} color="gray.600" fontSize="md" fontWeight="400">
            {currentStep + 1}/2
          </Text>
        </Flex>
      }
      body={
        <Steps currentStep={currentStep}>
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
                  <Select<CreateOrUpdateEventSubscriptionDialog_PetitionBaseFragment, false>
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
            <FormControl>
              <Controller
                name="eventsMode"
                control={control}
                rules={{ required: true }}
                render={({ field: { onChange, value } }) => (
                  <RadioGroup value={value} onChange={onChange as any}>
                    <Stack>
                      <Radio value="ALL">
                        <FormattedMessage
                          id="generic.all-event-types"
                          defaultMessage="All events"
                        />
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
                          href="https://www.onparallel.com/developers/api#tag/Parallel-Event"
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
            <PaddedCollapse
              in={
                isDefined(fromTemplate) &&
                eventsMode === "SPECIFIC" &&
                eventTypes.length > 0 &&
                eventTypes.every((e) => FIELD_EVENTS.includes(e))
              }
            >
              <Stack paddingLeft={6}>
                <Text fontSize="sm">
                  <FormattedMessage
                    id="component.create-event-subscription-dialog.filter-fields"
                    defaultMessage="Filter for events coming from specific fields of the template. Leave blank to receive all events."
                  />
                </Text>
                <FormControl>
                  <Controller
                    name="fromTemplateFields"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <PetitionFieldSelect
                        isMulti
                        value={value}
                        fields={fields}
                        onChange={onChange}
                        placeholder={intl.formatMessage({
                          id: "component.create-event-subscription-dialog.filter-fields-placeholder",
                          defaultMessage: "Select fields to filter events...",
                        })}
                      />
                    )}
                  />
                </FormControl>
              </Stack>
            </PaddedCollapse>
          </Stack>
          <Stack>
            <Text>
              <FormattedMessage
                id="component.create-event-subscription-dialog.signature-keys-explanation"
                defaultMessage="You can validate the integrity and authenticity of the events you receive in your subscription by creating a signature key."
              />
              <HelpCenterLink marginLeft={1} articleId={7035199}>
                <FormattedMessage id="generic.learn-more" defaultMessage="Learn more" />
              </HelpCenterLink>
            </Text>

            <Box>
              <Button
                marginY={2}
                variant="outline"
                onClick={() => handleAddNewSignatureKey(newSubscriptionId!)}
                isDisabled={signatureKeys.length >= 5}
              >
                <FormattedMessage id="generic.add" defaultMessage="Add" />
              </Button>
            </Box>

            <Stack as="ul">
              {signatureKeys.map((k) => (
                <HStack key={k.id}>
                  <InputGroup as="li">
                    <Input readOnly value={k.publicKey} />
                    <InputRightAddon padding={0}>
                      <CopyToClipboardButton
                        border={"1px solid"}
                        borderColor="inherit"
                        borderLeftRadius={0}
                        text={k.publicKey}
                      />
                    </InputRightAddon>
                  </InputGroup>
                  <IconButtonWithTooltip
                    label={intl.formatMessage({
                      id: "generic.delete",
                      defaultMessage: "Delete",
                    })}
                    icon={<DeleteIcon />}
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDeleteSignatureKey(k.id)}
                  />
                </HStack>
              ))}
            </Stack>
          </Stack>
        </Steps>
      }
      confirm={
        <Button colorScheme="primary" type="submit" isLoading={isSubmitting}>
          {currentStep === 0 ? (
            isDefined(newSubscriptionId) ? (
              <FormattedMessage id="generic.continue" defaultMessage="Continue" />
            ) : (
              <FormattedMessage id="generic.create" defaultMessage="Create" />
            )
          ) : (
            <FormattedMessage id="generic.accept" defaultMessage="Accept" />
          )}
        </Button>
      }
      cancel={
        <Button onClick={handlePrevStep}>
          {currentStep === 0 ? (
            <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
          ) : (
            <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
          )}
        </Button>
      }
      {...props}
    />
  );
}

function Option(props: OptionProps<CreateOrUpdateEventSubscriptionDialog_PetitionBaseFragment>) {
  return (
    <components.Option {...props}>
      {props.data.name ?? (
        <Text as="span" textStyle="hint">
          <FormattedMessage id="generic.unnamed-template" defaultMessage="Unnamed template" />
        </Text>
      )}
    </components.Option>
  );
}

function SingleValue(
  props: SingleValueProps<CreateOrUpdateEventSubscriptionDialog_PetitionBaseFragment>,
) {
  return (
    <components.SingleValue {...props}>
      {props.data.name ?? (
        <Text as="span" textStyle="hint">
          <FormattedMessage id="generic.unnamed-template" defaultMessage="Unnamed template" />
        </Text>
      )}
    </components.SingleValue>
  );
}

CreateOrUpdateEventSubscriptionDialog.fragments = {
  get PetitionEventSubscription() {
    return gql`
      fragment CreateOrUpdateEventSubscriptionDialog_PetitionEventSubscription on PetitionEventSubscription {
        id
        eventsUrl
        eventTypes
        isEnabled
        isFailing
        name
        fromTemplate {
          id
          name
        }
        fromTemplateFields {
          id
        }
        signatureKeys {
          ...CreateOrUpdateEventSubscriptionDialog_EventSubscriptionSignatureKey
        }
      }
      ${this.EventSubscriptionSignatureKey}
    `;
  },
  get PetitionBase() {
    return gql`
      fragment CreateOrUpdateEventSubscriptionDialog_PetitionBase on PetitionBase {
        id
        name
      }
    `;
  },
  get EventSubscriptionSignatureKey() {
    return gql`
      fragment CreateOrUpdateEventSubscriptionDialog_EventSubscriptionSignatureKey on EventSubscriptionSignatureKey {
        id
        publicKey
      }
    `;
  },
  get PetitionField() {
    return gql`
      fragment CreateOrUpdateEventSubscriptionDialog_PetitionField on PetitionField {
        ...PetitionFieldSelect_PetitionField
        isReadOnly
      }
      ${PetitionFieldSelect.fragments.PetitionField}
    `;
  },
  get PetitionBaseWithFields() {
    return gql`
      fragment CreateOrUpdateEventSubscriptionDialog_PetitionBaseWithFields on PetitionBase {
        id
        fields {
          ...CreateOrUpdateEventSubscriptionDialog_PetitionField
        }
      }
      ${this.PetitionField}
    `;
  },
};

const _queries = [
  gql`
    query CreateOrUpdateEventSubscriptionDialog_petitions(
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
          ...CreateOrUpdateEventSubscriptionDialog_PetitionBase
        }
      }
    }
    ${CreateOrUpdateEventSubscriptionDialog.fragments.PetitionBase}
  `,
  gql`
    query CreateOrUpdateEventSubscriptionDialog_petitionWithFields($petitionId: GID!) {
      petition(id: $petitionId) {
        ...CreateOrUpdateEventSubscriptionDialog_PetitionBaseWithFields
      }
    }
    ${CreateOrUpdateEventSubscriptionDialog.fragments.PetitionBaseWithFields}
  `,
];

export function useCreateOrUpdateEventSubscriptionDialog() {
  return useDialog(CreateOrUpdateEventSubscriptionDialog);
}

function useDeleteWebhookSignatureKeysDialog() {
  const showDialog = useConfirmDeleteDialog();
  return useCallback(async () => {
    return await showDialog({
      header: (
        <FormattedMessage
          id="component.create-event-subscription-dialog.confirm-delete-header"
          defaultMessage="Delete signature key"
        />
      ),
      description: (
        <Stack>
          <Text>
            <FormattedMessage
              id="component.create-event-subscription-dialog.confirm-delete-body"
              defaultMessage="Are you sure you want to delete the selected key?"
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.create-event-subscription-dialog.confirm-delete-warning"
              defaultMessage="Before you proceed, make sure you are not using this key to verify received events, as it will not be valid anymore."
            />
          </Text>
        </Stack>
      ),
    });
  }, []);
}

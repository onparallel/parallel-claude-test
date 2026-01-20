import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Box,
  Button,
  Checkbox,
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
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import { ProfileTypeFieldSelect } from "@parallel/components/common/ProfileTypeFieldSelect";
import { ProfileTypeSelect } from "@parallel/components/common/ProfileTypeSelect";
import { SimpleSelect, useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { Steps } from "@parallel/components/common/Steps";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  CreateOrUpdateProfileEventSubscriptionDialog_EventSubscriptionSignatureKeyFragment,
  CreateOrUpdateProfileEventSubscriptionDialog_ProfileEventSubscriptionFragment,
  CreateOrUpdateProfileEventSubscriptionDialog_profileTypeDocument,
  ProfileEventType,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { Maybe } from "@parallel/utils/types";
import { useEffectSkipFirst } from "@parallel/utils/useEffectSkipFirst";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { useDeleteWebhookSignatureKeysDialog } from "./ConfirmDeleteWebhookSignatureKeysDialog";
interface CreateOrUpdateProfileEventSubscriptionDialogProps {
  eventSubscription?: CreateOrUpdateProfileEventSubscriptionDialog_ProfileEventSubscriptionFragment;
  initialStep?: number;
  onSubscriptionSubmit: (
    subscriptionId: string | null,
    data: {
      eventsUrl: string;
      eventTypes: ProfileEventType[] | null;
      name: string | null;
      fromProfileTypeId: string | null;
      fromProfileTypeFieldIds: string[] | null;
      ignoreOwnerEvents: boolean;
    },
  ) => Promise<string>;
  onAddSignatureKey: (
    subscriptionId: string,
  ) => Promise<CreateOrUpdateProfileEventSubscriptionDialog_EventSubscriptionSignatureKeyFragment>;
  onDeleteSignatureKey: (signatureKeyId: string) => Promise<void>;
}

interface CreateOrUpdateProfileEventSubscriptionDialogFormData {
  name: Maybe<string>;
  eventsUrl: string;
  eventsMode: "ALL" | "SPECIFIC";
  eventTypes: ProfileEventType[];
  fromProfileTypeId: Maybe<string>;
  fromProfileTypeFieldIds: string[];
  ignoreOwnerEvents: boolean;
}

const PROFILE_EVENT_TYPES: ProfileEventType[] = [
  "PETITION_ASSOCIATED",
  "PETITION_DISASSOCIATED",
  "PROFILE_ANONYMIZED",
  "PROFILE_CLOSED",
  "PROFILE_CREATED",
  "PROFILE_FIELD_EXPIRY_UPDATED",
  "PROFILE_FIELD_FILE_ADDED",
  "PROFILE_FIELD_FILE_REMOVED",
  "PROFILE_FIELD_VALUE_UPDATED",
  "PROFILE_REOPENED",
  "PROFILE_SCHEDULED_FOR_DELETION",
  "PROFILE_UPDATED",
  "PROFILE_RELATIONSHIP_CREATED",
  "PROFILE_RELATIONSHIP_REMOVED",
];

const FIELD_EVENTS: ProfileEventType[] = [
  "PROFILE_FIELD_EXPIRY_UPDATED",
  "PROFILE_FIELD_FILE_ADDED",
  "PROFILE_FIELD_FILE_REMOVED",
  "PROFILE_FIELD_VALUE_UPDATED",
];

export function CreateOrUpdateProfileEventSubscriptionDialog({
  eventSubscription,
  initialStep,
  onSubscriptionSubmit,
  onAddSignatureKey,
  onDeleteSignatureKey,
  ...props
}: DialogProps<CreateOrUpdateProfileEventSubscriptionDialogProps>) {
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
    formState: { errors, isSubmitting },
    setValue,
    setError,
    clearErrors,
  } = useForm<CreateOrUpdateProfileEventSubscriptionDialogFormData>({
    defaultValues: {
      name: eventSubscription?.name ?? "",
      eventsUrl: eventSubscription?.eventsUrl ?? "",
      eventsMode: isNonNullish(eventSubscription?.profileEventTypes) ? "SPECIFIC" : "ALL",
      eventTypes: eventSubscription?.profileEventTypes ?? [],
      fromProfileTypeId: eventSubscription?.fromProfileType?.id ?? null,
      fromProfileTypeFieldIds: eventSubscription?.fromProfileTypeFields?.map((f) => f?.id) ?? [],
      ignoreOwnerEvents: eventSubscription?.ignoreOwnerEvents ?? false,
    },
  });
  const eventsMode = watch("eventsMode");
  const eventTypes = watch("eventTypes");
  const fromProfileTypeId = watch("fromProfileTypeId");

  useEffectSkipFirst(() => {
    // reset fields when profile type changes
    setValue("fromProfileTypeFieldIds", []);
  }, [fromProfileTypeId]);

  const { data } = useQuery(CreateOrUpdateProfileEventSubscriptionDialog_profileTypeDocument, {
    variables: { profileTypeId: fromProfileTypeId ?? "" },
    skip: isNullish(fromProfileTypeId),
    fetchPolicy: "no-cache",
  });

  const fields = data?.profileType?.fields ?? [];

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

  const profileEventOptions = useSimpleSelectOptions(
    () => PROFILE_EVENT_TYPES.map((event) => ({ label: event, value: event })),
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
    CreateOrUpdateProfileEventSubscriptionDialog_EventSubscriptionSignatureKeyFragment[]
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

  return (
    <ConfirmDialog
      size="xl"
      closeOnEsc={false}
      closeOnOverlayClick={false}
      initialFocusRef={eventsUrlInputRef}
      hasCloseButton
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            try {
              if (currentStep === 0) {
                setNewSubscriptionId(
                  await onSubscriptionSubmit(newSubscriptionId, {
                    name: data.name?.trim() || null,
                    eventsUrl: data.eventsUrl,
                    eventTypes: data.eventsMode === "ALL" ? null : data.eventTypes,
                    fromProfileTypeId: data.fromProfileTypeId,
                    fromProfileTypeFieldIds:
                      isNonNullish(data.fromProfileTypeId) &&
                      data.fromProfileTypeFieldIds.length > 0
                        ? data.fromProfileTypeFieldIds
                        : null,
                    ignoreOwnerEvents: data.ignoreOwnerEvents,
                  }),
                );

                clearErrors("eventsUrl");
                nextStep();
              } else {
                props.onResolve();
              }
            } catch (error) {
              if (isApolloError(error)) {
                const code = error.errors[0]?.extensions?.code;
                if (code === "WEBHOOK_CHALLENGE_FAILED") {
                  setError("eventsUrl", { type: "challengeFailed" }, { shouldFocus: true });
                }
              }
            }
          }),
        },
      }}
      header={
        <Flex alignItems="baseline">
          {currentStep === 0 ? (
            <FormattedMessage
              id="component.create-event-subscription-dialog.header-step-1"
              defaultMessage="Event subscription"
            />
          ) : (
            <FormattedMessage
              id="component.create-event-subscription-dialog.header-step-2"
              defaultMessage="Signature keys"
            />
          )}
          <Text marginStart={2} color="gray.600" fontSize="md" fontWeight="400">
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
                  id: "generic.url-placeholder",
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
              <FormLabel>
                <FormattedMessage
                  id="component.create-profile-event-subscription-dialog.from-profiles-label"
                  defaultMessage="Filter events from profiles created from a specific profile type (Optional)."
                />
              </FormLabel>
              <Controller
                name="fromProfileTypeId"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <ProfileTypeSelect
                    defaultOptions
                    value={value}
                    onChange={(v) => onChange(v?.id ?? "")}
                    isClearable
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
            <PaddedCollapse open={eventsMode === "SPECIFIC"}>
              <Stack paddingStart={6}>
                <Text fontSize="sm">
                  <FormattedMessage
                    id="component.create-event-subscription-dialog.events-documentation"
                    defaultMessage="For a complete list of events visit our <a>API documentation</a>"
                    values={{
                      a: (chunks: any) => (
                        <Link
                          href="https://www.onparallel.com/developers/api#tag/Subscriptions/Profile-Events"
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
                          options={profileEventOptions}
                          placeholder={intl.formatMessage({
                            id: "component.create-event-subscription-dialog.event-select-placeholder",
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
              open={
                eventsMode === "SPECIFIC" &&
                eventTypes.length > 0 &&
                eventTypes.every((e) => FIELD_EVENTS.includes(e))
              }
            >
              <Stack paddingStart={6}>
                <Text fontSize="sm">
                  <FormattedMessage
                    id="component.create-profile-event-subscription-dialog.filter-fields"
                    defaultMessage="Filter for events coming from specific properties of the profile. Leave blank to receive all events."
                  />
                </Text>
                <FormControl>
                  <Controller
                    name="fromProfileTypeFieldIds"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <ProfileTypeFieldSelect
                        isMulti
                        value={fields.filter((f) => value.includes(f.id))}
                        fields={fields}
                        onChange={(values) => onChange(values.map((v) => v.id))}
                        placeholder={intl.formatMessage({
                          id: "component.create-profile-event-subscription-dialog.filter-fields-placeholder",
                          defaultMessage: "Select properties to filter events...",
                        })}
                        fontSize="sm"
                      />
                    )}
                  />
                </FormControl>
              </Stack>
            </PaddedCollapse>
            <FormControl>
              <Checkbox {...register("ignoreOwnerEvents")}>
                <FormattedMessage
                  id="component.create-event-subscription-dialog.ignore-owner-events"
                  defaultMessage="Ignore events produced by this user"
                />
                <HelpPopover>
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="component.create-event-subscription-dialog.ignore-owner-events-popover"
                      defaultMessage="If this option is enabled, we will not send events that are triggered by this user. This option is designed to prevent call loops in integrations where a token from this same user is used to perform actions through our API."
                    />
                  </Text>
                </HelpPopover>
              </Checkbox>
            </FormControl>
          </Stack>
          <Stack>
            <Text>
              <FormattedMessage
                id="component.create-event-subscription-dialog.signature-keys-explanation"
                defaultMessage="You can validate the integrity and authenticity of the events you receive in your subscription by creating a signature key."
              />
              <HelpCenterLink marginStart={1} articleId={7035199}>
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
                        borderStartRadius={0}
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
            isNonNullish(newSubscriptionId) ? (
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

const _fragments = {
  ProfileEventSubscription: gql`
    fragment CreateOrUpdateProfileEventSubscriptionDialog_ProfileEventSubscription on ProfileEventSubscription {
      id
      name
      eventsUrl
      isEnabled
      isFailing
      ignoreOwnerEvents
      signatureKeys {
        ...CreateOrUpdateProfileEventSubscriptionDialog_EventSubscriptionSignatureKey
      }
      profileEventTypes: eventTypes
      fromProfileType {
        id
        name
      }
      fromProfileTypeFields {
        id
      }
    }
  `,
  EventSubscriptionSignatureKey: gql`
    fragment CreateOrUpdateProfileEventSubscriptionDialog_EventSubscriptionSignatureKey on EventSubscriptionSignatureKey {
      id
      publicKey
    }
  `,
  ProfileTypeField: gql`
    fragment CreateOrUpdateProfileEventSubscriptionDialog_ProfileTypeField on ProfileTypeField {
      id
      ...ProfileTypeFieldSelect_ProfileTypeField
    }
  `,
  ProfileType: gql`
    fragment CreateOrUpdateProfileEventSubscriptionDialog_ProfileType on ProfileType {
      id
      name
      fields {
        id
        ...CreateOrUpdateProfileEventSubscriptionDialog_ProfileTypeField
      }
    }
  `,
};

const _queries = [
  gql`
    query CreateOrUpdateProfileEventSubscriptionDialog_profileType($profileTypeId: GID!) {
      profileType(profileTypeId: $profileTypeId) {
        ...CreateOrUpdateProfileEventSubscriptionDialog_ProfileType
      }
    }
  `,
];

export function useCreateOrUpdateProfileEventSubscriptionDialog() {
  return useDialog(CreateOrUpdateProfileEventSubscriptionDialog);
}

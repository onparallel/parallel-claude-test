import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Button,
  Center,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { LinkIcon } from "@parallel/chakra/icons";
import {
  ContactSelectProps,
  ContactSelectSelection,
} from "@parallel/components/common/ContactSelect";
import { UserSelect } from "@parallel/components/common/UserSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { MessageEmailBodyFormControl } from "@parallel/components/petition-common/MessageEmailBodyFormControl";
import { MessageEmailSubjectFormControl } from "@parallel/components/petition-common/MessageEmailSubjectFormControl";
import {
  ConfirmPetitionSignersDialog,
  useConfirmPetitionSignersDialog,
} from "@parallel/components/petition-common/dialogs/ConfirmPetitionSignersDialog";
import { PetitionRemindersConfig } from "@parallel/components/petition-compose/PetitionRemindersConfig";
import {
  CopySignatureConfigDialog,
  useCopySignatureConfigDialog,
} from "@parallel/components/petition-compose/dialogs/CopySignatureConfigDialog";
import { useScheduleMessageDialog } from "@parallel/components/petition-compose/dialogs/ScheduleMessageDialog";
import {
  AddPetitionAccessDialog_DelegateUserFragment,
  AddPetitionAccessDialog_PetitionFragment,
  AddPetitionAccessDialog_SignatureConfigFragment,
  AddPetitionAccessDialog_UserFragment,
  AddPetitionAccessDialog_createContactlessPetitionAccessDocument,
  AddPetitionAccessDialog_petitionDocument,
  BulkSendSigningMode,
  RemindersConfig,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { emptyRTEValue } from "@parallel/utils/slate/RichTextEditor/emptyRTEValue";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { Maybe } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useSearchUsers } from "@parallel/utils/useSearchUsers";
import { BaseSyntheticEvent, useCallback, useEffect, useMemo, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isDefined, noop, omit } from "remeda";
import { HelpPopover } from "../../common/HelpPopover";
import { RecipientSelectGroups } from "../../common/RecipientSelectGroups";
import { SendButton } from "../../petition-common/SendButton";
import { useContactlessLinkDialog } from "./ContactlessLinkDialog";

export interface AddPetitionAccessDialogProps {
  onSearchContacts?: ContactSelectProps["onSearchContacts"];
  onCreateContact?: ContactSelectProps["onCreateContact"];
  onUpdatePetition?: (data: UpdatePetitionInput) => void;
  canAddRecipientGroups?: boolean;
  petitionId: string;
  user: AddPetitionAccessDialog_UserFragment;
}

export interface AddPetitionAccessDialogResult {
  recipientIdGroups: string[][];
  subject: string;
  body: RichTextEditorValue;
  remindersConfig: Maybe<RemindersConfig>;
  scheduledAt: Maybe<Date>;
  bulkSendSigningMode?: BulkSendSigningMode;
  subscribeSender: boolean;
  senderId: string | null;
}

export function AddPetitionAccessDialog({
  user,
  petitionId,
  canAddRecipientGroups,
  onUpdatePetition = noop,
  // TODO: fix this
  onSearchContacts = useSearchContacts(),
  onCreateContact = useCreateContact(),
  ...props
}: DialogProps<AddPetitionAccessDialogProps, AddPetitionAccessDialogResult>) {
  const userCanSendOnBehalfOfAnyone = useHasPermission("PETITIONS:SEND_ON_BEHALF");

  const { data, loading } = useQuery(AddPetitionAccessDialog_petitionDocument, {
    variables: { petitionId },
    fetchPolicy: "cache-and-network",
  });

  const petition = data?.petition as Maybe<AddPetitionAccessDialog_PetitionFragment> | undefined;

  const accesses = petition?.accesses ?? [];

  const sendAsOptions = useMemo(() => [user, ...user.delegateOf], [user]);

  const { watch, control, handleSubmit, register, setError, clearErrors, reset } = useForm<{
    signatureConfig: AddPetitionAccessDialog_SignatureConfigFragment | null;
    recipientGroups: ContactSelectSelection[][];
    subject: string;
    body: RichTextEditorValue;
    remindersConfig: Maybe<RemindersConfig>;
    sendAsUser: AddPetitionAccessDialog_DelegateUserFragment;
    subscribeSender: boolean;
  }>({
    defaultValues: {
      signatureConfig: null,
      recipientGroups: [[]],
      subject: "",
      body: emptyRTEValue(),
      remindersConfig: null,
      sendAsUser: user,
      subscribeSender: false,
    },
  });

  //reset the form when the petition is loaded
  useEffect(() => {
    if (!loading && isDefined(petition)) {
      reset({
        signatureConfig: petition.signatureConfig ?? null,
        recipientGroups: [[]],
        subject: petition.emailSubject ?? "",
        body: petition.emailBody ?? emptyRTEValue(),
        remindersConfig: petition.remindersConfig
          ? omit(petition.remindersConfig, ["__typename"])
          : null,
        sendAsUser:
          // make sure the "send as" is one of the available delegated users
          // it may not be an allowed user when setting default from the template's Messages tab.
          isDefined(petition.defaultOnBehalf) &&
          (userCanSendOnBehalfOfAnyone ||
            sendAsOptions.some((o) => o.id === petition.defaultOnBehalf!.id))
            ? petition.defaultOnBehalf
            : user,
        subscribeSender: false,
      });
    }
  }, [loading]);

  const recipientGroups = watch("recipientGroups");
  const signatureConfig = watch("signatureConfig");
  const sendAsUser = watch("sendAsUser");

  const isMissingSigners =
    isDefined(signatureConfig) &&
    !signatureConfig.review &&
    !signatureConfig.allowAdditionalSigners &&
    signatureConfig.signers.length < signatureConfig.minSigners;

  const showSendAs =
    user.hasOnBehalfOf && (userCanSendOnBehalfOfAnyone || user.delegateOf.length > 0);
  const senderHasPermission =
    petition?.effectivePermissions.some((p) => p.user.id === sendAsUser.id) ?? false;

  const _handleSearchUsers = useSearchUsers();
  const handleSearchUsers = useCallback(
    async (search: string, excludeUsers: string[]) => {
      return await _handleSearchUsers(search, { excludeIds: excludeUsers });
    },
    [_handleSearchUsers],
  );

  const [updateSubject, updateBody, updateRemindersConfig, updateSignatureConfig] = [
    useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]),
    useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]),
    useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]),
    useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]),
  ];

  const recipientsRef = useRef<HTMLInputElement>(null);

  const showScheduleMessageDialog = useScheduleMessageDialog();
  const showCopySignatureConfigDialog = useCopySignatureConfigDialog();
  const handleSendClick = (schedule: boolean) => {
    return async (event: BaseSyntheticEvent) => {
      try {
        await handleSubmit(async (data) => {
          const scheduledAt = schedule ? await showScheduleMessageDialog() : null;
          // if the petition has signer contacts configured,
          // ask user if they want that contact(s) to sign all the petitions
          let bulkSendSigningMode: BulkSendSigningMode | undefined;
          if (
            data.signatureConfig &&
            data.signatureConfig.signers.length > 0 &&
            data.recipientGroups.length > 1
          ) {
            const option = await showCopySignatureConfigDialog({
              signers: data.signatureConfig.signers.filter(isDefined),
            });

            bulkSendSigningMode = option;
          }

          const isDelegatedSender = data.sendAsUser.id !== user.id;

          props.onResolve({
            recipientIdGroups: data.recipientGroups.map((group) => group.map((g) => g.id)),
            subject: data.subject,
            body: data.body,
            remindersConfig: data.remindersConfig,
            scheduledAt,
            bulkSendSigningMode,
            subscribeSender: isDelegatedSender && data.subscribeSender,
            senderId: isDelegatedSender ? data.sendAsUser.id : null,
          });
        })(event);
      } catch {}
    };
  };

  const showConfirmPetitionSignersDialog = useConfirmPetitionSignersDialog();

  const handleEditSignatureConfig = async (
    signatureConfig: AddPetitionAccessDialog_SignatureConfigFragment,
    onChange: (...event: any[]) => void,
  ) => {
    if (!petition) return;
    try {
      const { signers, allowAdditionalSigners } = await showConfirmPetitionSignersDialog({
        user,
        signatureConfig: signatureConfig,
        isUpdate: true,
        petition,
      });

      updateSignatureConfig({
        signatureConfig: {
          ...omit(signatureConfig!, [
            "allowAdditionalSigners",
            "signers",
            "integration",
            "__typename",
          ]),
          timezone: signatureConfig!.timezone,
          orgIntegrationId: signatureConfig!.integration!.id,
          signersInfo: signers,
          allowAdditionalSigners,
        },
      });

      onChange({
        ...omit(signatureConfig, ["__typename"]),
        signers,
        allowAdditionalSigners,
      });
      clearErrors("signatureConfig");
    } catch {}
  };

  const [createContactlessPetitionAccess] = useMutation(
    AddPetitionAccessDialog_createContactlessPetitionAccessDocument,
  );
  const showContactlessLinkDialog = useContactlessLinkDialog();
  const remindersConfig = watch("remindersConfig");
  const handleShareByLinkClick = useCallback(async () => {
    try {
      if (isMissingSigners) {
        setError("signatureConfig", { type: "required", message: "This field is required" });
        return;
      }
      const currentAccessLink = accesses.find((a) => a.isContactless && a.status === "ACTIVE");
      let link = currentAccessLink?.recipientUrl ?? "";

      if (!currentAccessLink) {
        const newAccess = await createContactlessPetitionAccess({
          variables: {
            petitionId,
            remindersConfig,
          },
        });

        if (isDefined(newAccess.data)) {
          link = newAccess.data.createContactlessPetitionAccess.recipientUrl!;
        }
      }

      await showContactlessLinkDialog({
        link,
        petitionId,
      });
    } catch {}
  }, [accesses, isMissingSigners, remindersConfig]);

  const { petitionsPeriod } = petition?.organization ?? {};

  return (
    <ConfirmDialog
      closeOnEsc={false}
      closeOnOverlayClick={false}
      closeOnNavigation
      initialFocusRef={recipientsRef}
      hasCloseButton
      size="2xl"
      header={
        <Flex alignItems="center">
          <FormattedMessage
            id="component.add-petition-access-dialog.header"
            defaultMessage="Who do you want to complete it?"
          />
        </Flex>
      }
      body={
        isDefined(petition) ? (
          <Stack spacing={4}>
            {!petitionsPeriod || petitionsPeriod.limit - petitionsPeriod.used <= 10 ? (
              <Alert status="warning" borderRadius="md">
                <AlertIcon color="yellow.500" />
                <Text>
                  {!petitionsPeriod || petitionsPeriod.used >= petitionsPeriod.limit ? (
                    <FormattedMessage
                      id="component.add-petition-access-dialog.petition-limit-reached"
                      defaultMessage="You reached the limit of parallels sent."
                    />
                  ) : (
                    <FormattedMessage
                      id="component.add-petition-access-dialog.petition-limit-near"
                      defaultMessage="You can send {left, plural, =1{# more parallel} other{# more parallels}}."
                      values={{ left: petitionsPeriod.limit - petitionsPeriod.used }}
                    />
                  )}
                </Text>
              </Alert>
            ) : null}
            {signatureConfig && !signatureConfig.review ? (
              <FormControl id="signatureConfig">
                <Controller
                  name="signatureConfig"
                  control={control}
                  rules={{
                    validate: () => !isMissingSigners,
                  }}
                  render={({ field: { value, onChange }, fieldState: { error } }) => (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <HStack justifyContent="space-between" width="100%">
                        <Text>
                          {!isMissingSigners ? (
                            <FormattedMessage
                              id="component.add-petition-access-dialog.add-signers-text-optional"
                              defaultMessage="Before sending, we recommend <b>including who has to sign</b> to make your recipient's job easier."
                            />
                          ) : (
                            <FormattedMessage
                              id="component.add-petition-access-dialog.add-signers-text-required"
                              defaultMessage="Before sending, <b>include the signers.</b>"
                            />
                          )}
                        </Text>
                        <Center>
                          <Button
                            variant="outline"
                            backgroundColor="white"
                            colorScheme="blue"
                            borderColor={error ? "red.500" : undefined}
                            borderWidth={error ? 2 : undefined}
                            onClick={() => handleEditSignatureConfig(value!, onChange)}
                          >
                            {value!.signers.length ? (
                              <FormattedMessage
                                id="component.add-petition-access-dialog.edit-signers"
                                defaultMessage="Edit signers"
                              />
                            ) : (
                              <FormattedMessage
                                id="component.add-petition-access-dialog.add-signers"
                                defaultMessage="Add signers"
                              />
                            )}
                          </Button>
                        </Center>
                      </HStack>
                    </Alert>
                  )}
                />
              </FormControl>
            ) : null}
            {showSendAs ? (
              <Stack>
                <FormControl id="sendAsId">
                  <FormLabel fontWeight="normal">
                    <FormattedMessage
                      id="component.add-petition-access-dialog.send-as"
                      defaultMessage="Send as..."
                    />
                  </FormLabel>
                  <Controller
                    name="sendAsUser"
                    control={control}
                    render={({ field: { value, onChange } }) =>
                      userCanSendOnBehalfOfAnyone ? (
                        <UserSelect
                          onSearch={handleSearchUsers}
                          isSearchable
                          value={value}
                          onChange={(user) => onChange(user!)}
                        />
                      ) : (
                        <UserSelect
                          isSync
                          onSearch={undefined}
                          isSearchable
                          value={value}
                          onChange={(user) => onChange(user!)}
                          options={sendAsOptions}
                        />
                      )
                    }
                  />
                </FormControl>

                {senderHasPermission ? null : (
                  <FormControl id="subscribeSender">
                    <Checkbox {...register("subscribeSender")}>
                      <Flex alignItems="center">
                        <Text as="span">
                          <FormattedMessage
                            id="component.add-petition-access-dialog.subscribe-to-notifications"
                            defaultMessage="Subscribe {name} to notifications"
                            values={{
                              name: sendAsUser.fullName,
                            }}
                          />
                        </Text>
                        <HelpPopover>
                          <FormattedMessage
                            id="component.add-petition-access-dialog.subscribe-to-notifications-description"
                            defaultMessage="Users will receive notifications about the activity of this parallel."
                          />
                        </HelpPopover>
                      </Flex>
                    </Checkbox>
                  </FormControl>
                )}
              </Stack>
            ) : null}

            <Controller
              name="recipientGroups"
              control={control}
              rules={{
                required: true,
                validate: (recipientGroups) =>
                  recipientGroups.every(
                    (g) => g.length > 0 && g.every((r) => !r.isDeleted && !r.isInvalid),
                  ),
              }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <RecipientSelectGroups
                  petition={petition}
                  recipientGroups={value}
                  onChangeRecipientGroups={onChange}
                  onSearchContacts={onSearchContacts}
                  onCreateContact={onCreateContact}
                  showErrors={!!error}
                  canAddRecipientGroups={canAddRecipientGroups}
                  maxGroups={petitionsPeriod ? petitionsPeriod.limit - petitionsPeriod.used : 0}
                />
              )}
            />

            <Controller
              name="subject"
              control={control}
              rules={{
                required: true,
                validate: (subject) => subject.length > 0,
              }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <MessageEmailSubjectFormControl
                  id={`${petition.id}-subject`}
                  isInvalid={!!error}
                  value={value}
                  onChange={(value) => {
                    updateSubject({ emailSubject: value || null });
                    onChange(value);
                  }}
                  petition={petition}
                />
              )}
            />

            <Controller
              name="body"
              control={control}
              rules={{ required: true, validate: (body) => !isEmptyRTEValue(body) }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <MessageEmailBodyFormControl
                  id={`${petition.id}-body`}
                  isInvalid={!!error}
                  value={value}
                  onChange={(value) => {
                    updateBody({ emailBody: isEmptyRTEValue(value) ? null : value });
                    onChange(value);
                  }}
                  petition={petition}
                />
              )}
            />

            <FormControl id="remindersConfig">
              <Controller
                name="remindersConfig"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <PetitionRemindersConfig
                    marginTop={2}
                    value={value}
                    onChange={(value) => {
                      updateRemindersConfig({
                        remindersConfig: value ? omit(value, ["__typename"]) : null,
                      });
                      onChange(value);
                    }}
                    defaultActive={!!value}
                  />
                )}
              />
            </FormControl>
          </Stack>
        ) : (
          <Center height="300px">
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="primary.500"
              size="xl"
            />
          </Center>
        )
      }
      alternative={
        <Button
          variant="outline"
          leftIcon={<LinkIcon />}
          onClick={handleShareByLinkClick}
          isDisabled={
            recipientGroups.some((g) => g.length > 0) ||
            !petitionsPeriod ||
            petitionsPeriod.used >= petitionsPeriod.limit
          }
        >
          <FormattedMessage id="generic.share-by-link" defaultMessage="Share by link" />
        </Button>
      }
      confirm={
        <SendButton
          isDisabled={!petitionsPeriod || petitionsPeriod.used >= petitionsPeriod.limit}
          data-action="send-petition"
          onSendClick={handleSendClick(false)}
          onScheduleClick={handleSendClick(true)}
        />
      }
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      {...props}
    />
  );
}

AddPetitionAccessDialog.fragments = {
  DelegateUser: gql`
    fragment AddPetitionAccessDialog_DelegateUser on User {
      id
      fullName
      ...UserSelect_User
    }
    ${UserSelect.fragments.User}
  `,
  User: gql`
    fragment AddPetitionAccessDialog_User on User {
      id
      fullName
      email
      delegateOf {
        ...AddPetitionAccessDialog_DelegateUser
      }
      hasOnBehalfOf: hasFeatureFlag(featureFlag: ON_BEHALF_OF)
      ...ConfirmPetitionSignersDialog_User
    }
    ${ConfirmPetitionSignersDialog.fragments.User}
  `,
  SignatureConfig: gql`
    fragment AddPetitionAccessDialog_SignatureConfig on SignatureConfig {
      review
      timezone
      title
      allowAdditionalSigners
      minSigners
      integration {
        id
      }
      signers {
        ...CopySignatureConfigDialog_PetitionSigner
      }
      ...ConfirmPetitionSignersDialog_SignatureConfig
    }
    ${CopySignatureConfigDialog.fragments.PetitionSigner}
    ${ConfirmPetitionSignersDialog.fragments.SignatureConfig}
  `,
  PetitionAccess: gql`
    fragment AddPetitionAccessDialog_PetitionAccess on PetitionAccess {
      id
      status
      isContactless
      recipientUrl
    }
  `,
  Petition: gql`
    fragment AddPetitionAccessDialog_Petition on Petition {
      id
      emailSubject
      emailBody
      myEffectivePermission {
        permissionType
      }
      effectivePermissions {
        isSubscribed
        user {
          id
        }
      }
      ...ConfirmPetitionSignersDialog_Petition
      signatureConfig {
        timezone
        ...AddPetitionAccessDialog_SignatureConfig
        ...ConfirmPetitionSignersDialog_SignatureConfig
      }
      remindersConfig {
        ...PetitionRemindersConfig_RemindersConfig
      }
      organization {
        id
        petitionsPeriod: currentUsagePeriod(limitName: PETITION_SEND) {
          id
          limit
          used
        }
      }
      accesses {
        ...AddPetitionAccessDialog_PetitionAccess
      }
      defaultOnBehalf {
        ...AddPetitionAccessDialog_DelegateUser
      }
      ...MessageEmailSubjectFormControl_PetitionBase
      ...RecipientSelectGroups_Petition
    }

    ${ConfirmPetitionSignersDialog.fragments.Petition}
    ${ConfirmPetitionSignersDialog.fragments.SignatureConfig}
    ${PetitionRemindersConfig.fragments.RemindersConfig}
    ${MessageEmailSubjectFormControl.fragments.PetitionBase}
    ${RecipientSelectGroups.fragments.Petition}
  `,
};

const _queries = [
  gql`
    query AddPetitionAccessDialog_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        ...AddPetitionAccessDialog_Petition
      }
    }
    ${AddPetitionAccessDialog.fragments.Petition}
  `,
];

AddPetitionAccessDialog.mutations = [
  gql`
    mutation AddPetitionAccessDialog_createContactlessPetitionAccess(
      $petitionId: GID!
      $remindersConfig: RemindersConfigInput
    ) {
      createContactlessPetitionAccess(petitionId: $petitionId, remindersConfig: $remindersConfig) {
        id
        recipientUrl
        petition {
          ...AddPetitionAccessDialog_Petition
        }
      }
    }
    ${AddPetitionAccessDialog.fragments.Petition}
  `,
];

export function useAddPetitionAccessDialog() {
  return useDialog(AddPetitionAccessDialog);
}

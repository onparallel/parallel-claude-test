import { gql, useMutation } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  Heading,
  HStack,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import { LinkIcon } from "@parallel/chakra/icons";
import {
  ContactSelectProps,
  ContactSelectSelection,
} from "@parallel/components/common/ContactSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { UserSelect } from "@parallel/components/common/UserSelect";
import {
  ConfirmPetitionSignersDialog,
  useConfirmPetitionSignersDialog,
} from "@parallel/components/petition-common/dialogs/ConfirmPetitionSignersDialog";
import {
  CopySignatureConfigDialog,
  useCopySignatureConfigDialog,
} from "@parallel/components/petition-compose/dialogs/CopySignatureConfigDialog";
import { useScheduleMessageDialog } from "@parallel/components/petition-compose/dialogs/ScheduleMessageDialog";
import { PetitionRemindersConfig } from "@parallel/components/petition-compose/PetitionRemindersConfig";
import {
  AddPetitionAccessDialog_createPetitionAccessDocument,
  AddPetitionAccessDialog_PetitionFragment,
  AddPetitionAccessDialog_UserFragment,
  BulkSendSigningMode,
  RemindersConfig,
  SignatureConfigInputSigner,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { emptyRTEValue } from "@parallel/utils/slate/RichTextEditor/emptyRTEValue";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { Maybe } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useSearchContactsByEmail } from "@parallel/utils/useSearchContactsByEmail";
import { useCallback, useMemo, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { isDefined, noop, omit, pick } from "remeda";
import { HelpPopover } from "../../common/HelpPopover";
import { RecipientSelectGroups } from "../../common/RecipientSelectGroups";
import { MessageEmailEditor } from "../../petition-common/MessageEmailEditor";
import { SendButton } from "../../petition-common/SendButton";
import { useContactlessLinkDialog } from "./ContactlessLinkDialog";

export type AddPetitionAccessDialogProps = {
  onSearchContacts?: ContactSelectProps["onSearchContacts"];
  onCreateContact?: ContactSelectProps["onCreateContact"];
  onUpdatePetition?: (data: UpdatePetitionInput) => void;
  canAddRecipientGroups?: boolean;
  petition: AddPetitionAccessDialog_PetitionFragment;
  user: AddPetitionAccessDialog_UserFragment;
};

export type AddPetitionAccessDialogResult = {
  recipientIdGroups: string[][];
  subject: string;
  body: RichTextEditorValue;
  remindersConfig: Maybe<RemindersConfig>;
  scheduledAt: Maybe<Date>;
  bulkSendSigningMode?: BulkSendSigningMode;
  subscribeSender: boolean;
  senderId: string | null;
};

export function AddPetitionAccessDialog({
  user,
  petition,
  canAddRecipientGroups,
  onUpdatePetition = noop,
  // TODO: fix this
  onSearchContacts = useSearchContacts(),
  onCreateContact = useCreateContact(),
  ...props
}: DialogProps<AddPetitionAccessDialogProps, AddPetitionAccessDialogResult>) {
  const [showErrors, setShowErrors] = useState(false);
  const [recipientGroups, setRecipientGroups] = useState<ContactSelectSelection[][]>([[]]);
  const [sendAsId, setSendAsId] = useState(user.id);
  const [accesses, setAccesses] = useState(petition.accesses);

  const [subscribeSender, setSubscribeSender] = useState(false);
  const [subject, setSubject] = useState(petition.emailSubject ?? "");
  const [body, setBody] = useState<RichTextEditorValue>(petition.emailBody ?? emptyRTEValue());
  const [remindersConfig, setRemindersConfig] = useState<Maybe<RemindersConfig>>(
    petition.remindersConfig ? omit(petition.remindersConfig, ["__typename"]) : null
  );
  const [signatureConfig, setSignatureConfig] = useState(() =>
    petition.signatureConfig
      ? {
          ...pick(petition.signatureConfig, ["allowAdditionalSigners", "review"]),
          signers: petition.signatureConfig.signers as SignatureConfigInputSigner[],
        }
      : null
  );

  const showSendAs =
    user.hasOnBehalfOf &&
    user.delegateOf.length &&
    petition.myEffectivePermission?.permissionType === "OWNER";

  const senderHasPermission = petition.effectivePermissions.some((p) => p.user.id === sendAsId);

  const sendAsOptions = useMemo(() => [user, ...user.delegateOf], [user]);

  const handleSearchContactsByEmail = useSearchContactsByEmail();

  const [updateSubject, updateBody, updateRemindersConfig] = [
    useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]),
    useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]),
    useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]),
  ];

  const handleSubjectChange = useCallback(
    (value: string) => {
      setSubject(value);
      updateSubject({ emailSubject: value || null });
    },
    [updateSubject]
  );

  const handleBodyChange = useCallback(
    (value: RichTextEditorValue) => {
      setBody(value);
      updateBody({ emailBody: isEmptyRTEValue(value) ? null : value });
    },
    [updateBody]
  );

  const handleRemindersConfigChange = useCallback(
    (value: Maybe<RemindersConfig>) => {
      setRemindersConfig(value);
      updateRemindersConfig({
        remindersConfig: value ? omit(value, ["__typename"]) : null,
      });
    },
    [updateRemindersConfig]
  );

  const recipientsRef = useRef<HTMLInputElement>(null);

  const isValid = Boolean(
    subject &&
      !isEmptyRTEValue(body) &&
      recipientGroups.every((g) => g.length > 0 && g.every((r) => !r.isInvalid && !r.isDeleted))
  );

  const showScheduleMessageDialog = useScheduleMessageDialog();
  const showCopySignatureConfigDialog = useCopySignatureConfigDialog();
  const handleSendClick = async (schedule: boolean) => {
    try {
      if (!isValid) {
        setShowErrors(true);
        return;
      }
      const scheduledAt = schedule ? await showScheduleMessageDialog({}) : null;

      // if the petition has signer contacts configured,
      // ask user if they want that contact(s) to sign all the petitions
      let bulkSendSigningMode: BulkSendSigningMode | undefined;
      if (
        petition.signatureConfig &&
        petition.signatureConfig.signers.length > 0 &&
        recipientGroups.length > 1
      ) {
        const option = await showCopySignatureConfigDialog({
          signers: petition.signatureConfig.signers.filter(isDefined),
        });

        bulkSendSigningMode = option;
      }

      const isDelegatedSender = sendAsId !== user.id;

      props.onResolve({
        recipientIdGroups: recipientGroups.map((group) => group.map((g) => g.id)),
        subject,
        body,
        remindersConfig,
        scheduledAt,
        bulkSendSigningMode,
        subscribeSender: isDelegatedSender && subscribeSender,
        senderId: isDelegatedSender ? sendAsId : null,
      });
    } catch {}
  };

  const showConfirmPetitionSignersDialog = useConfirmPetitionSignersDialog();

  const handleEditPetitionSigners = async () => {
    try {
      const { signers, allowAdditionalSigners } = await showConfirmPetitionSignersDialog({
        user,
        accesses: petition.accesses,
        presetSigners: signatureConfig?.signers ?? [],
        allowAdditionalSigners: signatureConfig?.allowAdditionalSigners ?? false,
        isUpdate: true,
        previousSignatures: petition.signatureRequests,
      });

      setSignatureConfig({
        signers,
        allowAdditionalSigners,
        review: petition.signatureConfig!.review,
      });

      await onUpdatePetition({
        signatureConfig: {
          ...omit(petition.signatureConfig!, [
            "allowAdditionalSigners",
            "signers",
            "integration",
            "__typename",
          ]),
          orgIntegrationId: petition.signatureConfig!.integration!.id,
          signersInfo: signers,
          allowAdditionalSigners,
        },
      });
    } catch {}
  };

  const [createPetitionAccess] = useMutation(AddPetitionAccessDialog_createPetitionAccessDocument);
  const showContactlessLinkDialog = useContactlessLinkDialog();
  const handleShareByLinkClick = useCallback(async () => {
    try {
      const currentAccessLink = accesses.find((a) => a.isContactless && a.status === "ACTIVE");
      let link = currentAccessLink?.recipientUrl ?? "";

      if (!currentAccessLink) {
        const newAccess = await createPetitionAccess({
          variables: {
            petitionId: petition.id,
          },
        });

        if (isDefined(newAccess.data)) {
          link = newAccess.data.createPetitionAccess.recipientUrl;
          setAccesses(newAccess.data.createPetitionAccess.petition!.accesses);
        }
      }

      const data = await showContactlessLinkDialog({
        link,
        petitionId: petition.id,
      });
      if (data.forceClose) {
        props.onReject();
      }
    } catch {}
  }, [accesses]);

  const { used, limit } = petition.organization.usageLimits.petitions;

  return (
    <ConfirmDialog
      id="send-petition-dialog"
      closeOnEsc={false}
      closeOnOverlayClick={false}
      initialFocusRef={recipientsRef}
      hasCloseButton
      size="2xl"
      header={
        <Flex alignItems="center">
          <FormattedMessage
            id="petition.add-access.header"
            defaultMessage="Who do you want to send it to?"
          />
          {canAddRecipientGroups ? (
            <HelpPopover
              popoverWidth="container.2xs"
              color="blue.200"
              _hover={{ color: "blue.300" }}
            >
              <Stack direction="row">
                <Stack flex="1" alignItems="flex-start">
                  <Image
                    height="40px"
                    marginRight={2}
                    src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/recipient-collaboration.svg`}
                  />
                  <Heading size="sm">
                    <FormattedMessage
                      id="component.add-petition-access-dialog.recipients-label"
                      defaultMessage="Recipients"
                    />
                  </Heading>
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="component.add-petition-access-dialog.recipients-description"
                      defaultMessage="Will reply to the same parallel collaboratively."
                    />
                  </Text>
                </Stack>
                <Stack flex="1" alignItems="flex-start">
                  <Image
                    height="40px"
                    marginRight={2}
                    src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/recipient-groups.svg`}
                  />
                  <Heading size="sm">
                    <FormattedMessage
                      id="component.add-petition-access-dialog.recipient-groups-label"
                      defaultMessage="Recipient groups"
                    />
                  </Heading>
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="component.add-petition-access-dialog.recipient-groups-description"
                      defaultMessage="Each group will reply to different parallels."
                    />
                  </Text>
                </Stack>
              </Stack>
            </HelpPopover>
          ) : null}
        </Flex>
      }
      body={
        <>
          {limit - used <= 10 ? (
            <Alert status="warning" borderRadius="md" mb={2}>
              <AlertIcon color="yellow.500" />
              <Text>
                {limit === used ? (
                  <FormattedMessage
                    id="component.add-petition-access-dialog.petition-limit-reached.text"
                    defaultMessage="You reached the limit of parallels sent."
                  />
                ) : (
                  <FormattedMessage
                    id="component.add-petition-access-dialog.petition-limit-near.text"
                    defaultMessage="You can send {left, plural, =1{# more parallel} other{# more parallels}}."
                    values={{ left: limit - used }}
                  />
                )}
              </Text>
            </Alert>
          ) : null}
          {signatureConfig && !signatureConfig.review ? (
            <Alert status="info" borderRadius="md" mb={2}>
              <AlertIcon />
              <HStack>
                <Text>
                  <FormattedMessage
                    id="component.add-petition-access-dialog.add-signers-text"
                    defaultMessage="Before sending, we recommend <b>including who has to sign</b> to make your recipient's job easier."
                  />
                </Text>
                <Center>
                  <Button
                    variant="outline"
                    backgroundColor="white"
                    colorScheme="blue"
                    onClick={handleEditPetitionSigners}
                  >
                    {signatureConfig.signers.length ? (
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
          ) : null}
          {showSendAs ? (
            <Stack paddingBottom={4}>
              <Text>
                <FormattedMessage
                  id="component.add-petition-access-dialog.send-as"
                  defaultMessage="Send as..."
                />
              </Text>
              <UserSelect
                isSync
                onSearch={undefined}
                isSearchable
                value={sendAsId}
                onChange={(user) => setSendAsId(user!.id)}
                options={sendAsOptions}
              />
              {senderHasPermission ? null : (
                <Checkbox
                  isChecked={subscribeSender}
                  colorScheme="primary"
                  onChange={(event) => setSubscribeSender(event.target.checked)}
                >
                  <Flex alignItems="center">
                    <Text as="span">
                      <FormattedMessage
                        id="component.add-petition-access-dialog.subscribe-to-notifications"
                        defaultMessage="Subscribe {name} to notifications"
                        values={{
                          name: user.delegateOf.find((u) => u.id === sendAsId)?.fullName,
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
              )}
            </Stack>
          ) : null}
          <RecipientSelectGroups
            recipientGroups={recipientGroups}
            onChangeRecipientGroups={setRecipientGroups}
            onSearchContacts={onSearchContacts}
            onCreateContact={onCreateContact}
            onSearchContactsByEmail={handleSearchContactsByEmail}
            showErrors={showErrors}
            canAddRecipientGroups={canAddRecipientGroups}
          />
          <Box marginTop={4}>
            <MessageEmailEditor
              id={petition.id}
              showErrors={showErrors}
              subject={subject}
              body={body}
              onSubjectChange={handleSubjectChange}
              onBodyChange={handleBodyChange}
            />
          </Box>
          <PetitionRemindersConfig
            marginTop={2}
            value={remindersConfig}
            onChange={handleRemindersConfigChange}
            defaultActive={Boolean(remindersConfig)}
          />
        </>
      }
      confirm={
        <Flex justifyContent="space-between" w="full" wrap="wrap" gridGap={2}>
          <Button
            variant="outline"
            leftIcon={<LinkIcon />}
            width={{ base: "full", sm: "fit-content" }}
            onClick={handleShareByLinkClick}
            isDisabled={recipientGroups.some((g) => g.length > 0)}
          >
            <FormattedMessage id="generic.share-by-link" defaultMessage="Share by link" />
          </Button>
          <HStack spacing={0} gridGap={2} width={{ base: "full", sm: "fit-content" }}>
            <Box width="full">
              <Button onClick={() => props.onReject()} width="full">
                <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
              </Button>
            </Box>
            <SendButton
              data-action="send-petition"
              onSendClick={() => handleSendClick(false)}
              onScheduleClick={() => handleSendClick(true)}
              width="full"
            />
          </HStack>
        </Flex>
      }
      cancel={<></>}
      {...props}
    />
  );
}

AddPetitionAccessDialog.fragments = {
  User: gql`
    fragment AddPetitionAccessDialog_User on User {
      id
      fullName
      email
      delegateOf {
        id
        fullName
        email
      }
      hasOnBehalfOf: hasFeatureFlag(featureFlag: ON_BEHALF_OF)
      ...ConfirmPetitionSignersDialog_User
    }
    ${ConfirmPetitionSignersDialog.fragments.User}
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
      signatureRequests {
        ...ConfirmPetitionSignersDialog_PetitionSignatureRequest
      }
      signatureConfig {
        review
        timezone
        title
        allowAdditionalSigners
        integration {
          id
        }
        signers {
          ...CopySignatureConfigDialog_PetitionSigner
          ...ConfirmPetitionSignersDialog_PetitionSigner
        }
      }
      remindersConfig {
        offset
        time
        timezone
        weekdaysOnly
      }
      organization {
        id
        usageLimits {
          petitions {
            limit
            used
          }
        }
      }
      accesses {
        isContactless
        recipientUrl
        ...ConfirmPetitionSignersDialog_PetitionAccess
      }
    }
    ${CopySignatureConfigDialog.fragments.PetitionSigner}
    ${ConfirmPetitionSignersDialog.fragments.PetitionSigner}
    ${ConfirmPetitionSignersDialog.fragments.PetitionAccess}
    ${ConfirmPetitionSignersDialog.fragments.PetitionSignatureRequest}
  `,
};

AddPetitionAccessDialog.mutations = [
  gql`
    mutation AddPetitionAccessDialog_createPetitionAccess($petitionId: GID!) {
      createPetitionAccess(petitionId: $petitionId) {
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

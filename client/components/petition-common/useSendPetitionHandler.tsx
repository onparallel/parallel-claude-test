import { gql, useMutation } from "@apollo/client";
import { Progress, Stack, Text, useToast } from "@chakra-ui/react";
import { useBlockingDialog } from "@parallel/components/common/dialogs/BlockingDialog";
import {
  AddPetitionAccessDialog,
  useAddPetitionAccessDialog,
} from "@parallel/components/petition-activity/dialogs/AddPetitionAccessDialog";
import { useHandledTestSignatureDialog } from "@parallel/components/petition-compose/dialogs/TestSignatureDialog";
import {
  UpdatePetitionInput,
  useSendPetitionHandler_addPetitionPermissionDocument,
  useSendPetitionHandler_PetitionFragment,
  useSendPetitionHandler_sendPetitionDocument,
  useSendPetitionHandler_UserFragment,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { FORMATS } from "@parallel/utils/dates";
import { withError } from "@parallel/utils/promises/withError";
import { usePetitionLimitReachedErrorDialog } from "@parallel/utils/usePetitionLimitReachedErrorDialog";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

export function useSendPetitionHandler(
  user: useSendPetitionHandler_UserFragment,
  petition: useSendPetitionHandler_PetitionFragment | null,
  onUpdatePetition: (data: UpdatePetitionInput) => Promise<any>,
  validator: () => Promise<boolean>,
  onRefetch?: () => void,
  options: { redirect: boolean } = { redirect: true }
) {
  const intl = useIntl();
  const router = useRouter();
  const toast = useToast();

  const [sendPetition] = useMutation(useSendPetitionHandler_sendPetitionDocument);
  const [addPetitionPermission] = useMutation(useSendPetitionHandler_addPetitionPermissionDocument);

  const showAddPetitionAccessDialog = useAddPetitionAccessDialog();
  const showLongBulkSendDialog = useBlockingDialog();
  const showPetitionLimitReachedErrorDialog = usePetitionLimitReachedErrorDialog();
  const showTestSignatureDialog = useHandledTestSignatureDialog();
  const handleSearchContacts = useSearchContacts();

  return useCallback(async () => {
    if (!petition || !(await validator())) return;

    try {
      const currentRecipientIds = petition.accesses
        .filter((a) => isDefined(a.contact) && a.status === "ACTIVE")
        .map((a) => a.contact!.id);

      await showTestSignatureDialog(
        petition.signatureConfig?.integration?.environment,
        petition.signatureConfig?.integration?.name
      );

      const {
        recipientIdGroups,
        subject,
        body,
        remindersConfig,
        scheduledAt,
        bulkSendSigningMode,
        subscribeSender,
        senderId,
      } = await showAddPetitionAccessDialog({
        user,
        petition,
        onUpdatePetition,
        canAddRecipientGroups: petition.accesses.length === 0, // can only do a bulk send if the petition has no accesses yet
        onSearchContacts: async (search: string, exclude: string[]) =>
          await handleSearchContacts(search, [...exclude, ...currentRecipientIds]),
      });
      const task = sendPetition({
        variables: {
          petitionId: petition.id,
          contactIdGroups: recipientIdGroups,
          subject,
          body,
          remindersConfig,
          scheduledAt: scheduledAt?.toISOString() ?? null,
          bulkSendSigningMode,
          senderId,
        },
      });
      if (recipientIdGroups.length > 20) {
        await withError(
          showLongBulkSendDialog({
            task,
            header: (
              <FormattedMessage
                id="petition.long-batch-send-dialog.header"
                defaultMessage="Sending parallels"
              />
            ),
            body: (
              <Stack spacing={4}>
                <Text>
                  <FormattedMessage
                    id="petition.long-batch-send-dialog.message"
                    defaultMessage="We are sending your parallels. It might take a little bit, please wait."
                  />
                </Text>
                <Progress isIndeterminate size="sm" borderRadius="full" />
              </Stack>
            ),
          })
        );
      }
      const { data } = await task;
      if (data?.sendPetition.some((r) => r.result !== "SUCCESS")) {
        toast({
          isClosable: true,
          status: "error",
          title: intl.formatMessage({
            id: "petition.petition-send-error.title",
            defaultMessage: "Error",
          }),
          description: intl.formatMessage({
            id: "petition.petition-send-error.description",
            defaultMessage:
              "There was an error sending your parallel. Try again and, if it fails, reach out to support for help.",
          }),
        });
        return;
      }
      if (senderId) {
        await addPetitionPermission({
          variables: {
            petitionIds: [petition.id],
            userIds: [senderId],
            userGroupIds: null,
            permissionType: "WRITE",
            notify: false,
            subscribe: subscribeSender,
            message: null,
          },
        });
      }
      if (scheduledAt) {
        toast({
          isClosable: true,
          status: "info",
          title: intl.formatMessage(
            {
              id: "petition.petition-scheduled-toast.title",
              defaultMessage: "{count, plural, =1{Parallel} other{Parallels}} scheduled",
            },
            { count: recipientIdGroups.length }
          ),
          description: intl.formatMessage(
            {
              id: "petition.petition-scheduled-toast.description",
              defaultMessage:
                "Your {count, plural, =1{parallel} other{parallels}} will be sent on {date}.",
            },
            {
              count: recipientIdGroups.length,
              date: intl.formatTime(scheduledAt!, FORMATS.LLL),
            }
          ),
        });
      } else {
        toast({
          isClosable: true,
          status: "success",
          title: intl.formatMessage(
            {
              id: "petition.petition-sent-toast.title",
              defaultMessage: "{count, plural, =1{Parallel} other{Parallels}} sent",
            },
            { count: recipientIdGroups.length }
          ),
          description: intl.formatMessage(
            {
              id: "petition.petition-sent-toast.description",
              defaultMessage:
                "Your {count, plural, =1{parallel is on its} other{parallels are on their}} way.",
            },
            { count: recipientIdGroups.length }
          ),
        });
      }
      if (options.redirect) {
        router.push("/app/petitions");
      }
      onRefetch?.();
    } catch (e) {
      if (isApolloError(e, "PETITION_SEND_CREDITS_ERROR")) {
        await withError(showPetitionLimitReachedErrorDialog());
      }
    }
  }, [
    petition,
    onUpdatePetition,
    validator,
    showPetitionLimitReachedErrorDialog,
    showTestSignatureDialog,
  ]);
}

useSendPetitionHandler.fragments = {
  User: gql`
    fragment useSendPetitionHandler_User on User {
      ...AddPetitionAccessDialog_User
    }
    ${AddPetitionAccessDialog.fragments.User}
  `,
  Petition: gql`
    fragment useSendPetitionHandler_Petition on Petition {
      id
      accesses {
        contact {
          id
        }
      }
      signatureConfig {
        integration {
          id
          environment
          name
        }
      }
      ...AddPetitionAccessDialog_Petition
    }
    ${AddPetitionAccessDialog.fragments.Petition}
  `,
};

useSendPetitionHandler.mutations = [
  gql`
    mutation useSendPetitionHandler_sendPetition(
      $petitionId: GID!
      $contactIdGroups: [[GID!]!]!
      $subject: String!
      $body: JSON!
      $remindersConfig: RemindersConfigInput
      $scheduledAt: DateTime
      $bulkSendSigningMode: BulkSendSigningMode
      $senderId: GID
    ) {
      sendPetition(
        petitionId: $petitionId
        contactIdGroups: $contactIdGroups
        subject: $subject
        body: $body
        remindersConfig: $remindersConfig
        scheduledAt: $scheduledAt
        bulkSendSigningMode: $bulkSendSigningMode
        senderId: $senderId
      ) {
        result
        petition {
          id
          status
        }
      }
    }
  `,
  gql`
    mutation useSendPetitionHandler_addPetitionPermission(
      $petitionIds: [GID!]!
      $userIds: [GID!]
      $userGroupIds: [GID!]
      $permissionType: PetitionPermissionTypeRW!
      $notify: Boolean
      $subscribe: Boolean
      $message: String
    ) {
      addPetitionPermission(
        petitionIds: $petitionIds
        userIds: $userIds
        userGroupIds: $userGroupIds
        permissionType: $permissionType
        notify: $notify
        subscribe: $subscribe
        message: $message
      ) {
        ...useSendPetitionHandler_Petition
      }
    }
    ${useSendPetitionHandler.fragments.Petition}
  `,
];

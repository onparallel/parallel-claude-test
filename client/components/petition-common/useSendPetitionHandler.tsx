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
  useSendPetitionHandler_bulkSendPetitionDocument,
  useSendPetitionHandler_PetitionFragment,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { FORMATS } from "@parallel/utils/dates";
import { withError } from "@parallel/utils/promises/withError";
import { usePetitionLimitReachedErrorDialog } from "@parallel/utils/usePetitionLimitReachedErrorDialog";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export function useSendPetitionHandler(
  petition: useSendPetitionHandler_PetitionFragment | null,
  onUpdatePetition: (data: UpdatePetitionInput) => Promise<any>,
  validator: () => Promise<boolean>
) {
  const intl = useIntl();
  const router = useRouter();
  const toast = useToast();

  const [bulkSendPetition] = useMutation(useSendPetitionHandler_bulkSendPetitionDocument);
  const showAddPetitionAccessDialog = useAddPetitionAccessDialog();
  const showLongBulkSendDialog = useBlockingDialog();
  const showPetitionLimitReachedErrorDialog = usePetitionLimitReachedErrorDialog();
  const showTestSignatureDialog = useHandledTestSignatureDialog();

  return useCallback(async () => {
    if (!petition || !(await validator())) return;

    try {
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
      } = await showAddPetitionAccessDialog({
        petition,
        onUpdatePetition,
        canAddRecipientGroups: true,
      });
      const task = bulkSendPetition({
        variables: {
          petitionId: petition.id,
          contactIdGroups: recipientIdGroups,
          subject,
          body,
          remindersConfig,
          scheduledAt: scheduledAt?.toISOString() ?? null,
          bulkSendSigningMode,
        },
      });
      if (recipientIdGroups.length > 20) {
        await withError(
          showLongBulkSendDialog({
            task,
            header: (
              <FormattedMessage
                id="petition.long-batch-send-dialog.header"
                defaultMessage="Sending petitions"
              />
            ),
            body: (
              <Stack spacing={4}>
                <Text>
                  <FormattedMessage
                    id="petition.long-batch-send-dialog.message"
                    defaultMessage="We are sending your petitions. It might take a little bit, please wait."
                  />
                </Text>
                <Progress isIndeterminate size="sm" borderRadius="full" />
              </Stack>
            ),
          })
        );
      }
      const { data } = await task;
      if (data?.bulkSendPetition.some((r) => r.result !== "SUCCESS")) {
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
              "There was an error sending your petition. Try again and, if it fails, reach out to support for help.",
          }),
        });
        return;
      }
      if (scheduledAt) {
        toast({
          isClosable: true,
          status: "info",
          title: intl.formatMessage(
            {
              id: "petition.petition-scheduled-toast.title",
              defaultMessage: "{count, plural, =1{Petition} other{Petitions}} scheduled",
            },
            { count: recipientIdGroups.length }
          ),
          description: intl.formatMessage(
            {
              id: "petition.petition-scheduled-toast.description",
              defaultMessage:
                "Your {count, plural, =1{petition} other{petitions}} will be sent on {date}.",
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
              defaultMessage: "{count, plural, =1{Petition} other{Petitions}} sent",
            },
            { count: recipientIdGroups.length }
          ),
          description: intl.formatMessage(
            {
              id: "petition.petition-sent-toast.description",
              defaultMessage:
                "Your {count, plural, =1{petition is on its} other{petitions are on their}} way.",
            },
            { count: recipientIdGroups.length }
          ),
        });
      }
      router.push("/app/petitions");
    } catch (e) {
      if (
        isApolloError(e) &&
        e.graphQLErrors[0]?.extensions?.code === "PETITION_SEND_CREDITS_ERROR"
      ) {
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
  Petition: gql`
    fragment useSendPetitionHandler_Petition on Petition {
      id
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
    mutation useSendPetitionHandler_bulkSendPetition(
      $petitionId: GID!
      $contactIdGroups: [[GID!]!]!
      $subject: String!
      $body: JSON!
      $remindersConfig: RemindersConfigInput
      $scheduledAt: DateTime
      $bulkSendSigningMode: BulkSendSigningMode
    ) {
      bulkSendPetition(
        petitionId: $petitionId
        contactIdGroups: $contactIdGroups
        subject: $subject
        body: $body
        remindersConfig: $remindersConfig
        scheduledAt: $scheduledAt
        bulkSendSigningMode: $bulkSendSigningMode
      ) {
        result
        petition {
          id
          status
        }
      }
    }
  `,
];

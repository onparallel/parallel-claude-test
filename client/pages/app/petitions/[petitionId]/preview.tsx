import { gql, useMutation } from "@apollo/client";
import { Alert, AlertIcon, Box, Flex, Progress, Stack, Text, useToast } from "@chakra-ui/react";
import { ArrowForwardIcon } from "@parallel/chakra/icons";
import { useBlockingDialog } from "@parallel/components/common/dialogs/BlockingDialog";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { Spacer } from "@parallel/components/common/Spacer";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import {
  AddPetitionAccessDialog,
  useAddPetitionAccessDialog,
} from "@parallel/components/petition-activity/dialogs/AddPetitionAccessDialog";
import { useTestSignatureDialog } from "@parallel/components/petition-compose/dialogs/TestSignatureDialog";
import { PetitionLimitReachedAlert } from "@parallel/components/petition-compose/PetitionLimitReachedAlert";
import { PreviewPetitionField } from "@parallel/components/petition-preview/PreviewPetitionField";
import { RecipientViewContentsCard } from "@parallel/components/recipient-view/RecipientViewContentsCard";
import { RecipientViewPagination } from "@parallel/components/recipient-view/RecipientViewPagination";
import { RecipientViewProgressFooter } from "@parallel/components/recipient-view/RecipientViewProgressFooter";
import {
  PetitionCompose_batchSendPetitionDocument,
  PetitionPreview_PetitionBaseFragment,
  PetitionPreview_petitionDocument,
  PetitionPreview_updatePetitionDocument,
  PetitionPreview_userDocument,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { withError } from "@parallel/utils/promises/withError";
import { UnwrapPromise } from "@parallel/utils/types";
import { useGetPageFields } from "@parallel/utils/useGetPageFields";
import { usePetitionLimitReachedErrorDialog } from "@parallel/utils/usePetitionLimitReachedErrorDialog";
import { usePetitionStateWrapper, withPetitionState } from "@parallel/utils/usePetitionState";
import { useUserPreference } from "@parallel/utils/useUserPreference";
import { validatePetitionFields } from "@parallel/utils/validatePetitionFields";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import scrollIntoView from "smooth-scroll-into-view-if-needed";

type PetitionPreviewProps = UnwrapPromise<ReturnType<typeof PetitionPreview.getInitialProps>>;

function PetitionPreview({ petitionId }: PetitionPreviewProps) {
  const intl = useIntl();
  const router = useRouter();
  const toast = useToast();

  const { query } = router;
  const {
    data: { me },
  } = useAssertQuery(PetitionPreview_userDocument);
  const { data } = useAssertQuery(PetitionPreview_petitionDocument, {
    variables: { id: petitionId },
  });

  const [finalized, setFinalized] = useState(false);

  const wrapper = usePetitionStateWrapper();

  const [updatePetition] = useMutation(PetitionPreview_updatePetitionDocument);
  const handleUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { petitionId, data } });
    }),
    [petitionId]
  );

  const petition = data!.petition as PetitionPreview_PetitionBaseFragment;
  const isPetition = petition.__typename === "Petition";

  const pageCount =
    petition.fields.filter((f) => f.type === "HEADING" && f.options!.hasPageBreak).length + 1;

  const currentPage = Number(query.page) || 1;

  const { fields, pages, visibility } = useGetPageFields(petition.fields, currentPage, !isPetition);

  const breakpoint = "md";

  const [showTestSignatureDialogUserPreference, setShowTestSignatureDialogUserPreference] =
    useUserPreference("show-test-signature-dialog", true);
  const showTestSignatureDialog = useTestSignatureDialog();

  const showErrorDialog = useErrorDialog();

  const _validPetitionFields = async () => {
    if (!petition) return false;
    const { error, errorMessage, field } = validatePetitionFields(petition.fields);
    if (error) {
      await withError(showErrorDialog({ message: errorMessage }));
      if (error === "NO_REPLIABLE_FIELDS") {
        document.querySelector<HTMLButtonElement>("#menu-button-big-add-field-button")?.click();
      } else if (field) {
        const node = document.querySelector(`#field-${field.id}`);
        await scrollIntoView(node!, { block: "center", behavior: "smooth" });
      }
      return false;
    }
    return true;
  };

  const [batchSendPetition] = useMutation(PetitionCompose_batchSendPetitionDocument);
  const showAddPetitionAccessDialog = useAddPetitionAccessDialog();
  const showLongBatchSendDialog = useBlockingDialog();
  const showPetitionLimitReachedErrorDialog = usePetitionLimitReachedErrorDialog();
  const handleNextClick = useCallback(async () => {
    if (petition?.__typename !== "Petition") {
      throw new Error("Can't send a template");
    }

    const isFieldsValid = await _validPetitionFields();
    if (!isFieldsValid) return;

    try {
      if (
        showTestSignatureDialogUserPreference &&
        petition.signatureConfig?.integration?.environment === "DEMO"
      ) {
        const { dontShow } = await showTestSignatureDialog({
          integrationName: petition.signatureConfig.integration.name,
        });
        if (dontShow) {
          setShowTestSignatureDialogUserPreference(false);
        }
      }

      const {
        recipientIdGroups,
        subject,
        body,
        remindersConfig,
        scheduledAt,
        batchSendSigningMode,
      } = await showAddPetitionAccessDialog({
        petition,
        onUpdatePetition: handleUpdatePetition,
        canAddRecipientGroups: true,
      });
      const task = batchSendPetition({
        variables: {
          petitionId: petition.id,
          contactIdGroups: recipientIdGroups,
          subject,
          body,
          remindersConfig,
          scheduledAt: scheduledAt?.toISOString() ?? null,
          batchSendSigningMode,
        },
      });
      if (recipientIdGroups.length > 20) {
        await withError(
          showLongBatchSendDialog({
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
      if (data?.batchSendPetition.some((r) => r.result !== "SUCCESS")) {
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
  }, [petition, showPetitionLimitReachedErrorDialog, showTestSignatureDialogUserPreference]);

  const handleFinalize = useCallback(
    async function () {
      try {
        setFinalized(true);
        const canFinalize = petition.fields.every(
          (f, index) =>
            !visibility[index] ||
            f.validated ||
            f.optional ||
            completedFieldReplies(f).length > 0 ||
            f.isReadOnly
        );
        if (canFinalize) {
          // TODO: Handle finalize in preview petition
        } else {
          // go to first repliable field without replies
          let page = 1;
          const field = petition.fields.find((field, index) => {
            if (field.type === "HEADING" && field.options.hasPageBreak) {
              page += 1;
            }
            return (
              visibility[index] &&
              !completedFieldReplies(field).length &&
              !field.optional &&
              !field.validated &&
              !field.isReadOnly
            );
          })!;

          router.push(`/app/petitions/${query.petitionId}/preview?page=${page}#field-${field.id}`);
        }
      } catch {}
    },
    [petition.fields, visibility, router, query]
  );

  const displayPetitionLimitReachedAlert =
    me.organization.usageLimits.petitions.limit <= me.organization.usageLimits.petitions.used &&
    isPetition &&
    petition.status === "DRAFT";

  return (
    <ToneProvider value={petition.tone}>
      <PetitionLayout
        key={petition.id}
        user={me}
        petition={petition}
        onUpdatePetition={handleUpdatePetition}
        section="preview"
        scrollBody
        headerActions={
          isPetition && petition.status === "DRAFT" ? (
            <ResponsiveButtonIcon
              data-action="compose-next"
              id="petition-next"
              colorScheme="purple"
              icon={<ArrowForwardIcon fontSize="18px" />}
              label={intl.formatMessage({
                id: "generic.next",
                defaultMessage: "Next",
              })}
              onClick={handleNextClick}
            />
          ) : null
        }
        subHeader={
          <>
            {!isPetition ? (
              <Alert status="info">
                <AlertIcon />
                <Text>
                  <FormattedMessage
                    id="page.preview.template-only-cache-alert"
                    defaultMessage="<b>Preview only</b> - Changes you add as replies or comments will not be saved. To complete and submit this template click on <b>Use template</b>."
                  />
                </Text>
              </Alert>
            ) : null}
            {displayPetitionLimitReachedAlert ? (
              <PetitionLimitReachedAlert limit={me.organization.usageLimits.petitions.limit} />
            ) : null}
          </>
        }
      >
        <Flex backgroundColor="gray.50" minHeight="100%" flexDirection="column" alignItems="center">
          <Flex
            flex="1"
            flexDirection={{ base: "column", [breakpoint]: "row" }}
            width="100%"
            maxWidth="container.lg"
            paddingY={6}
            paddingX={4}
          >
            <Box
              flex={{ base: 0, [breakpoint]: 1 }}
              minWidth={0}
              marginRight={{ base: 0, [breakpoint]: 4 }}
              marginBottom={4}
              display={{ base: "none", [breakpoint]: "block" }}
            >
              <Stack
                spacing={4}
                position={{ base: "relative", [breakpoint]: "sticky" }}
                top={{ base: 0, [breakpoint]: 6 }}
              >
                <RecipientViewContentsCard currentPage={currentPage} petition={petition} />
              </Stack>
            </Box>
            <Flex flexDirection="column" flex="2" minWidth={0}>
              <Stack spacing={4} key={0}>
                <AnimatePresence initial={false}>
                  {fields.map((field) => (
                    <motion.div key={field.id} layout="position">
                      <PreviewPetitionField
                        key={field.id}
                        petitionId={petition.id}
                        field={field}
                        isDisabled={isPetition && (field.validated || petition.status === "CLOSED")}
                        isInvalid={
                          finalized &&
                          !field.validated &&
                          completedFieldReplies(field).length === 0 &&
                          !field.optional
                        }
                        hasCommentsEnabled={field.options.hasCommentsEnabled}
                        isCacheOnly={!isPetition}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Stack>
              <Spacer />
              {pages > 1 ? (
                <RecipientViewPagination
                  marginTop={8}
                  currentPage={currentPage}
                  pageCount={pageCount}
                />
              ) : null}
            </Flex>
          </Flex>
          {isPetition && petition.status !== "CLOSED" && (
            <RecipientViewProgressFooter petition={petition} onFinalize={handleFinalize} />
          )}
        </Flex>
      </PetitionLayout>
    </ToneProvider>
  );
}

PetitionPreview.fragments = {
  PetitionBase: gql`
    fragment PetitionPreview_PetitionBase on PetitionBase {
      id
      tone
      ... on Petition {
        ...AddPetitionAccessDialog_Petition
        status
        signatureConfig {
          integration {
            environment
            name
          }
        }
      }
      fields {
        id
        ...PreviewPetitionField_PetitionField
      }
      organization {
        users {
          totalCount
        }
        usageLimits {
          users {
            limit
          }
          petitions {
            used
            limit
          }
        }
      }
      ...RecipientViewContentsCard_PetitionBase
      ...PetitionLayout_PetitionBase
      ...RecipientViewProgressFooter_Petition
    }
    ${AddPetitionAccessDialog.fragments.Petition}
    ${PreviewPetitionField.fragments.PetitionField}
    ${RecipientViewContentsCard.fragments.PetitionBase}
    ${RecipientViewProgressFooter.fragments.Petition}
    ${PetitionLayout.fragments.PetitionBase}
  `,
  User: gql`
    fragment PetitionPreview_User on User {
      ...PetitionLayout_User
    }
    ${PetitionLayout.fragments.User}
  `,
};

PetitionPreview.mutations = [
  gql`
    mutation PetitionPreview_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionPreview_PetitionBase
      }
    }
    ${PetitionPreview.fragments.PetitionBase}
  `,
];

PetitionPreview.queries = [
  gql`
    query PetitionPreview_petition($id: GID!) {
      petition(id: $id) {
        ...PetitionPreview_PetitionBase
      }
    }
    ${PetitionPreview.fragments.PetitionBase}
  `,
  gql`
    query PetitionPreview_user {
      me {
        ...PetitionPreview_User
      }
    }
    ${PetitionPreview.fragments.User}
  `,
];

PetitionPreview.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  await Promise.all([
    fetchQuery(PetitionPreview_userDocument),
    fetchQuery(PetitionPreview_petitionDocument, {
      variables: { id: petitionId },
      ignoreCache: true,
    }),
  ]);
  return { petitionId };
};

export default compose(withPetitionState, withDialogs, withApolloData)(PetitionPreview);

import { gql, useMutation } from "@apollo/client";
import { Box, Flex, Stack, useToast } from "@chakra-ui/react";
import { PaperPlaneIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  FieldErrorDialog,
  useFieldErrorDialog,
} from "@parallel/components/common/dialogs/FieldErrorDialog";
import { LiquidScopeProvider } from "@parallel/utils/useLiquid";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { Spacer } from "@parallel/components/common/Spacer";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { PetitionCompletedAlert } from "@parallel/components/petition-common/PetitionCompletedAlert";
import { PetitionPreviewOnlyAlert } from "@parallel/components/petition-common/PetitionPreviewOnlyAlert";
import { PetitionPreviewSignatureReviewAlert } from "@parallel/components/petition-common/PetitionPreviewSignatureReviewAlert";
import { useSendPetitionHandler } from "@parallel/components/petition-common/useSendPetitionHandler";
import { useHandledTestSignatureDialog } from "@parallel/components/petition-compose/dialogs/TestSignatureDialog";
import { PetitionLimitReachedAlert } from "@parallel/components/petition-compose/PetitionLimitReachedAlert";
import { PreviewPetitionField } from "@parallel/components/petition-preview/PreviewPetitionField";
import {
  ConfirmPetitionSignersDialog,
  ConfirmPetitionSignersDialogResult,
  useConfirmPetitionSignersDialog,
} from "@parallel/components/petition-common/dialogs/ConfirmPetitionSignersDialog";
import { RecipientViewContentsCard } from "@parallel/components/recipient-view/RecipientViewContentsCard";
import { RecipientViewPagination } from "@parallel/components/recipient-view/RecipientViewPagination";
import { RecipientViewProgressFooter } from "@parallel/components/recipient-view/RecipientViewProgressFooter";
import {
  PetitionPreview_completePetitionDocument,
  PetitionPreview_PetitionBaseFragment,
  PetitionPreview_petitionDocument,
  PetitionPreview_updatePetitionDocument,
  PetitionPreview_userDocument,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { compose } from "@parallel/utils/compose";
import { isUsageLimitsReached } from "@parallel/utils/isUsageLimitsReached";
import { withError } from "@parallel/utils/promises/withError";
import { UnwrapPromise } from "@parallel/utils/types";
import { useGetPageFields } from "@parallel/utils/useGetPageFields";
import { useLiquidScope } from "@parallel/utils/useLiquidScope";
import { usePetitionStateWrapper, withPetitionState } from "@parallel/utils/usePetitionState";
import { validatePetitionFields } from "@parallel/utils/validatePetitionFields";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { omit } from "remeda";

type PetitionPreviewProps = UnwrapPromise<ReturnType<typeof PetitionPreview.getInitialProps>>;

function PetitionPreview({ petitionId }: PetitionPreviewProps) {
  const intl = useIntl();
  const router = useRouter();
  const { query } = router;
  const toast = useToast();

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

  useEffect(() => {
    const layoutBody = document.getElementById("petition-layout-body");
    if (layoutBody) layoutBody.scrollTop = 0;
  }, [currentPage]);

  const { fields, pages, visibility } = useGetPageFields(petition.fields, currentPage, {
    usePreviewReplies: !isPetition,
  });

  const breakpoint = "md";

  const showErrorDialog = useErrorDialog();
  const showFieldErrorDialog = useFieldErrorDialog();
  const _validatePetitionFields = async () => {
    const { error, message, fieldsWithIndices } = validatePetitionFields(petition.fields);
    if (error) {
      if (fieldsWithIndices && fieldsWithIndices.length > 0) {
        await withError(showFieldErrorDialog({ message, fieldsWithIndices }));
        const firstId = fieldsWithIndices[0].field.id;
        router.push(`/app/petitions/${query.petitionId}/compose#field-${firstId}`);
      } else {
        await withError(showErrorDialog({ message }));
        router.push(`/app/petitions/${query.petitionId}/compose`);
      }
      return false;
    }
    return true;
  };

  const handleNextClick = useSendPetitionHandler(
    isPetition ? petition : null,
    handleUpdatePetition,
    _validatePetitionFields
  );

  const showConfirmPetitionSignersDialog = useConfirmPetitionSignersDialog();
  const [completePetition] = useMutation(PetitionPreview_completePetitionDocument);
  const showTestSignatureDialog = useHandledTestSignatureDialog();

  const handleFinalize = useCallback(
    async function () {
      try {
        setFinalized(true);
        const canFinalize = petition.fields.every(
          (f, index) =>
            !visibility[index] || f.optional || completedFieldReplies(f).length > 0 || f.isReadOnly
        );
        if (canFinalize && isPetition) {
          const presetSigners = petition!.signatureConfig?.signers ?? [];
          const allowAdditionalSigners = petition.signatureConfig?.allowAdditionalSigners ?? false;
          let completeSignerInfoData: ConfirmPetitionSignersDialogResult | null = null;
          if (petition.signatureConfig?.review === false) {
            completeSignerInfoData = await showConfirmPetitionSignersDialog({
              accesses: petition.accesses,
              presetSigners,
              user: me,
              allowAdditionalSigners,
            });
          }

          await showTestSignatureDialog(
            petition.signatureConfig?.integration?.environment,
            petition.signatureConfig?.integration?.name
          );

          if (completeSignerInfoData !== null) {
            await updatePetition({
              variables: {
                petitionId,
                data: {
                  signatureConfig: {
                    ...omit(petition.signatureConfig!, ["integration", "signers", "__typename"]),
                    orgIntegrationId: petition.signatureConfig!.integration!.id,
                    signersInfo: completeSignerInfoData!.signers,
                  },
                },
              },
            });
          }

          await completePetition({
            variables: {
              petitionId,
              message: completeSignerInfoData?.message,
            },
          });

          if (!petition.signatureConfig) {
            if (!toast.isActive("petition-completed-toast")) {
              toast({
                id: "petition-completed-toast",
                title: intl.formatMessage({
                  id: "recipient-view.completed-petition.toast-title",
                  defaultMessage: "Petition completed!",
                }),
                description: intl.formatMessage({
                  id: "petition-preview.completed-petition.toast-description",
                  defaultMessage: "Check that everything is OK to close the petition.",
                }),
                status: "success",
                isClosable: true,
              });
            }
            router.push(`/app/petitions/${query.petitionId}/replies`);
          } else if (petition.signatureConfig?.review) {
            if (!toast.isActive("petition-completed-toast")) {
              toast({
                id: "petition-completed-toast",
                title: intl.formatMessage({
                  id: "recipient-view.completed-petition.toast-title",
                  defaultMessage: "Petition completed!",
                }),
                description: intl.formatMessage({
                  id: "petition-preview.completed-petition.toast-description-check-signature",
                  defaultMessage:
                    "Review the replies and send the signature to close the petition.",
                }),
                status: "success",
                isClosable: true,
              });
            }
            router.push(`/app/petitions/${query.petitionId}/replies`);
          } else {
            if (!toast.isActive("petition-completed-signature-sended-toast")) {
              toast({
                id: "petition-completed-signature-sended-toast",
                title: intl.formatMessage({
                  id: "recipient-view.signature-sended.toast-title",
                  defaultMessage: "Signature sent",
                }),
                description: intl.formatMessage({
                  id: "petition-preview.signature-sended.toast-description",
                  defaultMessage: "Your signature is on its way.",
                }),
                status: "success",
                isClosable: true,
              });
            }
            router.push("/app/petitions");
          }
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
    isUsageLimitsReached(me.organization) && isPetition && petition.status === "DRAFT";

  const scope = useLiquidScope(petition.fields, petition.__typename === "PetitionTemplate");
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
          isPetition && !petition.accesses?.find((a) => a.status === "ACTIVE") ? (
            <ResponsiveButtonIcon
              data-action="preview-next"
              id="petition-next"
              colorScheme="purple"
              icon={<PaperPlaneIcon fontSize="18px" />}
              label={intl.formatMessage({
                id: "generic.send-to",
                defaultMessage: "Send to...",
              })}
              onClick={handleNextClick}
            />
          ) : null
        }
        subHeader={
          <>
            {!isPetition ? <PetitionPreviewOnlyAlert /> : null}
            {isPetition && petition.status === "COMPLETED" && petition.signatureConfig?.review ? (
              <PetitionPreviewSignatureReviewAlert />
            ) : null}
            {displayPetitionLimitReachedAlert ? (
              <PetitionLimitReachedAlert limit={me.organization.usageLimits.petitions.limit} />
            ) : null}
            {isPetition &&
            !petition.signatureConfig?.review &&
            ["COMPLETED", "CLOSED"].includes(petition.status) ? (
              <PetitionCompletedAlert />
            ) : null}
          </>
        }
      >
        <Flex
          backgroundColor={isPetition ? "gray.50" : "purple.50"}
          minHeight="100%"
          flexDirection="column"
          alignItems="center"
        >
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
            <Flex data-section="preview-fields" flexDirection="column" flex="2" minWidth={0}>
              <Stack spacing={4} key={0}>
                <LiquidScopeProvider scope={scope}>
                  {fields.map((field) => (
                    <motion.div key={field.id} layout="position">
                      <PreviewPetitionField
                        key={field.id}
                        petitionId={petition.id}
                        field={field}
                        isDisabled={isPetition && petition.status === "CLOSED"}
                        isInvalid={
                          finalized && completedFieldReplies(field).length === 0 && !field.optional
                        }
                        hasCommentsEnabled={field.options.hasCommentsEnabled}
                        isCacheOnly={!isPetition}
                      />
                    </motion.div>
                  ))}
                </LiquidScopeProvider>
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
            <RecipientViewProgressFooter
              petition={petition}
              onFinalize={handleFinalize}
              isDisabled={displayPetitionLimitReachedAlert}
            />
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
        accesses {
          id
          status
          ...ConfirmPetitionSignersDialog_PetitionAccess
        }
        ...RecipientViewProgressFooter_Petition
        ...useSendPetitionHandler_Petition
      }
      fields {
        ...PreviewPetitionField_PetitionField
        ...useGetPageFields_PetitionField
        ...validatePetitionFields_PetitionField
        ...FieldErrorDialog_PetitionField
        ...useLiquidScope_PetitionField
      }
      signatureConfig {
        allowAdditionalSigners
        review
        timezone
        title
        signers {
          ...ConfirmPetitionSignersDialog_PetitionSigner
        }
      }
      ...RecipientViewContentsCard_PetitionBase
      ...PetitionLayout_PetitionBase
    }
    ${ConfirmPetitionSignersDialog.fragments.PetitionAccess}
    ${ConfirmPetitionSignersDialog.fragments.PetitionSigner}
    ${RecipientViewProgressFooter.fragments.Petition}
    ${useSendPetitionHandler.fragments.Petition}
    ${RecipientViewContentsCard.fragments.PetitionBase}
    ${PetitionLayout.fragments.PetitionBase}
    ${PreviewPetitionField.fragments.PetitionField}
    ${useGetPageFields.fragments.PetitionField}
    ${validatePetitionFields.fragments.PetitionField}
    ${FieldErrorDialog.fragments.PetitionField}
    ${useLiquidScope.fragments.PetitionField}
  `,
  User: gql`
    fragment PetitionPreview_User on User {
      organization {
        name
        ...isUsageLimitsReached_Organization
      }
      ...PetitionLayout_User
      ...ConfirmPetitionSignersDialog_User
    }
    ${isUsageLimitsReached.fragments.Organization}
    ${ConfirmPetitionSignersDialog.fragments.User}
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
  gql`
    mutation PetitionPreview_completePetition(
      $petitionId: GID!
      $additionalSigners: [PublicPetitionSignerDataInput!]
      $message: String
    ) {
      completePetition(
        petitionId: $petitionId
        additionalSigners: $additionalSigners
        message: $message
      ) {
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

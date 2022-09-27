import { gql, useMutation } from "@apollo/client";
import { Box, Flex, Stack, useToast } from "@chakra-ui/react";
import { PaperPlaneIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  FieldErrorDialog,
  useFieldErrorDialog,
} from "@parallel/components/common/dialogs/FieldErrorDialog";
import { OverrideWithOrganizationTheme } from "@parallel/components/common/OverrideWithOrganizationTheme";
import { ResponsiveButtonIcon } from "@parallel/components/common/ResponsiveButtonIcon";
import { Spacer } from "@parallel/components/common/Spacer";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import {
  PetitionLayout,
  usePetitionStateWrapper,
  withPetitionLayoutContext,
} from "@parallel/components/layout/PetitionLayout";
import {
  ConfirmPetitionSignersDialog,
  ConfirmPetitionSignersDialogResult,
  useConfirmPetitionSignersDialog,
} from "@parallel/components/petition-common/dialogs/ConfirmPetitionSignersDialog";
import { PetitionCompletedAlert } from "@parallel/components/petition-common/PetitionCompletedAlert";
import { PetitionPreviewOnlyAlert } from "@parallel/components/petition-common/PetitionPreviewOnlyAlert";
import { PetitionPreviewSignatureReviewAlert } from "@parallel/components/petition-common/PetitionPreviewSignatureReviewAlert";
import { useSendPetitionHandler } from "@parallel/components/petition-common/useSendPetitionHandler";
import { useHandledTestSignatureDialog } from "@parallel/components/petition-compose/dialogs/TestSignatureDialog";
import { PetitionLimitReachedAlert } from "@parallel/components/petition-compose/PetitionLimitReachedAlert";
import { PreviewPetitionField } from "@parallel/components/petition-preview/PreviewPetitionField";
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
import { LiquidScopeProvider } from "@parallel/utils/useLiquid";
import { useLiquidScope } from "@parallel/utils/useLiquidScope";
import { validatePetitionFields } from "@parallel/utils/validatePetitionFields";
import { withMetadata } from "@parallel/utils/withMetadata";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { isDefined, omit } from "remeda";

type PetitionPreviewProps = UnwrapPromise<ReturnType<typeof PetitionPreview.getInitialProps>>;

function PetitionPreview({ petitionId }: PetitionPreviewProps) {
  const intl = useIntl();
  const router = useRouter();
  const { query } = router;
  const toast = useToast();

  const {
    data: { me, realMe },
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

  useEffect(() => {
    if (query.fromTemplate) {
      toast({
        id: "petition-created-toast",
        title: intl.formatMessage({
          id: "page.preview.petition-created-toast",
          defaultMessage: "Parallel created from a template.",
        }),
        status: "success",
        isClosable: true,
      });
    }
  }, []);

  const petition = data!.petition as PetitionPreview_PetitionBaseFragment;
  const isPetition = petition.__typename === "Petition";

  const myEffectivePermission = petition.myEffectivePermission!.permissionType;

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
    me,
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
          const presetSigners = petition!.signatureConfig?.signers.filter(isDefined) ?? [];

          const allowAdditionalSigners = petition.signatureConfig?.allowAdditionalSigners ?? false;
          let completeSignerInfoData: ConfirmPetitionSignersDialogResult | null = null;
          if (petition.signatureConfig?.review === false) {
            completeSignerInfoData = await showConfirmPetitionSignersDialog({
              accesses: petition.accesses,
              presetSigners,
              user: me,
              allowAdditionalSigners,
              previousSignatures: petition.signatureRequests,
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
                  defaultMessage: "Parallel completed!",
                }),
                description: intl.formatMessage({
                  id: "petition-preview.completed-petition.toast-description",
                  defaultMessage: "Check that everything is OK to close the parallel.",
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
                  defaultMessage: "Parallel completed!",
                }),
                description: intl.formatMessage({
                  id: "petition-preview.completed-petition.toast-description-check-signature",
                  defaultMessage:
                    "Review the replies and send the signature to close the parallel.",
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

  const scope = useLiquidScope(petition, petition.__typename === "PetitionTemplate");
  return (
    <ToneProvider value={petition.tone}>
      <PetitionLayout
        key={petition.id}
        me={me}
        realMe={realMe}
        petition={petition}
        onUpdatePetition={handleUpdatePetition}
        section="preview"
        headerActions={
          isPetition &&
          !petition.accesses?.find((a) => a.status === "ACTIVE" && !a.isContactless) ? (
            <ResponsiveButtonIcon
              data-action="preview-next"
              id="petition-next"
              colorScheme="primary"
              icon={<PaperPlaneIcon fontSize="18px" />}
              isDisabled={petition.isAnonymized || myEffectivePermission === "READ"}
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
            ["COMPLETED", "CLOSED"].includes(petition.status) &&
            !petition.isAnonymized ? (
              <PetitionCompletedAlert />
            ) : null}
          </>
        }
      >
        <Flex
          backgroundColor="primary.50"
          minHeight="100%"
          flexDirection="column"
          alignItems="center"
          className="with-organization-brand-theme"
        >
          <OverrideWithOrganizationTheme
            cssVarsRoot=".with-organization-brand-theme"
            brandTheme={me.organization.brandTheme}
          >
            <Flex
              flex="1"
              flexDirection={{ base: "column", [breakpoint]: "row" }}
              width="100%"
              maxWidth="container.lg"
              paddingY={6}
              paddingX={4}
              fontFamily="body"
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
                  <RecipientViewContentsCard
                    currentPage={currentPage}
                    petition={petition}
                    maxHeight="calc(100vh - 10.5rem)"
                    usePreviewReplies={!isPetition}
                  />
                </Stack>
              </Box>
              <Flex data-section="preview-fields" flexDirection="column" flex="2" minWidth={0}>
                <Stack spacing={4} key={0}>
                  <LiquidScopeProvider scope={scope}>
                    {fields.map((field) => (
                      <motion.div key={field.id} layout="position">
                        <PreviewPetitionField
                          tone={petition.tone}
                          key={field.id}
                          petitionId={petition.id}
                          field={field}
                          isDisabled={
                            (isPetition && petition.status === "CLOSED") || petition.isAnonymized
                          }
                          isInvalid={
                            finalized &&
                            completedFieldReplies(field).length === 0 &&
                            !field.optional
                          }
                          isCacheOnly={!isPetition}
                          myEffectivePermission={myEffectivePermission}
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
          </OverrideWithOrganizationTheme>
          {isPetition && petition.status !== "CLOSED" && (
            <RecipientViewProgressFooter
              petition={petition}
              onFinalize={handleFinalize}
              isDisabled={
                displayPetitionLimitReachedAlert ||
                petition.isAnonymized ||
                myEffectivePermission === "READ"
              }
              fontFamily="body"
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
      isAnonymized
      myEffectivePermission {
        permissionType
      }
      ... on Petition {
        accesses {
          id
          status
          isContactless
          ...ConfirmPetitionSignersDialog_PetitionAccess
        }
        ...RecipientViewProgressFooter_Petition
        ...useSendPetitionHandler_Petition
        signatureRequests {
          signatureConfig {
            signers {
              ...ConfirmPetitionSignersDialog_PetitionSigner
            }
          }
        }
      }
      fields {
        ...PreviewPetitionField_PetitionField
        ...useGetPageFields_PetitionField
        ...validatePetitionFields_PetitionField
        ...FieldErrorDialog_PetitionField
        ...completedFieldReplies_PetitionField
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
      ...useLiquidScope_PetitionBase
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
    ${useLiquidScope.fragments.PetitionBase}
    ${completedFieldReplies.fragments.PetitionField}
  `,
  Query: gql`
    fragment PetitionPreview_Query on Query {
      ...PetitionLayout_Query
      me {
        id
        organization {
          name
          ...isUsageLimitsReached_Organization
          ...OverrideWithOrganizationTheme_Organization
        }
        ...useSendPetitionHandler_User
        ...ConfirmPetitionSignersDialog_User
      }
    }
    ${PetitionLayout.fragments.Query}
    ${useSendPetitionHandler.fragments.User}
    ${isUsageLimitsReached.fragments.Organization}
    ${ConfirmPetitionSignersDialog.fragments.User}
    ${OverrideWithOrganizationTheme.fragments.Organization}
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
      ...PetitionPreview_Query
      metadata {
        country
        browserName
      }
    }
    ${PetitionPreview.fragments.Query}
  `,
];

PetitionPreview.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  const [
    {
      data: { metadata },
    },
  ] = await Promise.all([
    fetchQuery(PetitionPreview_userDocument),
    fetchQuery(PetitionPreview_petitionDocument, {
      variables: { id: petitionId },
      ignoreCache: true,
    }),
  ]);
  return { petitionId, metadata };
};

export default compose(
  withMetadata,
  withPetitionLayoutContext,
  withDialogs,
  withApolloData
)(PetitionPreview);

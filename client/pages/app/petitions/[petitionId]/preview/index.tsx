import { gql, useMutation } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Flex,
  Stack,
  Text,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import { ChevronRightIcon, EditSimpleIcon, PaperPlaneIcon } from "@parallel/chakra/icons";
import { isDialogError, withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  FieldErrorDialog,
  useFieldErrorDialog,
} from "@parallel/components/common/dialogs/FieldErrorDialog";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NakedLink } from "@parallel/components/common/Link";
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
import { PetitionPreviewSignatureReviewAlert } from "@parallel/components/petition-common/PetitionPreviewSignatureReviewAlert";
import { useSendPetitionHandler } from "@parallel/components/petition-common/useSendPetitionHandler";
import {
  HiddenFieldDialog,
  useHiddenFieldDialog,
} from "@parallel/components/petition-compose/dialogs/HiddenFieldDialog";
import { useHandledTestSignatureDialog } from "@parallel/components/petition-compose/dialogs/TestSignatureDialog";
import { PetitionLimitReachedAlert } from "@parallel/components/petition-compose/PetitionLimitReachedAlert";
import {
  GeneratePrefilledPublicLinkDialog,
  useGeneratePrefilledPublicLinkDialog,
} from "@parallel/components/petition-preview/dialogs/GeneratePrefilledPublicLinkDialog";
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
import { useAllFieldsWithIndices } from "@parallel/utils/fieldIndices";
import {
  useBuildUrlToPetitionSection,
  useGoToPetition,
  useGoToPetitionSection,
} from "@parallel/utils/goToPetition";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { withError } from "@parallel/utils/promises/withError";
import { UnwrapPromise } from "@parallel/utils/types";
import { useGetPetitionPages } from "@parallel/utils/useGetPetitionPages";
import { LiquidScopeProvider } from "@parallel/utils/useLiquid";
import { useLiquidScope } from "@parallel/utils/useLiquidScope";
import { usePetitionCanFinalize } from "@parallel/utils/usePetitionCanFinalize";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import { validatePetitionFields } from "@parallel/utils/validatePetitionFields";
import { withMetadata } from "@parallel/utils/withMetadata";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
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
  const { data, refetch } = useAssertQuery(PetitionPreview_petitionDocument, {
    variables: { id: petitionId },
  });

  const [showErrors, setShowErrors] = useState(false);

  const wrapper = usePetitionStateWrapper();
  const [updatePetition] = useMutation(PetitionPreview_updatePetitionDocument);
  const handleUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { petitionId, data } });
    }),
    [petitionId],
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

  const pages = useGetPetitionPages(petition.fields, { usePreviewReplies: !isPetition });
  const currentPage = useMemo(() => {
    const { field: fieldId, reply: replyId } = query;
    let page = 0;
    if (query.page && !isNaN(Number(query.page))) {
      return Number(query.page);
    }
    if (fieldId) {
      page = pages.findIndex((fields) => fields.some((f) => f.id === fieldId));
    }

    if (replyId && typeof replyId === "string") {
      const id = replyId.split("-")[0];
      page = pages.findIndex((fields) => fields.some((f) => f.id === id));
    }

    return Math.max(page + 1, 1);
  }, [query.page]);

  const fields = pages[currentPage - 1];

  useEffect(() => {
    const layoutBody = document.getElementById("petition-layout-body");
    if (layoutBody) layoutBody.scrollTop = 0;
  }, [currentPage]);

  const goToSection = useGoToPetitionSection();
  const buildUrlToSection = useBuildUrlToPetitionSection();

  const showHiddenFieldDialog = useHiddenFieldDialog();
  useTempQueryParam("field", async (fieldId) => {
    try {
      if (!fields.some((f) => f.id === fieldId || f.children?.some((cf) => cf.id === fieldId))) {
        await showHiddenFieldDialog({
          field: petition.fields.find((f) => f.id === fieldId)!,
          petition,
        });
      }
    } catch (error) {
      if (isDialogError(error) && error.message === "CANCEL") {
        goToSection("compose", { query: { field: fieldId } });
      }
    }
  });

  const breakpoint = "md";

  const goToPetition = useGoToPetition();
  const showErrorDialog = useErrorDialog();
  const showFieldErrorDialog = useFieldErrorDialog();
  const allFieldsWithIndices = useAllFieldsWithIndices(petition.fields);
  const _validatePetitionFields = async () => {
    const { error, message, fieldsWithIndices } = validatePetitionFields(allFieldsWithIndices);
    if (error) {
      const petitionId = query.petitionId;
      if (fieldsWithIndices && fieldsWithIndices.length > 0) {
        await withError(showFieldErrorDialog({ message, fieldsWithIndices }));
        const firstId = fieldsWithIndices[0][0].id;
        if (isDefined(petitionId) && typeof petitionId === "string") {
          goToPetition(petitionId, "compose", { query: { field: firstId } });
        }
      } else {
        await withError(showErrorDialog({ message }));
        if (isDefined(petitionId) && typeof petitionId === "string") {
          goToPetition(petitionId, "compose");
        }
      }
      return false;
    }
    return true;
  };

  const handleNextClick = useSendPetitionHandler(
    me,
    isPetition ? petition : null,
    handleUpdatePetition,
    _validatePetitionFields,
  );

  const showConfirmPetitionSignersDialog = useConfirmPetitionSignersDialog();
  const [completePetition] = useMutation(PetitionPreview_completePetitionDocument);
  const showTestSignatureDialog = useHandledTestSignatureDialog();

  const { canFinalize, incompleteFields } = usePetitionCanFinalize(petition);
  const handleFinalize = useCallback(
    async function () {
      try {
        setShowErrors(true);
        if (canFinalize && isPetition) {
          let completeSignerInfoData: ConfirmPetitionSignersDialogResult | null = null;
          if (petition.signatureConfig?.review === false) {
            completeSignerInfoData = await showConfirmPetitionSignersDialog({
              accesses: petition.accesses,
              user: me,
              signatureConfig: petition.signatureConfig,
              previousSignatures: petition.signatureRequests,
            });
          }

          await showTestSignatureDialog(
            petition.signatureConfig?.integration?.environment,
            petition.signatureConfig?.integration?.name,
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
            if (!toast.isActive("petition-completed-signature-sent-toast")) {
              toast({
                id: "petition-completed-signature-sent-toast",
                title: intl.formatMessage({
                  id: "recipient-view.signature-sent.toast-title",
                  defaultMessage: "Signature sent",
                }),
                description: intl.formatMessage({
                  id: "petition-preview.signature-sent.toast-description",
                  defaultMessage: "Your signature is on its way.",
                }),
                status: "success",
                isClosable: true,
              });
            }
            router.push(`/app/petitions/${query.petitionId}/replies`);
          }
        } else {
          // go to first repliable field without replies
          const field = incompleteFields[0];
          router.push(
            `/app/petitions/${query.petitionId}/preview?${new URLSearchParams({
              page: field.page.toString(),
              field: field.id,
              ...(field.parentReplyId ? { parentReply: field.parentReplyId } : {}),
            })}`,
          );
        }
      } catch {}
    },
    [
      canFinalize,
      incompleteFields?.[0]?.id,
      incompleteFields?.[0]?.parentReplyId,
      incompleteFields?.[0]?.page,
      router,
      query,
    ],
  );

  const displayPetitionLimitReachedAlert =
    me.organization.isPetitionUsageLimitReached && isPetition && petition.status === "DRAFT";

  const scope = useLiquidScope(petition, petition.__typename === "PetitionTemplate");

  const showQuickAccessButtons = useBreakpointValue({ base: false, xl: true });

  const showGeneratePrefilledPublicLinkButton =
    me.hasPublicLinkPrefill &&
    petition.__typename === "PetitionTemplate" &&
    petition.publicLink?.isActive &&
    petition.fields.some(
      (f) => !isFileTypeField(f.type) && isDefined(f.alias) && f.previewReplies.length > 0,
    );
  const showGeneratePrefilledPublicLinkDialog = useGeneratePrefilledPublicLinkDialog();
  async function handleGeneratePrefilledPublicLinkClick() {
    try {
      await showGeneratePrefilledPublicLinkDialog({ petitionId });
    } catch {}
  }

  return (
    <ToneProvider value={petition.organization.brandTheme.preferredTone}>
      <PetitionLayout
        key={petition.id}
        me={me}
        realMe={realMe}
        petition={petition}
        onUpdatePetition={handleUpdatePetition}
        onRefetch={() => refetch()}
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
            {!isPetition ? (
              <Alert status="info" paddingY={0}>
                <AlertIcon />
                <Text flex={1} paddingY={3}>
                  <FormattedMessage
                    id="page.preview.template-only-cache-alert"
                    defaultMessage="<b>Preview only</b> - Changes you add as replies or comments will not be saved. To complete and submit this template click on <b>{button}</b>."
                    values={{
                      button: (
                        <FormattedMessage
                          id="generic.create-petition"
                          defaultMessage="Create parallel"
                        />
                      ),
                    }}
                  />
                </Text>
                {showGeneratePrefilledPublicLinkButton ? (
                  <Button
                    size="sm"
                    colorScheme="blue"
                    marginLeft={2}
                    onClick={() => handleGeneratePrefilledPublicLinkClick()}
                  >
                    <FormattedMessage
                      id="page.preview.generate-prefilled-link"
                      defaultMessage="Generate prefilled link"
                    />
                  </Button>
                ) : null}
              </Alert>
            ) : null}
            {isPetition && petition.status === "COMPLETED" && petition.signatureConfig?.review ? (
              <PetitionPreviewSignatureReviewAlert />
            ) : null}
            {displayPetitionLimitReachedAlert ? (
              <PetitionLimitReachedAlert limit={me.organization.petitionsPeriod?.limit ?? 0} />
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
              zIndex={1}
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
                    {fields.map((field) => {
                      const fieldHasReplies = field.replies.length !== 0;

                      return (
                        <Box
                          key={field.id}
                          position="relative"
                          _focusWithin={{
                            ".edit-preview-field-buttons": {
                              display: "flex",
                            },
                          }}
                          _hover={{
                            ".edit-preview-field-buttons": {
                              display: "inline-flex",
                            },
                          }}
                        >
                          <PreviewPetitionField
                            key={field.id}
                            petition={petition}
                            field={field}
                            isDisabled={
                              (isPetition && petition.status === "CLOSED") ||
                              petition.isAnonymized ||
                              displayPetitionLimitReachedAlert
                            }
                            isCacheOnly={!isPetition}
                            myEffectivePermission={myEffectivePermission}
                            showErrors={showErrors && !canFinalize}
                          />
                          {field.type !== "FIELD_GROUP" && showQuickAccessButtons ? (
                            <Center
                              position="absolute"
                              top="0px"
                              right="-48px"
                              height="100%"
                              width="auto"
                              minWidth="48px"
                              padding={2}
                            >
                              <Stack className={"edit-preview-field-buttons"} display="none">
                                <NakedLink href={buildUrlToSection("compose", { field: field.id })}>
                                  <IconButtonWithTooltip
                                    as="a"
                                    size="sm"
                                    variant="outline"
                                    backgroundColor="white"
                                    placement="bottom"
                                    color="gray.600"
                                    icon={<EditSimpleIcon boxSize={4} />}
                                    label={intl.formatMessage({
                                      id: "page.preview.edit-field",
                                      defaultMessage: "Edit field",
                                    })}
                                  />
                                </NakedLink>
                                {field.type === "HEADING" || !isPetition ? null : (
                                  <NakedLink
                                    href={buildUrlToSection("replies", { field: field.id })}
                                  >
                                    <IconButtonWithTooltip
                                      as="a"
                                      icon={<ChevronRightIcon boxSize={5} />}
                                      size="sm"
                                      variant="outline"
                                      backgroundColor="white"
                                      placement="bottom"
                                      color="gray.600"
                                      isDisabled={!fieldHasReplies}
                                      label={intl.formatMessage({
                                        id: "page.preview.review-reply",
                                        defaultMessage: "Review reply",
                                      })}
                                    />
                                  </NakedLink>
                                )}
                              </Stack>
                            </Center>
                          ) : null}
                        </Box>
                      );
                    })}
                  </LiquidScopeProvider>
                </Stack>
                <Spacer />
                {pages.length > 1 ? (
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
              zIndex={2}
            />
          )}
        </Flex>
      </PetitionLayout>
    </ToneProvider>
  );
}

const _fragments = {
  PetitionBase: gql`
    fragment PetitionPreview_PetitionBase on PetitionBase {
      id
      organization {
        id
        brandTheme {
          preferredTone
        }
      }
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
      ... on PetitionTemplate {
        ...GeneratePrefilledPublicLinkDialog_PetitionTemplate
        publicLink {
          id
          isActive
        }
      }
      fields {
        id
        position
        ...useAllFieldsWithIndices_PetitionField
        ...PreviewPetitionField_PetitionField
        ...useGetPetitionPages_PetitionField
        ...validatePetitionFields_PetitionField
        ...FieldErrorDialog_PetitionField
        ...completedFieldReplies_PetitionField
        ...HiddenFieldDialog_PetitionField
        children {
          id
          alias
          ...validatePetitionFields_PetitionField
          ...FieldErrorDialog_PetitionField
          replies {
            id
            parent {
              id
            }
          }
        }
        replies {
          id
          parent {
            id
          }
        }
      }
      signatureConfig {
        allowAdditionalSigners
        review
        timezone
        title
        signers {
          ...ConfirmPetitionSignersDialog_PetitionSigner
        }
        ...ConfirmPetitionSignersDialog_SignatureConfig
      }
      ...RecipientViewContentsCard_PetitionBase
      ...PetitionLayout_PetitionBase
      ...useLiquidScope_PetitionBase
      ...PreviewPetitionField_PetitionBase
      ...usePetitionCanFinalize_PetitionBase
      ...HiddenFieldDialog_PetitionBase
    }
    ${ConfirmPetitionSignersDialog.fragments.PetitionAccess}
    ${ConfirmPetitionSignersDialog.fragments.PetitionSigner}
    ${ConfirmPetitionSignersDialog.fragments.SignatureConfig}
    ${RecipientViewProgressFooter.fragments.Petition}
    ${useSendPetitionHandler.fragments.Petition}
    ${RecipientViewContentsCard.fragments.PetitionBase}
    ${PetitionLayout.fragments.PetitionBase}
    ${PreviewPetitionField.fragments.PetitionBase}
    ${PreviewPetitionField.fragments.PetitionField}
    ${useGetPetitionPages.fragments.PetitionField}
    ${useAllFieldsWithIndices.fragments.PetitionField}
    ${validatePetitionFields.fragments.PetitionField}
    ${FieldErrorDialog.fragments.PetitionField}
    ${useLiquidScope.fragments.PetitionBase}
    ${completedFieldReplies.fragments.PetitionField}
    ${HiddenFieldDialog.fragments.PetitionBase}
    ${HiddenFieldDialog.fragments.PetitionField}
    ${GeneratePrefilledPublicLinkDialog.fragments.PetitionTemplate}
    ${usePetitionCanFinalize.fragments.PetitionBase}
  `,
  Query: gql`
    fragment PetitionPreview_Query on Query {
      ...PetitionLayout_Query
      me {
        id
        organization {
          id
          name
          isPetitionUsageLimitReached: isUsageLimitReached(limitName: PETITION_SEND)
          petitionsPeriod: currentUsagePeriod(limitName: PETITION_SEND) {
            limit
          }
          brandTheme {
            ...OverrideWithOrganizationTheme_OrganizationBrandThemeData
          }
        }
        ...useSendPetitionHandler_User
        ...ConfirmPetitionSignersDialog_User
      }
    }
    ${PetitionLayout.fragments.Query}
    ${OverrideWithOrganizationTheme.fragments.OrganizationBrandThemeData}
    ${useSendPetitionHandler.fragments.User}
    ${ConfirmPetitionSignersDialog.fragments.User}
  `,
};

const _mutations = [
  gql`
    mutation PetitionPreview_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionPreview_PetitionBase
      }
    }
    ${_fragments.PetitionBase}
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
    ${_fragments.PetitionBase}
  `,
];

const _queries = [
  gql`
    query PetitionPreview_petition($id: GID!) {
      petition(id: $id) {
        ...PetitionPreview_PetitionBase
      }
    }
    ${_fragments.PetitionBase}
  `,
  gql`
    query PetitionPreview_user {
      ...PetitionPreview_Query
      me {
        hasPublicLinkPrefill: hasFeatureFlag(featureFlag: PUBLIC_PETITION_LINK_PREFILL_DATA)
      }
      metadata {
        country
        browserName
      }
    }
    ${_fragments.Query}
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
  withApolloData,
)(PetitionPreview);

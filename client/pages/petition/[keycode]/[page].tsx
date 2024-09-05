import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Stack,
} from "@chakra-ui/react";
import { Divider } from "@parallel/components/common/Divider";
import { OverrideWithOrganizationTheme } from "@parallel/components/common/OverrideWithOrganizationTheme";
import { Spacer } from "@parallel/components/common/Spacer";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import { isDialogError, withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  RedirectError,
  WithApolloDataContext,
  withApolloData,
} from "@parallel/components/common/withApolloData";
import { LastSavedProvider } from "@parallel/components/recipient-view/LastSavedProvider";
import { RecipientViewContents } from "@parallel/components/recipient-view/RecipientViewContents";
import { RecipientViewFooter } from "@parallel/components/recipient-view/RecipientViewFooter";
import { RecipientViewHeader } from "@parallel/components/recipient-view/RecipientViewHeader";
import { RecipientViewPagination } from "@parallel/components/recipient-view/RecipientViewPagination";
import { RecipientViewPetitionStatusAlert } from "@parallel/components/recipient-view/RecipientViewPetitionStatusAlert";
import { RecipientViewProgressBar } from "@parallel/components/recipient-view/RecipientViewProgressBar";
import { RecipientViewRefreshRepliesAlert } from "@parallel/components/recipient-view/RecipientViewRefreshRepliesAlert";
import {
  RecipientViewMobileNavigation,
  RecipientViewSidebar,
} from "@parallel/components/recipient-view/RecipientViewSidebar";
import { RecipientViewSidebarContextProvider } from "@parallel/components/recipient-view/RecipientViewSidebarContextProvider";
import { RecipientViewSignatureSentAlert } from "@parallel/components/recipient-view/RecipientViewSignatureSentAlert";
import { useCompletingMessageDialog } from "@parallel/components/recipient-view/dialogs/CompletingMessageDialog";
import {
  RecipientViewConfirmPetitionSignersDialogResult,
  useRecipientViewConfirmPetitionSignersDialog,
} from "@parallel/components/recipient-view/dialogs/RecipientViewConfirmPetitionSignersDialog";
import { useRecipientViewReviewBeforeSignDialog } from "@parallel/components/recipient-view/dialogs/RecipientViewReviewBeforeSignDialog";

import { RecipientViewPetitionField } from "@parallel/components/recipient-view/fields/RecipientViewPetitionField";
import {
  RecipientView_accessDocument,
  RecipientView_accessesDocument,
  RecipientView_publicCompletePetitionDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery, withAssertApolloQuery } from "@parallel/utils/apollo/useAssertQuery";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { compose } from "@parallel/utils/compose";
import { focusPetitionField } from "@parallel/utils/focusPetitionField";
import { LiquidPetitionVariableProvider } from "@parallel/utils/liquid/LiquidPetitionVariableProvider";
import { LiquidScopeProvider } from "@parallel/utils/liquid/LiquidScopeProvider";
import { UnwrapPromise } from "@parallel/utils/types";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useGetPetitionPages } from "@parallel/utils/useGetPetitionPages";
import { useHighlightElement } from "@parallel/utils/useHighlightElement";
import { usePetitionCanFinalize } from "@parallel/utils/usePetitionCanFinalize";
import { withMetadata } from "@parallel/utils/withMetadata";
import { AnimatePresence } from "framer-motion";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, omit } from "remeda";
import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";

type RecipientViewProps = UnwrapPromise<ReturnType<typeof RecipientView.getInitialProps>>;

function RecipientView({ keycode, currentPage }: RecipientViewProps) {
  const intl = useIntl();
  const router = useRouter();
  const {
    data: { access },
    refetch: refetchAccess,
  } = useAssertQuery(RecipientView_accessDocument, { variables: { keycode } });

  const { data: accesessData, refetch: refetchAccessesCount } = useQuery(
    RecipientView_accessesDocument,
    {
      variables: { keycode },
      skip: !access.hasClientPortalAccess,
    },
  );

  const pending = access.hasClientPortalAccess
    ? accesessData!.pending.totalCount - (access.petition.status === "PENDING" ? 1 : 0)
    : 0;

  useEffect(() => {
    refetchAccessesCount();
  }, [access.petition.status]);

  const petition = access!.petition!;
  const granter = access!.granter;
  const message = access!.message;

  const pages = useGetPetitionPages(petition, { hideInternalFields: true });
  const fieldsWithLogic = pages[currentPage - 1];
  const tone = petition.tone;

  const showFullScreenDialog =
    petition.isCompletingMessageEnabled &&
    (petition.completingMessageBody || petition.completingMessageSubject);

  const highlight = useHighlightElement();
  useEffect(() => {
    if (isNonNullish(router.query.reply)) {
      const replyId = router.query.reply;
      const element = document.getElementById(`reply-${replyId}`) as HTMLInputElement;

      if (element) {
        smoothScrollIntoView(element, { block: "center", behavior: "smooth" });
        element.focus();
        if (element.type === "text") {
          // setSelectionRange does not work on inputs that are not type="text" (e.g. email)
          element.setSelectionRange?.(element.value.length, element.value.length);
        }
      }
    }
    const allFields = petition.fields.flatMap((f) => [f, ...(f.children ?? [])]);
    if (isNonNullish(router.query.field)) {
      const { field: fieldId, parentReply: parentReplyId } = router.query;

      const field = allFields.find((f) => f.id === fieldId);
      if (field) {
        focusPetitionField({
          field,
          parentReplyId: parentReplyId as string | undefined,
        });
        const element = document.getElementById(`field-${field.id}`);
        highlight(element, true);
      }
    }
    if (isNonNullish(router.query.comments)) {
      // when navigating from comments email, it will always go to page 1 but field might be in another page
      const fieldId = router.query.comments as string;
      const page =
        pages.findIndex((p) =>
          p.some((f) => f.field.id === fieldId || f.field.children?.some((f) => f.id === fieldId)),
        ) + 1 || 1;
      if (currentPage !== page) {
        router.push(
          `/petition/${keycode}/${page}?${new URLSearchParams(omit(router.query as Record<string, string>, ["keycode", "page"]))}`,
        );
      }
    }
  }, [router.query, currentPage]);
  const showErrorDialog = useErrorDialog();

  const [showRefreshRepliesAlert, setShowRefreshRepliesAlert] = useState(false);
  const [publicCompletePetition] = useMutation(RecipientView_publicCompletePetitionDocument);
  const showConfirmPetitionSignersDialog = useRecipientViewConfirmPetitionSignersDialog();
  const showReviewBeforeSigningDialog = useRecipientViewReviewBeforeSignDialog();
  const showCompletingMessageDialog = useCompletingMessageDialog();
  const { canFinalize, nextIncompleteField } = usePetitionCanFinalize(petition, true);
  const showErrorToast = useGenericErrorToast();
  const handleFinalize = useCallback(
    async function () {
      try {
        if (canFinalize) {
          let confirmSignerInfoData: RecipientViewConfirmPetitionSignersDialogResult | null = null;
          if (petition.signatureConfig?.review === false) {
            confirmSignerInfoData = await showConfirmPetitionSignersDialog({
              keycode,
              access,
              tone,
            });
          }
          const { data } = await publicCompletePetition({
            variables: {
              keycode,
              additionalSigners: confirmSignerInfoData?.additionalSigners,
              message: confirmSignerInfoData?.message,
            },
          });
          if (petition.signatureConfig?.review) {
            await showReviewBeforeSigningDialog({
              name: isNonNullish(granter)
                ? granter.fullName
                : intl.formatMessage({
                    id: "generic.deleted-user",
                    defaultMessage: "Deleted user",
                  }),
              tone,
            });
          }
          if (showFullScreenDialog && isNonNullish(data)) {
            await showCompletingMessageDialog({
              petition: data!.publicCompletePetition,
              hasClientPortalAccess: access.hasClientPortalAccess,
              pendingPetitions: pending,
              keycode,
              tone,
            });
          }
        } else {
          // go to first repliable field without replies
          if (nextIncompleteField) {
            const { keycode } = router.query;
            router.push(
              `/petition/${keycode}/${nextIncompleteField.page}?${new URLSearchParams({
                field: nextIncompleteField.id,
                ...(nextIncompleteField.parentReplyId
                  ? { parentReply: nextIncompleteField.parentReplyId }
                  : {}),
              })}`,
            );
          }
        }
      } catch (e) {
        if (isApolloError(e, "CANT_COMPLETE_PETITION_ERROR")) {
          try {
            await showErrorDialog({
              message: intl.formatMessage({
                id: "page.recipient-view.complete-petition-error-message",
                defaultMessage:
                  "It looks like the parallel has been updated since you last accessed it. Please refresh your browser and try again. You will not lose your submitted answers.",
              }),
            });
            window.location.reload();
          } catch {}
        } else if (isDialogError(e)) {
          return;
        } else {
          showErrorToast(e);
        }
      }
    },
    [
      canFinalize,
      nextIncompleteField?.id,
      nextIncompleteField?.parentReplyId,
      nextIncompleteField?.page,
      granter,
      router.query,
      pending,
    ],
  );

  const breakpoint = "md";

  const titleOrgName = petition!.organization.hasRemoveParallelBranding
    ? petition!.organization.name
    : "Parallel";

  async function handleRefetchPetition() {
    const { data } = await refetchAccess();
    return data.access.petition;
  }

  const handleErrorFromFields = useCallback(async (error: any) => {
    if (isApolloError(error, "FIELD_ALREADY_REPLIED_ERROR")) {
      setShowRefreshRepliesAlert(true);
    } else if (isApolloError(error, "REPLY_ALREADY_DELETED_ERROR")) {
      await refetchAccess();
    } else if (
      isApolloError(error, "INVALID_REPLY_ERROR") ||
      isApolloError(error, "ID_VERIFICATION_FAILED")
    ) {
      // handled in field component
    } else if (isApolloError(error, "FORBIDDEN")) {
      showErrorToast(error);
    } else if (
      isApolloError(error, "PUBLIC_PETITION_NOT_AVAILABLE") ||
      isApolloError(error, "CONTACT_NOT_FOUND") ||
      isApolloError(error, "CONTACT_NOT_VERIFIED")
    ) {
      router.push(`/petition/${keycode}`);
    } else {
      throw error;
    }
  }, []);

  const isClosed = ["COMPLETED", "CLOSED"].includes(petition.status);
  const hasSignature = petition.signatureConfig?.review === false;

  return (
    <LastSavedProvider>
      <RecipientViewSidebarContextProvider>
        <ToneProvider value={tone}>
          <OverrideWithOrganizationTheme
            cssVarsRoot="body"
            brandTheme={petition.organization.brandTheme}
          >
            <Head>
              {isNonNullish(message) ? (
                <title>{`${message.subject!} | ${titleOrgName}`}</title>
              ) : (
                <title>{titleOrgName}</title>
              )}
            </Head>
            <Flex direction="column" height="100vh">
              {/* Header  */}
              <Stack spacing={0} divider={<Divider />}>
                {/* Navbar with logo  */}
                <RecipientViewHeader
                  keycode={keycode}
                  access={access}
                  hasSignature={hasSignature}
                  pendingPetitions={pending}
                  isClosed={isClosed}
                  onFinalize={handleFinalize}
                  canFinalize={canFinalize}
                />
                {/* Progress bar */}
                {petition.status !== "CLOSED" && (
                  <RecipientViewProgressBar petition={petition} width="100%" />
                )}
              </Stack>
              {/* End Header  */}
              {/* Main content */}
              <Stack
                flex="1"
                direction={{ base: "column", [breakpoint]: "row" }}
                overflow="hidden"
                borderTop="1px solid "
                borderTopColor="gray.200"
                spacing={0}
                divider={<Divider />}
              >
                <Flex
                  flex="1"
                  overflow="auto"
                  backgroundColor="primary.50"
                  zIndex={1}
                  flexDirection="column"
                  alignItems="center"
                  height="100%"
                >
                  {/* Alerts container */}
                  <Box position="sticky" top={0} width="100%" zIndex={2}>
                    {["COMPLETED", "CLOSED"].includes(petition.status) ? (
                      !petition.signatureConfig ||
                      (petition.signatureConfig && petition.signatureStatus === "COMPLETED") ? (
                        <RecipientViewPetitionStatusAlert
                          petition={petition}
                          granter={granter}
                          tone={tone}
                        />
                      ) : (
                        <RecipientViewSignatureSentAlert
                          petition={petition}
                          tone={tone}
                          onRefetch={handleRefetchPetition}
                        />
                      )
                    ) : null}
                    {showRefreshRepliesAlert ? (
                      <RecipientViewRefreshRepliesAlert
                        tone={tone}
                        onRefetch={async () => {
                          await refetchAccess();
                          setShowRefreshRepliesAlert(false);
                        }}
                      />
                    ) : null}
                  </Box>
                  {/* End Alerts container */}
                  {/* Content */}
                  <Flex flex="1" width="100%" padding={4} justify="center">
                    <Flex flexDirection="column" minWidth={0} maxWidth="container.sm" width="100%">
                      <Stack spacing={4} key={currentPage}>
                        <LiquidScopeProvider petition={petition}>
                          <AnimatePresence initial={false}>
                            {fieldsWithLogic.map(({ field, logic }) => {
                              return (
                                <LiquidPetitionVariableProvider key={field.id} logic={logic}>
                                  <RecipientViewPetitionField
                                    keycode={keycode}
                                    access={access!}
                                    field={field}
                                    isDisabled={petition.status === "CLOSED"}
                                    fieldLogic={logic}
                                    onError={handleErrorFromFields}
                                  />
                                </LiquidPetitionVariableProvider>
                              );
                            })}
                          </AnimatePresence>
                        </LiquidScopeProvider>
                        {pages.length === currentPage ? (
                          <Center paddingTop={4}>
                            <Button
                              colorScheme="primary"
                              onClick={handleFinalize}
                              isDisabled={isClosed}
                            >
                              {hasSignature ? (
                                <FormattedMessage
                                  id="generic.finalize-and-sign-button"
                                  defaultMessage="Finalize and sign"
                                />
                              ) : (
                                <FormattedMessage
                                  id="generic.finalize-button"
                                  defaultMessage="Finalize"
                                />
                              )}
                            </Button>
                          </Center>
                        ) : null}
                      </Stack>

                      <Spacer />
                      {pages.length > 1 ? (
                        <RecipientViewPagination
                          marginTop={8}
                          currentPage={currentPage}
                          pageCount={pages.length}
                        />
                      ) : null}
                      <RecipientViewFooter marginTop={12} petition={petition} />
                    </Flex>
                  </Flex>
                  {/* End Content */}
                </Flex>
                {/* Sidebar */}
                <RecipientViewSidebar
                  keycode={keycode}
                  access={access!}
                  currentPage={currentPage}
                />
              </Stack>
              {/* End Main content */}
              {/* Mobile navigation */}
              <RecipientViewMobileNavigation
                keycode={keycode}
                access={access!}
                currentPage={currentPage}
                pendingPetitions={pending}
              />
            </Flex>
          </OverrideWithOrganizationTheme>
        </ToneProvider>
      </RecipientViewSidebarContextProvider>
    </LastSavedProvider>
  );
}

const _fragments = {
  get PublicPetitionAccess() {
    return gql`
      fragment RecipientView_PublicPetitionAccess on PublicPetitionAccess {
        petition {
          ...RecipientView_PublicPetition
          isDelegateAccessEnabled
          organization {
            id
            name
            hasRemoveParallelBranding
            brandTheme {
              ...OverrideWithOrganizationTheme_OrganizationBrandThemeData
            }
          }
        }
        granter {
          ...RecipientView_PublicUser
        }
        message {
          ...RecipientView_PublicPetitionMessage
        }
        ...RecipientViewPetitionField_PublicPetitionAccess
        ...RecipientViewSidebar_PublicPetitionAccess
        ...RecipientViewHeader_PublicPetitionAccess
        ...useRecipientViewConfirmPetitionSignersDialog_PublicPetitionAccess
      }
      ${this.PublicPetition}
      ${this.PublicUser}
      ${useRecipientViewConfirmPetitionSignersDialog.fragments.PublicPetitionAccess}
      ${RecipientViewPetitionField.fragments.PublicPetitionAccess}
      ${this.PublicPetitionMessage}
      ${OverrideWithOrganizationTheme.fragments.OrganizationBrandThemeData}
      ${RecipientViewSidebar.fragments.PublicPetitionAccess}
      ${RecipientViewHeader.fragments.PublicPetitionAccess}
    `;
  },
  get PublicPetitionMessage() {
    return gql`
      fragment RecipientView_PublicPetitionMessage on PublicPetitionMessage {
        id
        subject
      }
    `;
  },
  get PublicPetition() {
    return gql`
      fragment RecipientView_PublicPetition on PublicPetition {
        id
        status
        deadline
        tone
        fields {
          id
          ...RecipientViewPetitionField_PublicPetitionField
          ...completedFieldReplies_PublicPetitionField
          ...focusPetitionField_PublicPetitionField
        }
        signatureConfig {
          review
        }
        recipients {
          ...RecipientViewHeader_PublicContact
        }
        signatureStatus
        isCompletingMessageEnabled
        ...RecipientViewContents_PublicPetition
        ...RecipientViewProgressBar_PublicPetition
        ...useGetPetitionPages_PublicPetition
        ...LiquidScopeProvider_PublicPetition
        ...useCompletingMessageDialog_PublicPetition
        ...RecipientViewFooter_PublicPetition
        ...RecipientViewPetitionStatusAlert_PublicPetition
        ...RecipientViewSignatureSentAlert_PublicPetition
        ...usePetitionCanFinalize_PublicPetition
      }
      ${focusPetitionField.fragments.PublicPetitionField}
      ${RecipientViewContents.fragments.PublicPetition}
      ${RecipientViewProgressBar.fragments.PublicPetition}
      ${RecipientViewHeader.fragments.PublicContact}
      ${RecipientViewFooter.fragments.PublicPetition}
      ${useGetPetitionPages.fragments.PublicPetition}
      ${LiquidScopeProvider.fragments.PublicPetition}
      ${useCompletingMessageDialog.fragments.PublicPetition}
      ${RecipientViewPetitionStatusAlert.fragments.PublicPetition}
      ${RecipientViewSignatureSentAlert.fragments.PublicPetition}
      ${usePetitionCanFinalize.fragments.PublicPetition}
      ${RecipientViewPetitionField.fragments.PublicPetitionField}
      ${completedFieldReplies.fragments.PublicPetitionField}
    `;
  },
  get PublicUser() {
    return gql`
      fragment RecipientView_PublicUser on PublicUser {
        ...RecipientViewContents_PublicUser
        ...RecipientViewPetitionStatusAlert_PublicUser
      }
      ${RecipientViewContents.fragments.PublicUser}
      ${RecipientViewPetitionStatusAlert.fragments.PublicUser}
    `;
  },
  ConnectionMetadata: gql`
    fragment RecipientView_ConnectionMetadata on ConnectionMetadata {
      country
      browserName
      deviceType
    }
  `,
};

const _mutations = [
  gql`
    mutation RecipientView_publicCompletePetition(
      $keycode: ID!
      $additionalSigners: [PublicPetitionSignerDataInput!]
      $message: String
    ) {
      publicCompletePetition(
        keycode: $keycode
        additionalSigners: $additionalSigners
        message: $message
      ) {
        id
        ...RecipientView_PublicPetition
      }
    }
    ${_fragments.PublicPetition}
  `,
];

const _queries = [
  gql`
    query RecipientView_access($keycode: ID!) {
      access(keycode: $keycode) {
        keycode
        hasClientPortalAccess
        ...RecipientView_PublicPetitionAccess
      }
      metadata(keycode: $keycode) {
        ...RecipientView_ConnectionMetadata
      }
    }
    ${_fragments.PublicPetitionAccess}
    ${_fragments.ConnectionMetadata}
  `,
  gql`
    query RecipientView_accesses($keycode: ID!) {
      pending: accesses(keycode: $keycode, status: PENDING) {
        totalCount
      }
    }
  `,
];

RecipientView.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const keycode = query.keycode as string;
  const page = parseInt(query.page as string);
  if (!Number.isInteger(page) || page <= 0) {
    throw new RedirectError(`/petition/${keycode}/1`);
  }
  try {
    const { data } = await fetchQuery(RecipientView_accessDocument, {
      variables: { keycode },
    });
    if (data.access.hasClientPortalAccess) {
      await fetchQuery(RecipientView_accessesDocument, {
        variables: { keycode },
      });
    }
    const pageCount =
      data!.access.petition.fields.filter(
        (f) => f.type === "HEADING" && f.options!.hasPageBreak && !f.isInternal,
      ).length + 1;
    if (page > pageCount) {
      throw new RedirectError(`/petition/${keycode}/1`);
    }
    return {
      keycode,
      currentPage: page,
      metadata: data.metadata,
    };
  } catch (error) {
    if (error instanceof RedirectError) {
      throw error;
    }
    if (
      isApolloError(error, "PUBLIC_PETITION_NOT_AVAILABLE") ||
      isApolloError(error, "CONTACT_NOT_FOUND") ||
      isApolloError(error, "CONTACT_NOT_VERIFIED")
    ) {
      throw new RedirectError(`/petition/${keycode}`);
    }
    throw error;
  }
};

export default compose(
  withAssertApolloQuery({
    query: RecipientView_accessDocument,
    variables: ({ keycode }: RecipientViewProps) => ({
      keycode,
    }),
    IfLoading: () => (
      <Stack
        padding={0}
        spacing={0}
        align="stretch"
        divider={<Divider />}
        width="100%"
        height="100vh"
        overflow="hidden"
      >
        {/* Header */}
        <Stack spacing={0} divider={<Divider />}>
          <HStack justify="space-between" align="center" paddingX={4} paddingY={2}>
            <Skeleton height="36px" width="150px" />
            <HStack>
              <Skeleton display={{ base: "none", md: "flex" }} height="40px" width="120px" />
              <Skeleton height="40px" width="100px" />
              <SkeletonCircle height="40px" width="40px" />
            </HStack>
          </HStack>
          {/* Progress Bar */}
          <HStack paddingY={1.5} paddingX={4}>
            <Skeleton height="16px" width="100px" /> <Skeleton height="12px" width="full" />
          </HStack>
        </Stack>

        {/* Main Content */}
        <Stack
          direction={{ base: "column", md: "row" }}
          divider={<Divider />}
          width="100%"
          height="100%"
          spacing={0}
          minHeight={0}
        >
          {/* Form Content */}
          <Stack
            flex="1"
            padding={6}
            width="100%"
            align="center"
            backgroundColor="gray.50"
            height="100%"
            overflow="hidden"
          >
            <Stack maxWidth="container.md" width="100%" spacing={8}>
              <Stack spacing={4}>
                <Skeleton height="20px" width="40%" />
                <SkeletonText height="40px" />
                <Skeleton height="40px" />
              </Stack>

              <Stack spacing={4}>
                <Skeleton height="20px" width="50%" />
                <Skeleton height="40px" />
                <Skeleton height="40px" />
              </Stack>

              <Stack spacing={4}>
                <Skeleton height="20px" width="20%" />
                <SkeletonText height="40px" />
              </Stack>

              <Stack spacing={4}>
                <Skeleton height="20px" width="70%" />
                <Skeleton height="40px" />
                <Skeleton height="40px" />
              </Stack>

              <Stack spacing={4}>
                <Skeleton height="20px" width="50%" />
                <Skeleton height="40px" />
                <Skeleton height="40px" />
              </Stack>

              <Stack spacing={4}>
                <Skeleton height="20px" width="20%" />
                <SkeletonText height="40px" />
              </Stack>

              <Stack spacing={4}>
                <Skeleton height="20px" width="70%" />
                <Skeleton height="40px" />
                <Skeleton height="40px" />
              </Stack>
            </Stack>
          </Stack>
          {/* Sidebar */}
          <Stack
            direction={{ base: "row", md: "column" }}
            padding={4}
            spacing={6}
            justify={{ base: "space-between", md: "inherit" }}
          >
            <Skeleton height="24px" width="24px" />
            <Skeleton height="24px" width="24px" />
            <Skeleton height="24px" width="24px" />
            <Skeleton display={{ base: "flex", md: "none" }} height="24px" width="24px" />
            <SkeletonCircle display={{ base: "flex", md: "none" }} height="24px" width="24px" />
          </Stack>
        </Stack>
      </Stack>
    ),
  }),
  withMetadata,
  withDialogs,
  withApolloData,
)(RecipientView);

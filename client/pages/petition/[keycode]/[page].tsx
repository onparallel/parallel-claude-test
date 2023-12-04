import { gql, useMutation, useQuery } from "@apollo/client";
import { Box, Button, Flex, Stack } from "@chakra-ui/react";
import { OverrideWithOrganizationTheme } from "@parallel/components/common/OverrideWithOrganizationTheme";
import { Spacer } from "@parallel/components/common/Spacer";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  DialogProps,
  useDialog,
  withDialogs,
} from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  RedirectError,
  WithApolloDataContext,
  withApolloData,
} from "@parallel/components/common/withApolloData";
import { LastSavedProvider } from "@parallel/components/recipient-view/LastSavedProvider";
import { RecipientViewContentsCard } from "@parallel/components/recipient-view/RecipientViewContentsCard";
import { RecipientViewFooter } from "@parallel/components/recipient-view/RecipientViewFooter";
import { RecipientViewHeader } from "@parallel/components/recipient-view/RecipientViewHeader";
import { RecipientViewPagination } from "@parallel/components/recipient-view/RecipientViewPagination";
import { RecipientViewPetitionStatusAlert } from "@parallel/components/recipient-view/RecipientViewPetitionStatusAlert";
import { RecipientViewProgressFooter } from "@parallel/components/recipient-view/RecipientViewProgressFooter";
import { RecipientViewRefreshRepliesAlert } from "@parallel/components/recipient-view/RecipientViewRefreshRepliesAlert";
import { RecipientViewSignatureSentAlert } from "@parallel/components/recipient-view/RecipientViewSignatureSentAlert";
import { useCompletingMessageDialog } from "@parallel/components/recipient-view/dialogs/CompletingMessageDialog";
import {
  RecipientViewConfirmPetitionSignersDialogResult,
  useRecipientViewConfirmPetitionSignersDialog,
} from "@parallel/components/recipient-view/dialogs/RecipientViewConfirmPetitionSignersDialog";
import { RecipientViewPetitionField } from "@parallel/components/recipient-view/fields/RecipientViewPetitionField";
import {
  RecipientView_PublicUserFragment,
  RecipientView_accessDocument,
  RecipientView_accessesDocument,
  RecipientView_publicCompletePetitionDocument,
  Tone,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { compose } from "@parallel/utils/compose";
import { LiquidPetitionVariableProvider } from "@parallel/utils/liquid/LiquidPetitionVariableProvider";
import { LiquidScopeProvider } from "@parallel/utils/liquid/LiquidScopeProvider";
import { withError } from "@parallel/utils/promises/withError";
import { UnwrapPromise } from "@parallel/utils/types";
import { useGetPetitionPages } from "@parallel/utils/useGetPetitionPages";
import { usePetitionCanFinalize } from "@parallel/utils/usePetitionCanFinalize";
import { withMetadata } from "@parallel/utils/withMetadata";
import useResizeObserver from "@react-hook/resize-observer";
import { AnimatePresence } from "framer-motion";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

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
  const granter = access!.granter!;
  const contact = access!.contact!;

  const recipients = petition!.recipients;
  const message = access!.message;

  const pages = useGetPetitionPages(petition, { hideInternalFields: true });
  const fieldsWithLogic = pages[currentPage - 1];
  const tone = petition.tone;

  const showFullScreenDialog =
    petition.isCompletingMessageEnabled &&
    (petition.completingMessageBody || petition.completingMessageSubject);

  const showErrorDialog = useErrorDialog();
  const [showErrors, setShowErrors] = useState(false);
  const [showRefreshRepliesAlert, setShowRefreshRepliesAlert] = useState(false);
  const [publicCompletePetition] = useMutation(RecipientView_publicCompletePetitionDocument);
  const showConfirmPetitionSignersDialog = useRecipientViewConfirmPetitionSignersDialog();
  const showReviewBeforeSigningDialog = useDialog(ReviewBeforeSignDialog);
  const showCompletingMessageDialog = useCompletingMessageDialog();
  const { canFinalize, incompleteFields } = usePetitionCanFinalize(petition, true);
  const handleFinalize = useCallback(
    async function () {
      try {
        setShowErrors(true);
        if (canFinalize) {
          let confirmSignerInfoData: RecipientViewConfirmPetitionSignersDialogResult | null = null;
          if (petition.signatureConfig?.review === false) {
            confirmSignerInfoData = await showConfirmPetitionSignersDialog({
              recipients: petition.recipients,
              signatureConfig: petition.signatureConfig,
              keycode,
              organization: granter.organization.name,
              contact,
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
            await showReviewBeforeSigningDialog({ granter, tone });
          }
          if (showFullScreenDialog && isDefined(data)) {
            await withError(
              showCompletingMessageDialog({
                petition: data!.publicCompletePetition,
                granter,
                hasClientPortalAccess: access.hasClientPortalAccess,
                pendingPetitions: pending,
                keycode,
                tone,
              }),
            );
          }
        } else {
          // go to first repliable field without replies

          const field = incompleteFields[0];
          const { keycode } = router.query;
          router.push(
            `/petition/${keycode}/${field.page}?${new URLSearchParams({
              field: field.id,
              ...(field.parentReplyId ? { parentReply: field.parentReplyId } : {}),
            })}`,
          );
        }
      } catch (e) {
        if (isApolloError(e, "CANT_COMPLETE_PETITION_ERROR")) {
          try {
            await showErrorDialog({
              message: intl.formatMessage({
                id: "recipient-view.complete-petition.error-message",
                defaultMessage:
                  "It looks like the parallel has been updated since you last accessed it. Please refresh your browser and try again. You will not lose your submitted answers.",
              }),
            });
            window.location.reload();
          } catch {}
        }
      }
    },
    [
      canFinalize,
      incompleteFields?.[0]?.id,
      incompleteFields?.[0]?.parentReplyId,
      incompleteFields?.[0]?.page,
      granter,
      router.query,
      pending,
    ],
  );

  const [sidebarTop, setSidebarTop] = useState(0);
  const alertsBoxRef = useRef<HTMLDivElement>(null);
  useResizeObserver(alertsBoxRef, (entry) => {
    setSidebarTop(entry.contentRect.height + 16);
  });

  const breakpoint = "md";

  const titleOrgName = granter.organization.hasRemoveParallelBranding
    ? granter.organization.name
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
    } else {
      throw error;
    }
  }, []);

  return (
    <LastSavedProvider>
      <ToneProvider value={tone}>
        <OverrideWithOrganizationTheme
          cssVarsRoot="body"
          brandTheme={granter.organization.brandTheme}
        >
          <Head>
            {isDefined(message) ? (
              <title>{`${message.subject!} | ${titleOrgName}`}</title>
            ) : (
              <title>{titleOrgName}</title>
            )}
          </Head>
          <Flex
            backgroundColor="primary.50"
            minHeight="100vh"
            zIndex={1}
            flexDirection="column"
            alignItems="center"
          >
            <RecipientViewHeader
              sender={granter}
              contact={contact}
              message={message}
              recipients={recipients}
              hasClientPortalAccess={access.hasClientPortalAccess}
              showDelegateAccess={access.petition.isDelegateAccessEnabled}
              pendingPetitions={pending}
              keycode={keycode}
              isClosed={["COMPLETED", "CLOSED"].includes(petition.status)}
            />
            <Box
              ref={alertsBoxRef}
              position="sticky"
              top={0}
              width="100%"
              zIndex={2}
              marginBottom={4}
            >
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
            <Flex
              flex="1"
              flexDirection={{ base: "column", [breakpoint]: "row" }}
              width="100%"
              maxWidth="container.lg"
              paddingX={4}
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
                  top={{ base: 0, [breakpoint]: `${sidebarTop}px` }}
                >
                  {petition.isRecipientViewContentsHidden ? null : (
                    <RecipientViewContentsCard
                      currentPage={currentPage}
                      petition={petition}
                      minHeight="12rem"
                      maxHeight="calc(100vh - 17rem)"
                    />
                  )}
                </Stack>
              </Box>
              <Flex flexDirection="column" flex="2" minWidth={0}>
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
                              showErrors={showErrors && !canFinalize}
                              fieldLogic={logic}
                              onError={handleErrorFromFields}
                            />
                          </LiquidPetitionVariableProvider>
                        );
                      })}
                    </AnimatePresence>
                  </LiquidScopeProvider>
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

            {petition.status !== "CLOSED" && (
              <RecipientViewProgressFooter
                petition={petition}
                onFinalize={handleFinalize}
                zIndex={2}
              />
            )}
          </Flex>
        </OverrideWithOrganizationTheme>
      </ToneProvider>
    </LastSavedProvider>
  );
}

function ReviewBeforeSignDialog({
  granter,
  tone,
  ...props
}: DialogProps<{ granter: RecipientView_PublicUserFragment; tone: Tone }>) {
  return (
    <ConfirmDialog
      closeOnEsc={false}
      closeOnOverlayClick={false}
      size="lg"
      header={
        <FormattedMessage
          id="recipient-view.review-before-sign.header"
          defaultMessage="Review and sign"
        />
      }
      body={
        <>
          <FormattedMessage
            id="recipient-view.review-before-sign.body-1"
            defaultMessage="This parallel requires an <b>eSignature</b> in order to be completed."
            values={{ tone }}
          />
          <Spacer marginTop={2} />
          <FormattedMessage
            id="recipient-view.review-before-sign.body-2"
            defaultMessage="{tone, select, INFORMAL{We have notified {name} to proceed with the review of the replies and once validated we will send an email with the document to people who has to sign it.} other{We have notified {name} to proceed with the review of the replies and once validated we will send an email with the document to sign by the appropriate people.}}"
            values={{
              name: <b>{granter.fullName}</b>,
              tone,
            }}
          />
        </>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
      cancel={<></>}
      {...props}
    />
  );
}

const _fragments = {
  get PublicPetitionAccess() {
    return gql`
      fragment RecipientView_PublicPetitionAccess on PublicPetitionAccess {
        petition {
          ...RecipientView_PublicPetition
          isDelegateAccessEnabled
          recipients {
            ...useRecipientViewConfirmPetitionSignersDialog_PublicContact
          }
        }
        granter {
          ...RecipientView_PublicUser
          organization {
            id
            name
            hasRemoveParallelBranding
            brandTheme {
              ...OverrideWithOrganizationTheme_OrganizationBrandThemeData
            }
          }
        }
        contact {
          ...RecipientViewHeader_PublicContact
          ...useRecipientViewConfirmPetitionSignersDialog_PublicContact
        }
        message {
          ...RecipientView_PublicPetitionMessage
        }
        ...RecipientViewPetitionField_PublicPetitionAccess
      }
      ${this.PublicPetition}
      ${this.PublicUser}
      ${RecipientViewHeader.fragments.PublicContact}
      ${useRecipientViewConfirmPetitionSignersDialog.fragments.PublicContact}
      ${RecipientViewPetitionField.fragments.PublicPetitionAccess}
      ${this.PublicPetitionMessage}
      ${OverrideWithOrganizationTheme.fragments.OrganizationBrandThemeData}
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
        isRecipientViewContentsHidden
        tone
        fields {
          id
          ...RecipientViewPetitionField_PublicPetitionField
          ...completedFieldReplies_PublicPetitionField
        }
        signatureConfig {
          review
          allowAdditionalSigners
          signers {
            fullName
            ...useRecipientViewConfirmPetitionSignersDialog_PetitionSigner
          }
          additionalSigners {
            ...useRecipientViewConfirmPetitionSignersDialog_PetitionSigner
          }
          ...useRecipientViewConfirmPetitionSignersDialog_PublicSignatureConfig
        }
        recipients {
          ...RecipientViewHeader_PublicContact
        }
        signatureStatus
        isCompletingMessageEnabled
        ...RecipientViewContentsCard_PublicPetition
        ...RecipientViewProgressFooter_PublicPetition
        ...useGetPetitionPages_PublicPetition
        ...LiquidScopeProvider_PublicPetition
        ...useCompletingMessageDialog_PublicPetition
        ...RecipientViewFooter_PublicPetition
        ...RecipientViewPetitionStatusAlert_PublicPetition
        ...RecipientViewSignatureSentAlert_PublicPetition
        ...usePetitionCanFinalize_PublicPetition
      }

      ${useRecipientViewConfirmPetitionSignersDialog.fragments.PetitionSigner}
      ${useRecipientViewConfirmPetitionSignersDialog.fragments.PublicSignatureConfig}
      ${RecipientViewContentsCard.fragments.PublicPetition}
      ${RecipientViewProgressFooter.fragments.PublicPetition}
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
        ...RecipientViewHeader_PublicUser
        ...RecipientViewContentsCard_PublicUser
        ...useCompletingMessageDialog_PublicUser
        ...RecipientViewPetitionStatusAlert_PublicUser
      }
      ${RecipientViewHeader.fragments.PublicUser}
      ${RecipientViewContentsCard.fragments.PublicUser}
      ${useCompletingMessageDialog.fragments.PublicUser}
      ${RecipientViewPetitionStatusAlert.fragments.PublicUser}
    `;
  },
  ConnectionMetadata: gql`
    fragment RecipientView_ConnectionMetadata on ConnectionMetadata {
      country
      browserName
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

export default compose(withMetadata, withDialogs, withApolloData)(RecipientView);

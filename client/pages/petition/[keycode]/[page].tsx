import { gql, useMutation, useQuery } from "@apollo/client";
import { AlertDescription, AlertIcon, Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { CloseableAlert } from "@parallel/components/common/CloseableAlert";
import { ContactListPopover } from "@parallel/components/common/ContactListPopover";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  DialogProps,
  useDialog,
  withDialogs,
} from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { OverrideWithOrganizationTheme } from "@parallel/components/common/OverrideWithOrganizationTheme";
import { Spacer } from "@parallel/components/common/Spacer";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import {
  RedirectError,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { useCompletingMessageDialog } from "@parallel/components/recipient-view/dialogs/CompletingMessageDialog";
import {
  RecipientViewConfirmPetitionSignersDialogResult,
  useRecipientViewConfirmPetitionSignersDialog,
} from "@parallel/components/recipient-view/dialogs/RecipientViewConfirmPetitionSignersDialog";
import { RecipientViewPetitionField } from "@parallel/components/recipient-view/fields/RecipientViewPetitionField";
import { LastSavedProvider } from "@parallel/components/recipient-view/LastSavedProvider";
import { RecipientViewContentsCard } from "@parallel/components/recipient-view/RecipientViewContentsCard";
import { RecipientViewFooter } from "@parallel/components/recipient-view/RecipientViewFooter";
import { RecipientViewHeader } from "@parallel/components/recipient-view/RecipientViewHeader";
import { RecipientViewPagination } from "@parallel/components/recipient-view/RecipientViewPagination";
import { RecipientViewProgressFooter } from "@parallel/components/recipient-view/RecipientViewProgressFooter";
import {
  RecipientView_accessDocument,
  RecipientView_accessesDocument,
  RecipientView_publicCompletePetitionDocument,
  RecipientView_PublicUserFragment,
  Tone,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { compose } from "@parallel/utils/compose";
import { withError } from "@parallel/utils/promises/withError";
import { UnwrapPromise } from "@parallel/utils/types";
import { useGetPageFields } from "@parallel/utils/useGetPageFields";
import { LiquidScopeProvider } from "@parallel/utils/useLiquid";
import { useLiquidScope } from "@parallel/utils/useLiquidScope";
import { withMetadata } from "@parallel/utils/withMetadata";
import useResizeObserver from "@react-hook/resize-observer";
import { AnimatePresence } from "framer-motion";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

type RecipientViewProps = UnwrapPromise<ReturnType<typeof RecipientView.getInitialProps>>;

function RecipientView({ keycode, currentPage }: RecipientViewProps) {
  const intl = useIntl();
  const router = useRouter();
  const {
    data: { access },
  } = useAssertQuery(RecipientView_accessDocument, { variables: { keycode } });

  const { data: accesessData, refetch: refetchAccessesCount } = useQuery(
    RecipientView_accessesDocument,
    {
      variables: { keycode },
      skip: !access.hasClientPortalAccess,
    }
  );

  const pending = access.hasClientPortalAccess
    ? accesessData!.pending.totalCount - (access.petition.status === "PENDING" ? 1 : 0)
    : 0;

  const petition = access!.petition!;
  const granter = access!.granter!;
  const contact = access!.contact!;
  const signers = petition!.signatureConfig?.signers ?? [];
  const totalSigners = signers.concat(petition.signatureConfig?.additionalSigners ?? []);
  const recipients = petition!.recipients;
  const message = access!.message;

  const { pages, visibility } = useGetPageFields(petition.fields, {
    hideInternalFields: true,
  });
  const fields = pages[currentPage - 1];
  const tone = petition.tone;

  const showFullScreenDialog =
    petition.isCompletingMessageEnabled &&
    (petition.completingMessageBody || petition.completingMessageSubject);

  const showErrorDialog = useErrorDialog();
  const [finalized, setFinalized] = useState(false);
  const [publicCompletePetition] = useMutation(RecipientView_publicCompletePetitionDocument);
  const showConfirmPetitionSignersDialog = useRecipientViewConfirmPetitionSignersDialog();
  const showReviewBeforeSigningDialog = useDialog(ReviewBeforeSignDialog);
  const showCompletingMessageDialog = useCompletingMessageDialog();
  const handleFinalize = useCallback(
    async function () {
      try {
        setFinalized(true);
        const canFinalize = petition.fields.every(
          (f, index) =>
            !visibility[index] ||
            f.isInternal ||
            f.optional ||
            completedFieldReplies(f).length > 0 ||
            f.isReadOnly
        );
        if (canFinalize) {
          let confirmSignerInfoData: RecipientViewConfirmPetitionSignersDialogResult | null = null;
          if (petition.signatureConfig?.review === false) {
            confirmSignerInfoData = await showConfirmPetitionSignersDialog({
              recipients: petition.recipients,
              allowAdditionalSigners: petition.signatureConfig.allowAdditionalSigners,
              presetSigners: signers,
              keycode,
              organization: granter.organization.name,
              contact,
              tone,
            });
          }
          await publicCompletePetition({
            variables: {
              keycode,
              additionalSigners: confirmSignerInfoData?.additionalSigners,
              message: confirmSignerInfoData?.message,
            },
          });
          if (petition.signatureConfig?.review) {
            await showReviewBeforeSigningDialog({ granter, tone });
          }
          if (showFullScreenDialog) {
            await withError(
              showCompletingMessageDialog({
                petition,
                granter,
                hasClientPortalAccess: access.hasClientPortalAccess,
                pendingPetitions: pending,
                keycode,
                tone,
              })
            );
          }
          refetchAccessesCount();
        } else {
          // go to first repliable field without replies
          let page = 1;
          const field = petition.fields.find((field, index) => {
            if (field.type === "HEADING" && field.options.hasPageBreak && !field.isInternal) {
              page += 1;
            }
            return (
              visibility[index] &&
              !completedFieldReplies(field).length &&
              !field.optional &&
              !field.isInternal &&
              !field.isReadOnly
            );
          })!;
          const { keycode } = router.query;
          router.push(
            `/petition/${keycode}/${page}?${new URLSearchParams({
              field: field.id,
            })}`
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
    [petition.fields, visibility, granter, router.query, refetchAccessesCount]
  );

  const [sidebarTop, setSidebarTop] = useState(0);
  const alertsBoxRef = useRef<HTMLDivElement>(null);
  useResizeObserver(alertsBoxRef, (entry) => {
    setSidebarTop(entry.contentRect.height + 16);
  });

  const breakpoint = "md";
  const scope = useLiquidScope(petition);

  const titleOrgName = granter.organization.hasRemoveParallelBranding
    ? granter.organization.name
    : "Parallel";

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
                  <CloseableAlert status="success" variant="subtle" zIndex={2}>
                    <Flex
                      maxWidth="container.lg"
                      alignItems="center"
                      justifyContent="flex-start"
                      marginX="auto"
                      width="100%"
                      paddingLeft={4}
                      paddingRight={12}
                    >
                      <AlertIcon />
                      <AlertDescription>
                        {petition.status === "COMPLETED" ? (
                          <>
                            <Text>
                              <FormattedMessage
                                id="recipient-view.petition-completed-alert-1"
                                defaultMessage="<b>Information completed!</b> We have notified {name} for review and validation."
                                values={{
                                  name: <b>{granter.fullName}</b>,
                                  tone,
                                }}
                              />
                            </Text>
                            <Text>
                              <FormattedMessage
                                id="recipient-view.petition-completed-alert-2"
                                defaultMessage="If you make any changes, don't forget to hit the <b>Finalize</b> button again."
                                values={{ tone }}
                              />
                            </Text>
                          </>
                        ) : (
                          <FormattedMessage
                            id="recipient-view.petition-closed-alert"
                            defaultMessage="This parallel has been closed. If you need to make any changes, please reach out to {name}."
                            values={{
                              name: <b>{granter.fullName}</b>,
                            }}
                          />
                        )}
                      </AlertDescription>
                    </Flex>
                  </CloseableAlert>
                ) : (
                  <CloseableAlert
                    status={petition.signatureConfig.review ? "warning" : "success"}
                    zIndex={2}
                  >
                    <Flex
                      maxWidth="container.lg"
                      alignItems="center"
                      justifyContent="flex-start"
                      marginX="auto"
                      width="100%"
                      paddingLeft={4}
                      paddingRight={12}
                    >
                      <AlertIcon
                        color={petition.signatureConfig.review ? "yellow.400" : undefined}
                      />
                      <AlertDescription>
                        {petition.signatureConfig.review ? (
                          <Text>
                            <FormattedMessage
                              id="recipient-view.petition-requires-signature-alert-1"
                              defaultMessage="<b>eSignature pending</b>, we will send the document to sign after the information is reviewed."
                              values={{ tone }}
                            />
                          </Text>
                        ) : (
                          <Text>
                            <FormattedMessage
                              id="recipient-view.petition-signature-request-sent-alert"
                              defaultMessage="<b>Document sent for signature</b> to {name} ({email}) {count, plural, =0{} other{and <a># more</a>}}."
                              values={{
                                a: (chunks: any) => (
                                  <ContactListPopover contacts={totalSigners.slice(1)}>
                                    <Text
                                      display="initial"
                                      textDecoration="underline"
                                      color="primary.600"
                                      cursor="pointer"
                                    >
                                      {chunks}
                                    </Text>
                                  </ContactListPopover>
                                ),
                                name: totalSigners[0]!.fullName,
                                email: totalSigners[0]!.email,
                                count: totalSigners.length - 1,
                              }}
                            />
                          </Text>
                        )}
                        <FormattedMessage
                          id="recipient-view.petition-completed-alert-2"
                          defaultMessage="If you make any changes, don't forget to hit the <b>Finalize</b> button again."
                          values={{ tone }}
                        />
                      </AlertDescription>
                    </Flex>
                  </CloseableAlert>
                )
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
                  <LiquidScopeProvider scope={scope}>
                    <AnimatePresence initial={false}>
                      {fields.map((field) => {
                        return (
                          <RecipientViewPetitionField
                            key={field.id}
                            petitionId={petition.id}
                            keycode={keycode}
                            access={access!}
                            field={field}
                            isDisabled={petition.status === "CLOSED"}
                            isInvalid={
                              finalized &&
                              completedFieldReplies(field).length === 0 &&
                              !field.optional
                            }
                          />
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
          ...RecipientView_PublicPetitionField
          ...useGetPageFields_PublicPetitionField
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
        }
        recipients {
          ...RecipientViewHeader_PublicContact
        }
        signatureStatus
        ...RecipientViewContentsCard_PublicPetition
        ...RecipientViewProgressFooter_PublicPetition
        ...useLiquidScope_PublicPetition
        isCompletingMessageEnabled
        ...useCompletingMessageDialog_PublicPetition
        ...RecipientViewFooter_PublicPetition
      }

      ${this.PublicPetitionField}
      ${useRecipientViewConfirmPetitionSignersDialog.fragments.PetitionSigner}
      ${RecipientViewContentsCard.fragments.PublicPetition}
      ${RecipientViewProgressFooter.fragments.PublicPetition}
      ${RecipientViewHeader.fragments.PublicContact}
      ${RecipientViewFooter.fragments.PublicPetition}
      ${useGetPageFields.fragments.PublicPetitionField}
      ${useLiquidScope.fragments.PublicPetition}
      ${useCompletingMessageDialog.fragments.PublicPetition}
    `;
  },
  get PublicPetitionField() {
    return gql`
      fragment RecipientView_PublicPetitionField on PublicPetitionField {
        id
        ...RecipientViewPetitionField_PublicPetitionField
        ...RecipientViewContentsCard_PublicPetitionField
        ...RecipientViewProgressFooter_PublicPetitionField
        ...completedFieldReplies_PublicPetitionField
      }
      ${RecipientViewPetitionField.fragments.PublicPetitionField}
      ${RecipientViewContentsCard.fragments.PublicPetitionField}
      ${RecipientViewProgressFooter.fragments.PublicPetitionField}
      ${completedFieldReplies.fragments.PublicPetitionField}
    `;
  },
  get PublicUser() {
    return gql`
      fragment RecipientView_PublicUser on PublicUser {
        ...RecipientViewHeader_PublicUser
        ...RecipientViewContentsCard_PublicUser
        ...useCompletingMessageDialog_PublicUser
      }
      ${RecipientViewHeader.fragments.PublicUser}
      ${RecipientViewContentsCard.fragments.PublicUser}
      ${useCompletingMessageDialog.fragments.PublicUser}
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
        (f) => f.type === "HEADING" && f.options!.hasPageBreak && !f.isInternal
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

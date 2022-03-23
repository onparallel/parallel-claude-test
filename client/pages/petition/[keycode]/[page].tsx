import { gql, useMutation } from "@apollo/client";
import {
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { CloseableAlert } from "@parallel/components/common/CloseableAlert";
import { ContactListPopover } from "@parallel/components/common/ContactListPopover";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  DialogProps,
  useDialog,
  withDialogs,
} from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { Spacer } from "@parallel/components/common/Spacer";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import {
  RedirectError,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
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
  RecipientView_publicCompletePetitionDocument,
  RecipientView_PublicUserFragment,
  Tone,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { compose } from "@parallel/utils/compose";
import { resolveUrl } from "@parallel/utils/next";
import { UnwrapPromise } from "@parallel/utils/types";
import { useGetPageFields } from "@parallel/utils/useGetPageFields";
import { LiquidScopeProvider } from "@parallel/utils/useLiquid";
import { useLiquidScope } from "@parallel/utils/useLiquidScope";
import { withMetadata } from "@parallel/utils/withMetadata";
import { AnimatePresence, motion } from "framer-motion";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import ResizeObserver, { DOMRect } from "react-resize-observer";

type RecipientViewProps = UnwrapPromise<ReturnType<typeof RecipientView.getInitialProps>>;
function RecipientView({ keycode, currentPage, pageCount }: RecipientViewProps) {
  const intl = useIntl();
  const router = useRouter();
  const toast = useToast();
  const {
    data: { access },
  } = useAssertQuery(RecipientView_accessDocument, { variables: { keycode } });
  const petition = access!.petition!;
  const granter = access!.granter!;
  const contact = access!.contact!;
  const signers = petition!.signatureConfig?.signers ?? [];
  const recipients = petition!.recipients;
  const message = access!.message;

  const tone = petition.tone;

  const { fields, pages, visibility } = useGetPageFields(petition.fields, currentPage, {
    hideInternalFields: true,
  });

  const showErrorDialog = useErrorDialog();
  const [finalized, setFinalized] = useState(false);
  const [publicCompletePetition] = useMutation(RecipientView_publicCompletePetitionDocument);
  const showConfirmPetitionSignersDialog = useRecipientViewConfirmPetitionSignersDialog();
  const showReviewBeforeSigningDialog = useDialog(ReviewBeforeSignDialog);
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
          if (!toast.isActive("petition-completed-toast")) {
            toast({
              id: "petition-completed-toast",
              title: intl.formatMessage({
                id: "recipient-view.completed-petition.toast-title",
                defaultMessage: "Petition completed!",
              }),
              description: intl.formatMessage(
                {
                  id: "recipient-view.completed-petition.toast-description",
                  defaultMessage: "{name} will be notified for its revision.",
                },
                { name: granter.fullName }
              ),
              status: "success",
              isClosable: true,
            });
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
          const { keycode } = router.query;
          router.push(`/petition/${keycode}/${page}#field-${field.id}`);
        }
      } catch (e) {
        if (isApolloError(e, "CANT_COMPLETE_PETITION_ERROR")) {
          try {
            await showErrorDialog({
              message: intl.formatMessage({
                id: "recipient-view.complete-petition.error-message",
                defaultMessage:
                  "It looks like the petition has been updated since you last accessed it. Please refresh your browser and try again. You will not lose your submitted answers.",
              }),
            });
            window.location.reload();
          } catch {}
        }
      }
    },
    [petition.fields, visibility, granter, router.query]
  );

  const [sidebarTop, setSidebarTop] = useState(0);
  const readjustHeight = useCallback(function (rect: DOMRect) {
    setSidebarTop(rect.height + 16);
  }, []);

  const breakpoint = "md";
  const scope = useLiquidScope(petition.fields);

  return (
    <LastSavedProvider>
      <ToneProvider value={tone}>
        <Head>
          {fields[0]?.type === "HEADING" && fields[0].title ? (
            <title>{fields[0].title} | Parallel</title>
          ) : (
            <title>Parallel</title>
          )}
        </Head>
        <Flex
          backgroundColor="gray.50"
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
            keycode={keycode}
            isClosed={["COMPLETED", "CLOSED"].includes(petition.status)}
          />
          <Box position="sticky" top={0} width="100%" zIndex={2} marginBottom={4}>
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
                              defaultMessage="{tone, select, INFORMAL{Great! You have completed the petition and we have notified {name} for review and validation.} other{This petition has been completed and {name} has been notified for its revision and validation.}}"
                              values={{
                                name: <b>{granter.fullName}</b>,
                                tone,
                              }}
                            />
                          </Text>
                          <Text>
                            <FormattedMessage
                              id="recipient-view.petition-completed-alert-2"
                              defaultMessage="If you want to make any changes don't forget to hit the <b>Finalize</b> button again."
                              values={{ tone }}
                            />
                          </Text>
                        </>
                      ) : (
                        <FormattedMessage
                          id="recipient-view.petition-closed-alert"
                          defaultMessage="This petition has been closed. If you need to make any changes, please reach out to {name}."
                          values={{
                            name: <b>{granter.fullName}</b>,
                          }}
                        />
                      )}
                    </AlertDescription>
                  </Flex>
                </CloseableAlert>
              ) : (
                <CloseableAlert status="warning" zIndex={2}>
                  <Flex
                    maxWidth="container.lg"
                    alignItems="center"
                    justifyContent="flex-start"
                    marginX="auto"
                    width="100%"
                    paddingLeft={4}
                    paddingRight={12}
                  >
                    <AlertIcon color="yellow.400" />
                    <AlertDescription>
                      {petition.signatureConfig.review ? (
                        <>
                          <Text>
                            <FormattedMessage
                              id="recipient-view.petition-requires-signature-alert-1"
                              defaultMessage="This petition requires an <b>eSignature</b> to be completed."
                            />
                          </Text>
                          <Text>
                            <FormattedMessage
                              id="recipient-view.petition-requires-signature-alert-2"
                              defaultMessage="We will send the <b>document to sign</b> once the replies have been reviewed and validated."
                            />
                          </Text>
                        </>
                      ) : (
                        <Text>
                          {petition.signatureConfig.signers.length > 0 ? (
                            <FormattedMessage
                              id="recipient-view.petition-signature-request-sent-alert"
                              defaultMessage="<b>We have sent the document to sign</b> to {name} ({email}) {count, plural, =0{} other{and <a># more</a>}} in order to finalize the petition."
                              values={{
                                a: (chunks: any) => (
                                  <ContactListPopover
                                    contacts={petition
                                      .signatureConfig!.signers.slice(1)
                                      .concat(petition.signatureConfig!.additionalSigners)}
                                  >
                                    <Text
                                      display="initial"
                                      textDecoration="underline"
                                      color="purple.600"
                                      cursor="pointer"
                                    >
                                      {chunks}
                                    </Text>
                                  </ContactListPopover>
                                ),
                                name: petition.signatureConfig.signers[0]!.fullName,
                                email: petition.signatureConfig.signers[0]!.email,
                                count:
                                  petition.signatureConfig.signers.length +
                                  petition.signatureConfig.additionalSigners.length -
                                  1,
                              }}
                            />
                          ) : (
                            <FormattedMessage
                              id="recipient-view.petition-signature-request-sent-alert.unknown-signer"
                              defaultMessage="<b>We have sent the document to sign</b> to the specified person in order to finalize the petition."
                            />
                          )}
                        </Text>
                      )}
                      <FormattedMessage
                        id="recipient-view.petition-completed-alert-2"
                        defaultMessage="If you want to make any changes don't forget to hit the <b>Finalize</b> button again."
                        values={{ tone }}
                      />
                    </AlertDescription>
                  </Flex>
                </CloseableAlert>
              )
            ) : null}
            <ResizeObserver onResize={readjustHeight} />
          </Box>
          <Flex
            flex="1"
            flexDirection={{ base: "column", [breakpoint]: "row" }}
            width="100%"
            maxWidth="container.lg"
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
                top={{ base: 0, [breakpoint]: `${sidebarTop}px` }}
              >
                {petition.isRecipientViewContentsHidden ? null : (
                  <RecipientViewContentsCard
                    currentPage={currentPage}
                    petition={petition}
                    maxHeight="calc(100vh - 18rem)"
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
                        <motion.div key={field.id} layout="position">
                          <RecipientViewPetitionField
                            key={field.id}
                            tone={tone}
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
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
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
              <RecipientViewFooter marginTop={12} />
            </Flex>
          </Flex>

          {petition.status !== "CLOSED" && (
            <RecipientViewProgressFooter petition={petition} onFinalize={handleFinalize} />
          )}
        </Flex>
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
            defaultMessage="This petition requires an <b>eSignature</b> in order to be completed."
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
        <Button colorScheme="purple" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
      cancel={<></>}
      {...props}
    />
  );
}
RecipientView.fragments = {
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
      }

      ${this.PublicPetitionField}
      ${useRecipientViewConfirmPetitionSignersDialog.fragments.PetitionSigner}
      ${RecipientViewContentsCard.fragments.PublicPetition}
      ${RecipientViewProgressFooter.fragments.PublicPetition}
      ${RecipientViewHeader.fragments.PublicContact}
      ${useGetPageFields.fragments.PublicPetitionField}
    `;
  },
  get PublicPetitionField() {
    return gql`
      fragment RecipientView_PublicPetitionField on PublicPetitionField {
        id
        ...RecipientViewPetitionField_PublicPetitionField
        ...RecipientViewContentsCard_PublicPetitionField
        ...RecipientViewProgressFooter_PublicPetitionField
        ...useLiquidScope_PublicPetitionField
      }
      ${RecipientViewPetitionField.fragments.PublicPetitionField}
      ${RecipientViewContentsCard.fragments.PublicPetitionField}
      ${RecipientViewProgressFooter.fragments.PublicPetitionField}
      ${useLiquidScope.fragments.PublicPetitionField}
    `;
  },
  get PublicUser() {
    return gql`
      fragment RecipientView_PublicUser on PublicUser {
        ...RecipientViewHeader_PublicUser
        ...RecipientViewContentsCard_PublicUser
      }
      ${RecipientViewHeader.fragments.PublicUser}
      ${RecipientViewContentsCard.fragments.PublicUser}
    `;
  },
};

RecipientView.mutations = [
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
    ${RecipientView.fragments.PublicPetition}
  `,
];

RecipientView.queries = [
  gql`
    query RecipientView_access($keycode: ID!) {
      access(keycode: $keycode) {
        ...RecipientView_PublicPetitionAccess
      }
      metadata(keycode: $keycode) {
        country
        browserName
      }
    }
    ${RecipientView.fragments.PublicPetitionAccess}
  `,
];

RecipientView.getInitialProps = async ({ query, pathname, fetchQuery }: WithApolloDataContext) => {
  const keycode = query.keycode as string;
  const page = parseInt(query.page as string);
  if (!Number.isInteger(page) || page <= 0) {
    throw new RedirectError(resolveUrl(pathname, { ...query, page: "1" }));
  }

  const { data } = await fetchQuery(RecipientView_accessDocument, {
    variables: { keycode },
  });
  if (!data?.access?.petition) {
    throw new Error();
  }
  const pageCount =
    data.access.petition.fields.filter((f) => f.type === "HEADING" && f.options!.hasPageBreak)
      .length + 1;
  if (page > pageCount) {
    throw new RedirectError(resolveUrl(pathname, { ...query, page: "1" }));
  }
  return { keycode, currentPage: page, pageCount, metadata: data.metadata };
};

export default compose(withMetadata, withDialogs, withApolloData)(RecipientView);

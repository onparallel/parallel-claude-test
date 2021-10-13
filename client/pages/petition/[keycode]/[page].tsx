import { gql } from "@apollo/client";
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
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { ContactListPopover } from "@parallel/components/common/ContactListPopover";
import { DialogProps, useDialog, withDialogs } from "@parallel/components/common/DialogProvider";
import { Spacer } from "@parallel/components/common/Spacer";
import { ToneProvider, useTone } from "@parallel/components/common/toneContext";
import {
  RedirectError,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import {
  CompleteSignerInfoDialogResult,
  useCompleteSignerInfoDialog,
} from "@parallel/components/recipient-view/CompleteSignerInfoDialog";
import { RecipientViewPetitionField } from "@parallel/components/recipient-view/fields/RecipientViewPetitionField";
import { RecipientViewContentsCard } from "@parallel/components/recipient-view/RecipientViewContentsCard";
import { RecipientViewFooter } from "@parallel/components/recipient-view/RecipientViewFooter";
import { RecipientViewHeader } from "@parallel/components/recipient-view/RecipientViewHeader";
import { useRecipientViewHelpDialog } from "@parallel/components/recipient-view/RecipientViewHelpModal";
import { RecipientViewPagination } from "@parallel/components/recipient-view/RecipientViewPagination";
import { RecipientViewProgressFooter } from "@parallel/components/recipient-view/RecipientViewProgressFooter";
import {
  OrgPreferedTone,
  PublicPetitionQuery,
  PublicPetitionQueryVariables,
  RecipientView_PublicPetitionFieldFragment,
  RecipientView_PublicUserFragment,
  usePublicPetitionQuery,
  useRecipientView_publicCompletePetitionMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { compose } from "@parallel/utils/compose";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import { groupFieldsByPages } from "@parallel/utils/groupFieldsByPage";
import { resolveUrl } from "@parallel/utils/next";
import { UnwrapPromise } from "@parallel/utils/types";
import { AnimatePresence, motion } from "framer-motion";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import ResizeObserver, { DOMRect } from "react-resize-observer";
import { isDefined } from "remeda";

type RecipientViewProps = UnwrapPromise<ReturnType<typeof RecipientView.getInitialProps>>;

function RecipientView({ keycode, currentPage, pageCount }: RecipientViewProps) {
  const intl = useIntl();
  const router = useRouter();
  const toast = useToast();
  const {
    data: { access },
  } = assertQuery(usePublicPetitionQuery({ variables: { keycode } }));
  const petition = access!.petition!;
  const granter = access!.granter!;
  const contact = access!.contact!;
  const signers = petition!.signature?.signers ?? [];
  const recipients = petition!.recipients;
  const message = access!.message;

  const tone = petition.preferedTone;

  const { fields, pages, visibility } = useGetPageFields(petition.fields, currentPage);

  const [finalized, setFinalized] = useState(false);
  const [publicCompletePetition] = useRecipientView_publicCompletePetitionMutation();
  const showCompleteSignerInfoDialog = useCompleteSignerInfoDialog();
  const showReviewBeforeSigningDialog = useDialog(ReviewBeforeSignDialog);
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
          let completeSignerInfoData: CompleteSignerInfoDialogResult | null = null;
          if (petition.signature?.review === false) {
            completeSignerInfoData = await showCompleteSignerInfoDialog({
              recipientCanAddSigners: petition.signature.letRecipientsChooseSigners,
              signers: signers.filter(isDefined),
              keycode,
              organization: granter.organization.name,
              contact,
              tone,
            });
          }
          await publicCompletePetition({
            variables: {
              keycode,
              additionalSigners: completeSignerInfoData?.additionalSigners,
              message: completeSignerInfoData?.message,
            },
          });
          if (petition.signature?.review) {
            await showReviewBeforeSigningDialog({ granter });
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
              !field.validated &&
              !field.isReadOnly
            );
          })!;
          const { keycode } = router.query;
          router.push(`/petition/${keycode}/${page}#field-${field.id}`);
        }
      } catch {}
    },
    [petition.fields, visibility, granter, router.query]
  );

  const [sidebarTop, setSidebarTop] = useState(0);
  const readjustHeight = useCallback(function (rect: DOMRect) {
    setSidebarTop(rect.height + 16);
  }, []);

  const handleHelpClick = useHelpModal({ tone });

  const breakpoint = "md";
  return (
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
            !petition.signature ||
            (petition.signature && petition.signatureStatus === "COMPLETED") ? (
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
                            defaultMessage="{tone, select, INFORMAL{Great! You have completed the request and we have notified {name} for review and validation.} other{This petition has been completed and {name} has been notified for its revision and validation.}}"
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
              <CloseableAlert backgroundColor="yellow.100" zIndex={2}>
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
                    {petition.signature.review ? (
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
                        {petition.signature.signers.length > 0 ? (
                          <FormattedMessage
                            id="recipient-view.petition-signature-request-sent-alert"
                            defaultMessage="<b>We have sent the document to sign</b> to {name} ({email}) {count, plural, =0{} other{and <a># more</a>}} in order to finalize the petition."
                            values={{
                              a: (chunks: any) => (
                                <ContactListPopover
                                  contacts={petition
                                    .signature!.signers.filter(isDefined)
                                    .slice(1)
                                    .concat(
                                      petition.signature!.additionalSigners.filter(isDefined)
                                    )}
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
                              name: petition.signature.signers[0]!.fullName,
                              email: petition.signature.signers[0]!.email,
                              count:
                                petition.signature.signers.length +
                                petition.signature.additionalSigners.length -
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
          >
            <Stack
              spacing={4}
              position={{ base: "relative", [breakpoint]: "sticky" }}
              top={{ base: 0, [breakpoint]: `${sidebarTop}px` }}
            >
              {petition.isRecipientViewContentsHidden ? null : (
                <RecipientViewContentsCard
                  currentPage={currentPage}
                  hasCommentsEnabled={petition.hasCommentsEnabled}
                  sender={granter}
                  petition={petition}
                  display={{ base: "none", [breakpoint]: "flex" }}
                />
              )}
              <Button variant="outline" onClick={handleHelpClick}>
                <FormattedMessage id="recipient-view.need-help" defaultMessage="Help" />
              </Button>
            </Stack>
          </Box>
          <Flex flexDirection="column" flex="2" minWidth={0}>
            <Stack spacing={4} key={currentPage}>
              <AnimatePresence initial={false}>
                {fields.map((field) => (
                  <motion.div key={field.id} layout="position">
                    <RecipientViewPetitionField
                      key={field.id}
                      petitionId={petition.id}
                      keycode={keycode}
                      access={access!}
                      field={field}
                      isDisabled={field.validated || petition.status === "CLOSED"}
                      isInvalid={
                        finalized &&
                        !field.validated &&
                        completedFieldReplies(field).length === 0 &&
                        !field.optional
                      }
                      hasCommentsEnabled={petition.hasCommentsEnabled}
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
            <RecipientViewFooter marginTop={12} />
          </Flex>
        </Flex>

        {petition.status !== "CLOSED" && (
          <RecipientViewProgressFooter petition={petition} onFinalize={handleFinalize} />
        )}
      </Flex>
    </ToneProvider>
  );
}

function ReviewBeforeSignDialog({
  granter,
  ...props
}: DialogProps<{ granter: RecipientView_PublicUserFragment }>) {
  const tone = useTone();
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
        }
        granter {
          ...RecipientView_PublicUser
        }
        contact {
          ...RecipientViewHeader_PublicContact
          ...useCompleteSignerInfoDialog_PublicContact
        }
        message {
          ...RecipientView_PublicPetitionMessage
        }
        ...RecipientViewPetitionField_PublicPetitionAccess
      }
      ${this.PublicPetition}
      ${this.PublicUser}
      ${RecipientViewHeader.fragments.PublicContact}
      ${useCompleteSignerInfoDialog.fragments.PublicContact}
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
        hasCommentsEnabled
        isRecipientViewContentsHidden
        preferedTone
        fields {
          ...RecipientView_PublicPetitionField
        }
        signature {
          review
          letRecipientsChooseSigners
          signers {
            ...RecipientView_PublicContact
          }
          additionalSigners {
            ...RecipientView_PublicContact
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
      ${this.PublicContact}
      ${RecipientViewContentsCard.fragments.PublicPetition}
      ${RecipientViewProgressFooter.fragments.PublicPetition}
      ${RecipientViewHeader.fragments.PublicContact}
    `;
  },
  get PublicContact() {
    return gql`
      fragment RecipientView_PublicContact on PublicContact {
        id
        fullName
        firstName
        lastName
        email
      }
    `;
  },
  get PublicPetitionField() {
    return gql`
      fragment RecipientView_PublicPetitionField on PublicPetitionField {
        id
        ...RecipientViewPetitionField_PublicPetitionField
        ...RecipientViewContentsCard_PublicPetitionField
        ...RecipientViewProgressFooter_PublicPetitionField
      }
      ${RecipientViewPetitionField.fragments.PublicPetitionField}
      ${RecipientViewContentsCard.fragments.PublicPetitionField}
      ${RecipientViewProgressFooter.fragments.PublicPetitionField}
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

function useGetPageFields(fields: RecipientView_PublicPetitionFieldFragment[], page: number) {
  const visibility = useFieldVisibility(fields);
  return useMemo(() => {
    const pages = groupFieldsByPages(fields, visibility);
    return { fields: pages[page - 1], pages: pages.length, visibility };
  }, [fields, page, visibility]);
}

function useHelpModal({ tone }: { tone: OrgPreferedTone }) {
  const showRecipientViewHelpDialog = useRecipientViewHelpDialog();
  useEffect(() => {
    showHelp();
  }, []);

  async function showHelp() {
    const key = "recipient-first-time-check";
    if (isLocalStorageAvailable() && !localStorage.getItem(key)) {
      try {
        await showRecipientViewHelpDialog({ tone });
        localStorage.setItem(key, "check");
      } catch {}
    }
  }
  return async function () {
    try {
      await showRecipientViewHelpDialog({ tone });
    } catch {}
  };
}

function isLocalStorageAvailable() {
  try {
    localStorage.getItem("");
    return true;
  } catch (e: any) {
    return false;
  }
}

RecipientView.getInitialProps = async ({ query, pathname, fetchQuery }: WithApolloDataContext) => {
  const keycode = query.keycode as string;
  const page = parseInt(query.page as string);
  if (!Number.isInteger(page) || page <= 0) {
    throw new RedirectError(resolveUrl(pathname, { ...query, page: "1" }));
  }

  const result = await fetchQuery<PublicPetitionQuery, PublicPetitionQueryVariables>(
    gql`
      query PublicPetition($keycode: ID!) {
        access(keycode: $keycode) {
          ...RecipientView_PublicPetitionAccess
        }
      }
      ${RecipientView.fragments.PublicPetitionAccess}
    `,
    { variables: { keycode } }
  );
  if (!result.data?.access?.petition) {
    throw new Error();
  }
  const pageCount =
    result.data.access.petition.fields.filter(
      (f) => f.type === "HEADING" && f.options!.hasPageBreak
    ).length + 1;
  if (page > pageCount) {
    throw new RedirectError(resolveUrl(pathname, { ...query, page: "1" }));
  }
  return { keycode, currentPage: page, pageCount };
};

export default compose(withDialogs, withApolloData)(RecipientView);

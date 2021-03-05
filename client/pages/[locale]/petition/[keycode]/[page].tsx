import { gql } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  CloseButton,
  Flex,
  ListItem,
  Stack,
  Text,
  UnorderedList,
  useToast,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
  withDialogs,
} from "@parallel/components/common/DialogProvider";
import { Spacer } from "@parallel/components/common/Spacer";
import {
  RedirectError,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { RecipientViewPetitionField } from "@parallel/components/recipient-view/fields/RecipientViewPetitionField";
import { RecipientViewContactCard } from "@parallel/components/recipient-view/RecipientViewContactCard";
import { RecipientViewContentsCard } from "@parallel/components/recipient-view/RecipientViewContentsCard";
import { RecipientViewFooter } from "@parallel/components/recipient-view/RecipientViewFooter";
import { useRecipientViewHelpDialog } from "@parallel/components/recipient-view/RecipientViewHelpModal";
import { RecipientViewPagination } from "@parallel/components/recipient-view/RecipientViewPagination";
import { RecipientViewProgressFooter } from "@parallel/components/recipient-view/RecipientViewProgressFooter";
import { RecipientViewSenderCard } from "@parallel/components/recipient-view/RecipientViewSenderCard";
import {
  PublicPetitionQuery,
  PublicPetitionQueryVariables,
  RecipientView_PublicContactFragment,
  RecipientView_PublicPetitionFieldFragment,
  RecipientView_PublicPetitionFragment,
  usePublicPetitionQuery,
  useRecipientView_publicCompletePetitionMutation,
  useRecipientView_submitUnpublishedCommentsMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { compose } from "@parallel/utils/compose";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import { groupFieldsByPages } from "@parallel/utils/groupFieldsByPage";
import { resolveUrl } from "@parallel/utils/next";
import { Maybe, UnwrapPromise } from "@parallel/utils/types";
import { AnimatePresence, motion } from "framer-motion";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import ResizeObserver, { DOMRect } from "react-resize-observer";

type RecipientViewProps = UnwrapPromise<
  ReturnType<typeof RecipientView.getInitialProps>
>;

function RecipientView({
  keycode,
  currentPage,
  pageCount,
}: RecipientViewProps) {
  const intl = useIntl();
  const router = useRouter();
  const toast = useToast();
  const {
    data: { access },
  } = assertQuery(usePublicPetitionQuery({ variables: { keycode } }));
  const petition = access!.petition!;
  const granter = access!.granter!;
  const contact = access!.contact!;
  const signers = petition!.signers!;

  const { fields, pages } = useGetPageFields(petition.fields, currentPage);

  const [showAlert, setShowAlert] = useState(true);

  const [finalized, setFinalized] = useState(false);
  const confirmStartSignatureProcessDialog = useDialog(
    ConfirmStartSignatureProcess
  );
  const [completePetition] = useRecipientView_publicCompletePetitionMutation();
  const handleFinalize = useCallback(
    async function () {
      try {
        setFinalized(true);
        const canFinalize = fields.every(
          (f) => f.optional || f.replies.length > 0 || f.isReadOnly
        );
        if (canFinalize) {
          if (signers.length > 0) {
            await confirmStartSignatureProcessDialog({
              signers,
              contactId: contact.id,
            });
          }
          await completePetition({ variables: { keycode } });
          toast({
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
        } else {
          // go to first repliable field without replies
          let page = 1;
          const field = fields.find((f) => {
            if (f.type === "HEADING" && f.options.hasPageBreak) {
              page += 1;
            }
            return f.replies.length === 0 && !f.optional && !f.isReadOnly;
          })!;
          const { keycode, locale } = router.query;
          router.push(
            `/${locale}/petition/${keycode}/${page}#field-${field.id}`
          );
        }
      } catch {}
    },
    [fields, granter, router.query]
  );

  const [
    submitUnpublishedComments,
    { loading: isSubmitting },
  ] = useRecipientView_submitUnpublishedCommentsMutation();
  async function handleSubmitUnpublished() {
    await submitUnpublishedComments({
      variables: { keycode },
      update(client, { data }) {
        if (data) {
          updateFragment<RecipientView_PublicPetitionFragment>(client, {
            fragment: RecipientView.fragments.PublicPetition,
            fragmentName: "RecipientView_PublicPetition",
            id: petition.id,
            data: (cached) => ({
              ...cached!,
              fields: cached!.fields.map((field) =>
                field.unpublishedCommentCount
                  ? { ...field, unpublishedCommentCount: 0 }
                  : field
              ),
            }),
          });
        }
      },
    });
  }

  const pendingComments = fields.reduce(
    (acc, f) => acc + f.unpublishedCommentCount,
    0
  );

  // Prevent closing when theres pending comments
  useEffect(() => {
    if (pendingComments) {
      window.addEventListener("beforeunload", handler);
      return () => window.removeEventListener("beforeunload", handler);
    }
    function handler(event: BeforeUnloadEvent) {
      event.returnValue = "";
      event.preventDefault();
    }
  }, [pendingComments]);

  const [sidebarTop, setSidebarTop] = useState(0);
  const readjustHeight = useCallback(function (rect: DOMRect) {
    setSidebarTop(rect.height + 16);
  }, []);

  const handleHelpClick = useHelpModal();

  const breakpoint = "md";
  return (
    <>
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
        <Box position="sticky" top={0} width="100%" zIndex={2} marginBottom={4}>
          {showAlert && ["COMPLETED", "CLOSED"].includes(petition.status) ? (
            <Alert status="success" variant="subtle" zIndex={2}>
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
                          defaultMessage="This petition has been completed and {name} has been notified for its revision and validation."
                          values={{
                            name: <b>{granter.fullName}</b>,
                          }}
                        />
                      </Text>
                      <Text>
                        <FormattedMessage
                          id="recipient-view.petition-completed-alert-2"
                          defaultMessage="If you want to make any changes don't forget to hit the <b>Finalize</b> button again."
                          values={{
                            b: (chunks: any[]) => <b>{chunks}</b>,
                          }}
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
              <CloseButton
                position="absolute"
                right="8px"
                top="8px"
                onClick={() => setShowAlert(false)}
              />
            </Alert>
          ) : null}
          {pendingComments ? (
            <Box backgroundColor="yellow.100" boxShadow="sm">
              <Flex
                maxWidth="container.lg"
                alignItems="center"
                marginX="auto"
                width="100%"
                paddingX={4}
                paddingY={2}
              >
                <Text flex="1" color="yellow.900">
                  <FormattedMessage
                    id="recipient-view.submit-unpublished-comments-text"
                    defaultMessage="You have some pending comments. Submit them at once to notify {sender} in a single email."
                    values={{ sender: <b>{granter.fullName}</b> }}
                  />
                </Text>
                <Button
                  colorScheme="yellow"
                  size="sm"
                  marginLeft={4}
                  onClick={handleSubmitUnpublished}
                  isDisabled={isSubmitting}
                >
                  <FormattedMessage
                    id="recipient-view.submit-unpublished-comments-button"
                    defaultMessage="Submit {commentCount, plural, =1 {# comment} other{# comments}}"
                    values={{ commentCount: pendingComments }}
                  />
                </Button>
              </Flex>
            </Box>
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
            flex="1"
            minWidth={0}
            marginRight={{ base: 0, [breakpoint]: 4 }}
            marginBottom={4}
          >
            <Stack
              spacing={4}
              position={{ base: "relative", [breakpoint]: "sticky" }}
              top={{ base: 0, [breakpoint]: `${sidebarTop}px` }}
            >
              <RecipientViewSenderCard sender={granter} />
              <RecipientViewContactCard
                contact={contact}
                keycode={keycode}
                organizationName={granter.organization.name}
              />
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
                <FormattedMessage
                  id="recipient-view.need-help"
                  defaultMessage="Help"
                />
              </Button>
            </Stack>
          </Box>
          <Flex flexDirection="column" flex="2" minWidth={0}>
            <Stack spacing={4}>
              <AnimatePresence initial={false}>
                {fields.map((field) => (
                  <motion.div key={field.id} layout="position">
                    <RecipientViewPetitionField
                      key={field.id}
                      id={`field-${field.id}`}
                      petitionId={petition.id}
                      keycode={keycode}
                      access={access!}
                      field={field}
                      isDisabled={
                        field.validated || petition.status === "CLOSED"
                      }
                      isInvalid={
                        finalized &&
                        field.replies.length === 0 &&
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
        <Spacer />
        {petition.status !== "CLOSED" && (
          <RecipientViewProgressFooter
            petition={petition}
            onFinalize={handleFinalize}
          />
        )}
      </Flex>
    </>
  );
}

interface ConfirmStartSignatureProcessProps {
  signers: Maybe<RecipientView_PublicContactFragment>[];
  contactId: string;
}

function ConfirmStartSignatureProcess({
  signers,
  contactId,
  ...props
}: DialogProps<ConfirmStartSignatureProcessProps>) {
  return (
    <ConfirmDialog
      closeOnEsc={false}
      closeOnOverlayClick={false}
      size="lg"
      header={
        <FormattedMessage
          id="petition.finalize-start-signature.header"
          defaultMessage="Sign petition"
        />
      }
      body={
        <>
          <FormattedMessage
            id="petition.finalize-start-signature.body-1"
            defaultMessage="This petition requires an eSignature in order to be completed."
          />
          <Spacer marginTop={2} />
          <FormattedMessage
            id="petition.finalize-start-signature.body-2"
            defaultMessage="After you click on <b>Continue with eSignature</b>, we will send an e-mail with information on how to complete the process to the following people:"
            values={{
              b: (chunks: any[]) => <b>{chunks}</b>,
            }}
          />
          <Spacer marginTop={4} />
          <UnorderedList>
            {signers.map((s, i) => {
              return (
                <ListItem key={i}>
                  {s?.fullName} {`<${s?.email}> `}
                </ListItem>
              );
            })}
          </UnorderedList>
        </>
      }
      confirm={
        <Button colorScheme="purple" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="petition.continue-with-signature"
            defaultMessage="Continue with eSignature"
          />
        </Button>
      }
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
          ...RecipientViewContactCard_PublicContact
        }
        ...RecipientViewPetitionField_PublicPetitionAccess
      }
      ${this.PublicPetition}
      ${this.PublicUser}
      ${RecipientViewContactCard.fragments.PublicContact}
      ${RecipientViewPetitionField.fragments.PublicPetitionAccess}
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
        fields {
          ...RecipientView_PublicPetitionField
        }
        signers {
          ...RecipientView_PublicContact
        }
        ...RecipientViewContentsCard_PublicPetition
        ...RecipientViewProgressFooter_PublicPetition
      }

      ${this.PublicPetitionField}
      ${this.PublicContact}
      ${RecipientViewContentsCard.fragments.PublicPetition}
      ${RecipientViewProgressFooter.fragments.PublicPetition}
    `;
  },
  get PublicContact() {
    return gql`
      fragment RecipientView_PublicContact on PublicContact {
        id
        fullName
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
        ...RecipientViewSenderCard_PublicUser
        ...RecipientViewContentsCard_PublicUser
      }
      ${RecipientViewSenderCard.fragments.PublicUser}
      ${RecipientViewContentsCard.fragments.PublicUser}
    `;
  },
};

RecipientView.mutations = [
  gql`
    mutation RecipientView_publicCompletePetition($keycode: ID!) {
      publicCompletePetition(keycode: $keycode) {
        id
        status
      }
    }
  `,
  gql`
    mutation RecipientView_submitUnpublishedComments($keycode: ID!) {
      publicSubmitUnpublishedComments(keycode: $keycode) {
        id
        publishedAt
      }
    }
  `,
];

function useGetPageFields(
  fields: RecipientView_PublicPetitionFieldFragment[],
  page: number
) {
  const fieldVisibility = useFieldVisibility(fields);
  return useMemo(() => {
    const pages = groupFieldsByPages(fields, fieldVisibility);
    return { fields: pages[page - 1], pages: pages.length };
  }, [fields, page, fieldVisibility]);
}

function useHelpModal() {
  const showRecipientViewHelpDialog = useRecipientViewHelpDialog();
  useEffect(() => {
    showHelp();
  }, []);

  async function showHelp() {
    const key = "recipient-first-time-check";
    if (isLocalStorageAvailable() && !localStorage.getItem(key)) {
      try {
        await showRecipientViewHelpDialog({});
        localStorage.setItem(key, "check");
      } catch {}
    }
  }
  return async function () {
    try {
      await showRecipientViewHelpDialog({});
    } catch {}
  };
}

function isLocalStorageAvailable() {
  try {
    localStorage.getItem("");
    return true;
  } catch (e) {
    return false;
  }
}

RecipientView.getInitialProps = async ({
  query,
  pathname,
  fetchQuery,
}: WithApolloDataContext) => {
  const keycode = query.keycode as string;
  const page = parseInt(query.page as string);
  if (!Number.isInteger(page) || page <= 0) {
    throw new RedirectError(resolveUrl(pathname, { ...query, page: "1" }));
  }

  const result = await fetchQuery<
    PublicPetitionQuery,
    PublicPetitionQueryVariables
  >(
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

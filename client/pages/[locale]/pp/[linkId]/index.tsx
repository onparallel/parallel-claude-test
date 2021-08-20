import { gql } from "@apollo/client";
import { Box, Center, Flex, SimpleGrid, Stack, Text, useToast } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { withApolloData } from "@parallel/components/common/withApolloData";
import { PublicPetitionEmailExists } from "@parallel/components/public/public-petitions/PublicPetitionEmailExists";
import { PublicPetitionEmailSent } from "@parallel/components/public/public-petitions/PublicPetitionEmailSent";
import {
  PublicPetitionInitialForm,
  PublicPetitionInitialFormInputs,
} from "@parallel/components/public/public-petitions/PublicPetitionInitialForm";
import { PublicPetitionReminder } from "@parallel/components/public/public-petitions/PublicPetitionReminder";
import {
  PublicPetitionLink_PublicPetitionLinkFragment,
  PublicTemplateLink_publicPetitionLinkBySlugQuery,
  PublicTemplateLink_publicPetitionLinkBySlugQueryVariables,
  usePublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkMutation,
  usePublicPetitionLink_publicSendReminderMutation,
} from "@parallel/graphql/__types";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { isInsecureBrowser } from "@parallel/utils/isInsecureBrowser";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
export type PublicPetitionLinkSteps = "INITIAL" | "EMAIL_SENT" | "EMAIL_EXISTS" | "REMINDER_SENT";

export type HandleNewPublicPetitionProps = {
  formData?: PublicPetitionInitialFormInputs;
  force: boolean;
};

function PublicPetitionLink({
  publicPetitionLinkBySlug,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const intl = useIntl();

  const toast = useToast();

  const [step, setStep] = useState<PublicPetitionLinkSteps>("INITIAL");

  const [submittedData, setSubmittedData] = useState<PublicPetitionInitialFormInputs>();

  const { id, description, title, organization } =
    publicPetitionLinkBySlug as PublicPetitionLink_PublicPetitionLinkFragment;

  const [createPublicPetition, { loading }] =
    usePublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkMutation({});

  const [sendReminder, { loading: reminderLoading }] =
    usePublicPetitionLink_publicSendReminderMutation({});

  const onSubmit: SubmitHandler<PublicPetitionInitialFormInputs> = async (formData) => {
    setSubmittedData(formData);
    handleNewPublicPetition({ formData, force: false });
  };

  const showErrorToast = () => {
    toast({
      title: intl.formatMessage({
        id: "public.public-petition.error-title",
        defaultMessage: "Oops! An error happened",
      }),
      description: intl.formatMessage({
        id: "public.public-petition.error-description",
        defaultMessage: "Please try again later",
      }),
      status: "error",
      duration: 9000,
      isClosable: true,
    });
  };

  const handleNewPublicPetition = async ({ formData, force }: HandleNewPublicPetitionProps) => {
    try {
      const _data = formData ?? submittedData;

      const { data, errors } = await createPublicPetition({
        variables: {
          publicPetitionLinkId: id,
          contactFirstName: _data?.firstName ?? "",
          contactLastName: _data?.lastName ?? "",
          contactEmail: _data?.email ?? "",
          force,
        },
      });

      if (errors) {
        throw errors;
      }

      if (data?.publicCreateAndSendPetitionFromPublicLink === "SUCCESS") {
        setStep("EMAIL_SENT");
      } else if (data?.publicCreateAndSendPetitionFromPublicLink === "FAILURE") {
        showErrorToast();
      }
    } catch (error) {
      if (
        error?.graphQLErrors?.[0]?.extensions.code === "PUBLIC_LINK_ACCESS_ALREADY_CREATED_ERROR"
      ) {
        setStep("EMAIL_EXISTS");
      } else {
        showErrorToast();
      }
    }
  };

  const handleContinueExisting = async () => {
    try {
      const { data, errors } = await sendReminder({
        variables: {
          publicPetitionLinkId: id,
          contactEmail: submittedData?.email ?? "",
        },
      });

      if (errors) {
        throw errors;
      }

      if (data?.publicSendReminder === "SUCCESS") {
        setStep("REMINDER_SENT");
      } else if (data?.publicSendReminder === "FAILURE") {
        showErrorToast();
      }
    } catch (error) {
      if (error?.graphQLErrors?.[0]?.extensions.code === "REMINDER_ALREADY_SENT_ERROR") {
        toast({
          title: intl.formatMessage({
            id: "public.public-petition.error-reminder-title",
            defaultMessage: "Reminder already sent",
          }),
          description: intl.formatMessage({
            id: "public.public-petition.error--reminder-description",
            defaultMessage: "You can only send one reminder each 24 hours",
          }),
          status: "error",
          duration: 12000,
          isClosable: true,
        });
      } else {
        showErrorToast();
      }
    }
  };

  return (
    <>
      <Head>
        <title>{`Parallel | ${
          organization.name === "Parallel" ? title : organization.name
        }`}</title>
      </Head>
      <Center
        padding={{ base: 0, md: 6 }}
        minHeight="100vh"
        height={{ base: "100vh", md: "auto" }}
        width="full"
        backgroundColor="gray.50"
        overflow="auto"
      >
        <Stack
          spacing={0}
          width={{ base: "full", md: "auto" }}
          height={{ base: "full", md: "auto" }}
          rounded={{ base: undefined, md: "xl" }}
          shadow={{ base: undefined, md: "lg" }}
          border={{ base: undefined, md: "1px solid" }}
          borderColor={{ base: undefined, md: "gray.200" }}
          backgroundColor="white"
          overflow="auto"
        >
          <SimpleGrid
            paddingX={{ base: 6, md: 8 }}
            paddingY={{ base: 6, md: 10 }}
            paddingBottom={{ base: 10, md: undefined }}
            gap={8}
            columns={{ base: 1, md: step !== "INITIAL" ? 1 : 2 }}
          >
            {step === "REMINDER_SENT" ? (
              <PublicPetitionReminder
                organization={organization}
                email={submittedData?.email ?? ""}
              />
            ) : step === "EMAIL_SENT" ? (
              <PublicPetitionEmailSent
                organization={organization}
                email={submittedData?.email ?? ""}
              />
            ) : step === "EMAIL_EXISTS" ? (
              <PublicPetitionEmailExists
                organization={organization}
                onContinue={handleContinueExisting}
                onNewPetition={handleNewPublicPetition}
                isNewRequestLoading={loading}
                isReminderLoading={reminderLoading}
              />
            ) : (
              <PublicPetitionInitialForm
                organization={organization}
                title={title}
                description={description}
                onSubmit={onSubmit}
                isLoading={loading}
              />
            )}
          </SimpleGrid>
          <Flex justifyContent="flex-end" alignItems="flex-end" flex="1">
            <NakedLink href="/" passHref>
              <Box
                backgroundColor="gray.200"
                borderTopLeftRadius="xl"
                paddingX={4}
                paddingY={1.5}
                width="min-content"
                cursor="pointer"
                height="min-content"
              >
                <Text as="span" fontSize="sm" whiteSpace="nowrap">
                  <FormattedMessage
                    id="recipient-view.powered-by"
                    defaultMessage="Powered by {parallel}"
                    values={{
                      parallel: (
                        <Text as="a" fontWeight="bold" fontFamily="hero">
                          Parallel
                        </Text>
                      ),
                    }}
                  />
                </Text>
              </Box>
            </NakedLink>
          </Flex>
        </Stack>
      </Center>
    </>
  );
}

PublicPetitionLink.fragments = {
  PublicPetitionLink: gql`
    fragment PublicPetitionLink_PublicPetitionLink on PublicPetitionLink {
      id
      title
      description
      organization {
        name
        logoUrl
      }
    }
  `,
};

PublicPetitionLink.mutations = [
  gql`
    mutation PublicPetitionLink_publicCreateAndSendPetitionFromPublicLink(
      $publicPetitionLinkId: GID!
      $contactFirstName: String!
      $contactLastName: String!
      $contactEmail: String!
      $force: Boolean
    ) {
      publicCreateAndSendPetitionFromPublicLink(
        publicPetitionLinkId: $publicPetitionLinkId
        contactFirstName: $contactFirstName
        contactLastName: $contactLastName
        contactEmail: $contactEmail
        force: $force
      )
    }
  `,
  gql`
    mutation PublicPetitionLink_publicSendReminder(
      $publicPetitionLinkId: GID!
      $contactEmail: String!
    ) {
      publicSendReminder(publicPetitionLinkId: $publicPetitionLinkId, contactEmail: $contactEmail)
    }
  `,
];

export async function getServerSideProps({
  query: { locale, linkId },
  req,
}: GetServerSidePropsContext) {
  if (isInsecureBrowser(req.headers["user-agent"])) {
    return {
      redirect: {
        destination: `/${locale}/update-browser`,
        permanent: false,
      },
    };
  }

  try {
    const client = createApolloClient({}, { req });
    const { data } = await client.query<
      PublicTemplateLink_publicPetitionLinkBySlugQuery,
      PublicTemplateLink_publicPetitionLinkBySlugQueryVariables
    >({
      query: gql`
        query PublicTemplateLink_publicPetitionLinkBySlug($slug: String!) {
          publicPetitionLinkBySlug(slug: $slug) {
            ...PublicPetitionLink_PublicPetitionLink
          }
        }
        ${PublicPetitionLink.fragments.PublicPetitionLink}
      `,
      variables: {
        slug: linkId as string,
      },
    });

    if (!data?.publicPetitionLinkBySlug) {
      return {
        notFound: true,
      };
    } else {
      return {
        props: { publicPetitionLinkBySlug: data.publicPetitionLinkBySlug },
      };
    }
  } catch (err) {
    return {
      notFound: true,
    };
  }
}

export default withApolloData(PublicPetitionLink);

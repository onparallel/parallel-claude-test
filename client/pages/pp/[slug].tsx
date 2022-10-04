import { gql, useMutation } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Center,
  Flex,
  SimpleGrid,
  Spacer,
  Text,
  useToast,
} from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { OverrideWithOrganizationTheme } from "@parallel/components/common/OverrideWithOrganizationTheme";
import { withApolloData } from "@parallel/components/common/withApolloData";
import { PublicPetitionEmailExists } from "@parallel/components/public/public-petitions/PublicPetitionEmailExists";
import { PublicPetitionEmailSent } from "@parallel/components/public/public-petitions/PublicPetitionEmailSent";
import {
  PublicPetitionInitialForm,
  PublicPetitionInitialFormInputs,
} from "@parallel/components/public/public-petitions/PublicPetitionInitialForm";
import { PublicPetitionReminder } from "@parallel/components/public/public-petitions/PublicPetitionReminder";
import {
  PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkDocument,
  PublicPetitionLink_publicPetitionLinkBySlugDocument,
  PublicPetitionLink_PublicPublicPetitionLinkFragment,
  PublicPetitionLink_publicSendReminderDocument,
} from "@parallel/graphql/__types";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import jwtDecode from "jwt-decode";
import {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  InferGetServerSidePropsType,
} from "next";
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
  slug,
  publicPetitionLink,
  prefill,
  defaultValues,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const intl = useIntl();

  const toast = useToast();

  const [step, setStep] = useState<PublicPetitionLinkSteps>("INITIAL");

  const [submittedData, setSubmittedData] = useState<PublicPetitionInitialFormInputs>();

  const {
    description,
    title,
    owner: { organization },
  } = publicPetitionLink;

  const [createPublicPetition, { loading }] = useMutation(
    PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkDocument
  );

  const [sendReminder, { loading: reminderLoading }] = useMutation(
    PublicPetitionLink_publicSendReminderDocument
  );

  const onSubmit: SubmitHandler<PublicPetitionInitialFormInputs> = async (formData) => {
    setSubmittedData(formData);
    handleNewPublicPetition({ formData, force: false });
  };

  const showGenericErrorToast = useGenericErrorToast();

  const handleNewPublicPetition = async ({ formData, force }: HandleNewPublicPetitionProps) => {
    try {
      const _data = formData ?? submittedData;

      const { data } = await createPublicPetition({
        variables: {
          slug,
          contactFirstName: _data?.firstName ?? "",
          contactLastName: _data?.lastName ?? "",
          contactEmail: _data?.email ?? "",
          force,
          prefill,
        },
      });

      if (data?.publicCreateAndSendPetitionFromPublicLink === "SUCCESS") {
        setStep("EMAIL_SENT");
      } else if (data?.publicCreateAndSendPetitionFromPublicLink === "FAILURE") {
        showGenericErrorToast();
      }
    } catch (error) {
      if (isApolloError(error, "PUBLIC_LINK_ACCESS_ALREADY_CREATED_ERROR")) {
        setStep("EMAIL_EXISTS");
      } else {
        showGenericErrorToast(error);
      }
    }
  };

  const handleContinueExisting = async () => {
    try {
      const { data } = await sendReminder({
        variables: {
          slug,
          contactEmail: submittedData?.email ?? "",
        },
      });

      if (data?.publicSendReminder === "SUCCESS") {
        setStep("REMINDER_SENT");
      } else if (data?.publicSendReminder === "FAILURE") {
        showGenericErrorToast();
      }
    } catch (error) {
      if (
        isApolloError(error) &&
        error.graphQLErrors[0]?.extensions?.code === "REMINDER_ALREADY_SENT_ERROR"
      ) {
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
        showGenericErrorToast(error);
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
      <OverrideWithOrganizationTheme
        cssVarsRoot="body"
        brandTheme={publicPetitionLink.owner.organization.brandTheme}
      >
        <Center
          padding={{ base: 0, md: 6 }}
          minHeight="100vh"
          height={{ base: "100vh", md: "auto" }}
          width="full"
          backgroundColor="gray.50"
          overflow="auto"
        >
          <Flex
            flexDirection="column"
            width={{ base: "full", md: "auto" }}
            height={{ base: "full", md: "auto" }}
            rounded={{ base: undefined, md: "xl" }}
            shadow={{ base: undefined, md: "lg" }}
            border={{ base: undefined, md: "1px solid" }}
            borderColor={{ base: undefined, md: "gray.200" }}
            backgroundColor="white"
            overflow="auto"
          >
            {!publicPetitionLink.isAvailable ? (
              <Alert status="warning">
                <AlertIcon color="yellow.500" />
                <AlertTitle>
                  <FormattedMessage
                    id="public.public-petition-link-unavailable.title"
                    defaultMessage="This process is closed"
                  />
                </AlertTitle>
                <AlertDescription>
                  -{" "}
                  <FormattedMessage
                    id="public.public-petition-link-unavailable.description"
                    defaultMessage="Contact with {fullName} <{email}> to continue."
                    values={{
                      fullName: publicPetitionLink.owner.fullName!,
                      email: publicPetitionLink.owner.email,
                    }}
                  />
                </AlertDescription>
              </Alert>
            ) : null}
            <SimpleGrid
              paddingX={{ base: 6, md: 8 }}
              paddingY={{ base: 6, md: 10 }}
              paddingBottom={{ base: 10, md: undefined }}
              gap={8}
              columns={{ base: 1, md: step !== "INITIAL" ? 1 : 2 }}
            >
              {step === "REMINDER_SENT" ? (
                <PublicPetitionReminder
                  organizationName={organization.name}
                  logoUrl={organization.logoUrl}
                  email={submittedData?.email ?? ""}
                />
              ) : step === "EMAIL_SENT" ? (
                <PublicPetitionEmailSent
                  organizationName={organization.name}
                  logoUrl={organization.logoUrl}
                  email={submittedData?.email ?? ""}
                />
              ) : step === "EMAIL_EXISTS" ? (
                <PublicPetitionEmailExists
                  organizationName={organization.name}
                  logoUrl={organization.logoUrl}
                  onContinue={handleContinueExisting}
                  onNewPetition={handleNewPublicPetition}
                  isNewRequestLoading={loading}
                  isReminderLoading={reminderLoading}
                />
              ) : (
                <PublicPetitionInitialForm
                  organizationName={organization.name}
                  logoUrl={organization.logoUrl}
                  title={title}
                  description={description}
                  onSubmit={onSubmit}
                  isLoading={loading}
                  isDisabled={!publicPetitionLink.isAvailable}
                  defaultValues={defaultValues}
                />
              )}
            </SimpleGrid>
            {publicPetitionLink.owner.organization.hasRemoveParallelBranding ? null : (
              <>
                <Spacer />
                <Flex justifyContent="flex-end">
                  <NakedLink
                    href={`https://www.onparallel.com/${intl.locale}?ref=parallel_public_link`}
                  >
                    <Box
                      as="a"
                      target="_blank"
                      backgroundColor="gray.200"
                      borderTopLeftRadius="xl"
                      paddingX={4}
                      paddingY={1.5}
                      fontSize="sm"
                      whiteSpace="nowrap"
                    >
                      <FormattedMessage
                        id="recipient-view.created-with"
                        defaultMessage="Created with {parallel}"
                        values={{ parallel: <Text as="b">Parallel</Text> }}
                      />
                    </Box>
                  </NakedLink>
                </Flex>
              </>
            )}
          </Flex>
        </Center>
      </OverrideWithOrganizationTheme>
    </>
  );
}

PublicPetitionLink.fragments = {
  PublicPublicPetitionLink: gql`
    fragment PublicPetitionLink_PublicPublicPetitionLink on PublicPublicPetitionLink {
      title
      isAvailable
      description
      owner {
        fullName
        email
        organization {
          name
          logoUrl
          hasRemoveParallelBranding
          brandTheme {
            fontFamily
            color
          }
        }
      }
    }
  `,
};

PublicPetitionLink.mutations = [
  gql`
    mutation PublicPetitionLink_publicCreateAndSendPetitionFromPublicLink(
      $slug: ID!
      $contactFirstName: String!
      $contactLastName: String!
      $contactEmail: String!
      $force: Boolean
      $prefill: String
    ) {
      publicCreateAndSendPetitionFromPublicLink(
        slug: $slug
        contactFirstName: $contactFirstName
        contactLastName: $contactLastName
        contactEmail: $contactEmail
        force: $force
        prefill: $prefill
      )
    }
  `,
  gql`
    mutation PublicPetitionLink_publicSendReminder($slug: ID!, $contactEmail: String!) {
      publicSendReminder(slug: $slug, contactEmail: $contactEmail)
    }
  `,
];

PublicPetitionLink.queries = [
  gql`
    query PublicPetitionLink_publicPetitionLinkBySlug($slug: ID!, $prefill: String) {
      publicPetitionLinkBySlug(slug: $slug, prefill: $prefill) {
        ...PublicPetitionLink_PublicPublicPetitionLink
      }
    }
    ${PublicPetitionLink.fragments.PublicPublicPetitionLink}
  `,
];

type PublicPetitionLinkServerSideProps = {
  prefill: string | null;
  slug: string;
  publicPetitionLink: PublicPetitionLink_PublicPublicPetitionLinkFragment;
  defaultValues?: PublicPetitionInitialFormInputs;
};

export async function getServerSideProps({
  req,
  query: { slug, prefill },
  locale,
}: GetServerSidePropsContext): Promise<
  GetServerSidePropsResult<PublicPetitionLinkServerSideProps>
> {
  try {
    const client = createApolloClient({}, { req });
    const { data } = await client.query({
      query: PublicPetitionLink_publicPetitionLinkBySlugDocument,
      variables: {
        slug: slug as string,
        prefill: (prefill ?? null) as string | null,
      },
    });

    if (data?.publicPetitionLinkBySlug) {
      const props: PublicPetitionLinkServerSideProps = {
        slug: slug as string,
        publicPetitionLink: data.publicPetitionLinkBySlug,
        prefill: (prefill ?? null) as string | null,
      };
      if (prefill && typeof prefill === "string") {
        props.defaultValues = jwtDecode(prefill);
      }
      return { props };
    } else {
      return { notFound: true };
    }
  } catch (err) {
    return {
      notFound: true,
    };
  }
}

export default withApolloData(PublicPetitionLink);

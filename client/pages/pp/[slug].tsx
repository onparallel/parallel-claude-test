import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
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
  PublicPetitionInitialFormData,
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

interface HandleNewPublicPetitionProps {
  formData?: PublicPetitionInitialFormData;
  force: boolean;
}

function PublicPetitionLink({
  slug,
  publicPetitionLink,
  defaultValues,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const intl = useIntl();

  const toast = useToast();

  const [step, setStep] = useState<PublicPetitionLinkSteps>("INITIAL");

  const [submittedData, setSubmittedData] = useState<PublicPetitionInitialFormData>();

  const {
    description,
    title,
    owner: { organization },
    allowMultiplePetitions,
  } = publicPetitionLink;

  const hasRemoveParallelBranding = organization.hasRemoveParallelBranding;

  const [createPublicPetition, { loading }] = useMutation(
    PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkDocument,
  );

  const [sendReminder, { loading: reminderLoading }] = useMutation(
    PublicPetitionLink_publicSendReminderDocument,
  );

  const onSubmit: SubmitHandler<PublicPetitionInitialFormData> = async (formData) => {
    setSubmittedData(formData);
    handleNewPublicPetition({ formData, force: false });
  };

  const showGenericErrorToast = useGenericErrorToast();

  const handleNewPublicPetition = async ({ formData, force }: HandleNewPublicPetitionProps) => {
    const _data = formData ?? submittedData;
    try {
      const { data } = await createPublicPetition({
        variables: {
          slug,
          contactFirstName: _data?.firstName ?? "",
          contactLastName: _data?.lastName ?? "",
          contactEmail: _data?.email ?? "",
          force,
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
        if (!allowMultiplePetitions) {
          await handleSendReminder(_data!.email);
        }
      } else if (isApolloError(error, "ARG_VALIDATION_ERROR")) {
        const code = (error as any).errors[0]?.extensions?.extra?.error_code;
        if (code === "INVALID_MX_EMAIL_ERROR" || code === "INVALID_EMAIL_ERROR") {
          toast({
            status: "error",
            title: intl.formatMessage({
              id: "page.public-petition.invalid-email-toast-title",
              defaultMessage: "Invalid email",
            }),
            description: intl.formatMessage({
              id: "page.public-petition.invalid-email-toast-description",
              defaultMessage: "The provided email is invalid.",
            }),
          });
        } else {
          showGenericErrorToast(error);
        }
      } else {
        showGenericErrorToast(error);
      }
    }
  };

  const handleSendReminder = async (email: string) => {
    try {
      const { data } = await sendReminder({
        variables: {
          slug,
          contactEmail: submittedData?.email ?? email,
        },
      });

      return data?.publicSendReminder;
    } catch (error) {
      if (isApolloError(error, "REMINDER_ALREADY_SENT_ERROR")) {
        toast({
          title: intl.formatMessage({
            id: "page.public-petition-link.error-reminder-title",
            defaultMessage: "Reminder already sent",
          }),
          description: intl.formatMessage({
            id: "page.public-petition-link.error-reminder-description",
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

  const handleContinueExisting = async () => {
    const result = await handleSendReminder(submittedData!.email);
    if (result === "SUCCESS") {
      setStep("REMINDER_SENT");
    } else if (result === "FAILURE") {
      showGenericErrorToast();
    }
  };

  const titleOrgName = hasRemoveParallelBranding ? organization.name : "Parallel";

  return (
    <>
      <Head>
        <title>{`${title} | ${titleOrgName}`}</title>
      </Head>
      <OverrideWithOrganizationTheme cssVarsRoot="body" brandTheme={organization.brandTheme}>
        <Center
          padding={{ base: 0, md: 6 }}
          minHeight="100vh"
          height={{ base: "100vh", md: "auto" }}
          width="full"
          backgroundColor="primary.50"
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
                <AlertIcon />
                <AlertTitle>
                  <FormattedMessage
                    id="page.public-petition-link.link-unavailable-title"
                    defaultMessage="This process is closed"
                  />
                </AlertTitle>
                <AlertDescription>
                  -{" "}
                  <FormattedMessage
                    id="page.public-petition-link.link-unavailable-description"
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
                  logoUrl={organization.logoUrl340x160}
                  email={submittedData?.email ?? ""}
                />
              ) : step === "EMAIL_SENT" ? (
                <PublicPetitionEmailSent
                  organizationName={organization.name}
                  logoUrl={organization.logoUrl340x160}
                  email={submittedData?.email ?? ""}
                />
              ) : step === "EMAIL_EXISTS" ? (
                publicPetitionLink.allowMultiplePetitions ? (
                  <PublicPetitionEmailExists
                    organizationName={organization.name}
                    logoUrl={organization.logoUrl340x160}
                    onContinue={handleContinueExisting}
                    onNewPetition={handleNewPublicPetition}
                    isNewRequestLoading={loading}
                    isReminderLoading={reminderLoading}
                  />
                ) : (
                  <PublicPetitionEmailSent
                    organizationName={organization.name}
                    logoUrl={organization.logoUrl340x160}
                    email={submittedData?.email ?? ""}
                    hasExistingProcess={true}
                  />
                )
              ) : (
                <PublicPetitionInitialForm
                  organizationName={organization.name}
                  logoUrl={organization.logoUrl340x160}
                  title={title}
                  description={description}
                  onSubmit={onSubmit}
                  isLoading={loading}
                  isDisabled={!publicPetitionLink.isAvailable}
                  defaultValues={defaultValues}
                />
              )}
            </SimpleGrid>
            {hasRemoveParallelBranding ? null : (
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
                      borderTopStartRadius="xl"
                      paddingX={4}
                      paddingY={1.5}
                      fontSize="sm"
                      whiteSpace="nowrap"
                    >
                      <FormattedMessage
                        id="generic.created-with-parallel"
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

const _fragments = {
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
          logoUrl340x160: logoUrl(options: { resize: { width: 340, height: 160, fit: inside } })
          hasRemoveParallelBranding
          brandTheme {
            fontFamily
            color
          }
        }
      }
      allowMultiplePetitions
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
    ) {
      publicCreateAndSendPetitionFromPublicLink(
        slug: $slug
        contactFirstName: $contactFirstName
        contactLastName: $contactLastName
        contactEmail: $contactEmail
        force: $force
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
  `,
];

interface PublicPetitionLinkServerSideProps {
  slug: string;
  publicPetitionLink: PublicPetitionLink_PublicPublicPetitionLinkFragment;
  defaultValues?: PublicPetitionInitialFormData;
}

export async function getServerSideProps({
  req,
  query: { slug },
  locale,
}: GetServerSidePropsContext): Promise<
  GetServerSidePropsResult<PublicPetitionLinkServerSideProps>
> {
  try {
    const client = createApolloClient({}, { req });
    const { data } = await client.query({
      query: PublicPetitionLink_publicPetitionLinkBySlugDocument,
      variables: { slug: slug as string },
    });

    if (data?.publicPetitionLinkBySlug) {
      const props: PublicPetitionLinkServerSideProps = {
        slug: slug as string,
        publicPetitionLink: data.publicPetitionLinkBySlug,
      };

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

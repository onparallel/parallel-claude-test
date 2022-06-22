import { gql, useMutation } from "@apollo/client";
import { Box, Center, Flex, Image, keyframes, Stack, useCounter } from "@chakra-ui/react";
import { Logo } from "@parallel/components/common/Logo";
import { Steps } from "@parallel/components/common/Steps";
import { withApolloData } from "@parallel/components/common/withApolloData";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicSignupForm } from "@parallel/components/public/signup/PublicSignupForm";
import { PublicSignupFormExperience } from "@parallel/components/public/signup/PublicSignupFormExperience";
import { PublicSignupFormInbox } from "@parallel/components/public/signup/PublicSignupFormInbox";
import { PublicSignupFormName } from "@parallel/components/public/signup/PublicSignupFormName";
import { PublicSignupFormOrganization } from "@parallel/components/public/signup/PublicSignupFormOrganization";
import { PublicSignupRightHeading } from "@parallel/components/public/signup/PublicSignupRightHeading";
import {
  Signup_publicLicenseCodeDocument,
  Signup_userSignUpDocument,
} from "@parallel/graphql/__types";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { Maybe } from "@parallel/utils/types";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { useEffect, useRef } from "react";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";

type SignupFormData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationLogo?: Maybe<File> | undefined;
  industry?: Maybe<string> | undefined;
  role?: Maybe<string> | undefined;
  position?: Maybe<string> | undefined;
  captcha: string;
};

interface SignupProps {
  code?: string;
  source?: string;
  activationEmail?: string;
}

function Signup({ code, source, activationEmail }: SignupProps) {
  const intl = useIntl();

  const genericErrorToast = useGenericErrorToast();

  const formData = useRef<Partial<SignupFormData>>({});

  const {
    valueAsNumber: currentStep,
    increment: nextStep,
    decrement: prevStep,
  } = useCounter({ min: 0, max: 4, defaultValue: 0 });

  const [userSignUp, { loading }] = useMutation(Signup_userSignUpDocument);

  const SUBMIT_STEP = 3;
  const handleNextPage = async (data: Partial<SignupFormData>) => {
    formData.current = { ...formData.current, ...data };

    if (currentStep === SUBMIT_STEP) {
      try {
        await userSignUp({
          variables: {
            ...(formData.current as SignupFormData),
            locale: intl.locale,
            licenseCode: code,
          },
        });
      } catch (error) {
        genericErrorToast();
      }
    }
    nextStep();
  };

  useEffect(() => {
    // track current step of registration process into analytics
    window.analytics?.track("Register Steps", {
      step: currentStep,
      email: formData.current.email,
      firstName: formData.current.firstName,
      lastName: formData.current.lastName,
    });
  }, [currentStep]);

  const imageKeyFrames = keyframes`
    from {
      opacity: 0;
      transform: translateX(60px);
    }
    to {
      transform: translateX(0px);
      opacity: 1;
    }
  `;

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.login.signup",
        defaultMessage: "Sign Up",
      })}
      description={intl.formatMessage({
        id: "public.signup.meta-description",
        defaultMessage: "Signup on Parallel",
      })}
      hideHeader
      hideFooter
    >
      <Flex minHeight="100vh">
        <Flex direction="column" paddingX={{ base: 6, md: 20 }} flex="1">
          <Box paddingTop={5} marginLeft={-1}>
            <Box as="a" href="/">
              <Logo width="152px" />
            </Box>
          </Box>
          <Center
            flex="1"
            maxWidth="md"
            paddingY={10}
            marginX="auto"
            sx={{
              "@media only screen and (min-width: 62em)": {
                marginX: 0,
              },
              "@media only screen and (min-width: 96em)": {
                margin: "auto",
              },
            }}
          >
            <Steps currentStep={currentStep}>
              <PublicSignupForm onNext={handleNextPage} email={activationEmail} source={source} />
              <PublicSignupFormName onNext={handleNextPage} />
              <PublicSignupFormOrganization onBack={prevStep} onNext={handleNextPage} />
              <PublicSignupFormExperience
                onBack={prevStep}
                onFinish={handleNextPage}
                isLoading={loading}
              />
              <PublicSignupFormInbox email={formData.current.email ?? ""} />
            </Steps>
          </Center>
        </Flex>
        <Box
          display={{ base: "none", lg: "block" }}
          paddingLeft={8}
          maxWidth="container.md"
          flex="1"
        >
          <Flex
            direction="column"
            backgroundImage={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/signup-bg.svg`}
            backgroundPosition="center"
            backgroundRepeat="no-repeat"
            backgroundSize="cover"
            height="100%"
            padding={16}
          >
            <PublicSignupRightHeading display={currentStep === 4 ? "none" : "block"} />
            <Center height="100%">
              <Flex width="100%">
                <Steps currentStep={currentStep} width="100%">
                  {[0, 1, 2, 3].map((step) => (
                    <Stack key={step} spacing={10}>
                      {[0, 1, 2].map((i) => {
                        const imageName = `${step > i ? "checked" : "unchecked"}-field-${
                          i + 1
                        }.svg`;
                        const animation =
                          currentStep === 0
                            ? `${imageKeyFrames} ${1.2 + 0.2 * i}s ease ${0.2 + 0.2 * i}s forwards`
                            : undefined;
                        return (
                          <Box key={i}>
                            <Image
                              width="460"
                              height="100"
                              role="presentation"
                              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/${imageName}`}
                              opacity={step === 0 ? 0 : 1}
                              marginLeft={i === 1 ? "-96px" : 0}
                              animation={animation}
                            />
                          </Box>
                        );
                      })}
                    </Stack>
                  ))}
                  <Center paddingX={6}>
                    <Image
                      opacity="0"
                      animation={`${keyframes`
                        from {
                          opacity: 0;
                          transform: translateY(32px);
                        }
                        to {
                          transform: translateX(0px);
                          opacity: 1;
                        }
                      `} 1.2s ease 0.12s forwards`}
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/check-inbox.svg`}
                    />
                  </Center>
                </Steps>
              </Flex>
            </Center>
          </Flex>
        </Box>
      </Flex>
    </PublicLayout>
  );
}

Signup.mutations = [
  gql`
    mutation Signup_userSignUp(
      $email: String!
      $password: String!
      $firstName: String!
      $lastName: String!
      $organizationName: String!
      $locale: String
      $organizationLogo: Upload
      $industry: String
      $role: String
      $position: String
      $captcha: String!
      $licenseCode: String
    ) {
      userSignUp(
        email: $email
        password: $password
        firstName: $firstName
        lastName: $lastName
        organizationName: $organizationName
        locale: $locale
        organizationLogo: $organizationLogo
        industry: $industry
        role: $role
        position: $position
        captcha: $captcha
        licenseCode: $licenseCode
      ) {
        id
        email
        firstName
        lastName
      }
    }
  `,
];

Signup.queries = [
  gql`
    query Signup_publicLicenseCode($code: String!, $token: ID!) {
      publicLicenseCode(code: $code, token: $token) {
        code
        source
        details
      }
    }
  `,
];

export async function getServerSideProps({
  query: { code },
  req,
}: GetServerSidePropsContext): Promise<GetServerSidePropsResult<SignupProps>> {
  const client = createApolloClient({}, { req });
  if (isDefined(code) && typeof code === "string") {
    try {
      const { data } = await client.query({
        query: Signup_publicLicenseCodeDocument,
        variables: { code, token: process.env.CLIENT_SERVER_TOKEN },
      });
      if (!data.publicLicenseCode) {
        return { props: {} };
      } else {
        return {
          props: {
            code: data.publicLicenseCode.code,
            source: data.publicLicenseCode.source,
            activationEmail: data.publicLicenseCode.details.activation_email as string,
          },
        };
      }
    } catch {}
  }
  return { props: {} };
}

export default withApolloData(Signup);

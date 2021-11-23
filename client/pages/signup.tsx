import { gql, useMutation } from "@apollo/client";
import { Box, Center, Flex, Image, keyframes, Stack, useCounter } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { SimpleWizard } from "@parallel/components/common/SimpleWizard";
import { withApolloData } from "@parallel/components/common/withApolloData";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicSignupForm } from "@parallel/components/public/signup/PublicSignupForm";
import { PublicSignupFormExperience } from "@parallel/components/public/signup/PublicSignupFormExperience";
import { PublicSignupFormInbox } from "@parallel/components/public/signup/PublicSignupFormInbox";
import { PublicSignupFormName } from "@parallel/components/public/signup/PublicSignupFormName";
import { PublicSignupFormOrganization } from "@parallel/components/public/signup/PublicSignupFormOrganization";
import { PublicSignupRightHeading } from "@parallel/components/public/signup/PublicSignupRightHeading";
import { Signup_userSignUpDocument } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useEffect, useRef } from "react";
import { useIntl } from "react-intl";

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
};

function Signup() {
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
            <NakedLink href="/">
              <Box as="a">
                <Logo width="152px" />
              </Box>
            </NakedLink>
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
            <SimpleWizard index={currentStep as number} direction="column">
              <PublicSignupForm onNext={handleNextPage} />
              <PublicSignupFormName onNext={handleNextPage} />
              <PublicSignupFormOrganization onBack={prevStep} onNext={handleNextPage} />
              <PublicSignupFormExperience
                onBack={prevStep}
                onFinish={handleNextPage}
                isLoading={loading}
              />
              <PublicSignupFormInbox email={formData.current.email ?? ""} />
            </SimpleWizard>
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
                <SimpleWizard index={currentStep as number} width="100%">
                  {[0, 1, 2, 3].map((step) => (
                    <Stack key={step} spacing={10}>
                      {[0, 1, 2].map((i) => {
                        const imageName = `${step > i ? "checked" : "unchecked"}-field-${
                          i + 1
                        }.svg`;
                        const animation =
                          currentStep === 0
                            ? `${keyframes`
                            from {
                              opacity: 0;
                              transform: translateX(60px);
                            }
                            to {
                              transform: translateX(0px);
                              opacity: 1;
                            }
                          `} ${1.2 + 0.2 * i}s ease ${0.2 + 0.2 * i}s forwards`
                            : undefined;
                        return (
                          <Box key={i}>
                            <Image
                              width="460"
                              heigth="100"
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
                  <Box paddingX={6} margin="0 auto">
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
                  </Box>
                </SimpleWizard>
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
      ) {
        id
        email
        firstName
        lastName
      }
    }
  `,
];

/* 
  not including this empty function will trigger two Router.routeChangeComplete events,
  causing analytics to track the pageview twice
 */
Signup.getInitialProps = () => ({});

export default withApolloData(Signup);

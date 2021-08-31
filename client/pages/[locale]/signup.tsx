import { gql } from "@apollo/client";
import { Box, Center, Flex, Image, Stack } from "@chakra-ui/react";
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
import { useSignup_userSignUpMutation } from "@parallel/graphql/__types";
import styles from "@parallel/styles/Signup.module.css";
import { Maybe } from "@parallel/utils/types";
import { useRef, useState } from "react";
import { useIntl } from "react-intl";

type FormDataType = {
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

  const finishStep = 3;
  const [index, setIndex] = useState(0);

  const formData = useRef<FormDataType>();

  const nextPage = () => {
    setIndex((i) => i + 1);
  };

  const handlePreviousPage = () => {
    setIndex((i) => i - 1);
  };

  const [userSignUp, { loading }] = useSignup_userSignUpMutation();

  const handleNextPage = async (data: any) => {
    formData.current = { ...(formData?.current ?? {}), ...data };
    console.log("handleNextPage: ", formData.current);
    if (index === finishStep) {
      const currentData = formData.current;
      if (currentData) {
        try {
          const res = await userSignUp({
            variables: {
              email: currentData.email,
              password: currentData.password,
              firstName: currentData.firstName,
              lastName: currentData.lastName,
              organizationName: currentData.organizationName,
              locale: intl.locale,
              organizationLogo: currentData.organizationLogo,
              industry: currentData.industry,
              role: currentData.role,
              position: currentData.position,
            },
          });

          console.log("userSignUp: ", res);
          nextPage();
        } catch (error) {
          console.log("error: ", error);
          console.log("graphQL error: ", error?.graphQLErrors?.[0]?.extensions.code);
        }
      }
    } else {
      nextPage();
    }
  };

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.login.title",
        defaultMessage: "Login",
      })}
      description={intl.formatMessage({
        id: "public.login.meta-description",
        defaultMessage: "Login to your Parallel account",
      })}
      hideHeader
      hideFooter
    >
      <Flex
        height="100vh"
        sx={{
          "@media only screen and (max-width: 62em)": {
            ".form-container": {
              margin: "auto",
            },
          },
          "@media only screen and (min-width: 96em)": {
            ".form-container": {
              margin: "auto",
            },
          },
        }}
      >
        <Flex direction="column" paddingX={{ base: 6, md: 20 }} flex="1">
          <Box paddingTop={5} marginLeft={-1}>
            <NakedLink href="/">
              <Box
                as="a"
                color="gray.700"
                _hover={{ color: "gray.800" }}
                _focus={{ color: "gray.800" }}
                _active={{ color: "gray.900" }}
              >
                <Logo width="152px" />
              </Box>
            </NakedLink>
          </Box>
          <Center className="form-container" flex="1" maxWidth="md" paddingY={10}>
            <SimpleWizard index={index} direction="column">
              <PublicSignupForm onNext={handleNextPage} />
              <PublicSignupFormName onNext={handleNextPage} />
              <PublicSignupFormOrganization onBack={handlePreviousPage} onNext={handleNextPage} />
              <PublicSignupFormExperience
                onBack={handlePreviousPage}
                onFinish={handleNextPage}
                loading={loading}
              />
              <PublicSignupFormInbox email={formData?.current?.email ?? ""} />
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
            <PublicSignupRightHeading display={index === 4 ? "none" : "block"} />
            <Center height="100%">
              <Flex width="100%">
                <SimpleWizard index={index} width="100%">
                  <Stack spacing={10}>
                    <Image
                      opacity="0"
                      animation={`${styles.fadeInLeft} 1.2s ease 0.2s forwards`}
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/unchecked-field-1.svg`}
                    />
                    <Image
                      opacity="0"
                      animation={`${styles.fadeInLeftOffset96} 1.4s ease 0.36s forwards `}
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/unchecked-field-2.svg`}
                    />
                    <Image
                      opacity="0"
                      animation={`${styles.fadeInLeft} 1.6s ease 0.68s forwards `}
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/unchecked-field-3.svg`}
                    />
                  </Stack>

                  <Stack spacing={10}>
                    <Image
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/checked-field-1.svg`}
                    />
                    <Image
                      transform={"translateX(-96px)"}
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/unchecked-field-2.svg`}
                    />
                    <Image
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/unchecked-field-3.svg`}
                    />
                  </Stack>

                  <Stack spacing={10}>
                    <Image
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/checked-field-1.svg`}
                    />
                    <Image
                      transform={"translateX(-96px)"}
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/checked-field-2.svg`}
                    />
                    <Image
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/unchecked-field-3.svg`}
                    />
                  </Stack>

                  <Stack spacing={10}>
                    <Image
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/checked-field-1.svg`}
                    />
                    <Image
                      transform={"translateX(-96px)"}
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/checked-field-2.svg`}
                    />
                    <Image
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/checked-field-3.svg`}
                    />
                  </Stack>

                  <Box paddingX={6} margin="0 auto">
                    <Image
                      opacity="0"
                      animation={`${styles.fadeInUp} 1.2s ease 0.12s forwards`}
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

export default withApolloData(Signup);

import { Box, Center, Flex, Grid, Image, Stack } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { SimpleWizard } from "@parallel/components/common/SimpleWizard";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicSignupForm } from "@parallel/components/public/signup/PublicSignupForm";
import { PublicSignupFormExperience } from "@parallel/components/public/signup/PublicSignupFormExperience";
import { PublicSignupFormInbox } from "@parallel/components/public/signup/PublicSignupFormInbox";
import { PublicSignupFormName } from "@parallel/components/public/signup/PublicSignupFormName";
import { PublicSignupFormOrganization } from "@parallel/components/public/signup/PublicSignupFormOrganization";
import { PublicSignupRightHeading } from "@parallel/components/public/signup/PublicSignupRightHeading";
import { useRef, useState } from "react";
import { useIntl } from "react-intl";

type FormDataType = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  logo?: File;
  industry?: string;
  role?: string;
  position?: string;
};

function Signup() {
  const intl = useIntl();
  const [index, setIndex] = useState(0);

  const formData = useRef<FormDataType>();

  const nextPage = () => {
    setIndex((i) => i + 1);
  };

  const handlePreviousPage = () => {
    setIndex((i) => i - 1);
  };

  const handleNextPage = (data: any) => {
    formData.current = { ...(formData?.current ?? {}), ...data };
    nextPage();
  };

  const handleFinish = (data: any) => {
    formData.current = { ...(formData?.current ?? {}), ...data };
    nextPage();
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
      <Grid
        gridTemplateColumns={{
          base: "1fr",
          lg: "1fr auto",
        }}
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
        <Flex direction="column" paddingX={{ base: 6, md: 20 }} minWidth="50vw">
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
            <form>
              <SimpleWizard index={index}>
                <PublicSignupForm onNext={handleNextPage} />
                <PublicSignupFormName onNext={handleNextPage} />
                <PublicSignupFormOrganization onBack={handlePreviousPage} onNext={handleNextPage} />
                <PublicSignupFormExperience onBack={handlePreviousPage} onFinish={handleFinish} />
                <PublicSignupFormInbox email={formData?.current?.email ?? ""} />
              </SimpleWizard>
            </form>
          </Center>
        </Flex>
        <Box display={{ base: "none", lg: "block" }} paddingLeft={8} width="100%">
          <Flex
            direction="column"
            backgroundImage={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/signup-bg.svg`}
            backgroundPosition="center"
            backgroundRepeat="no-repeat"
            backgroundSize="cover"
            width="100%"
            height="100%"
            padding={16}
            maxWidth="container.lg"
          >
            <PublicSignupRightHeading display={index === 4 ? "none" : "block"} />
            <Center height="100%">
              <Flex width="100%">
                <SimpleWizard index={index}>
                  <Stack spacing={10}>
                    <Image
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/unchecked-field-1.svg`}
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

                  <Stack spacing={10} paddingX={10}>
                    <Image
                      w="501px"
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/signup/check-inbox.svg`}
                    />
                  </Stack>
                </SimpleWizard>
              </Flex>
            </Center>
          </Flex>
        </Box>
      </Grid>
    </PublicLayout>
  );
}

export default Signup;

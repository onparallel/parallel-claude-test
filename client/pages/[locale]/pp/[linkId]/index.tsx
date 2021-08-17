import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  IconButton,
  Img,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { QuestionOutlineIcon } from "@parallel/chakra/icons";
import { NakedLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { withApolloData } from "@parallel/components/common/withApolloData";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { isInsecureBrowser } from "@parallel/utils/isInsecureBrowser";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

function PublicPetitionLink() {
  const intl = useIntl();

  const [isDialogOpen, setDialogIsOpen] = useState(false);
  const onCloseDialog = () => setDialogIsOpen(false);
  const closeDialogRef = useRef<HTMLButtonElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const onSubmit = (data: any) => console.log(data);

  const granter = {
    organization: {
      logoUrl: undefined,
      name: "My Org",
    },
  };

  const description = "Some shit with html";

  const subtitle = "Colectiu Ronda";
  const title = "Despido Colectivo";

  return (
    <>
      <Head>
        <title>
          {"Parallel | "}
          {intl.formatMessage({
            id: "public.public-petition.title",
            defaultMessage: "Some title for the petition",
          })}
        </title>
      </Head>

      <AlertDialog
        motionPreset="slideInBottom"
        leastDestructiveRef={closeDialogRef}
        onClose={onCloseDialog}
        isOpen={isDialogOpen}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent margin={2}>
          <AlertDialogHeader>
            <HStack fontSize="xl" marginRight={4}>
              <QuestionOutlineIcon />
              <Text>¿Por qué pedimos estos datos?</Text>
            </HStack>
          </AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>
            <Stack spacing={4}>
              <Text>
                <FormattedMessage
                  id="public-petition.help.parraf-1"
                  defaultMessage="Si has encontrado este enlace o alguien te lo ha mandado, significa que van solicitarte información. Por seguridad, necesitamos identificarte para asociar tu correo a un portal seguro donde podrás completarla."
                />
              </Text>
              <Text>
                <FormattedMessage
                  id="public-petition.help.parraf-2"
                  defaultMessage="Además, te enviaremos un correo con el enlace para que puedas volver y terminar de completarlo cuando quieras."
                />
              </Text>
            </Stack>
          </AlertDialogBody>
          <AlertDialogFooter justifyContent="space-between">
            <Text>Ver más preguntas frecuentes</Text>
            <Button
              marginLeft={4}
              ref={closeDialogRef}
              colorScheme="purple"
              onClick={onCloseDialog}
            >
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Center padding={{ base: 0, md: 6 }} height="100vh" width="100%">
        <Box
          position="relative"
          width={{ base: "100%", md: "auto" }}
          height={{ base: "100%", md: "auto" }}
          paddingX={{ base: 6, md: 8 }}
          paddingY={{ base: 6, md: 10 }}
          rounded={{ base: undefined, md: "xl" }}
          shadow={{ base: undefined, md: "lg" }}
          border={{ base: undefined, md: "1px solid" }}
          borderColor={{ base: undefined, md: "gray.200" }}
          overflow="hidden"
        >
          <SimpleGrid gap={8} columns={{ base: 1, md: 2 }}>
            <Stack spacing={4} maxWidth="container.sm" width="100%" margin="0 auto">
              {granter.organization.logoUrl ? (
                <Img
                  src={granter.organization.logoUrl}
                  aria-label={granter.organization.name}
                  width="auto"
                  height="40px"
                />
              ) : (
                <Logo width="152px" height="40px" />
              )}
              <Stack spacing={0}>
                <Text fontSize="sm" color="gray.500">
                  Colectiu Ronda
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  Despido Colectivo
                </Text>
              </Stack>
              <Box width="100%" maxWidth="420px">
                <Box dangerouslySetInnerHTML={{ __html: description }}></Box>
              </Box>
            </Stack>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack
                spacing={6}
                paddingBottom={8}
                width="100%"
                margin="0 auto"
                maxWidth="container.sm"
              >
                <Text fontWeight="bold" fontSize="xl">
                  Introduce tus datos para comenzar
                  <IconButton
                    marginLeft={2}
                    rounded="full"
                    size="xs"
                    variant="ghost"
                    aria-label="help"
                    fontSize="md"
                    color="gray.400"
                    _hover={{ color: "gray.600" }}
                    _focus={{ color: "gray.600", outline: "none" }}
                    _focusVisible={{
                      color: "gray.600",
                      boxShadow: "var(--chakra-shadows-outline)",
                    }}
                    icon={<QuestionOutlineIcon />}
                    onClick={() => setDialogIsOpen(true)}
                  />
                </Text>

                <FormControl id="first-name" isInvalid={errors.firstName}>
                  <FormLabel>First name</FormLabel>
                  <Input
                    type="text"
                    placeholder="First name"
                    {...register("firstName", { required: true })}
                  />
                  <FormErrorMessage>
                    <FormattedMessage
                      id="generic.forms.invalid-email-error"
                      defaultMessage="Please, enter a valid email"
                    />
                  </FormErrorMessage>
                </FormControl>
                <FormControl id="last-name" isInvalid={errors.lastName}>
                  <FormLabel>Last name</FormLabel>
                  <Input
                    type="text"
                    placeholder="Last name"
                    {...register("lastName", { required: true })}
                  />
                  <FormErrorMessage>
                    <FormattedMessage
                      id="generic.forms.invalid-email-error"
                      defaultMessage="Please, enter a valid email"
                    />
                  </FormErrorMessage>
                </FormControl>
                <FormControl id="first-name" isInvalid={errors.email}>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="example@email.com"
                    {...register("email", { required: true, pattern: EMAIL_REGEX })}
                  />
                  <FormErrorMessage>
                    <FormattedMessage
                      id="generic.forms.invalid-email-error"
                      defaultMessage="Please, enter a valid email"
                    />
                  </FormErrorMessage>
                </FormControl>
                <Button type="submit" colorScheme="purple" size="md">
                  Solicitar acceso
                </Button>
              </Stack>
            </form>
          </SimpleGrid>

          <Box
            backgroundColor="gray.200"
            borderTopLeftRadius="xl"
            paddingX={4}
            paddingY={1.5}
            position="absolute"
            bottom="0"
            right="0"
          >
            <Text as="span" fontSize="sm" whiteSpace="nowrap">
              <FormattedMessage
                id="recipient-view.powered-by"
                defaultMessage="Powered by {parallel}"
                values={{
                  parallel: (
                    <NakedLink
                      href="/?utm_source=parallel&utm_medium=recipient_view&utm_campaign=recipients"
                      passHref
                    >
                      <Text as="a" fontWeight="bold" fontFamily="hero">
                        Parallel
                      </Text>
                    </NakedLink>
                  ),
                }}
              />
            </Text>
          </Box>
        </Box>
      </Center>
    </>
  );
}

export async function getServerSideProps({
  query: { locale, linkId },
  req,
  res,
}: GetServerSidePropsContext) {
  if (isInsecureBrowser(req.headers["user-agent"])) {
    return {
      redirect: {
        destination: `/${locale}/update-browser`,
        permanent: false,
      },
    };
  }

  const client = createApolloClient({}, { req });

  return {
    props: {},
  };
}

export default withApolloData(PublicPetitionLink);

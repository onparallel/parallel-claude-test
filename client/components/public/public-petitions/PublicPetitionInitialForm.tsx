import {
  Box,
  Button,
  Collapse,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  IconButton,
  Img,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import { QuestionOutlineIcon } from "@parallel/chakra/icons";
import { NormalLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import ResizeObserver from "react-resize-observer";

export interface PublicPetitionInitialFormInputs {
  firstName: string;
  lastName: string;
  email: string;
}

interface PublicPetitionInitialFormProps {
  organizationName: string;
  logoUrl?: string | null;
  title: string;
  description: string;
  onSubmit: SubmitHandler<PublicPetitionInitialFormInputs>;
  isLoading: boolean;
  isDisabled: boolean;
}

export function PublicPetitionInitialForm({
  organizationName,
  logoUrl,
  title,
  description,
  onSubmit,
  isLoading,
  isDisabled,
}: PublicPetitionInitialFormProps) {
  const intl = useIntl();

  const [isDialogOpen, setDialogIsOpen] = useState(false);
  const onCloseDialog = () => setDialogIsOpen(false);
  const closeDialogRef = useRef<HTMLButtonElement>(null);

  const [showMore, setShowMore] = useState(false);

  const [canExpand, setCanExpand] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const handleResize = () => {
    if (descriptionRef?.current) {
      setCanExpand(descriptionRef.current!.scrollHeight > 300);
      setShowMore(descriptionRef.current!.scrollHeight < 300);
    }
  };

  useEffect(() => {
    handleResize();
  }, []);

  const handleToggleShowMore = () => setShowMore(!showMore);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PublicPetitionInitialFormInputs>();

  return (
    <>
      <Stack
        spacing={4}
        maxWidth="container.sm"
        width="100%"
        margin="0 auto"
        alignItems="flex-start"
      >
        {logoUrl ? (
          <Img
            src={logoUrl}
            aria-label={organizationName}
            width="auto"
            height="40px"
            objectFit="contain"
          />
        ) : (
          <Logo width="152px" height="40px" />
        )}
        <Stack spacing={0} maxWidth={{ base: "auto", md: "25rem" }}>
          <Text fontSize="sm" color="gray.500" fontWeight="600">
            {organizationName}
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {title}
          </Text>
          <ResizeObserver onResize={handleResize} />
        </Stack>
        <Box maxWidth={{ base: "auto", md: "25rem" }} width="100%" position="relative">
          <Collapse startingHeight={200} in={showMore}>
            <Box
              ref={descriptionRef}
              whiteSpace="pre-wrap"
              overflowWrap="break-word"
              dangerouslySetInnerHTML={{ __html: description }}
            ></Box>
            {canExpand ? (
              <Box
                opacity={!showMore ? "1" : "0"}
                position="absolute"
                bottom="48px"
                width="100%"
                height="50px"
                transition="opacity 0.3s ease"
                background="linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,1) 100%)"
              ></Box>
            ) : null}
          </Collapse>
          {canExpand ? (
            <Button variant="outline" size="sm" onClick={handleToggleShowMore} marginTop={4}>
              <FormattedMessage
                id="generic.show-more-less"
                defaultMessage="Show {more, select, true {more} other {less}}"
                values={{ more: !showMore }}
              />
            </Button>
          ) : null}
        </Box>
      </Stack>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={6} width="100%" margin="0 auto" maxWidth="container.sm">
          <Text fontWeight="bold" fontSize="xl">
            <FormattedMessage
              id="public-petition.help.form-title"
              defaultMessage="Enter your data to access"
            />
            <IconButton
              marginLeft={2}
              rounded="full"
              size="xs"
              variant="ghost"
              aria-label={intl.formatMessage({ id: "generic.help", defaultMessage: "Help" })}
              fontSize="md"
              color="gray.400"
              _hover={{ color: "gray.600" }}
              _focus={{ color: "gray.600", outline: "none" }}
              _focusVisible={{
                color: "gray.600",
                shadow: "outline",
              }}
              icon={<QuestionOutlineIcon />}
              onClick={() => setDialogIsOpen(true)}
            />
          </Text>

          <FormControl id="first-name" isInvalid={!!errors.firstName}>
            <FormLabel>
              <FormattedMessage id="generic.forms.first-name-label" defaultMessage="First name" /> *
            </FormLabel>
            <Input
              isDisabled={isDisabled}
              autoComplete="given-name"
              {...register("firstName", {
                required: true,
                validate: (value) => {
                  return !!value.trim();
                },
              })}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.required-first-name-error"
                defaultMessage="First name is required"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl id="last-name" isInvalid={!!errors.lastName}>
            <FormLabel>
              <FormattedMessage id="generic.forms.last-name-label" defaultMessage="Last name" /> *
            </FormLabel>
            <Input
              isDisabled={isDisabled}
              autoComplete="family-name"
              {...register("lastName", {
                required: true,
                validate: (value) => {
                  return !!value.trim();
                },
              })}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.required-last-name-error"
                defaultMessage="Last name is required"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl id="email" isInvalid={!!errors.email}>
            <FormLabel>
              <FormattedMessage id="generic.forms.email-label" defaultMessage="Email" /> *
            </FormLabel>
            <Input
              isDisabled={isDisabled}
              type="email"
              autoComplete="email"
              {...register("email", { required: true, pattern: EMAIL_REGEX })}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.invalid-email-error"
                defaultMessage="Please, enter a valid email"
              />
            </FormErrorMessage>
          </FormControl>
          <Button
            type="submit"
            colorScheme="purple"
            size="md"
            isLoading={isLoading}
            isDisabled={isDisabled}
          >
            <FormattedMessage
              id="public-petition.help.request-access-button"
              defaultMessage="Request access"
            />
          </Button>
        </Stack>
        <Modal
          motionPreset="slideInBottom"
          initialFocusRef={closeDialogRef}
          onClose={onCloseDialog}
          isOpen={isDialogOpen}
          size="xl"
          isCentered
        >
          <ModalOverlay />
          <ModalContent margin={2}>
            <ModalHeader>
              <HStack fontSize="xl" marginRight={4}>
                <QuestionOutlineIcon fontSize="2xl" />
                <Text>
                  <FormattedMessage
                    id="public-petition.help.title"
                    defaultMessage="Why do we ask for this data?"
                  />
                </Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton
              aria-label={intl.formatMessage({
                id: "generic.close",
                defaultMessage: "Close",
              })}
            />
            <ModalBody>
              <Stack spacing={4}>
                <Text>
                  <FormattedMessage
                    id="public-petition.help.explanation-1"
                    defaultMessage="If you have found this link or someone has sent it to you, it means that they need some information. For security, we need to identify you and so we can <b>associate your email to a secure portal</b> where you can complete it."
                  />
                </Text>
                <Text>
                  <FormattedMessage
                    id="public-petition.help.explanation-2"
                    defaultMessage="In addition, we will send you an <b>email with the link</b> so that you can return and continue at any time."
                  />
                </Text>
              </Stack>
            </ModalBody>
            <ModalFooter justifyContent="space-between">
              <NormalLink href={`https://help.onparallel.com/${intl.locale}/collections/3391072`}>
                <FormattedMessage
                  id="public-petition.help.more-faq"
                  defaultMessage="See more frequently asked questions"
                />
              </NormalLink>
              <Button
                marginLeft={4}
                ref={closeDialogRef}
                colorScheme="purple"
                onClick={onCloseDialog}
              >
                <FormattedMessage id="generic.close" defaultMessage="Close" />
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </form>
    </>
  );
}

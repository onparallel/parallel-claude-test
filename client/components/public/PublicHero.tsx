import {
  Box,
  BoxProps,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  Heading,
  Input,
  Text,
  useToast
} from "@chakra-ui/core";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { PublicContainer } from "./layout/PublicContainer";
import { EMAIL_REGEX } from "@parallel/utils/validation";

export interface RequestInviteForm {
  email: string;
}

export type PublicHeroProps = BoxProps & {
  onRequestInvite: (form: RequestInviteForm) => void;
};

export function PublicHero({ onRequestInvite, ...props }: PublicHeroProps) {
  const intl = useIntl();
  const { handleSubmit, register, errors } = useForm<RequestInviteForm>();
  return (
    <PublicContainer {...props}>
      <Flex>
        <Box flex="3">
          <Heading fontFamily="hero" fontSize="hero" fontWeight="light">
            <FormattedMessage
              id="public.home.hero-title"
              defaultMessage="Parallel is the new black"
            ></FormattedMessage>
          </Heading>
          <Heading fontSize="2xl" fontWeight="light">
            <FormattedMessage
              id="public.home.hero-subtitle"
              defaultMessage="A game changer process for daily document workflows."
            ></FormattedMessage>
          </Heading>
          <Text marginTop={4}>
            <FormattedMessage
              id="public.home.hero-question"
              defaultMessage="Do you want to reduce the time wasted reviewing recurrent emails?"
            ></FormattedMessage>
          </Text>
          <form onSubmit={handleSubmit(onRequestInvite)} noValidate>
            <Flex marginTop={4} flexDirection={{ base: "column", sm: "row" }}>
              <FormControl
                flex="1"
                width={{ base: "100%", sm: "auto" }}
                isInvalid={!!errors.email}
              >
                <Input
                  id="email"
                  name="email"
                  type="email"
                  aria-label={intl.formatMessage({
                    id: "generic.forms.email-label",
                    defaultMessage: "Email"
                  })}
                  placeholder={intl.formatMessage({
                    id: "generic.forms.email-placeholder",
                    defaultMessage: "name@example.com"
                  })}
                  ref={register({
                    required: true,
                    pattern: EMAIL_REGEX
                  })}
                />
                {errors.email && (
                  <FormErrorMessage>
                    <FormattedMessage
                      id="generic.forms.invalid-email-error"
                      defaultMessage="Please, enter a valid email"
                    ></FormattedMessage>
                  </FormErrorMessage>
                )}
              </FormControl>
              <Button
                marginLeft={{ base: 0, sm: 4 }}
                marginTop={{ base: 4, sm: 0 }}
                alignSelf={{ base: "center", sm: "start" }}
                rightIcon={"paper-plane" as any}
                variantColor="purple"
                type="submit"
              >
                <FormattedMessage
                  id="public.home.request-invite-button"
                  defaultMessage="Request an invite"
                ></FormattedMessage>
              </Button>
            </Flex>
          </form>
        </Box>
        <Box
          flex="2"
          display={{ base: "none", md: "block" }}
          backgroundImage="url('/static/images/hero.png')"
          backgroundSize="cover"
          backgroundPosition="bottom left"
          marginLeft={12}
        >
          <Box paddingTop="100%"></Box>
        </Box>
      </Flex>
    </PublicContainer>
  );
}

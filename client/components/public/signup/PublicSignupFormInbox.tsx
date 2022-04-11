import { Stack, Text } from "@chakra-ui/react";
import { SupportLink } from "@parallel/components/common/SupportLink";
import { FormattedMessage, useIntl } from "react-intl";

export function PublicSignupFormInbox({ email }: { email: string }) {
  const intl = useIntl();
  return (
    <Stack spacing={6}>
      <Text as="h1" fontSize="2xl" fontWeight="bold" marginTop={0}>
        <FormattedMessage
          id="component.public-signup-form-inbox.heading"
          defaultMessage="Check your inbox"
        />
      </Text>
      <Text>
        <FormattedMessage
          id="component.public-signup-form-inbox.description-one"
          defaultMessage="We’ve sent a verification email to <b>{email}</b>. This will help to make your account as secure as possible."
          values={{
            email,
            b: (chunks: any[]) => <Text as="b">{chunks}</Text>,
          }}
        />
      </Text>
      <Text>
        <FormattedMessage
          id="component.public-signup-form-inbox.description-two"
          defaultMessage="Didn’t receive our email? Check your spam folder and if you don’t found it contact with our <Link>Support team</Link>."
          values={{
            Link: (chunks: any[]) => (
              <SupportLink
                message={intl.formatMessage({
                  id: "component.public-signup-form-inbox.signup-email-issues-message",
                  defaultMessage: "Hi, I am having issues with the verification email.",
                })}
              >
                {chunks}
              </SupportLink>
            ),
          }}
        />
      </Text>
    </Stack>
  );
}

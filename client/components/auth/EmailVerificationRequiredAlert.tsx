import {
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Flex,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CloseableAlert } from "../common/CloseableAlert";

interface EmailVerificationRequiredAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onResendEmail: () => Promise<boolean>;
}
export function EmailVerificationRequiredAlert({
  isOpen,
  onClose,
  onResendEmail,
}: EmailVerificationRequiredAlertProps) {
  const toast = useToast();
  const intl = useIntl();
  const [isEmailSent, setIsEmailSent] = useState(false);
  const genericErrorToast = useGenericErrorToast();
  const resendSuccessToast = () => {
    toast({
      title: intl.formatMessage({
        id: "public.resend-verification-email.success-title",
        defaultMessage: "Verification link sent",
      }),
      description: intl.formatMessage({
        id: "public.resend-verification-email.success-description",
        defaultMessage: "Please, check your email.",
      }),
      status: "success",
      isClosable: true,
    });
  };

  const handleResendEmail = async () => {
    setIsEmailSent(true);
    const success = await onResendEmail();
    if (success) {
      resendSuccessToast();
    } else {
      setIsEmailSent(false);
      genericErrorToast();
    }
  };
  return (
    <CloseableAlert
      isOpen={isOpen}
      onClose={onClose}
      status="error"
      variant="subtle"
      rounded="md"
      zIndex={2}
      marginBottom={10}
    >
      <Flex
        alignItems="center"
        justifyContent="flex-start"
        marginX="auto"
        width="100%"
        paddingLeft={4}
        paddingRight={12}
      >
        <AlertIcon />
        <Stack spacing={1}>
          <AlertTitle>
            <FormattedMessage
              id="component.email-verification-required-alert.title"
              defaultMessage="Activation pending"
            />
          </AlertTitle>
          <AlertDescription>
            <Text>
              <FormattedMessage
                id="component.email-verification-required-alert.body"
                defaultMessage="Please activate your account through the activation link that was sent to your email and try again."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.email-verification-required-alert.resend"
                defaultMessage="Can't find it? <a>Resend email.</a>"
                values={{
                  a: (chunks: any) => (
                    <Button
                      isDisabled={isEmailSent}
                      variant="link"
                      fontWeight="bold"
                      onClick={() => handleResendEmail()}
                    >
                      {chunks}
                    </Button>
                  ),
                }}
              />
            </Text>
          </AlertDescription>
        </Stack>
      </Flex>
    </CloseableAlert>
  );
}

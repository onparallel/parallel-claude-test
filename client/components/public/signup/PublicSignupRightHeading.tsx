import { Box, BoxProps, Heading, Image } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export function PublicSignupRightHeading(props: BoxProps) {
  return (
    <Box marginBottom={6} {...props}>
      <Heading as="h2" size="xl" color="white" marginBottom={4}>
        <FormattedMessage
          id="component.public-signup-right-heading.heading"
          defaultMessage="Work better with"
        />
      </Heading>
      <Image
        maxWidth="180px"
        src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/parallel-logo-white.svg`}
      />
    </Box>
  );
}

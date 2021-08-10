import { Heading, HeadingProps, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export function PublicSignupRightHeading(props: HeadingProps) {
  return (
    <Heading as="h2" size="xl" color="white" marginBottom={6} {...props}>
      <FormattedMessage
        id="component.public-signup-right-heading.heading"
        defaultMessage="Work better with"
      />
      <br />
      <Text as="span" fontSize="42px">
        parallel
      </Text>
    </Heading>
  );
}

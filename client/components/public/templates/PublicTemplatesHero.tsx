import { Heading, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "../layout/PublicContainer";

export function PublicTemplatesHero() {
  return (
    <PublicContainer
      maxWidth="container.sm"
      wrapper={{
        textAlign: "center",
        paddingY: 16,
        backgroundColor: "gray.50",
      }}
    >
      <Heading mb={6} size="3xl">
        <FormattedMessage
          id="public.templates-hero.template-library"
          defaultMessage="Template library"
        />
      </Heading>
      <Text fontSize="xl">
        <FormattedMessage
          id="public.templates-hero.template-library-desc"
          defaultMessage="Choose one of our public templates to copy it, customize it and start speeding up your processes."
        />
      </Text>
    </PublicContainer>
  );
}

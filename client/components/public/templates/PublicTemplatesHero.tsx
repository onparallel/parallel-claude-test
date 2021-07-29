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
      }}
    >
      <Heading mb={6}>
        <FormattedMessage
          id="public.templates-hero.template-library"
          defaultMessage="Template library"
        />
      </Heading>
      <Text fontSize="xl">
        <FormattedMessage
          id="public.templates-hero.template-library-desc"
          defaultMessage="Discover some of the public templates that we offer on Parallel to improve your experience."
        />
      </Text>
    </PublicContainer>
  );
}

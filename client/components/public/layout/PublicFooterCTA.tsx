import { Button, Heading, Stack } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { FormattedMessage } from "react-intl";

export function PublicFooterCTA() {
  return (
    <PublicContainer
      as={Stack}
      spacing={8}
      paddingY={20}
      maxWidth="container.xl"
      textAlign="center"
      justifyContent="center"
      alignItems="center"
      height="300px"
      width="100%"
      padding={6}
      transform="translateY(68px)"
      borderRadius="lg"
      overflow="hidden"
      backgroundColor="primary.600"
      backgroundImage={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/bg/book-footer-bg.png`}
      backgroundSize="cover"
      backgroundRepeat="no-repeat"
      backgroundPosition="center center"
      wrapper={{
        backgroundColor: "gray.50",
        height: "320px",
      }}
    >
      <Heading as="h2" color="white" size="3xl" fontFamily="hero" fontWeight="600" lineHeight={1.5}>
        <FormattedMessage
          id="public.templates.want-to-use-our-templates"
          defaultMessage="Do you want to use our templates?"
        />
      </Heading>
      <NakedLink href="/signup">
        <Button as="a" size="lg" backgroundColor="white" height="3.5rem" width="auto">
          <FormattedMessage id="public.sign-up-for-free-button" defaultMessage="Sign up for free" />
        </Button>
      </NakedLink>
    </PublicContainer>
  );
}

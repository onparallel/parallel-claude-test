import { BoxProps, Button, Flex, Heading } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "../layout/PublicContainer";

export function SolutionsDemoCta({ children, ...props }: BoxProps) {
  return (
    <PublicContainer
      paddingY={20}
      maxWidth="container.lg"
      textAlign="center"
      wrapper={{
        backgroundImage: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/bg/book-footer-bg.png`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundColor: "#6b66ea",
        ...props,
      }}
    >
      <Heading as="h2" color="white" size="lg" fontFamily="hero" fontWeight="600">
        {children}
      </Heading>
      <Flex marginTop={10} justifyContent="center">
        <NakedLink href="/book-demo">
          <Button as="a" color="gray.800" backgroundColor="white" size="lg">
            <FormattedMessage id="public.book-demo-button" defaultMessage="Book a demo" />
          </Button>
        </NakedLink>
      </Flex>
    </PublicContainer>
  );
}

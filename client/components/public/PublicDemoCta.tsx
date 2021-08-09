import { BoxProps, Button, Flex, Heading } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicDemoCta({ children, ...props }: BoxProps) {
  return (
    <PublicContainer
      paddingY={20}
      maxWidth="container.lg"
      textAlign="center"
      wrapper={{ backgroundColor: "purple.50", ...props }}
    >
      <Heading as="h2" size="lg" fontFamily="hero" fontWeight="600">
        {children}
      </Heading>
      <Flex marginTop={10} justifyContent="center">
        <NakedLink href="/book-demo">
          <Button as="a" colorScheme="purple" size="lg">
            <FormattedMessage id="public.book-demo-button" defaultMessage="Book a demo" />
          </Button>
        </NakedLink>
      </Flex>
    </PublicContainer>
  );
}

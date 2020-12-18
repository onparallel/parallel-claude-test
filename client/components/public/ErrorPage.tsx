import { Box, Flex, Heading, Image } from "@chakra-ui/react";
import { Logo } from "@parallel/components/common/Logo";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import NextLink from "next/link";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { Spacer } from "../common/Spacer";

export function ErrorPage({
  header,
  imageUrl,
  children,
}: {
  header: ReactNode;
  imageUrl: string;
  children: ReactNode;
}) {
  return (
    <Flex minHeight="100vh" flexDirection="column">
      <PublicContainer minHeight={20} display="flex" alignItems="center">
        <NextLink href="/" passHref>
          <Box
            as="a"
            color="gray.700"
            _hover={{ color: "gray.800" }}
            _focus={{ color: "gray.800" }}
            _active={{ color: "gray.900" }}
          >
            <Logo width="152px" />
          </Box>
        </NextLink>
      </PublicContainer>
      <PublicContainer display="flex" wrapper={{ flex: 1 }}>
        <Flex flex="1" justifyContent="center" flexDirection="column">
          <Spacer flex="1" />
          <Heading as="h1" fontSize="6xl">
            <FormattedMessage id="error.main-header" defaultMessage="Oops!" />
          </Heading>
          <Heading
            as="h2"
            fontSize="4xl"
            fontWeight="normal"
            marginTop={4}
            marginBottom={8}
          >
            {header}
          </Heading>
          {children}
          <Spacer flex="2" />
        </Flex>
        <Flex
          flex="1"
          alignItems="center"
          justifyContent="center"
          display={{ base: "none", md: "flex" }}
        >
          <Image role="presentation" src={imageUrl} maxWidth="400px" />
        </Flex>
      </PublicContainer>
    </Flex>
  );
}

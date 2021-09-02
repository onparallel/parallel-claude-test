import {
  AspectRatio,
  Box,
  BoxProps,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Stack,
} from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { FormattedMessage } from "react-intl";

export interface PublicHeroProps extends BoxProps {
  image: string;
  alt: string;
  ratio: number;
  title: string;
  subtitle: string;
  buttonText: string;
  url: string;
  sectionTitle?: string;
}

export function PublicHero({
  image,
  alt,
  ratio,
  title,
  subtitle,
  buttonText,
  url,
  sectionTitle,
  ...props
}: PublicHeroProps) {
  const breakpoint = "lg";
  return (
    <Stack spacing={12} direction={{ base: "column-reverse", [breakpoint]: "row" }} {...props}>
      <Center
        flex="1"
        marginLeft={{ base: 8, [breakpoint]: 20 }}
        marginRight={{ base: 8, [breakpoint]: 0 }}
      >
        <Flex flexDirection="column">
          {sectionTitle ? (
            <Heading
              as="h4"
              size="xs"
              lineHeight="24px"
              color="gray.600"
              textTransform="uppercase"
              marginTop={4}
            >
              {sectionTitle}
            </Heading>
          ) : null}
          <Heading
            as="h1"
            fontFamily="hero"
            fontWeight="600"
            size={sectionTitle ? "2xl" : "3xl"}
            lineHeight="1.2"
          >
            {title}
          </Heading>
          <Heading as="h2" size="md" fontWeight="light" paddingTop={8} lineHeight="150%">
            {subtitle}
          </Heading>
          <HStack
            paddingTop={8}
            marginBottom={{ base: 2, [breakpoint]: 0 }}
            marginRight={{ base: 0, [breakpoint]: 2 }}
            spacing={4}
          >
            <NakedLink href={url}>
              <Button as="a" size="lg" variant="outline" borderColor="gray.500">
                {buttonText}
              </Button>
            </NakedLink>
            <NakedLink href="/signup">
              <Button as="a" colorScheme="purple" size="lg">
                <FormattedMessage id="public.try-for-free-button" defaultMessage="Try for free" />
              </Button>
            </NakedLink>
          </HStack>
        </Flex>
      </Center>
      <AspectRatio
        ratio={ratio}
        flex="1"
        width={{ base: "80vw", [breakpoint]: "auto" }}
        alignSelf={{ base: "flex-end", [breakpoint]: "flex-start" }}
      >
        <Box as="picture" margin="auto">
          <source srcSet={`${image}.webp?v=${process.env.BUILD_ID}`} type="image/webp" />
          <img alt={alt} src={`${image}.png?v=${process.env.BUILD_ID}`} />
        </Box>
      </AspectRatio>
    </Stack>
  );
}

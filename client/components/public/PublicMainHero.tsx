import {
  Box,
  BoxProps,
  Button,
  Center,
  Flex,
  Heading,
  Stack,
} from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

export type PublicHeroProps = BoxProps;

export function PublicMainHero({ ...props }: PublicHeroProps) {
  const intl = useIntl();
  const { query } = useRouter();
  const imageName = `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/showcase_hero_${query.locale}`;
  const breakpoint = "lg";
  return (
    <Stack
      spacing={12}
      direction={{ base: "column-reverse", [breakpoint]: "row" }}
    >
      <Center
        flex="1"
        marginLeft={{ base: 8, [breakpoint]: 20 }}
        marginRight={{ base: 8, [breakpoint]: 0 }}
      >
        <Stack spacing={8}>
          <Heading
            as="h1"
            fontFamily="hero"
            fontWeight="600"
            size="3xl"
            lineHeight="1.2"
          >
            <FormattedMessage
              id="public.home.hero-title"
              defaultMessage="Accelerate your team's work"
            />
          </Heading>
          <Heading as="h2" size="md" fontWeight="light">
            <FormattedMessage
              id="public.home.hero-subtitle"
              defaultMessage="With Parallel you can easily automate forms with documents and make it an agile and safe process."
            />
          </Heading>
          <Box>
            <NakedLink href="/book-demo">
              <Button
                as="a"
                size="lg"
                colorScheme="purple"
                marginBottom={{ base: 2, [breakpoint]: 0 }}
                marginRight={{ base: 0, [breakpoint]: 2 }}
              >
                <FormattedMessage
                  id="public.book-demo-button"
                  defaultMessage="Book a demo"
                />
              </Button>
            </NakedLink>
          </Box>
        </Stack>
      </Center>
      <Flex
        flex="1"
        justifyContent="center"
        width={{ base: "80vw", [breakpoint]: "auto" }}
        alignSelf={{ base: "flex-end", [breakpoint]: "auto" }}
      >
        <Box as="picture" margin="auto">
          <source
            srcSet={`${imageName}.webp?v=${process.env.BUILD_ID}`}
            type="image/webp"
          />
          <img
            alt={intl.formatMessage({
              id: "public.showcase-hero-alt",
              defaultMessage:
                "A screenshot of the app showcasing the information received using Parallel",
            })}
            src={`${imageName}.png?v=${process.env.BUILD_ID}`}
          />
        </Box>
      </Flex>
    </Stack>
  );
}

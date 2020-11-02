import { Box, BoxProps, Button, Flex, Heading, Stack } from "@chakra-ui/core";
import { NakedLink } from "@parallel/components/common/Link";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import { PublicContainer } from "./layout/PublicContainer";

export type PublicHeroProps = BoxProps;

export function PublicMainHero({ ...props }: PublicHeroProps) {
  const intl = useIntl();
  const { query } = useRouter();
  const imageName = `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/showcase_hero_${query.locale}`;
  const breakpoint = "lg";
  return (
    <PublicContainer
      {...props}
      wrapper={{
        marginY: { base: 8, md: 12, lg: 20 },
        minHeight: { [breakpoint]: "400px" },
      }}
    >
      <Stack spacing={12} direction={{ base: "column", [breakpoint]: "row" }}>
        <Box flex="1">
          <Heading
            as="h1"
            fontFamily="hero"
            size="3xl"
            fontWeight="light"
            aria-live="polite"
            aria-atomic="true"
          >
            <FormattedMessage
              id="public.home.hero-title"
              defaultMessage="Say goodbye to long email threads to obtain information"
            />
          </Heading>
          <Heading as="h2" size="md" fontWeight="light" marginTop={8}>
            <FormattedMessage
              id="public.home.hero-subtitle"
              defaultMessage="Parallel collects and organizes the information you need on time so that you can keep focus and stay productive."
            />
          </Heading>
          <Flex
            marginTop={8}
            flexDirection={{ base: "column", [breakpoint]: "row" }}
          >
            <NakedLink href="/invite">
              <Button
                as="a"
                colorScheme="purple"
                marginBottom={{ base: 2, [breakpoint]: 0 }}
                marginRight={{ base: 0, [breakpoint]: 2 }}
              >
                <FormattedMessage
                  id="public.invite-button"
                  defaultMessage="Request an invite"
                />
              </Button>
            </NakedLink>
            <NakedLink href="/book-demo">
              <Button as="a" variant="outline">
                <FormattedMessage
                  id="public.book-demo-button"
                  defaultMessage="Book a demo"
                />
              </Button>
            </NakedLink>
          </Flex>
        </Box>
        <Flex flex="1" justifyContent="center">
          <Box as="picture" margin="auto">
            <source srcSet={`${imageName}.webp`} type="image/webp" />
            <img
              alt={intl.formatMessage({
                id: "public.showcase-hero-alt",
                defaultMessage:
                  'A professional asking her client for some necessary information she needs for a case. Her client is responding "Here you go!".',
              })}
              src={`${imageName}.png`}
            />
          </Box>
        </Flex>
      </Stack>
    </PublicContainer>
  );
}

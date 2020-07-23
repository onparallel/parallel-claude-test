import {
  Box,
  BoxProps,
  Button,
  Flex,
  Heading,
  Image,
  Text,
} from "@chakra-ui/core";
import { NakedLink } from "@parallel/components/common/Link";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import { PublicContainer } from "./layout/PublicContainer";

export type PublicHeroProps = BoxProps;

export function PublicMainHero({ ...props }: PublicHeroProps) {
  const intl = useIntl();
  const router = useRouter();
  const imageName = `/static/images/showcase_hero_${router.query.locale}`;
  const breakpoint = "md";
  return (
    <PublicContainer
      {...props}
      wrapper={{
        marginY: { base: 8, md: 12, lg: 20 },
        minHeight: { [breakpoint]: "400px" },
      }}
    >
      <Flex flexDirection={{ base: "column", [breakpoint]: "row" }}>
        <Box flex="1">
          <Heading as="h1" fontFamily="hero" fontSize="5xl" fontWeight="light">
            <FormattedMessage
              id="public.home.hero-collect"
              defaultMessage="Automate emails and collect documents efficiently"
            />
          </Heading>
          <Text marginTop={8}>
            <FormattedMessage
              id="public.home.hero-platform"
              defaultMessage="Parallel is a platform for busy professionals. We collect all the documentation from your client for you safely and quickly."
            />
          </Text>
          <Text marginTop={4}>
            <FormattedMessage
              id="public.home.hero-digital-transformation"
              defaultMessage="Begin your digital transformation!"
            />
          </Text>
          <Flex
            marginTop={8}
            flexDirection={{ base: "column", [breakpoint]: "row" }}
          >
            <NakedLink href="/invite">
              <Button
                as="a"
                variantColor="purple"
                marginBottom={{ base: 2, [breakpoint]: 0 }}
                marginRight={{ base: 0, [breakpoint]: 2 }}
              >
                <FormattedMessage
                  id="public.invite-button"
                  defaultMessage="Try Parallel free"
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
          <Text marginTop={8}>
            <FormattedMessage
              id="public.home.hero-try-now"
              defaultMessage="Try it now and let Parallel work for you"
            />
          </Text>
        </Box>
        <Box
          flex="1"
          marginX="auto"
          marginLeft={{ base: "none", [breakpoint]: 12 }}
          marginTop={{ base: 16, [breakpoint]: "auto" }}
          marginBottom={{ base: 0, [breakpoint]: "auto" }}
          display="flex"
        >
          <Image
            alt={intl.formatMessage({
              id: "public.showcase-hero-alt",
              defaultMessage:
                'A professional asking her client for some necessary information she needs for a case. Her client is responding "Here you go!".',
            })}
            margin="auto"
            src={`${imageName}.png`}
            {...{ srcSet: `${imageName}@2x.png 2x` }}
          />
        </Box>
      </Flex>
    </PublicContainer>
  );
}

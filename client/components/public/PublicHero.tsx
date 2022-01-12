import {
  AspectRatio,
  Box,
  BoxProps,
  Button,
  Center,
  Flex,
  Heading,
  Stack,
  Image,
} from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { FormattedMessage } from "react-intl";

export interface PublicHeroProps extends BoxProps {
  image: string;
  alt: string;
  ratio: number;
  title: string;
  subtitle: string;
  subtitle2: string;
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
  subtitle2,
  buttonText,
  url,
  sectionTitle,
  ...props
}: PublicHeroProps) {
  const breakpoint = "lg";

  function trackCTAClick() {
    window.analytics?.track("Register CTA Clicked", { from: "public-hero" });
  }

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
          <Heading as="h2" size="md" fontWeight="light" paddingTop={8} lineHeight="160%">
            {subtitle}
            <br />
            {subtitle2}
          </Heading>
          <Stack
            direction={{ base: "column-reverse", sm: "row" }}
            spacing={3}
            paddingTop={8}
            marginBottom={{ base: 2, [breakpoint]: 0 }}
            marginRight={{ base: 0, [breakpoint]: 2 }}
          >
            <NakedLink href={url}>
              <Button as="a" size="lg" variant="outline">
                {buttonText}
              </Button>
            </NakedLink>
            <NakedLink href="/signup">
              <Button as="a" colorScheme="purple" size="lg" onClick={trackCTAClick}>
                <FormattedMessage id="public.try-for-free-button" defaultMessage="Try for free" />
              </Button>
            </NakedLink>
          </Stack>
          <Stack spacing={3} paddingTop={{ base: 8, [breakpoint]: 16 }} marginRight="auto">
            <NakedLink href="https://www.capterra.com/reviews/236724/Parallel?utm_source=vendor&utm_medium=badge&utm_campaign=capterra_reviews_badge">
              <Box as="a">
                <Image
                  htmlWidth={150}
                  src="https://assets.capterra.com/badge/5b8a84543b954403684b7b8ba854282d.svg?v=2198650&p=236724"
                />
              </Box>
            </NakedLink>
          </Stack>
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

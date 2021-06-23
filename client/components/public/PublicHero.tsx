import {
  Box,
  BoxProps,
  Button,
  Center,
  AspectRatio,
  Heading,
  Stack,
} from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { useIntl } from "react-intl";

export interface PublicHeroProps extends BoxProps {
  image: string;
  ratio: number;
  title: string;
  subtitle: string;
  buttonText: string;
  url: string;
  sectionTitle?: string;
}

export function PublicHero({
  image,
  ratio,
  title,
  subtitle,
  buttonText,
  url,
  sectionTitle,
  ...props
}: PublicHeroProps) {
  const intl = useIntl();

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
            size={sectionTitle ? "3xl" : "2xl"}
            lineHeight="1.2"
          >
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
            {title}
          </Heading>
          <Heading as="h2" size="md" fontWeight="light">
            {subtitle}
          </Heading>
          <Box>
            <NakedLink href={url}>
              <Button
                as="a"
                size="lg"
                colorScheme="purple"
                marginBottom={{ base: 2, [breakpoint]: 0 }}
                marginRight={{ base: 0, [breakpoint]: 2 }}
              >
                {buttonText}
              </Button>
            </NakedLink>
          </Box>
        </Stack>
      </Center>
      <AspectRatio
        ratio={ratio}
        flex="1"
        width={{ base: "80vw", [breakpoint]: "auto" }}
        alignSelf={{ base: "flex-end", [breakpoint]: "flex-start" }}
      >
        <Box as="picture" margin="auto">
          <source
            srcSet={`${image}.webp?v=${process.env.BUILD_ID}`}
            type="image/webp"
          />
          <img
            alt={intl.formatMessage({
              id: "public.showcase-hero-alt",
              defaultMessage:
                "A screenshot of the app showcasing the information received using Parallel",
            })}
            src={`${image}.png?v=${process.env.BUILD_ID}`}
          />
        </Box>
      </AspectRatio>
    </Stack>
  );
}

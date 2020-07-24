/** @jsx jsx */
import {
  Box,
  BoxProps,
  Button,
  Flex,
  Heading,
  Image,
  Text,
} from "@chakra-ui/core";
import { css, jsx } from "@emotion/core";
import { NakedLink } from "@parallel/components/common/Link";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import { Typical } from "../common/Typical";
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
          <Heading
            as="h1"
            fontFamily="hero"
            fontSize="5xl"
            fontWeight="light"
            aria-live="polite"
            aria-atomic="true"
          >
            <FormattedMessage
              id="public.home.hero-title"
              defaultMessage="Better <a><b>communication</b><b>collaboration</b><b>follow-ups</b></a> with your clients"
              values={{
                a: (chunks: string[]) => (
                  <>
                    <Typical
                      as="span"
                      fontFamily="hero"
                      args={chunks.flatMap((chunk) => [chunk, 3000])}
                      css={css`
                        &::after {
                          content: "|";
                          animation: blink 1s infinite step-start;
                        }

                        @keyframes blink {
                          50% {
                            opacity: 0;
                          }
                        }
                      `}
                    />
                    <br />
                  </>
                ),
                b: (chunks: any) => [chunks],
              }}
            />
          </Heading>
          <Text marginTop={8}>
            <FormattedMessage
              id="public.home.hero-subtitle"
              defaultMessage="Parallel collects and organizes the information you need on time so that you can keep focus and stay productive."
            />
          </Text>
          <Text marginTop={4}>
            <FormattedMessage
              id="public.home.hero-process"
              defaultMessage="Turn your document collection into a professional and scalable process."
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
          <Text marginTop={8}>
            <FormattedMessage
              id="public.home.hero-try-now"
              defaultMessage="Try our secure and fast solution to manage documents."
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

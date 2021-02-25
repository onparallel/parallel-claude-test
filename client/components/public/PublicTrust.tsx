import {
  Box,
  Center,
  BoxProps,
  Grid,
  Heading,
  Image,
  Text,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NormalLink } from "../common/Link";
import { PublicContainer } from "./layout/PublicContainer";
import { QuoteIcon } from "@parallel/chakra/icons";

export function PublicTrust(props: BoxProps) {
  const intl = useIntl();
  return (
    <PublicContainer
      wrapper={{
        marginY: { base: 8, md: 12, lg: 20 },
        ...props,
      }}
    >
      <Heading
        as="h2"
        size="xl"
        fontWeight="bold"
        marginBottom={8}
        textAlign="center"
      >
        <FormattedMessage
          id="public.who-trust-us.title"
          defaultMessage="Already trust us"
        />
      </Heading>
      <Grid
        alignItems="flex-end"
        justifyContent="space-evenly"
        templateColumns={{
          base: "minmax(auto, 320px)",
          md: "repeat(3, minmax(auto, 320px))",
        }}
        gridGap={8}
      >
        <Center>
          <NormalLink href="https://www.cuatrecasas.com" isExternal>
            <Image
              alt="Cuatrecasas Acelera"
              width="220px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/cuatrecasas.png`}
            />
          </NormalLink>
        </Center>
        <Center>
          <NormalLink
            href="https://es.andersen.com/"
            isExternal
            marginBottom={{ md: "8px" }}
          >
            <Image
              alt="Andersen"
              width="180px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/andersen.png`}
            />
          </NormalLink>
        </Center>
        <Center>
          <NormalLink href="https://prontopiso.com/" isExternal paddingY="13px">
            <Image
              alt="Prontopiso"
              width="200px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/prontopiso.png`}
            />
          </NormalLink>
        </Center>
      </Grid>
      <Heading size="md" fontWeight="normal" textAlign="center" marginTop={16}>
        <FormattedMessage
          id="public.who-trust-us.feedback"
          defaultMessage="and this is what they say..."
        />
      </Heading>
      <Grid
        alignItems="flex-start"
        justifyContent="space-evenly"
        templateColumns={{
          base: "1fr",
          md: "repeat(3, 1fr)",
        }}
        gridGap={10}
        marginTop={8}
      >
        <PublicFeedback
          author="Ana Gamazo"
          position={intl.formatMessage({
            id: "public.who-trust-us.position-1",
            defaultMessage: "Partner",
          })}
        >
          <FormattedMessage
            id="public.who-trust-us.feedback-1"
            defaultMessage="Parallel has been <b>very agile in the execution</b> of our requirements and templates are flexible. Happy with the experience."
            values={{ b: (chunks: any[]) => <Text as="strong">{chunks}</Text> }}
          />
        </PublicFeedback>
        <PublicFeedback
          author="Mireia Sanchez"
          position={intl.formatMessage({
            id: "public.who-trust-us.position-2",
            defaultMessage: "Partners assistant",
          })}
        >
          <Text>
            <FormattedMessage
              id="public.who-trust-us.feedback-2a"
              defaultMessage="It's a very <b>useful, easy-to-use and intuitive</b> platform, for both Cuatrecasas and for our clients."
              values={{
                b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
              }}
            />
          </Text>
          <Text marginTop={2}>
            <FormattedMessage
              id="public.who-trust-us.feedback-2b"
              defaultMessage="When we use Parallel for KYC we <b>save a lot of time</b> in both external and internal communications, and all doubts and comments from our clients are in the same place, so that we can forget about searching things in old email conversations."
              values={{
                b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
              }}
            />
          </Text>
        </PublicFeedback>
        <PublicFeedback
          author="Irene Carrera"
          position={intl.formatMessage({
            id: "public.who-trust-us.position-3",
            defaultMessage: "AML analyst",
          })}
        >
          <FormattedMessage
            id="public.who-trust-us.feedback-3"
            defaultMessage="Reviewing documents from our clients is <b>twice as fast</b> than it was. It is mainly due to the ease of access to the documents and the information provided in the forms."
            values={{
              b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
            }}
          />
        </PublicFeedback>
      </Grid>
    </PublicContainer>
  );
}

function PublicFeedback({
  author,
  position: employer,
  children,
}: {
  author: string;
  position: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <QuoteIcon fontSize="36px" />
      <Box as="blockquote" marginTop={4}>
        {children}
      </Box>
      <Box marginTop={8} fontWeight="bold" color="purple.600">
        {author}
      </Box>
      <Box marginTop={1} fontSize="sm" color="gray.600">
        {employer}
      </Box>
    </Box>
  );
}

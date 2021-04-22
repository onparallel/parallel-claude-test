import {
  Box,
  BoxProps,
  Grid,
  Heading,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Link } from "../common/Link";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicDataProtection(props: BoxProps) {
  const intl = useIntl();
  return (
    <PublicContainer
      wrapper={{
        paddingY: 16,
        marginY: { base: 8, md: 12, lg: 20 },
        backgroundColor: "gray.75",
        ...props,
      }}
    >
      <Grid
        justifyContent="space-evenly"
        gridGap={6}
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
        }}
      >
        <Stack spacing={6}>
          <Heading as="h2" size="xl">
            <FormattedMessage
              id="public.data-protection.title"
              defaultMessage="We protect your clients' data"
            />
          </Heading>
          <Text>
            <FormattedMessage
              id="public.data-protection.description"
              defaultMessage="Parallel follows <b>ISO/IEC 27001 practices</b> on Information Security Management System and the principles of privacy and security by design."
              values={{
                b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
              }}
            />
          </Text>
          <Link href="/security" fontWeight="bold">
            <FormattedMessage
              id="public.data-protection.security-link"
              defaultMessage="More information"
            />
          </Link>
        </Stack>
        <Stack
          justifyContent="space-evenly"
          alignItems="center"
          spacing={16}
          marginY={8}
          direction={{ base: "column", md: "row" }}
        >
          <Box>
            <Image
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/powered-by-aws.png`}
              width="126px"
              alt={intl.formatMessage({
                id: "public.powered-by-aws",
                defaultMessage: "Powered by AWS Cloud Computing",
              })}
            />
          </Box>
          <Box>
            <Image
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/gdpr.png`}
              width="214px"
              alt={intl.formatMessage({
                id: "public.gdpr-compliant",
                defaultMessage: "GDPR compliant",
              })}
            />
          </Box>
        </Stack>
      </Grid>
    </PublicContainer>
  );
}

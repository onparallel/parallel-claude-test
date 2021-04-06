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
import { FormattedMessage } from "react-intl";
import { Link } from "../common/Link";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicDataProtection(props: BoxProps) {
  return (
    <PublicContainer
      wrapper={{
        paddingY: 16,
        marginY: { base: 8, md: 12, lg: 20 },
        backgroundColor: "#FAFDFF",
        ...props,
      }}
    >
      <Grid
        marginTop={16}
        justifyContent="space-evenly"
        gridGap={6}
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          //lg: "repeat(3, 1fr)",
        }}
      >
        <Box>
          <Heading as="h2" size="xl" fontWeight="bold" marginBottom={8}>
            <FormattedMessage
              id="public.data-protection.title"
              defaultMessage="We protect your clients' data"
            />
          </Heading>
          <Text marginBottom={6}>
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
        </Box>
        <Stack
          justifyContent="space-evenly"
          alignItems="center"
          spacing={16}
          marginY={8}
          direction={{ base: "column", md: "row" }}
        >
          <Box>
            <Image
              src="https://d0.awsstatic.com/logos/powered-by-aws.png"
              width="126px"
              alt="Powered by AWS Cloud Computing"
            />
          </Box>
          <Box>
            <Image
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/gdpr.png`}
              width="214px"
              alt="Powered by AWS Cloud Computing"
            />
          </Box>
        </Stack>
      </Grid>
    </PublicContainer>
  );
}

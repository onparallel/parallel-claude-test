import { Box, Flex, Grid, Icon, Stack, Text } from "@chakra-ui/core";
import { Card, CardProps } from "@parallel/components/common/Card";
import { Logo } from "@parallel/components/common/Logo";
import { RecipientViewSenderCard_PublicUserFragment } from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { useIntl } from "react-intl";

export function RecipientViewSenderCard({
  sender,
  ...props
}: Omit<CardProps, "children"> & {
  sender: RecipientViewSenderCard_PublicUserFragment;
}) {
  const intl = useIntl();
  return (
    <Card padding={6} {...props}>
      <Stack>
        <Box alignSelf="center">
          <Logo width={156} />
        </Box>
        <Box marginTop={4}>
          <Grid
            as="dl"
            templateColumns="16px 1fr"
            templateRows="repeat(3, 1fr)"
            columnGap={2}
            rowGap={2}
          >
            <Flex as="dt" alignItems="center">
              <Icon
                name="business"
                size="16px"
                aria-label={intl.formatMessage({
                  id: "sendout.organization",
                  defaultMessage: "Business",
                })}
              />
            </Flex>
            <Box as="dd">
              <Text as="span">{sender.organization.name}</Text>
            </Box>
            <Flex as="dt" alignItems="center">
              <Icon
                name="user"
                size="16px"
                aria-label={intl.formatMessage({
                  id: "sendout.sender",
                  defaultMessage: "Sender",
                })}
              />
            </Flex>
            <Box as="dd">
              <Text as="span">{sender.fullName}</Text>
            </Box>
            <Flex as="dt" alignItems="center">
              <Icon
                name="email"
                size="16px"
                aria-label={intl.formatMessage({
                  id: "sendout.sender-email",
                  defaultMessage: "Sender email",
                })}
              />
            </Flex>
            <Box as="dd">
              <Text as="span">{sender.email}</Text>
            </Box>
          </Grid>
        </Box>
      </Stack>
    </Card>
  );
}

RecipientViewSenderCard.fragments = {
  PublicUser: gql`
    fragment RecipientViewSenderCard_PublicUser on PublicUser {
      id
      firstName
      fullName
      email
      organization {
        name
      }
    }
  `,
};

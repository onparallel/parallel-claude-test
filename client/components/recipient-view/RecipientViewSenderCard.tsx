import { gql } from "@apollo/client";
import { Box, Flex, Grid, Image, Text } from "@chakra-ui/core";
import { BusinessIcon, EmailIcon, UserIcon } from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { Logo } from "@parallel/components/common/Logo";
import { RecipientViewSenderCard_PublicUserFragment } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";

export function RecipientViewSenderCard({
  sender,
  ...props
}: ExtendChakra<{
  sender: RecipientViewSenderCard_PublicUserFragment;
}>) {
  const intl = useIntl();

  return (
    <Card padding={6} {...props}>
      <Flex justifyContent="center">
        {sender.organization.logoUrl ? (
          <Box
            role="img"
            aria-label={sender.organization.name}
            width="200px"
            margin="auto"
            height="60px"
            backgroundImage={`url("${sender.organization.logoUrl}")`}
            backgroundSize="contain"
            backgroundPosition="center"
            backgroundRepeat="no-repeat"
          />
        ) : (
          <Logo width="152px" />
        )}
      </Flex>
      <Box marginTop={4}>
        <Grid
          as="dl"
          templateColumns="16px 1fr"
          templateRows="repeat(3, 1fr)"
          columnGap={2}
          rowGap={2}
        >
          {sender.organization.identifier.match(/(^none$|.@.)/) ? null : (
            <>
              <Flex as="dt" alignItems="center">
                <BusinessIcon
                  boxSize="16px"
                  aria-label={intl.formatMessage({
                    id: "recipient-view.organization",
                    defaultMessage: "Business",
                  })}
                />
              </Flex>
              <Box as="dd">
                <Text as="span">{sender.organization.name}</Text>
              </Box>
            </>
          )}
          <Flex as="dt" alignItems="center">
            <UserIcon
              boxSize="16px"
              aria-label={intl.formatMessage({
                id: "recipient-view.sender",
                defaultMessage: "Sender",
              })}
            />
          </Flex>
          <Box as="dd">
            <Text as="span">{sender.fullName}</Text>
          </Box>
          <Flex as="dt" alignItems="center">
            <EmailIcon
              boxSize="16px"
              aria-label={intl.formatMessage({
                id: "recipient-view.sender-email",
                defaultMessage: "Sender email",
              })}
            />
          </Flex>
          <Box as="dd">
            <Text as="span">{sender.email}</Text>
          </Box>
        </Grid>
      </Box>
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
        identifier
        logoUrl
      }
    }
  `,
};

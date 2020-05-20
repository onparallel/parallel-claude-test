import { Box, Flex, Grid, Icon, Stack, Text, Image } from "@chakra-ui/core";
import { Card, CardProps } from "@parallel/components/common/Card";
import { Logo } from "@parallel/components/common/Logo";
import { RecipientViewSenderCard_PublicUserFragment } from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { useIntl } from "react-intl";

function OrganizationLogo({
  name,
  identifier,
  width,
}: {
  name: string;
  identifier: string;
  width: number;
}) {
  let src = "";

  switch (identifier) {
    case "doctoralia":
      src = "/static/logos/doctoralia.png";
      break;
    case "l4law":
      src = "/static/logos/l4law.png";
      break;
    case "cecamagan":
      src = "/static/logos/cecamagan_social_dist.png";
      break;
    case "encomenda":
      src = "/static/logos/encomenda.png";
      break;
    case "cuatrecasas":
      src = "/static/logos/cuatrecasas.png";
      break;
    default:
      return <Logo width={width} />;
  }

  return <Image src={src} alt={name} width={width} />;
}

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
          <OrganizationLogo
            name={sender.organization.name}
            identifier={sender.organization.identifier}
            width={156}
          />
        </Box>
        <Box marginTop={4}>
          <Grid
            as="dl"
            templateColumns="16px 1fr"
            templateRows="repeat(3, 1fr)"
            columnGap={2}
            rowGap={2}
          >
            {sender.organization.identifier === "none" ? null : (
              <>
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
              </>
            )}
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
        identifier
      }
    }
  `,
};

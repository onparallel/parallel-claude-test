import { gql } from "@apollo/client";
import {
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  Progress,
  Stack,
  Text,
  VisuallyHidden,
} from "@chakra-ui/react";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useOrganizationUsageQuery } from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/assertQuery";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { FormattedMessage, useIntl } from "react-intl";

function OrganizationUsage() {
  const intl = useIntl();

  const {
    data: { me },
  } = useAssertQueryOrPreviousData(useOrganizationUsageQuery());

  const sections = useOrganizationSections(me);

  const { organization } = me;

  const {
    userCount,
    usageLimits: { petitions, users },
  } = organization;

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "organization.usage.title",
        defaultMessage: "Usage",
      })}
      basePath="/app/organization"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage id="view.organization.title" defaultMessage="Organization" />
      }
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="organization.usage.title" defaultMessage="Usage" />
        </Heading>
      }
    >
      <Box padding={8} width="100%">
        <Grid
          templateColumns={{
            lg: "repeat(3, 1fr)",
            xl: "repeat(4, 1fr)",
          }}
          gap={6}
        >
          <UsageCard
            title={intl.formatMessage({
              id: "organizations.header.user-count",
              defaultMessage: "Users",
            })}
            usage={userCount}
            limit={users.limit}
          />
          <UsageCard
            title={intl.formatMessage({
              id: "generic.petition-type-plural",
              defaultMessage: "Petitions",
            })}
            usage={petitions.used}
            limit={petitions.limit}
          />
        </Grid>
      </Box>
    </SettingsLayout>
  );
}

function UsageCard({ title, limit, usage }: { title: string; limit: number; usage: number }) {
  return (
    <Flex direction="column" shadow="md" rounded="md" overflow="hidden" background="white">
      <VisuallyHidden>
        <FormattedMessage
          id="organization-usage.visually-hidden.usage-description"
          defaultMessage="{usage} out of {limit} {title} used"
          values={{
            usage,
            limit,
            title,
          }}
        />
      </VisuallyHidden>
      <Stack as="dl" padding={4} margin={0}>
        <Text as="dt" fontSize="sm" fontWeight="medium" color="gay.500">
          {title}
        </Text>
        <HStack as="dd" align="center" fontWeight="bold">
          <Text as="span" fontSize="2xl">
            {usage}
          </Text>
          <HStack align="center" color="gray.500" fontWeight="semibold">
            <Text as="span" aria-hidden="true">
              /
            </Text>
            <VisuallyHidden>
              <FormattedMessage
                id="organization-usage.visually-hidden.out-of"
                defaultMessage="out of"
              />
            </VisuallyHidden>
            <Text as="span">{limit}</Text>
          </HStack>
        </HStack>
      </Stack>
      <Progress height="0.3rem" value={(usage / limit) * 100} />
    </Flex>
  );
}

OrganizationUsage.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(
    gql`
      query OrganizationUsage {
        me {
          ...SettingsLayout_User
          organization {
            id
            userCount
            usageLimits {
              users {
                limit
              }
              petitions {
                used
                limit
              }
            }
          }
        }
      }
      ${SettingsLayout.fragments.User}
    `
  );
};

export default withApolloData(OrganizationUsage);

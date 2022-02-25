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
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withAdminOrganizationRole } from "@parallel/components/common/withAdminOrganizationRole";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { OrganizationUsage_userDocument } from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";

function OrganizationUsage() {
  const intl = useIntl();

  const {
    data: { me },
  } = useAssertQueryOrPreviousData(OrganizationUsage_userDocument);

  const sections = useOrganizationSections(me);

  const { organization } = me;

  const {
    activeUserCount,
    usageLimits: { petitions, users, signatures },
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
              id: "page.usage.users",
              defaultMessage: "Users",
            })}
            usage={activeUserCount}
            limit={users.limit}
          />
          <UsageCard
            title={intl.formatMessage({
              id: "page.usage.petitions",
              defaultMessage: "Petitions",
            })}
            usage={petitions.used}
            limit={petitions.limit}
          />
          {/* <UsageCard
            title={intl.formatMessage({
              id: "page.usage.signatures",
              defaultMessage: "Signatures",
            })}
            usage={signatures.used}
            limit={signatures.limit}
          /> */}
        </Grid>
      </Box>
    </SettingsLayout>
  );
}

function UsageCard({ title, limit, usage }: { title: string; limit: number; usage: number }) {
  return (
    <Flex direction="column" shadow="md" rounded="md" overflow="hidden" background="white">
      <Stack as="dl" padding={4} margin={0}>
        <Text as="dt" fontSize="sm" fontWeight="medium" color="gay.500">
          {title}
        </Text>
        <HStack as="dd" align="center" fontWeight="bold">
          <Text as="span" fontSize="2xl">
            <FormattedNumber value={usage} />
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
            <Text as="span">
              <FormattedNumber value={limit} />
            </Text>
          </HStack>
        </HStack>
      </Stack>
      <Progress height="0.3rem" value={(usage / limit) * 100} />
    </Flex>
  );
}

OrganizationUsage.queries = [
  gql`
    query OrganizationUsage_user {
      me {
        ...SettingsLayout_User
        organization {
          id
          activeUserCount
          usageLimits {
            users {
              limit
            }
            petitions {
              used
              limit
            }
            signatures {
              used
              limit
            }
          }
        }
      }
    }
    ${SettingsLayout.fragments.User}
  `,
];

OrganizationUsage.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationUsage_userDocument);
};

export default compose(withDialogs, withAdminOrganizationRole, withApolloData)(OrganizationUsage);

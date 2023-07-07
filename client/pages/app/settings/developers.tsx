import { gql } from "@apollo/client";
import { Divider, Heading, Stack } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { UserSettingsLayout } from "@parallel/components/layout/UserSettingsLayout";
import { ApiTokensTable } from "@parallel/components/settings/developers/ApiTokensTable";
import { WebhookSubscriptionsTable } from "@parallel/components/settings/developers/WebhookSubscriptionsTable";
import {
  Developers_subscriptionsDocument,
  Developers_tokensDocument,
  Developers_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FormattedMessage, useIntl } from "react-intl";

function Developers() {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQuery(Developers_userDocument);
  const {
    data: {
      me: { tokens },
    },
    refetch: refetchTokens,
  } = useAssertQuery(Developers_tokensDocument);
  const {
    data: { subscriptions },
    refetch: refetchSubscriptions,
  } = useAssertQuery(Developers_subscriptionsDocument);

  return (
    <UserSettingsLayout
      title={intl.formatMessage({
        id: "settings.developers",
        defaultMessage: "Developers",
      })}
      me={me}
      realMe={realMe}
      header={
        <Heading as="h2" size="md">
          <FormattedMessage id="settings.developers" defaultMessage="Developers" />
        </Heading>
      }
    >
      <Stack padding={6} spacing={4} width="100%" paddingBottom={16}>
        <ApiTokensTable tokens={tokens} onRefetch={() => refetchTokens()} />
        <Divider borderColor="gray.300" />
        <WebhookSubscriptionsTable
          subscriptions={subscriptions}
          onRefetch={() => refetchSubscriptions()}
        />
      </Stack>
    </UserSettingsLayout>
  );
}

Developers.queries = [
  gql`
    query Developers_tokens {
      me {
        id
        tokens {
          ...ApiTokensTable_UserAuthenticationToken
        }
      }
    }
    ${ApiTokensTable.fragments.UserAuthenticationToken}
  `,
  gql`
    query Developers_subscriptions {
      subscriptions {
        ...WebhookSubscriptionsTable_PetitionEventSubscription
      }
    }
    ${WebhookSubscriptionsTable.fragments.PetitionEventSubscription}
  `,
  gql`
    query Developers_user {
      ...UserSettingsLayout_Query
    }
    ${UserSettingsLayout.fragments.Query}
  `,
];

Developers.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery(Developers_userDocument),
    fetchQuery(Developers_tokensDocument),
    fetchQuery(Developers_subscriptionsDocument),
  ]);
};

export default compose(
  withDialogs,
  withFeatureFlag("DEVELOPER_ACCESS", "/app/organization"),
  withApolloData,
)(Developers);

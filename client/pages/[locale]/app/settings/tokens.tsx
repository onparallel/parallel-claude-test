import { gql } from "@apollo/client";
import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { CopyToClipboardButton } from "@parallel/components/common/CopyToClipboardButton";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useDeleteAccessTokenDialog } from "@parallel/components/settings/DeleteAccessTokenDialog";
import { useGenerateNewTokenDialog } from "@parallel/components/settings/GenerateNewTokenDialog";
import { useRevokeAllAccessTokensDialog } from "@parallel/components/settings/RevokeAllAccessTokensDialog";
import {
  TokensQuery,
  Tokens_UserAuthenticationTokenFragment,
  useGenerateUserAuthTokenMutation,
  useRevokeUserAuthTokenMutation,
  useTokensQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useSettingsSections } from "@parallel/utils/useSettingsSections";
import { useState } from "react";
import { FormattedDate, FormattedMessage, useIntl } from "react-intl";

function Tokens() {
  const intl = useIntl();
  const {
    data: { me },
    refetch,
  } = assertQuery(useTokensQuery());
  const sections = useSettingsSections();

  const authTokens = me.authenticationTokens;

  const showRevokeAllTokensDialog = useRevokeAllAccessTokensDialog();
  const [revokeTokens] = useRevokeUserAuthTokenMutation();
  const handleRevokeAllTokens = async () => {
    try {
      await showRevokeAllTokensDialog({});
      await revokeTokens({
        variables: {
          authTokenIds: authTokens.map((t) => t.id),
        },
      });
      await handleTokenRevoked();
    } catch {}
  };

  const handleTokenRevoked = async () => {
    await refetch();
    setApiKey("");
  };

  const [apiKey, setApiKey] = useState("");
  const showGenerateNewTokenDialog = useGenerateNewTokenDialog();
  const [generateToken] = useGenerateUserAuthTokenMutation();
  const handleGenerateNewToken = async () => {
    try {
      const tokenName = await showGenerateNewTokenDialog({
        usedTokenNames: authTokens.map((t) => t.tokenName),
      });
      const { data } = await generateToken({
        variables: { tokenName },
      });
      await refetch();
      setApiKey(data!.generateUserAuthToken.apiKey);
    } catch {}
  };

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "settings.api-tokens",
        defaultMessage: "Personal access tokens",
      })}
      basePath="/app/settings"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage id="settings.title" defaultMessage="Settings" />
      }
      header={
        <FormattedMessage
          id="settings.api-tokens"
          defaultMessage="Personal access tokens"
        />
      }
    >
      <Box padding={4}>
        <Text marginBottom={2}>
          <FormattedMessage
            id="settings.api-tokens.explainer"
            defaultMessage="Personal Access Tokens can be used to access the Parallel API."
          />
        </Text>
        <Flex marginBottom={2}>
          <Button
            colorScheme="purple"
            onClick={handleGenerateNewToken}
            marginRight={2}
          >
            <FormattedMessage
              id="settings.api-tokens.generate-new-token"
              defaultMessage="Generate new token"
            />
          </Button>
          {authTokens.length > 0 && (
            <Button onClick={handleRevokeAllTokens}>
              <Text color="red.500">
                <FormattedMessage
                  id="settings.api-tokens.revoke-all"
                  defaultMessage="Revoke all"
                />
              </Text>
            </Button>
          )}
        </Flex>
        <Stack maxWidth="450px">
          {apiKey && (
            <Card bgColor="green.100" padding={2}>
              <FormattedMessage
                id="settings.api-tokens.make-sure-to-copy.card"
                defaultMessage="Make sure to copy your new personal access token now. You won’t be able to see it again."
              />
            </Card>
          )}
          {authTokens.map((token, i) => (
            <AccessTokenCard
              key={token.id}
              apiKey={i === 0 ? apiKey : undefined}
              accessToken={token}
              onTokenRevoked={handleTokenRevoked}
            />
          ))}
        </Stack>
      </Box>
    </SettingsLayout>
  );
}

function AccessTokenCard({
  apiKey,
  accessToken,
  onTokenRevoked,
}: {
  apiKey?: string;
  accessToken: Tokens_UserAuthenticationTokenFragment;
  onTokenRevoked: () => void;
}) {
  const showConfirmDeleteTokenDialog = useDeleteAccessTokenDialog();

  const [revokeToken] = useRevokeUserAuthTokenMutation();

  const handleDeleteToken = async () => {
    try {
      await showConfirmDeleteTokenDialog({});
      await revokeToken({
        variables: {
          authTokenIds: [accessToken.id],
        },
      });
      await onTokenRevoked();
    } catch {}
  };

  return (
    <Card padding={2}>
      <Stack>
        <Flex justifyContent="space-between">
          <Text fontWeight="bold" wordBreak="break-all" flex={0.9}>
            {accessToken.tokenName}
          </Text>
          <Button size="sm" colorScheme="red" onClick={handleDeleteToken}>
            <FormattedMessage id="generic.delete" defaultMessage="Delete" />
          </Button>
        </Flex>
        {apiKey && (
          <Text fontFamily="monospace" wordBreak="break-all">
            <CheckIcon color="green.600" marginRight={1} />
            {apiKey}
            <CopyToClipboardButton size="xs" text={apiKey} marginLeft={1} />
          </Text>
        )}
        <Text fontSize="sm">
          <FormattedMessage
            id="generic.created-at"
            defaultMessage="Created at"
          />
          :&nbsp;
          <FormattedDate value={accessToken.createdAt} {...FORMATS.LL} />
        </Text>
      </Stack>
    </Card>
  );
}

Tokens.fragments = {
  UserAuthenticationToken: gql`
    fragment Tokens_UserAuthenticationToken on UserAuthenticationToken {
      id
      tokenName
      createdAt
    }
  `,
};

Tokens.mutations = [
  gql`
    mutation RevokeUserAuthToken($authTokenIds: [GID!]!) {
      revokeUserAuthToken(authTokenIds: $authTokenIds)
    }
  `,
  gql`
    mutation GenerateUserAuthToken($tokenName: String!) {
      generateUserAuthToken(tokenName: $tokenName) {
        apiKey
        userAuthToken {
          ...Tokens_UserAuthenticationToken
        }
      }
    }
    ${Tokens.fragments.UserAuthenticationToken}
  `,
];

Tokens.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery<TokensQuery>(gql`
    query Tokens {
      me {
        id
        ...SettingsLayout_User
        authenticationTokens {
          ...Tokens_UserAuthenticationToken
        }
      }
    }
    ${SettingsLayout.fragments.User}
    ${Tokens.fragments.UserAuthenticationToken}
  `);
};

export default compose(withDialogs, withApolloData)(Tokens);

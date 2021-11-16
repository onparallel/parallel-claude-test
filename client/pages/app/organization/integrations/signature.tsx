import { ApolloQueryResult } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Center,
  Heading,
  HStack,
  IconButton,
  Spacer,
  Stack,
  Text,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { DeleteIcon, RepeatIcon, StarIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useAddSignatureAPIKeyDialog } from "@parallel/components/organization/AddSignatureAPIKeyDialog";
import { useDeleteSignatureErrorConfirmationDialog } from "@parallel/components/organization/DeleteSignatureErrorConfirmationDialog";
import { useDeleteSignatureTokenDialog } from "@parallel/components/organization/DeleteSignatureTokenDialog";
import {
  Exact,
  IntegrationsSignatureQuery,
  useIntegrationsSignatureQuery,
  useIntegrationsSignature_createSignatureIntegrationMutation,
  useIntegrationsSignature_deleteSignatureIntegrationMutation,
  useIntegrationsSignature_markSignatureIntegrationAsDefaultMutation,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/assertQuery";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { compose } from "@parallel/utils/compose";
import { integer, parseQuery, useQueryState, values } from "@parallel/utils/queryState";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import gql from "graphql-tag";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
};

function IntegrationsSignature() {
  const intl = useIntl();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const toast = useToast();
  const {
    data: { me },
    loading,
    refetch,
  } = useAssertQueryOrPreviousData(
    useIntegrationsSignatureQuery({
      variables: {
        offset: state.items * (state.page - 1),
        limit: state.items,
      },
    })
  );

  const sections = useOrganizationSections(me);

  const columns = useSignatureTokensTableColumns({
    refetch,
    hasSignature: me.hasPetitionSignature,
    numberOfTokens: me.organization.signatureIntegrations.totalCount,
  });

  const addSignaturitAPIKey = useAddSignatureAPIKeyDialog();

  const [createSignatureIntegration] =
    useIntegrationsSignature_createSignatureIntegrationMutation();

  const genericErrorToast = useGenericErrorToast();

  const handleAddSignatureToken = async () => {
    try {
      const data = await addSignaturitAPIKey({});

      await createSignatureIntegration({
        variables: data,
      });

      refetch();
    } catch (error) {
      if (isApolloError(error)) {
        console.log("error: ", error.graphQLErrors[0]?.extensions?.code);
        if (error.graphQLErrors[0]?.extensions?.code === "INVALID_APIKEY_ERROR") {
          toast({
            title: intl.formatMessage({
              id: "page.signature.invalid-apikey-toast-title",
              defaultMessage: "Error",
            }),
            description: intl.formatMessage({
              id: "page.signature.invalid-apikey-toast-description",
              defaultMessage: "Invalid API Key",
            }),
            status: "error",
            isClosable: true,
          });
        } else {
          genericErrorToast();
        }
      }
    }
  };

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "organization.signature-integrations.title",
        defaultMessage: "Signature integrations",
      })}
      basePath="/app/organization/integrations"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage id="view.organization.title" defaultMessage="Organization" />
      }
      header={
        <Heading as="h3" size="md">
          <FormattedMessage
            id="organization.signature-integrations.title"
            defaultMessage="Signature integrations"
          />
        </Heading>
      }
      showBackButton={true}
    >
      <Stack padding={4} spacing={5} flex="1">
        <TablePage
          flex="0 1 auto"
          minHeight={0}
          isHighlightable
          columns={columns}
          rows={me.organization.signatureIntegrations.items}
          rowKeyProp="id"
          loading={loading}
          page={state.page}
          pageSize={state.items}
          totalCount={me.organization.signatureIntegrations.totalCount}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items, page: 1 }))}
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
          header={
            <Stack direction="row" padding={2}>
              <IconButtonWithTooltip
                onClick={() => refetch()}
                icon={<RepeatIcon />}
                placement="bottom"
                variant="outline"
                label={intl.formatMessage({
                  id: "generic.reload-data",
                  defaultMessage: "Reload",
                })}
              />
              <Spacer />
              <Button
                isDisabled={!me.hasPetitionSignature}
                colorScheme="purple"
                onClick={handleAddSignatureToken}
              >
                <FormattedMessage
                  id="organization.signature.add-new-token"
                  defaultMessage="Add token"
                />
              </Button>
            </Stack>
          }
        />
        {!me.hasPetitionSignature ? (
          <Alert status="info" rounded="md">
            <AlertIcon />
            <HStack spacing={8} flex="1">
              <Box flex="1">
                <Text>
                  <FormattedMessage
                    id="page.signature.upgrade-plan-alert-1"
                    defaultMessage="You currently have unlimited trial signatures included in the free plan."
                  />
                </Text>
                <Text>
                  <FormattedMessage
                    id="page.signature.upgrade-plan-alert-2"
                    defaultMessage="<b>Upgrade your plan</b> to access signature integration."
                  />
                </Text>
              </Box>
              <Center>
                <Button
                  as="a"
                  variant="outline"
                  backgroundColor="white"
                  colorScheme="blue"
                  href="mailto:support@onparallel.com"
                >
                  <FormattedMessage id="generic.contact" defaultMessage="Contact" />
                </Button>
              </Center>
            </HStack>
          </Alert>
        ) : null}
      </Stack>
    </SettingsLayout>
  );
}

function useSignatureTokensTableColumns({
  refetch,
  hasSignature,
  numberOfTokens,
}: {
  refetch: (
    variables?:
      | Partial<
          Exact<{
            limit: number;
          }>
        >
      | undefined
  ) => Promise<ApolloQueryResult<IntegrationsSignatureQuery>>;
  hasSignature: boolean;
  numberOfTokens: number;
}): TableColumn<any>[] {
  const intl = useIntl();

  const removeSignatureToken = useDeleteSignatureTokenDialog();
  const confirmRemoveSignatureToken = useDeleteSignatureErrorConfirmationDialog();

  const [deleteSignatureIntegration] =
    useIntegrationsSignature_deleteSignatureIntegrationMutation();

  const handleRemoveToken = async (id: string) => {
    if (numberOfTokens < 2) return;
    try {
      await removeSignatureToken({});

      await deleteSignatureIntegration({
        variables: {
          id,
        },
      });
    } catch (error) {
      if (
        isApolloError(error) &&
        error.graphQLErrors[0]?.extensions?.code === "SIGNATURE_INTEGRATION_IN_USE_ERROR"
      ) {
        try {
          await confirmRemoveSignatureToken({
            pendingSignaturesCount: error.graphQLErrors[0]?.extensions?.pendingSignaturesCount,
          });
          await deleteSignatureIntegration({
            variables: {
              id,
              force: true,
            },
          });
        } catch {}
      }
    }
    refetch();
  };

  const [markIntegrationAsDefault] =
    useIntegrationsSignature_markSignatureIntegrationAsDefaultMutation();

  const handleMarkAsDefault = async (id: string) => {
    try {
      await markIntegrationAsDefault({
        variables: {
          id,
        },
      });
      refetch();
    } catch (error) {}
  };

  function capitalize(text: string) {
    return text.charAt(0).toUpperCase().concat(text.slice(1).toLowerCase());
  }

  return useMemo(
    () => [
      {
        key: "name",
        header: intl.formatMessage({
          id: "generic.name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row }) => {
          return (
            <Text as="span" display="inline-flex" whiteSpace="nowrap" alignItems="center">
              {row.name}
            </Text>
          );
        },
      },
      {
        key: "provider",
        header: intl.formatMessage({
          id: "component.signature-tokens-table.provider",
          defaultMessage: "Provider",
        }),
        CellContent: ({ row }) => (
          <Text as="span" display="inline-flex" whiteSpace="nowrap" alignItems="center">
            {capitalize(row.provider)}
          </Text>
        ),
      },
      {
        key: "status",
        header: intl.formatMessage({
          id: "component.signature-tokens-table.environment",
          defaultMessage: "Environment",
        }),
        align: "center",
        CellContent: ({ row }) =>
          row.status === "DEMO" ? (
            <Badge colorScheme="yellow">
              <FormattedMessage id="generic.test-env" defaultMessage="Test" />
            </Badge>
          ) : (
            <Badge colorScheme="green">
              <FormattedMessage id="generic.production-env" defaultMessage="Production" />
            </Badge>
          ),
      },
      {
        key: "isDefault",
        header: "",
        cellProps: {
          width: "1px",
        },
        align: "center",
        CellContent: ({ row }) => (
          <HStack>
            {row.isDefault ? (
              <SmallPopover
                content={intl.formatMessage({
                  id: "component.signature-tokens-table.default-description",
                  defaultMessage:
                    "The default token is the one that will be selected by default when the signature is activated.",
                })}
              >
                <IconButton
                  variant="ghost"
                  aria-label={intl.formatMessage({
                    id: "component.signature-tokens-table.default-token",
                    defaultMessage: "Default token",
                  })}
                  color="purple.600"
                  fill="purple.600"
                  _hover={{}}
                  _active={{}}
                  icon={<StarIcon />}
                  size="sm"
                  fontSize={"16px"}
                />
              </SmallPopover>
            ) : (
              <Tooltip
                label={intl.formatMessage({
                  id: "component.signature-tokens-table.set-as-default",
                  defaultMessage: "Set as default",
                })}
              >
                <IconButton
                  variant="ghost"
                  aria-label={intl.formatMessage({
                    id: "component.signature-tokens-table.set-as-default",
                    defaultMessage: "Set as default",
                  })}
                  color="gray.400"
                  fill="none"
                  _hover={{ color: "gray.500", fill: "gray.100" }}
                  icon={<StarIcon />}
                  size="sm"
                  fontSize={"16px"}
                  onClick={() => handleMarkAsDefault(row.id)}
                  isDisabled={!hasSignature}
                />
              </Tooltip>
            )}

            <IconButton
              aria-label={intl.formatMessage({
                id: "component.signature-tokens-table.delete-token",
                defaultMessage: "Delete token",
              })}
              icon={<DeleteIcon />}
              size="sm"
              fontSize={"16px"}
              onClick={() => handleRemoveToken(row.id)}
              isDisabled={!hasSignature || numberOfTokens === 1}
            />
          </HStack>
        ),
      },
    ],
    [intl.locale, hasSignature, numberOfTokens]
  );
}

IntegrationsSignature.fragments = {
  SignatureOrgIntegration: gql`
    fragment IntegrationsSignature_SignatureOrgIntegration on SignatureOrgIntegration {
      id
      name
      provider
      isDefault
      environment
    }
  `,
};

IntegrationsSignature.mutations = [
  gql`
    mutation IntegrationsSignature_createSignatureIntegration(
      $name: String!
      $provider: SignatureOrgIntegrationProvider!
      $apiKey: String!
      $isDefault: Boolean
    ) {
      createSignatureIntegration(
        name: $name
        provider: $provider
        apiKey: $apiKey
        isDefault: $isDefault
      ) {
        ...IntegrationsSignature_SignatureOrgIntegration
      }
    }
    ${IntegrationsSignature.fragments.SignatureOrgIntegration}
  `,
  gql`
    mutation IntegrationsSignature_markSignatureIntegrationAsDefault($id: GID!) {
      markSignatureIntegrationAsDefault(id: $id) {
        ...IntegrationsSignature_SignatureOrgIntegration
      }
    }
    ${IntegrationsSignature.fragments.SignatureOrgIntegration}
  `,
  gql`
    mutation IntegrationsSignature_deleteSignatureIntegration($id: GID!, $force: Boolean) {
      deleteSignatureIntegration(id: $id, force: $force)
    }
  `,
];

IntegrationsSignature.getInitialProps = async ({
  fetchQuery,
  ...context
}: WithApolloDataContext) => {
  const { items, page } = parseQuery(context.query, QUERY_STATE);

  await fetchQuery<IntegrationsSignatureQuery>(
    gql`
      query IntegrationsSignature($limit: Int!, $offset: Int!) {
        me {
          id
          hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
          ...SettingsLayout_User
          organization {
            id
            signatureIntegrations: integrations(type: SIGNATURE, limit: $limit, offset: $offset) {
              items {
                ... on SignatureOrgIntegration {
                  id
                  name
                  provider
                  isDefault
                  environment
                }
              }
              totalCount
            }
          }
        }
      }
      ${SettingsLayout.fragments.User}
    `,
    {
      variables: {
        offset: items * (page - 1),
        limit: items,
      },
    }
  );
};

export default compose(withDialogs, withApolloData)(IntegrationsSignature);

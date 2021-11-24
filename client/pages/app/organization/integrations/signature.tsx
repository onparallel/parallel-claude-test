import { gql, useMutation } from "@apollo/client";
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
  Image,
  Spacer,
  Stack,
  Text,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { DeleteIcon, RepeatIcon, StarIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useAddSignatureApiKeyDialog } from "@parallel/components/organization/dialogs/AddSignatureApiKeyDialog";
import { useDeleteSignatureErrorConfirmationDialog } from "@parallel/components/organization/dialogs/DeleteSignatureErrorConfirmationDialog";
import { useDeleteSignatureTokenDialog } from "@parallel/components/organization/dialogs/DeleteSignatureTokenDialog";
import {
  IntegrationsSignature_createSignatureIntegrationDocument,
  IntegrationsSignature_deleteSignatureIntegrationDocument,
  IntegrationsSignature_markSignatureIntegrationAsDefaultDocument,
  IntegrationsSignature_SignatureOrgIntegrationFragment,
  IntegrationsSignature_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { assertTypenameArray } from "@parallel/utils/apollo/assertTypename";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { compose } from "@parallel/utils/compose";
import { integer, parseQuery, useQueryState, values } from "@parallel/utils/queryState";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
};

interface SignatureTokensTableContext {
  hasSignature: boolean;
  numberOfIntegrations: number;
  onDeleteIntegration: (id: string) => void;
  onMarkIntegrationAsDefault: (id: string) => void;
}

function IntegrationsSignature() {
  const intl = useIntl();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const toast = useToast();
  const {
    data: { me },
    loading,
    refetch,
  } = useAssertQueryOrPreviousData(IntegrationsSignature_userDocument, {
    variables: {
      offset: state.items * (state.page - 1),
      limit: state.items,
    },
  });
  const { totalCount: numberOfIntegrations, items: integrations } =
    me.organization.signatureIntegrations;
  assertTypenameArray(integrations, "SignatureOrgIntegration");
  const sections = useOrganizationSections(me);
  const columns = useSignatureTokensTableColumns();

  const genericErrorToast = useGenericErrorToast();
  const addSignaturitAPIKey = useAddSignatureApiKeyDialog();
  const [createSignatureIntegration] = useMutation(
    IntegrationsSignature_createSignatureIntegrationDocument
  );
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

  const removeSignatureToken = useDeleteSignatureTokenDialog();
  const confirmRemoveSignatureToken = useDeleteSignatureErrorConfirmationDialog();
  const [deleteSignatureIntegration] = useMutation(
    IntegrationsSignature_deleteSignatureIntegrationDocument
  );
  const handleDeleteIntegration = async (id: string) => {
    if (numberOfIntegrations < 2) return;
    try {
      await removeSignatureToken({});
      await deleteSignatureIntegration({ variables: { id } });
    } catch (error) {
      if (
        isApolloError(error) &&
        error.graphQLErrors[0]?.extensions?.code === "SIGNATURE_INTEGRATION_IN_USE_ERROR"
      ) {
        try {
          await confirmRemoveSignatureToken({
            pendingSignaturesCount: error.graphQLErrors[0]?.extensions?.pendingSignaturesCount,
          });
          await deleteSignatureIntegration({ variables: { id, force: true } });
        } catch {}
      }
    }
    refetch();
  };

  const [markIntegrationAsDefault] = useMutation(
    IntegrationsSignature_markSignatureIntegrationAsDefaultDocument
  );
  const handleMarkIntegrationAsDefault = async (id: string) => {
    try {
      await markIntegrationAsDefault({ variables: { id } });
      refetch();
    } catch (error) {}
  };

  const context = {
    hasSignature: me.hasPetitionSignature,
    numberOfIntegrations,
    onDeleteIntegration: handleDeleteIntegration,
    onMarkIntegrationAsDefault: handleMarkIntegrationAsDefault,
  } as SignatureTokensTableContext;

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
          rows={integrations}
          context={context}
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

function useSignatureTokensTableColumns() {
  const intl = useIntl();
  return useMemo(
    () =>
      [
        {
          key: "name",
          header: intl.formatMessage({
            id: "generic.integration-name",
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
            id: "generic.integration-provider",
            defaultMessage: "Provider",
          }),
          CellContent: ({ row }) =>
            row.provider === "SIGNATURIT" ? (
              <Image
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/signaturit.png`}
                alt="Signaturit"
                maxWidth="80px"
              />
            ) : null,
        },
        {
          key: "environment",
          header: intl.formatMessage({
            id: "generic.signature-environment",
            defaultMessage: "Environment",
          }),
          align: "center",
          CellContent: ({ row }) =>
            row.environment === "DEMO" ? (
              <Badge colorScheme="yellow">
                <FormattedMessage id="generic.signature-demo-environment" defaultMessage="Test" />
              </Badge>
            ) : (
              <Badge colorScheme="green">
                <FormattedMessage
                  id="generic.signature-production-environment"
                  defaultMessage="Production"
                />
              </Badge>
            ),
        },
        {
          key: "actions",
          header: "",
          cellProps: {
            width: "1px",
          },
          align: "center",
          CellContent: ({
            row,
            context: {
              numberOfIntegrations,
              hasSignature,
              onMarkIntegrationAsDefault,
              onDeleteIntegration,
            },
          }) => (
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
                    icon={<StarIcon fontSize="16px" />}
                    size="sm"
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
                    fontSize="16px"
                    onClick={() => onMarkIntegrationAsDefault(row.id)}
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
                onClick={() => onDeleteIntegration(row.id)}
                isDisabled={!hasSignature || numberOfIntegrations === 1}
              />
            </HStack>
          ),
        },
      ] as TableColumn<
        IntegrationsSignature_SignatureOrgIntegrationFragment,
        SignatureTokensTableContext
      >[],
    [intl.locale]
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

IntegrationsSignature.queries = [
  gql`
    query IntegrationsSignature_user($limit: Int!, $offset: Int!) {
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
];

IntegrationsSignature.getInitialProps = async ({
  fetchQuery,
  ...context
}: WithApolloDataContext) => {
  const { items, page } = parseQuery(context.query, QUERY_STATE);
  await fetchQuery(IntegrationsSignature_userDocument, {
    variables: { offset: items * (page - 1), limit: items },
  });
};

export default compose(withDialogs, withApolloData)(IntegrationsSignature);

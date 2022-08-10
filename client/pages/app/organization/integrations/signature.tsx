import { gql, useMutation } from "@apollo/client";
import {
  Badge,
  Button,
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
import { ContactSupportAlert } from "@parallel/components/common/ContactSupportAlert";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withOrgRole } from "@parallel/components/common/withOrgRole";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useAddSignatureCredentialsDialog } from "@parallel/components/organization/dialogs/AddSignatureCredentialsDialog";
import { useDeleteSignatureErrorConfirmationDialog } from "@parallel/components/organization/dialogs/DeleteSignatureErrorConfirmationDialog";
import { useDeleteSignatureTokenDialog } from "@parallel/components/organization/dialogs/DeleteSignatureTokenDialog";
import {
  IntegrationsSignature_createSignaturitIntegrationDocument,
  IntegrationsSignature_deleteSignatureIntegrationDocument,
  IntegrationsSignature_markSignatureIntegrationAsDefaultDocument,
  IntegrationsSignature_SignatureOrgIntegrationFragment,
  IntegrationsSignature_userDocument,
  IntegrationsSignature_validateSignatureCredentialsDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { assertTypenameArray } from "@parallel/utils/apollo/typename";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
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
    data: { me, realMe },
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
  const showAddSignatureCredentialsDialog = useAddSignatureCredentialsDialog();
  const [createSignaturitIntegration] = useMutation(
    IntegrationsSignature_createSignaturitIntegrationDocument
  );
  const [validateSignatureCredentials] = useMutation(
    IntegrationsSignature_validateSignatureCredentialsDocument
  );
  const handleAddSignatureProvider = async () => {
    try {
      const data = await showAddSignatureCredentialsDialog({
        validateCredentials: async (provider, credentials) => {
          const response = await validateSignatureCredentials({
            variables: { provider, credentials },
          });
          return { success: response.data?.validateSignatureCredentials.success ?? false };
        },
      });
      if (data.provider === "SIGNATURIT") {
        await createSignaturitIntegration({
          variables: {
            apiKey: data.credentials.API_KEY,
            isDefault: data.isDefault,
            name: data.name,
          },
        });
        refetch();
      }
    } catch (error) {
      if (isApolloError(error)) {
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
      if (isApolloError(error, "SIGNATURE_INTEGRATION_IN_USE_ERROR")) {
        try {
          await confirmRemoveSignatureToken({
            pendingSignaturesCount: error.graphQLErrors[0].extensions
              .pendingSignaturesCount as number,
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
      me={me}
      realMe={realMe}
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
      <Stack padding={4} spacing={5} flex="1" paddingBottom={16}>
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
          onPageSizeChange={(items) =>
            setQueryState((s) => ({ ...s, items: items as any, page: 1 }))
          }
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort, page: 1 }))}
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
                colorScheme="primary"
                onClick={handleAddSignatureProvider}
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
          <ContactSupportAlert
            body={
              <>
                <Text>
                  <FormattedMessage
                    id="page.signature.upgrade-plan-alert-1"
                    defaultMessage="You currently have unlimited trial signatures included in the free plan."
                  />
                </Text>
                <Text>
                  <FormattedMessage
                    id="page.signature.upgrade-plan-alert-2"
                    defaultMessage="Contact our team to access signature integration."
                  />
                </Text>
              </>
            }
            contactMessage={intl.formatMessage({
              id: "page.signature.upgrade-plan-support-message",
              defaultMessage:
                "Hi, I would like to use eSignatures. Could I have more information, please?",
            })}
          />
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
                    color="primary.600"
                    fill="primary.600"
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
    mutation IntegrationsSignature_validateSignatureCredentials(
      $provider: SignatureOrgIntegrationProvider!
      $credentials: JSONObject!
    ) {
      validateSignatureCredentials(provider: $provider, credentials: $credentials) {
        success
      }
    }
  `,
  gql`
    mutation IntegrationsSignature_createSignaturitIntegration(
      $name: String!
      $apiKey: String!
      $isDefault: Boolean
    ) {
      createSignaturitIntegration(name: $name, apiKey: $apiKey, isDefault: $isDefault) {
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
      ...SettingsLayout_Query
      me {
        id
        hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
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
    ${SettingsLayout.fragments.Query}
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

export default compose(withDialogs, withOrgRole("ADMIN"), withApolloData)(IntegrationsSignature);

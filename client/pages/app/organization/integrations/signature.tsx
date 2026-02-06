import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  Badge,
  Heading,
  HStack,
  IconButton,
  Image,
  Spacer,
  Stack,
  useToast,
} from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { AlertCircleFilledIcon, DeleteIcon, RepeatIcon, StarIcon } from "@parallel/chakra/icons";
import { ContactSupportAlert } from "@parallel/components/common/ContactSupportAlert";
import { isDialogError, withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NormalLink } from "@parallel/components/common/Link";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withPermission } from "@parallel/components/common/withPermission";
import { OrganizationSettingsLayout } from "@parallel/components/layout/OrganizationSettingsLayout";
import { useAddSignatureCredentialsDialog } from "@parallel/components/organization/dialogs/AddSignatureCredentialsDialog";
import { useDeleteSignatureErrorConfirmationDialog } from "@parallel/components/organization/dialogs/DeleteSignatureErrorConfirmationDialog";
import { useDeleteSignatureTokenDialog } from "@parallel/components/organization/dialogs/DeleteSignatureTokenDialog";
import { Button, Text } from "@parallel/components/ui";
import {
  IntegrationsSignature_deleteSignatureIntegrationDocument,
  IntegrationsSignature_markSignatureIntegrationAsDefaultDocument,
  IntegrationsSignature_SignatureOrgIntegrationFragment,
  IntegrationsSignature_userDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { assertTypenameArray } from "@parallel/utils/apollo/typename";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { withError } from "@parallel/utils/promises/withError";
import { integer, parseQuery, useQueryState, values } from "@parallel/utils/queryState";
import { untranslated } from "@parallel/utils/untranslated";
import { useDocusignConsentPopup } from "@parallel/utils/useDocusignConsentPopup";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
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
  onDocusignReauthorize: (
    integration: IntegrationsSignature_SignatureOrgIntegrationFragment,
  ) => Promise<void>;
  refetch: () => Promise<any>;
}

function IntegrationsSignature() {
  const intl = useIntl();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const toast = useToast();
  const {
    data: queryObject,
    loading,
    refetch,
  } = useAssertQueryOrPreviousData(IntegrationsSignature_userDocument, {
    variables: {
      offset: state.items * (state.page - 1),
      limit: state.items,
    },
  });
  const { me } = queryObject;
  const { totalCount: numberOfIntegrations, items: integrations } =
    me.organization.signatureIntegrations;
  assertTypenameArray(integrations, "SignatureOrgIntegration");
  const columns = useSignatureTokensTableColumns();

  const showGenericErrorToast = useGenericErrorToast();
  const showAddSignatureCredentialsDialog = useAddSignatureCredentialsDialog();

  const handleAddSignatureProvider = async () => {
    try {
      await showAddSignatureCredentialsDialog({ user: me });
      toast({
        status: "success",
        title: intl.formatMessage({
          id: "page.signature.provider-added-successfully.toast-title",
          defaultMessage: "Success",
        }),
        description: intl.formatMessage(
          {
            id: "page.signature.provider-added-successfully.toast-description",
            defaultMessage: "{provider} integration created successfully.",
          },
          { provider: "Signaturit" },
        ),
      });
      refetch();
    } catch (error) {
      if (isDialogError(error)) {
        return;
      } else if (isApolloError(error, "INVALID_APIKEY_ERROR")) {
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
        showGenericErrorToast(error);
      }
    }
  };

  const removeSignatureToken = useDeleteSignatureTokenDialog();
  const confirmRemoveSignatureToken = useDeleteSignatureErrorConfirmationDialog();
  const [deleteSignatureIntegration] = useMutation(
    IntegrationsSignature_deleteSignatureIntegrationDocument,
  );
  const [markIntegrationAsDefault] = useMutation(
    IntegrationsSignature_markSignatureIntegrationAsDefaultDocument,
  );
  const showDocusignConsentPopup = useDocusignConsentPopup();

  const context = useMemo<SignatureTokensTableContext>(
    () => ({
      hasSignature: me.hasPetitionSignature,
      numberOfIntegrations,
      refetch,
      async onDeleteIntegration(id) {
        if (numberOfIntegrations < 2) return;
        try {
          await removeSignatureToken();
          await deleteSignatureIntegration({ variables: { id } });
        } catch (error) {
          if (isApolloError(error, "SIGNATURE_INTEGRATION_IN_USE_ERROR")) {
            try {
              await confirmRemoveSignatureToken({
                pendingSignaturesCount: error.errors[0].extensions!
                  .pendingSignaturesCount as number,
              });
              await deleteSignatureIntegration({ variables: { id, force: true } });
            } catch {}
          }
        }
        refetch();
      },
      async onMarkIntegrationAsDefault(id) {
        try {
          await markIntegrationAsDefault({ variables: { id } });
          refetch();
        } catch {}
      },
      async onDocusignReauthorize(integration) {
        const [error] = await withError(
          showDocusignConsentPopup({
            ...integration,
            environment: integration.environment === "DEMO" ? "sandbox" : "production",
          }),
        );
        if (!error) {
          refetch();
          toast({
            status: "success",
            title: intl.formatMessage({
              id: "page.signature.provider-updated-successfully.toast-title",
              defaultMessage: "Success",
            }),
            description: intl.formatMessage(
              {
                id: "page.signature.provider-updated-successfully.toast-description",
                defaultMessage: "{provider} integration updated successfully.",
              },
              { provider: "Docusign" },
            ),
          });
        }
      },
    }),
    [me.hasPetitionSignature, numberOfIntegrations, refetch],
  );

  return (
    <OrganizationSettingsLayout
      title={intl.formatMessage({
        id: "organization.signature-integrations.title",
        defaultMessage: "Signature integrations",
      })}
      basePath="/app/organization/integrations"
      queryObject={queryObject}
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
                disabled={!me.hasPetitionSignature}
                colorPalette="primary"
                onClick={handleAddSignatureProvider}
              >
                <FormattedMessage
                  id="organization.signature.add-new-provider"
                  defaultMessage="Add provider"
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
    </OrganizationSettingsLayout>
  );
}

function useSignatureTokensTableColumns() {
  const intl = useIntl();
  return useMemo(
    () =>
      [
        {
          key: "name",
          label: intl.formatMessage({
            id: "generic.integration-name",
            defaultMessage: "Name",
          }),
          CellContent: ({ row, context: { onDocusignReauthorize } }) => {
            return (
              <>
                {row.invalidCredentials ? (
                  <SmallPopover
                    content={
                      row.provider === "DOCUSIGN" ? (
                        <Text fontSize="sm">
                          <FormattedMessage
                            id="page.signature.consent-required-popover"
                            defaultMessage="<a>Click here</a> to reauthorize your DocuSign integration."
                            values={{
                              a: (chunks: any[]) => (
                                <NormalLink onClick={() => onDocusignReauthorize(row)}>
                                  {chunks}
                                </NormalLink>
                              ),
                            }}
                          />
                        </Text>
                      ) : row.provider === "SIGNATURIT" ? (
                        <Text fontSize="sm">
                          <FormattedMessage
                            id="page.signature.invalid-credentials-popover"
                            defaultMessage="The provided credentials are not valid anymore and need to be updated."
                          />
                        </Text>
                      ) : null
                    }
                  >
                    <AlertCircleFilledIcon color="yellow.500" marginEnd={1} />
                  </SmallPopover>
                ) : null}
                <Text as="span" display="inline-flex" whiteSpace="nowrap" alignItems="center">
                  {row.name}
                </Text>
              </>
            );
          },
        },
        {
          key: "provider",
          label: intl.formatMessage({
            id: "generic.integration-provider",
            defaultMessage: "Provider",
          }),
          CellContent: ({ row }) =>
            row.provider === "SIGNATURIT" ? (
              <Image
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/logos/signaturit.png`}
                alt={untranslated("Signaturit")}
                maxWidth="80px"
              />
            ) : row.provider === "DOCUSIGN" ? (
              <Image
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/logos/docusign.png`}
                alt={untranslated("DocuSign")}
                maxWidth="80px"
              />
            ) : null,
        },
        {
          key: "environment",
          label: intl.formatMessage({
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
          label: "",
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

    [intl.locale],
  );
}

const _fragments = {
  SignatureOrgIntegration: gql`
    fragment IntegrationsSignature_SignatureOrgIntegration on SignatureOrgIntegration {
      id
      name
      provider
      isDefault
      environment
      invalidCredentials
    }
  `,
};

IntegrationsSignature.mutations = [
  gql`
    mutation IntegrationsSignature_markSignatureIntegrationAsDefault($id: GID!) {
      markSignatureIntegrationAsDefault(id: $id) {
        ...IntegrationsSignature_SignatureOrgIntegration
      }
    }
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
      ...OrganizationSettingsLayout_Query
      me {
        id
        hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
        ...useAddSignatureCredentialsDialog_User
        organization {
          id
          signatureIntegrations: integrations(type: SIGNATURE, limit: $limit, offset: $offset) {
            items {
              ... on SignatureOrgIntegration {
                id
                ...IntegrationsSignature_SignatureOrgIntegration
              }
            }
            totalCount
          }
        }
      }
    }
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

export default compose(
  withDialogs,
  withPermission("INTEGRATIONS:CRUD_INTEGRATIONS", { orPath: "/app/organization/integrations" }),
  withApolloData,
)(IntegrationsSignature);

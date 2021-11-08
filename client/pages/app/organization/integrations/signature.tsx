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
} from "@chakra-ui/react";
import { DeleteIcon, RepeatIcon, StarIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useAddSignatureAPIKeyDialog } from "@parallel/components/organization/AddSignatureAPIKeyDialog";
import { useDeleteSignatureErrorConfirmationDialog } from "@parallel/components/organization/DeleteSignatureErrorConfirmationDialog";
import { useDeleteSignatureTokenDialog } from "@parallel/components/organization/DeleteSignatureTokenDialog";
import {
  IntegrationsSignatureQuery,
  useIntegrationsSignatureQuery,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { integer, parseQuery, string, useQueryState, values } from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import gql from "graphql-tag";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  search: string(),
};

function IntegrationsSignature() {
  const intl = useIntl();
  const [state, setQueryState] = useQueryState(QUERY_STATE);

  const {
    data: { me },
    loading,
    refetch,
  } = useAssertQueryOrPreviousData(
    useIntegrationsSignatureQuery({
      variables: {
        limit: state.items,
      },
    })
  );

  console.log("signature me: ", me);
  const sections = useOrganizationSections(me);

  const [search, setSearch] = useState(state.search);
  const debouncedOnSearchChange = useDebouncedCallback(
    (value) => {
      setQueryState((current) => ({
        ...current,
        search: value,
        page: 1,
      }));
    },
    300,
    [setQueryState]
  );

  const handleSearchChange = useCallback(
    (value: string | null) => {
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange]
  );

  const columns = useSignatureTokensTableColumns();

  const addSignaturitAPIKey = useAddSignatureAPIKeyDialog();

  const handleAddSignatureToken = async () => {
    try {
      const data = await addSignaturitAPIKey({});
      console.log("data: ", data);
    } catch {}
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
          header={
            <Stack direction="row" padding={2}>
              <Box flex="0 1 400px">
                <SearchInput
                  value={search ?? ""}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </Box>
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
              <Button isDisabled={false} colorScheme="purple" onClick={handleAddSignatureToken}>
                <FormattedMessage
                  id="organization.signature.add-new-token"
                  defaultMessage="Añadir token"
                />
              </Button>
            </Stack>
          }
        />

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
      </Stack>
    </SettingsLayout>
  );
}

function useSignatureTokensTableColumns(): TableColumn<any>[] {
  const intl = useIntl();

  const removeSignatureToken = useDeleteSignatureTokenDialog();
  const confirmRemoveSignatureToken = useDeleteSignatureErrorConfirmationDialog();

  const handleRemoveToken = async (id: string) => {
    console.log("remove signature: ", id);
    try {
      await removeSignatureToken({});
      await confirmRemoveSignatureToken({});
    } catch {}
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
        header: "PROVIDER",
        CellContent: ({ row }) => (
          <Text as="span" display="inline-flex" whiteSpace="nowrap" alignItems="center">
            {capitalize(row.provider)}
          </Text>
        ),
      },
      {
        key: "status",
        header: "STATE",
        CellContent: ({ row }) =>
          row.status === "DEMO" ? (
            <Badge colorScheme="yellow">TEST</Badge>
          ) : (
            <Badge colorScheme="green">PRODUCTION</Badge>
          ),
      },
      {
        key: "isDefault",
        header: "",
        cellProps: {
          width: "1px",
        },
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
                  aria-label="favorite"
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
                  aria-label="favorite"
                  color="gray.400"
                  fill="none"
                  _hover={{ color: "gray.500", fill: "gray.100" }}
                  icon={<StarIcon />}
                  size="sm"
                  fontSize={"16px"}
                />
              </Tooltip>
            )}

            <IconButton
              aria-label="delete"
              icon={<DeleteIcon />}
              size="sm"
              fontSize={"16px"}
              onClick={() => handleRemoveToken(row.id)}
            />
          </HStack>
        ),
      },
    ],
    [intl.locale]
  );
}

IntegrationsSignature.getInitialProps = async ({
  fetchQuery,
  ...context
}: WithApolloDataContext) => {
  const { items } = parseQuery(context.query, QUERY_STATE);

  await fetchQuery<IntegrationsSignatureQuery>(
    gql`
      query IntegrationsSignature($limit: Int!) {
        me {
          id
          ...SettingsLayout_User
          organization {
            id
            signatureIntegrations: integrations(type: SIGNATURE, limit: $limit) {
              items {
                id
                name
                provider
                isDefault
                status
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
        limit: items,
      },
    }
  );
};

export default compose(withDialogs, withApolloData)(IntegrationsSignature);
